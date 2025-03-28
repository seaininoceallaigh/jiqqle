document.addEventListener('DOMContentLoaded', async () => {
  const choices = JSON.parse(localStorage.getItem('jiggleChoices') || []);
  let hasChosen = false;
  
  if (choices.length === 0) {
    document.getElementById('jiggle-heading').textContent = 'No choices found!';
    return;
  }

  // Request motion permission
  if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') {
        document.getElementById('jiggle-heading').textContent = 'Permission required!';
        return;
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  }

  // Shake detection
  function handleMotion(event) {
    if (hasChosen) return;
    
    const acc = event.accelerationIncludingGravity || {};
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z - 9.81);
    
    if (force > 25) {
      triggerChoice();
    }
  }

  function triggerChoice() {
    if (hasChosen) return;
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

  // Setup listeners
  window.addEventListener('devicemotion', handleMotion);
  document.getElementById('simulate-jiggle').addEventListener('click', triggerChoice);
});
