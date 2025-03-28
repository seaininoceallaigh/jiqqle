const preloaderEl = document.querySelector(".loader-container");
const firstWordArr = ["Don't", "know", "what", "to", "do?"];
const secondWordArr = ["Let", "the", "Universe", "decide"];
let counter = 0;

function displayLetter(letter, container) {
  counter++;
  const newDiv = document.createElement('div');
  newDiv.className = `loading large ${counter}`;
  newDiv.style.setProperty('--X', `${Math.random()*200-100}px`);
  newDiv.style.setProperty('--Y', `${Math.random()*200-100}px`);
  newDiv.textContent = letter;
  container.appendChild(newDiv);
}

function displayWord(arr, container) {
  arr.forEach(letter => displayLetter(letter, container));
}

function displayLoader() {
  preloaderEl.innerHTML = '';
  displayWord(firstWordArr, preloaderEl);
  setTimeout(() => {
    preloaderEl.innerHTML = '';
    displayWord(secondWordArr, preloaderEl);
    setTimeout(() => {
      document.querySelector('.preloader').style.display = 'none';
      document.getElementById('choices-section').style.display = 'flex';
    }, 3000);
  }, 3000);
}

document.getElementById('add-choice').addEventListener('click', () => {
  const choiceDiv = document.createElement('div');
  choiceDiv.className = 'choice';
  choiceDiv.innerHTML = `
    <input type="text" placeholder="Enter text">
    <input type="file" accept="image/*">
  `;
  document.getElementById('choices-container').appendChild(choiceDiv);
});

document.getElementById('request-motion').addEventListener('click', async () => {
  const choices = [];
  
  // Process all choices
  const choiceElements = document.querySelectorAll('.choice');
  for (const choice of choiceElements) {
    const text = choice.querySelector('input[type="text"]').value.trim();
    const fileInput = choice.querySelector('input[type="file"]');
    
    const choiceData = { text };
    
    if (fileInput.files[0]) {
      choiceData.file = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
      });
    }
    
    choices.push(choiceData);
  }
  
  // Save to localStorage and navigate
  localStorage.setItem('jiggleChoices', JSON.stringify(choices));
  window.location.href = 'selector.html';
});

displayLoader();
