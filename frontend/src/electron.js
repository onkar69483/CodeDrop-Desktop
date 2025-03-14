const { app, BrowserWindow, Tray, Menu, ipcMain, clipboard, nativeImage, Notification } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 520,
    resizable: true,
    frame: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableWebContents: true,
    },
  });

  const startURL = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../../build/index.html')}`;

  mainWindow.loadURL(startURL);

  // Create tray and IPC handlers
  createTray();
  setupIpcHandlers();
}

function createTray() {
  // Use a simple tray icon
  const icon = nativeImage.createFromPath(path.join(__dirname, isDev ? '../public/icon.png' : '../build/icon.png')).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open CodeDrop', click: () => showAndFocusWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setToolTip('CodeDrop');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showAndFocusWindow();
    }
  });
}

function showAndFocusWindow() {
  // Show window and bring to front
  mainWindow.show();
  
  // Focus the window
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
  
  // Flash the window on Windows to get attention
  if (process.platform === 'win32') {
    mainWindow.flashFrame(true);
    setTimeout(() => mainWindow.flashFrame(false), 3000);
  }
}

function setupIpcHandlers() {
  ipcMain.handle('get-clipboard-text', () => {
    return clipboard.readText();
  });

  ipcMain.handle('set-clipboard-text', (event, text) => {
    if (typeof text === 'string' && text.trim() !== '') {
      clipboard.writeText(text);
      return 'Clipboard updated';
    } else {
      console.error('Invalid text received for clipboard:', text);
      return 'Invalid clipboard content';
    }
  });  
  
  ipcMain.on('show-window', () => {
    showAndFocusWindow();
  });

  ipcMain.on('hide-window', () => {
    mainWindow.hide();
  });
  
  // New handler for join requests
  ipcMain.on('new-join-request', () => {
    showAndFocusWindow();
    
    // Show a system notification if supported
    if (Notification.isSupported && Notification.isSupported()) {
      const notification = new Notification({
        title: 'CodeDrop',
        body: 'New device join request received!',
        icon: path.join(__dirname, isDev ? '../public/icon.png' : '../build/icon.png')
      });
      
      notification.show();
      
      notification.on('click', () => {
        showAndFocusWindow();
      });
    }
  });

  // Monitor clipboard changes
  let lastClipboardContent = clipboard.readText();
  
  setInterval(() => {
    const content = clipboard.readText();
    if (content !== lastClipboardContent) {
      lastClipboardContent = content;
      mainWindow.webContents.send('clipboard-changed', content);
    }
  }, 1000);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});