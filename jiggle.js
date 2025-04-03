// Define variables at top-level so all functions can see them.
let jiggleHeading;
let simulateBtn;
let resultDiv;

let choices = [];
let lastShakeTime = 0;

// Tweak sensitivity as needed
const shakeThreshold = 30;

// --------------- IndexedDB Functions (Load Only) ---------------
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jiqqleDB', 1);
    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('choices')) {
        db.createObjectStore('choices', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = function(event) {
      resolve(event.target.result);
    };
    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

function getChoices(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['choices'], 'readonly');
    const store = transaction.objectStore('choices');
    const request = store.getAll();
    request.onsuccess = function(event) {
      resolve(event.target.result);
    };
    request.onerror = function(e) {
      reject(e.target.error);
    };
  });
}

async function loadChoices() {
  try {
    const db = await openDatabase();
    choices = await getChoices(db);
    console.log("Loaded choices:", choices);
  } catch (err) {
    console.error("Error loading choices from IndexedDB:", err);
  }
}

// --------------- Utility for random selection ---------------
function randomChoice() {
  if (!choices || choices.length === 0) return null;
  const index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

// --------------- Circles Animation ---------------
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function CirclesRandomColorAnimation() {
  this.canvas = document.createElement('canvas');
  const w = window.innerWidth, h = window.innerHeight;
  this.canvas.width = w;
  this.canvas.height = h;
  this.canvas.style.position = 'absolute';
  this.canvas.style.top = 0;
  this.canvas.style.left = 0;
  this.canvas.style.zIndex = 1;
  const ctx = this.canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, w, h);
  document.body.insertBefore(this.canvas, document.body.firstChild);

  let animationId;
  const draw = () => {
    animationId = window.requestAnimationFrame(draw);
    if (!draw.frameCount) draw.frameCount = 0;
    draw.frameCount++;
    if (draw.frameCount % 10 === 1) {
      const r = getRandomIntInclusive(0, 255);
      const g = getRandomIntInclusive(0, 255);
      const b = getRandomIntInclusive(0, 255);
      const x = getRandomIntInclusive(0, w);
      const y = getRandomIntInclusive(0, h);
      const a = getRandomIntInclusive(0, 255);
      const radius = getRandomIntInclusive(10, 100);
      ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  window.requestAnimationFrame(draw);

  this.stop = function() {
    cancelAnimationFrame(animationId);
  };
}

// --------------- Shake Detection ---------------
function handleShake(event) {
  const now = Date.now();
  // Prevent multiple shakes within 1 second
  if (now - lastShakeTime < 1000) return;

  const acc = event.accelerationIncludingGravity;
  const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z - 9.81);
  console.log("Shake event. Force:", force);

  if (force > shakeThreshold) {
    console.log("Shake threshold met. Starting jiggle sequence.");
    lastShakeTime = now;
    window.removeEventListener('devicemotion', handleShake);
    startJiggleSequence();
  }
}

// --------------- Jiggle Sequence ---------------
function startJiggleSequence() {
  console.log("startJiggleSequence triggered.");

  // Hide old background
  document.body.style.backgroundImage = 'none';
  // Hide heading if present
  if (jiggleHeading) {
    jiggleHeading.style.display = 'none';
  }

  // Start new circles animation
  window.crca = new CirclesRandomColorAnimation();

  // Create flashing "Randomizing" text
  const randomizingEl = document.createElement('div');
  randomizingEl.id = 'randomizing-text';
  randomizingEl.textContent = 'Randomizing';
  randomizingEl.style.position = 'absolute';
  randomizingEl.style.top = '50%';
  randomizingEl.style.left = '50%';
  randomizingEl.style.transform = 'translate(-50%, -50%)';
  randomizingEl.style.fontSize = '2em';
  randomizingEl.style.fontWeight = 'bold';
  randomizingEl.style.zIndex = 20;
  randomizingEl.style.animation = 'flash 2s linear infinite';
  document.body.appendChild(randomizingEl);

  // Insert keyframes for flash animation
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `;
  document.head.appendChild(styleEl);

  // After 3 seconds, stop animation and show random choice
  setTimeout(function() {
    console.log("Randomizing done, stopping circles animation.");
    if (window.crca && window.crca.stop) {
      window.crca.stop();
    }
    randomizingEl.remove();

    resultDiv.style.position = 'absolute';
    resultDiv.style.top = '50%';
    resultDiv.style.left = '50%';
    resultDiv.style.transform = 'translate(-50%, -50%)';
    resultDiv.style.zIndex = 30;

    console.log("Choices array:", choices);
    const choice = randomChoice();
    console.log("Random choice:", choice);
    if (choice) {
      displayChoice(choice);
    } else {
      resultDiv.textContent = 'No choice found';
    }
  }, 3000);
}

// Display the chosen answer
function displayChoice(choice) {
  resultDiv.innerHTML = '';
  if (choice.file) {
    const img = document.createElement('img');
    const url = URL.createObjectURL(choice.file);
    img.src = url;
    resultDiv.appendChild(img);
  } else {
    resultDiv.textContent = choice.text;
  }
}

// --------------- DOMContentLoaded ---------------
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded. Setting up jiggle page.");

  // Grab references
  jiggleHeading = document.getElementById('jiggle-heading');
  simulateBtn = document.getElementById('simulate-jiggle');
  resultDiv = document.getElementById('result');

  // Load snapshot from localStorage if any
  const snapshot = localStorage.getItem('backgroundSnapshot');
  console.log("Snapshot from index:", snapshot ? "found" : "none");
  if (snapshot) {
    document.body.style.backgroundImage = `url(${snapshot})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundRepeat = 'no-repeat';
  }

  // If devicemotion not supported, show "simulate" for desktop
  if (typeof DeviceMotionEvent === 'undefined') {
    console.log("DeviceMotionEvent is undefined. Desktop mode. Showing simulate button.");
    simulateBtn.style.display = 'block';
    simulateBtn.addEventListener('click', () => {
      console.log("Desktop simulate button clicked.");
      startJiggleSequence();
    });
  } else {
    // Real phone
    console.log("DeviceMotionEvent found. Setting up handleShake listener.");
    window.addEventListener('devicemotion', handleShake);
  }

  // Load choices from IndexedDB
  loadChoices();
});

