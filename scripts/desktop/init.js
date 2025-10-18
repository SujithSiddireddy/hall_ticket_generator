// Desktop Initialization
// This module initializes the desktop version of the application

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  // Add grid to canvas
  canvas.classList.add('show-grid');

  // Initialize grid visual with current gridSize
  updateGridVisual();

  // Initialize grid size input with smart stepping
  initGridSizeInput();

  // Initialize canvas zoom
  initCanvasZoom();

  // Initialize canvas size scroll
  initCanvasSizeScroll();

  // Set up PDF.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Initialize handlers
  initBackgroundHandler();
  initCSVHandler();
  initLayoutHandler();
  initCanvasInteractions();
  initMouseTracking();

  // Check if mobile and show warning
  checkMobileAndShowWarning();

  // Initialize window resize handler for zoom to fit
  initWindowResizeHandler();
});

// Initialize layout file handler
function initLayoutHandler() {
  const layoutFileInput = document.getElementById("layoutFile");
  if (layoutFileInput) {
    layoutFileInput.addEventListener("change", loadLayout);
  }
}

// Initialize canvas interactions (selection box)
function initCanvasInteractions() {
  // Click on empty canvas/bg clears selection or starts selection box
  canvas.addEventListener('mousedown', e => {
    if (e.target === canvas || e.target === bgImage) {
      // Don't start selection if we're already dragging or resizing
      if (currentDrag || resizing) return;

      // Clear selection if not holding Shift
      if (!e.shiftKey) {
        clearSelection();
      }

      // Start selection box in screen coordinates (relative to canvas wrapper)
      const canvasWrapper = document.querySelector('.canvas-wrapper');
      const wrapperRect = canvasWrapper.getBoundingClientRect();

      selectionStartX = e.clientX - wrapperRect.left;
      selectionStartY = e.clientY - wrapperRect.top;
      isSelecting = true;

      // Create selection box element - append to canvas wrapper to avoid transform
      if (!selectionBox) {
        selectionBox = document.createElement('div');
        selectionBox.className = 'selection-box';
        canvasWrapper.appendChild(selectionBox);
      }

      selectionBox.style.left = selectionStartX + 'px';
      selectionBox.style.top = selectionStartY + 'px';
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';
      selectionBox.style.display = 'block';
    }
  });
}

// Initialize mouse tracking
function initMouseTracking() {
  // Track mouse position over canvas wrapper (accounting for zoom/pan)
  const canvasWrapper = document.querySelector('.canvas-wrapper');
  canvasWrapper.addEventListener("mousemove", e => {
    const canvasCoords = screenToCanvasCoords(e.clientX, e.clientY);
    mouseX = canvasCoords.x;
    mouseY = canvasCoords.y;
  });

  // Mouse move handler for dragging, resizing, and selection box
  document.addEventListener("mousemove", handleMouseMove);

  // Mouse up handler - apply snap here and complete selection
  document.addEventListener("mouseup", handleMouseUp);
}

// Handle mouse move for drag, resize, and selection
function handleMouseMove(e) {
  if (currentDrag) {
    // Convert screen coordinates to canvas coordinates (accounting for zoom/pan)
    const canvasCoords = screenToCanvasCoords(e.clientX, e.clientY);

    let left = canvasCoords.x - offsetX;
    let top = canvasCoords.y - offsetY;

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
    // Account for zoom level when resizing
    const currentZoom = zoomLevel || 1;
    const dx = (e.clientX - resizing.startX) / currentZoom;
    const dy = (e.clientY - resizing.startY) / currentZoom;

    // For line elements, only change length, keep thickness fixed
    if (resizing.el.classList.contains("line")) {
      // Determine if line is horizontal or vertical
      const isHorizontal = resizing.startW > resizing.startH;

      if (isHorizontal) {
        // Horizontal line: change width (length), keep height (thickness) fixed
        let newW = Math.max(20, resizing.startW + dx);
        resizing.el.style.width = newW + "px";
      } else {
        // Vertical line: change height (length), keep width (thickness) fixed
        let newH = Math.max(20, resizing.startH + dy);
        resizing.el.style.height = newH + "px";
      }
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
    // Update selection box dimensions in screen coordinates (relative to wrapper)
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    const wrapperRect = canvasWrapper.getBoundingClientRect();

    const currentX = e.clientX - wrapperRect.left;
    const currentY = e.clientY - wrapperRect.top;

    const width = Math.abs(currentX - selectionStartX);
    const height = Math.abs(currentY - selectionStartY);
    const left = Math.min(currentX, selectionStartX);
    const top = Math.min(currentY, selectionStartY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  }
}

// Handle mouse up - snap and complete selection
function handleMouseUp() {
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
}

// Mobile warning functions
function checkMobileAndShowWarning() {
  const mobileWarning = document.getElementById('mobileWarning');
  if (!mobileWarning) return;

  const dismissed = sessionStorage.getItem('mobileWarningDismissed');
  if (dismissed === 'true') return;

  const isMobile = window.innerWidth < 1024;
  if (isMobile) {
    mobileWarning.classList.add('show');
  }
}

function dismissMobileWarning() {
  const mobileWarning = document.getElementById('mobileWarning');
  if (mobileWarning) {
    mobileWarning.classList.remove('show');
    sessionStorage.setItem('mobileWarningDismissed', 'true');
  }
}

// Re-check on window resize
// Initialize window resize handler for zoom to fit
function initWindowResizeHandler() {
  let resizeTimeout;

  window.addEventListener('resize', () => {
    // Clear previous timeout to debounce resize events
    clearTimeout(resizeTimeout);

    // Wait for resize to finish before zooming to fit
    resizeTimeout = setTimeout(() => {
      if (typeof resetZoom === 'function') {
        resetZoom();
      }
    }, 200); // Debounce delay
  });
}

window.addEventListener('resize', () => {
  const dismissed = sessionStorage.getItem('mobileWarningDismissed');
  if (dismissed === 'true') return;

  const mobileWarning = document.getElementById('mobileWarning');
  if (!mobileWarning) return;

  const isMobile = window.innerWidth < 1024;
  if (isMobile) {
    mobileWarning.classList.add('show');
  } else {
    mobileWarning.classList.remove('show');
  }
});

