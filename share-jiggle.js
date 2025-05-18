/* ─────────────────────────  SNAPSHOT BACKGROUND  ───────────────────────── */
const snap = localStorage.getItem('backgroundSnapshot');
if (snap) {
  Object.assign(document.body.style, {
    backgroundImage: `url(${snap})`,
    backgroundSize : 'cover',
    backgroundRepeat: 'no-repeat'
  });
}

/* ─────────────────────────────  LOAD CHOICES  ──────────────────────────── */
const params   = new URLSearchParams(location.search);
const jsonKey  = params.get('key');
let   choices  = [];          // [{ text, imageUrl } …]

if (jsonKey) {
  fetch(jsonKey)
    .then(r => r.json())
    .then(data => { choices = data; })
    .catch(err => { console.error(err); alert('Could not load choices'); });
}

/* ─────────────────────────────  HELPERS  ──────────────────────────────── */
const isMobile = () =>
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = () => navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
const randInt  = (m, M) => Math.floor(Math.random() * (M - m + 1)) + m;

/* DOM refs */
const jiggleSection = document.getElementById('jiggle-section');
const jiggleHeading = document.getElementById('jiggle-heading');
const resultDiv     = document.getElementById('result');
const reloadBtn     = document.getElementById('reload-index');

/* ─────────────────────  CIRCLES BACKGROUND ANIMATION  ──────────────────── */
function CirclesRandomColorAnimation () {
  this.canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1, w = innerWidth, h = innerHeight;
  this.canvas.width  = w * dpr; this.canvas.height = h * dpr;
  Object.assign(this.canvas.style, {
    position:'fixed', top:0, left:0,
    width:`${w}px`, height:`${h}px`, zIndex:1
  });
  document.body.insertBefore(this.canvas, document.body.firstChild);
  const ctx = this.canvas.getContext('2d');
  ctx.scale(dpr, dpr); ctx.fillStyle = 'black'; ctx.fillRect(0, 0, w, h);

  let frame = 0, raf;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    if (++frame % 10 !== 1) return;
    ctx.fillStyle = `rgba(${randInt(0,255)},${randInt(0,255)},${randInt(0,255)},${randInt(0,255)/255})`;
    ctx.beginPath();
    ctx.arc(randInt(0,w), randInt(0,h), randInt(10,100), 0, 2*Math.PI);
    ctx.fill();
  };
  raf = requestAnimationFrame(draw);
  this.stop = () => cancelAnimationFrame(raf);
}

/* ──────────────────────────  RANDOMISE SEQUENCE  ──────────────────────── */
let isRandomizing = false;

function startJiggle () {
  if (isRandomizing) return;            /* guard double-fire                   */
  isRandomizing = true;

  /* remove snapshot & prompt */
  document.body.style.backgroundImage = 'none';
  jiggleHeading.style.display = 'none';

  /* backdrop animation */
  window.crca = new CirclesRandomColorAnimation();

  /* flashing “Randomizing” text */
  const flash = document.createElement('div');
  flash.textContent = 'Randomizing';
  Object.assign(flash.style, {
    position:'absolute', top:'50%', left:'50%',
    transform:'translate(-50%,-50%)',
    fontSize:'2em', fontWeight:'bold', zIndex:20,
    animation:'flash 2s linear infinite'
  });
  document.body.appendChild(flash);
  const styleEl = document.createElement('style');
  styleEl.textContent = '@keyframes flash{0%,100%{opacity:1}50%{opacity:0}}';
  document.head.appendChild(styleEl);

  /* show result after 3 s */
  setTimeout(() => {
    window.crca.stop(); flash.remove();

    const c = choices.length ? choices[randInt(0, choices.length - 1)] : {};
    if (c.imageUrl) {
      const img = document.createElement('img');
      img.src = c.imageUrl;
      img.style.maxWidth = isMobile() ? '90vw' : '80%';
      img.style.height   = 'auto';
      resultDiv.appendChild(img);
    } else {
      resultDiv.textContent = c.text || 'No choice';
    }
    resultDiv.style.opacity = '1';
    reloadBtn.style.display = 'block';

    /* ── allow another jiggle (MOBILE ONLY) ── */
    isRandomizing = false;
    if (isMobile()) {
      window.addEventListener('devicemotion', handleShake, { once:false });
    }
    /* desktop / tablet stick with reload-button workflow */
  }, 3000);
}

/* ─────────────────────────────  INPUT LISTENERS  ───────────────────────── */
let lastShake = 0;
const SHAKE_THRESHOLD = 40;

function handleShake (e) {
  if (isRandomizing) return;
  const now = Date.now();
  if (now - lastShake < 1000) return;

  const a = e.accelerationIncludingGravity;
  const force = Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z - 9.81);
  if (force > SHAKE_THRESHOLD) {
    lastShake = now;
    window.removeEventListener('devicemotion', handleShake);
    startJiggle();
  }
}

/* ───────────────────────────  INITIAL SETUP  ───────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  jiggleSection.style.display = 'flex';

  if (isMobile()) {
    jiggleHeading.textContent = 'Jiggle your phone';
    window.addEventListener('devicemotion', handleShake);
  } else if (isTablet()) {
    jiggleHeading.textContent = 'Jiggle your tablet';
  } else {
    jiggleHeading.textContent = 'Click reload to try again';
  }
});

/* ───────────────────────────  RELOAD BUTTON  ───────────────────────────── */
reloadBtn.addEventListener('click', () => {
  /* clear previous result */
  resultDiv.innerHTML = '';
  resultDiv.style.opacity = '0';
  reloadBtn.style.display = 'none';
  jiggleHeading.style.display = '';

  /* mobile shake again; others wait for next button tap */
  if (isMobile()) {
    window.addEventListener('devicemotion', handleShake);
  }
});





