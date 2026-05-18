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
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      const selected = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 15);
      if (selected < today) {
        throw new Error('Cannot book for a past date');
      }
      if (selected > maxDate) {
        throw new Error('Bookings can only be made within the next 15 days');
      }
      return true;
    }),
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
