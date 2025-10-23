// PDF Export and Generation
// Extracted from script.js lines 1459-1679

// Generate PDFs function
async function generatePDFs() {
  const dataFile = document.getElementById("csvFile");
  if (!dataFile.files.length) return alert("Please select a data file (CSV or Excel)");

  const file = dataFile.files[0];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  // Function to process rows and generate PDFs as ZIP
  async function processRows(rows) {
    const { jsPDF } = window.jspdf;
    const zip = new JSZip();
    let processedCount = 0;

    // Get UI elements
    const exportBtn = document.getElementById('exportBtn');
    const exportBtnText = document.getElementById('exportBtnText');
    const exportProgressOverlay = document.getElementById('exportProgressOverlay');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Disable button and show progress modal
    exportBtn.disabled = true;
    exportBtnText.textContent = 'Generating...';
    exportProgressOverlay.style.display = 'flex';

    const totalCount = rows.length;

    // Throttle progress updates for smoother animation
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 100; // Update UI every 100ms max

    function updateProgress(count, total) {
      const now = Date.now();
      if (now - lastUpdateTime < UPDATE_INTERVAL && count < total) {
        return; // Skip update if too soon
      }
      lastUpdateTime = now;

      requestAnimationFrame(() => {
        const progress = Math.round((count / total) * 100);
        progressFill.style.width = progress + '%';
        progressText.textContent = `Generating ${count} of ${total} hall tickets... (${progress}%)`;
      });
    }

    try {
      // Parallel processing configuration
      const BATCH_SIZE = 10; // Process 10 PDFs in parallel

      // Function to generate a single PDF
      async function generateSinglePDF(row, index) {
        const clone = canvas.cloneNode(true);
        // Remove grid from PDF
        clone.classList.remove("show-grid");
        clone.querySelectorAll(".resize-handle").forEach(h => h.remove());
        clone.querySelectorAll(".table-col-resize-handle, .table-row-resize-handle").forEach(h => h.remove());
        clone.querySelectorAll(".lock-btn").forEach(h => h.remove());
        clone.querySelectorAll(".selected").forEach(n => n.classList.remove("selected"));
        clone.querySelectorAll(".field").forEach(f => {
          const val = row[f.dataset.field] || "";
          f.textContent = val;
          f.style.border = "none";
          f.style.background = "transparent";
        });
        clone.querySelectorAll(".text").forEach(t => {
          t.style.border = "none";
          t.style.background = "transparent";
          t.contentEditable = false; // Disable editing in PDF
        });
        clone.querySelectorAll(".picture").forEach(p => {
          p.style.border = "none"; // Remove border in PDF
          p.style.background = "transparent"; // Remove background in PDF
        });

        // Hide clone from view (position off-screen but keep visible for html2canvas)
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '-9999px';
        clone.style.zIndex = '-1';

        document.body.appendChild(clone);

        // Optimize html2canvas settings for smaller file size
        const snapshot = await html2canvas(clone, {
          scale: 2,              // Lower scale (default is window.devicePixelRatio which can be 2-3)
          useCORS: true,         // Enable CORS for images
          allowTaint: false,     // Prevent tainted canvas
          backgroundColor: '#ffffff',  // White background
          logging: false,        // Disable logging for performance
          imageTimeout: 0        // No timeout for images
        });

        document.body.removeChild(clone);

        // Get canvas dimensions
        const imgWidth = snapshot.width;
        const imgHeight = snapshot.height;

        // Convert to JPEG with compression for much smaller file size
        const imgData = snapshot.toDataURL("image/jpeg", 0.85); // 85% quality JPEG

        const pdf = new jsPDF({
          orientation: imgWidth > imgHeight ? "landscape" : "portrait",
          unit: "px",
          format: [imgWidth, imgHeight],
          compress: true  // Enable PDF compression
        });

        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, 'FAST');

        const pdfBlob = pdf.output('blob');

        // Get the selected filename field from the dropdown
        const filenameField = document.getElementById("filenameFieldSelector")?.value || "hall_ticket_number";
        let fileNameValue = row[filenameField] || `ticket_${index + 1}`;
        // Replace spaces with underscores
        fileNameValue = fileNameValue.toString().replace(/\s+/g, '_');
        const fileName = `${fileNameValue}.pdf`;

        return { fileName, pdfBlob };
      }

      // Process rows in batches
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        // Generate all PDFs in this batch in parallel
        const batchPromises = batch.map((row, batchIndex) =>
          generateSinglePDF(row, i + batchIndex)
        );

        const batchResults = await Promise.all(batchPromises);

        // Add all PDFs from this batch to ZIP
        batchResults.forEach(({ fileName, pdfBlob }) => {
          zip.file(fileName, pdfBlob);
          processedCount++;
        });

        // Update progress after each batch (throttled)
        updateProgress(processedCount, totalCount);
      }

      // Update progress for ZIP creation
      requestAnimationFrame(() => {
        progressFill.style.width = '100%';
        progressText.textContent = 'Creating ZIP file...';
      });

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({type: 'blob'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'hall_tickets.zip';
      a.click();
      URL.revokeObjectURL(a.href);

      // Track PDF generation in Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pdf_generated', {
          'event_category': 'engagement',
          'event_label': 'hall_tickets',
          'value': totalCount
        });
      }

      // Success
      requestAnimationFrame(() => {
        progressText.textContent = `✓ Successfully generated ${totalCount} hall tickets!`;
      });

      setTimeout(() => {
        exportProgressOverlay.style.display = 'none';
        exportBtn.disabled = false;
        exportBtnText.textContent = 'Export All Hall Tickets';
        progressFill.style.width = '0%';
      }, 2000);

    } catch (error) {
      // Error handling
      progressText.textContent = '✗ Error generating hall tickets: ' + error.message;
      progressFill.style.width = '0%';

      setTimeout(() => {
        exportProgressOverlay.style.display = 'none';
        exportBtn.disabled = false;
        exportBtnText.textContent = 'Export All Hall Tickets';
      }, 4000);
    }
  }

  if (fileExtension === 'csv') {
    // Parse CSV file
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        await processRows(results.data);
      }
    });
  } else if (['xlsx', 'xls', 'xlsm'].includes(fileExtension)) {
    // Parse Excel file
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        await processRows(jsonData);
      } catch (error) {
        alert('Error reading Excel file: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
  }
}

// Initialize field selector on page load
populateFieldSelector();

// Properties Panel Functions
