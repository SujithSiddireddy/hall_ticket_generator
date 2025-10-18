// Page Size Management
// This module handles canvas/page size configuration

// Update page size based on preset selection
function updatePageSize() {
  const formatSelect = document.getElementById('pageFormat');
  const widthInput = document.getElementById('canvasWidth');
  const heightInput = document.getElementById('canvasHeight');
  const selectedFormat = formatSelect.value;

  if (selectedFormat !== 'custom') {
    const preset = pageSizePresets[selectedFormat];
    widthInput.value = preset.width;
    heightInput.value = preset.height;
    widthInput.disabled = true;
    heightInput.disabled = true;
    updateCanvasSize();
  } else {
    widthInput.disabled = false;
    heightInput.disabled = false;
  }
}

// Update canvas size
function updateCanvasSize() {
  const width = parseInt(document.getElementById('canvasWidth').value);
  const height = parseInt(document.getElementById('canvasHeight').value);

  if (width >= 100 && width <= 3000 && height >= 100 && height <= 3000) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Wait for the CSS transition to complete before zooming to fit
    // Listen for transitionend event on the canvas
    const handleTransitionEnd = (e) => {
      // Only respond to width or height transitions on the canvas itself
      if ((e.propertyName === 'width' || e.propertyName === 'height') && e.target === canvas) {
        // Remove the listener to avoid multiple calls
        canvas.removeEventListener('transitionend', handleTransitionEnd);

        // Zoom to fit after transition completes
        if (typeof resetZoom === 'function') {
          resetZoom();
        }
      }
    };

    canvas.addEventListener('transitionend', handleTransitionEnd);
  }
}

// Initialize drag functionality for width and height inputs
function initCanvasSizeScroll() {
  const widthInput = document.getElementById('canvasWidth');
  const heightInput = document.getElementById('canvasHeight');

  if (widthInput) {
    initDragToChange(widthInput);
  }

  if (heightInput) {
    initDragToChange(heightInput);
  }
}

// Initialize drag-to-change for an input
function initDragToChange(input) {
  const label = input.closest('.input-label-inline').querySelector('.label-text');
  if (!label) return;

  let isDragging = false;
  let startX = 0;
  let startValue = 0;

  // Change cursor on hover
  label.style.cursor = 'ew-resize';

  label.addEventListener('mousedown', (e) => {
    // Don't allow dragging if input is disabled
    if (input.disabled) return;

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
    const step = parseInt(input.step) || 10;
    const min = parseInt(input.min) || 100;
    const max = parseInt(input.max) || 3000;

    // Every 2 pixels of movement = 1 step
    const change = Math.round(deltaX / 2) * step;
    let newValue = startValue + change;

    // Clamp to min/max
    newValue = Math.max(min, Math.min(max, newValue));

    input.value = newValue;
    updateCanvasSize();
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}
