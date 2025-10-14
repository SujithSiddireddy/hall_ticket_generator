// Hall Ticket Visual Designer JavaScript

const canvas = document.getElementById("canvas");
const bgImage = document.getElementById("bgImage");
let currentDrag = null, resizing = null, offsetX = 0, offsetY = 0;
let selectedEl = null;
let selectedElements = []; // Array to hold multiple selected elements
let csvHeaders = []; // Store CSV headers for dynamic field population

// Grid and snap settings
let showGrid = true;
let snapToGrid = true;
let gridSize = 5;

// Mouse position tracking
let mouseX = 0;
let mouseY = 0;

// Selection box state
let selectionBox = null;
let isSelecting = false;
let selectionStartX = 0;
let selectionStartY = 0;

// Page size presets (in pixels - adjusted for grid alignment)
// Using grid-friendly dimensions that are close to actual A4 sizes
const pageSizePresets = {
  'default': { width: 800, height: 560 },        // ~Half A4 (grid-friendly: 40x28 cells at 20px)
  'a4': { width: 800, height: 1120 },            // ~A4 Portrait (grid-friendly: 40x56 cells at 20px)
  'a4-landscape': { width: 1120, height: 800 },  // ~A4 Landscape (grid-friendly: 56x40 cells at 20px)
  'custom': { width: 900, height: 600 }          // Custom size
};

// Initialize grid on load
window.addEventListener('DOMContentLoaded', () => {
  canvas.classList.add('show-grid');

  // Set up PDF.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
});
function placeCaretAtEnd(el){
  try{
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }catch(err){ /* noop */ }
}


// Simplified toolbar state (no longer needed for sidebar)
function updateToolbarState(){
  // This function is kept for compatibility but no longer updates sidebar controls
  // Properties panel handles all element-specific controls now
}

// Picture upload handler (hidden input)
document.getElementById("pictureUpload").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      // Create a wrapper div for the image

      const wrapper = document.createElement("div");
      wrapper.className = "picture";
      wrapper.dataset.type = "picture";
      wrapper.style.left = snapValue(mouseX || 50) + "px";
      wrapper.style.top = snapValue(mouseY || 50) + "px";
      wrapper.style.width = "200px";
      wrapper.style.height = "150px";
      wrapper.style.position = "absolute";

      // Create the actual image element
      const img = document.createElement("img");
      img.src = ev.target.result;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.pointerEvents = "none"; // Prevent image from interfering with drag

      wrapper.appendChild(img);
      makeDraggable(wrapper);
      makeResizable(wrapper);
      addLockButton(wrapper);
      canvas.appendChild(wrapper);
      updateZIndexes();
      selectElement(wrapper);
    };
    reader.readAsDataURL(file);
  }
  // Reset input so same file can be selected again
  e.target.value = "";
});

// Background upload handler (PDF or Image)
document.getElementById("bgUpload").addEventListener("change", async (e) => {
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

        // Update canvas size to match PDF
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        document.getElementById('canvasWidth').value = Math.round(viewport.width);
        document.getElementById('canvasHeight').value = Math.round(viewport.height);
        document.getElementById('pageFormat').value = 'custom';
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

        // Update canvas size to match image
        canvas.style.width = img.width + 'px';
        canvas.style.height = img.height + 'px';
        document.getElementById('canvasWidth').value = img.width;
        document.getElementById('canvasHeight').value = img.height;
        document.getElementById('pageFormat').value = 'custom';
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Reset input
  e.target.value = "";
});

// Background transform state
let bgTransform = {
  scale: 1,
  rotate: 0,
  flipH: 1,
  flipV: 1,
  opacity: 1
};

// Select background for editing
function selectBackground() {
  if (!bgImage.src) {
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
  const opacitySlider = document.getElementById('bgOpacity');
  const opacityValue = document.getElementById('opacityValue');
  const opacity = opacitySlider.value / 100;

  bgTransform.opacity = opacity;
  bgImage.style.opacity = opacity;
  opacityValue.textContent = opacitySlider.value + '%';
}

// Update background transform (scale, rotate)
function updateBackgroundTransform() {
  const scaleSlider = document.getElementById('bgScale');
  const scaleValue = document.getElementById('scaleValue');
  const rotateSlider = document.getElementById('bgRotate');
  const rotateValue = document.getElementById('rotateValue');

  bgTransform.scale = scaleSlider.value / 100;
  bgTransform.rotate = rotateSlider.value;

  scaleValue.textContent = scaleSlider.value + '%';
  rotateValue.textContent = rotateSlider.value + '°';

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

  // Close properties panel if background was selected
  if (selectedEl && selectedEl.dataset && selectedEl.dataset.type === 'bg-image') {
    clearSelection();
  }
}

// Layout file upload handler
document.getElementById("layoutFile").addEventListener("change", loadLayout);

// Data file upload handler - populate field selector (supports CSV and Excel)
document.getElementById("csvFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (fileExtension === 'csv') {
    // Parse CSV file
    Papa.parse(file, {
      header: true,
      preview: 1, // Only parse first row to get headers
      complete: function(results) {
        if (results.meta && results.meta.fields) {
          csvHeaders = results.meta.fields;
          populateFieldSelector();
        }
      }
    });
  } else if (['xlsx', 'xls', 'xlsm'].includes(fileExtension)) {
    // Parse Excel file
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});

        if (jsonData.length > 0) {
          // First row contains headers
          csvHeaders = jsonData[0].filter(h => h !== undefined && h !== null && h !== '');
          populateFieldSelector();
        }
      } catch (error) {
        alert('Error reading Excel file: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
  }
});

// Populate field selector dropdown with CSV headers
function populateFieldSelector() {
  const selector = document.getElementById("fieldSelector");
  selector.innerHTML = ""; // Clear existing options

  if (csvHeaders.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Upload CSV first";
    selector.appendChild(option);
    selector.disabled = true;
  } else {
    selector.disabled = false;
    csvHeaders.forEach(header => {
      const option = document.createElement("option");
      option.value = header;
      option.textContent = header;
      selector.appendChild(option);
    });
  }
}

// Make elements draggable
function makeDraggable(el) {
  el.addEventListener("mousedown", e => {
    // Don't drag if clicking on lock button
    if (e.target.classList.contains("lock-btn")) {
      return;
    }

    // Don't drag if element is locked
    if (el.classList.contains("locked")) {
      // Support Ctrl/Cmd+click for multi-select even on locked elements
      const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
      selectElement(el, isMultiSelect);
      return;
    }

    // Don't drag if clicking on table resize handles
    if (e.target.classList.contains("table-col-resize-handle") ||
        e.target.classList.contains("table-row-resize-handle")) {
      return;
    }

    // Support Ctrl/Cmd+click for multi-select
    const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
    selectElement(el, isMultiSelect);

    if (e.target.classList.contains("resize-handle")) return;
    if (el.isContentEditable && document.activeElement === el) return; // Don't drag while actively editing text

    // If multiple elements selected, prepare to drag all of them
    if (selectedElements.length > 1) {
      currentDrag = el;
      offsetX = e.offsetX;
      offsetY = e.offsetY;

      // Store initial positions of all selected elements
      selectedElements.forEach(elem => {
        elem.dataset.dragStartLeft = elem.style.left;
        elem.dataset.dragStartTop = elem.style.top;
      });
    } else {
      currentDrag = el;
      offsetX = e.offsetX;
      offsetY = e.offsetY;
    }
  });
}

