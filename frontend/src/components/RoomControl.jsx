import React, { useContext, useState } from 'react';
import { FaSignOutAlt, FaExchangeAlt } from 'react-icons/fa';
import { AppContext } from '../context/AppContext';

const RoomControl = () => {
  const { 
    roomCode, 
    isRoot, 
    syncMode, 
    changeSyncMode, 
    leaveRoom,
  } = useContext(AppContext);
  
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleSyncModeChange = async () => {
    if (!isRoot) return;
    
    setIsChangingMode(true);
    const newMode = syncMode === 'two-way' ? 'one-way' : 'two-way';
    
    try {
      await changeSyncMode(newMode);
      // Save sync mode to localStorage
      localStorage.setItem('syncMode', newMode);
    } catch (error) {
      console.error('Error changing sync mode:', error);
    } finally {
      setIsChangingMode(false);
    }
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    
    try {
      await leaveRoom();
      // Clear room-related data from localStorage on leaving
      localStorage.removeItem('roomCode');
      localStorage.removeItem('isRoot');
      localStorage.removeItem('syncMode');
    } catch (error) {
      console.error('Error leaving room:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  if (!roomCode) return null;

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Room Controls</h3>
        <div className="text-sm bg-secondary text-gray-700 px-2 py-1 rounded">
          {roomCode}
        </div>
      </div>

      <div className="space-y-3">
        {isRoot && (
          <button
            onClick={handleSyncModeChange}
            disabled={isChangingMode}
            className="btn btn-secondary w-full flex items-center justify-center"
          >
            <FaExchangeAlt className="mr-2" />
            {isChangingMode ? 'Changing...' : `Switch to ${syncMode === 'two-way' ? 'One-way' : 'Two-way'} Sync`}
          </button>
        )}
        
        <button
          onClick={handleLeaveRoom}
          disabled={isLeaving}
          className="btn btn-outline border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full flex items-center justify-center"
        >
          <FaSignOutAlt className="mr-2" />
          {isLeaving ? 'Leaving...' : `${isRoot ? 'Close' : 'Leave'} Room`}
        </button>
      </div>
      
      {isRoot && (
        <div className="mt-3 text-xs text-gray-500">
          <p className="mb-1">Current mode: <span className="font-medium">{syncMode === 'two-way' ? 'Two-way' : 'One-way'}</span></p>
          <p>
            {syncMode === 'two-way' 
              ? 'All devices can send and receive clipboard data' 
              : 'Only you can send clipboard data to other devices'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RoomControl;