const Room = require('../models/Room');
const Device = require('../models/Device');
const socketManager = require('../utils/socketManager');

// Sync clipboard data
exports.syncClipboard = async (req, res) => {
  console.log('📋 Clipboard sync request received:', {
    roomCode: req.body.roomCode,
    deviceId: req.body.deviceId,
    contentLength: req.body.content ? req.body.content.length : 0
  });

  try {
    const { roomCode, content, deviceId } = req.body;

    if (!roomCode || content === undefined || !deviceId) {
      console.log('❌ Missing required fields:', { roomCode, contentDefined: content !== undefined, deviceId });
      return res.status(400).json({ 
        message: 'Room code, clipboard content, and device ID are required' 
      });
    }

    // Find the room
    const room = await Room.findOne({ code: roomCode, isActive: true });
    
    if (!room) {
      console.log('❌ Room not found or inactive:', roomCode);
      return res.status(404).json({ message: 'Room not found or inactive' });
    }
    console.log('✅ Room found:', { code: room.code, syncMode: room.syncMode });

    // Find the device
    const device = await Device.findOne({ deviceId });
    
    if (!device) {
      console.log('❌ Device not found:', deviceId);
      return res.status(404).json({ message: 'Device not found' });
    }
    console.log('✅ Device found:', { id: device._id, name: device.name });

    // Check if device is part of the room
    const isDeviceInRoom = room.devices.some(d => d.equals(device._id));
    
    if (!isDeviceInRoom) {
      console.log('❌ Device not in room:', { deviceId, roomCode });
      return res.status(403).json({ message: 'Device is not part of this room' });
    }

    // Check sync mode and permissions
    const isFromRoot = deviceId === room.rootDeviceId;
    console.log('📊 Sync info:', { 
      syncMode: room.syncMode, 
      isFromRoot, 
      rootDeviceId: room.rootDeviceId 
    });
    
    if (room.syncMode === 'one-way' && !isFromRoot) {
      console.log('❌ Permission denied: Non-root device in one-way sync mode');
      return res.status(403).json({ 
        message: 'In one-way sync mode, only root device can sync clipboard data' 
      });
    }

    // Get the socket.io instance and broadcast the update
    try {
      const io = socketManager.getIO();
      console.log('🔌 Socket.io instance retrieved successfully');
      
      console.log('📢 Broadcasting to room:', roomCode);
      io.to(roomCode).emit('clipboardUpdate', {
        data: content,
        fromDeviceId: deviceId,
        isFromRoot
      });
      console.log('✅ Broadcast complete');
    } catch (socketError) {
      console.error('❌ Socket error:', socketError);
      // Continue with the request even if socket fails
    }

    // Update device's last active timestamp
    await Device.findOneAndUpdate({ deviceId }, {});
    console.log('✅ Device timestamp updated');

    console.log('✅ Clipboard sync successful');
    res.status(200).json({ message: 'Clipboard synced successfully' });
  } catch (error) {
    console.error('❌ Error syncing clipboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get last synced clipboard content
exports.getLastSyncedContent = async (req, res) => {
  console.log('📋 Last synced content request received');
  try {
    // This endpoint would normally check a cache or database for last synced content
    // For the first version of the app, we'll rely on direct socket.io communication
    // This is placeholder logic that could be expanded in the future
    
    console.log('ℹ️ Last synced content functionality not implemented');
    res.status(501).json({ 
      message: 'This functionality is not implemented in the current version' 
    });
  } catch (error) {
    console.error('❌ Error getting last synced content:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};