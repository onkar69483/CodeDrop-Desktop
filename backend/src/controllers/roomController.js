const Room = require('../models/Room');
const Device = require('../models/Device');
const generateCode = require('../utils/generateCode');
const { io } = require('../server');

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { deviceId, deviceName, syncMode } = req.body;

    if (!deviceId || !deviceName) {
      return res.status(400).json({ message: 'Device information is required' });
    }

    // Generate a unique 4-digit room code
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = generateCode();
      const existingRoom = await Room.findOne({ code });
      if (!existingRoom) {
        isUnique = true;
      }
    }

    // Find or create the device
    let device = await Device.findOne({ deviceId });
    
    if (!device) {
      device = new Device({
        deviceId,
        name: deviceName,
        isRoot: true
      });
    } else {
      device.name = deviceName;
      device.isRoot = true;
    }
    
    await device.save();

    // Create the room
    const room = new Room({
      code,
      rootDeviceId: deviceId,
      syncMode: syncMode || 'two-way',
      devices: [device._id]
    });

    await room.save();

    // Update the device with the room ID
    device.currentRoom = room._id;
    await device.save();

    res.status(201).json({
      room: {
        code,
        syncMode: room.syncMode,
        isRoot: true
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join a room
exports.joinRoom = async (req, res) => {
  try {
    const { code, deviceId, deviceName } = req.body;

    if (!code || !deviceId || !deviceName) {
      return res.status(400).json({ message: 'Room code and device information are required' });
    }

    // Find the room
    const room = await Room.findOne({ code, isActive: true });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found or inactive' });
    }

    // Find or create the device
    let device = await Device.findOne({ deviceId });
    
    if (!device) {
      device = new Device({
        deviceId,
        name: deviceName,
        isRoot: false
      });
    } else {
      device.name = deviceName;
      // Don't change isRoot status here
    }

    // Check if device is already in the room
    const isDeviceInRoom = room.devices.includes(device._id);
    
    if (!isDeviceInRoom) {
      // For non-root devices, we'll add them to the room after approval
      if (deviceId !== room.rootDeviceId) {
        await device.save();
        return res.status(200).json({
          status: 'pending',
          message: 'Join request sent to root device',
          roomCode: code
        });
      }

      // If it's the root device rejoining its own room
      room.devices.push(device._id);
      await room.save();
    }

    // Update device's current room
    device.currentRoom = room._id;
    await device.save();

    res.status(200).json({
      room: {
        code,
        syncMode: room.syncMode,
        isRoot: deviceId === room.rootDeviceId
      }
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve device join request
exports.approveJoinRequest = async (req, res) => {
  try {
    const { roomCode, deviceId, approved } = req.body;
    const { rootDeviceId } = req.query;

    // Verify the room exists
    const room = await Room.findOne({ code: roomCode });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Verify the request is from the root device
    if (room.rootDeviceId !== rootDeviceId) {
      return res.status(403).json({ message: 'Only root device can approve join requests' });
    }

    // Find the requesting device
    const device = await Device.findOne({ deviceId });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (approved) {
      // Add device to room
      room.devices.push(device._id);
      await room.save();

      // Update device's current room
      device.currentRoom = room._id;
      await device.save();

      // Notify the device that it's been approved
      io.to(roomCode).emit('joinRequestProcessed', {
        approved: true,
        deviceId
      });

      return res.status(200).json({ message: 'Device approved to join room' });
    } else {
      // Notify the device that it's been rejected
      io.to(roomCode).emit('joinRequestProcessed', {
        approved: false,
        deviceId
      });

      return res.status(200).json({ message: 'Device rejected from joining room' });
    }
  } catch (error) {
    console.error('Error processing join request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Leave a room
exports.leaveRoom = async (req, res) => {
  try {
    const { deviceId, roomCode } = req.body;

    if (!deviceId || !roomCode) {
      return res.status(400).json({ message: 'Device ID and room code are required' });
    }

    // Find the room
    const room = await Room.findOne({ code: roomCode });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Find the device
    const device = await Device.findOne({ deviceId });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Remove device from room
    room.devices = room.devices.filter(d => !d.equals(device._id));
    
    // If root device is leaving, deactivate the room
    if (deviceId === room.rootDeviceId) {
      room.isActive = false;
      
      // Notify all devices in the room
      io.to(roomCode).emit('roomClosed', { 
        message: 'Room has been closed by the root device' 
      });
    }
    
    await room.save();

    // Update device
    device.currentRoom = null;
    await device.save();

    res.status(200).json({ message: 'Successfully left the room' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change room sync mode
exports.changeSyncMode = async (req, res) => {
  try {
    const { roomCode, syncMode, deviceId } = req.body;

    if (!roomCode || !syncMode || !deviceId) {
      return res.status(400).json({ message: 'Room code, sync mode, and device ID are required' });
    }

    // Find the room
    const room = await Room.findOne({ code: roomCode });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Verify request is from root device
    if (deviceId !== room.rootDeviceId) {
      return res.status(403).json({ message: 'Only root device can change sync mode' });
    }

    // Update sync mode
    room.syncMode = syncMode;
    await room.save();

    // Notify all devices in the room
    io.to(roomCode).emit('syncModeChanged', { 
      syncMode 
    });

    res.status(200).json({ 
      message: 'Sync mode updated successfully',
      syncMode
    });
  } catch (error) {
    console.error('Error changing sync mode:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get room info
exports.getRoomInfo = async (req, res) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ code, isActive: true })
      .populate('devices', 'deviceId name isRoot lastActive');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found or inactive' });
    }

    res.status(200).json({
      room: {
        code: room.code,
        syncMode: room.syncMode,
        rootDeviceId: room.rootDeviceId,
        devices: room.devices,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};