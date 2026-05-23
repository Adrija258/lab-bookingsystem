const express = require('express');
const { createGroup } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, createGroup);

module.exports = router;
