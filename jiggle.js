let hasChosen = false;
let choices = [];

// Ensure the jiggle heading is visible on load
window.onload = () => {
  document.getElementById('jiggle-heading').style.display = 'block';
};

// Retrieve stored choices from localStorage
const saved = localStorage.getItem('jiqqleChoices');
if (saved) {
  choices = JSON.parse(saved);
}

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
    img.src = chosen.image;
    resultEl.appendChild(img);
  } else if (chosen.text) {
    resultEl.textContent = chosen.text;
  } else {
    resultEl.textContent = "No valid input in chosen option.";
  }
}

// Listen for device motion to trigger the random choice
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
  // Stop the jiggle animation
  document.getElementById('jiggle-heading').classList.remove('jiggle-effect');
  chooseRandom();
  window.removeEventListener("devicemotion", handleMotion);
}

// Add the devicemotion listener
window.addEventListener("devicemotion", handleMotion);

// Show simulation button on desktop (if touch not supported)
if (!("ontouchstart" in window)) {
  const simBtn = document.getElementById('simulate-jiggle');
  simBtn.style.display = 'block';
  simBtn.addEventListener('click', () => {
    if (!hasChosen) triggerChoice();
  });
}
