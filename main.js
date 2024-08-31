const path = require('path');
const { app, BrowserWindow } = require('electron');

// Check if we on development mode.
const isDevMode = process.env.NODE_ENV !== 'production';
// Check if we on Mac.
const isMacOS = process.platform === 'darwin';

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    title: "ImageReziser",
    width: 720,
    height: 480
  });

  // Automatically open devTools if we in development mode.
  if (isDevMode) {
    mainWindow.webContents.openDevTools();
  };

  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
};

app.on('ready', () => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// This part just for MacOS.
app.on('window-all-closed', () => {
  if (!isMacOS) {
    app.quit()
  };
});