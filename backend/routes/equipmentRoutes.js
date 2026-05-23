/**
 * Equipment Routes
 * GET    /api/equipment       - Get all equipment
 * GET    /api/equipment/:id   - Get single equipment
 * POST   /api/equipment       - Add equipment (Admin)
 * PUT    /api/equipment/:id   - Update equipment (Admin)
 * DELETE /api/equipment/:id   - Delete equipment (Admin)
 */

const express = require('express');
const { body } = require('express-validator');
const {
  getAllEquipment,
  getEquipmentById,
  getReleasedEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const equipmentValidation = [
  body('name').trim().notEmpty().withMessage('Equipment name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required')
    .isIn(['Electronics', 'Chemistry', 'Biology', 'Physics', 'Computer', 'Mechanical', 'Other'])
    .withMessage('Invalid category'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('lab').notEmpty().withMessage('Lab is required').isMongoId().withMessage('Invalid lab id')
];

router.get('/', protect, getAllEquipment);
router.get('/released', protect, adminOnly, getReleasedEquipment);
router.get('/:id', protect, getEquipmentById);
router.post('/', protect, adminOnly, equipmentValidation, createEquipment);
router.put('/:id', protect, adminOnly, equipmentValidation, updateEquipment);
router.delete('/:id', protect, adminOnly, deleteEquipment);

module.exports = router;
