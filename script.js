const preloaderEl = document.querySelector(".loader-container");
const firstWordArr = ["Don't", "know", "what", "to", "do?"];
const secondWordArr = ["Let", "the", "Universe", "decide"];
let counter = 0;
let hasChosen = false;

// Store input data instead of DOM elements
let savedChoices = [];

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

document.getElementById('request-motion').addEventListener('click', requestMotionPermission);

async function requestMotionPermission() {
  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
    try {
      const response = await DeviceMotionEvent.requestPermission();
      if (response === "granted") {
        afterPermissionGranted();
        document.activeElement?.blur();
      } else {
        alert("Permission denied. Please enable device motion.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error requesting permission.");
    }
  } else {
    afterPermissionGranted();
  }
}

function afterPermissionGranted() {
  // Store input values and remove elements
  savedChoices = Array.from(document.querySelectorAll('.choice')).map(choice => {
    const textInput = choice.querySelector('input[type="text"]');
    const fileInput = choice.querySelector('input[type="file"]');
    return {
      text: textInput?.value || '',
      file: fileInput?.files[0] || null
    };
  });

  // Remove all interactive elements
  document.getElementById('choice-instructions').remove();
  document.getElementById('choices-container').remove();
  document.getElementById('add-choice').remove();
  document.getElementById('request-motion').remove();

  // Add anti-undo class and show UI
  document.body.classList.add('anti-undo');
  document.getElementById('jiggle-heading').style.display = 'block';
  document.getElementById('simulate-jiggle').style.display = 'block';
  
  // Remove any remaining inputs
  document.querySelectorAll('input').forEach(input => input.remove());
  
  window.addEventListener("devicemotion", handleMotion);
}

function handleMotion(event) {
  if (hasChosen) return;
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;
  const threshold = 15;
  if (Math.abs(acc.x) > threshold || Math.abs(acc.y) > threshold || Math.abs(acc.z) > threshold) {
    triggerChoice();
  }
}

document.getElementById('simulate-jiggle').addEventListener('click', () => {
  if (!hasChosen) triggerChoice();
});

function triggerChoice() {
  hasChosen = true;
  document.getElementById('jiggle-heading').classList.remove('jiggle-effect');
  chooseRandom();
  window.removeEventListener("devicemotion", handleMotion);
}

function chooseRandom() {
  const randomIndex = Math.floor(Math.random() * savedChoices.length);
  const chosen = savedChoices[randomIndex];
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = '';

  if (chosen.file) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(chosen.file);
    resultEl.appendChild(img);
  } else if (chosen.text.trim()) {
    resultEl.textContent = chosen.text;
  } else {
    resultEl.textContent = "No valid input in chosen option.";
  }
}
