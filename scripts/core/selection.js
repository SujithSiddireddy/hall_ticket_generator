// Selection Management
// This module handles element selection and multi-selection

// Select element (single or multi-selection)
function selectElement(el, addToSelection = false) {
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

// Clear all selections
function clearSelection() {
  if (selectedEl) selectedEl.classList.remove('selected');
  selectedElements.forEach(elem => elem.classList.remove('selected'));
  selectedEl = null;
  selectedElements = [];
  updateToolbarState();
  closePropertiesPanel();
}

// Delete selected elements
function deleteSelected() {
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

