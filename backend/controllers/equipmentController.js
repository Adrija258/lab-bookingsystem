/**
 * Equipment Controller
 * CRUD operations for lab equipment (Admin only for CUD)
 */

const { validationResult } = require('express-validator');
const Equipment = require('../models/Equipment');

// ========================
// @route   GET /api/equipment
// @access  Private (All users)
// ========================
const getAllEquipment = async (req, res) => {
  try {
    const { search, category, availability } = req.query;

    // Build filter object
    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (availability !== undefined && availability !== '') {
      filter.availability = availability === 'true';
    }

    const equipment = await Equipment.find(filter)
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: equipment.length,
      equipment
    });
  } catch (err) {
    console.error('Get equipment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   GET /api/equipment/:id
// @access  Private
// ========================
const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id).populate('addedBy', 'name email');

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    res.json({ success: true, equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   POST /api/equipment
// @access  Private (Admin only)
// ========================
const createEquipment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, description, category, quantity, location, imageUrl } = req.body;

    const equipment = await Equipment.create({
      name,
      description,
      category,
      quantity: quantity || 1,
      location: location || 'Main Lab',
      imageUrl: imageUrl || '',
      availability: true,
      addedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Equipment added successfully',
      equipment
    });
  } catch (err) {
    console.error('Create equipment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   PUT /api/equipment/:id
// @access  Private (Admin only)
// ========================
const updateEquipment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const { name, description, category, quantity, location, availability, imageUrl } = req.body;

    equipment.name = name || equipment.name;
    equipment.description = description || equipment.description;
    equipment.category = category || equipment.category;
    equipment.quantity = quantity !== undefined ? quantity : equipment.quantity;
    equipment.location = location || equipment.location;
    equipment.availability = availability !== undefined ? availability : equipment.availability;
    equipment.imageUrl = imageUrl !== undefined ? imageUrl : equipment.imageUrl;

    await equipment.save();

    res.json({
      success: true,
      message: 'Equipment updated successfully',
      equipment
    });
  } catch (err) {
    console.error('Update equipment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   DELETE /api/equipment/:id
// @access  Private (Admin only)
// ========================
const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    await Equipment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (err) {
    console.error('Delete equipment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
};
