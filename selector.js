document.addEventListener('DOMContentLoaded', () => {
  const choices = JSON.parse(localStorage.getItem('jiggleChoices') || [];
  let hasChosen = false;
  let motionListenerActive = false;

  // Check for choices
  if (choices.length < 1) {
    document.getElementById('jiggle-heading').textContent = 'No choices found! Go back and add some.';
    return;
  }

  // Elements
  const jiggleHeading = document.getElementById('jiggle-heading');
  const simulateBtn = document.getElementById('simulate-jiggle');

  // Shake detection logic
  function handleMotion(event) {
    if (hasChosen) return;
    
    const acc = event.accelerationIncludingGravity || {};
    const force = Math.sqrt(
      Math.pow(acc.x, 2) + 
      Math.pow(acc.y, 2) + 
      Math.pow(acc.z - 9.81, 2) // Account for gravity
    );
    
    if (force > 15) { // Lowered threshold for better sensitivity
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
    } else {
      resultEl.textContent = choice.text || "No valid input";
    }
    
    if (motionListenerActive) {
      window.removeEventListener('devicemotion', handleMotion);
    }
  }

  // Permission handling
  async function enableMotion() {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof DeviceMotionEvent.requestPermission === 'function') {
        const status = await DeviceMotionEvent.requestPermission();
        if (status !== 'granted') {
          jiggleHeading.textContent = 'Permission required - Tap button to simulate';
          return;
        }
      }
      
      // Start listening for motion
      window.addEventListener('devicemotion', handleMotion);
      motionListenerActive = true;
      jiggleHeading.textContent = 'Jiggle your phone!';
      
    } catch (error) {
      console.error('Motion error:', error);
      jiggleHeading.textContent = 'Error enabling motion';
    }
  }

  // Button click handlers
  simulateBtn.addEventListener('click', async () => {
    if (!motionListenerActive) {
      await enableMotion();
    }
    if (!hasChosen) {
      triggerChoice();
    }
  });

  // Initial permission check for non-iOS devices
  if (typeof DeviceMotionEvent !== 'undefined' && 
      typeof DeviceMotionEvent.requestPermission !== 'function') {
    enableMotion();
  }
});
