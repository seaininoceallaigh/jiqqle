const preloaderEl = document.querySelector(".loader-container");
const firstWordArr = ["Don't", "know", "what", "to", "do?"];
const secondWordArr = ["Let", "the", "Universe", "decide"];
let counter = 0;
let hasChosen = false;
let savedChoices = [];
let lastShakeTime = 0;

// Preloader animations
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

// Input management
function destroyInputs() {
  // Replace all inputs with inert elements
  document.querySelectorAll('input').forEach(input => {
    const placeholder = document.createElement('div');
    placeholder.dataset.originalType = input.type;
    if (input.type === 'file' && input.files[0]) {
      placeholder.dataset.fileName = input.files[0].name;
    }
    input.replaceWith(placeholder);
  });

  // Force iOS focus reset
  const focusTrap = document.createElement('textarea');
  focusTrap.style.cssText = 'position:absolute;top:-9999px;opacity:0;';
  document.body.appendChild(focusTrap);
  focusTrap.focus();
  setTimeout(() => {
    focusTrap.blur();
    focusTrap.remove();
  }, 50);
}

// Shake detection
function handleMotion(event) {
  if (hasChosen) return;
  
  const acc = event.accelerationIncludingGravity || {};
  const now = Date.now();
  
  // Physics-based detection
  const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z - 9.81);
  const threshold = 25; // Optimized for natural shake
  const debounce = 800; // Minimum time between shakes
  
  if (force > threshold && (now - lastShakeTime) > debounce) {
    lastShakeTime = now;
    triggerChoice();
  }
}

// Core functionality
document.getElementById('add-choice').addEventListener('click', () => {
  const choiceDiv = document.createElement('div');
  choiceDiv.className = 'choice';
  choiceDiv.innerHTML = `
    <input type="text" placeholder="Enter text">
    <input type="file" accept="image/*">
  `;
  document.getElementById('choices-container').appendChild(choiceDiv);
});

async function requestMotionPermission() {
  try {
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      const status = await DeviceMotionEvent.requestPermission();
      if (status !== 'granted') {
        alert('Motion permission required');
        return;
      }
    }
    
    // Save choices before destruction
    savedChoices = Array.from(document.querySelectorAll('.choice')).map(choice => {
      const text = choice.querySelector('input[type="text"]')?.value || '';
      const file = choice.querySelector('input[type="file"]')?.files[0] || null;
      return { text, file };
    });

    // Destroy inputs and clean UI
    destroyInputs();
    document.getElementById('choice-instructions').remove();
    document.getElementById('choices-container').remove();
    document.getElementById('add-choice').remove();
    document.getElementById('request-motion').remove();

    // Show jiggle interface
    document.getElementById('jiggle-heading').style.display = 'block';
    document.getElementById('simulate-jiggle').style.display = 'block';
    
    // Enable motion detection
    window.addEventListener('devicemotion', handleMotion);
    document.getElementById('simulate-jiggle').addEventListener('click', triggerChoice);
    
  } catch (error) {
    console.error('Error initializing motion:', error);
  }
}

function triggerChoice() {
  if (hasChosen) return;
  hasChosen = true;
  
  // Display result
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

  // Cleanup
  window.removeEventListener('devicemotion', handleMotion);
  document.getElementById('jiggle-heading').classList.remove('jiggle-effect');
}

// Initial setup
document.getElementById('request-motion').addEventListener('click', requestMotionPermission);
displayLoader();
