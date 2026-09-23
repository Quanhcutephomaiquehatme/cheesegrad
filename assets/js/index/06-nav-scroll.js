(() => {
  const nav = document.querySelector('.nav-wrap.motion-nav');
  if (!nav) return;
  const sync = () => nav.classList.toggle('is-scrolled', window.scrollY > 32);
  sync();
  window.addEventListener('scroll', sync, {passive:true});
})();
