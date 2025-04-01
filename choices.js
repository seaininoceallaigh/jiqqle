// choices.js

/********** Global Data Storage **********/
const choiceData = {};  // To store individual choice values

/********** Background Circles Animation **********/
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
  // Ensure the canvas is behind other elements
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

// Start background animation
window.crca = new CirclesRandomColorAnimation();

/********** Loader Animation **********/
const preloaderEl = document.querySelector('.loader-container');
const firstWordArr = ["Don't", "know", "what", "to", "do?"];
const secondWordArr = ["Let", "the", "Universe", "decide"];
let counter = 0;

function displayLetter(word, container) {
  counter++;
  const span = document.createElement('span');
  span.className = 'loading';
  const randomX = Math.random() * 200 - 100;
  const randomY = Math.random() * 200 - 100;
  span.style.transform = `translate(${randomX}px, ${randomY}px)`;
  span.style.opacity = 0;
  span.textContent = word;
  container.appendChild(span);
}

function displayWord(arr, container) {
  arr.forEach(word => displayLetter(word, container));
  requestAnimationFrame(() => { orderLetters(); });
}

function orderLetters() {
  document.querySelectorAll('.loading').forEach(el => {
    el.style.transform = 'translate(0, 0)';
    el.style.opacity = 1;
  });
}

function displayLoader() {
  preloaderEl.innerHTML = '';
  counter = 0;
  displayWord(firstWordArr, preloaderEl);
  setTimeout(() => {
    preloaderEl.innerHTML = '';
    counter = 0;
    displayWord(secondWordArr, preloaderEl);
  }, 2000);
  setTimeout(() => {
    preloaderEl.style.display = 'none';
    // Freeze the background animation.
    if (window.crca && window.crca.stop) {
      window.crca.stop();
    }
    // Show the choices section.
    document.getElementById('choices-section').style.display = 'block';
  }, 4000);
}

// Start the loader.
displayLoader();

/********** Choice Form Functionality **********/
document.getElementById('add-choice').addEventListener('click', function() {
  const choiceDiv = document.createElement('div');
  choiceDiv.classList.add('choice');
  choiceDiv.innerHTML = `
    <input type="text" placeholder="Enter text">
    <input type="file" accept="image/*">
    <button class="delete-choice">X</button>
  `;
  choiceDiv.querySelector('.delete-choice').addEventListener('click', function() {
    choiceDiv.remove();
  });
  document.getElementById('choices-container').appendChild(choiceDiv);
});

// ---------- IndexedDB Functions ----------
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

// When the Jiqqle button is clicked...
document.getElementById('jiqqle-button').addEventListener('click', function() {
  // Request DeviceMotion permission if required (for iOS)
  function proceed() {
    // Gather all choices.
    const choiceNodes = document.querySelectorAll('.choice');
    const choices = [];
    choiceNodes.forEach(node => {
      const text = node.querySelector('input[type="text"]').value.trim();
      const fileInput = node.querySelector('input[type="file"]');
      const file = fileInput.files[0] || null;
      if (text || file) {
        choices.push({ text, file });
      }
    });
    if (choices.length < 2) {
      alert('Please enter at least 2 choices.');
      return;
    }
    // Save choices and redirect.
    saveChoicesToIndexedDB(choices).then(() => {
      window.location.href = 'jiggle.html';
    });
  }
  
  if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().then(response => {
      if (response === 'granted') {
        proceed();
      } else {
        alert('Motion permission is required.');
      }
    }).catch(console.error);
  } else {
    proceed();
  }
});


