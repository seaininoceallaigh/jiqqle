// restore snapshot
const snap = localStorage.getItem('backgroundSnapshot');
if (snap) {
  Object.assign(document.body.style, {
    backgroundImage: `url(${snap})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat'
  });
}

// grab ?key=…
const params = new URLSearchParams(location.search);
const key    = params.get('key');
let choices  = [];

if (key) {
  fetch(key)
    .then(r => r.json())
    .then(data => choices = data)
    .catch(e => { console.error(e); alert('Couldn’t load choices'); });
}

function isTabletDevice() {
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}
function isMobileDevice() {
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
function getRandomIntInclusive(min,max) {
  return Math.floor(Math.random()* (max-min+1)) + min;
}

const jiggleSection = document.getElementById('jiggle-section');
const jiggleHeading = document.getElementById('jiggle-heading');
const resultDiv     = document.getElementById('result');
const reloadBtn     = document.getElementById('reload-index');

let lastShake=0, mouseMoves=0, mouseTimeout;
const SHAKE=40, MOVE=50, RESET=1000, REQ=4;
let lastPos={x:null,y:null}, lastVec=null;

// circles…
function CirclesRandomColorAnimation(){ /* identical to share.html */ }

// on shake:
function handleShake(e){
  const now = Date.now();
  if (now-lastShake<1000) return;
  const a=e.accelerationIncludingGravity;
  const force=Math.abs(a.x)+Math.abs(a.y)+Math.abs(a.z-9.81);
  if (force>SHAKE){ lastShake=now; window.removeEventListener('devicemotion',handleShake); start(); }
}
function mouseMoveHandler(e){
  if (lastPos.x===null) lastPos={x:e.clientX,y:e.clientY};
  else {
    const dx=e.clientX-lastPos.x, dy=e.clientY-lastPos.y;
    if (Math.hypot(dx,dy)>MOVE){
      const vec={x:dx,y:dy};
      if (lastVec && (lastVec.x*vec.x+lastVec.y*vec.y)<0) mouseMoves++;
      lastVec=vec;
      lastPos={x:e.clientX,y:e.clientY};
      clearTimeout(mouseTimeout);
      mouseTimeout=setTimeout(()=>mouseMoves=0,RESET);
      if (mouseMoves>=REQ){
        document.removeEventListener('mousemove',mouseMoveHandler);
        start();
      }
    }
  }
}

// the jiggle sequence
function start(){
  document.body.style.backgroundImage='none';
  jiggleHeading.style.display='none';
  window.crca=new CirclesRandomColorAnimation();
  const flash=document.createElement('div');
  flash.id='randomizing-text';
  flash.textContent='Randomizing';
  Object.assign(flash.style,{
    position:'absolute',top:'50%',left:'50%',
    transform:'translate(-50%,-50%)',
    fontSize:'2em',fontWeight:'bold',zIndex:20,
    animation:'flash 2s linear infinite'
  });
  document.body.appendChild(flash);
  const styleEl=document.createElement('style');
  styleEl.textContent=`@keyframes flash {0%,100%{opacity:1}50%{opacity:0}}`;
  document.head.appendChild(styleEl);

  setTimeout(()=>{
    window.crca.stop(); flash.remove();
    const c=choices[Math.floor(Math.random()*choices.length)]||{};
    if (c.imageUrl){
      const img=document.createElement('img');
      img.src=c.imageUrl;
      img.style.maxWidth='80%';
      img.style.height='auto';
      resultDiv.appendChild(img);
    } else {
      resultDiv.textContent=c.text||'No choice';
    }
    resultDiv.style.opacity='1';
    reloadBtn.style.display='block';
  },3000);
}

document.addEventListener('DOMContentLoaded',()=>{
  jiggleSection.style.display='flex';
  if (isTabletDevice()) {
    jiggleHeading.textContent='Jiggle your tablet';
    window.addEventListener('devicemotion',handleShake);
  }
  else if (isMobileDevice()) {
    jiggleHeading.textContent='Jiggle your phone';
    window.addEventListener('devicemotion',handleShake);
  }
  else {
    jiggleHeading.textContent='Jiggle your mouse';
    document.addEventListener('mousemove',mouseMoveHandler);
  }
});

reloadBtn.addEventListener('click',()=>{
  resultDiv.innerHTML=''; resultDiv.style.opacity='0';
  reloadBtn.style.display='none'; jiggleHeading.style.display='';
  if (isTabletDevice()||isMobileDevice())
    window.addEventListener('devicemotion',handleShake);
  else {
    mouseMoves=0; lastPos={x:null,y:null};
    document.addEventListener('mousemove',mouseMoveHandler);
  }
});




