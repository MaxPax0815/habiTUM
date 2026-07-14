const mongoose = require('mongoose')

const institutionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    emailDomain: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    logoUrl: {
        type: String,
        trim: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Institution', institutionSchema)
