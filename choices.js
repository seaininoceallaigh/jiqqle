// Add new choice when button clicked
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

// On clicking Next, gather choices and redirect to jiggle.html
document.getElementById('next-button').addEventListener('click', () => {
  // Gather each choice as a promise (to handle image file reading)
  const choices = Array.from(document.querySelectorAll('.choice')).map(choice => {
    const textInput = choice.querySelector('input[type="text"]');
    const fileInput = choice.querySelector('input[type="file"]');
    return new Promise((resolve) => {
      if(fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          resolve({ text: textInput.value.trim(), image: e.target.result });
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        resolve({ text: textInput.value.trim(), image: null });
      }
    });
  });
  Promise.all(choices).then(results => {
    localStorage.setItem('jiqqleChoices', JSON.stringify(results));
    // Redirect to jiggle page
    window.location.href = 'jiggle.html';
  });
});
