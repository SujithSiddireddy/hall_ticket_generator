// CSV/Excel File Processing
// This module handles CSV and Excel file uploads and parsing

// Initialize CSV file upload handler
function initCSVHandler() {
  const csvFileInput = document.getElementById("csvFile");
  if (!csvFileInput) return;
  
  csvFileInput.addEventListener("change", handleCSVUpload);
}

// Handle CSV/Excel file upload
function handleCSVUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (fileExtension === 'csv') {
    // Parse CSV file
    Papa.parse(file, {
      header: true,
      preview: 1, // Only parse first row to get headers
      complete: function(results) {
        if (results.meta && results.meta.fields) {
          csvHeaders = results.meta.fields;
          populateFieldSelector();
        }
      }
    });
  } else if (['xlsx', 'xls', 'xlsm'].includes(fileExtension)) {
    // Parse Excel file
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});

        if (jsonData.length > 0) {
          // First row contains headers
          csvHeaders = jsonData[0].filter(h => h !== undefined && h !== null && h !== '');
          populateFieldSelector();
        }
      } catch (error) {
        alert('Error reading Excel file: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
  }
}

// Populate field selector dropdown with CSV headers
function populateFieldSelector() {
  const selector = document.getElementById("fieldSelector");
  if (!selector) return;

  selector.innerHTML = ""; // Clear existing options

  if (csvHeaders.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Upload CSV first";
    selector.appendChild(option);
    selector.disabled = true;
  } else {
    selector.disabled = false;

    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Add field...";
    selector.appendChild(defaultOption);

    // Add field options
    csvHeaders.forEach(header => {
      const option = document.createElement("option");
      option.value = header;
      option.textContent = header;
      selector.appendChild(option);
    });
  }

  // Also populate filename field selector
  const filenameSelector = document.getElementById("filenameFieldSelector");
  if (filenameSelector) {
    filenameSelector.innerHTML = "";

    if (csvHeaders.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Upload data file first";
      filenameSelector.appendChild(option);
      filenameSelector.disabled = true;
    } else {
      filenameSelector.disabled = false;
      csvHeaders.forEach(header => {
        const option = document.createElement("option");
        option.value = header;
        option.textContent = header;
        // Pre-select hall_ticket_number if it exists
        if (header === 'hall_ticket_number') {
          option.selected = true;
        }
        filenameSelector.appendChild(option);
      });
    }
  }
}

// Handle field selection - add field and reset dropdown
function handleFieldSelection() {
  const selector = document.getElementById("fieldSelector");
  const selectedField = selector.value;

  // Only add if a valid field is selected (not the default option)
  if (selectedField) {
    addFieldByName(selectedField);
    // Reset dropdown to default option
    selector.value = "";
  }
}

// Add field by name (extracted from addField for reusability)
function addFieldByName(fieldName) {
  const div = document.createElement("div");
  div.className = "field";
  div.dataset.type = "field";
  div.dataset.field = fieldName;
  div.textContent = `{{${fieldName}}}`;
  makeDraggable(div);
  addLockButton(div);

  // Use center of canvas if mouseX/mouseY are not set or are 0
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  const defaultX = canvasWidth / 2;
  const defaultY = canvasHeight / 2;

  // Temporarily position off-screen to measure
  div.style.left = "-9999px";
  div.style.top = "-9999px";
  canvas.appendChild(div);

  // Get height to center vertically
  const height = div.offsetHeight;

  // Position with left-center at mouse position or canvas center
  const posX = (mouseX && mouseX > 0) ? mouseX : defaultX;
  const posY = (mouseY && mouseY > 0) ? mouseY : defaultY;

  div.style.left = snapValue(posX) + "px";
  div.style.top = snapValue(posY - height / 2) + "px";

  updateZIndexes();
  selectElement(div);
}

