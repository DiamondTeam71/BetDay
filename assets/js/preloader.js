window.addEventListener('load', () => {
  const textContainer = document.querySelector('.typing-text .text');
  const word = "নিত্য সদাই";
  let i = 0;

  function typeChar() {
    if (i <= word.length) {
      textContainer.textContent = word.slice(0, i);
      i++;
      setTimeout(typeChar, 150);
    }
  }

  typeChar();

  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    preloader.style.transition = 'opacity 0.5s ease';
    preloader.style.opacity = '0';
    setTimeout(() => preloader.style.display = 'none', 500);
  }, 4000);
});