/**
 * Authentication Middleware
 * Verifies JWT tokens and role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ========================
// PROTECT ROUTE - Verify JWT
// ========================
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database (excludes password via select)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or expired.'
    });
  }
};

// ========================
// ADMIN ONLY MIDDLEWARE
// ========================
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// ========================
// STUDENT ONLY MIDDLEWARE
// ========================
const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Student access only.'
    });
  }
};

module.exports = { protect, adminOnly, studentOnly };
