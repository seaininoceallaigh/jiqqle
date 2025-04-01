let hasChosen = false;
let choices = [];

// Open the IndexedDB and get all stored choices
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("JiqqleDB", 1);
    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("choices")) {
        db.createObjectStore("choices", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = function(e) {
      resolve(e.target.result);
    };
    request.onerror = function(e) {
      reject(e.target.error);
    };
  });
}

function getAllChoices() {
  return new Promise((resolve, reject) => {
    openDB().then(db => {
      const transaction = db.transaction("choices", "readonly");
      const store = transaction.objectStore("choices");
      const request = store.getAll();
      request.onsuccess = function() {
        resolve(request.result);
        db.close();
      };
      request.onerror = function() {
        reject(request.error);
      };
    }).catch(reject);
  });
}

// Retrieve choices from IndexedDB on page load
getAllChoices().then(data => {
  choices = data;
}).catch(err => {
  console.error("Error fetching choices:", err);
});

// Pick a random choice and display it
function chooseRandom() {
  if (choices.length === 0) {
    document.getElementById('result').textContent = "No valid choices.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * choices.length);
  const chosen = choices[randomIndex];
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = '';
  if (chosen.image) {
    const img = document.createElement('img');
    // Create an object URL from the stored blob
    const url = URL.createObjectURL(chosen.image);
    img.src = url;
    resultEl.appendChild(img);
  } else if (chosen.text) {
    resultEl.textContent = chosen.text;
  } else {
    resultEl.textContent = "No valid input in chosen option.";
  }
}

// Listen for device motion to trigger random choice
function handleMotion(event) {
  if (hasChosen) return;
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;
  const threshold = 15;
  if (Math.abs(acc.x) > threshold || Math.abs(acc.y) > threshold || Math.abs(acc.z) > threshold) {
    triggerChoice();
  }
}

function triggerChoice() {
  hasChosen = true;
  document.getElementById('jiggle-heading').classList.remove('jiggle-effect');
  chooseRandom();
  window.removeEventListener("devicemotion", handleMotion);
}

// Start listening for motion events
window.addEventListener("devicemotion", handleMotion);

// Show simulation button on desktop (if touch not supported)
if (!("ontouchstart" in window)) {
  const simBtn = document.getElementById('simulate-jiggle');
  simBtn.style.display = 'block';
  simBtn.addEventListener('click', () => {
    if (!hasChosen) triggerChoice();
  });
}
