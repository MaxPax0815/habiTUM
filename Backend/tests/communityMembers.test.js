const { test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

const User = require('../auth/userModel')
const Community = require('../communities/communityModel')
const CommunityMembership = require('../communities/communityMembershipModel')
const {
  getCommunityMembers,
  updateCommunityMemberRole
} = require('../communities/communityController')
const { requireChallengeCreatorAccess } = require('../challenges/requireChallengeCreatorAccess')

let mongod

const makeRes = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this },
  json(payload) { this.body = payload; return this }
})

const createUser = (overrides) => User.create({
  email: overrides.email,
  password: 'irrelevant-hash',
  username: overrides.username,
  firstName: overrides.firstName || overrides.username,
  lastName: overrides.lastName || 'Tester'
})

before(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

after(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})))
})

test('creator can promote and demote accepted community members', async () => {
  const creator = await createUser({ email: 'creator@test.com', username: 'creator' })
  const member = await createUser({ email: 'member@test.com', username: 'member' })

  const community = await Community.create({
    name: 'Role Test Community',
    createdBy: creator._id
  })

  await CommunityMembership.create({
    user: creator._id,
    community: community._id,
    role: 'creator',
    membershipStatus: 'accepted'
  })

  const memberMembership = await CommunityMembership.create({
    user: member._id,
    community: community._id,
    role: 'member',
    membershipStatus: 'accepted'
  })

  const promoteRes = makeRes()
  await updateCommunityMemberRole(
    {
      params: { id: community._id.toString(), membershipId: memberMembership._id.toString() },
      user: { _id: creator._id },
      body: { role: 'admin' }
    },
    promoteRes
  )

  assert.equal(promoteRes.statusCode, 200)
  assert.equal(promoteRes.body.role, 'admin')

  const demoteRes = makeRes()
  await updateCommunityMemberRole(
    {
      params: { id: community._id.toString(), membershipId: memberMembership._id.toString() },
      user: { _id: creator._id },
      body: { role: 'member' }
    },
    demoteRes
  )

  assert.equal(demoteRes.statusCode, 200)
  assert.equal(demoteRes.body.role, 'member')
})

test('admins can view members but cannot change roles', async () => {
  const creator = await createUser({ email: 'creator@test.com', username: 'creator' })
  const admin = await createUser({ email: 'admin@test.com', username: 'admin' })
  const member = await createUser({ email: 'member@test.com', username: 'member' })

  const community = await Community.create({
    name: 'Admin Visibility Community',
    createdBy: creator._id
  })

  await CommunityMembership.create({
    user: creator._id,
    community: community._id,
    role: 'creator',
    membershipStatus: 'accepted'
  })

  await CommunityMembership.create({
    user: admin._id,
    community: community._id,
    role: 'admin',
    membershipStatus: 'accepted'
  })

  const memberMembership = await CommunityMembership.create({
    user: member._id,
    community: community._id,
    role: 'member',
    membershipStatus: 'accepted'
  })

  const listRes = makeRes()
  await getCommunityMembers(
    {
      params: { id: community._id.toString() },
      user: { _id: admin._id }
    },
    listRes
  )

  assert.equal(listRes.statusCode, 200)
  assert.equal(listRes.body.members.length, 3)
  assert.equal(listRes.body.canManageRoles, false)

  const roleRes = makeRes()
  await updateCommunityMemberRole(
    {
      params: { id: community._id.toString(), membershipId: memberMembership._id.toString() },
      user: { _id: admin._id },
      body: { role: 'admin' }
    },
    roleRes
  )

  assert.equal(roleRes.statusCode, 403)
  assert.equal(roleRes.body.error, 'Only the community creator can change member roles.')
})

test('creator role cannot be demoted', async () => {
  const creator = await createUser({ email: 'creator@test.com', username: 'creator' })

  const community = await Community.create({
    name: 'Creator Guard Community',
    createdBy: creator._id
  })

  const creatorMembership = await CommunityMembership.create({
    user: creator._id,
    community: community._id,
    role: 'creator',
    membershipStatus: 'accepted'
  })

  const res = makeRes()
  await updateCommunityMemberRole(
    {
      params: { id: community._id.toString(), membershipId: creatorMembership._id.toString() },
      user: { _id: creator._id },
      body: { role: 'member' }
    },
    res
  )

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.error, 'The community creator role cannot be changed.')
})

test('accepted community admins can manage challenges without a personal premium tier', async () => {
  const creator = await createUser({ email: 'creator@test.com', username: 'creator' })
  const admin = await createUser({ email: 'admin@test.com', username: 'admin' })

  const community = await Community.create({
    name: 'Challenge Admin Community',
    createdBy: creator._id
  })

  await CommunityMembership.create({
    user: admin._id,
    community: community._id,
    role: 'admin',
    membershipStatus: 'accepted'
  })

  let nextCalled = false
  const res = makeRes()

  await requireChallengeCreatorAccess(
    {
      user: { _id: admin._id },
      body: { community: community._id.toString() }
    },
    res,
    () => { nextCalled = true }
  )

  assert.equal(nextCalled, true)
  assert.equal(res.statusCode, null)
})
