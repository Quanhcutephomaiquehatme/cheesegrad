(() => {
 const hero = document.querySelector('.cheese-motion-hero');
 const button = hero.querySelector('.hero-motion-toggle');
 button.addEventListener('click', () => {
   const paused = hero.classList.toggle('motion-paused');
   button.setAttribute('aria-pressed', String(paused));
   button.textContent = paused ? '▶ Tiếp tục ảnh' : 'Ⅱ Tạm dừng ảnh';
 });
})();
