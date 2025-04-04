document.addEventListener('DOMContentLoaded', function() {
  const choicesContainer = document.getElementById('choices-container');
  // Global object to hold choice values.
  const choiceData = {};
  let currentChoiceIndex = 1;

  // ---------------- Background Circles Animation ----------------
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
    // Place canvas behind other elements.
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
  window.crca = new CirclesRandomColorAnimation();
  
  // ---------------- Loader Animation ----------------
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
      initChoices();
    }, 4000);
  }
  displayLoader();
  
  // ---------------- Choice Form Functionality ----------------
  // Create a single choice element with a next arrow.
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
    // Give the file input a unique id so the label can refer to it.
    fileInput.id = 'file-input-' + index;
    // Hide the default file input.
    fileInput.style.opacity = '0';
    fileInput.style.position = 'absolute';
    fileInput.style.zIndex = '-1';
    
    const fileLabel = document.createElement('label');
    fileLabel.className = 'custom-file-label';
    fileLabel.setAttribute('for', fileInput.id);
    fileLabel.textContent = 'Or Choose Image';
    
   
    
    
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
          // For choice 1, create and show choice 2.
          let choice2 = document.querySelector(`.choice[data-index="2"]`);
          if (!choice2) {
            currentChoiceIndex = 2;
            choice2 = createChoice(2);
            choicesContainer.appendChild(choice2);
          }
          choice2.style.display = 'block';
        } else {
          // For choice 2 and beyond, hide inputs and show action state.
          showActionState();
        }
      }
    });
    
    div.appendChild(textInput);
    setTimeout(() => {
      textInput.focus();
    }, 100);
     // Append the label first, then the hidden file input.
     div.appendChild(fileLabel);
     div.appendChild(fileInput);
    div.appendChild(nextBtn);
    
    // For choices beyond 2, add a delete button.
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
  
  // Create or show the action state with two buttons.
  function showActionState() {
    // Hide all choice inputs.
    document.querySelectorAll('.choice').forEach(c => c.style.display = 'none');
    let asDiv = document.getElementById('action-state');
    if (!asDiv) {
      asDiv = document.createElement('div');
      asDiv.id = 'action-state';
      const jiqqleButton = document.createElement('button');
      jiqqleButton.id = 'jiqqle-button';
      jiqqleButton.textContent = '→';
      const addMoreButton = document.createElement('button');
      addMoreButton.id = 'action-add-more';
      addMoreButton.textContent = 'Add more choices';
      asDiv.appendChild(addMoreButton);
      asDiv.appendChild(jiqqleButton);
      
      document.getElementById('choices-section').appendChild(asDiv);
    }
    asDiv.style.display = 'block';
  }
  
  function hideActionState() {
    const asDiv = document.getElementById('action-state');
    if (asDiv) asDiv.style.display = 'none';
  }
  
  // Initialize choices by showing only choice 1.
  function initChoices() {
    choicesContainer.innerHTML = '';
    currentChoiceIndex = 1;
    hideActionState();
    const choice1 = createChoice(1);
    choicesContainer.appendChild(choice1);
  }
  
  // Action state button listeners.
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'jiqqle-button') {
      // Immediately request motion permission on user gesture.
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
        // For browsers that don't require permission.
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
  
  // Function to perform snapshot capture, gather inputs, save choices, then redirect.
  function proceedWithJiqqle() {
    // Capture background snapshot.
    if (window.crca && window.crca.canvas) {
      const snapshot = window.crca.canvas.toDataURL("image/png");
      localStorage.setItem('backgroundSnapshot', snapshot);
    }
    // Gather remaining input data.
    document.querySelectorAll('.choice').forEach(node => {
      const idx = parseInt(node.dataset.index);
      const t = node.querySelector('input[type="text"]').value.trim();
      const f = node.querySelector('input[type="file"]').files[0] || null;
      if (t || f) {
        choiceData[idx] = { text: t, file: f };
      }
    });
    // Gather all choices.
    const allChoices = [];
    for (let key in choiceData) {
      allChoices.push(choiceData[key]);
    }
    if (allChoices.length < 2) {
      alert('Please enter at least 2 choices.');
      return;
    }
    // Save choices and then redirect.
    saveChoicesToIndexedDB(allChoices).then(() => {
      window.location.href = 'jiggle.html';
    }).catch(error => {
      console.error("Error saving choices:", error);
    });
  }
  
  // ---------------- IndexedDB Functions ----------------
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
  
  initChoices();
});








