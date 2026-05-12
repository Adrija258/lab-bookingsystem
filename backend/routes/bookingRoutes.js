/**
 * Booking Routes
 * GET  /api/bookings         - Get all bookings
 * POST /api/bookings         - Create booking
 * PUT  /api/bookings/:id     - Update booking status
 * GET  /api/bookings/stats   - Get dashboard stats
 * GET  /api/bookings/count/:equipmentId - Get booking count for instrument
 */

const express = require('express');
const { body } = require('express-validator');
const {
  getAllBookings,
  createBooking,
  updateBookingStatus,
  getStats,
  getEquipmentBookingCount
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Booking validation
const bookingValidation = [
  body('equipmentId').notEmpty().withMessage('Equipment is required'),
  body('date').notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('timeSlot').notEmpty().withMessage('Time slot is required'),
  body('requestedQuantity')
    .optional()
    .isInt({ min: 1, max: 15 })
    .withMessage('Quantity must be between 1 and 15')
];

router.get('/stats', protect, adminOnly, getStats);
router.get('/count/:equipmentId', protect, getEquipmentBookingCount);
router.get('/', protect, getAllBookings);
router.post('/', protect, bookingValidation, createBooking);
router.put('/:id', protect, updateBookingStatus);

module.exports = router;
