const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    minlength: 4,
    maxlength: 4
  },
  rootDeviceId: {
    type: String,
    required: true
  },
  syncMode: {
    type: String,
    enum: ['one-way', 'two-way'],
    default: 'two-way'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  devices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically expire rooms after 24 hours
  }
});

module.exports = mongoose.model('Room', RoomSchema);