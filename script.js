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
  const form = document.getElementById('choicesForm');
  const choices = Array.from(document.querySelectorAll('.choice'));
  
  // Clear previous inputs
  form.innerHTML = '';
  
  // Process each choice
  for (const [index, choice] of choices.entries()) {
    const textInput = choice.querySelector('input[type="text"]');
    const fileInput = choice.querySelector('input[type="file"]');
    
    // Add text value
    const textField = document.createElement('input');
    textField.type = 'hidden';
    textField.name = `choice${index}_text`;
    textField.value = textInput.value.trim();
    form.appendChild(textField);

    // Process file if exists
    if (fileInput.files[0]) {
      const reader = new FileReader();
      await new Promise(resolve => {
        reader.onload = function(e) {
          const fileField = document.createElement('input');
          fileField.type = 'hidden';
          fileField.name = `choice${index}_file`;
          fileField.value = e.target.result;
          form.appendChild(fileField);
          resolve();
        }
        reader.readAsDataURL(fileInput.files[0]);
      });
    }
  }
  
  form.submit();
});

displayLoader();
