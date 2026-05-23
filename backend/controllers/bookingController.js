/**
 * Booking Controller
 * Handles booking creation, management, and approval/rejection
 */

const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');

const parseBookingStartDate = (date, timeSlot) => {
  const bookingDate = new Date(date);
  const [startTime] = timeSlot.split('-');
  const [hours, minutes] = startTime.split(':').map(Number);
  bookingDate.setHours(hours, minutes, 0, 0);
  return bookingDate;
};

const releaseOverdueBookings = async () => {
  const now = new Date();
  const overdueBookings = await Booking.find({
    status: 'approved',
    attendanceStatus: 'pending'
  }).populate('equipmentId');

  const updates = [];

  overdueBookings.forEach((booking) => {
    const slotStart = parseBookingStartDate(booking.date, booking.timeSlot);
    const graceWindow = new Date(slotStart.getTime() + 10 * 60 * 1000);

    if (now > graceWindow) {
      booking.attendanceStatus = 'absent';
      booking.attendanceMarkedAt = now;
      booking.attendanceMarkedBy = null;

      if (booking.equipmentId) {
        booking.equipmentId.availability = true;
        booking.equipmentId.status = 'available';
        booking.equipmentId.releasedAt = now;
        updates.push(booking.equipmentId.save());
      }

      updates.push(booking.save());
    }
  });

  await Promise.all(updates);
};

// ========================
// @route   GET /api/bookings
// @access  Private
// ========================
const getAllBookings = async (req, res) => {
  try {
    await releaseOverdueBookings();

    let filter = {};

    if (req.user.role === 'student') {
      filter.userId = req.user._id;
    }

    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    if (req.query.attendanceStatus && req.query.attendanceStatus !== 'all') {
      filter.attendanceStatus = req.query.attendanceStatus;
    }

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email')
      .populate('equipmentId', 'name category location status availability')
      .populate('lab', 'name department location')
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
// @route   GET /api/bookings/pending
// @access  Private (Admin)
// ========================
const getPendingAttendance = async (req, res) => {
  try {
    await releaseOverdueBookings();

    const bookings = await Booking.find({
      status: 'approved',
      attendanceStatus: 'pending'
    })
      .populate('userId', 'name email')
      .populate('equipmentId', 'name category location status availability')
      .populate('lab', 'name department location')
      .sort({ date: 1, timeSlot: 1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    console.error('Get pending attendance error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   PATCH /api/bookings/:id/mark-present
// @access  Private (Admin)
// ========================
const markPresentBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('equipmentId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'approved' || booking.attendanceStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only approved bookings with pending attendance can be marked present'
      });
    }

    booking.attendanceStatus = 'present';
    booking.attendanceMarkedBy = req.user._id;
    booking.attendanceMarkedAt = new Date();

    if (booking.equipmentId) {
      booking.equipmentId.availability = false;
      booking.equipmentId.status = 'in-use';
      await booking.equipmentId.save();
    }

    await booking.save();
    await booking
      .populate('userId', 'name email')
      .populate('equipmentId', 'name category location status availability')
      .populate('lab', 'name department location');

    res.json({
      success: true,
      message: 'Attendance marked present',
      booking
    });
  } catch (err) {
    console.error('Mark present error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   PATCH /api/bookings/:id/mark-absent
// @access  Private (Admin)
// ========================
const markAbsentBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('equipmentId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'approved' || booking.attendanceStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only approved bookings with pending attendance can be marked absent'
      });
    }

    booking.attendanceStatus = 'absent';
    booking.attendanceMarkedBy = req.user._id;
    booking.attendanceMarkedAt = new Date();

    if (booking.equipmentId) {
      booking.equipmentId.availability = true;
      booking.equipmentId.status = 'available';
      booking.equipmentId.releasedAt = new Date();
      await booking.equipmentId.save();
    }

    await booking.save();
    await booking
      .populate('userId', 'name email')
      .populate('equipmentId', 'name category location status availability')
      .populate('lab', 'name department location');

    res.json({
      success: true,
      message: 'Attendance marked absent and equipment released',
      booking
    });
  } catch (err) {
    console.error('Mark absent error:', err);
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

    const maxBookingDate = new Date(today);
    maxBookingDate.setDate(maxBookingDate.getDate() + 15);
    if (bookingDate > maxBookingDate) {
      return res.status(400).json({
        success: false,
        message: 'Bookings can only be made within the next 15 days'
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
      lab: equipment.lab,
      purpose: purpose || '',
      status: 'pending'
    });

    await booking.populate('equipmentId', 'name category location status availability');
    await booking.populate('userId', 'name email');
    await booking.populate('lab', 'name department location');

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

    const isAdminUser = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Only approved or rejected are allowed.'
      });
    }

    // Admin / superadmin can approve/reject
    if (isAdminUser) {
      // If approving, verify there is still no conflicting booking
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
      booking.attendanceStatus = status === 'approved' ? 'pending' : 'absent';

      if (!booking.lab) {
        const equipment = await Equipment.findById(booking.equipmentId).select('lab');
        if (equipment?.lab) {
          booking.lab = equipment.lab;
        }
      }
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
  getPendingAttendance,
  markPresentBooking,
  markAbsentBooking,
  createBooking,
  updateBookingStatus,
  getStats,
  getEquipmentBookingCount
};
