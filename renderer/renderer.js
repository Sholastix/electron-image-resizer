const image = document.querySelector('#image');
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

// Function for image loading.
const loadImage = (event) => {
  try {
    const file = event.target.files[0];
    console.log('SELECTED_FILE: ', file);
    console.log('IS_IMAGE: ', isImage(file));

    if (!isImage(file)) {
      console.log('Please select an image.');
      return;
    };

    // Display name of selected file in our form.
    filename.innerText = file.name;

    // Display initial dimensions of selected file.
    const image = new Image();
    image.src = URL.createObjectURL(file);
    
    image.onload = function () {
      widthInput.value = this.width,
      heightInput.value = this.height
    };
  
    console.log('SUCCESS!');
  } catch (err) {
    console.error(err);
  };
};

// Set event listener to image loading.
image.addEventListener('change', loadImage);