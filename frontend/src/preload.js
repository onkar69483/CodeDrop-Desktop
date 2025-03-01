const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  clipboardApi: {
    getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
    setClipboardText: (text) => ipcRenderer.invoke('set-clipboard-text', text),
    onClipboardChange: (callback) => {
      ipcRenderer.on('clipboard-changed', (_, content) => callback(content));
    },
    removeClipboardListener: () => {
      ipcRenderer.removeAllListeners('clipboard-changed');
    }
  },
  windowApi: {
    showWindow: () => ipcRenderer.send('show-window'),
    hideWindow: () => ipcRenderer.send('hide-window')
  }
});