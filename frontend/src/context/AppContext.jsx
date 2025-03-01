import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { api } from '../services/api';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [roomCode, setRoomCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [isRoot, setIsRoot] = useState(false);
  const [syncMode, setSyncMode] = useState('two-way');
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [joinRequests, setJoinRequests] = useState([]);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState('');
  const [lastSyncedContent, setLastSyncedContent] = useState('');

  useEffect(() => {
    // Initialize device ID and name
    const storedDeviceId = localStorage.getItem('deviceId') || `device_${Math.random().toString(36).substring(2, 10)}`;
    const storedDeviceName = localStorage.getItem('deviceName') || `Device ${Math.floor(Math.random() * 1000)}`;
    
    setDeviceId(storedDeviceId);
    setDeviceName(storedDeviceName);
    
    localStorage.setItem('deviceId', storedDeviceId);
    localStorage.setItem('deviceName', storedDeviceName);

    // Check if we were in a room before
    const storedRoomCode = localStorage.getItem('roomCode');
    if (storedRoomCode) {
      setRoomCode(storedRoomCode);
      checkAndRejoinRoom(storedRoomCode, storedDeviceId);
    }

    // Initialize socket
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('clipboardUpdate', (data) => {
      if (isSyncEnabled && data.data && data.fromDeviceId !== deviceId) {
        setLastSyncedContent(data.data.content);
        window.electron.clipboardApi.setClipboardText(data.data.content);
      }
    });

    socket.on('joinRequestReceived', (data) => {
      if (isRoot) {
        setJoinRequests(prev => [...prev, data]);
      }
    });

    socket.on('joinRequestProcessed', (data) => {
      if (data.approved) {
        setIsConnected(true);
      } else {
        setError('Join request was rejected');
      }
    });

    socket.on('roomClosed', () => {
      leaveRoom();
      setError('Room was closed by the root device');
    });

    socket.on('syncModeChanged', (data) => {
      setSyncMode(data.syncMode);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('clipboardUpdate');
      socket.off('joinRequestReceived');
      socket.off('joinRequestProcessed');
      socket.off('roomClosed');
      socket.off('syncModeChanged');
    };
  }, [socket, deviceId, isRoot, isSyncEnabled]);

  // Set up clipboard monitoring when sync is enabled
  useEffect(() => {
    if (isSyncEnabled) {
      window.electron.clipboardApi.onClipboardChange((content) => {
        if (isConnected && content && content !== lastSyncedContent) {
          syncClipboard(content);
        }
      });
    }

    return () => {
      window.electron.clipboardApi.removeClipboardListener();
    };
  }, [isSyncEnabled, isConnected, roomCode, lastSyncedContent]);

  const checkAndRejoinRoom = async (code, devId) => {
    try {
      const response = await api.get(`/rooms/${code}`);
      const roomData = response.data.room;
      
      if (roomData.rootDeviceId === devId) {
        setIsRoot(true);
        setIsConnected(true);
        setSyncMode(roomData.syncMode);
        
        if (socket) {
          socket.emit('joinRoom', code);
        }
      } else {
        // Non-root device needs to rejoin
        joinRoom(code);
      }
    } catch (err) {
      localStorage.removeItem('roomCode');
      setRoomCode('');
      console.error('Failed to rejoin room:', err);
    }
  };

  const createRoom = async (name) => {
    try {
      setError('');
      const newDeviceName = name || deviceName;
      
      const response = await api.post('/rooms/create', {
        deviceId,
        deviceName: newDeviceName,
        syncMode
      });
      
      const newRoomCode = response.data.room.code;
      setRoomCode(newRoomCode);
      setIsRoot(true);
      setIsConnected(true);
      setDeviceName(newDeviceName);
      
      localStorage.setItem('roomCode', newRoomCode);
      localStorage.setItem('deviceName', newDeviceName);
      
      if (socket) {
        socket.emit('joinRoom', newRoomCode);
      }
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
      return false;
    }
  };

  const joinRoom = async (code, name) => {
    try {
      setError('');
      const newDeviceName = name || deviceName;
      
      const response = await api.post('/rooms/join', {
        code,
        deviceId,
        deviceName: newDeviceName
      });
      
      if (response.data.status === 'pending') {
        // Wait for approval
        setRoomCode(code);
        setDeviceName(newDeviceName);
        
        localStorage.setItem('roomCode', code);
        localStorage.setItem('deviceName', newDeviceName);
        
        if (socket) {
          socket.emit('joinRoom', code);
          socket.emit('joinRequest', {
            roomCode: code,
            deviceName: newDeviceName,
            deviceId
          });
        }
      } else {
        // Direct join (root device)
        setRoomCode(code);
        setIsRoot(true);
        setIsConnected(true);
        setSyncMode(response.data.room.syncMode);
        setDeviceName(newDeviceName);
        
        localStorage.setItem('roomCode', code);
        localStorage.setItem('deviceName', newDeviceName);
        
        if (socket) {
          socket.emit('joinRoom', code);
        }
      }
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
      return false;
    }
  };

  const leaveRoom = async () => {
    try {
      if (roomCode) {
        await api.post('/rooms/leave', {
          deviceId,
          roomCode
        });
        
        if (socket) {
          socket.emit('leaveRoom', roomCode);
        }
      }
      
      setRoomCode('');
      setIsConnected(false);
      setIsRoot(false);
      setIsSyncEnabled(false);
      setSyncMode('two-way');
      localStorage.removeItem('roomCode');
      
      return true;
    } catch (err) {
      console.error('Error leaving room:', err);
      return false;
    }
  };

  const syncClipboard = async (content) => {
    if (!isConnected || !roomCode) return false;
    
    // In one-way mode, only root can sync clipboard
    if (syncMode === 'one-way' && !isRoot) return false;
    
    try {
      await api.post('/clipboard/sync', {
        roomCode,
        content,
        deviceId
      });
      
      if (socket) {
        socket.emit('syncClipboard', {
          roomCode,
          data: {
            content,
            isFromRoot: isRoot
          },
          deviceId,
          syncMode
        });
      }
      
      setLastSyncedContent(content);
      return true;
    } catch (err) {
      console.error('Error syncing clipboard:', err);
      return false;
    }
  };

  const changeSyncMode = async (newMode) => {
    if (!isRoot || !roomCode) return false;
    
    try {
      await api.post('/rooms/sync-mode', {
        roomCode,
        syncMode: newMode,
        deviceId
      });
      
      setSyncMode(newMode);
      return true;
    } catch (err) {
      console.error('Error changing sync mode:', err);
      return false;
    }
  };

  const respondToJoinRequest = async (requestDeviceId, approved) => {
    try {
      await api.post(`/rooms/approve-join?rootDeviceId=${deviceId}`, {
        roomCode,
        deviceId: requestDeviceId,
        approved
      });
      
      if (socket) {
        socket.emit('joinRequestResponse', {
          approved,
          deviceId: requestDeviceId,
          roomCode
        });
      }
      
      setJoinRequests(prev => prev.filter(req => req.deviceId !== requestDeviceId));
      return true;
    } catch (err) {
      console.error('Error responding to join request:', err);
      return false;
    }
  };

  const updateDeviceName = (name) => {
    setDeviceName(name);
    localStorage.setItem('deviceName', name);
  };

  const value = {
    roomCode,
    isConnected,
    isSyncEnabled,
    setIsSyncEnabled,
    isRoot,
    syncMode,
    deviceId,
    deviceName,
    joinRequests,
    error,
    lastSyncedContent,
    createRoom,
    joinRoom,
    leaveRoom,
    syncClipboard,
    changeSyncMode,
    respondToJoinRequest,
    updateDeviceName,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};