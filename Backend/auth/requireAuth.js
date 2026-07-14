// Auth middleware: verifies Bearer JWT, attaches req.user._id, or stops protected requests with 401.
const jwt = require('jsonwebtoken')
const User = require('./userModel')
const config = require('../config')

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token required.' })
    }

    // Header format is "Bearer <token>".
    const token = authorization.split(' ')[1]

    try {
        const { _id } = jwt.verify(token, config.JWT_SECRET)

        // Confirm the signed user still exists; downstream controllers trust
        // req.user._id and only the id is needed here.
        req.user = await User.findOne({ _id }).select('_id')
        if (!req.user) {
            return res.status(401).json({ error: 'Request is not authorized.' })
        }
        next()
    } catch (err) {
        res.status(401).json({ error: 'Request is not authorized.' })
    }
}

module.exports = requireAuth
