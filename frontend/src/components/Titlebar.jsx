import React from 'react';
import { FaTimes, FaMinus } from 'react-icons/fa';

const Titlebar = () => {
  const minimizeWindow = () => {
    window.electron.windowApi.hideWindow();
  };

  const closeWindow = () => {
    window.electron.windowApi.hideWindow();
  };

  return (
    <div className="titlebar">
      <div className="flex items-center">
        <img src="/icon.png" alt="CodeDrop" className="w-4 h-4 mr-2" />
        <span className="text-xs font-medium">CodeDrop</span>
      </div>
      <div className="flex items-center no-drag">
        <button
          onClick={minimizeWindow}
          className="p-1 text-gray-600 hover:bg-gray-300 rounded"
        >
          <FaMinus size={10} />
        </button>
        <button
          onClick={closeWindow}
          className="p-1 ml-1 text-gray-600 hover:bg-red-500 hover:text-white rounded"
        >
          <FaTimes size={10} />
        </button>
      </div>
    </div>
  );
};

export default Titlebar;