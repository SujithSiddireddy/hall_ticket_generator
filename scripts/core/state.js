// Global State & Constants
// This module contains all global state variables and constants used across the application

// DOM References
const canvas = document.getElementById("canvas");
const bgImage = document.getElementById("bgImage");

// Drag and resize state
let currentDrag = null;
let resizing = null;
let offsetX = 0;
let offsetY = 0;

// Selection state
let selectedEl = null;
let selectedElements = []; // Array to hold multiple selected elements

// CSV data state
let csvHeaders = []; // Store CSV headers for dynamic field population
let csvData = []; // Store CSV data rows

// Grid and snap settings
let showGrid = true;
let snapToGrid = true;
let gridSize = 5;

// Mouse position tracking
let mouseX = 0;
let mouseY = 0;

// Selection box state
let selectionBox = null;
let isSelecting = false;
let selectionStartX = 0;
let selectionStartY = 0;

// Page size presets (in pixels - adjusted for grid alignment)
// Using grid-friendly dimensions that are close to actual A4 sizes
const pageSizePresets = {
  'default': { width: 800, height: 560 },        // ~Half A4 (grid-friendly: 40x28 cells at 20px)
  'a4': { width: 800, height: 1120 },            // ~A4 Portrait (grid-friendly: 40x56 cells at 20px)
  'a4-landscape': { width: 1120, height: 800 },  // ~A4 Landscape (grid-friendly: 56x40 cells at 20px)
  'custom': { width: 900, height: 600 }          // Custom size
};

// Background transform state
let bgTransform = {
  scale: 1,
  rotate: 0,
  flipH: 1,
  flipV: 1,
  opacity: 1
};

// Table resize state
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidths = [];
let resizeStartHeights = [];
let resizingTable = null;
let resizingColIndex = -1;
let resizingRowIndex = -1;

