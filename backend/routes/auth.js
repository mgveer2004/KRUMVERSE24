const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');
const emailService = require('../services/emailservice');

const router = express.Router();

// Helper to generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
    );
};

// ============================================
// SIGNUP
// ============================================
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if user exists
        const userExists = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { username }] 
        });
        
        if (userExists) {
            return res.status(409).json({ success: false, message: 'Email or Username already exists' });
        }

        // Generate Verification Code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create User
        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: password, // Model will hash this automatically
            role: role || 'player',
            emailVerificationToken: verificationCode,
            emailVerificationExpires: Date.now() + 10 * 60 * 1000 // 10 Minutes
        });

        const savedUser = await newUser.save();

        // Send Email (Don't block response if email fails)
        emailService.sendVerificationEmail(savedUser.email, verificationCode)
            .catch(err => console.error('Failed to send email:', err.message));

        const token = generateToken(savedUser);

        return res.status(201).json({
            success: true,
            message: 'Signup successful! Please verify your email.',
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role
            }
        });

    } catch (error) {
        console.error('Signup Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error during signup' });
    }
});

// ============================================
// LOGIN
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.emailVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your email first' });
        }

        // Check Password (using the method inside User model)
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Login Success
        const token = generateToken(user);

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// ============================================
// VERIFY EMAIL
// ============================================
router.post('/verify-email', async (req, res) => {
    try {
        const { email, token } = req.body;

        const user = await User.findOne({
            email: email.toLowerCase(),
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired code' });
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        return res.json({ success: true, message: 'Email verified successfully!' });

    } catch (error) {
        console.error('Verification Error:', error.message);
    }
});

module.exports = router;