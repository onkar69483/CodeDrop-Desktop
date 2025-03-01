import React, { useContext } from 'react';
import { FaClipboard, FaClipboardCheck } from 'react-icons/fa';
import { AppContext } from '../context/AppContext';

const ClipboardToggle = () => {
  const { isSyncEnabled, setIsSyncEnabled, isConnected, syncMode, isRoot } = useContext(AppContext);

  const handleToggle = () => {
    if (!isConnected) {
      alert('You need to join a room first to enable clipboard synchronization.');
      return;
    }
    
    setIsSyncEnabled(!isSyncEnabled);
  };

  // Determine if sync is possible based on user's role and sync mode
  const canSync = isConnected && (syncMode === 'two-way' || isRoot);

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Clipboard Sync</h3>
          <p className="text-sm text-gray-500">
            {isSyncEnabled 
              ? 'Your clipboard is being synchronized' 
              : 'Clipboard sync is disabled'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={!canSync}
          className={`p-3 rounded-full ${
            isSyncEnabled
              ? 'bg-primary-light text-white'
              : 'bg-gray-200 text-gray-500'
          } ${!canSync ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isSyncEnabled ? <FaClipboardCheck size={20} /> : <FaClipboard size={20} />}
        </button>
      </div>
      
      {syncMode === 'one-way' && !isRoot && (
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          In one-way sync mode, only the root device can share clipboard data.
        </div>
      )}
    </div>
  );
};

export default ClipboardToggle;