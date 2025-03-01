import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';

const JoinRoom = () => {
  const { joinRoom, deviceName, roomCode } = useContext(AppContext);
  const [code, setCode] = useState('');
  const [name, setName] = useState(deviceName);
  const [isJoining, setIsJoining] = useState(false);

  // Pre-fill the code if we have a roomCode from context
  useEffect(() => {
    if (roomCode) {
      setCode(roomCode);
    }
  }, [roomCode]);

  // Pre-fill the device name from localStorage or context
  useEffect(() => {
    const savedName = localStorage.getItem('deviceName');
    if (savedName) {
      setName(savedName);
    } else if (deviceName) {
      setName(deviceName);
    }
  }, [deviceName]);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (code.length !== 4) {
      alert('Room code must be 4 digits');
      return;
    }
    
    // Save device name to localStorage
    localStorage.setItem('deviceName', name);
    
    setIsJoining(true);
    
    try {
      await joinRoom(code, name);
      // Save room code to localStorage on successful join
      localStorage.setItem('roomCode', code);
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Join a Room</h2>
      <form onSubmit={handleJoinRoom}>
        <div className="mb-4">
          <label htmlFor="roomCode" className="block text-sm font-medium mb-1">
            Room Code
          </label>
          <input
            type="text"
            id="roomCode"
            className="input w-full"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="4-digit code"
            pattern="[0-9]{4}"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="joinDeviceName" className="block text-sm font-medium mb-1">
            Device Name
          </label>
          <input
            type="text"
            id="joinDeviceName"
            className="input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Phone"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-outline w-full"
          disabled={isJoining || code.length !== 4}
        >
          {isJoining ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </div>
  );
};

export default JoinRoom;