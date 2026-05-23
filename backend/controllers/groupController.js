const { validationResult } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');

const createGroup = async (req, res) => {
    try {
        const { leaderId, memberIds, lab } = req.body;

        // basic checks
        const leader = await User.findById(leaderId);
        if (!leader) return res.status(404).json({ success: false, message: 'Leader not found' });

        // ensure members exist and same branch/year as leader
        const members = [];
        if (Array.isArray(memberIds)) {
            for (const id of memberIds) {
                const u = await User.findById(id);
                if (!u) return res.status(404).json({ success: false, message: `Member ${id} not found` });
                if (u.branch !== leader.branch || u.year !== leader.year) {
                    return res.status(400).json({ success: false, message: 'Members must be from same branch and year' });
                }
                members.push(u._id);
            }
        }

        const group = await Group.create({ leader: leader._id, members, lab });
        res.status(201).json({ success: true, message: 'Group created', group });
    } catch (err) {
        console.error('Create group error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { createGroup };
