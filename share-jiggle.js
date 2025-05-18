// restore intro snapshot
const snap = localStorage.getItem('backgroundSnapshot');
if (snap) {
  Object.assign(document.body.style, {
    backgroundImage: `url(${snap})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat'
  });
}

function isTabletDevice() {
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}
function isMobileDevice() {
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i
    .test(navigator.userAgent);
}
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const jiggleSection = document.getElementById('jiggle-section');
const jiggleHeading = document.getElementById('jiggle-heading');
const resultDiv     = document.getElementById('result');
const reloadBtn     = document.getElementById('reload-index');

let lastShake = 0, mouseMoves = 0, mouseTimeout;
const SHAKE_THR = 40, MOVE_THR = 50, RST_TO = 1000, REQ_MOVES = 4;
let lastMousePos = { x: null, y: null }, lastMouseVec = null;

// original circles animation
function CirclesRandomColorAnimation() {
  this.canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1, w = innerWidth, h = innerHeight;
  this.canvas.width  = w * dpr;
  this.canvas.height = h * dpr;
  Object.assign(this.canvas.style, {
    position: 'fixed',
    top: '0', left: '0',
    width: `${w}px`, height: `${h}px`,
    zIndex: '1'
  });
  document.body.insertBefore(this.canvas, document.body.firstChild);
  const ctx = this.canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, w, h);

  let frame = 0, rafId;
  const draw = () => {
    rafId = requestAnimationFrame(draw);
    if (++frame % 10 !== 1) return;
    const r = getRandomIntInclusive(0, 255),
          g = getRandomIntInclusive(0, 255),
          b = getRandomIntInclusive(0, 255),
          a = getRandomIntInclusive(0, 255) / 255,
          rad = getRandomIntInclusive(10, 100);
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, rad, 0, 2 * Math.PI);
    ctx.fill();
  };
  draw();
  this.stop = () => cancelAnimationFrame(rafId);
}

async function loadChoices() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open('jiqqleDB', 1);
    rq.onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction('choices', 'readonly');
      tx.objectStore('choices').getAll().onsuccess = ev => res(ev.target.result);
      tx.onerror = ev => rej(ev.target.error);
    };
    rq.onerror = e => rej(e.target.error);
  });
}

async function startJiggleSequence() {
  document.body.style.backgroundImage = 'none';
  jiggleHeading.style.display = 'none';
  window.crca = new CirclesRandomColorAnimation();

  const flash = document.createElement('div');
  flash.id = 'randomizing-text';
  flash.textContent = 'Randomizing';
  Object.assign(flash.style, {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    fontSize: '2em', fontWeight: 'bold', zIndex: 20,
    animation: 'flash 2s linear infinite'
  });
  document.body.appendChild(flash);

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes flash {
      0%,100% { opacity: 1; }
      50%     { opacity: 0; }
    }
  `;
  document.head.appendChild(styleEl);

  setTimeout(async () => {
    window.crca.stop();
    flash.remove();

    const choices = await loadChoices();
    const c = choices[Math.floor(Math.random() * choices.length)];
    if (c.imageUrl) {
      const img = document.createElement('img');
      img.src = c.imageUrl;
      img.style.maxWidth = '80%';
      img.style.height   = 'auto';
      resultDiv.appendChild(img);
    } else {
      resultDiv.textContent = c.text || 'No choice';
    }
    resultDiv.style.opacity = '1';
    reloadBtn.style.display  = 'block';
  }, 3000);
}

function handleShake(ev) {
  const now = Date.now();
  if (now - lastShake < 1000) return;
  const a = ev.accelerationIncludingGravity;
  const force = Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z - 9.81);
  if (force > SHAKE_THR) {
    lastShake = now;
    window.removeEventListener('devicemotion', handleShake);
    startJiggleSequence();
  }
}

function mouseMoveHandler(e) {
  if (lastMousePos.x === null) {
    lastMousePos = { x: e.clientX, y: e.clientY };
    return;
  }
  const dx = e.clientX - lastMousePos.x,
        dy = e.clientY - lastMousePos.y,
        dist = Math.hypot(dx, dy);
  if (dist < MOVE_THR) return;
  const vec = { x: dx, y: dy };
  if (lastMouseVec && (lastMouseVec.x * vec.x + lastMouseVec.y * vec.y) < 0) {
    mouseMoves++;
  }
  lastMouseVec  = vec;
  lastMousePos  = { x: e.clientX, y: e.clientY };
  clearTimeout(mouseTimeout);
  mouseTimeout = setTimeout(() => mouseMoves = 0, RST_TO);

  if (mouseMoves >= REQ_MOVES) {
    document.removeEventListener('mousemove', mouseMoveHandler);
    startJiggleSequence();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  jiggleSection.style.display = 'flex';
  if (isTabletDevice()) {
    jiggleHeading.textContent = 'Jiggle your tablet';
    window.addEventListener('devicemotion', handleShake);
  }
  else if (isMobileDevice()) {
    jiggleHeading.textContent = 'Jiggle your phone';
    window.addEventListener('devicemotion', handleShake);
  }
  else {
    jiggleHeading.textContent = 'Jiggle your mouse';
    document.addEventListener('mousemove', mouseMoveHandler);
  }
});

reloadBtn.addEventListener('click', () => {
  resultDiv.innerHTML    = '';
  resultDiv.style.opacity = '0';
  reloadBtn.style.display = 'none';
  jiggleHeading.style.display = '';
  if (isTabletDevice() || isMobileDevice()) {
    window.addEventListener('devicemotion', handleShake);
  } else {
    mouseMoves = 0;
    lastMousePos = { x: null, y: null };
    document.addEventListener('mousemove', mouseMoveHandler);
  }
});

