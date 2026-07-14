const User = require('../auth/userModel')

// Community tier gate: requires a verified user with paid premium/manager subscription.
// Used after requireAuth; manager_pending is intentionally treated like free.

const requireCommunityCreatorAccess = async (req, res, next) => {
    if (!req.user?._id) {
        return res.status(401).json({ error: 'Authentication required.' })
    }

    try {
        const user = await User.findById(req.user._id).select('subscription accountType')

        if (!user) {
            return res.status(401).json({ error: 'Request is not authorized.' })
        }

        const canCreateCommunity = user.subscription === 'premium' || user.subscription === 'manager'
        if (!canCreateCommunity) {
            return res.status(403).json({ error: 'Only premium users or managers can manage communities.' })
        }

        next()
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = { requireCommunityCreatorAccess }
