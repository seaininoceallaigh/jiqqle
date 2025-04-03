document.addEventListener('DOMContentLoaded', function() {
  const snapshot = localStorage.getItem('backgroundSnapshot');
  if (snapshot) {
    document.body.style.backgroundImage = `url(${snapshot})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundRepeat = 'no-repeat';
  }
  
  const jiggleHeading = document.getElementById('jiggle-heading');
  const simulateBtn = document.getElementById('simulate-jiggle');
  const resultDiv = document.getElementById('result');
  let choices = [];
  const shakeThreshold = 25;
  let lastShakeTime = 0;
  
  // IndexedDB functions (unchanged)
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('jiqqleDB', 1);
      request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('choices')) {
          db.createObjectStore('choices', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = function(event) {
        resolve(event.target.result);
      };
      request.onerror = function(event) {
        reject(event.target.error);
      };
    });
  }
  
  function clearChoices(db) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['choices'], 'readwrite');
      const store = transaction.objectStore('choices');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = e => reject(e.target.error);
    });
  }
  
  function storeChoice(db, choice) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['choices'], 'readwrite');
      const store = transaction.objectStore('choices');
      const request = store.add(choice);
      request.onsuccess = () => resolve();
      request.onerror = e => reject(e.target.error);
    });
  }
  
  async function saveChoicesToIndexedDB(choices) {
    const db = await openDatabase();
    await clearChoices(db);
    for (let choice of choices) {
      await storeChoice(db, choice);
    }
  }
  
  // Load choices from IndexedDB
  function getChoices(db) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['choices'], 'readonly');
      const store = transaction.objectStore('choices');
      const request = store.getAll();
      request.onsuccess = function(event) {
        resolve(event.target.result);
      };
      request.onerror = function(e) {
        reject(e.target.error);
      };
    });
  }
  
  async function loadChoices() {
    const db = await openDatabase();
    choices = await getChoices(db);
    console.log('Loaded choices:', choices);
  }
  
  function randomChoice() {
    if (choices.length === 0) return null;
    const index = Math.floor(Math.random() * choices.length);
    return choices[index];
  }
  
  // Function to display the final random answer.
  function displayChoice(choice) {
    resultDiv.innerHTML = '';
    if (choice.file) {
      const img = document.createElement('img');
      const url = URL.createObjectURL(choice.file);
      img.src = url;
      resultDiv.appendChild(img);
    } else {
      resultDiv.textContent = choice.text;
    }
  }
  
  // Circles Animation constructor (same as in index.html)
  function CirclesRandomColorAnimation() {
    this.canvas = document.createElement('canvas');
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    // Place canvas behind other elements.
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = 0;
    this.canvas.style.left = 0;
    this.canvas.style.zIndex = 1;
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    document.body.insertBefore(this.canvas, document.body.firstChild);
    
    let animationId;
    const draw = () => {
      animationId = window.requestAnimationFrame(draw);
      if (!draw.frameCount) draw.frameCount = 0;
      draw.frameCount++;
      if (draw.frameCount % 10 === 1) {
        const r = getRandomIntInclusive(0, 255);
        const g = getRandomIntInclusive(0, 255);
        const b = getRandomIntInclusive(0, 255);
        const x = getRandomIntInclusive(0, w);
        const y = getRandomIntInclusive(0, h);
        const a = getRandomIntInclusive(0, 255);
        const radius = getRandomIntInclusive(10, 100);
        ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    window.requestAnimationFrame(draw);
    this.stop = function() {
      cancelAnimationFrame(animationId);
    };
  }
  
  // Helper: random integer inclusive
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // Shake detection handler.
  function handleShake(event) {
    const now = Date.now();
    if (now - lastShakeTime < 1000) return;
    const acc = event.accelerationIncludingGravity;
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z - 9.81);
    if (force > shakeThreshold) {
      lastShakeTime = now;
      window.removeEventListener('devicemotion', handleShake);
      // Proceed with jiggle animation sequence.
      startJiggleSequence();
    }
  }
  
  // Start the jiggle sequence after shake is detected.
  function startJiggleSequence() {
    // Hide background snapshot.
    document.body.style.backgroundImage = 'none';
    // Hide jiggle heading.
    if (jiggleHeading) {
      jiggleHeading.style.display = 'none';
    }
    
    // Start new circles animation.
    window.crca = new CirclesRandomColorAnimation();
    
    // Create and show "Randomizing" flashing text.
    const randomizingEl = document.createElement('div');
    randomizingEl.id = 'randomizing-text';
    randomizingEl.textContent = 'Randomizing';
    randomizingEl.style.position = 'absolute';
    randomizingEl.style.top = '50%';
    randomizingEl.style.left = '50%';
    randomizingEl.style.transform = 'translate(-50%, -50%)';
    randomizingEl.style.fontSize = '2em';
    randomizingEl.style.fontWeight = 'bold';
    randomizingEl.style.zIndex = 20;
    // Add a simple CSS animation for flashing.
    randomizingEl.style.animation = 'flash 0.5s linear infinite';
    document.body.appendChild(randomizingEl);
    
    // Define keyframes for flash animation.
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
    
    // After 3 seconds, freeze animation and show random choice.
    setTimeout(function() {
      if (window.crca && window.crca.stop) {
        window.crca.stop();
      }
      // Remove the "Randomizing" text.
      randomizingEl.remove();
      // Get a random choice and display it in the center.
      const choice = randomChoice();
      if (choice) {
        resultDiv.style.position = 'absolute';
        resultDiv.style.top = '50%';
        resultDiv.style.left = '50%';
        resultDiv.style.transform = 'translate(-50%, -50%)';
        displayChoice(choice);
      }
    }, 3000);
  }
  
  // For desktop testing: simulate jiggle if DeviceMotionEvent isn't available.
  if (typeof DeviceMotionEvent === 'undefined') {
    simulateBtn.style.display = 'block';
    simulateBtn.addEventListener('click', function() {
      startJiggleSequence();
    });
  } else {
    window.addEventListener('devicemotion', handleShake);
  }
  
  loadChoices();
});

