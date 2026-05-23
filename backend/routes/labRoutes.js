/**
 * Lab Routes
 * GET    /api/labs       - List all labs
 * POST   /api/labs       - Create a new lab (Superadmin only)
 * DELETE /api/labs/:id   - Delete a lab (Superadmin only)
 */

const express = require('express');
const { body } = require('express-validator');
const { getAllLabs, createLab, updateLab, deleteLab } = require('../controllers/labController');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const labValidation = [
    body('name').trim().notEmpty().withMessage('Lab name is required')
        .isLength({ min: 2 }).withMessage('Lab name must be at least 2 characters'),
    body('department').trim().notEmpty().withMessage('Department is required')
        .isLength({ min: 2 }).withMessage('Department must be at least 2 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('location').optional().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters')
];

router.get('/', protect, getAllLabs);
router.post('/', protect, superAdminOnly, labValidation, createLab);
router.put('/:id', protect, superAdminOnly, labValidation, updateLab);
router.delete('/:id', protect, superAdminOnly, deleteLab);

module.exports = router;
