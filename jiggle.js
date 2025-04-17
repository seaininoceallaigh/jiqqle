// jiggle.js

// Helper to detect iPadOS 13+ (iPads masquerading as Mac)
function isTabletDevice() {
  return navigator.platform === 'MacIntel'
      && navigator.maxTouchPoints > 1;
}

// Existing mobile check
function isMobileDevice() {
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i
         .test(navigator.userAgent);
}

// Global references for elements and data.
let jiggleHeading, simulateBtn, resultDiv, reloadBtn;
let choices = [];
let lastShakeTime = 0;
const shakeThreshold = 40; // Mobile sensitivity threshold

// Desktop mouse jiggle variables.
let mouseMoves = 0;
let lastMousePos = { x: null, y: null };
let lastMouseVector = null;
const mouseMoveThreshold = 50;
let mouseTimeout;
const resetMouseTimeout = 1000; // ms
const requiredMoves = 4;

// -------------- IndexedDB Functions (Load Choices Only) --------------
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jiqqleDB', 1);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('choices')) {
        db.createObjectStore('choices', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject(e.target.error);
  });
}

function getChoices(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('choices', 'readonly');
    const store = tx.objectStore('choices');
    const req = store.getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
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

// -------------- Utility Function --------------
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------------- Circles Animation (Updated for DPR) --------------
function CirclesRandomColorAnimation() {
  this.canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  this.canvas.width = w * dpr;
  this.canvas.height = h * dpr;
  this.canvas.style.width = w + 'px';
  this.canvas.style.height = h + 'px';
  this.canvas.style.position = 'absolute';
  this.canvas.style.top = '0';
  this.canvas.style.left = '0';
  this.canvas.style.zIndex = 1;

  const ctx = this.canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, w, h);
  document.body.insertBefore(this.canvas, document.body.firstChild);

  let animationId;
  const draw = () => {
    animationId = window.requestAnimationFrame(draw);
    if (!draw.frameCount) draw.frameCount = 0;
    draw.frameCount++;
    if (draw.frameCount % 10 === 1) {
      const r = getRandomIntInclusive(0,255);
      const g = getRandomIntInclusive(0,255);
      const b = getRandomIntInclusive(0,255);
      const x = getRandomIntInclusive(0,w);
      const y = getRandomIntInclusive(0,h);
      const a = getRandomIntInclusive(0,255);
      const radius = getRandomIntInclusive(10,100);
      ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI*2);
      ctx.fill();
    }
  };
  window.requestAnimationFrame(draw);
  this.stop = () => cancelAnimationFrame(animationId);
}

// -------------- Mobile: Shake Detection --------------
function handleShake(event) {
  const now = Date.now();
  if (now - lastShakeTime < 1000) return;
  const acc = event.accelerationIncludingGravity;
  const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z - 9.81);
  if (force > shakeThreshold) {
    lastShakeTime = now;
    window.removeEventListener('devicemotion', handleShake);
    startJiggleSequence();
  }
}

// -------------- Desktop: Mouse Movement Detection --------------
function mouseMoveHandler(e) {
  if (lastMousePos.x === null) {
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
    return;
  }
  const dx = e.clientX - lastMousePos.x;
  const dy = e.clientY - lastMousePos.y;
  const dist = Math.hypot(dx, dy);
  if (dist < mouseMoveThreshold) return;

  const vec = { x: dx, y: dy };
  let dirChanged = false;
  if (lastMouseVector) {
    const dot = lastMouseVector.x*vec.x + lastMouseVector.y*vec.y;
    if (dot < 0) dirChanged = true;
  }
  lastMouseVector = vec;
  lastMousePos.x = e.clientX;
  lastMousePos.y = e.clientY;

  if (dirChanged) mouseMoves++;
  clearTimeout(mouseTimeout);
  mouseTimeout = setTimeout(() => { mouseMoves = 0; }, resetMouseTimeout);

  if (mouseMoves >= requiredMoves) {
    document.removeEventListener('mousemove', mouseMoveHandler);
    startJiggleSequence();
  }
}

// -------------- Jiggle Sequence --------------
function startJiggleSequence() {
  document.body.style.backgroundImage = 'none';
  if (jiggleHeading) jiggleHeading.style.display = 'none';

  window.crca = new CirclesRandomColorAnimation();

  const flash = document.createElement('div');
  flash.id = 'randomizing-text';
  flash.textContent = 'Randomizing';
  Object.assign(flash.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    fontSize: '2em',
    fontWeight: 'bold',
    zIndex: 20,
    animation: 'flash 2s linear infinite'
  });
  document.body.appendChild(flash);

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes flash {
      0%,100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `;
  document.head.appendChild(styleEl);

  setTimeout(() => {
    window.crca.stop();
    flash.remove();
    Object.assign(resultDiv.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      zIndex: 30,
      fontSize: isTabletDevice() ? '5em'
               : isMobileDevice()  ? '3em'
               : '15em'
    });
    const choice = choices[Math.floor(Math.random()*choices.length)];
    if (choice && choice.file) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(choice.file);
      if (isMobileDevice()||isTabletDevice()) {
        img.style.maxWidth = '90%';
        img.style.height = 'auto';
      }
      resultDiv.appendChild(img);
    } else {
      resultDiv.textContent = choice ? choice.text : 'No choice found';
    }
    resultDiv.style.opacity = '1';
    if (reloadBtn) reloadBtn.style.display = 'inline-block';
  }, 3000);
}

// -------------- DOMContentLoaded Setup --------------
document.addEventListener('DOMContentLoaded', function() {
  jiggleHeading = document.getElementById('jiggle-heading');
  simulateBtn   = document.getElementById('simulate-jiggle');
  resultDiv     = document.getElementById('result');
  reloadBtn     = document.getElementById('reload-index');

  reloadBtn.addEventListener('click', () => {
    localStorage.setItem('skipOpening', 'true');
    window.location.href = 'index.html';
  });

  const snap = localStorage.getItem('backgroundSnapshot');
  if (snap) {
    Object.assign(document.body.style, {
      backgroundImage: `url(${snap})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat'
    });
  }

  // Tablet first, then phone, then desktop
  if (isTabletDevice()) {
    jiggleHeading.textContent = 'Jiggle your tablet';
    jiggleHeading.classList.add('jiggle-effect');
    if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handleShake);
    } else {
      simulateBtn.style.display = 'block';
      simulateBtn.addEventListener('click', startJiggleSequence);
    }
  }
  else if (isMobileDevice()) {
    jiggleHeading.textContent = 'Jiggle your phone';
    jiggleHeading.classList.add('jiggle-effect');
    window.addEventListener('devicemotion', handleShake);
  }
  else {
    jiggleHeading.textContent = 'Jiggle your mouse';
    document.addEventListener('mousemove', mouseMoveHandler);
  }

  loadChoices();
});



