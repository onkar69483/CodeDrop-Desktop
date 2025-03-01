import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export function useClipboard() {
  const [clipboardContent, setClipboardContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { syncClipboard, isSyncEnabled, lastSyncedContent } = useContext(AppContext);

  useEffect(() => {
    const fetchClipboardContent = async () => {
      try {
        const text = await window.electron.clipboardApi.getClipboardText();
        setClipboardContent(text);
      } catch (error) {
        console.error('Error reading clipboard:', error);
      }
    };

    fetchClipboardContent();

    // Set up a listener for clipboard changes
    if (window.electron.clipboardApi.onClipboardChange) {
      window.electron.clipboardApi.onClipboardChange((content) => {
        setClipboardContent(content);
      });
    }

    return () => {
      if (window.electron.clipboardApi.removeClipboardListener) {
        window.electron.clipboardApi.removeClipboardListener();
      }
    };
  }, []);

  // Update when lastSyncedContent changes
  useEffect(() => {
    if (lastSyncedContent) {
      setClipboardContent(lastSyncedContent);
    }
  }, [lastSyncedContent]);

  const copyToClipboard = async (text) => {
    setIsLoading(true);
    try {
      await window.electron.clipboardApi.setClipboardText(text);
      setClipboardContent(text);
      
      if (isSyncEnabled) {
        await syncClipboard(text);
      }
      
      return true;
    } catch (error) {
      console.error('Error writing to clipboard:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    clipboardContent,
    copyToClipboard,
    isLoading
  };
}