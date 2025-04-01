document.addEventListener('DOMContentLoaded', function() {
  const jiggleHeading = document.getElementById('jiggle-heading');
  const simulateBtn = document.getElementById('simulate-jiggle');
  const resultDiv = document.getElementById('result');
  let choices = [];
  const shakeThreshold = 25;
  let lastShakeTime = 0;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('jiqqleDB', 1);
      request.onsuccess = function(event) {
        resolve(event.target.result);
      };
      request.onerror = function(e) {
        reject(e.target.error);
      };
    });
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

  function randomChoice() {
    if (choices.length === 0) return null;
    const index = Math.floor(Math.random() * choices.length);
    return choices[index];
  }

  function handleShake(event) {
    const now = Date.now();
    if (now - lastShakeTime < 1000) return;
    const acc = event.accelerationIncludingGravity;
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z - 9.81);
    if (force > shakeThreshold) {
      lastShakeTime = now;
      jiggleHeading.classList.remove('jiggle-effect');
      const choice = randomChoice();
      if (choice) {
        displayChoice(choice);
      }
      window.removeEventListener('devicemotion', handleShake);
    }
  }

  // For desktop testing.
  if (typeof DeviceMotionEvent === 'undefined') {
    simulateBtn.style.display = 'block';
    simulateBtn.addEventListener('click', function() {
      jiggleHeading.classList.remove('jiggle-effect');
      const choice = randomChoice();
      if (choice) {
        displayChoice(choice);
      }
    });
  } else {
    window.addEventListener('devicemotion', handleShake);
  }

  loadChoices();
});
