let hasChosen = false;
let choices = [];
let lastShakeTime = 0;

function loadChoices() {
  const urlParams = new URLSearchParams(window.location.search);
  choices = [];
  
  let index = 0;
  while(true) {
    const text = urlParams.get(`choice${index}_text`);
    const file = urlParams.get(`choice${index}_file`);
    
    if (!text && !file) break;
    
    choices.push({
      text: text || '',
      file: file || null
    });
    
    index++;
  }
}

function handleMotion(event) {
  if (hasChosen) return;
  
  const acc = event.accelerationIncludingGravity || {};
  const now = Date.now();
  
  // Calculate force (absolute values sum)
  const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z - 9.81);
  const threshold = 25;
  const debounce = 1000;
  
  if (force > threshold && (now - lastShakeTime) > debounce) {
    lastShakeTime = now;
    triggerChoice();
  }
}

function triggerChoice() {
  if (hasChosen || choices.length === 0) return;
  hasChosen = true;
  
  const choice = choices[Math.floor(Math.random() * choices.length)];
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = '';

  if (choice.file) {
    const img = new Image();
    img.src = choice.file;
    resultEl.appendChild(img);
  } else if (choice.text) {
    resultEl.textContent = choice.text;
  }
  
  window.removeEventListener('devicemotion', handleMotion);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadChoices();
  
  if (typeof DeviceMotionEvent !== 'undefined') {
    window.addEventListener('devicemotion', handleMotion);
  } else {
    console.log('Device motion not supported');
  }
  
  document.getElementById('simulate-jiggle').addEventListener('click', triggerChoice);
});
