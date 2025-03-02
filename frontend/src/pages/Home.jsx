import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import CreateRoom from '../components/CreateRoom';
import JoinRoom from '../components/JoinRoom';
import ClipboardToggle from '../components/ClipboardToggle';
import TrayIcon from '../components/TrayIcon';
import JoinRequests from '../components/JoinRequests';
import ClipboardContent from '../components/ClipboardContent';
import RoomControl from '../components/Roomcontrol';

const Home = () => {
  const { roomCode, error } = useContext(AppContext);

  return (
    <div className="p-4 space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <TrayIcon />
      <JoinRequests />
      
      {roomCode ? (
        <>
          <ClipboardToggle />
          <ClipboardContent />
          <RoomControl />
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CreateRoom />
          <JoinRoom />
        </div>
      )}
      
      <div className="text-xs text-center text-gray-500 mt-4">
        CodeDrop v1.0.0 - Clipboard synchronization tool
      </div>
    </div>
  );
};

export default Home;