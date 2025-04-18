// choices.js
document.addEventListener('DOMContentLoaded', function() {
  // Read and log the skip flag.
  const skipOpening = localStorage.getItem('skipOpening') === 'true';
  console.log("skipOpening flag:", skipOpening);

  // Variables for choices functionality.
  const choicesContainer = document.getElementById('choices-container');
  const choiceData = {};
  let currentChoiceIndex = 1;

  // ---------------- Background Circles Animation ----------------
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function CirclesRandomColorAnimation(loaderCallback) {
    this.canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.style.zIndex = 1;
    
    const ctx = this.canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    document.body.insertBefore(this.canvas, document.body.firstChild);
    
    this.running = true;
    this.startTime = null;
    this.loaderTriggered = false;
    let lastDrawTime = 0;
    const draw = (timestamp) => {
      if (!this.startTime) {
        this.startTime = timestamp;
      }
      if (!this.loaderTriggered && (timestamp - this.startTime) >= 1000) {
        this.loaderTriggered = true;
        console.log("Loader callback triggered at:", timestamp);
        if (loaderCallback) loaderCallback();
      }
      if (timestamp - lastDrawTime > 100) {
        lastDrawTime = timestamp;
        const r = getRandomIntInclusive(0, 255);
        const g = getRandomIntInclusive(0, 255);
        const b = getRandomIntInclusive(0, 255);
        const x = getRandomIntInclusive(0, w);
        const y = getRandomIntInclusive(0, h);
        const a = getRandomIntInclusive(0, 255);
        const radius = getRandomIntInclusive(10, 100);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a/255})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      this.animationId = window.requestAnimationFrame(draw);
    };
    this.animationId = window.requestAnimationFrame(draw);
    this.stop = function() {
      this.running = false;
      cancelAnimationFrame(this.animationId);
    };
  }
  
  // ---------------- Loader Functions ----------------
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
    setTimeout(orderLetters, 50);
  }
  
  function orderLetters() {
    document.querySelectorAll('.loading').forEach(el => {
      el.style.transform = 'translate(0, 0)';
      el.style.opacity = 1;
    });
  }
  
  function fullLoader() {
    console.log("Running fullLoader");
    preloaderEl.style.display = 'block';
    preloaderEl.innerHTML = '';
    counter = 0;
    void preloaderEl.offsetWidth;
    displayWord(firstWordArr, preloaderEl);
    setTimeout(() => {
      preloaderEl.innerHTML = '';
      counter = 0;
      displayWord(secondWordArr, preloaderEl);
    }, 2000);
    setTimeout(() => {
      preloaderEl.style.display = 'none';
      if (window.crca && window.crca.stop) {
        window.crca.stop();
      }
      document.getElementById('choices-section').style.display = 'block';
      initChoices();
    }, 4000);
  }
  
  function minimalLoader() {
    console.log("Running minimalLoader");
    localStorage.removeItem('skipOpening');
    setTimeout(() => {
      if (window.crca && window.crca.stop) {
        window.crca.stop();
      }
      document.getElementById('choices-section').style.display = 'block';
      initChoices();
    }, 750);
  }
  
  const loaderCallback = skipOpening ? minimalLoader : fullLoader;
  window.crca = new CirclesRandomColorAnimation(loaderCallback);
  
  // ---------------- Choice Form Functionality ----------------
  function createChoice(index) {
    const div = document.createElement('div');
    div.className = 'choice';
    div.dataset.index = index;
    div.style.display = (index === 1) ? 'block' : 'none';
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = (index === 1) ? 'Choice 1' : 'Choice ' + index;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = 'file-input-' + index;
    fileInput.style.opacity = '0';
    fileInput.style.position = 'absolute';
    fileInput.style.zIndex = '-1';
    
    const fileLabel = document.createElement('label');
    fileLabel.className = 'custom-file-label';
    fileLabel.setAttribute('for', fileInput.id);
    fileLabel.textContent = 'Or Choose Image';
    
    // Create next button.
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
    
    // Automatically trigger next action when a file is chosen.
    fileInput.addEventListener('change', function() {
      if (fileInput.files && fileInput.files.length > 0) {
        nextBtn.click();
      }
    });
    
    div.appendChild(textInput);
    setTimeout(() => { textInput.focus(); }, 100);
    div.appendChild(fileLabel);
    div.appendChild(fileInput);
    
    // For Choice 2, create a navigation container with back and next buttons side by side.
    if (index === 2) {
      const navContainer = document.createElement('div');
      navContainer.style.display = 'flex';
      navContainer.style.justifyContent = 'center';
      navContainer.style.alignItems = 'center';
      navContainer.style.marginTop = '10px';
      navContainer.style.gap = '0px';
      
      // Back arrow button.
      const backBtn = document.createElement('button');
      backBtn.className = 'back-btn';
      backBtn.textContent = '←';
      backBtn.addEventListener('click', function() {
        div.style.display = 'none';
        let choice1 = document.querySelector('.choice[data-index="1"]');
        if (choice1) {
          choice1.style.display = 'block';
        }
      });
        
      navContainer.appendChild(backBtn);
      navContainer.appendChild(nextBtn);
      div.appendChild(navContainer);
    } else {
      // For Choice 1 and others, just append next button.
      div.appendChild(nextBtn);
    }
    
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
    const instructions = document.getElementById('choice-instructions');
    if (instructions) {
      instructions.style.display = 'none';
    }
    
    document.querySelectorAll('.choice').forEach(c => c.style.display = 'none');
    
    let asDiv = document.getElementById('action-state');
    if (!asDiv) {
      asDiv = document.createElement('div');
      asDiv.id = 'action-state';
      asDiv.style.display = 'flex';
      asDiv.style.flexDirection = 'column';
      asDiv.style.justifyContent = 'center';
      asDiv.style.alignItems = 'center';
      
      const addMoreButton = document.createElement('button');
      addMoreButton.id = 'action-add-more';
      addMoreButton.textContent = 'Add more choices';
      addMoreButton.style.borderRadius = '25px';
      addMoreButton.style.padding = '10px 20px';
      addMoreButton.style.fontSize = '16px';
      addMoreButton.style.margin = '10px';
      addMoreButton.style.textAlign = 'center';
      addMoreButton.style.color = '#757575';
      addMoreButton.style.backgroundColor = 'white';
      addMoreButton.style.border = '1px solid #ccc';
      addMoreButton.classList.add('action-btn');
      
      const jiqqleButton = document.createElement('button');
      jiqqleButton.id = 'jiqqle-button';
      jiqqleButton.textContent = 'Take your chances';
      jiqqleButton.style.borderRadius = '25px';
      jiqqleButton.style.padding = '10px 20px';
      jiqqleButton.style.fontSize = '16px';
      jiqqleButton.style.margin = '10px';
      jiqqleButton.style.textAlign = 'center';
      jiqqleButton.style.color = '#757575';
      jiqqleButton.style.backgroundColor = 'white';
      jiqqleButton.style.border = '1px solid #ccc';
      jiqqleButton.classList.add('action-btn');
      
      asDiv.appendChild(addMoreButton);
      asDiv.appendChild(jiqqleButton);
      document.getElementById('choices-section').appendChild(asDiv);
    }
    asDiv.style.display = 'flex';
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
  
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'jiqqle-button') {
      if (typeof DeviceMotionEvent !== "undefined" &&
          typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission()
          .then(response => {
            if (response === "granted") {
              proceedWithJiqqle();
            } else {
              alert(
                'Motion access was blocked. Close Safari (or kill this tab) and reopen, or clear this site’s data in Settings → Safari → Advanced → Website Data, then try again.'
              );
            }
          })
          .catch(error => {
            console.error("Error requesting motion permission:", error);
            alert(
              'Motion access was blocked. Close Safari (or kill this tab) and reopen, or clear this site’s data in Settings → Safari → Advanced → Website Data, then try again.'
            );
          });
      } else {
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
  
  function proceedWithJiqqle() {
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
    const allChoices = Object.values(choiceData);
    if (allChoices.length < 2) {
      alert('Please enter at least 2 choices.');
      return;
    }
    saveChoicesToIndexedDB(allChoices)
      .then(() => { window.location.href = 'jiggle.html'; })
      .catch(error => {
        console.error("Error saving choices:", error);
      });
  }
  
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
  
  // Initialize the choices form.
  initChoices();
});










