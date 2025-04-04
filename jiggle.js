// Global references for elements and data.
let jiggleHeading, simulateBtn, resultDiv, reloadBtn;
let choices = [];
let lastShakeTime = 0;
const shakeThreshold = 40; // Mobile sensitivity threshold

// Desktop mouse jiggle variables.
let mouseMoves = 0;
let lastMousePos = { x: null, y: null };
let lastMouseVector = null;  // stores the last movement vector.
const mouseMoveThreshold = 50; // Minimum movement distance in pixels.
let mouseTimeout;
const resetMouseTimeout = 1000; // ms
const requiredMoves = 4; // Require 4 direction changes

// -------------- User Agent Check: Mobile vs Desktop --------------
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// -------------- IndexedDB Functions (Load Choices Only) --------------
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
    request.onsuccess = function(e) {
      resolve(e.target.result);
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
    console.error("Error loading choices:", err);
  }
}

function randomChoice() {
  if (!choices || choices.length === 0) return null;
  const index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

// -------------- Circles Animation --------------
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

// -------------- Mobile: Shake Detection --------------
function handleShake(event) {
  const now = Date.now();
  if (now - lastShakeTime < 1000) return;
  const acc = event.accelerationIncludingGravity;
  const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z - 9.81);
  console.log("Mobile shake detected. Force:", force);
  if (force > shakeThreshold) {
    console.log("Mobile shake threshold met.");
    lastShakeTime = now;
    window.removeEventListener('devicemotion', handleShake);
    startJiggleSequence();
  }
}

// -------------- Desktop: Mouse Movement Detection (Direction Changes) --------------
function mouseMoveHandler(e) {
  if (lastMousePos.x === null) {
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
    return;
  }
  const dx = e.clientX - lastMousePos.x;
  const dy = e.clientY - lastMousePos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < mouseMoveThreshold) return;
  
  const currentVector = { x: dx, y: dy };
  let directionChanged = false;
  if (lastMouseVector) {
    const dot = lastMouseVector.x * currentVector.x + lastMouseVector.y * currentVector.y;
    if (dot < 0) {
      directionChanged = true;
    }
  }
  lastMouseVector = currentVector;
  lastMousePos.x = e.clientX;
  lastMousePos.y = e.clientY;
  
  if (directionChanged) {
    mouseMoves++;
    console.log("Mouse direction change count:", mouseMoves);
  }
  
  clearTimeout(mouseTimeout);
  mouseTimeout = setTimeout(() => { mouseMoves = 0; }, resetMouseTimeout);
  
  if (mouseMoves >= requiredMoves) {
    console.log("Desktop mouse jiggle threshold reached.");
    document.removeEventListener('mousemove', mouseMoveHandler);
    startJiggleSequence();
  }
}

// -------------- Jiggle Sequence --------------
function startJiggleSequence() {
  console.log("startJiggleSequence triggered.");
  // Hide the old background and heading.
  document.body.style.backgroundImage = 'none';
  if (jiggleHeading) {
    jiggleHeading.style.display = 'none';
  }
  
  // Start new circles animation.
  window.crca = new CirclesRandomColorAnimation();
  
  // Create flashing "Randomizing" text.
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
  
  // Insert keyframes for flash animation.
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `;
  document.head.appendChild(styleEl);
  
  // After 3 seconds, stop the animation and display the random answer.
  setTimeout(() => {
    console.log("Randomizing finished. Stopping circles and displaying choice.");
    if (window.crca && window.crca.stop) {
      window.crca.stop();
    }
    randomizingEl.remove();
    resultDiv.style.position = 'absolute';
    resultDiv.style.top = '50%';
    resultDiv.style.left = '50%';
    resultDiv.style.transform = 'translate(-50%, -50%)';
    resultDiv.style.zIndex = 30;
    // Set random answer text size: on mobile 3em, on desktop 15em.
    if (isMobileDevice()) {
      resultDiv.style.fontSize = '3em';
    } else {
      resultDiv.style.fontSize = '15em'; // This line sets desktop random answer text size.
    }
    console.log("Choices array:", choices);
    const choice = randomChoice();
    console.log("Random choice:", choice);
    if (choice) {
      displayChoice(choice);
    } else {
      resultDiv.textContent = 'No choice found';
    }
    // Show the reload button.
    if (reloadBtn) {
      reloadBtn.style.display = 'inline-block';
    }
  }, 3000);
}

function displayChoice(choice) {
  resultDiv.innerHTML = '';
  if (choice.file) {
    const img = document.createElement('img');
    const url = URL.createObjectURL(choice.file);
    img.src = url;
    if (isMobileDevice()) {
      img.style.maxWidth = "90%";
      img.style.height = "auto";
    }
    resultDiv.appendChild(img);
  } else {
    resultDiv.textContent = choice.text;
  }
}

// -------------- DOMContentLoaded Setup --------------
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded. Setting up jiggle page.");
  
  jiggleHeading = document.getElementById('jiggle-heading');
  simulateBtn = document.getElementById('simulate-jiggle');
  resultDiv = document.getElementById('result');
  reloadBtn = document.getElementById('reload-index');
  
  // Add reload button event handler to go back to index.html with a flag.
  if (reloadBtn) {
    reloadBtn.addEventListener('click', function() {
      localStorage.setItem('skipOpening', 'true');
      window.location.href = "index.html";
    });
  }
  
  // Load snapshot from index.html.
  const snapshot = localStorage.getItem('backgroundSnapshot');
  console.log("Snapshot found:", snapshot ? "Yes" : "No");
  if (snapshot) {
    document.body.style.backgroundImage = `url(${snapshot})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundRepeat = 'no-repeat';
  }
  
  // Set up behavior based on device type.
  if (isMobileDevice()) {
    jiggleHeading.textContent = "Jiggle your phone";
    if (typeof DeviceMotionEvent !== 'undefined') {
      console.log("Mobile mode: setting up devicemotion listener.");
      window.addEventListener('devicemotion', handleShake);
    } else {
      console.log("Mobile: devicemotion not supported, showing simulate button.");
      simulateBtn.style.display = 'block';
      simulateBtn.addEventListener('click', startJiggleSequence);
    }
  } else {
    jiggleHeading.textContent = "Jiggle your mouse";
    console.log("Desktop mode: enabling mouse move detection.");
    document.addEventListener('mousemove', mouseMoveHandler);
  }
  
  loadChoices();
});


