// ============================================
// TOURNAMENT MODEL (models/tournament.js)
// ✅ CORRECTED ENUM VALUES
// ============================================

const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({

  // ============================================
  // BASIC INFORMATION
  // ============================================

  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },

  description: {
    type: String,
    maxlength: 1000
  },

  // ============================================
  // GAME & ORGANIZER
  // ============================================

  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },

  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ============================================
  // TOURNAMENT STATUS
  // ============================================

  status: {
    type: String,
    enum: ['draft', 'open', 'closed', 'ongoing', 'completed', 'cancelled'],
    default: 'open'
  },

  // ============================================
  // DATES
  // ============================================

  startDate: {
    type: Date,
    required: true
  },

  endDate: Date,
  registrationDeadline: Date,

  // ============================================
  // TOURNAMENT DETAILS
  // ============================================

  maxParticipants: {
    type: Number,
    default: 16,
    min: 2,
    max: 1000
  },

  currentParticipants: {
    type: Number,
    default: 0
  },

  bracket: {
    type: String,
    enum: ['single-elimination', 'double-elimination', 'round-robin'],
    default: 'single-elimination'
  },

  // ============================================
  // PRIZE & RULES
  // ============================================

  prizePool: {
    type: String,
    maxlength: 500
  },

  rules: {
    type: String,
    maxlength: 2000
  },

  // ============================================
  // PAYMENT INFORMATION
  // ============================================

  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },

  isPaid: {
    type: Boolean,
    default: false
  },

  totalCollected: {
    type: Number,
    default: 0,
    min: 0
  },

  // ============================================
  // TOURNAMENT ROOM ACCESS
  // ============================================

  roomId: {
    type: String,
    unique: true,
    sparse: true
  },

  roomPassword: String,
  roomLink: String,

  // ============================================
  // PARTICIPANTS WITH PAYMENT STATUS
  // ============================================

  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    username: String,

    joinedAt: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: ['registered', 'paymentpending', 'paid', 'checkedin', 'disqualified', 'eliminated'],
      default: 'registered'
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },

    position: Number,
    score: Number
  }],

  // ============================================
  // TOURNAMENT RESULTS
  // ============================================

  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  winnerUsername: String,

  runnerUpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  runnerUpUsername: String,

  thirdPlaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  thirdPlaceUsername: String,

  // ============================================
  // ADDITIONAL SETTINGS
  // ============================================

  isPublic: {
    type: Boolean,
    default: true
  },

  allowSpectators: {
    type: Boolean,
    default: true
  },

  autoStart: {
    type: Boolean,
    default: false
  },

  // ============================================
  // TIMESTAMPS
  // ============================================

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ============================================
// INDEXES FOR BETTER PERFORMANCE
// ============================================

tournamentSchema.index({ game: 1, status: 1 });
tournamentSchema.index({ organizer: 1, status: 1 });
tournamentSchema.index({ startDate: -1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ roomId: 1 });
tournamentSchema.index({ createdAt: -1 });

// ============================================
// VIRTUAL - Check if tournament is full
// ============================================

tournamentSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// ============================================
// VIRTUAL - Check if tournament has started
// ============================================

tournamentSchema.virtual('hasStarted').get(function() {
  return new Date() >= this.startDate;
});

// ============================================
// VIRTUAL - Check if registration is open
// ============================================

tournamentSchema.virtual('registrationOpen').get(function() {
  const now = new Date();
  return now < this.startDate && this.status === 'open' && !this.isFull;
});

// ============================================
// METHODS
// ============================================

// Add participant
tournamentSchema.methods.addParticipant = function(userId, username) {
  const exists = this.participants.some(p => p.user.toString() === userId.toString());
  if (!exists) {
    this.participants.push({
      user: userId,
      username: username,
      status: 'registered'
    });
    this.currentParticipants = this.participants.length;
    return true;
  }
  return false;
};

// Remove participant
tournamentSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  this.currentParticipants = this.participants.length;
  return true;
};

// Check if user is participant
tournamentSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Generate unique room ID
tournamentSchema.methods.generateRoomId = function() {
  this.roomId = `room_${this._id}_${Date.now()}`;
  return this.roomId;
};

// Generate room password
tournamentSchema.methods.generateRoomPassword = function() {
  this.roomPassword = Math.random().toString(36).substring(2, 10).toUpperCase();
  return this.roomPassword;
};

// ============================================
// MIDDLEWARE
// ============================================

// Update updatedAt timestamp
tournamentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Tournament', tournamentSchema);