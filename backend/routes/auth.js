const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.js');
const emailService = require('../services/emailservice');

const router = express.Router();

// ============================================
// SIGNUP - NO MIDDLEWARE
// ============================================
router.post('/signup', async (req, res) => {
    try {
        console.log('\n📝 SIGNUP REQUEST');
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, password required'
            });
        }

        const userExists = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { username }] 
        });
        
        if (userExists) {
            return res.status(409).json({
                success: false,
                message: 'Email or username already registered'
            });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔐 Code:', verificationCode);

        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            role: role || 'player',
            emailVerified: false,
            emailVerificationToken: verificationCode,
            emailVerificationExpires: Date.now() + 10 * 60 * 1000
        });

        const savedUser = await newUser.save();
        console.log('✅ User created:', savedUser.email);

        try {
            await emailService.sendVerificationEmail(savedUser.email, verificationCode);
        } catch (e) {
            console.error('Email error:', e.message);
        }

        const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email, role: savedUser.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            message: 'Signup successful!',
            token,
            verificationCode,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role
            }
        });

    } catch (error) {
        console.error('❌ Signup error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Signup failed',
            error: error.message
        });
    }
});

// ============================================
// VERIFY EMAIL - NO MIDDLEWARE
// ============================================
router.post('/verify-email', async (req, res) => {
    try {
        console.log('\n✉️ VERIFY EMAIL REQUEST');
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({
                success: false,
                message: 'Email and token required'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase(),
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log('❌ Invalid code or expired');
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired code'
            });
        }

        user.emailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        console.log('✅ Email verified:', email);

        return res.json({
            success: true,
            message: 'Email verified successfully!'
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

// ============================================
// LOGIN - NO MIDDLEWARE, DIRECT BCRYPT
// ============================================
router.post('/login', async (req, res) => {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🔐 LOGIN REQUEST');
        console.log('='.repeat(80));

        const { email, password } = req.body;

        console.log('📥 Request received:');
        console.log('   Email:', email);
        console.log('   Password length:', password ? password.length : 0);

        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Email and password required'
            });
        }

        // EXACT email lookup - lowercase and trim
        const emailLower = email.toLowerCase().trim();
        console.log('🔍 Looking for email:', emailLower);

        const user = await User.findOne({ email: emailLower });

        if (!user) {
            console.log('❌ User not found with email:', emailLower);
            console.log('💡 Tip: Check MongoDB for this email');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('✅ User found:', user.email);
        console.log('📊 Verified:', user.emailVerified);
        console.log('🔐 Has password:', !!user.password);

        // Step 1: Check if password exists
        if (!user.password) {
            console.error('❌ Password field is missing!');
            return res.status(500).json({
                success: false,
                message: 'Account error - password missing'
            });
        }

        // Step 2: Check if email verified
        if (!user.emailVerified) {
            console.log('❌ Email not verified');
            return res.status(403).json({
                success: false,
                message: 'Please verify your email first'
            });
        }

        // Step 3: Compare password - THIS IS THE CRITICAL PART
        console.log('\n🔑 PASSWORD COMPARISON:');
        console.log('   Entered password:', password);
        console.log('   Stored hash (first 15 chars):', user.password.substring(0, 15) + '...');
        console.log('   Hash length:', user.password.length);
        console.log('   Hash starts with:', user.password.substring(0, 4));

        let isPasswordValid;
        try {
            isPasswordValid = await bcrypt.compare(password, user.password);
            console.log('   Bcrypt result:', isPasswordValid);
        } catch (bcryptErr) {
            console.error('   ❌ Bcrypt error:', bcryptErr.message);
            return res.status(500).json({
                success: false,
                message: 'Password verification error'
            });
        }

        if (!isPasswordValid) {
            console.log('❌ PASSWORD MISMATCH!');
            console.log('💡 Possible causes:');
            console.log('   - Wrong password typed');
            console.log('   - Password not hashed properly at signup');
            console.log('   - Different password used');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('✅ PASSWORD MATCHED!');

        // Step 4: Generate token
        console.log('\n🎫 Generating JWT token...');
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        console.log('✅ Token generated');
        console.log('👤 User:', user.username);
        console.log('📊 Role:', user.role);
        console.log('='.repeat(80) + '\n');

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
        console.error('\n❌ LOGIN EXCEPTION:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// ============================================
// RESEND VERIFICATION
// ============================================
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationToken = code;
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        try {
            await emailService.sendVerificationEmail(user.email, code);
        } catch (e) {
            console.error('Email error:', e.message);
        }

        return res.json({
            success: true,
            message: 'Verification code sent',
            verificationCode: code
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to resend'
        });
    }
});

module.exports = router;