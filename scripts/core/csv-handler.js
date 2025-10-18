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
    csvHeaders.forEach(header => {
      const option = document.createElement("option");
      option.value = header;
      option.textContent = header;
      selector.appendChild(option);
    });
  }
}

