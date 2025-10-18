// Canvas Zoom Functionality
// Handles zooming and panning of the canvas

let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

// Initialize zoom functionality
function initCanvasZoom() {
  const canvasWrapper = document.querySelector('.canvas-wrapper');
  const canvasContainer = document.getElementById('canvas');

  if (!canvasWrapper || !canvasContainer) return;

  // Prevent default zoom behavior on canvas wrapper
  canvasWrapper.addEventListener('wheel', handleZoom, { passive: false });

  // Pan with middle mouse button or space + drag
  canvasWrapper.addEventListener('mousedown', handlePanStart);
  canvasWrapper.addEventListener('mousemove', handlePanMove);
  canvasWrapper.addEventListener('mouseup', handlePanEnd);
  canvasWrapper.addEventListener('mouseleave', handlePanEnd);

  // Add zoom controls UI
  addZoomControls();

  // Center the canvas initially
  const canvasWidth = canvasContainer.offsetWidth;
  const canvasHeight = canvasContainer.offsetHeight;
  const wrapperWidth = canvasWrapper.offsetWidth;
  const wrapperHeight = canvasWrapper.offsetHeight;

  panX = (wrapperWidth - canvasWidth) / 2;
  panY = (wrapperHeight - canvasHeight) / 2;

  // Apply initial transform
  applyZoomTransform();
}

// Handle zoom with mouse wheel / trackpad
function handleZoom(e) {
  if (e.ctrlKey || e.metaKey) {
    // Zoom mode
    e.preventDefault();
    e.stopPropagation();

    const canvasContainer = document.getElementById('canvas');
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    const wrapperRect = canvasWrapper.getBoundingClientRect();

    // Get mouse position relative to wrapper
    const mouseX = e.clientX - wrapperRect.left;
    const mouseY = e.clientY - wrapperRect.top;

    // Calculate new zoom level
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel * (e.deltaY < 0 ? 1.05 : 0.95)));

    // Get effective current position (accounting for constraints)
    const canvasWidth = canvasContainer.offsetWidth;
    const canvasHeight = canvasContainer.offsetHeight;
    const currentScaledWidth = canvasWidth * zoomLevel;
    const currentScaledHeight = canvasHeight * zoomLevel;

    let currentX = panX;
    let currentY = panY;

    if (currentScaledWidth > wrapperRect.width) {
      currentX = Math.max(wrapperRect.width - currentScaledWidth, Math.min(0, panX));
    }
    if (currentScaledHeight > wrapperRect.height) {
      currentY = Math.max(wrapperRect.height - currentScaledHeight, Math.min(0, panY));
    }

    // Calculate canvas point under mouse and new pan position
    const canvasPointX = (mouseX - currentX) / zoomLevel;
    const canvasPointY = (mouseY - currentY) / zoomLevel;

    panX = mouseX - (canvasPointX * newZoom);
    panY = mouseY - (canvasPointY * newZoom);
    zoomLevel = newZoom;

    applyZoomTransform();
    updateZoomDisplay();
  } else {
    // Pan mode - allow panning when canvas is larger than wrapper
    const canvasContainer = document.getElementById('canvas');
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    const wrapperRect = canvasWrapper.getBoundingClientRect();

    const scaledWidth = canvasContainer.offsetWidth * zoomLevel;
    const scaledHeight = canvasContainer.offsetHeight * zoomLevel;

    // Check which dimensions need panning
    const needsHorizontalPan = scaledWidth > wrapperRect.width;
    const needsVerticalPan = scaledHeight > wrapperRect.height;

    // Only allow panning if canvas is larger than wrapper in at least one dimension
    if (needsHorizontalPan || needsVerticalPan) {
      e.preventDefault();
      e.stopPropagation();

      // Only pan in directions where canvas is larger than wrapper
      if (needsHorizontalPan) {
        panX -= e.deltaX;
      }
      if (needsVerticalPan) {
        panY -= e.deltaY;
      }

      applyZoomTransform();
    }
  }
}

