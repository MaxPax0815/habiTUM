const express = require('express');
const router = express.Router();
const { getManagerOverview, getManagerCommunityStats, getManagerChallengeAdherence } = require('./managerController');
const requireAuth = require('../auth/requireAuth');
const User = require('../auth/userModel');
const { requireCommunityCreatorAccess } = require('../communities/requireCommunityCreatorAccess');

// Role axis: manager dashboards are manager-only — a premium subscription
// passes the tier gate above but must not read manager admin data.
const requireManagerAccount = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('accountType');
        if (user?.accountType !== 'manager') {
            return res.status(403).json({ error: 'Only manager accounts can access the manager dashboard.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

router.use(requireAuth); // auth axis: attaches verified req.user._id
router.use(requireCommunityCreatorAccess); // tier axis: premium/manager subscription only
router.use(requireManagerAccount); // role axis: accountType must be 'manager'

// GET /api/manager/overview
router.get('/overview', getManagerOverview);

// GET /api/manager/communities/:id/stats — summary + challenges for one community
router.get('/communities/:id/stats', getManagerCommunityStats);

// GET /api/manager/challenges/:id/adherence — daily check-in adherence series
router.get('/challenges/:id/adherence', getManagerChallengeAdherence);

module.exports = router;
