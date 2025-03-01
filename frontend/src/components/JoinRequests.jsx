import React, { useContext } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { AppContext } from '../context/AppContext';

const JoinRequests = () => {
  const { joinRequests, respondToJoinRequest, isRoot } = useContext(AppContext);

  if (!isRoot || joinRequests.length === 0) return null;

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h3 className="font-medium mb-3">Join Requests</h3>
      <div className="space-y-3">
        {joinRequests.map((request) => (
          <div 
            key={request.deviceId} 
            className="border border-secondary rounded p-2 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{request.deviceName}</p>
              <p className="text-xs text-gray-500">Device ID: {request.deviceId.substring(0, 8)}...</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => respondToJoinRequest(request.deviceId, true)}
                className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <FaCheck size={12} />
              </button>
              <button
                onClick={() => respondToJoinRequest(request.deviceId, false)}
                className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinRequests;