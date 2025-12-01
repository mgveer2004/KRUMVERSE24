const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Regular user dashboard
router.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ 
    message: `Welcome, ${req.user.username}! This is a protected route.`,
    user: req.user 
  });
});

module.exports = router;
