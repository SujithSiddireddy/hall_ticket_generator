// Element Creation Functions
// Extracted from script.js lines 917-1238

// Add field function
function addField() {
  const field = document.getElementById("fieldSelector").value;
  const div = document.createElement("div");
  div.className = "field";
  div.dataset.type = "field";
  div.dataset.field = field;
  div.textContent = `{{${field}}}`;
  makeDraggable(div);
  addLockButton(div);

  // Temporarily position off-screen to measure
  div.style.left = "-9999px";
  div.style.top = "-9999px";
  canvas.appendChild(div);

  // Get height to center vertically
  const height = div.offsetHeight;

  // Position with left-center at mouse position
  div.style.left = snapValue(mouseX || 50) + "px";
  div.style.top = snapValue((mouseY || 50) - height / 2) + "px";

  updateZIndexes();
  selectElement(div);
}

// Add rectangle function
function addRectangle() {
  console.log('Adding rectangle at mouseX:', mouseX, 'mouseY:', mouseY);
  const rect = document.createElement("div");
  rect.className = "rect";
  rect.dataset.type = "rect";
  const width = 120;
  const height = 60;

  // Use center of canvas if mouseX/mouseY are not set or are 0
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  const defaultX = canvasWidth / 2;
  const defaultY = canvasHeight / 2;

  const left = snapValue(((mouseX && mouseX > 0) ? mouseX : defaultX) - width / 2);
  const top = snapValue(((mouseY && mouseY > 0) ? mouseY : defaultY) - height / 2);

  console.log('Rectangle position - left:', left, 'top:', top);
  rect.style.left = left + "px";
  rect.style.top = top + "px";
  rect.style.width = width + "px";
  rect.style.height = height + "px";
  makeDraggable(rect);
  makeResizable(rect);
  addLockButton(rect);
  canvas.appendChild(rect);
  updateZIndexes();
  selectElement(rect);
}

// Add line function
function addLine() {
  const line = document.createElement("div");
  line.className = "line";
  line.dataset.type = "line";
  const width = 120;
  const height = 2;

  // Use center of canvas if mouseX/mouseY are not set or are 0
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  const defaultX = canvasWidth / 2;
  const defaultY = canvasHeight / 2;

  const posX = (mouseX && mouseX > 0) ? mouseX : defaultX;
  const posY = (mouseY && mouseY > 0) ? mouseY : defaultY;

  line.style.left = snapValue(posX - width / 2) + "px";
  line.style.top = snapValue(posY - height / 2) + "px";
  makeDraggable(line);
  makeResizable(line);
  addLockButton(line);
  canvas.appendChild(line);
  updateZIndexes();
  selectElement(line);
}

// Add text function
function addText() {
  const textDiv = document.createElement("div");
  textDiv.className = "text";
  textDiv.dataset.type = "text";
  textDiv.textContent = "Sample Text";
  textDiv.contentEditable = false; // Default not editing; double-click to edit

  // Enable editing on double-click
  textDiv.addEventListener('dblclick', (e)=>{
    e.stopPropagation();
    textDiv.contentEditable = true;
    textDiv.focus();
    placeCaretAtEnd(textDiv);
    updateToolbarState();
  });
  // Exit editing on blur or Enter
  textDiv.addEventListener('blur', ()=>{ textDiv.contentEditable = false; updateToolbarState(); });
  textDiv.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); textDiv.blur(); }
  });

  makeDraggable(textDiv);
  addLockButton(textDiv);

  // Use center of canvas if mouseX/mouseY are not set or are 0
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  const defaultX = canvasWidth / 2;
  const defaultY = canvasHeight / 2;

  // Temporarily position off-screen to measure
  textDiv.style.left = "-9999px";
  textDiv.style.top = "-9999px";
  canvas.appendChild(textDiv);

  // Get height to center vertically
  const height = textDiv.offsetHeight;

  // Position with left-center at mouse position or canvas center
  const posX = (mouseX && mouseX > 0) ? mouseX : defaultX;
  const posY = (mouseY && mouseY > 0) ? mouseY : defaultY;

  textDiv.style.left = snapValue(posX) + "px";
  textDiv.style.top = snapValue(posY - height / 2) + "px";

  updateZIndexes();
  selectElement(textDiv);

  // Automatically enable editing and select all text
  setTimeout(() => {
    textDiv.contentEditable = true;
    textDiv.focus();
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(textDiv);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    updateToolbarState();
  }, 0);
}

// Add picture function
function addPicture() {
  document.getElementById("pictureUpload").click();
}

// Add table function
function addTable() {
  const rows = 3;  // Default 3 rows
  const cols = 4;  // Default 4 columns

  const wrapper = document.createElement("div");
  wrapper.className = "table";
  wrapper.dataset.type = "table";
  const width = 400;
  const height = 200;

  // Use center of canvas if mouseX/mouseY are not set or are 0
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  const defaultX = canvasWidth / 2;
  const defaultY = canvasHeight / 2;

  const posX = (mouseX && mouseX > 0) ? mouseX : defaultX;
  const posY = (mouseY && mouseY > 0) ? mouseY : defaultY;

  wrapper.style.left = snapValue(posX - width / 2) + "px";
  wrapper.style.top = snapValue(posY - height / 2) + "px";
  wrapper.style.width = width + "px";
  wrapper.style.height = height + "px";

  const tbl = document.createElement("table");
  tbl.style.width = "100%";
  tbl.style.height = "100%";
  tbl.style.tableLayout = "fixed";

  // Calculate initial column widths
  const colWidth = 100 / cols;

  for (let r = 0; r < rows; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < cols; c++) {
      const td = document.createElement("td");
      td.textContent = "";
      td.style.width = colWidth + "%";
      td.style.position = "relative";
      tr.appendChild(td);
    }
    tbl.appendChild(tr);
  }
  wrapper.appendChild(tbl);

  // Add column resize handles
  addTableResizeHandles(wrapper, tbl);

  makeDraggable(wrapper);
  makeResizable(wrapper);
  addLockButton(wrapper);
  canvas.appendChild(wrapper);
  updateZIndexes();
  selectElement(wrapper);
}