// Handle pan start
function handlePanStart(e) {
  // Pan with middle mouse button or Shift + left click
  if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
    e.preventDefault();
    e.stopPropagation();
    isPanning = true;
    panStartX = e.clientX - panX;
    panStartY = e.clientY - panY;
    document.body.style.cursor = 'grabbing';
  }
}

// Handle pan move
function handlePanMove(e) {
  if (!isPanning) return;

  e.preventDefault();
  e.stopPropagation();
  panX = e.clientX - panStartX;
  panY = e.clientY - panStartY;

  applyZoomTransform();
}

// Handle pan end
function handlePanEnd() {
  if (isPanning) {
    isPanning = false;
    document.body.style.cursor = '';
  }
}

// Apply zoom and pan transform to canvas
function applyZoomTransform() {
  const canvasContainer = document.getElementById('canvas');
  const canvasWrapper = document.querySelector('.canvas-wrapper');
  if (!canvasContainer || !canvasWrapper) return;

  // At 100% zoom with no pan, don't apply any transform
  if (zoomLevel === 1 && panX === 0 && panY === 0) {
    canvasContainer.style.transform = '';
    canvasContainer.style.transformOrigin = '';
    return;
  }

  // Constrain panning only when canvas is larger than wrapper
  let finalX = panX;
  let finalY = panY;

  const scaledWidth = canvasContainer.offsetWidth * zoomLevel;
  const scaledHeight = canvasContainer.offsetHeight * zoomLevel;
  const wrapperWidth = canvasWrapper.offsetWidth;
  const wrapperHeight = canvasWrapper.offsetHeight;

  if (scaledWidth > wrapperWidth) {
    finalX = Math.max(wrapperWidth - scaledWidth, Math.min(0, panX));
  }

  if (scaledHeight > wrapperHeight) {
    finalY = Math.max(wrapperHeight - scaledHeight, Math.min(0, panY));
  }

  // Update the actual pan values to match the constrained values
  // This prevents the "first swipe does nothing" issue at edges
  panX = finalX;
  panY = finalY;

  canvasContainer.style.transform = `translate(${finalX}px, ${finalY}px) scale(${zoomLevel})`;
  canvasContainer.style.transformOrigin = 'top left';
}

// Add zoom controls UI
function addZoomControls() {
  const canvasWrapper = document.querySelector('.canvas-wrapper');
  if (!canvasWrapper) return;

  const zoomControls = document.createElement('div');
  zoomControls.className = 'zoom-controls';

  // Zoom Out button
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'zoom-btn';
  zoomOutBtn.title = 'Zoom Out (Ctrl/Cmd + Scroll)';
  zoomOutBtn.innerHTML = '−';
  zoomOutBtn.onclick = zoomOut;

  // Zoom level display
  const zoomLevel = document.createElement('span');
  zoomLevel.className = 'zoom-level';
  zoomLevel.id = 'zoomLevel';
  zoomLevel.textContent = '100%';

  // Zoom In button
  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'zoom-btn';
  zoomInBtn.title = 'Zoom In (Ctrl/Cmd + Scroll)';
  zoomInBtn.innerHTML = '+';
  zoomInBtn.onclick = zoomIn;

  // Reset button
  const resetBtn = document.createElement('button');
  resetBtn.className = 'zoom-btn';
  resetBtn.title = 'Zoom to Fit';
  resetBtn.innerHTML = '⟲';
  resetBtn.onclick = resetZoom;

  zoomControls.appendChild(zoomOutBtn);
  zoomControls.appendChild(zoomLevel);
  zoomControls.appendChild(zoomInBtn);
  zoomControls.appendChild(resetBtn);

  canvasWrapper.appendChild(zoomControls);
}

// Zoom in
function zoomIn() {
  const canvasWrapper = document.querySelector('.canvas-wrapper');
  const rect = canvasWrapper.getBoundingClientRect();
  
  // Zoom towards center
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const newZoom = Math.min(5, zoomLevel * 1.2);
  const zoomRatio = newZoom / zoomLevel;
  
  panX = centerX - (centerX - panX) * zoomRatio;
  panY = centerY - (centerY - panY) * zoomRatio;
  
  zoomLevel = newZoom;
  
  applyZoomTransform();
  updateZoomDisplay();
}

