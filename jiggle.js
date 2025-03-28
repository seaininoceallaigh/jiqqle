let hasChosen = false;
let choices = [];

// Retrieve the saved choices from localStorage
const saved = localStorage.getItem('jiqqleChoices');
if(saved) {
  choices = JSON.parse(saved);
}

// Function to pick a random choice and display it
function chooseRandom() {
  if(choices.length === 0) {
    document.getElementById('result').textContent = "No valid choices.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * choices.length);
  const chosen = choices[randomIndex];
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = '';
  if(chosen.image) {
    const img = document.createElement('img');
    img.src = chosen.image;
    resultEl.appendChild(img);
  } else if(chosen.text) {
    resultEl.textContent = chosen.text;
  } else {
    resultEl.textContent = "No valid input in chosen option.";
  }
}

// Motion handling: when a sufficient shake is detected, trigger the choice
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

// Request motion permission (for iOS)
async function requestMotionPermission() {
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    try {
      const response = await DeviceMotionEvent.requestPermission();
      if (response === "granted") {
        window.addEventListener("devicemotion", handleMotion);
      } else {
        alert("Permission denied.");
      }
    } catch (err) {
      alert("Error requesting permission.");
    }
  } else {
    window.addEventListener("devicemotion", handleMotion);
  }
}

requestMotionPermission();

// Show simulate button for desktop testing (if touch not supported)
if (!("ontouchstart" in window)) {
  document.getElementById('simulate-jiggle').style.display = 'block';
  document.getElementById('simulate-jiggle').addEventListener('click', () => {
    if (!hasChosen) triggerChoice();
  });
}
