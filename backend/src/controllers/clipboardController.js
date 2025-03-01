const Room = require('../models/Room');
const Device = require('../models/Device');
const socketManager = require('../utils/socketManager');

// Sync clipboard data
exports.syncClipboard = async (req, res) => {
  try {
    const { roomCode, content, deviceId } = req.body;

    if (!roomCode || content === undefined || !deviceId) {
      return res.status(400).json({ 
        message: 'Room code, clipboard content, and device ID are required' 
      });
    }

    // Find the room
    const room = await Room.findOne({ code: roomCode, isActive: true });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found or inactive' });
    }

    // Find the device
    const device = await Device.findOne({ deviceId });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check if device is part of the room
    const isDeviceInRoom = room.devices.some(d => d.equals(device._id));
    
    if (!isDeviceInRoom) {
      return res.status(403).json({ message: 'Device is not part of this room' });
    }

    // Check sync mode and permissions
    const isFromRoot = deviceId === room.rootDeviceId;
    
    if (room.syncMode === 'one-way' && !isFromRoot) {
      return res.status(403).json({ 
        message: 'In one-way sync mode, only root device can sync clipboard data' 
      });
    }

    // Get the socket.io instance and broadcast the update
    const io = socketManager.getIO();
    io.to(roomCode).emit('clipboardUpdate', {
      data: content,
      fromDeviceId: deviceId,
      isFromRoot
    });

    // Update device's last active timestamp
    await Device.findOneAndUpdate({ deviceId }, {});

    res.status(200).json({ message: 'Clipboard synced successfully' });
  } catch (error) {
    console.error('Error syncing clipboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get last synced clipboard content
exports.getLastSyncedContent = async (req, res) => {
  try {
    // This endpoint would normally check a cache or database for last synced content
    // For the first version of the app, we'll rely on direct socket.io communication
    // This is placeholder logic that could be expanded in the future
    
    res.status(501).json({ 
      message: 'This functionality is not implemented in the current version' 
    });
  } catch (error) {
    console.error('Error getting last synced content:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};