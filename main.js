const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 660,
    transparent: true,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler for "Stay on Top" toggle
ipcMain.on('toggle-always-on-top', (event, isAlwaysOnTop) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  }
});

// IPC Handler to close app safely
ipcMain.on('close-app', () => {
  app.quit();
});
