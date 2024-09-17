const img = document.querySelector('#img');
const form = document.querySelector('#form');
const widthInput = document.querySelector('#width');
const heightInput = document.querySelector('#height');
const filename = document.querySelector('#filename');
const outputPath = document.querySelector('#output-path');

// Update dialog variables.
const closeButton = document.querySelector('#close-button');
const message = document.querySelector('#message');
const restartButton = document.querySelector('#restart-button');
const updateNotification = document.querySelector('#update-notification');

// Function to check if selected file is image.
const isImage = (file) => {
  try {
    const allowedFileTypes = ['image/gif', 'image/png', 'image/jpeg'];
    return file && allowedFileTypes.includes(file['type']);
  } catch (err) {
    console.error(err);
  };
};

// Function to display alerts.
const alertError = (message) => {
  try {
    Toastify.toast({
      text: message,
      duration: 3000,
      close: false, // show or hide 'close' button.
      style: {
        backgroundColor: 'red',
        color: 'white',
        fontSize: '1.6rem',
        padding: '0.5rem',
        textAlign: 'center'
      },
    });
  } catch (err) {
    console.error(err);
  };
};

const alertSuccess = (message) => {
  try {
    Toastify.toast({
      text: message,
      duration: 3000,
      close: false,
      style: {
        backgroundColor: 'green',
        color: 'white',
        fontSize: '1.6rem',
        padding: '0.5rem',
        textAlign: 'center'
      },
    });
  } catch (err) {
    console.error(err);
  };
};

// Load image.
const loadImage = (event) => {
  try {
    const file = event.target.files[0];

    if (!isImage(file)) {
      alertError('Please select an image.');
      return;
    };

    // Display name of selected file in our form.
    filename.innerText = file.name;
    // Display output path for modified file.
    outputPath.innerText = path.join(os.homedir(), 'ImageResizer');

    // Display initial dimensions of selected file.
    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = function () {
      widthInput.value = this.width,
      heightInput.value = this.height
    };
  } catch (err) {
    console.error(err);
  };
};

// Send image for resizing.
const sendImage = (event) => {
  try {
    event.preventDefault();

    if (!img.files[0]) {
      alertError('Please upload an image first.');
      return;
    };

    // Get path to source file.
    const imgPath = electron.pathToFile(img.files[0]);
    const width = widthInput.value;
    const height = heightInput.value;

    if (width === '' || height === '') {
      alertError('Width and height are required.');
      return;
    };

    // Send image data to main process with ipcRenderer.
    ipcRenderer.send('resize', {
      imgPath,
      width,
      height,
    });

    // Catch 'success' event from the 'resizeImage()' function of the main process.
    ipcRenderer.on('done', () => {
      // Display alert to user.
      alertSuccess('Image resized.');
      // Remove event listener (to prevent 'alertSuccess' messages multiplying).
      ipcRenderer.removeAllListeners('done');
    });
  } catch (err) {
    console.error(err);
  };
};

// Display auto-update status notifications (catch update status events from main process).
ipcRenderer.on('checking-for-update', () => {
  message.innerText = 'Checking for update...';
  updateNotification.classList.remove('hidden');
  // ipcRenderer.removeAllListeners('checking-for-update');
});

ipcRenderer.on('update-not-available', () => {
  message.innerText = '\'ImageResize\' is up to date.';
  updateNotification.classList.remove('hidden');
  // ipcRenderer.removeAllListeners('update-not-available');
});

ipcRenderer.on('update-available', () => {
  message.innerText = 'Update available.';
  updateNotification.classList.remove('hidden');
  // ipcRenderer.removeAllListeners('update-available');
});

ipcRenderer.on('download-progress', (percent) => {
  message.innerText = `Downloading: ${percent}`;
  updateNotification.classList.remove('hidden');
  // ipcRenderer.removeAllListeners('download-progress');
});

ipcRenderer.on('update-downloaded', () => {
  message.innerText = 'Update downloaded. Changes will be applied after restart.';
  restartButton.classList.remove('hidden');
  updateNotification.classList.remove('hidden');
  // ipcRenderer.removeAllListeners('update-downloaded');
});

// Set event listener to image loading.
img.addEventListener('change', loadImage);

// Set event listener to submit image for resizing.
form.addEventListener('submit', sendImage);