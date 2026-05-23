const express = require('express');
const { body } = require('express-validator');
const { getExperimentsByCourse, createExperiment } = require('../controllers/experimentController');
const { protect, labInchargeOnly } = require('../middleware/authMiddleware');
const router = express.Router();

const expValidation = [body('title').notEmpty().withMessage('Title is required')];

router.get('/course/:courseId', protect, getExperimentsByCourse);
router.post('/', protect, labInchargeOnly, expValidation, createExperiment);

module.exports = router;
