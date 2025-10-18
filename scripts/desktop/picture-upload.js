// Picture Upload Handler
// Extracted from script.js lines 107-144

// Picture upload handler (hidden input)
document.getElementById("pictureUpload").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      // Create a wrapper div for the image

      const wrapper = document.createElement("div");
      wrapper.className = "picture";
      wrapper.dataset.type = "picture";
      const width = 200;
      const height = 150;

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
      wrapper.style.position = "absolute";

      // Create the actual image element
      const img = document.createElement("img");
      img.src = ev.target.result;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.pointerEvents = "none"; // Prevent image from interfering with drag

      wrapper.appendChild(img);
      makeDraggable(wrapper);
      makeResizable(wrapper);
      addLockButton(wrapper);
      canvas.appendChild(wrapper);
      updateZIndexes();
      selectElement(wrapper);
    };
    reader.readAsDataURL(file);
  }
  // Reset input so same file can be selected again
  e.target.value = "";
});
