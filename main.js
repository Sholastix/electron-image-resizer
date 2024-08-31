const path = require('path');
const { app, BrowserWindow, Menu } = require('electron');

// Check if we in development mode.
const isDevMode = process.env.NODE_ENV !== 'production';
// Check if we on Mac.
const isMacOS = process.platform === 'darwin';

// function that creates a window.
const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    // titleBarStyle: "hidden",
    title: "ImageReziser",
    width: 720,
    height: 480
  });

  // Automatically opens devTools if we in development mode.
  if (isDevMode) {
    mainWindow.webContents.openDevTools();
  };

  // Load file that will be opened in 'electron' window.
  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
};

// Launches when app is ready.
app.on('ready', () => {
  createMainWindow();

  // Custom window menu implementation.
  const customMenu = Menu.buildFromTemplate(menu);

  // Connect custom menu to app.
  Menu.setApplicationMenu(customMenu);

  // This part for MacOS.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    };
  });
});

// Custom window menu template.
const menu = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        click: () => app.quit(),
        accelerator: 'Ctrl+Q'
      },
    ]
  },
]

// This part for MacOS.
app.on('window-all-closed', () => {
  if (!isMacOS) {
    app.quit()
  };
});