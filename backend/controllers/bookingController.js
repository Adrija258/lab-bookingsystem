/**
 * Booking Controller
 * Handles booking creation, management, and approval/rejection
 */

const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');

// ========================
// @route   GET /api/bookings
// @access  Private
// ========================
const getAllBookings = async (req, res) => {
  try {
    let filter = {};

    // Students see only their own bookings
    if (req.user.role === 'student') {
      filter.userId = req.user._id;
    }

    // Optional status filter
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email')
      .populate('equipmentId', 'name category location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   POST /api/bookings
// @access  Private (Student only)
// ========================
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { equipmentId, date, timeSlot, purpose } = req.body;
    const requestedQuantity = Number(req.body.requestedQuantity || 1);

    // Check if equipment exists
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    // Check if equipment is available
    if (!equipment.availability) {
      return res.status(400).json({
        success: false,
        message: 'Equipment is currently unavailable for booking'
      });
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity must be at least 1'
      });
    }

    if (requestedQuantity > 15) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity cannot exceed 15'
      });
    }

    if (requestedQuantity > equipment.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${equipment.quantity} unit${equipment.quantity > 1 ? 's are' : ' is'} available for this instrument`
      });
    }

    // Validate date is not in the past
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for a past date'
      });
    }

    // ========================
    // CHECK DOUBLE BOOKING
    // ========================
    const isAvailable = await Booking.isSlotAvailable(equipmentId, date, timeSlot);
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked for the selected equipment'
      });
    }

    // ========================
    // CHECK INSTRUMENT BOOKING LIMIT (max 15 per instrument)
    // ========================
    const MAX_BOOKINGS_PER_INSTRUMENT = 15;
    const activeBookingCount = await Booking.countDocuments({
      equipmentId,
      status: { $in: ['pending', 'approved'] }
    });

    if (activeBookingCount >= MAX_BOOKINGS_PER_INSTRUMENT) {
      return res.status(400).json({
        success: false,
        message: `This instrument has reached the maximum booking limit of ${MAX_BOOKINGS_PER_INSTRUMENT}. Please try again later.`
      });
    }

    // Check if student already has a booking for the same slot
    const studentConflict = await Booking.findOne({
      userId: req.user._id,
      date: new Date(date),
      timeSlot,
      status: { $in: ['pending', 'approved'] }
    });

    if (studentConflict) {
      return res.status(409).json({
        success: false,
        message: 'You already have a booking for this time slot'
      });
    }

    // Create booking
    const booking = await Booking.create({
      userId: req.user._id,
      equipmentId,
      date: new Date(date),
      timeSlot,
      requestedQuantity,
      purpose: purpose || '',
      status: 'pending'
    });

    await booking.populate('equipmentId', 'name category location');
    await booking.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      booking
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   PUT /api/bookings/:id
// @access  Private (Admin - approve/reject | Student - cancel)
// ========================
const updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Admin can approve/reject
    if (req.user.role === 'admin') {
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Admin can only approve or reject bookings'
        });
      }

      // If approving, check for double booking (another booking might have been approved)
      if (status === 'approved') {
        const isAvailable = await Booking.isSlotAvailable(
          booking.equipmentId,
          booking.date,
          booking.timeSlot,
          booking._id
        );

        if (!isAvailable) {
          return res.status(409).json({
            success: false,
            message: 'Cannot approve: another booking for this slot was already approved'
          });
        }
      }

      booking.status = status;
      booking.adminNote = adminNote || '';
    }
    // Student can cancel their own pending bookings
    else if (req.user.role === 'student') {
      if (status !== 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Students can only cancel bookings'
        });
      }

      if (booking.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this booking'
        });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Can only cancel pending bookings'
        });
      }

      booking.status = 'rejected';
    }

    await booking.save();
    await booking.populate('userId', 'name email');
    await booking.populate('equipmentId', 'name category location');

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking
    });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   GET /api/bookings/stats
// @access  Private (Admin)
// ========================
const getStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const rejectedBookings = await Booking.countDocuments({ status: 'rejected' });
    const totalEquipment = await Equipment.countDocuments();
    const availableEquipment = await Equipment.countDocuments({ availability: true });

    res.json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        totalEquipment,
        availableEquipment
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   GET /api/bookings/count/:equipmentId
// @access  Private
// ========================
const getEquipmentBookingCount = async (req, res) => {
  try {
    const MAX_BOOKINGS_PER_INSTRUMENT = 15;
    const activeCount = await Booking.countDocuments({
      equipmentId: req.params.equipmentId,
      status: { $in: ['pending', 'approved'] }
    });

    res.json({
      success: true,
      equipmentId: req.params.equipmentId,
      activeBookings: activeCount,
      maxBookings: MAX_BOOKINGS_PER_INSTRUMENT,
      remaining: Math.max(0, MAX_BOOKINGS_PER_INSTRUMENT - activeCount)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllBookings,
  createBooking,
  updateBookingStatus,
  getStats,
  getEquipmentBookingCount
};
