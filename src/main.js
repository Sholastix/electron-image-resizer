require('dotenv').config();
const os = require('os');
const path = require('path');
const jimp = require('jimp');
const log = require('electron-log');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');

// Check if we in development mode.
const isDevMode = !app.isPackaged;

// Check if we on MacOS.
const isMacOS = process.platform === 'darwin';

// Change path to log file in development mode.
if (isDevMode) {
  log.transports.file.resolvePathFn = () => path.join(process.env.APP_PATH, 'logs/main.log');
};

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
    show: false, // Don't display the window immediately after it is created.
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load file that will be opened in 'electron' window.
  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));

  // Connect custom menu to app.
  Menu.setApplicationMenu(customMenuBar);

  // Automatically opens devTools if we in development mode.
  if (isDevMode) {
    mainWindow.webContents.openDevTools();
  };

  // Connect context menu to app.
  mainWindow.webContents.on('context-menu', () => {
    customContextMenu.popup(mainWindow.webContents);
  });

  // Display the window (mainWindow.show) and automatic check for updates on our GitHub repository.
  mainWindow.once('ready-to-show', mainWindow.show);

  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
    log.info('Checking for update...');
    mainWindow.webContents.send('checking-for-update');
  });
};

// Function that creates an 'About' window.
const createAboutWindow = () => {
  const aboutWindow = new BrowserWindow({
    autoHideMenuBar: true,
    title: 'About ImageReziser',
    width: 360,
    height: 240,
    resizable: false,
    show: false,
  });

  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));

  aboutWindow.once('ready-to-show', aboutWindow.show);
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

  // Remove main window from memory on close (to prevent memory leak).
  mainWindow.on('closed', () => {
    mainWindow = null
  });
});

// -------------------- APP AUTO-UPDATE EVENTS - START --------------------

// Catch update status events from autoUpdater and send corresponding events to renderer (display notifications). 
autoUpdater.on('update-not-available', () => {
  log.info('ImageResizer is up to date.');
  mainWindow.webContents.send('update-not-available');
});

autoUpdater.on('update-available', () => {
  log.info('Update available. Download now?');
  mainWindow.webContents.send('update-available');

  ipcMain.handle('update-choice', (event, options) => {
    if (options === 'yes') {
      autoUpdater.downloadUpdate();
      log.info('Download accepted.');

      autoUpdater.on('download-progress', (info) => {
        log.info(`Progress: ${info.percent.toFixed(2)}%`);
        mainWindow.webContents.send('download-progress', info.percent.toFixed(2));
      });

      autoUpdater.on('update-downloaded', () => {
        log.info('Update downloaded and will be installed on app quit.');
        mainWindow.webContents.send('update-downloaded');
      });
    } else {
      log.info('Download rejected.');
      mainWindow.webContents.send('download-decline');
    };
  });
});

autoUpdater.on('error', (err) => {
  log.error('Auto-update error: ' + err);
});

// autoUpdater.on('update-cancelled', () => {});

// -------------------- APP AUTO-UPDATE EVENTS - END --------------------

// Implementation of custom window menu from our template.
const customMenuBar = Menu.buildFromTemplate([
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
    ?
    [
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
    :
    []),
]);

// Implementation of custom context menu from our template.
const customContextMenu = Menu.buildFromTemplate([
  {
    label: 'Options',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ]
  },
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

// Response to ipcRenderer 'resize' event from "renderer.js".
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