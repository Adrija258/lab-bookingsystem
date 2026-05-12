/**
 * Booking Model
 * Manages equipment booking requests with double-booking prevention
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment ID is required']
    },
    date: {
      type: Date,
      required: [true, 'Booking date is required']
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      enum: [
        '08:00-09:00',
        '09:00-10:00',
        '10:00-11:00',
        '11:00-12:00',
        '12:00-13:00',
        '13:00-14:00',
        '14:00-15:00',
        '15:00-16:00',
        '16:00-17:00',
        '17:00-18:00'
      ]
    },
    requestedQuantity: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: [1, 'Requested quantity must be at least 1'],
      max: [15, 'Requested quantity cannot exceed 15'],
      default: 1
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: [300, 'Purpose cannot exceed 300 characters'],
      default: ''
    },
    adminNote: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// ========================
// PREVENT DOUBLE BOOKING
// Unique constraint: same equipment, date, and time slot cannot be booked twice (approved)
// ========================
bookingSchema.index(
  { equipmentId: 1, date: 1, timeSlot: 1 },
  {
    unique: false  // We handle this in controller logic (check approved bookings)
  }
);

// Static method to check if slot is available
bookingSchema.statics.isSlotAvailable = async function (equipmentId, date, timeSlot, excludeBookingId = null) {
  const query = {
    equipmentId,
    date: new Date(date),
    timeSlot,
    status: { $in: ['pending', 'approved'] }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existingBooking = await this.findOne(query);
  return !existingBooking;
};

module.exports = mongoose.model('Booking', bookingSchema);
