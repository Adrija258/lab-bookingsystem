const { validationResult } = require('express-validator');
const Experiment = require('../models/Experiment');

const getExperimentsByCourse = async (req, res) => {
    try {
        const experiments = await Experiment.find({ course: req.params.courseId })
            .populate('requiredEquipments', 'name equipmentName quantity availableQuantity')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: experiments.length, experiments });
    } catch (err) {
        console.error('Get experiments error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createExperiment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

        const { title, description, course, requiredEquipments, lab, branch, year } = req.body;
        const exp = await Experiment.create({ title, description, course, requiredEquipments, lab, branch, year, createdBy: req.user._id });
        res.status(201).json({ success: true, message: 'Experiment created', experiment: exp });
    } catch (err) {
        console.error('Create experiment error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getExperimentsByCourse, createExperiment };