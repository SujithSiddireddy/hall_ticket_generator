// Desktop Mouse Interactions
// Extracted from script.js lines 396-503

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

    if (e.target.classList.contains("resize-handle")) return;
    if (el.isContentEditable && document.activeElement === el) return; // Don't drag while actively editing text

    // Check if element is already selected
    const isAlreadySelected = selectedElements.includes(el);
    const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;

    // Handle selection logic
    if (isMultiSelect) {
      // Ctrl/Cmd+click: toggle selection or add to selection
      selectElement(el, true);
    } else if (!isAlreadySelected) {
      // Clicking on non-selected element without Ctrl/Cmd: select only this element
      selectElement(el, false);
    }
    // If clicking on already-selected element without Ctrl/Cmd: keep current selection and start drag

    // Prepare to drag
    currentDrag = el;

    // Calculate offset in canvas coordinates (accounting for zoom)
    const canvasCoords = screenToCanvasCoords(e.clientX, e.clientY);
    const elementLeft = parseFloat(el.style.left) || 0;
    const elementTop = parseFloat(el.style.top) || 0;

    offsetX = canvasCoords.x - elementLeft;
    offsetY = canvasCoords.y - elementTop;

    // If multiple elements selected, store initial positions of all
    if (selectedElements.length > 1) {
      selectedElements.forEach(elem => {
        elem.dataset.dragStartLeft = elem.style.left;
        elem.dataset.dragStartTop = elem.style.top;
      });
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