// Add resize handles to table columns and rows
function addTableResizeHandles(wrapper, table) {
  const rows = table.rows;
  if (!rows || rows.length === 0) return;

  const cols = rows[0].cells.length;

  // Add column resize handles
  for (let c = 0; c < cols - 1; c++) {
    for (let r = 0; r < rows.length; r++) {
      const cell = rows[r].cells[c];
      const handle = document.createElement("div");
      handle.className = "table-col-resize-handle";
      handle.dataset.colIndex = c;
      handle.addEventListener("mousedown", startColumnResize);
      cell.appendChild(handle);
    }
  }

  // Add row resize handles
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = rows[r].cells[c];
      const handle = document.createElement("div");
      handle.className = "table-row-resize-handle";
      handle.dataset.rowIndex = r;
      handle.addEventListener("mousedown", startRowResize);
      cell.appendChild(handle);
    }
  }
}

// Column resize functionality
let resizingColumn = null;
// resizeStartX, resizeStartWidths are in state.js

function startColumnResize(e) {
  e.stopPropagation();
  e.preventDefault();

  const handle = e.target;
  const colIndex = parseInt(handle.dataset.colIndex);
  const table = handle.closest("table");
  const wrapper = handle.closest(".table");

  resizingColumn = { table, colIndex, wrapper };
  resizeStartX = e.clientX;

  // Store initial widths
  resizeStartWidths = [];
  const firstRow = table.rows[0];
  for (let i = 0; i < firstRow.cells.length; i++) {
    resizeStartWidths.push(firstRow.cells[i].offsetWidth);
  }

  document.addEventListener("mousemove", doColumnResize);
  document.addEventListener("mouseup", stopColumnResize);

  wrapper.style.cursor = "col-resize";
}

function doColumnResize(e) {
  if (!resizingColumn) return;

  const { table, colIndex } = resizingColumn;
  const deltaX = e.clientX - resizeStartX;

  const tableWidth = table.offsetWidth;
  const currentWidth = resizeStartWidths[colIndex];
  const nextWidth = resizeStartWidths[colIndex + 1];

  const newWidth = currentWidth + deltaX;
  const newNextWidth = nextWidth - deltaX;

  // Prevent columns from becoming too small
  if (newWidth < 20 || newNextWidth < 20) return;

  const newWidthPercent = (newWidth / tableWidth) * 100;
  const newNextWidthPercent = (newNextWidth / tableWidth) * 100;

  // Apply to all rows
  for (let r = 0; r < table.rows.length; r++) {
    table.rows[r].cells[colIndex].style.width = newWidthPercent + "%";
    table.rows[r].cells[colIndex + 1].style.width = newNextWidthPercent + "%";
  }
}

function stopColumnResize() {
  if (resizingColumn) {
    resizingColumn.wrapper.style.cursor = "";
    resizingColumn = null;
  }
  document.removeEventListener("mousemove", doColumnResize);
  document.removeEventListener("mouseup", stopColumnResize);
}

// Row resize functionality
let resizingRow = null;
// resizeStartY, resizeStartHeights are in state.js

function startRowResize(e) {
  e.stopPropagation();
  e.preventDefault();

  const handle = e.target;
  const rowIndex = parseInt(handle.dataset.rowIndex);
  const table = handle.closest("table");
  const wrapper = handle.closest(".table");

  resizingRow = { table, rowIndex, wrapper };
  resizeStartY = e.clientY;

  // Store initial heights
  resizeStartHeights = [];
  for (let i = 0; i < table.rows.length; i++) {
    resizeStartHeights.push(table.rows[i].offsetHeight);
  }

  document.addEventListener("mousemove", doRowResize);
  document.addEventListener("mouseup", stopRowResize);

  wrapper.style.cursor = "row-resize";
}

function doRowResize(e) {
  if (!resizingRow) return;

  const { table, rowIndex } = resizingRow;
  const deltaY = e.clientY - resizeStartY;

  const tableHeight = table.offsetHeight;
  const currentHeight = resizeStartHeights[rowIndex];
  const nextHeight = resizeStartHeights[rowIndex + 1];

  const newHeight = currentHeight + deltaY;
  const newNextHeight = nextHeight - deltaY;

  // Prevent rows from becoming too small
  if (newHeight < 20 || newNextHeight < 20) return;

  const newHeightPercent = (newHeight / tableHeight) * 100;
  const newNextHeightPercent = (newNextHeight / tableHeight) * 100;

  table.rows[rowIndex].style.height = newHeightPercent + "%";
  table.rows[rowIndex + 1].style.height = newNextHeightPercent + "%";
}

function stopRowResize() {
  if (resizingRow) {
    resizingRow.wrapper.style.cursor = "";
    resizingRow = null;
  }
  document.removeEventListener("mousemove", doRowResize);
  document.removeEventListener("mouseup", stopRowResize);
}

// Save layout function
