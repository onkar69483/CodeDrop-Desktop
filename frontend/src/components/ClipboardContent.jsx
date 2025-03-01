import React, { useState } from 'react';
import { useClipboard } from '../hooks/useClipboard';
import { FaCopy } from 'react-icons/fa';

const ClipboardContent = () => {
  const { clipboardContent, copyToClipboard, isLoading } = useClipboard();
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => {
    setEditedContent(clipboardContent);
    setIsEditing(true);
  };

  const saveChanges = async () => {
    if (await copyToClipboard(editedContent)) {
      setIsEditing(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Current Clipboard</h3>
        {!isEditing && (
          <button
            onClick={startEditing}
            className="text-xs text-primary hover:text-primary-dark"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-24 p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={cancelEditing}
              className="px-3 py-1 text-xs text-gray-600 bg-secondary rounded hover:bg-secondary-dark"
            >
              Cancel
            </button>
            <button
              onClick={saveChanges}
              disabled={isLoading}
              className="px-3 py-1 text-xs text-white bg-primary rounded hover:bg-primary-dark flex items-center"
            >
              <FaCopy className="mr-1" size={10} />
              {isLoading ? 'Saving...' : 'Save & Copy'}
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded p-2 bg-secondary-light min-h-16 max-h-32 overflow-y-auto text-sm">
          {clipboardContent ? (
            <p className="whitespace-pre-wrap break-words">{clipboardContent}</p>
          ) : (
            <p className="text-gray-400 italic">Clipboard is empty</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ClipboardContent;