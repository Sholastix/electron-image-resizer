const os = require('os');
const path = require('path');
const jimp = require('jimp');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const { autoUpdater, AppUpdater } = require('electron-updater');

// Set environment.
process.env.NODE_ENV = 'production';

// Check if we in development mode.
const isDevMode = process.env.NODE_ENV !== 'production';

// Check if we on MacOS.
const isMacOS = process.platform === 'darwin';

let mainWindow;

// -------------------- APP AUTO-UPDATE FLAGS - START --------------------

// Disable update's auto-download (if new update available).
autoUpdater.autoDownload = false;
// Enable automatic install of downloaded update on app quit (basically, silent update).
autoUpdater.autoInstallOnAppQuit = true;

// -------------------- APP AUTO-UPDATE FLAGS - END --------------------

// Function that creates an 'Main' window.
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    title: 'ImageReziser',
    width: 720,
    height: 480,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
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
    height: 240,
    resizable: false
  });

  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
};

// Launches when app is ready.
app.on('ready', () => {
  createMainWindow();

  // This part for MacOS.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    };
  });

  // Connect custom menu to app.
  Menu.setApplicationMenu(customMenu);

  // Check for updates on our GitHub repository.
  // autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.checkForUpdates();

  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('checking-for-update');
  });

  // autoUpdater.on('update-downloaded', () => {
  
  //   mainWindow.webContents.send('update-downloaded');
  // });

  // autoUpdater.on('update-available', () => {});
  // autoUpdater.on('update-not-available', () => {});
  // autoUpdater.on('download-progress', () => {});
  // autoUpdater.on('update-cancelled', () => {});
  // autoUpdater.on('error', () => {});

  // Remove main window from memory on close (to prevent memory leak).
  mainWindow.on('closed', () => {
    mainWindow = null
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
    []),

  ...(isDevMode
    ? [
      {
        label: 'Developer',
        submenu: [
          { role: 'reload' },
          { role: 'forcereload' },
          { type: 'separator' },
          { role: 'toggledevtools' },
        ],
      },
    ]
    : []),
]);

// Function to resize image.
const resizeImage = async (options) => {
  try {
    // Get the image.
    const image = await jimp.read(options.imgPath);
    // Resize image.
    image.resize(Number(options.width), Number(options.height));
    // Get the original filename of an image.
    const originalFilename = path.basename(options.imgPath);
    // Create new filename for resized image.
    const newName = originalFilename.split('.')[0] + '_' + `${options.width}x${options.height}` + '.' + originalFilename.split('.')[1];
    // Save resized image with new filename.
    image.write(options.destination + `/${newName}`);
    // Send 'success' event to the renderer.
    mainWindow.webContents.send('done');
    // Open destination folder with saved image (we can do this with "electron" built-in module 'shell').
    shell.showItemInFolder(options.destination + `/${newName}`);
  } catch (err) {
    console.error(err);
  };
};

// Response to ipcRenderer resize event.
ipcMain.on('resize', (event, options) => {
  // Here we adding final destination for resized image to 'options' object.
  options.destination = path.join(os.homedir(), 'ImageReziser');
  resizeImage(options);
});

// This part for MacOS.
app.on('window-all-closed', () => {
  if (!isMacOS) {
    app.quit()
  };
});