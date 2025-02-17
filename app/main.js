const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const clipboardWatcher = require('electron-clipboard-extended');
const axios = require('axios');
const io = require('socket.io-client');
require('dotenv').config();
require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});


const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const socket = io(SERVER_URL);

let tray = null;
let win = null;

// Create the main window for the Electron app
function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
        },
    });

    win.loadFile('renderer/index.html');

    // Open dev tools for development (remove in production)
    win.webContents.openDevTools();
}

// Tray icon and background functionality
app.whenReady().then(() => {
    tray = new Tray('trayIcon.png'); // Tray icon
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('Clipboard Sync');
    tray.setContextMenu(contextMenu);

    createWindow();

    // Monitor Clipboard for Changes
    clipboardWatcher
        .startWatching()
        .on('text-changed', async () => {
            const text = clipboardWatcher.readText();
            if (text) {
                try {
                    console.log("📤 Sending clipboard data:", text);
                    await axios.post(`${SERVER_URL}/api/saveClipboard`, { text });
                } catch (err) {
                    console.error("❌ Error sending clipboard data:", err.message);
                }
            }
        });

    // Listen for Clipboard Updates from Other Devices
    socket.on('newClipboard', (text) => {
        console.log("📥 Received clipboard update:", text);
        clipboardWatcher.writeText(text);
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