// Zoom out
function zoomOut() {
  const canvasWrapper = document.querySelector('.canvas-wrapper');
  const rect = canvasWrapper.getBoundingClientRect();
  
  // Zoom towards center
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const newZoom = Math.max(0.1, zoomLevel / 1.2);
  const zoomRatio = newZoom / zoomLevel;
  
  panX = centerX - (centerX - panX) * zoomRatio;
  panY = centerY - (centerY - panY) * zoomRatio;
  
  zoomLevel = newZoom;
  
  applyZoomTransform();
  updateZoomDisplay();
}

// Reset zoom to fit entire canvas in viewport
function resetZoom() {
  const canvasContainer = document.getElementById('canvas');
  const canvasWrapper = document.querySelector('.canvas-wrapper');

  if (!canvasContainer || !canvasWrapper) {
    console.warn('resetZoom: canvasContainer or canvasWrapper not found');
    return;
  }

  // Temporarily clear transform to get true dimensions
  canvasContainer.style.transform = '';

  // Force a reflow to ensure we get the latest dimensions
  void canvasContainer.offsetHeight;

  // Get dimensions from computed style (which reflects the actual CSS values)
  const computedStyle = window.getComputedStyle(canvasContainer);
  const canvasWidth = parseFloat(computedStyle.width);
  const canvasHeight = parseFloat(computedStyle.height);
  const wrapperWidth = canvasWrapper.offsetWidth;
  const wrapperHeight = canvasWrapper.offsetHeight;

  // Calculate zoom level to fit entire canvas with some padding
  const padding = 40; // 40px padding on each side
  const availableWidth = wrapperWidth - (padding * 2);
  const availableHeight = wrapperHeight - (padding * 2);

  const zoomX = availableWidth / canvasWidth;
  const zoomY = availableHeight / canvasHeight;

  // Use the smaller zoom to ensure entire canvas fits
  zoomLevel = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 100%

  // Center the canvas in the wrapper
  const scaledWidth = canvasWidth * zoomLevel;
  const scaledHeight = canvasHeight * zoomLevel;
  panX = (wrapperWidth - scaledWidth) / 2;
  panY = (wrapperHeight - scaledHeight) / 2;

  applyZoomTransform();
  updateZoomDisplay();
}

// Update zoom level display
function updateZoomDisplay() {
  const zoomDisplay = document.getElementById('zoomLevel');
  const zoomDisplayPanel = document.getElementById('zoomLevelPanel');
  const zoomText = Math.round(zoomLevel * 100) + '%';

  if (zoomDisplay) {
    zoomDisplay.textContent = zoomText;
  }
  if (zoomDisplayPanel) {
    zoomDisplayPanel.textContent = zoomText;
  }
}

// Convert screen coordinates to canvas coordinates (accounting for zoom and pan)
function screenToCanvasCoords(screenX, screenY) {
  const canvasContainer = document.getElementById('canvas');
  const rect = canvasContainer.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(canvasContainer);
  const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
  const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;

  // Get the current scale from transform
  const transform = canvasContainer.style.transform;
  let currentScale = 1;

  // Parse transform to get scale value
  if (transform) {
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    if (scaleMatch) {
      currentScale = parseFloat(scaleMatch[1]);
    }
  }

  // Convert screen coordinates to canvas coordinates
  // getBoundingClientRect() already accounts for the transform (pan),
  // so we just need to get position relative to the rect and divide by scale
  const relativeX = screenX - rect.left - borderLeft;
  const relativeY = screenY - rect.top - borderTop;

  // Only need to account for scale (pan is already in the bounding rect)
  const canvasX = relativeX / currentScale;
  const canvasY = relativeY / currentScale;

  return { x: canvasX, y: canvasY };
}

