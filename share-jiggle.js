/* ───── snapshot background ───── */
const snap = localStorage.getItem('backgroundSnapshot');
if (snap) {
  Object.assign(document.body.style, {
    backgroundImage: `url(${snap})`,
    backgroundSize : 'cover',
    backgroundRepeat: 'no-repeat'
  });
}

/* ───── load choices via ?key= … ───── */
const qs      = new URLSearchParams(location.search);
const jsonKey = qs.get('key');
let   choices = [];
if (jsonKey) {
  fetch(jsonKey)
    .then(r => r.json())
    .then(d => { choices = d; })
    .catch(() => alert('Could not load choices'));
}

/* ───── helpers ───── */
const isMobile = () =>
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = () =>
  navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
const randInt  = (m, M) => Math.floor(Math.random() * (M - m + 1)) + m;

/* DOM */
const jiggleSection = document.getElementById('jiggle-section');
const jiggleHeading = document.getElementById('jiggle-heading');
const resultDiv     = document.getElementById('result');
const reloadBtn     = document.getElementById('reload-index');

/* ───── circles backdrop ───── */
function CirclesRandomColorAnimation () {
  this.canvas = document.createElement('canvas');
  const dpr = devicePixelRatio || 1, w = innerWidth, h = innerHeight;
  this.canvas.width  = w * dpr; this.canvas.height = h * dpr;
  Object.assign(this.canvas.style,{
    position:'fixed',top:0,left:0,width:`${w}px`,height:`${h}px`,zIndex:1
  });
  document.body.prepend(this.canvas);
  const ctx = this.canvas.getContext('2d');
  ctx.scale(dpr,dpr); ctx.fillStyle='black'; ctx.fillRect(0,0,w,h);
  let raf, f = 0;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    if (++f % 10) return;
    ctx.fillStyle =
      `rgba(${randInt(0,255)},${randInt(0,255)},${randInt(0,255)},${randInt(0,255)/255})`;
    ctx.beginPath();
    ctx.arc(randInt(0,w),randInt(0,h),randInt(10,100),0,2*Math.PI);
    ctx.fill();
  };
  raf = requestAnimationFrame(draw);
  this.stop = () => cancelAnimationFrame(raf);
}

/* ───── jiggle sequence ───── */
let isRandomizing = false;
let cooldownUntil = 0;         // earliest allowed shake
const SHAKE = 40;

function startJiggle() {
  if (isRandomizing) return;
  isRandomizing = true;

  /* hide previous */
  resultDiv.style.opacity = '0';
  resultDiv.innerHTML = '';

  document.body.style.backgroundImage = 'none';
  jiggleHeading.style.display = 'none';

  window.crca = new CirclesRandomColorAnimation();

  const flash = document.createElement('div');
  flash.textContent = 'Randomizing';
  Object.assign(flash.style,{
    position:'absolute',top:'50%',left:'50%',
    transform:'translate(-50%,-50%)',
    fontSize:'2em',fontWeight:'bold',zIndex:20,
    animation:'flash 2s linear infinite'
  });
  document.body.appendChild(flash);
  const styleEl = document.createElement('style');
  styleEl.textContent='@keyframes flash{0%,100%{opacity:1}50%{opacity:0}}';
  document.head.appendChild(styleEl);

  setTimeout(() => {
    window.crca.stop(); flash.remove();

    const c = choices.length ? choices[randInt(0,choices.length-1)] : {};
    if (c.imageUrl) {
      const img = document.createElement('img');
      img.src = c.imageUrl;
      img.style.maxWidth = isMobile() ? '90vw' : '80%';
      img.style.height = 'auto';
      resultDiv.appendChild(img);
    } else {
      resultDiv.textContent = c.text || 'No choice';
    }
    resultDiv.style.opacity = '1';
    reloadBtn.style.display = 'block';

    cooldownUntil = Date.now() + 1000;  // 1-s buffer
    isRandomizing = false;
    if (isMobile()) window.addEventListener('devicemotion', handleShake);
  }, 3000);
}

/* ───── shake detection ───── */
let lastShake = 0;
function handleShake(e) {
  if (isRandomizing || Date.now() < cooldownUntil) return;
  const now = Date.now();
  if (now - lastShake < 1000) return;

  const a = e.accelerationIncludingGravity;
  const force = Math.abs(a.x)+Math.abs(a.y)+Math.abs(a.z-9.81);
  if (force > SHAKE) {
    lastShake = now;
    window.removeEventListener('devicemotion', handleShake);
    startJiggle();
  }
}

/* ───── initial setup ───── */
document.addEventListener('DOMContentLoaded', () => {
  jiggleSection.style.display = 'flex';

  if (isMobile()) {
    jiggleHeading.textContent = 'Jiggle your phone';
    window.addEventListener('devicemotion', handleShake);
  } else if (isTablet()) {
    jiggleHeading.textContent = 'Jiggle your tablet';
  } else {
    jiggleHeading.textContent = 'Jiggle your mouse';
  }
});

/* ───── reload button ───── */
reloadBtn.addEventListener('click', () => {
  resultDiv.innerHTML = '';
  resultDiv.style.opacity = '0';
  reloadBtn.style.display = 'none';
  jiggleHeading.style.display = '';
  if (isMobile()) window.addEventListener('devicemotion', handleShake);
});





