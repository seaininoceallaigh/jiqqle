const preloaderEl = document.querySelector(".loader-container");
const firstWordArr = ["Don't", "know", "what", "to", "do?"];
const secondWordArr = ["Let", "the", "Universe", "decide"];
let counter = 0;
let hasChosen = false;
let savedChoices = [];

// New helper function to clear iOS undo stack
function clearUndoStack() {
  const tempInput = document.createElement('input');
  tempInput.style.cssText = 'position:fixed;opacity:0;height:0;width:0;';
  document.body.appendChild(tempInput);
  tempInput.focus();
  setTimeout(() => {
    tempInput.blur();
    document.body.removeChild(tempInput);
    try {
      document.execCommand('undo');
      document.execCommand('redo');
    } catch(e) {}
  }, 50);
}

function displayLetter(letter, container) {
  counter++;
  const newDiv = document.createElement('div');
  newDiv.className = `loading large ${counter}`;
  newDiv.style.setProperty('--X', `${Math.random()*200-100}px`);
  newDiv.style.setProperty('--Y', `${Math.random()*200-100}px`);
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
  choiceDiv.innerHTML = `
    <input type="text" placeholder="Enter text">
    <input type="file" accept="image/*">
  `;
  document.getElementById('choices-container').appendChild(choiceDiv);
});

document.getElementById('request-motion').addEventListener('click', requestMotionPermission);

async function requestMotionPermission() {
  if (typeof DeviceMotionEvent?.requestPermission === 'function') {
    try {
      const response = await DeviceMotionEvent.requestPermission();
      if (response === 'granted') afterPermissionGranted();
      else alert('Permission denied');
    } catch(e) { console.error(e); }
  } else {
    afterPermissionGranted();
  }
}

function afterPermissionGranted() {
  // Save data and destroy inputs
  savedChoices = Array.from(document.querySelectorAll('.choice')).map(choice => {
    const text = choice.querySelector('input[type="text"]')?.value || '';
    const file = choice.querySelector('input[type="file"]')?.files[0] || null;
    return { text, file };
  });

  // Remove all inputs and UI elements
  document.querySelectorAll('input').forEach(input => {
    input.replaceWith(input.cloneNode(false));
    input.remove();
  });
  
  ['choice-instructions', 'choices-container', 'add-choice', 'request-motion']
    .forEach(id => document.getElementById(id)?.remove());

  // Clear undo stack and prevent interactions
  clearUndoStack();
  document.body.classList.add('anti-undo');
  document.activeElement?.blur();
  
  // Force layout recalculation
  void document.body.offsetHeight;

  // Show jiggle UI
  document.getElementById('jiggle-heading').style.display = 'block';
  document.getElementById('simulate-jiggle').style.display = 'block';
  
  // Add motion listener after cleanup
  setTimeout(() => window.addEventListener('devicemotion', handleMotion), 100);
}

function handleMotion(event) {
  if (hasChosen) return;
  const acc = event.accelerationIncludingGravity || {};
  const threshold = 15;
  if ([acc.x, acc.y, acc.z].some(v => Math.abs(v) > threshold)) {
    triggerChoice();
  }
}

document.getElementById('simulate-jiggle').addEventListener('click', triggerChoice);

function triggerChoice() {
  if (hasChosen) return;
  hasChosen = true;
  document.getElementById('jiggle-heading').classList.remove('jiggle-effect');
  window.removeEventListener('devicemotion', handleMotion);
  
  const choice = savedChoices[Math.floor(Math.random() * savedChoices.length)];
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = '';
  
  if (choice.file) {
    const img = new Image();
    img.src = URL.createObjectURL(choice.file);
    resultEl.appendChild(img);
  } else {
    resultEl.textContent = choice.text.trim() || "No valid input";
  }
}
