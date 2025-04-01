// Open (or create) the IndexedDB database
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

// When "Add More Choice" is clicked, add a new choice block
document.getElementById('add-choice').addEventListener('click', () => {
  const choiceDiv = document.createElement('div');
  choiceDiv.className = 'choice';
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = 'Enter text';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  choiceDiv.appendChild(textInput);
  choiceDiv.appendChild(fileInput);
  document.getElementById('choices-container').appendChild(choiceDiv);
});

// Gather choices (convert file inputs to blobs) and store them in IndexedDB
function gatherChoicesAndRedirect() {
  const choicesElements = Array.from(document.querySelectorAll('.choice'));
  const choicesDataPromises = choicesElements.map(choice => {
    const text = choice.querySelector('input[type="text"]').value.trim();
    const fileInput = choice.querySelector('input[type="file"]');
    return new Promise(resolve => {
      if (fileInput.files && fileInput.files[0]) {
        // We'll store the file blob directly
        resolve({ text: text, image: fileInput.files[0] });
      } else {
        resolve({ text: text, image: null });
      }
    });
  });
  
  Promise.all(choicesDataPromises).then(choicesData => {
    openDB().then(db => {
      const transaction = db.transaction("choices", "readwrite");
      const store = transaction.objectStore("choices");
      // Clear previous choices (if any)
      const clearRequest = store.clear();
      clearRequest.onsuccess = function() {
        let addPromises = choicesData.map(choice => {
          return new Promise((resolve, reject) => {
            const addRequest = store.add(choice);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
          });
        });
        Promise.all(addPromises).then(() => {
          db.close();
          window.location.href = "jiggle.html";
        }).catch(err => {
          console.error("Error storing choices:", err);
        });
      };
      clearRequest.onerror = function() {
        console.error("Error clearing old choices.");
      };
    }).catch(err => {
      console.error("Error opening DB:", err);
    });
  });
}

// When "Next" is clicked, request DeviceMotion permission (if needed)
// then gather choices and redirect.
document.getElementById('next-button').addEventListener('click', async () => {
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    try {
      const response = await DeviceMotionEvent.requestPermission();
      if (response !== "granted") {
        alert("Motion permission not granted.");
        return;
      }
    } catch (err) {
      alert("Error requesting motion permission.");
      return;
    }
  }
  gatherChoicesAndRedirect();
});
