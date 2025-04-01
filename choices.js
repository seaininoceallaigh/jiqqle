document.addEventListener('DOMContentLoaded', function() {
  const addChoiceBtn = document.getElementById('add-choice');
  const jiqqleBtn = document.getElementById('jiqqle-button');
  const choicesContainer = document.getElementById('choices-container');

  // Allow adding extra choices
  addChoiceBtn.addEventListener('click', function() {
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
    choicesContainer.appendChild(choiceDiv);
  });

  // When the Jiqqle button is clicked…
  jiqqleBtn.addEventListener('click', function() {
    // Request DeviceMotion permission if needed (for iOS)
    function proceed() {
      // Gather choices from the form.
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
      // Save choices into IndexedDB and then redirect.
      saveChoicesToIndexedDB(choices).then(() => {
         window.location.href = "jiggle.html";
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
});
