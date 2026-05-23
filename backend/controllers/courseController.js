const { validationResult } = require('express-validator');
const Course = require('../models/Course');

const getAllCourses = async (req, res) => {
    try {
        const filter = {};
        if (req.query.branch) filter.branch = req.query.branch;
        if (req.query.year) filter.year = Number(req.query.year);
        const courses = await Course.find(filter).populate('lab', 'name branch').sort({ createdAt: -1 });
        res.json({ success: true, count: courses.length, courses });
    } catch (err) {
        console.error('Get courses error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createCourse = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

        const { courseName, branch, year, lab, semester } = req.body;
        const course = await Course.create({ courseName, branch, year, lab, semester, createdBy: req.user._id });
        res.status(201).json({ success: true, message: 'Course created', course });
    } catch (err) {
        console.error('Create course error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getAllCourses, createCourse };