// Desktop Keyboard Shortcuts
// Extracted from script.js lines 632-742

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
      // Lock all selected elements
      const elementsToLock = selectedElements.length > 0 ? selectedElements : [selectedEl];
      elementsToLock.forEach(elem => {
        const lockBtn = elem.querySelector('.lock-btn');
        if (lockBtn && !elem.classList.contains('locked')) {
          toggleLock(elem, lockBtn);
        }
      });
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
  // U unlocks the selected element(s)
  else if (e.key === 'u' || e.key === 'U'){
    e.preventDefault();
    const elementsToUnlock = selectedElements.length > 0 ? selectedElements : [selectedEl];
    elementsToUnlock.forEach(elem => {
      const lockBtn = elem.querySelector('.lock-btn');
      if (lockBtn && elem.classList.contains('locked')) {
        toggleLock(elem, lockBtn);
      }
    });
  }
});
