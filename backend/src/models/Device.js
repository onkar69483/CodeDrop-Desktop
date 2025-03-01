const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  isRoot: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  currentRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  }
});

// Update lastActive timestamp when device is accessed
DeviceSchema.pre('findOneAndUpdate', function() {
  this.set({ lastActive: Date.now() });
});

module.exports = mongoose.model('Device', DeviceSchema);