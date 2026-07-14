const mongoose = require('mongoose')

const ZERO_OBJECT_ID = '000000000000000000000000'

const numericVersion = (activity) => (
    Number.isFinite(activity?.feedVersion) ? activity.feedVersion : 0
)

// Triple cursor catches revoke/restore updates that reuse the same Activity _id.
const encodeFeedCursor = (activity) => {
    const timestamp = new Date(activity?.updatedAt || activity?.createdAt || 0).getTime()
    return `${timestamp}:${numericVersion(activity)}:${activity._id.toString()}`
}

// Empty/invalid clients start "now" so first poll does not replay old activity.
const makeCurrentFeedCursor = () => `${Date.now()}:0:${ZERO_OBJECT_ID}`

// Parses "<updatedAtMs>:<feedVersion>:<_id>"; invalid input falls back to null.
const parseFeedCursor = (cursor) => {
    if (typeof cursor !== 'string') return null

    const [timestamp, version, id] = cursor.split(':')
    if (!timestamp || !version || !id) return null

    const timestampNumber = Number(timestamp)
    const versionNumber = Number(version)
    if (!Number.isFinite(timestampNumber) || !Number.isFinite(versionNumber)) return null
    if (!mongoose.Types.ObjectId.isValid(id)) return null

    return {
        updatedAt: new Date(timestampNumber),
        feedVersion: versionNumber,
        id
    }
}

// Same ordering as the replay sort: updatedAt, then feedVersion, then _id.
const compareFeedCursors = (left, right) => {
    const parsedLeft = parseFeedCursor(left)
    const parsedRight = parseFeedCursor(right)
    if (!parsedLeft && !parsedRight) return 0
    if (!parsedLeft) return -1
    if (!parsedRight) return 1

    const leftTime = parsedLeft.updatedAt.getTime()
    const rightTime = parsedRight.updatedAt.getTime()
    if (leftTime !== rightTime) return leftTime - rightTime
    if (parsedLeft.feedVersion !== parsedRight.feedVersion) {
        return parsedLeft.feedVersion - parsedRight.feedVersion
    }
    return parsedLeft.id.localeCompare(parsedRight.id)
}

// feedVersion 0 also matches legacy docs that do not have the field yet.
const sameVersionQuery = ({ updatedAt, feedVersion, id }) => {
    if (feedVersion === 0) {
        return {
            updatedAt,
            _id: { $gt: id },
            $or: [
                { feedVersion: 0 },
                { feedVersion: { $exists: false } }
            ]
        }
    }

    return {
        updatedAt,
        feedVersion,
        _id: { $gt: id }
    }
}

// Builds the "changed after cursor" $or query matching the compound replay index.
const buildReplayCursorQuery = (cursor) => {
    const parsed = parseFeedCursor(cursor)
    if (parsed) {
        return {
            $or: [
                { updatedAt: { $gt: parsed.updatedAt } },
                { updatedAt: parsed.updatedAt, feedVersion: { $gt: parsed.feedVersion } },
                sameVersionQuery(parsed)
            ]
        }
    }

    // Backward compatibility for older clients that still send a bare activity _id.
    if (mongoose.Types.ObjectId.isValid(cursor)) {
        return { _id: { $gt: cursor } }
    }

    return null
}

module.exports = {
    encodeFeedCursor,
    makeCurrentFeedCursor,
    compareFeedCursors,
    buildReplayCursorQuery
}
