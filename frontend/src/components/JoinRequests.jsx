import React, { useContext, useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const JoinRequests = () => {
  const { joinRequests, respondToJoinRequest, isRoot } = useContext(AppContext);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(() => {
    // Check if there are new join requests
    if (joinRequests.length > previousCount) {
      // Show notification
      toast.info(
        `New device join request: ${joinRequests[joinRequests.length - 1].deviceName}`, 
        { autoClose: false }
      );
      
      // Open the Electron window if available
      if (window.electron && window.electron.windowApi) {
        window.electron.windowApi.showWindow();
        
        // If notification API is available, call it too
        if (window.electron.notificationApi) {
          window.electron.notificationApi.newJoinRequest();
        }
      }
      
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(err => console.log('Audio play failed', err));
    }
    
    setPreviousCount(joinRequests.length);
  }, [joinRequests.length, previousCount]);
  
  if (!isRoot) return null;
  
  if (joinRequests.length === 0) {
    return null;
  }

  return (
    <>
      <ToastContainer position="top-right" />
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md shadow-md border-2 border-indigo-200 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mr-2 text-indigo-600"
            >
              <FaBell size={18} />
            </motion.div>
            <h3 className="font-semibold text-lg text-indigo-800">Join Requests</h3>
          </div>
          <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {joinRequests.length}
          </span>
        </div>
        
        <AnimatePresence>
          <div className="space-y-3">
            {joinRequests.map((request, index) => (
              <motion.div
                key={request.deviceId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="border-2 border-indigo-200 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{request.deviceName}</p>
                    <p className="text-xs text-gray-500">Device ID: {request.deviceId.substring(0, 12)}...</p>
                    <p className="text-xs text-indigo-500 mt-1">Waiting for approval</p>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => respondToJoinRequest(request.deviceId, true)}
                      className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-sm flex items-center justify-center transition-colors duration-200"
                      title="Approve"
                    >
                      <FaCheck size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => respondToJoinRequest(request.deviceId, false)}
                      className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm flex items-center justify-center transition-colors duration-200"
                      title="Reject"
                    >
                      <FaTimes size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default JoinRequests;