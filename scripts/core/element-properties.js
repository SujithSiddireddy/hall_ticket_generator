// Element Property Update Functions
// Extracted from script.js lines 1879-2023

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

  const currentWidth = parseInt(selectedEl.style.width) || 120;
  const currentHeight = parseInt(selectedEl.style.height) || 2;

  // Determine if line is horizontal or vertical
  const isHorizontal = currentWidth > currentHeight;

  if (isHorizontal) {
    // For horizontal lines, thickness is height
    selectedEl.style.height = thickness + 'px';
  } else {
    // For vertical lines, thickness is width
    selectedEl.style.width = thickness + 'px';
  }
}

function makeLineHorizontal() {
  if (!selectedEl || selectedEl.dataset.type !== 'line') return;

  const currentWidth = parseInt(selectedEl.style.width) || 120;
  const currentHeight = parseInt(selectedEl.style.height) || 2;

  // Thickness is the smaller dimension
  const thickness = Math.min(currentWidth, currentHeight);
  // Length is the larger dimension
  const length = Math.max(currentWidth, currentHeight);

  // Make horizontal: width = length, height = thickness
  selectedEl.style.width = length + 'px';
  selectedEl.style.height = thickness + 'px';

  updatePropertiesPanel();
}

function makeLineVertical() {
  if (!selectedEl || selectedEl.dataset.type !== 'line') return;

  const currentWidth = parseInt(selectedEl.style.width) || 120;
  const currentHeight = parseInt(selectedEl.style.height) || 2;

  // Thickness is the smaller dimension
  const thickness = Math.min(currentWidth, currentHeight);
  // Length is the larger dimension
  const length = Math.max(currentWidth, currentHeight);

  // Make vertical: width = thickness, height = length
  selectedEl.style.width = thickness + 'px';
  selectedEl.style.height = length + 'px';

  updatePropertiesPanel();
}

// Picture Property Update Functions
function updatePictureObjectFit(fit) {
  if (!selectedEl) return;
  const img = selectedEl.querySelector('img');
  if (img) {
    img.style.objectFit = fit;
  }
}

function updatePictureOpacity(value) {
  if (!selectedEl) return;
  const opacity = value / 100;
  selectedEl.style.opacity = opacity;
  document.getElementById('pictureOpacityValue').textContent = value + '%';
}

function updatePictureBorder(width) {
  if (!selectedEl) return;
  selectedEl.style.borderWidth = width + 'px';
  selectedEl.style.borderStyle = width > 0 ? 'solid' : 'none';
}

function updatePictureBorderColor(color) {
  if (!selectedEl) return;
  selectedEl.style.borderColor = color;
  // Ensure border is visible
  if (!selectedEl.style.borderWidth || selectedEl.style.borderWidth === '0px') {
    selectedEl.style.borderWidth = '2px';
    selectedEl.style.borderStyle = 'solid';
    // Update the border width input if it exists
    const borderInput = document.getElementById('propPictureBorder');
    if (borderInput) borderInput.value = '2';
  }
}

// Grid and Snap Toggle Functions
