const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  // Organizer payout info
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  
  // Payout details
  amount: { type: Number, required: true }, // Amount to be paid
  currency: { type: String, default: 'INR' },
  payoutMethod: { 
    type: String, 
    enum: ['upi', 'bank_transfer', 'wallet'], 
    required: true 
  },
  
  // UPI or Bank details
  upiId: String,
  bankAccountNumber: String,
  bankIfsc: String,
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'processed', 'failed'], 
    default: 'pending' 
  },
  
  // Reference
  transactionId: String,
  reason: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  processedAt: Date
});

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
