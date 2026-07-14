const mongoose = require('mongoose')

const communityPostSchema = new mongoose.Schema({
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
    },
    body: {
        type: String,
        trim: true,
        maxlength: 1200
    },
    imageUrl: {
        type: String,
        trim: true
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        default: null
    },
    eventDate: {
        type: Date,
        default: null
    },
    pinned: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

communityPostSchema.index({ community: 1, pinned: -1, createdAt: -1 })
communityPostSchema.index({ challenge: 1 })

module.exports = mongoose.model('CommunityPost', communityPostSchema)
