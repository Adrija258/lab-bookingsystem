/**
 * Lab Controller
 * CRUD operations for lab facilities
 */

const { validationResult } = require('express-validator');
const Lab = require('../models/Lab');
const Equipment = require('../models/Equipment');

const getAllLabs = async (req, res) => {
    try {
        const labs = await Lab.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, count: labs.length, labs });
    } catch (err) {
        console.error('Get labs error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createLab = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { name, department, description, location } = req.body;

        const lab = await Lab.create({
            name,
            department,
            description: description || '',
            location: location || '',
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, message: 'Lab added successfully', lab });
    } catch (err) {
        console.error('Create lab error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateLab = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const lab = await Lab.findById(req.params.id);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        const { name, department, description, location } = req.body;
        lab.name = name || lab.name;
        lab.department = department || lab.department;
        lab.description = description !== undefined ? description : lab.description;
        lab.location = location !== undefined ? location : lab.location;

        await lab.save();

        res.json({ success: true, message: 'Lab updated successfully', lab });
    } catch (err) {
        console.error('Update lab error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteLab = async (req, res) => {
    try {
        const lab = await Lab.findById(req.params.id);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        const hasEquipment = await Equipment.exists({ lab: req.params.id });
        if (hasEquipment) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete lab while equipment is still assigned to it. Reassign or remove equipment first.'
            });
        }

        await Lab.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Lab deleted successfully' });
    } catch (err) {
        console.error('Delete lab error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getAllLabs, createLab, updateLab, deleteLab };
