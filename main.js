const path = require('path');
const { app, BrowserWindow, Menu } = require('electron');

// Check if we in development mode.
const isDevMode = process.env.NODE_ENV !== 'production';
// Check if we on MacOS.
const isMacOS = process.platform === 'darwin';

// Function that creates an 'Main' window.
const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    title: 'ImageReziser',
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

// Function that creates an 'About' window.
const createAboutWindow = () => {
  const aboutWindow = new BrowserWindow({
    autoHideMenuBar: true,
    title: 'About ImageReziser',
    width: 360,
    height: 240
  });

  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
};

// Launches when app is ready.
app.on('ready', () => {
  createMainWindow();

  // Connect custom menu to app.
  Menu.setApplicationMenu(customMenu);

  // This part for MacOS.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    };
  });
});

// Implementation of custom window menu from our template.
const customMenu = Menu.buildFromTemplate([
  // This part for MacOS.
  ...(isMacOS
    ?
    [{
      label: app.name,
      submenu: [
        {
          label: 'About',
          click: createAboutWindow          
        },
      ]
    }]
    :
    []),

  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        // We can replace that function with integrated shortcut "role: 'quit'"  
        click: () => app.quit(),
        accelerator: 'Ctrl+Q',
      },
    ]
  },

  ...(!isMacOS
    ?
    [{
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: createAboutWindow             
        },
      ]
    }]
    :
    [])
]);

// This part for MacOS.
app.on('window-all-closed', () => {
  if (!isMacOS) {
    app.quit()
  };
});