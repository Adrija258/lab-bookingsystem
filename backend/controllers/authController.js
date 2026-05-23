/**
 * Auth Controller
 * Handles user registration, login, and account deletion
 */

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// ========================
// @route   POST /api/auth/register
// @access  Public
// ========================
const register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;
    const allowedRoles = ['student', 'admin', 'superadmin'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be student, admin, or superadmin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// ========================
// @route   POST /api/auth/login
// @access  Public
// ========================
const login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// ========================
// @route   GET /api/auth/me
// @access  Private
// ========================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================
// @route   DELETE /api/auth/me
// @access  Private (self-delete)
// NOTE: Students are not allowed to delete their own accounts per policy
// ========================
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Students cannot delete their own accounts. Contact an admin.' });
    }

    // Delete all bookings associated with this user
    await Booking.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
};

// ========================
// @route   GET /api/auth/users
// @access  Private (admin only)
// ========================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      users
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;
    const allowedRoles = ['student', 'admin', 'superadmin', 'labincharge'];
    const userRole = role || 'student';

    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be student, admin, superadmin or labincharge'
      });
    }

    if (userRole === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only a super admin can create another super admin.'
      });
    }

    if (userRole === 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only a super admin can create admins.'
      });
    }

    if (userRole === 'labincharge' && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only admins or superadmins can create lab incharges.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: userRole
    });

    res.status(201).json({
      success: true,
      message: `User ${userRole} created successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
};

const deleteUserByAdmin = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves via this route
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account from admin panel. Use the Delete Account option instead.'
      });
    }

    if (req.user.role === 'admin') {
      // Admins can only delete students
      if (targetUser.role !== 'student') {
        return res.status(403).json({ success: false, message: 'Admins can only delete student users.' });
      }
    }

    if (req.user.role === 'superadmin') {
      // superadmin can delete anyone
    }

    // Only superadmin can delete admins or labincharges
    if (['admin', 'labincharge'].includes(targetUser.role) && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can delete admins or lab incharges.' });
    }

    // Delete all bookings associated with the target user
    await Booking.deleteMany({ userId: targetUserId });

    // Delete the user
    await User.findByIdAndDelete(targetUserId);

    res.status(200).json({
      success: true,
      message: `User "${targetUser.name}" deleted successfully`
    });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};

module.exports = { register, login, getMe, deleteAccount, deleteUserByAdmin, getAllUsers, createUserByAdmin };
