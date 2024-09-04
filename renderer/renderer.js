const img = document.querySelector('#img');
const form = document.querySelector('#form');
const widthInput = document.querySelector('#width');
const heightInput = document.querySelector('#height');
const filename = document.querySelector('#filename');
const outputPath = document.querySelector('#output-path');

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
      duration: 5000,
      close: false, // show or hide 'close' button.
      style: {
        backgroundColor: 'red',
        color: 'white',
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
      duration: 5000,
      close: false,
      style: {
        backgroundColor: 'green',
        color: 'white',
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

    const width = widthInput.value;
    const height = heightInput.value;
    // Get path to source file.
    const imgPath = electron.pathToFile(img.files[0]);

    if (width === '' || height === '') {
      alertError('Width and height are required.');
      return;
    };

    // Send image data to main process with ipcRenderer.
    ipcRenderer.send('resize', {
      imgPath,
      width,
      height
    });
  } catch (err) {
    console.error(err);
  };
};

// Set event listener to image loading.
img.addEventListener('change', loadImage);

// Set event listener to submit image for resizing.
form.addEventListener('submit', sendImage);