// Desktop UI Components
// Extracted from script.js lines 1680-1862

// Simplified toolbar state (no longer needed for sidebar)
function updateToolbarState() {
  // This function is kept for compatibility but no longer updates sidebar controls
  // Properties panel handles all element-specific controls now
}

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
      <div class="property-drag-control" data-input="bgOpacity">
        <span class="drag-control-label">Opacity</span>
        <span class="drag-control-value" id="opacityValue">${Math.round(bgTransform.opacity * 100)}%</span>
        <input type="number" id="bgOpacity" min="0" max="100" value="${Math.round(bgTransform.opacity * 100)}" step="5" onchange="updateBackgroundOpacity()" style="display:none;" />
      </div>
      <div class="property-drag-control" data-input="bgScale">
        <span class="drag-control-label">Scale</span>
        <span class="drag-control-value" id="scaleValue">${Math.round(bgTransform.scale * 100)}%</span>
        <input type="number" id="bgScale" min="10" max="200" value="${Math.round(bgTransform.scale * 100)}" step="5" onchange="updateBackgroundTransform()" style="display:none;" />
      </div>
      <div class="property-drag-control" data-input="bgRotate">
        <span class="drag-control-label">Rotation</span>
        <span class="drag-control-value" id="rotateValue">${bgTransform.rotate}°</span>
        <input type="number" id="bgRotate" min="0" max="360" value="${bgTransform.rotate}" step="1" onchange="updateBackgroundTransform()" style="display:none;" />
      </div>
      <div class="property-group">
        <button class="btn-property btn-property-icon" onclick="flipBackgroundH()" data-tooltip="Flip Horizontal">
          <svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3m8 0h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3m0 18V3"/></svg>
        </button>
        <button class="btn-property btn-property-icon" onclick="flipBackgroundV()" data-tooltip="Flip Vertical">
          <svg viewBox="0 0 24 24"><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M21 12H3"/></svg>
        </button>
        <button class="btn-property btn-property-icon" onclick="resetBackgroundTransform()" data-tooltip="Reset Transform">
          <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
        </button>
        <button class="btn-property btn-property-icon" onclick="resizeCanvasToBackground()" data-tooltip="Resize Canvas to Image">
          <svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
        </button>
        <button class="btn-property btn-property-icon btn-danger" onclick="clearBackground()" data-tooltip="Delete Background">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    `;

    // Initialize drag controls for background properties
    setTimeout(() => initBackgroundDragControls(), 0);
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
    const width = parseInt(cs.width);
    const height = parseInt(cs.height);
    // Thickness is the smaller dimension
    const thickness = Math.min(width, height);

    content.innerHTML = `
      <div class="property-group">
        <label class="property-label">Color</label>
        <input type="color" class="property-color-input" id="propLineColor" value="${rgbToHex(bgColor)}" onchange="updateLineColor(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Thickness</label>
        <input type="number" class="property-input small" id="propLineThickness" min="1" max="10" value="${thickness}" onchange="updateLineThickness(this.value)" />
      </div>
      <div class="property-group">
        <button class="btn-property btn-property-icon" onclick="makeLineHorizontal()" data-tooltip="Make Horizontal">
          <svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
        </button>
        <button class="btn-property btn-property-icon" onclick="makeLineVertical()" data-tooltip="Make Vertical">
          <svg viewBox="0 0 24 24"><path d="M12 5v14"/></svg>
        </button>
      </div>
    `;
  }

  // Picture properties
  else if (type === 'picture') {
    title.textContent = 'Picture Properties';

    const img = selectedEl.querySelector('img');
    const currentFit = img ? (img.style.objectFit || 'contain') : 'contain';
    const currentOpacity = selectedEl.style.opacity || '1';

    content.innerHTML = `
      <div class="property-group">
        <label class="property-label">Object Fit</label>
        <select class="property-input" id="propObjectFit" onchange="updatePictureObjectFit(this.value)">
          <option value="contain" ${currentFit === 'contain' ? 'selected' : ''}>Contain</option>
          <option value="cover" ${currentFit === 'cover' ? 'selected' : ''}>Cover</option>
          <option value="fill" ${currentFit === 'fill' ? 'selected' : ''}>Fill</option>
          <option value="none" ${currentFit === 'none' ? 'selected' : ''}>None</option>
        </select>
      </div>
      <div class="property-group">
        <label class="property-label">Opacity</label>
        <span class="property-value" id="pictureOpacityValue">${Math.round(parseFloat(currentOpacity) * 100)}%</span>
        <input type="range" class="property-input-range" id="propPictureOpacity" min="0" max="100" value="${Math.round(parseFloat(currentOpacity) * 100)}" step="5" oninput="updatePictureOpacity(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Border</label>
        <input type="number" class="property-input small" id="propPictureBorder" min="0" max="20" value="${parseInt(selectedEl.style.borderWidth) || 0}" onchange="updatePictureBorder(this.value)" />
      </div>
      <div class="property-group">
        <label class="property-label">Border Color</label>
        <input type="color" class="property-color-input" id="propPictureBorderColor" value="${rgbToHex(window.getComputedStyle(selectedEl).borderColor || '#000000')}" onchange="updatePictureBorderColor(this.value)" />
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

// Header Modal Functions
function showKeyboardShortcuts() {
  document.getElementById('shortcutsOverlay').style.display = 'flex';
}

function closeKeyboardShortcuts() {
  document.getElementById('shortcutsOverlay').style.display = 'none';
}

function showHelp() {
  document.getElementById('helpOverlay').style.display = 'flex';
}

function closeHelp() {
  document.getElementById('helpOverlay').style.display = 'none';
}

// Export Settings Modal Functions
function showExportSettings() {
  document.getElementById('exportSettingsOverlay').style.display = 'flex';
}

function closeExportSettings() {
  document.getElementById('exportSettingsOverlay').style.display = 'none';
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    if (e.target.id === 'shortcutsOverlay') {
      closeKeyboardShortcuts();
    } else if (e.target.id === 'helpOverlay') {
      closeHelp();
    } else if (e.target.id === 'exportSettingsOverlay') {
      closeExportSettings();
    }
  }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const shortcutsOverlay = document.getElementById('shortcutsOverlay');
    const helpOverlay = document.getElementById('helpOverlay');
    const exportSettingsOverlay = document.getElementById('exportSettingsOverlay');

    if (shortcutsOverlay && shortcutsOverlay.style.display === 'flex') {
      closeKeyboardShortcuts();
    } else if (helpOverlay && helpOverlay.style.display === 'flex') {
      closeHelp();
    } else if (exportSettingsOverlay && exportSettingsOverlay.style.display === 'flex') {
      closeExportSettings();
    }
  }
});