// Make elements resizable
function makeResizable(el) {
  const handle = document.createElement("div");
  handle.className = "resize-handle";
  el.appendChild(handle);

  handle.addEventListener("mousedown", e => {
    e.stopPropagation();
    // Don't resize if element is locked
    if (el.classList.contains("locked")) return;

    resizing = {
      el,
      startX: e.clientX,
      startY: e.clientY,
      startW: el.offsetWidth,
      startH: el.offsetHeight

    };
  });
}

// Add lock button to element
function addLockButton(el) {
  const lockBtn = document.createElement("div");
  lockBtn.className = "lock-btn";
  lockBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6H9V4C9 2.34 7.66 1 6 1C4.34 1 3 2.34 3 4V6H2C1.45 6 1 6.45 1 7V12C1 12.55 1.45 13 2 13H10C10.55 13 11 12.55 11 12V7C11 6.45 10.55 6 10 6ZM6 10C5.45 10 5 9.55 5 9C5 8.45 5.45 8 6 8C6.55 8 7 8.45 7 9C7 9.55 6.55 10 6 10ZM7.1 6H4.9V4C4.9 3.39 5.39 2.9 6 2.9C6.61 2.9 7.1 3.39 7.1 4V6Z" fill="currentColor" stroke="currentColor" stroke-width="0.3"/>
  </svg>`;
  lockBtn.title = "Lock element";

  lockBtn.addEventListener("click", e => {
    e.stopPropagation();
    toggleLock(el, lockBtn);
  });

  el.appendChild(lockBtn);
}

// Toggle lock state
function toggleLock(el, lockBtn) {
  const isLocked = el.classList.toggle("locked");

  if (isLocked) {
    // Locked icon - closed lock
    lockBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6H9V4C9 2.34 7.66 1 6 1C4.34 1 3 2.34 3 4V6H2C1.45 6 1 6.45 1 7V12C1 12.55 1.45 13 2 13H10C10.55 13 11 12.55 11 12V7C11 6.45 10.55 6 10 6ZM6 10C5.45 10 5 9.55 5 9C5 8.45 5.45 8 6 8C6.55 8 7 8.45 7 9C7 9.55 6.55 10 6 10ZM7.1 6H4.9V4C4.9 3.39 5.39 2.9 6 2.9C6.61 2.9 7.1 3.39 7.1 4V6Z" fill="currentColor"/>
    </svg>`;
    lockBtn.classList.add("locked-state");
    lockBtn.title = "Unlock element";
  } else {
    // Unlocked icon - open lock
    lockBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6H9V4C9 2.34 7.66 1 6 1C4.34 1 3 2.34 3 4H4.9C4.9 3.39 5.39 2.9 6 2.9C6.61 2.9 7.1 3.39 7.1 4V6H2C1.45 6 1 6.45 1 7V12C1 12.55 1.45 13 2 13H10C10.55 13 11 12.55 11 12V7C11 6.45 10.55 6 10 6ZM6 10C5.45 10 5 9.55 5 9C5 8.45 5.45 8 6 8C6.55 8 7 8.45 7 9C7 9.55 6.55 10 6 10Z" fill="currentColor" stroke="currentColor" stroke-width="0.3"/>
    </svg>`;
    lockBtn.classList.remove("locked-state");
    lockBtn.title = "Lock element";
  }
}

// Page size management functions
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

function updateCanvasSize() {
  const width = parseInt(document.getElementById('canvasWidth').value);
  const height = parseInt(document.getElementById('canvasHeight').value);

  if (width >= 100 && width <= 3000 && height >= 100 && height <= 3000) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }
}

// Calculate element area for z-index sorting
function getElementArea(el) {
  const width = el.offsetWidth || 0;
  const height = el.offsetHeight || 0;
  return width * height;
}

// Update z-index for all elements based on size (larger = lower z-index)
function updateZIndexes() {
  const elements = Array.from(canvas.children).filter(el =>
    el !== bgImage &&
    (el.classList.contains('field') ||
     el.classList.contains('text') ||
     el.classList.contains('rect') ||
     el.classList.contains('line') ||
     el.classList.contains('table') ||
     el.classList.contains('picture'))
  );

  // Sort by area (largest first)
  elements.sort((a, b) => getElementArea(b) - getElementArea(a));

  // Assign z-index: larger elements get lower z-index
  elements.forEach((el, index) => {
    el.style.zIndex = index + 1;
  });
}

// Selection helpers
function selectElement(el, addToSelection = false){
  if (!addToSelection) {
    // Single selection - clear previous
    if (selectedEl) selectedEl.classList.remove('selected');
    selectedElements.forEach(elem => elem.classList.remove('selected'));
    selectedElements = [];
    selectedEl = el || null;
    if (selectedEl) {
      selectedEl.classList.add('selected');
      selectedElements = [selectedEl];
    }
  } else {
    // Multi-selection - add to existing
    if (el && !selectedElements.includes(el)) {
      el.classList.add('selected');
      selectedElements.push(el);
      selectedEl = el; // Keep track of last selected
    }
  }
  updateToolbarState();
  updatePropertiesPanel();
}

function clearSelection(){
  if (selectedEl) selectedEl.classList.remove('selected');
  selectedElements.forEach(elem => elem.classList.remove('selected'));
  selectedEl = null;
  selectedElements = [];
  updateToolbarState();
  closePropertiesPanel();
}

// Click on empty canvas/bg clears selection or starts selection box
canvas.addEventListener('mousedown', e => {
  if (e.target === canvas || e.target === bgImage) {
    // Don't start selection if we're already dragging or resizing
    if (currentDrag || resizing) return;

    // Clear selection if not holding Shift
    if (!e.shiftKey) {
      clearSelection();
    }

    // Start selection box
    const rect = canvas.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(canvas);
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;

    selectionStartX = e.clientX - rect.left - borderLeft;
    selectionStartY = e.clientY - rect.top - borderTop;
    isSelecting = true;

    // Create selection box element
    if (!selectionBox) {
      selectionBox = document.createElement('div');
      selectionBox.className = 'selection-box';
      canvas.appendChild(selectionBox);
    }

    selectionBox.style.left = selectionStartX + 'px';
    selectionBox.style.top = selectionStartY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  const ae = document.activeElement;
  const isEditing = ae && (ae.isContentEditable || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA');
  if (isEditing) return; // Let typing/editing handle keys normally

  // Don't intercept browser shortcuts (Cmd/Ctrl + key)
  if (e.metaKey || e.ctrlKey) return;

  // Shortcuts for adding elements (work without selection)
  // t = text, T = table, r = rectangle, p = picture
  if (e.key === 't' && !e.shiftKey) {
    e.preventDefault();
    addText();
    return;
  }
  else if (e.key === 'T' && e.shiftKey) {
    e.preventDefault();
    addTable();
    return;
  }
  else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    addRectangle();
    return;
  }
  else if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    addPicture();
    return;
  }

  // Handle 'l' key - context-dependent
  // If element selected: Lock
  // If no element selected: Add Line
  if (e.key === 'l' || e.key === 'L') {
    e.preventDefault();
    if (selectedEl) {
      // Lock the selected element
      const lockBtn = selectedEl.querySelector('.lock-btn');
      if (lockBtn && !selectedEl.classList.contains('locked')) {
        toggleLock(selectedEl, lockBtn);
      }
    } else {
      // Add line
      addLine();
    }
    return;
  }

  // Shortcuts that require selection
  if (!selectedEl) return;

  // Arrow keys move selected element(s)
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();

    // Determine move distance (hold Shift for larger steps)
    const moveDistance = e.shiftKey ? gridSize * 2 : gridSize;

    // Move all selected elements
    const elementsToMove = selectedElements.length > 0 ? selectedElements : [selectedEl];

    elementsToMove.forEach(elem => {
      // Don't move if locked
      if (elem.classList.contains('locked')) return;

      const currentLeft = parseFloat(elem.style.left) || 0;
      const currentTop = parseFloat(elem.style.top) || 0;

      if (e.key === 'ArrowUp') {
        elem.style.top = snapValue(currentTop - moveDistance) + "px";
      }
      else if (e.key === 'ArrowDown') {
        elem.style.top = snapValue(currentTop + moveDistance) + "px";
      }
      else if (e.key === 'ArrowLeft') {
        elem.style.left = snapValue(currentLeft - moveDistance) + "px";
      }
      else if (e.key === 'ArrowRight') {
        elem.style.left = snapValue(currentLeft + moveDistance) + "px";
      }
    });
  }
  // Delete / Backspace removes selected element(s)
  else if (e.key === 'Delete' || e.key === 'Backspace'){
    e.preventDefault();
    // Delete all selected elements
    if (selectedElements.length > 0) {
      selectedElements.forEach(elem => elem.remove());
      selectedElements = [];
      selectedEl = null;
    } else if (selectedEl) {
      selectedEl.remove();
      selectedEl = null;
    }
    updateToolbarState();
    closePropertiesPanel();
  }
  // Escape clears selection
  else if (e.key === 'Escape'){
    clearSelection();
  }
  // U unlocks the selected element
  else if (e.key === 'u' || e.key === 'U'){
    e.preventDefault();
    const lockBtn = selectedEl.querySelector('.lock-btn');
    if (lockBtn && selectedEl.classList.contains('locked')) {
      toggleLock(selectedEl, lockBtn);
    }
  }
});

// Toolbar action for mouse users
function deleteSelected(){
  // Delete all selected elements
  if (selectedElements.length > 0) {
    selectedElements.forEach(elem => elem.remove());
    selectedElements = [];
    selectedEl = null;
  } else if (selectedEl) {
    selectedEl.remove();
    selectedEl = null;
  }
  updateToolbarState();
  closePropertiesPanel();
}

// Snap to grid helper function
function snapValue(value) {
  if (!snapToGrid) return value;
  // Use parseFloat to handle decimal values, then round to nearest grid line
  const numValue = parseFloat(value);
  return Math.round(numValue / gridSize) * gridSize;
}

// Track mouse position over canvas
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(canvas);
  const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
  const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;

  mouseX = e.clientX - rect.left - borderLeft;
  mouseY = e.clientY - rect.top - borderTop;
});

// Mouse move handler for dragging, resizing, and selection box
document.addEventListener("mousemove", e => {
  if (currentDrag) {
    const rect = canvas.getBoundingClientRect();
    // Get computed border width to account for it precisely
    const computedStyle = window.getComputedStyle(canvas);
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;

    let left = e.clientX - rect.left - offsetX - borderLeft;
    let top = e.clientY - rect.top - offsetY - borderTop;

    // If multiple elements selected, move all of them
    if (selectedElements.length > 1) {
      const deltaX = left - parseFloat(currentDrag.style.left);
      const deltaY = top - parseFloat(currentDrag.style.top);

      selectedElements.forEach(elem => {
        if (!elem.classList.contains('locked')) {
          const currentLeft = parseFloat(elem.style.left) || 0;
          const currentTop = parseFloat(elem.style.top) || 0;
          elem.style.left = (currentLeft + deltaX) + "px";
          elem.style.top = (currentTop + deltaY) + "px";
        }
      });
    } else {
      currentDrag.style.left = left + "px";
      currentDrag.style.top = top + "px";
    }
  } else if (resizing) {
    const dx = e.clientX - resizing.startX;
    const dy = e.clientY - resizing.startY;

    // For line elements, only change width (length), keep height (thickness) fixed
    if (resizing.el.classList.contains("line")) {
      let newW = Math.max(20, resizing.startW + dx);
      resizing.el.style.width = newW + "px";
      // Don't change height for lines
    } else {
      let newW = Math.max(20, resizing.startW + dx);
      let newH = Math.max(10, resizing.startH + dy);

      resizing.el.style.width = newW + "px";
      resizing.el.style.height = newH + "px";

      // Sync table inner size
      if (resizing.el.classList.contains("table")) {
        const tbl = resizing.el.querySelector("table");
        tbl.style.width = "100%";
        tbl.style.height = "100%";
      }
    }
  } else if (isSelecting && selectionBox) {
    // Update selection box dimensions
    const rect = canvas.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(canvas);
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;

    const currentX = e.clientX - rect.left - borderLeft;
    const currentY = e.clientY - rect.top - borderTop;

    const width = Math.abs(currentX - selectionStartX);
    const height = Math.abs(currentY - selectionStartY);
    const left = Math.min(currentX, selectionStartX);
    const top = Math.min(currentY, selectionStartY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  }
});

// Mouse up handler - apply snap here and complete selection
document.addEventListener("mouseup", () => {
  // Apply snap to grid when releasing drag
  if (currentDrag && snapToGrid) {
    const currentLeft = parseFloat(currentDrag.style.left) || 0;
    const currentTop = parseFloat(currentDrag.style.top) || 0;
    currentDrag.style.left = snapValue(currentLeft) + "px";
    currentDrag.style.top = snapValue(currentTop) + "px";
  }

  // Apply snap to grid when releasing resize
  if (resizing && snapToGrid) {
    const currentWidth = parseFloat(resizing.el.style.width) || 0;
    resizing.el.style.width = snapValue(currentWidth) + "px";

    // Only snap height for non-line elements
    if (!resizing.el.classList.contains("line")) {
      const currentHeight = parseFloat(resizing.el.style.height) || 0;
      resizing.el.style.height = snapValue(currentHeight) + "px";
    }
  }

  // Update z-indexes after resize (size changed)
  if (resizing) {
    updateZIndexes();
  }

  // Complete selection box
  if (isSelecting && selectionBox) {
    const boxRect = selectionBox.getBoundingClientRect();

    // Get all draggable elements
    const elements = canvas.querySelectorAll('.field, .rect, .line, .table, .text, .picture');

    // Clear previous selection if not holding Shift
    if (!selectedElements.length) {
      clearSelection();
    }

    // Check which elements intersect with selection box
    elements.forEach(el => {
      const elRect = el.getBoundingClientRect();

      // Check if element intersects with selection box
      const intersects = !(
        elRect.right < boxRect.left ||
        elRect.left > boxRect.right ||
        elRect.bottom < boxRect.top ||
        elRect.top > boxRect.bottom
      );

      if (intersects) {
        selectElement(el, true); // Add to selection
      }
    });

    // Hide and reset selection box
    selectionBox.style.display = 'none';
    isSelecting = false;
  }

  currentDrag = null;
  resizing = null;
});

// Add field function
function addField() {
  const field = document.getElementById("fieldSelector").value;
  const div = document.createElement("div");
  div.className = "field";
  div.dataset.type = "field";
  div.dataset.field = field;
  div.textContent = `{{${field}}}`;
  makeDraggable(div);
  addLockButton(div);

  // Temporarily position off-screen to measure
  div.style.left = "-9999px";
  div.style.top = "-9999px";
  canvas.appendChild(div);

  // Get height to center vertically
  const height = div.offsetHeight;

  // Position with left-center at mouse position
  div.style.left = snapValue(mouseX || 50) + "px";
  div.style.top = snapValue((mouseY || 50) - height / 2) + "px";

  updateZIndexes();
  selectElement(div);
}

// Add rectangle function
function addRectangle() {
  const rect = document.createElement("div");
  rect.className = "rect";
  rect.dataset.type = "rect";
  rect.style.left = snapValue(mouseX || 50) + "px";
  rect.style.top = snapValue(mouseY || 50) + "px";
  rect.style.width = "120px";
  rect.style.height = "60px";
  makeDraggable(rect);
  makeResizable(rect);
  addLockButton(rect);
  canvas.appendChild(rect);
  updateZIndexes();
  selectElement(rect);
}

// Add line function
function addLine() {
  const line = document.createElement("div");
  line.className = "line";
  line.dataset.type = "line";
  line.style.left = snapValue(mouseX || 100) + "px";
  line.style.top = snapValue(mouseY || 200) + "px";
  makeDraggable(line);
  makeResizable(line);
  addLockButton(line);
  canvas.appendChild(line);
  updateZIndexes();
  selectElement(line);
}

// Add text function
function addText() {
  const textDiv = document.createElement("div");
  textDiv.className = "text";
  textDiv.dataset.type = "text";
  textDiv.textContent = "Sample Text";
  textDiv.contentEditable = false; // Default not editing; double-click to edit

  // Enable editing on double-click
  textDiv.addEventListener('dblclick', (e)=>{
    e.stopPropagation();
    textDiv.contentEditable = true;
    textDiv.focus();
    placeCaretAtEnd(textDiv);
    updateToolbarState();
  });
  // Exit editing on blur or Enter
  textDiv.addEventListener('blur', ()=>{ textDiv.contentEditable = false; updateToolbarState(); });
  textDiv.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); textDiv.blur(); }
  });

  makeDraggable(textDiv);
  addLockButton(textDiv);

  // Temporarily position off-screen to measure
  textDiv.style.left = "-9999px";
  textDiv.style.top = "-9999px";
  canvas.appendChild(textDiv);

  // Get height to center vertically
  const height = textDiv.offsetHeight;

  // Position with left-center at mouse position
  textDiv.style.left = snapValue(mouseX || 50) + "px";
  textDiv.style.top = snapValue((mouseY || 50) - height / 2) + "px";

  updateZIndexes();
  selectElement(textDiv);

  // Automatically enable editing and select all text
  setTimeout(() => {
    textDiv.contentEditable = true;
    textDiv.focus();
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(textDiv);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    updateToolbarState();
  }, 0);
}

// Add picture function
function addPicture() {
  document.getElementById("pictureUpload").click();
}

// Add table function
function addTable() {
  const rows = 3;  // Default 3 rows
  const cols = 4;  // Default 4 columns

  const wrapper = document.createElement("div");
  wrapper.className = "table";
  wrapper.dataset.type = "table";
  wrapper.style.left = snapValue(mouseX || 100) + "px";
  wrapper.style.top = snapValue(mouseY || 250) + "px";
  wrapper.style.width = "400px";
  wrapper.style.height = "200px";

  const tbl = document.createElement("table");
  tbl.style.width = "100%";
  tbl.style.height = "100%";
  tbl.style.tableLayout = "fixed";

  // Calculate initial column widths
  const colWidth = 100 / cols;

  for (let r = 0; r < rows; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < cols; c++) {
      const td = document.createElement("td");
      td.textContent = "";
      td.style.width = colWidth + "%";
      td.style.position = "relative";
      tr.appendChild(td);
    }
    tbl.appendChild(tr);
  }
  wrapper.appendChild(tbl);

  // Add column resize handles
  addTableResizeHandles(wrapper, tbl);

  makeDraggable(wrapper);
  makeResizable(wrapper);
  addLockButton(wrapper);
  canvas.appendChild(wrapper);
  updateZIndexes();
  selectElement(wrapper);
}

// Add resize handles to table columns and rows
function addTableResizeHandles(wrapper, table) {
  const rows = table.rows;
  if (!rows || rows.length === 0) return;

  const cols = rows[0].cells.length;

  // Add column resize handles
  for (let c = 0; c < cols - 1; c++) {
    for (let r = 0; r < rows.length; r++) {
      const cell = rows[r].cells[c];
      const handle = document.createElement("div");
      handle.className = "table-col-resize-handle";
      handle.dataset.colIndex = c;
      handle.addEventListener("mousedown", startColumnResize);
      cell.appendChild(handle);
    }
  }

  // Add row resize handles
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = rows[r].cells[c];
      const handle = document.createElement("div");
      handle.className = "table-row-resize-handle";
      handle.dataset.rowIndex = r;
      handle.addEventListener("mousedown", startRowResize);
      cell.appendChild(handle);
    }
  }
}

// Column resize functionality
let resizingColumn = null;
let resizeStartX = 0;
let resizeStartWidths = [];

function startColumnResize(e) {
  e.stopPropagation();
  e.preventDefault();

  const handle = e.target;
  const colIndex = parseInt(handle.dataset.colIndex);
  const table = handle.closest("table");
  const wrapper = handle.closest(".table");

  resizingColumn = { table, colIndex, wrapper };
  resizeStartX = e.clientX;

  // Store initial widths
  resizeStartWidths = [];
  const firstRow = table.rows[0];
  for (let i = 0; i < firstRow.cells.length; i++) {
    resizeStartWidths.push(firstRow.cells[i].offsetWidth);
  }

  document.addEventListener("mousemove", doColumnResize);
  document.addEventListener("mouseup", stopColumnResize);

  wrapper.style.cursor = "col-resize";
}

function doColumnResize(e) {
  if (!resizingColumn) return;

  const { table, colIndex } = resizingColumn;
  const deltaX = e.clientX - resizeStartX;

  const tableWidth = table.offsetWidth;
  const currentWidth = resizeStartWidths[colIndex];
  const nextWidth = resizeStartWidths[colIndex + 1];

  const newWidth = currentWidth + deltaX;
  const newNextWidth = nextWidth - deltaX;

  // Prevent columns from becoming too small
  if (newWidth < 20 || newNextWidth < 20) return;

  const newWidthPercent = (newWidth / tableWidth) * 100;
  const newNextWidthPercent = (newNextWidth / tableWidth) * 100;

  // Apply to all rows
  for (let r = 0; r < table.rows.length; r++) {
    table.rows[r].cells[colIndex].style.width = newWidthPercent + "%";
    table.rows[r].cells[colIndex + 1].style.width = newNextWidthPercent + "%";
  }
}

function stopColumnResize() {
  if (resizingColumn) {
    resizingColumn.wrapper.style.cursor = "";
    resizingColumn = null;
  }
  document.removeEventListener("mousemove", doColumnResize);
  document.removeEventListener("mouseup", stopColumnResize);
}

// Row resize functionality
let resizingRow = null;
let resizeStartY = 0;
let resizeStartHeights = [];

function startRowResize(e) {
  e.stopPropagation();
  e.preventDefault();

  const handle = e.target;
  const rowIndex = parseInt(handle.dataset.rowIndex);
  const table = handle.closest("table");
  const wrapper = handle.closest(".table");

  resizingRow = { table, rowIndex, wrapper };
  resizeStartY = e.clientY;

  // Store initial heights
  resizeStartHeights = [];
  for (let i = 0; i < table.rows.length; i++) {
    resizeStartHeights.push(table.rows[i].offsetHeight);
  }

  document.addEventListener("mousemove", doRowResize);
  document.addEventListener("mouseup", stopRowResize);

  wrapper.style.cursor = "row-resize";
}

function doRowResize(e) {
  if (!resizingRow) return;

  const { table, rowIndex } = resizingRow;
  const deltaY = e.clientY - resizeStartY;

  const tableHeight = table.offsetHeight;
  const currentHeight = resizeStartHeights[rowIndex];
  const nextHeight = resizeStartHeights[rowIndex + 1];

  const newHeight = currentHeight + deltaY;
  const newNextHeight = nextHeight - deltaY;

  // Prevent rows from becoming too small
  if (newHeight < 20 || newNextHeight < 20) return;

  const newHeightPercent = (newHeight / tableHeight) * 100;
  const newNextHeightPercent = (newNextHeight / tableHeight) * 100;

  table.rows[rowIndex].style.height = newHeightPercent + "%";
  table.rows[rowIndex + 1].style.height = newNextHeightPercent + "%";
}

function stopRowResize() {
  if (resizingRow) {
    resizingRow.wrapper.style.cursor = "";
    resizingRow = null;
  }
  document.removeEventListener("mousemove", doRowResize);
  document.removeEventListener("mouseup", stopRowResize);
}

// Save layout function
function saveLayout() {
  const layout = {
    canvasWidth: canvas.style.width || '900px',
    canvasHeight: canvas.style.height || '600px',
    background: bgImage.src || null,
    elements: Array.from(canvas.children)
      .filter(el => el !== bgImage)
      .map(el => ({
        type: el.dataset.type,
        field: el.dataset.field || null,
        left: el.style.left,
        top: el.style.top,
        width: el.style.width || null,
        height: el.style.height || null,
        html: el.outerHTML
      }))
  };
  const blob = new Blob([JSON.stringify(layout, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "layout.json";
  a.click();
}

// Load layout function
function loadLayout() {
  const input = document.getElementById("layoutFile");
  if (!input.files.length) return alert("Select layout.json");
  const reader = new FileReader();
  reader.onload = e => {
    const layout = JSON.parse(e.target.result);

    // Restore canvas size if saved
    if (layout.canvasWidth && layout.canvasHeight) {
      canvas.style.width = layout.canvasWidth;
      canvas.style.height = layout.canvasHeight;
      // Update the input fields
      document.getElementById('canvasWidth').value = parseInt(layout.canvasWidth);
      document.getElementById('canvasHeight').value = parseInt(layout.canvasHeight);
      // Set format to custom
      document.getElementById('pageFormat').value = 'custom';
    }

    if (layout.background) bgImage.src = layout.background;
    Array.from(canvas.children).forEach(c => { if (c !== bgImage) c.remove(); });
    layout.elements.forEach(el => {
      const temp = document.createElement("div");
      temp.innerHTML = el.html;
      const node = temp.firstChild;

      // Remove old lock button if it exists in saved HTML
      const oldLockBtn = node.querySelector(".lock-btn");
      if (oldLockBtn) oldLockBtn.remove();

      makeDraggable(node);
      if (node.classList.contains("rect") || node.classList.contains("table") || node.classList.contains("line") || node.classList.contains("picture"))
        makeResizable(node);
      if (node.classList.contains("text"))
        node.contentEditable = true; // Re-enable editing for text elements

      // Re-add table resize handles if it's a table
      if (node.classList.contains("table")) {
        const table = node.querySelector("table");
        if (table) {
          // Remove any existing handles first
          node.querySelectorAll(".table-col-resize-handle, .table-row-resize-handle").forEach(h => h.remove());
          addTableResizeHandles(node, table);
        }
      }

      // Add lock button
      addLockButton(node);

      canvas.appendChild(node);
    });

    // Update z-indexes after loading all elements
    updateZIndexes();
  };
  reader.readAsText(input.files[0]);
}

// Preview functionality
let previewData = [];
let currentPreviewIndex = 0;

function showPreview() {
  const dataFile = document.getElementById("csvFile");
  if (!dataFile.files.length) {
    alert("Please select a data file (CSV or Excel) first");
    return;
  }

  const file = dataFile.files[0];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (fileExtension === 'csv') {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        previewData = results.data;
        if (previewData.length === 0) {
          alert("No data found in CSV file");
          return;
        }
        currentPreviewIndex = 0;
        openPreviewModal();
      },
      error: function(error) {
        alert('Error reading CSV file: ' + error.message);
      }
    });
  } else if (['xlsx', 'xls'].includes(fileExtension)) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        previewData = jsonData;
        if (previewData.length === 0) {
          alert("No data found in Excel file");
          return;
        }
        currentPreviewIndex = 0;
        openPreviewModal();
      } catch (error) {
        alert('Error reading Excel file: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function openPreviewModal() {
  const overlay = document.getElementById('previewOverlay');
  const totalRecords = document.getElementById('totalRecords');

  totalRecords.textContent = previewData.length;
  overlay.style.display = 'flex';

  renderPreview();
}

function closePreview() {
  const overlay = document.getElementById('previewOverlay');
  overlay.style.display = 'none';

  // Clear preview
  const previewCanvas = document.getElementById('previewCanvas');
  previewCanvas.innerHTML = '';
}

function renderPreview() {
  if (previewData.length === 0) return;

  const row = previewData[currentPreviewIndex];
  const previewCanvas = document.getElementById('previewCanvas');
  const currentRecord = document.getElementById('currentRecord');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // Update counter
  currentRecord.textContent = currentPreviewIndex + 1;

  // Update button states
  prevBtn.disabled = currentPreviewIndex === 0;
  nextBtn.disabled = currentPreviewIndex === previewData.length - 1;

  // Clone canvas and populate with data
  const clone = canvas.cloneNode(true);

  // Remove interactive elements
  clone.classList.remove("show-grid");
  clone.querySelectorAll(".resize-handle").forEach(h => h.remove());
  clone.querySelectorAll(".table-col-resize-handle, .table-row-resize-handle").forEach(h => h.remove());
  clone.querySelectorAll(".lock-btn").forEach(h => h.remove());
  clone.querySelectorAll(".selected").forEach(n => n.classList.remove("selected"));

  // Populate fields with data
  clone.querySelectorAll(".field").forEach(f => {
    const val = row[f.dataset.field] || "";
    f.textContent = val;
    f.style.border = "none";
    f.style.background = "transparent";
  });

  clone.querySelectorAll(".text").forEach(t => {
    t.style.border = "none";
    t.style.background = "transparent";
    t.contentEditable = false;
  });

  clone.querySelectorAll(".picture").forEach(p => {
    p.style.border = "none";
    p.style.background = "transparent";
  });

  // Clear and add to preview
  previewCanvas.innerHTML = '';
  previewCanvas.appendChild(clone);
}

function previousRecord() {
  if (currentPreviewIndex > 0) {
    currentPreviewIndex--;
    renderPreview();
  }
}

function nextRecord() {
  if (currentPreviewIndex < previewData.length - 1) {
    currentPreviewIndex++;
    renderPreview();
  }
}

// Generate PDFs function
async function generatePDFs() {
  const dataFile = document.getElementById("csvFile");
  if (!dataFile.files.length) return alert("Please select a data file (CSV or Excel)");

  const file = dataFile.files[0];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  // Function to process rows and generate PDFs as ZIP
  async function processRows(rows) {
    const { jsPDF } = window.jspdf;
    const zip = new JSZip();
    let processedCount = 0;

    // Get UI elements
    const exportBtn = document.getElementById('exportBtn');
    const exportBtnText = document.getElementById('exportBtnText');
    const exportProgressOverlay = document.getElementById('exportProgressOverlay');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Disable button and show progress modal
    exportBtn.disabled = true;
    exportBtnText.textContent = 'Generating...';
    exportProgressOverlay.style.display = 'flex';

    const totalCount = rows.length;

    // Throttle progress updates for smoother animation
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 100; // Update UI every 100ms max

    function updateProgress(count, total) {
      const now = Date.now();
      if (now - lastUpdateTime < UPDATE_INTERVAL && count < total) {
        return; // Skip update if too soon
      }
      lastUpdateTime = now;

      requestAnimationFrame(() => {
        const progress = Math.round((count / total) * 100);
        progressFill.style.width = progress + '%';
        progressText.textContent = `Generating ${count} of ${total} hall tickets... (${progress}%)`;
      });
    }

    try {
      // Parallel processing configuration
      const BATCH_SIZE = 10; // Process 10 PDFs in parallel

      // Function to generate a single PDF
      async function generateSinglePDF(row, index) {
        const clone = canvas.cloneNode(true);
        // Remove grid from PDF
        clone.classList.remove("show-grid");
        clone.querySelectorAll(".resize-handle").forEach(h => h.remove());
        clone.querySelectorAll(".table-col-resize-handle, .table-row-resize-handle").forEach(h => h.remove());
        clone.querySelectorAll(".lock-btn").forEach(h => h.remove());
        clone.querySelectorAll(".selected").forEach(n => n.classList.remove("selected"));
        clone.querySelectorAll(".field").forEach(f => {
          const val = row[f.dataset.field] || "";
          f.textContent = val;
          f.style.border = "none";
          f.style.background = "transparent";
        });
        clone.querySelectorAll(".text").forEach(t => {
          t.style.border = "none";
          t.style.background = "transparent";
          t.contentEditable = false; // Disable editing in PDF
        });
        clone.querySelectorAll(".picture").forEach(p => {
          p.style.border = "none"; // Remove border in PDF
          p.style.background = "transparent"; // Remove background in PDF
        });

        // Hide clone from view (position off-screen but keep visible for html2canvas)
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '-9999px';
        clone.style.zIndex = '-1';

        document.body.appendChild(clone);

        // Optimize html2canvas settings for smaller file size
        const snapshot = await html2canvas(clone, {
          scale: 2,              // Lower scale (default is window.devicePixelRatio which can be 2-3)
          useCORS: true,         // Enable CORS for images
          allowTaint: false,     // Prevent tainted canvas
          backgroundColor: '#ffffff',  // White background
          logging: false,        // Disable logging for performance
          imageTimeout: 0        // No timeout for images
        });

        document.body.removeChild(clone);

        // Get canvas dimensions
        const imgWidth = snapshot.width;
        const imgHeight = snapshot.height;

        // Convert to JPEG with compression for much smaller file size
        const imgData = snapshot.toDataURL("image/jpeg", 0.85); // 85% quality JPEG

        const pdf = new jsPDF({
          orientation: imgWidth > imgHeight ? "landscape" : "portrait",
          unit: "px",
          format: [imgWidth, imgHeight],
          compress: true  // Enable PDF compression
        });

        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, 'FAST');

        const pdfBlob = pdf.output('blob');
        const fileName = `${row.hall_ticket_number || `ticket_${index + 1}`}.pdf`;

        return { fileName, pdfBlob };
      }

      // Process rows in batches
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        // Generate all PDFs in this batch in parallel
        const batchPromises = batch.map((row, batchIndex) =>
          generateSinglePDF(row, i + batchIndex)
        );

        const batchResults = await Promise.all(batchPromises);

        // Add all PDFs from this batch to ZIP
        batchResults.forEach(({ fileName, pdfBlob }) => {
          zip.file(fileName, pdfBlob);
          processedCount++;
        });

        // Update progress after each batch (throttled)
        updateProgress(processedCount, totalCount);
      }

      // Update progress for ZIP creation
      requestAnimationFrame(() => {
        progressFill.style.width = '100%';
        progressText.textContent = 'Creating ZIP file...';
      });

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({type: 'blob'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'hall_tickets.zip';
      a.click();
      URL.revokeObjectURL(a.href);

      // Track PDF generation in Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pdf_generated', {
          'event_category': 'engagement',
          'event_label': 'hall_tickets',
          'value': totalCount
        });
      }

      // Success
      requestAnimationFrame(() => {
        progressText.textContent = `✓ Successfully generated ${totalCount} hall tickets!`;
      });

      setTimeout(() => {
        exportProgressOverlay.style.display = 'none';
        exportBtn.disabled = false;
        exportBtnText.textContent = 'Export All Hall Tickets';
        progressFill.style.width = '0%';
      }, 2000);

    } catch (error) {
      // Error handling
      progressText.textContent = '✗ Error generating hall tickets: ' + error.message;
      progressFill.style.width = '0%';

      setTimeout(() => {
        exportProgressOverlay.style.display = 'none';
        exportBtn.disabled = false;
        exportBtnText.textContent = 'Export All Hall Tickets';
      }, 4000);
    }
  }

  if (fileExtension === 'csv') {
    // Parse CSV file
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        await processRows(results.data);
      }
    });
  } else if (['xlsx', 'xls', 'xlsm'].includes(fileExtension)) {
    // Parse Excel file
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        await processRows(jsonData);
      } catch (error) {
        alert('Error reading Excel file: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
  }
}

// Initialize field selector on page load
populateFieldSelector();

// Properties Panel Functions
function updatePropertiesPanel() {
  try {
    const panel = document.getElementById('propertiesPanel');
    const title = document.getElementById('propertiesTitle');
    const content = document.getElementById('propertiesContent');

    if (!selectedEl) {
      closePropertiesPanel();
      return;
    }

    panel.classList.remove('hidden');
    content.innerHTML = '';

    const type = selectedEl.dataset.type || selectedEl.className.split(' ')[0];

  // Background properties
  if (type === 'bg-image') {
    title.textContent = 'Background Properties';

    content.innerHTML = `
      <div class="property-group">
        <label class="property-label">Opacity</label>
        <span class="property-value" id="opacityValue">${Math.round(bgTransform.opacity * 100)}%</span>
        <input type="range" class="property-input-range" id="bgOpacity" min="0" max="100" value="${Math.round(bgTransform.opacity * 100)}" step="5" oninput="updateBackgroundOpacity()" />
      </div>
      <div class="property-group">
        <label class="property-label">Scale</label>
        <span class="property-value" id="scaleValue">${Math.round(bgTransform.scale * 100)}%</span>
        <input type="range" class="property-input-range" id="bgScale" min="10" max="200" value="${Math.round(bgTransform.scale * 100)}" step="5" oninput="updateBackgroundTransform()" />
      </div>
      <div class="property-group">
        <label class="property-label">Rotation</label>
        <span class="property-value" id="rotateValue">${bgTransform.rotate}°</span>
        <input type="range" class="property-input-range" id="bgRotate" min="0" max="360" value="${bgTransform.rotate}" step="1" oninput="updateBackgroundTransform()" />
      </div>
      <div class="property-group property-buttons">
        <button class="btn-property" onclick="flipBackgroundH()" title="Flip Horizontal">
          <span class="btn-icon">
            <svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3m8 0h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3m0 18V3"/></svg>
          </span>
          <span>Flip H</span>
        </button>
        <button class="btn-property" onclick="flipBackgroundV()" title="Flip Vertical">
          <span class="btn-icon">
            <svg viewBox="0 0 24 24"><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M21 12H3"/></svg>
          </span>
          <span>Flip V</span>
        </button>
        <button class="btn-property" onclick="resetBackgroundTransform()" title="Reset Transform">
          <span class="btn-icon">
            <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
          </span>
          <span>Reset</span>
        </button>
      </div>
    `;
  }

  // Text and Field properties
  else if (type === 'text' || type === 'field') {
    title.textContent = type === 'text' ? 'Text Properties' : 'Field Properties';

    content.innerHTML = `
      <div class="property-group">
        <button class="btn-toggle property-button" onclick="toggleBoldProperty()" id="propBold">
          <strong>B</strong>
        </button>
        <button class="btn-toggle property-button" onclick="toggleItalicProperty()" id="propItalic">
          <em>I</em>
        </button>
        <button class="btn-toggle property-button" onclick="toggleUnderlineProperty()" id="propUnderline">
          <span style="text-decoration:underline">U</span>
        </button>
      </div>
      <div class="property-group">
        <label class="property-label">Font Size</label>
        <input type="number" class="property-input small" id="propFontSize" min="8" max="72" value="14" onchange="updateFontSize(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Color</label>
        <input type="color" class="property-color-input" id="propColor" onchange="updateTextColor(this.value)" />
      </div>
    `;

    // Update current values
    const cs = window.getComputedStyle(selectedEl);
    document.getElementById('propFontSize').value = parseInt(cs.fontSize);
    document.getElementById('propColor').value = rgbToHex(cs.color);

    const isBold = parseInt(cs.fontWeight) >= 600;
    const isItalic = cs.fontStyle === 'italic';
    const isUnderline = (cs.textDecorationLine || cs.textDecoration || '').includes('underline');

    document.getElementById('propBold').setAttribute('aria-pressed', isBold);
    document.getElementById('propItalic').setAttribute('aria-pressed', isItalic);
    document.getElementById('propUnderline').setAttribute('aria-pressed', isUnderline);
  }

  // Table properties
  else if (type === 'table') {
    title.textContent = 'Table Properties';

    const table = selectedEl.querySelector('table');
    const rows = table.rows.length;
    const cols = table.rows[0]?.cells.length || 0;
    const currentBorderColor = window.getComputedStyle(table.rows[0]?.cells[0] || table).borderColor;

    content.innerHTML = `
      <div class="property-group">
        <label class="property-label">Rows</label>
        <input type="number" class="property-input small" id="propRows" min="1" max="20" value="${rows}" onchange="updateTableRows(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Columns</label>
        <input type="number" class="property-input small" id="propCols" min="1" max="20" value="${cols}" onchange="updateTableCols(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Border Color</label>
        <input type="color" class="property-color-input" id="propBorderColor" value="${rgbToHex(currentBorderColor)}" onchange="updateTableBorderColor(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Border Width</label>
        <select class="property-input small" id="propBorderWidth" onchange="updateTableBorderWidth(this.value)">
          <option value="1">Thin</option>
          <option value="2">Medium</option>
          <option value="3">Thick</option>
        </select>
      </div>
    `;
  }

  // Rectangle properties
  else if (type === 'rect') {
    title.textContent = 'Rectangle Properties';

    const cs = window.getComputedStyle(selectedEl);
    const borderColor = cs.borderColor;
    const borderWidth = parseInt(cs.borderWidth);
    const fillColor = cs.backgroundColor;

    content.innerHTML = `
      <div class="property-group">
        <label class="property-label">Border Color</label>
        <input type="color" class="property-color-input" id="propBorderColor" value="${rgbToHex(borderColor)}" onchange="updateRectBorderColor(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Border Width</label>
        <input type="number" class="property-input small" id="propBorderWidth" min="1" max="10" value="${borderWidth}" onchange="updateRectBorderWidth(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Fill Color</label>
        <input type="color" class="property-color-input" id="propFillColor" value="${rgbToHex(fillColor)}" onchange="updateRectFillColor(this.value)" />
      </div>
    `;
  }

  // Line properties
  else if (type === 'line') {
    title.textContent = 'Line Properties';

    const cs = window.getComputedStyle(selectedEl);
    const bgColor = cs.backgroundColor;
    const height = parseInt(cs.height);

    content.innerHTML = `
      <div class="property-group">
        <label class="property-label">Color</label>
        <input type="color" class="property-color-input" id="propLineColor" value="${rgbToHex(bgColor)}" onchange="updateLineColor(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Thickness</label>
        <input type="number" class="property-input small" id="propLineThickness" min="1" max="10" value="${height}" onchange="updateLineThickness(this.value)" />
      </div>
    `;
  }
  } catch (error) {
    console.error('Error updating properties panel:', error);
    // Silently fail to prevent breaking drag functionality
  }
}

function closePropertiesPanel() {
  document.getElementById('propertiesPanel').classList.add('hidden');
}

// Helper function to convert RGB to Hex
function rgbToHex(rgb) {
  if (!rgb) return '#000000';
  if (rgb.startsWith('#')) return rgb;
  const values = rgb.match(/\d+/g);
  if (!values || values.length < 3) return '#000000';
  const r = parseInt(values[0]).toString(16).padStart(2, '0');
  const g = parseInt(values[1]).toString(16).padStart(2, '0');
  const b = parseInt(values[2]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// Text/Field Property Update Functions
function toggleBoldProperty() {
  if (!selectedEl) return;
  const cs = window.getComputedStyle(selectedEl);
  const isBold = parseInt(cs.fontWeight) >= 600;
  selectedEl.style.fontWeight = isBold ? 'normal' : 'bold';
  updatePropertiesPanel();
}

function toggleItalicProperty() {
  if (!selectedEl) return;
  const cs = window.getComputedStyle(selectedEl);
  const isItalic = cs.fontStyle === 'italic';
  selectedEl.style.fontStyle = isItalic ? 'normal' : 'italic';
  updatePropertiesPanel();
}

function toggleUnderlineProperty() {
  if (!selectedEl) return;
  const cs = window.getComputedStyle(selectedEl);
  const isUnderline = (cs.textDecorationLine || cs.textDecoration || '').includes('underline');
  selectedEl.style.textDecoration = isUnderline ? 'none' : 'underline';
  updatePropertiesPanel();
}

function updateFontSize(size) {
  if (!selectedEl) return;
  selectedEl.style.fontSize = size + 'px';
}

function updateTextColor(color) {
  if (!selectedEl) return;
  selectedEl.style.color = color;
}

// Table Property Update Functions
function updateTableRows(newRows) {
  if (!selectedEl) return;
  const table = selectedEl.querySelector('table');
  const currentRows = table.rows.length;
  const cols = table.rows[0]?.cells.length || 1;

  newRows = parseInt(newRows);

  if (newRows > currentRows) {
    // Add rows
    for (let i = currentRows; i < newRows; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td');
        td.textContent = '';
        td.style.position = 'relative';
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
  } else if (newRows < currentRows) {
    // Remove rows
    for (let i = currentRows - 1; i >= newRows; i--) {
      table.deleteRow(i);
    }
  }

  // Re-add resize handles
  selectedEl.querySelectorAll('.table-col-resize-handle, .table-row-resize-handle').forEach(h => h.remove());
  addTableResizeHandles(selectedEl, table);
}

function updateTableCols(newCols) {
  if (!selectedEl) return;
  const table = selectedEl.querySelector('table');
  const rows = table.rows.length;
  const currentCols = table.rows[0]?.cells.length || 0;

  newCols = parseInt(newCols);

  if (newCols > currentCols) {
    // Add columns
    for (let i = 0; i < rows; i++) {
      for (let j = currentCols; j < newCols; j++) {
        const td = document.createElement('td');
        td.textContent = '';
        td.style.position = 'relative';
        table.rows[i].appendChild(td);
      }
    }
  } else if (newCols < currentCols) {
    // Remove columns
    for (let i = 0; i < rows; i++) {
      for (let j = currentCols - 1; j >= newCols; j--) {
        table.rows[i].deleteCell(j);
      }
    }
  }

  // Re-add resize handles
  selectedEl.querySelectorAll('.table-col-resize-handle, .table-row-resize-handle').forEach(h => h.remove());
  addTableResizeHandles(selectedEl, table);
}

function updateTableBorderColor(color) {
  if (!selectedEl) return;
  const table = selectedEl.querySelector('table');
  const cells = table.querySelectorAll('td');
  cells.forEach(cell => {
    cell.style.borderColor = color;
  });
}

function updateTableBorderWidth(width) {
  if (!selectedEl) return;
  const table = selectedEl.querySelector('table');
  const cells = table.querySelectorAll('td');
  cells.forEach(cell => {
    cell.style.borderWidth = width + 'px';
  });
}

// Rectangle Property Update Functions
function updateRectBorderColor(color) {
  if (!selectedEl) return;
  selectedEl.style.borderColor = color;
}

function updateRectBorderWidth(width) {
  if (!selectedEl) return;
  selectedEl.style.borderWidth = width + 'px';
}

function updateRectFillColor(color) {
  if (!selectedEl) return;
  selectedEl.style.backgroundColor = color;
}

// Line Property Update Functions
function updateLineColor(color) {
  if (!selectedEl) return;
  selectedEl.style.backgroundColor = color;
}

function updateLineThickness(thickness) {
  if (!selectedEl) return;
  selectedEl.style.height = thickness + 'px';
}

// Grid and Snap Toggle Functions
function toggleGrid() {
  showGrid = document.getElementById('showGridToggle').checked;
  if (showGrid) {
    canvas.classList.add('show-grid');
  } else {
    canvas.classList.remove('show-grid');
  }
}

function toggleSnap() {
  snapToGrid = document.getElementById('snapToGridToggle').checked;
}

function updateGridSize() {
  const newSize = parseInt(document.getElementById('gridSize').value);
  if (newSize >= 5 && newSize <= 100) {
    gridSize = newSize;
    updateGridVisual();
  }
}

function updateGridVisual() {
  // Update CSS custom properties for grid
  const style = document.createElement('style');
  style.id = 'dynamic-grid-style';

  // Remove old style if exists
  const oldStyle = document.getElementById('dynamic-grid-style');
  if (oldStyle) oldStyle.remove();

  const minorLine = gridSize - 1;
  const majorLine = gridSize * 5 - 1;

  style.textContent = `
    .canvas-container.show-grid::before {
      background-image:
        repeating-linear-gradient(0deg, transparent, transparent ${minorLine}px, rgba(59, 130, 246, 0.03) ${minorLine}px, rgba(59, 130, 246, 0.03) ${gridSize}px),
        repeating-linear-gradient(90deg, transparent, transparent ${minorLine}px, rgba(59, 130, 246, 0.03) ${minorLine}px, rgba(59, 130, 246, 0.03) ${gridSize}px);
    }
    .canvas-container.show-grid::after {
      background-image:
        repeating-linear-gradient(0deg, transparent, transparent ${majorLine}px, rgba(59, 130, 246, 0.06) ${majorLine}px, rgba(59, 130, 246, 0.06) ${gridSize * 5}px),
        repeating-linear-gradient(90deg, transparent, transparent ${majorLine}px, rgba(59, 130, 246, 0.06) ${majorLine}px, rgba(59, 130, 246, 0.06) ${gridSize * 5}px);
    }
  `;

  document.head.appendChild(style);
}
