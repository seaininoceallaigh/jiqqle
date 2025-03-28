const preloaderEl = document.querySelector(".loader-container");
const firstWordArr = ["Don't", "know", "what", "to", "do?"];
const secondWordArr = ["Let", "the", "Universe", "decide"];
let counter = 0;
let hasChosen = false; // ensure only one trigger

function displayLetter(letter, container) {
  counter++;
  const x = Math.floor(Math.random() * 200) - 100;
  const y = Math.floor(Math.random() * 200) - 100;
  const newDiv = document.createElement('div');
  newDiv.className = `loading large ${counter}`;
  newDiv.style.setProperty('--X', `${x}px`);
  newDiv.style.setProperty('--Y', `${y}px`);
  newDiv.textContent = letter;
  container.appendChild(newDiv);
}

function displayWord(arr, container) {
  arr.forEach(letter => displayLetter(letter, container));
}

function displayLoader() {
  preloaderEl.innerHTML = '';
  displayWord(firstWordArr, preloaderEl);
  setTimeout(() => {
    preloaderEl.innerHTML = '';
    displayWord(secondWordArr, preloaderEl);
    setTimeout(() => {
      document.querySelector('.preloader').style.display = 'none';
      document.getElementById('choices-section').style.display = 'flex';
    }, 3000);
  }, 3000);
}

displayLoader();

// Add More Choice button
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

// Request Device Motion Permission when "Next" is clicked
document.getElementById('request-motion').addEventListener('click', requestMotionPermission);

async function requestMotionPermission() {
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    try {
      const response = await DeviceMotionEvent.requestPermission();
      if (response === "granted") {
        afterPermissionGranted();
      } else {
        alert("Permission denied. Please enable device motion in your settings.");
      }
    } catch (err) {
      console.error("Error requesting permission:", err);
      alert("Error requesting permission.");
    }
  } else {
    afterPermissionGranted();
  }
}

function afterPermissionGranted() {
  // Hide initial instructions and choices
  document.getElementById('choice-instructions').style.display = 'none';
  document.getElementById('choices-container').style.display = 'none';
  document.getElementById('add-choice').style.display = 'none';
  document.getElementById('request-motion').style.display = 'none';
  
  // Immediately show jiggle header and simulation button
  document.getElementById('jiggle-heading').style.display = 'block';
  document.getElementById('simulate-jiggle').style.display = 'block';
  
  // Listen for device motion (if available)
  window.addEventListener("devicemotion", handleMotion);
}

function handleMotion(event) {
  if (hasChosen) return; // Only one trigger allowed
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;
  const threshold = 15;
  if (
    Math.abs(acc.x) > threshold ||
    Math.abs(acc.y) > threshold ||
    Math.abs(acc.z) > threshold
  ) {
    triggerChoice();
  }
}

document.getElementById('simulate-jiggle').addEventListener('click', () => {
  if (!hasChosen) triggerChoice();
});

function triggerChoice() {
  hasChosen = true;
//try to stop shake undo
  if(document.activeElement) document.activeElement.blur();

  
  // Stop jiggle effect by removing the jiggle-effect class
  document.getElementById('jiggle-heading').classList.remove('jiggle-effect');
  chooseRandom();
  // Remove the devicemotion listener to prevent further triggers
  window.removeEventListener("devicemotion", handleMotion);
}

function chooseRandom() {
  const choices = document.querySelectorAll('.choice');
  const randomIndex = Math.floor(Math.random() * choices.length);
  const chosenChoice = choices[randomIndex];
  const textInput = chosenChoice.querySelector('input[type="text"]');
  const fileInput = chosenChoice.querySelector('input[type="file"]');
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = '';
  
  if (fileInput.files && fileInput.files[0]) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(fileInput.files[0]);
    resultEl.appendChild(img);
  } else if (textInput.value.trim() !== '') {
    resultEl.textContent = textInput.value;
  } else {
    resultEl.textContent = "No valid input in chosen option.";
  }
}
