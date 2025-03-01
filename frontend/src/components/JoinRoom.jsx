import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const JoinRoom = () => {
  const { joinRoom, deviceName } = useContext(AppContext);
  const [code, setCode] = useState('');
  const [name, setName] = useState(deviceName);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (code.length !== 4) {
      alert('Room code must be 4 digits');
      return;
    }
    
    setIsJoining(true);
    
    try {
      await joinRoom(code, name);
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