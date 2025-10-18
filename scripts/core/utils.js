// Pure Utility Functions
// This module contains reusable utility functions with no side effects

// Place caret at end of contenteditable element
function placeCaretAtEnd(el) {
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch(err) { 
    /* noop */ 
  }
}

// Snap value to grid
function snapValue(value) {
  if (!snapToGrid) return value;
  // Use parseFloat to handle decimal values, then round to nearest grid line
  const numValue = parseFloat(value);
  // Grid lines are drawn at 0, gridSize, 2*gridSize, 3*gridSize, etc.
  // (The visual line is 1px thick ending at these positions)
  return Math.round(numValue / gridSize) * gridSize;
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

// Convert RGB to Hex color
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

