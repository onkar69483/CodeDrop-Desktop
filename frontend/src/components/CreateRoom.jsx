import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const CreateRoom = () => {
  const { createRoom, deviceName } = useContext(AppContext);
  const [name, setName] = useState(deviceName);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      await createRoom(name);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Create a Room</h2>
      <form onSubmit={handleCreateRoom}>
        <div className="mb-4">
          <label htmlFor="deviceName" className="block text-sm font-medium mb-1">
            Device Name
          </label>
          <input
            type="text"
            id="deviceName"
            className="input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Laptop"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </div>
  );
};

export default CreateRoom;