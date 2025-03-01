import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const TrayIcon = () => {
  const { roomCode, isConnected, isSyncEnabled, syncMode, isRoot } = useContext(AppContext);

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h3 className="font-medium mb-2">Status</h3>
      <div className="space-y-2">
        <StatusIndicator 
          label="Connection" 
          status={isConnected ? 'connected' : 'disconnected'} 
          text={isConnected ? 'Connected' : 'Disconnected'} 
        />
        
        <StatusIndicator 
          label="Room" 
          status={roomCode ? 'active' : 'inactive'} 
          text={roomCode ? `Room: ${roomCode}` : 'No active room'} 
        />
        
        <StatusIndicator 
          label="Role" 
          status="info" 
          text={isRoot ? 'Root Device' : 'Client Device'} 
        />
        
        <StatusIndicator 
          label="Sync Mode" 
          status="info" 
          text={syncMode === 'two-way' ? 'Two-way sync' : 'One-way sync'} 
        />
        
        <StatusIndicator 
          label="Clipboard Sync" 
          status={isSyncEnabled ? 'active' : 'inactive'} 
          text={isSyncEnabled ? 'Enabled' : 'Disabled'} 
        />
      </div>
    </div>
  );
};

const StatusIndicator = ({ label, status, text }) => {
  let statusClass = '';
  
  switch (status) {
    case 'connected':
    case 'active':
      statusClass = 'bg-green-500';
      break;
    case 'disconnected':
    case 'inactive':
      statusClass = 'bg-red-500';
      break;
    default:
      statusClass = 'bg-blue-500';
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}:</span>
      <div className="flex items-center">
        <span className="mr-2">{text}</span>
        <div className={`w-2 h-2 rounded-full ${statusClass}`}></div>
      </div>
    </div>
  );
};

export default TrayIcon;