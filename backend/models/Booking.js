/**
 * Booking Model
 * Manages equipment booking requests with double-booking prevention
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    // Backwards-compatible student/equipment fields
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment'
    },

    // New normalized booking fields
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Student is required'] },
    experiment: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment' },
    equipments: [
      {
        equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' },
        quantity: { type: Number, default: 1 }
      }
    ],
    bookingDate: { type: Date, required: [true, 'Booking date is required'] },
    slotTime: {
      type: String,
      required: [true, 'Slot time is required']
    },
    requestedQuantity: {
      type: Number,
      min: [1, 'Requested quantity must be at least 1'],
      max: [50, 'Requested quantity cannot exceed 50'],
      default: 1
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    attendanceStatus: {
      type: String,
      enum: ['pending', 'present', 'absent'],
      default: 'pending'
    },
    attendanceMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    attendanceMarkedAt: Date,
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab'
    },
    groupBooking: { type: Boolean, default: false },
    groupMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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


bookingSchema.virtual('equipment', {
  ref: 'Equipment',
  localField: 'equipmentId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.set('toObject', { virtuals: true });
bookingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
