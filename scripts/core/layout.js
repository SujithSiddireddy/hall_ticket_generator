// Layout Save/Load Functions
// Extracted from script.js lines 1238-1324

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

      // Make resizable for appropriate element types
      if (node.classList.contains("rect") || node.classList.contains("table") || node.classList.contains("line") || node.classList.contains("picture"))
        makeResizable(node);

      // Re-enable editing for text elements
      if (node.classList.contains("text")) {
        node.contentEditable = false; // Start as non-editable

        // Re-add double-click event listener
        node.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          node.contentEditable = true;
          node.focus();
          placeCaretAtEnd(node);
          updateToolbarState();
        });

        // Exit editing on blur or Enter
        node.addEventListener('blur', () => {
          node.contentEditable = false;
          updateToolbarState();
        });

        node.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            node.blur();
          }
        });
      }

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

