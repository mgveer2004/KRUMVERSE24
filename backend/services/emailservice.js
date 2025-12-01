const nodemailer = require('nodemailer');

console.log('📧 Email Service Initializing...');

// ============================================
// CREATE TRANSPORTER WITH CORRECT CONFIG
// ============================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS (not SSL)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    logger: false
});

console.log('✅ Email Service Ready');
console.log('   Email:', process.env.EMAIL_USER?.slice(0, 10) + '...');

// ============================================
// VERIFY TRANSPORTER CONNECTION
// ============================================
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email verification failed:', error.message);
    } else {
        console.log('✅ Email transporter verified!');
    }
});

// ============================================
// SEND VERIFICATION EMAIL (6-DIGIT CODE)
// ============================================
const sendVerificationEmail = async (userEmail, verificationCode) => {
    try {
        console.log('📧 Sending verification email to:', userEmail);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: '🔐 KrumVerse - Verify Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">🎮 KrumVerse</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
                        <p style="color: #666; line-height: 1.6;">Thank you for signing up! To complete your registration, please use the verification code below:</p>
                        <div style="background: #f0f0f0; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                            <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase;">Verification Code</p>
                            <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 3px;">${verificationCode}</p>
                        </div>
                        <p style="color: #666; text-align: center;">⏱️ This code expires in 10 minutes</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Verification email error:', error.message);
        throw error;
    }
};

// ============================================
// SEND WELCOME EMAIL
// ============================================
const sendWelcomeEmail = async (user) => {
    try {
        console.log('📧 Sending welcome email to:', user.email);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: '🎉 Welcome to KrumVerse!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">🎮 KrumVerse</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome Aboard!</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Hello ${user.username}! 👋</h2>
                        <p style="color: #666; line-height: 1.6;">Your email has been verified successfully! Your account is now fully active.</p>
                        <p style="color: #666; line-height: 1.6;">You can now:</p>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>🎮 Browse and join tournaments</li>
                            <li>🏆 Compete with other players</li>
                            <li>💰 Manage your wallet</li>
                            <li>👤 Update your profile</li>
                        </ul>
                        <p style="color: #666; line-height: 1.6;">Get started by logging in to your account!</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Welcome email error:', error.message);
        throw error;
    }
};

// ============================================
// SEND PASSWORD RESET EMAIL
// ============================================
const sendPasswordResetEmail = async (userEmail, resetCode) => {
    try {
        console.log('📧 Sending password reset email to:', userEmail);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: '🔑 KrumVerse - Password Reset',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">🎮 KrumVerse</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Reset Your Password 🔐</h2>
                        <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Use the code below:</p>
                        <div style="background: #f0f0f0; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                            <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase;">Reset Code</p>
                            <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 3px;">${resetCode}</p>
                        </div>
                        <p style="color: #666; text-align: center;">⏱️ This code expires in 10 minutes</p>
                        <p style="color: #c33; margin-top: 20px; padding: 15px; background: #ffe6e6; border-radius: 5px;">⚠️ If you didn't request this, ignore this email and your password remains unchanged.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Password reset email error:', error.message);
        throw error;
    }
};

// ============================================
// SEND PAYMENT RECEIPT EMAIL
// ============================================
const sendPaymentReceiptEmail = async (userEmail, amount, paymentId, tournamentName) => {
    try {
        console.log('📧 Sending payment receipt to:', userEmail);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: '💳 KrumVerse - Payment Receipt',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">✅ Payment Successful</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">KrumVerse Tournament</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Thank You! 🎉</h2>
                        <p style="color: #666; line-height: 1.6;">Your payment has been processed successfully.</p>
                        <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <table style="width: 100%; color: #666;">
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px 0; font-weight: bold;">Tournament:</td>
                                    <td style="padding: 10px 0; text-align: right;">${tournamentName}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px 0; font-weight: bold;">Amount:</td>
                                    <td style="padding: 10px 0; text-align: right; color: #27ae60; font-weight: bold;">₹${amount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; font-weight: bold;">Payment ID:</td>
                                    <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 12px;">${paymentId}</td>
                                </tr>
                            </table>
                        </div>
                        <p style="color: #666; line-height: 1.6;">You are now registered! Good luck! 🍀</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Payment receipt sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Payment receipt error:', error.message);
        throw error;
    }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendPaymentReceiptEmail,
    transporter
};