const express = require('express');
const { body } = require('express-validator');
const { getAllCourses, createCourse } = require('../controllers/courseController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

const courseValidation = [body('courseName').notEmpty().withMessage('Course name is required')];

router.get('/', protect, getAllCourses);
router.post('/', protect, adminOnly, courseValidation, createCourse);

module.exports = router;
