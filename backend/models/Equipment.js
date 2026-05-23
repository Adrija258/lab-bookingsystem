/**
 * Equipment Model
 * Represents lab equipment that can be booked
 */

const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Electronics', 'Chemistry', 'Biology', 'Physics', 'Computer', 'Mechanical', 'Other'],
      default: 'Other'
    },
    equipmentName: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    availableQuantity: {
      type: Number
    },
    availability: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'in-use', 'maintenance'],
      default: 'available'
    },
    releasedAt: Date,
    imageUrl: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Lab'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster search
equipmentSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Equipment', equipmentSchema);
