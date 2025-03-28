// Add new choice block when "Add More Choice" is clicked
document.getElementById('add-choice').addEventListener('click', () => {
  const choiceDiv = document.createElement('div');
  choiceDiv.className = 'choice';
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = 'Enter text';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  choiceDiv.appendChild(textInput);
  choiceDiv.appendChild(fileInput);
  document.getElementById('choices-container').appendChild(choiceDiv);
});

// Gather choices and convert any image files to Data URLs
function gatherChoicesAndRedirect() {
  const choicesElements = Array.from(document.querySelectorAll('.choice'));
  const choicesPromises = choicesElements.map(choice => {
    const textInput = choice.querySelector('input[type="text"]');
    const fileInput = choice.querySelector('input[type="file"]');
    return new Promise(resolve => {
      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          resolve({ text: textInput.value.trim(), image: e.target.result });
        };
        // Ensure the promise resolves even if an error occurs
        reader.onerror = function() {
          resolve({ text: textInput.value.trim(), image: null });
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        resolve({ text: textInput.value.trim(), image: null });
      }
    });
  });
  
  Promise.all(choicesPromises).then(choicesData => {
    localStorage.setItem('jiqqleChoices', JSON.stringify(choicesData));
    window.location.href = 'jiggle.html';
  });
}

// When "Next" is clicked, request motion permission (if needed) and then redirect
document.getElementById('next-button').addEventListener('click', async () => {
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    try {
      const response = await DeviceMotionEvent.requestPermission();
      if (response !== "granted") {
        alert("Motion permission not granted.");
        return;
      }
    } catch (err) {
      alert("Error requesting motion permission.");
      return;
    }
  }
  // If permission is granted or not required, gather choices and redirect
  gatherChoicesAndRedirect();
});
