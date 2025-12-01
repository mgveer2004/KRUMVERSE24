// ============================================
// TRANSACTION MODEL - CORRECT WORKING
// ============================================
// Status: ✅ CORRECT
// Stores all payment records

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        // Razorpay Payment Information
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        razorpayPaymentId: {
            type: String,
            sparse: true // Allow multiple nulls
        },
        razorpaySignature: {
            type: String,
            sparse: true
        },

        // User & Tournament Information
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        tournament: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament',
            required: true,
            index: true
        },

        // Payment Details
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'INR'
        },
        
        // Status: pending → completed/failed
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending',
            index: true
        },

        // Error tracking (if payment fails)
        errorMessage: {
            type: String,
            default: null
        },

        // Timestamps
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true // Automatically update updatedAt
    }
);

// Indexes for better query performance
transactionSchema.index({ user: 1, tournament: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

// Create model
const Transaction = mongoose.model('Transaction', transactionSchema);

// Log model creation
console.log('✅ Transaction Model Loaded');

module.exports = Transaction;