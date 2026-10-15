const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyPassword, generateToken } = require('../utils/auth');
const { authenticate } = require('../middleware/auth');

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tokenPayload = {
      userId: user.userId,
      username: user.username,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      assignedFacilities: user.assignedFacilities
    };

    const token = generateToken(tokenPayload);

    res.json({
      success: true,
      data: {
        token,
        user: tokenPayload
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// GET /api/v1/auth/users - Available for demo role switching and user directory
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0, salt: 0 }).sort({ role: 1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
