// Grid & Snap System
// This module handles grid display and snap-to-grid functionality

// Toggle grid visibility
function toggleGrid() {
  showGrid = document.getElementById('showGridToggle').checked;
  if (showGrid) {
    canvas.classList.add('show-grid');
  } else {
    canvas.classList.remove('show-grid');
  }
}

// Toggle snap to grid
function toggleSnap() {
  snapToGrid = document.getElementById('snapToGridToggle').checked;
}

// Update grid size
function updateGridSize() {
  const input = document.getElementById('gridSize');
  let newSize = parseInt(input.value);
  const oldSize = gridSize;

  // Validate range
  if (newSize < 1) newSize = 1;
  if (newSize > 100) newSize = 100;

  // Enforce step logic:
  // 1-4: step by 1 (allowed: 1, 2, 3, 4)
  // 5-100: step by 5 (allowed: 5, 10, 15, 20, ...)
  if (newSize > 4 && newSize % 5 !== 0) {
    // Determine if user is going up or down
    const goingUp = newSize > oldSize;

    if (goingUp) {
      // Round up to next multiple of 5
      newSize = Math.ceil(newSize / 5) * 5;
    } else {
      // Round down to previous multiple of 5
      newSize = Math.floor(newSize / 5) * 5;
      // If we rounded down to 0, go to 4 instead
      if (newSize < 5) newSize = 4;
    }
  }

  // Update input value to corrected value
  input.value = newSize;

  // Update grid
  gridSize = newSize;
  updateGridVisual();
}

// Initialize grid size input with smart stepping
function initGridSizeInput() {
  const input = document.getElementById('gridSize');
  if (!input) return;

  // Handle arrow key presses for smart stepping
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();

      const currentValue = parseInt(input.value) || 5;
      let newValue;

      if (e.key === 'ArrowUp') {
        // Going up
        if (currentValue < 4) {
          newValue = currentValue + 1; // 1→2, 2→3, 3→4
        } else if (currentValue === 4) {
          newValue = 5; // 4→5
        } else {
          newValue = currentValue + 5; // 5→10, 10→15, etc.
        }
      } else {
        // Going down
        if (currentValue <= 4) {
          newValue = Math.max(1, currentValue - 1); // 4→3, 3→2, 2→1
        } else if (currentValue === 5) {
          newValue = 4; // 5→4
        } else {
          newValue = currentValue - 5; // 10→5, 15→10, etc.
        }
      }

      // Clamp to valid range
      newValue = Math.max(1, Math.min(100, newValue));

      input.value = newValue;
      updateGridSize();
    }
  });
}

// Update grid visual appearance
function updateGridVisual() {
  // Update CSS custom properties for grid
  const style = document.createElement('style');
  style.id = 'dynamic-grid-style';

  // Remove old style if exists
  const oldStyle = document.getElementById('dynamic-grid-style');
  if (oldStyle) oldStyle.remove();

  style.textContent = `
    .canvas-container.show-grid::before {
      background-size: ${gridSize}px ${gridSize}px;
      background-image:
        linear-gradient(to right, rgba(59, 130, 246, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
    }
    .canvas-container.show-grid::after {
      background-size: ${gridSize * 5}px ${gridSize * 5}px;
      background-image:
        linear-gradient(to right, rgba(59, 130, 246, 0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(59, 130, 246, 0.06) 1px, transparent 1px);
    }
  `;

  document.head.appendChild(style);
}

