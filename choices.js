// Add a new choice block when "Add More Choice" is clicked
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

// Gather choices (text and images) and store in localStorage, then redirect
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

// When "Next" is clicked, request motion permission then gather choices and redirect
document.getElementById('next-button').addEventListener('click', async () => {
  // Request permission if needed (iOS 13+)
  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
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
  // Permission granted (or not needed): gather choices and redirect
  gatherChoicesAndRedirect();
});
