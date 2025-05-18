/* ------------------------------------------------------------- *
 *              RESTORE SNAPSHOT BACKGROUND (if any)             *
 * ------------------------------------------------------------- */
const snap = localStorage.getItem('backgroundSnapshot');
if(snap){
  Object.assign(document.body.style,{
    backgroundImage:`url(${snap})`,
    backgroundSize :'cover',
    backgroundRepeat:'no-repeat'
  });
}

/* ------------------------------------------------------------- *
 *              LOAD CHOICES FROM ?key=your.json                 *
 * ------------------------------------------------------------- */
const qs      = new URLSearchParams(location.search);
const jsonKey = qs.get('key');
let   choices = [];

if(jsonKey){
  fetch(jsonKey)
    .then(r=>r.json())
    .then(data=>choices=data)
    .catch(e=>{console.error(e);alert('Could not load choices');});
}

/* ------------------------------------------------------------- *
 *                 DEVICE / MOUSE UTILS & CONSTANTS              *
 * ------------------------------------------------------------- */
const isTablet = ()=> navigator.platform==='MacIntel' && navigator.maxTouchPoints>1;
const isMobile = ()=> /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const randInt  = (m,M)=>Math.floor(Math.random()*(M-m+1))+m;

const jiggleSection = document.getElementById('jiggle-section');
const jiggleHeading = document.getElementById('jiggle-heading');
const resultDiv     = document.getElementById('result');
const reloadBtn     = document.getElementById('reload-index');

/* circles animation identical to share.html */
function CirclesRandomColorAnimation(){
  this.canvas=document.createElement('canvas');
  const dpr=window.devicePixelRatio||1,w=innerWidth,h=innerHeight;
  this.canvas.width=w*dpr; this.canvas.height=h*dpr;
  Object.assign(this.canvas.style,{position:'fixed',top:0,left:0,width:`${w}px`,height:`${h}px`,zIndex:1});
  document.body.insertBefore(this.canvas,document.body.firstChild);
  const ctx=this.canvas.getContext('2d'); ctx.scale(dpr,dpr); ctx.fillStyle='black'; ctx.fillRect(0,0,w,h);
  let raf,frame=0;
  const draw=()=>{
    raf=requestAnimationFrame(draw);
    if(++frame%10!==1) return;
    ctx.fillStyle=`rgba(${randInt(0,255)},${randInt(0,255)},${randInt(0,255)},${randInt(0,255)/255})`;
    ctx.beginPath();
    ctx.arc(randInt(0,w),randInt(0,h),randInt(10,100),0,2*Math.PI);
    ctx.fill();
  };
  raf=requestAnimationFrame(draw);
  this.stop=()=>cancelAnimationFrame(raf);
}

/* ------------------------------------------------------------- *
 *                  JIGGLE → RANDOMISE DISPLAY                   *
 * ------------------------------------------------------------- */
function startJiggle(){
  document.body.style.backgroundImage='none';
  jiggleHeading.style.display='none';

  window.crca=new CirclesRandomColorAnimation();

  const flash=document.createElement('div');
  flash.textContent='Randomizing';
  Object.assign(flash.style,{
    position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
    fontSize:'2em',fontWeight:'bold',zIndex:20,
    animation:'flash 2s linear infinite'
  });
  document.body.appendChild(flash);
  const styleEl=document.createElement('style');
  styleEl.textContent='@keyframes flash{0%,100%{opacity:1}50%{opacity:0}}';
  document.head.appendChild(styleEl);

  setTimeout(()=>{
    window.crca.stop(); flash.remove();

    const c = choices.length ? choices[randInt(0,choices.length-1)] : {};
    if(c.imageUrl){
      const img=document.createElement('img');
      img.src=c.imageUrl; img.style.maxWidth='80%'; img.style.height='auto';
      resultDiv.appendChild(img);
    }else{
      resultDiv.textContent=c.text||'No choice';
    }
    resultDiv.style.opacity='1';
    reloadBtn.style.display='block';
  },3000);
}

/* ------------------------------------------------------------- *
 *                  INPUT (pick up shake / mouse)                *
 * ------------------------------------------------------------- */
let lastShake=0,mouseMoves=0,mouseTimeout;
const SHAKE=40,MOVE=50,RESET=1000,REQ=4;
let lastPos={x:null,y:null}, lastVec=null;

function handleShake(e){
  const now=Date.now();
  if(now-lastShake<1000) return;
  const a=e.accelerationIncludingGravity;
  const force=Math.abs(a.x)+Math.abs(a.y)+Math.abs(a.z-9.81);
  if(force>SHAKE){
    lastShake=now;
    window.removeEventListener('devicemotion',handleShake);
    startJiggle();
  }
}
function mouseMove(e){
  if(lastPos.x===null){ lastPos={x:e.clientX,y:e.clientY}; return; }
  const dx=e.clientX-lastPos.x, dy=e.clientY-lastPos.y;
  if(Math.hypot(dx,dy)<MOVE) return;
  const vec={x:dx,y:dy};
  if(lastVec && (lastVec.x*vec.x+lastVec.y*vec.y)<0) mouseMoves++;
  lastVec=vec; lastPos={x:e.clientX,y:e.clientY};
  clearTimeout(mouseTimeout); mouseTimeout=setTimeout(()=>mouseMoves=0,RESET);
  if(mouseMoves>=REQ){
    document.removeEventListener('mousemove',mouseMove);
    startJiggle();
  }
}

/* ------------------------------------------------------------- *
 *                       INITIAL SETUP                           *
 * ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded',()=>{
  jiggleSection.style.display='flex';
  if(isTablet()){
    jiggleHeading.textContent='Jiggle your tablet';
    window.addEventListener('devicemotion',handleShake);
  }else if(isMobile()){
    jiggleHeading.textContent='Jiggle your phone';
    window.addEventListener('devicemotion',handleShake);
  }else{
    jiggleHeading.textContent='Jiggle your mouse';
    document.addEventListener('mousemove',mouseMove);
  }
});

/* reload within same page (no nav) */
reloadBtn.addEventListener('click',()=>{
  resultDiv.innerHTML=''; resultDiv.style.opacity='0';
  reloadBtn.style.display='none'; jiggleHeading.style.display='';
  if(isTablet()||isMobile()){
    window.addEventListener('devicemotion',handleShake);
  }else{
    mouseMoves=0; lastPos={x:null,y:null};
    document.addEventListener('mousemove',mouseMove);
  }
});




