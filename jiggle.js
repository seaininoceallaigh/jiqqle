document.addEventListener('DOMContentLoaded', function() {
  // Desktop vs mobile check: if no touch support, assume desktop.
  if (!('ontouchstart' in window)) {
    const jiggleHeading = document.getElementById('jiggle-heading');
    jiggleHeading.textContent = "Jiggle your mouse";
    document.getElementById('simulate-jiggle').style.display = 'block';
    console.log("Desktop mode: Using mouse simulation.");
  }
  
  const resultDiv = document.getElementById('result');
  let choices = [];
  const shakeThreshold = 50; // Adjust sensitivity here.
  let lastShakeTime = 0;
  
  // IndexedDB Functions
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
  
  // Background Circles Animation (same as index.html)
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function CirclesRandomColorAnimation() {
    this.canvas = document.createElement('canvas');
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = w;
    this.canvas.height = h;
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
  
  // Choice Form Functionality
  const choicesContainer = document.getElementById('choices-container');
  const choiceData = {};
  let currentChoiceIndex = 1;
  
  function createChoice(index) {
    const div = document.createElement('div');
    div.className = 'choice';
    div.dataset.index = index;
    div.style.display = (index === 1) ? 'block' : 'none';
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = (index === 1) ? 'choice 1 of at least 2' : 'choice ' + index;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = '→';
    nextBtn.addEventListener('click', function() {
      const textVal = textInput.value.trim();
      const file = fileInput.files[0] || null;
      choiceData[index] = { text: textVal, file: file };
      if (textVal || file) {
        div.style.display = 'none';
        if (index === 1) {
          let choice2 = document.querySelector(`.choice[data-index="2"]`);
          if (!choice2) {
            currentChoiceIndex = 2;
            choice2 = createChoice(2);
            choicesContainer.appendChild(choice2);
          }
          choice2.style.display = 'block';
        } else {
          showActionState();
        }
      }
    });
    
    div.appendChild(textInput);
    div.appendChild(fileInput);
    div.appendChild(nextBtn);
    
    if (index > 2) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'X';
      deleteBtn.addEventListener('click', function() {
        delete choiceData[index];
        div.remove();
        showActionState();
      });
      div.appendChild(deleteBtn);
    }
    return div;
  }
  
  function showActionState() {
    document.querySelectorAll('.choice').forEach(c => c.style.display = 'none');
    let asDiv = document.getElementById('action-state');
    if (!asDiv) {
      asDiv = document.createElement('div');
      asDiv.id = 'action-state';
      const jiqqleButton = document.createElement('button');
      jiqqleButton.id = 'jiqqle-button';
      jiqqleButton.textContent = 'Jiqqle';
      const addMoreButton = document.createElement('button');
      addMoreButton.id = 'action-add-more';
      addMoreButton.textContent = 'Add more choices';
      asDiv.appendChild(jiqqleButton);
      asDiv.appendChild(addMoreButton);
      document.getElementById('choices-section').appendChild(asDiv);
    }
    asDiv.style.display = 'block';
  }
  
  function hideActionState() {
    const asDiv = document.getElementById('action-state');
    if (asDiv) asDiv.style.display = 'none';
  }
  
  function initChoices() {
    choicesContainer.innerHTML = '';
    currentChoiceIndex = 1;
    hideActionState();
    const choice1 = createChoice(1);
    choicesContainer.appendChild(choice1);
  }
  
  // Event listeners for action state buttons.
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'jiqqle-button') {
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission()
          .then(response => {
            if (response === "granted") {
              proceedWithJiqqle();
            } else {
              alert("Motion permission is required to continue.");
            }
          })
          .catch(error => {
            console.error("Error requesting motion permission:", error);
            alert("Error requesting motion permission.");
          });
      } else {
        // Desktop: log for debugging.
        console.log("Desktop mode: Simulating jiggle via button click.");
        proceedWithJiqqle();
      }
    }
    if (e.target && e.target.id === 'action-add-more') {
      hideActionState();
      currentChoiceIndex++;
      const newChoice = createChoice(currentChoiceIndex);
      choicesContainer.appendChild(newChoice);
      newChoice.style.display = 'block';
    }
  });
  
  // Function to capture snapshot, gather inputs, save choices, then start jiggle sequence.
  function proceedWithJiqqle() {
    // Save a snapshot from the current animation.
    if (window.crca && window.crca.canvas) {
      const snapshot = window.crca.canvas.toDataURL("image/png");
      localStorage.setItem('backgroundSnapshot', snapshot);
    }
    document.querySelectorAll('.choice').forEach(node => {
      const idx = parseInt(node.dataset.index);
      const t = node.querySelector('input[type="text"]').value.trim();
      const f = node.querySelector('input[type="file"]').files[0] || null;
      if (t || f) {
        choiceData[idx] = { text: t, file: f };
      }
    });
    const allChoices = [];
    for (let key in choiceData) {
      allChoices.push(choiceData[key]);
    }
    if (allChoices.length < 2) {
      alert('Please enter at least 2 choices.');
      return;
    }
    saveChoicesToIndexedDB(allChoices).then(() => {
      startJiggleSequence();
    }).catch(error => {
      console.error("Error saving choices:", error);
    });
  }
  
  // Shake detection.
  function handleShake(event) {
    const now = Date.now();
    if (now - lastShakeTime < 1000) return;
    const acc = event.accelerationIncludingGravity;
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z - 9.81);
    if (force > shakeThreshold) {
      lastShakeTime = now;
      window.removeEventListener('devicemotion', handleShake);
      startJiggleSequence();
    }
  }
  
  // Jiggle sequence: hide background, start new animation with "Randomizing" flash,
  // then after 3 seconds, stop animation and show a random answer.
  function startJiggleSequence() {
    // Remove background snapshot and hide jiggle heading.
    document.body.style.backgroundImage = 'none';
    if (jiggleHeading) {
      jiggleHeading.style.display = 'none';
    }
    
    // Start new circles animation.
    window.crca = new CirclesRandomColorAnimation();
    
    // Create flashing "Randomizing" text.
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
    // Slower flashing animation: 2s cycle.
    randomizingEl.style.animation = 'flash 2s linear infinite';
    document.body.appendChild(randomizingEl);
    
    // Insert keyframes for flash animation.
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
    
    // After 3 seconds, stop animation and show the result.
    setTimeout(function() {
      if (window.crca && window.crca.stop) {
        window.crca.stop();
      }
      randomizingEl.remove();
      resultDiv.style.position = 'absolute';
      resultDiv.style.top = '50%';
      resultDiv.style.left = '50%';
      resultDiv.style.transform = 'translate(-50%, -50%)';
      resultDiv.style.zIndex = 30;
      console.log("Choices array:", choices);
      const choice = randomChoice();
      console.log("Random choice:", choice);
      if (choice) {
        displayChoice(choice);
      } else {
        resultDiv.textContent = 'No choice found';
      }
    }, 3000);
  }
  
  // Display the chosen answer.
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
  
  // For desktop testing: if DeviceMotionEvent is undefined, add a click listener on simulate button.
  if (typeof DeviceMotionEvent === 'undefined') {
    const simulateBtn = document.getElementById('simulate-jiggle');
    simulateBtn.style.display = 'block';
    simulateBtn.addEventListener('click', function() {
      console.log("Desktop simulate button clicked.");
      startJiggleSequence();
    });
  } else {
    window.addEventListener('devicemotion', handleShake);
  }
  
  loadChoices();
  initChoices();
});

