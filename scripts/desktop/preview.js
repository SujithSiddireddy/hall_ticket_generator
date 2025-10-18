// Desktop Preview Modal
// Extracted from script.js lines 1325-1458

function showPreview() {
  const dataFile = document.getElementById("csvFile");
  if (!dataFile.files.length) {
    alert("Please select a data file (CSV or Excel) first");
    return;
  }

  const file = dataFile.files[0];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (fileExtension === 'csv') {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        previewData = results.data;
        if (previewData.length === 0) {
          alert("No data found in CSV file");
          return;
        }
        currentPreviewIndex = 0;
        openPreviewModal();
      },
      error: function(error) {
        alert('Error reading CSV file: ' + error.message);
      }
    });
  } else if (['xlsx', 'xls'].includes(fileExtension)) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        previewData = jsonData;
        if (previewData.length === 0) {
          alert("No data found in Excel file");
          return;
        }
        currentPreviewIndex = 0;
        openPreviewModal();
      } catch (error) {
        alert('Error reading Excel file: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function openPreviewModal() {
  const overlay = document.getElementById('previewOverlay');
  const totalRecords = document.getElementById('totalRecords');

  totalRecords.textContent = previewData.length;
  overlay.style.display = 'flex';

  renderPreview();
}

function closePreview() {
  const overlay = document.getElementById('previewOverlay');
  overlay.style.display = 'none';

  // Clear preview
  const previewCanvas = document.getElementById('previewCanvas');
  previewCanvas.innerHTML = '';
}

function renderPreview() {
  if (previewData.length === 0) return;

  const row = previewData[currentPreviewIndex];
  const previewCanvas = document.getElementById('previewCanvas');
  const currentRecord = document.getElementById('currentRecord');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // Update counter
  currentRecord.textContent = currentPreviewIndex + 1;

  // Update button states
  prevBtn.disabled = currentPreviewIndex === 0;
  nextBtn.disabled = currentPreviewIndex === previewData.length - 1;

  // Clone canvas and populate with data
  const clone = canvas.cloneNode(true);

  // Remove interactive elements
  clone.classList.remove("show-grid");
  clone.querySelectorAll(".resize-handle").forEach(h => h.remove());
  clone.querySelectorAll(".table-col-resize-handle, .table-row-resize-handle").forEach(h => h.remove());
  clone.querySelectorAll(".lock-btn").forEach(h => h.remove());
  clone.querySelectorAll(".selected").forEach(n => n.classList.remove("selected"));

  // Populate fields with data
  clone.querySelectorAll(".field").forEach(f => {
    const val = row[f.dataset.field] || "";
    f.textContent = val;
    f.style.border = "none";
    f.style.background = "transparent";
  });

  clone.querySelectorAll(".text").forEach(t => {
    t.style.border = "none";
    t.style.background = "transparent";
    t.contentEditable = false;
  });

  clone.querySelectorAll(".picture").forEach(p => {
    p.style.border = "none";
    p.style.background = "transparent";
  });

  // Clear and add to preview
  previewCanvas.innerHTML = '';
  previewCanvas.appendChild(clone);
}

function previousRecord() {
  if (currentPreviewIndex > 0) {
    currentPreviewIndex--;
    renderPreview();
  }
}

function nextRecord() {
  if (currentPreviewIndex < previewData.length - 1) {
    currentPreviewIndex++;
    renderPreview();
  }
}

