const { test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

const User = require('../auth/userModel')
const Community = require('../communities/communityModel')
const CommunityMembership = require('../communities/communityMembershipModel')
const { createCommunityPost } = require('../communityPosts/communityPostController')

let mongod

const makeRes = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this },
  json(payload) { this.body = payload; return this }
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

test('accepted community members cannot create posts', async () => {
  const member = await User.create({
    email: 'member@test.com',
    password: 'irrelevant-hash',
    username: 'member',
    firstName: 'Member',
    lastName: 'Tester'
  })

  const creator = await User.create({
    email: 'creator@test.com',
    password: 'irrelevant-hash',
    username: 'creator',
    firstName: 'Creator',
    lastName: 'Tester'
  })

  const community = await Community.create({
    name: 'Test Community',
    createdBy: creator._id
  })

  await CommunityMembership.create({
    user: member._id,
    community: community._id,
    role: 'member',
    membershipStatus: 'accepted'
  })

  const res = makeRes()
  await createCommunityPost(
    {
      params: { id: community._id.toString() },
      user: { _id: member._id },
      body: { title: 'Hello community', body: 'This should work' }
    },
    res
  )

  assert.equal(res.statusCode, 403)
  assert.equal(res.body.error, 'Only community admins or creators can manage posts.')
})
