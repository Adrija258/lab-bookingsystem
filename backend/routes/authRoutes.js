/**
 * Auth Routes
 * POST   /api/auth/register
 * POST   /api/auth/login
 * GET    /api/auth/me
 * DELETE /api/auth/me          - Delete own account
 * GET    /api/auth/users       - Admin: list all users
 * DELETE /api/auth/users/:id   - Admin: delete a user
 */

const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, deleteAccount, deleteUserByAdmin, getAllUsers, createUserByAdmin } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['superadmin', 'admin', 'student']).withMessage('Role must be student, admin, or superadmin')
];

// Validation rules for login
const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.delete('/me', protect, deleteAccount);
router.get('/users', protect, adminOnly, getAllUsers);
router.post('/users', protect, adminOnly, registerValidation, createUserByAdmin);
router.delete('/users/:id', protect, adminOnly, deleteUserByAdmin);

module.exports = router;
