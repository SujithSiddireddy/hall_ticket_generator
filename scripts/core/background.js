// Background Management
// This module handles background image/PDF upload and transformations

// Initialize background upload handler
function initBackgroundHandler() {
  const bgUploadInput = document.getElementById("bgUpload");
  if (!bgUploadInput) return;

  bgUploadInput.addEventListener("change", handleBackgroundUpload);

  // Update button text on initialization
  updateBackgroundButtonText();
}

// Handle background button click
function handleBackgroundButton() {
  // Check if bgImage has a valid src (not empty and not just the page URL)
  const hasBackground = bgImage.src && bgImage.src !== '' && bgImage.src !== window.location.href;

  if (hasBackground) {
    // Background exists, select it for editing
    selectBackground();
  } else {
    // No background, trigger upload
    document.getElementById('bgUpload').click();
  }
}

// Update background button text based on whether background exists
function updateBackgroundButtonText() {
  const btnText = document.getElementById('backgroundBtnText');
  const btn = document.getElementById('backgroundBtn');
  if (!btnText || !btn) return;

  // Check if bgImage has a valid src (not empty and not just the page URL)
  const hasBackground = bgImage.src && bgImage.src !== '' && bgImage.src !== window.location.href;

  if (hasBackground) {
    btnText.textContent = 'Edit Background';
    btn.title = 'Edit Background';
  } else {
    btnText.textContent = 'Background';
    btn.title = 'Upload Background (PDF/Image)';
  }
}

// Handle background upload (PDF or Image)
async function handleBackgroundUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (fileExtension === 'pdf') {
    // Handle PDF file
    const reader = new FileReader();
    reader.onload = async function(event) {
      try {
        const typedArray = new Uint8Array(event.target.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;

        // Get first page
        const page = await pdf.getPage(1);

        // Set canvas size to match PDF page
        const viewport = page.getViewport({ scale: 1.5 }); // 1.5x for better quality
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;

        // Render PDF page to canvas
        const context = tempCanvas.getContext('2d');
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Convert canvas to image and set as background
        bgImage.src = tempCanvas.toDataURL('image/png');

        // Store original image dimensions for later use
        bgImage.dataset.originalWidth = viewport.width;
        bgImage.dataset.originalHeight = viewport.height;

        // Update button text
        updateBackgroundButtonText();
      } catch (error) {
        alert('Error loading PDF: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else if (['png', 'jpg', 'jpeg'].includes(fileExtension)) {
    // Handle image file
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        bgImage.src = event.target.result;

        // Store original image dimensions for later use
        bgImage.dataset.originalWidth = img.width;
        bgImage.dataset.originalHeight = img.height;

        // Update button text
        updateBackgroundButtonText();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Reset input
  e.target.value = "";
}

// Select background for editing
function selectBackground() {
  // Check if bgImage has a valid src (not empty and not just the page URL)
  const hasBackground = bgImage.src && bgImage.src !== '' && bgImage.src !== window.location.href;

  if (!hasBackground) {
    alert('Please upload a background image first.');
    return;
  }

  // Create a pseudo-element to represent background selection
  if (selectedEl) selectedEl.classList.remove('selected');
  selectedEl = { dataset: { type: 'bg-image' }, classList: { remove: () => {}, add: () => {} } };
  updatePropertiesPanel();
}

// Update background opacity
function updateBackgroundOpacity() {
  const opacityInput = document.getElementById('bgOpacity');
  const opacityValue = document.getElementById('opacityValue');
  const opacity = opacityInput.value / 100;

  bgTransform.opacity = opacity;
  bgImage.style.opacity = opacity;

  if (opacityValue) {
    opacityValue.textContent = opacityInput.value + '%';
  }
}

// Update background transform (scale, rotate)
function updateBackgroundTransform() {
  const scaleInput = document.getElementById('bgScale');
  const rotateInput = document.getElementById('bgRotate');
  const scaleValue = document.getElementById('scaleValue');
  const rotateValue = document.getElementById('rotateValue');

  bgTransform.scale = scaleInput.value / 100;
  bgTransform.rotate = rotateInput.value;

  if (scaleValue) {
    scaleValue.textContent = scaleInput.value + '%';
  }
  if (rotateValue) {
    rotateValue.textContent = rotateInput.value + '°';
  }

  applyBackgroundTransform();
}

// Flip background horizontally
function flipBackgroundH() {
  bgTransform.flipH *= -1;
  applyBackgroundTransform();
}

// Flip background vertically
function flipBackgroundV() {
  bgTransform.flipV *= -1;
  applyBackgroundTransform();
}

// Apply all transforms to background
function applyBackgroundTransform() {
  const transform = `
    scale(${bgTransform.scale * bgTransform.flipH}, ${bgTransform.scale * bgTransform.flipV})
    rotate(${bgTransform.rotate}deg)
  `;
  bgImage.style.transform = transform;
}

// Reset background transform
function resetBackgroundTransform() {
  bgTransform.scale = 1;
  bgTransform.rotate = 0;
  bgTransform.flipH = 1;
  bgTransform.flipV = 1;

  const scaleSlider = document.getElementById('bgScale');
  const rotateSlider = document.getElementById('bgRotate');
  const scaleValue = document.getElementById('scaleValue');
  const rotateValue = document.getElementById('rotateValue');

  if (scaleSlider) scaleSlider.value = 100;
  if (rotateSlider) rotateSlider.value = 0;
  if (scaleValue) scaleValue.textContent = '100%';
  if (rotateValue) rotateValue.textContent = '0°';

  applyBackgroundTransform();
}

// Resize canvas to match background image size
function resizeCanvasToBackground() {
  const width = parseInt(bgImage.dataset.originalWidth);
  const height = parseInt(bgImage.dataset.originalHeight);

  if (!width || !height) {
    alert('Background image dimensions not available.');
    return;
  }

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  document.getElementById('canvasWidth').value = width;
  document.getElementById('canvasHeight').value = height;
  document.getElementById('pageFormat').value = 'custom';
}

// Clear background function
function clearBackground() {
  bgImage.src = '';
  // Reset all state
  bgTransform = {
    scale: 1,
    rotate: 0,
    flipH: 1,
    flipV: 1,
    opacity: 1
  };

  bgImage.style.opacity = 1;
  bgImage.style.transform = '';

  // Update button text
  updateBackgroundButtonText();

  // Close properties panel if background was selected
  if (selectedEl && selectedEl.dataset && selectedEl.dataset.type === 'bg-image') {
    clearSelection();
  }
}

// Initialize drag-to-change for background property controls
function initBackgroundDragControls() {
  const dragControls = document.querySelectorAll('.property-drag-control');

  dragControls.forEach(control => {
    const inputId = control.dataset.input;
    const input = document.getElementById(inputId);
    if (!input) return;

    let isDragging = false;
    let startX = 0;
    let startValue = 0;

    control.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startValue = parseInt(input.value) || 0;

      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      e.preventDefault();

      const deltaX = e.clientX - startX;
      const step = parseInt(input.step) || 1;
      const min = parseInt(input.min) || 0;
      const max = parseInt(input.max) || 100;

      // Every 2 pixels of movement = 1 step
      const change = Math.round(deltaX / 2) * step;
      let newValue = startValue + change;

      // Clamp to min/max
      newValue = Math.max(min, Math.min(max, newValue));

      input.value = newValue;

      // Trigger the appropriate update function
      if (inputId === 'bgOpacity') {
        updateBackgroundOpacity();
      } else {
        updateBackgroundTransform();
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  });
}
