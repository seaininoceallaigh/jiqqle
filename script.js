const preloaderEl = document.querySelector(".loader-container");
const firstWordArr = ["Don't", "know", "what", "to", "do?"];
const secondWordArr = ["Let", "the", "Universe", "decide"];
let counter = 0;
let hasChosen = false;
let savedChoices = [];

// Revised input cleanup
function safeInputCleanup() {
  // 1. Hide inputs visually but keep in DOM
  document.querySelectorAll('input').forEach(input => {
    input.style.cssText = `
      position: absolute !important;
      height: 1px !important;
      width: 1px !important;
      overflow: hidden !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
      -webkit-user-modify: read-only !important;
    `;
    input.readOnly = true;
    input.tabIndex = -1;
  });

  // 2. Create/focus/blur dummy input
  const dummy = document.createElement('div');
  dummy.tabIndex = -1;
  dummy.style.cssText = 'position:absolute;opacity:0;';
  document.body.append(dummy);
  dummy.focus();
  setTimeout(() => dummy.remove(), 100);
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
  // Save data
  savedChoices = Array.from(document.querySelectorAll('.choice')).map(choice => {
    const text = choice.querySelector('input[type="text"]')?.value || '';
    const file = choice.querySelector('input[type="file"]')?.files[0] || null;
    return { text, file };
  });

  // Safe cleanup instead of nuclear approach
  safeInputCleanup();
  
  // Remove specific elements
  ['choice-instructions', 'choices-container', 'add-choice', 'request-motion']
    .forEach(id => document.getElementById(id)?.remove());

  // Show jiggle UI
  document.getElementById('jiggle-heading').style.display = 'block';
  document.getElementById('simulate-jiggle').style.display = 'block';
  
  // Add motion listener
  setTimeout(() => window.addEventListener('devicemotion', handleMotion), 100);
}

// Rest of the code remains the same as previous version
// (handleMotion, triggerChoice, chooseRandom)
