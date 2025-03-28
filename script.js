document.getElementById('request-motion').addEventListener('click', async () => {
  // ... (keep existing choice processing code)
  
  // Add permission request before navigation
  if (typeof DeviceMotionEvent !== 'undefined' && 
      typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const status = await DeviceMotionEvent.requestPermission();
      if (status !== 'granted') {
        alert('Motion permission required to continue');
        return;
      }
    } catch (error) {
      console.error('Permission error:', error);
      return;
    }
  }
  
  localStorage.setItem('jiggleChoices', JSON.stringify(choices));
  window.location.href = 'selector.html';
});
