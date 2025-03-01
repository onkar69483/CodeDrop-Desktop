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
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Initialize device ID, name, and socket connection
  useEffect(() => {
    // Initialize device ID and name
    const storedDeviceId = localStorage.getItem('deviceId') || `device_${Math.random().toString(36).substring(2, 10)}`;
    const storedDeviceName = localStorage.getItem('deviceName') || `Device ${Math.floor(Math.random() * 1000)}`;
    
    setDeviceId(storedDeviceId);
    setDeviceName(storedDeviceName);
    
    localStorage.setItem('deviceId', storedDeviceId);
    localStorage.setItem('deviceName', storedDeviceName);

    // Initialize socket
    const newSocket = io('https://gfx30lfd-5000.inc1.devtunnels.ms');
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // Handle room reconnection after initialization
  useEffect(() => {
    // Only try to rejoin if we have a socket and deviceId
    if (socket && deviceId) {
      // Check if we were in a room before
      const storedRoomCode = localStorage.getItem('roomCode');
      const storedIsRoot = localStorage.getItem('isRoot') === 'true';
      const storedSyncMode = localStorage.getItem('syncMode');
      const storedIsSyncEnabled = localStorage.getItem('isSyncEnabled') === 'true';
      
      if (storedRoomCode) {
        setRoomCode(storedRoomCode);
        setIsRoot(storedIsRoot);
        if (storedSyncMode) setSyncMode(storedSyncMode);
        if (storedIsSyncEnabled !== null) setIsSyncEnabled(storedIsSyncEnabled);
        
        // Attempt to rejoin the room
        checkAndRejoinRoom(storedRoomCode, deviceId, storedIsRoot);
      }
    }
  }, [socket, deviceId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Connected to server');
      
      // If we're reconnecting and have a room code, attempt to rejoin
      if (roomCode && !isConnected && !isReconnecting) {
        checkAndRejoinRoom(roomCode, deviceId, isRoot);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('clipboardUpdate', (data) => {
      if (isSyncEnabled && data && data.fromDeviceId !== deviceId) {
        if (typeof data.data === 'string' && data.data.trim() !== '') {
          setLastSyncedContent(data.data);
          window.electron.clipboardApi.setClipboardText(data.data);
        } else {
          console.warn('Received invalid clipboard content:', data.data);
        }
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
        localStorage.setItem('isConnected', 'true');
      } else {
        setError('Join request was rejected');
        // Clear room data if join was rejected
        localStorage.removeItem('roomCode');
        setRoomCode('');
      }
    });

    socket.on('roomClosed', () => {
      // Clean up when room is closed
      leaveRoom();
      setError('Room was closed by the root device');
    });

    socket.on('syncModeChanged', (data) => {
      setSyncMode(data.syncMode);
      localStorage.setItem('syncMode', data.syncMode);
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
  }, [socket, deviceId, isRoot, isSyncEnabled, roomCode, isConnected, isReconnecting]);

  // Set up clipboard monitoring when sync is enabled
  useEffect(() => {
    if (isSyncEnabled) {
      window.electron.clipboardApi.onClipboardChange((content) => {
        if (isConnected && content && content !== lastSyncedContent) {
          syncClipboard(content);
        }
      });
      
      // Save sync state to localStorage
      localStorage.setItem('isSyncEnabled', 'true');
    } else {
      localStorage.setItem('isSyncEnabled', 'false');
    }

    return () => {
      window.electron.clipboardApi.removeClipboardListener();
    };
  }, [isSyncEnabled, isConnected, roomCode, lastSyncedContent]);

  // Function to check and rejoin a room after page refresh
  const checkAndRejoinRoom = async (code, devId, wasRoot) => {
    if (!code || !devId || isReconnecting) return;
    
    setIsReconnecting(true);
    
    try {
      console.log(`Attempting to rejoin room ${code}`);
      
      const response = await api.get(`/rooms/${code}`);
      const roomData = response.data.room;
      
      if (roomData.rootDeviceId === devId || wasRoot) {
        // This device was the root
        setIsRoot(true);
        setIsConnected(true);
        setSyncMode(roomData.syncMode);
        
        localStorage.setItem('isRoot', 'true');
        localStorage.setItem('syncMode', roomData.syncMode);
        
        if (socket && socket.connected) {
          socket.emit('joinRoom', code);
        }
      } else {
        // Non-root device needs to rejoin
        console.log('Rejoining as non-root device');
        setIsRoot(false);
        localStorage.setItem('isRoot', 'false');
        
        if (socket && socket.connected) {
          socket.emit('joinRoom', code);
          socket.emit('joinRequest', {
            roomCode: code,
            deviceName,
            deviceId: devId
          });
        }
      }
    } catch (err) {
      console.error('Failed to rejoin room:', err);
      // Clear storage if room no longer exists
      localStorage.removeItem('roomCode');
      localStorage.removeItem('isRoot');
      localStorage.removeItem('syncMode');
      localStorage.removeItem('isSyncEnabled');
      
      setRoomCode('');
      setIsConnected(false);
      setIsRoot(false);
      setIsSyncEnabled(false);
    } finally {
      setIsReconnecting(false);
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
      
      // Store room information in localStorage
      localStorage.setItem('roomCode', newRoomCode);
      localStorage.setItem('deviceName', newDeviceName);
      localStorage.setItem('isRoot', 'true');
      localStorage.setItem('syncMode', syncMode);
      
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
        
        // Store room information in localStorage
        localStorage.setItem('roomCode', code);
        localStorage.setItem('deviceName', newDeviceName);
        localStorage.setItem('isRoot', 'false');
        
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
        
        // Store room information in localStorage
        localStorage.setItem('roomCode', code);
        localStorage.setItem('deviceName', newDeviceName);
        localStorage.setItem('isRoot', 'true');
        localStorage.setItem('syncMode', response.data.room.syncMode);
        
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
      
      // Reset state
      setRoomCode('');
      setIsConnected(false);
      setIsRoot(false);
      setIsSyncEnabled(false);
      setSyncMode('two-way');
      
      // Clear localStorage
      localStorage.removeItem('roomCode');
      localStorage.removeItem('isRoot');
      localStorage.removeItem('syncMode');
      localStorage.removeItem('isSyncEnabled');
      
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
      localStorage.setItem('syncMode', newMode);
      
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

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      // We're intentionally not clearing localStorage here
      // to allow for reconnection on page refresh
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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