(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------
     Utility UI: progress, mobile menu, toast
  -------------------------------------------------- */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  document.body.prepend(progress);
  const progressBar = $('span', progress);

  const toastStack = document.createElement('div');
  toastStack.className = 'toast-stack';
  toastStack.setAttribute('aria-live', 'polite');
  document.body.append(toastStack);

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    toastStack.append(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    window.setTimeout(() => {
      toast.classList.remove('show');
      window.setTimeout(() => toast.remove(), 320);
    }, 2300);
  }

  const header = $('.nav-wrap');
  const desktopNav = $('.nav-wrap nav');
  const menuButton = document.createElement('button');
  menuButton.className = 'mobile-menu-toggle';
  menuButton.type = 'button';
  menuButton.setAttribute('aria-label', 'Mở menu');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.innerHTML = '<span></span>';
  header.append(menuButton);

  const drawer = document.createElement('div');
  drawer.className = 'mobile-drawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `<nav aria-label="Menu mobile">${desktopNav.innerHTML}</nav>`;
  document.body.append(drawer);

  function setMenu(open) {
    drawer.classList.toggle('open', open);
    menuButton.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    drawer.setAttribute('aria-hidden', String(!open));
  }

  menuButton.addEventListener('click', () => setMenu(!drawer.classList.contains('open')));
  $$('.mobile-drawer a').forEach(link => link.addEventListener('click', () => setMenu(false)));

  /* --------------------------------------------------
     Scroll states + active section
  -------------------------------------------------- */
  const navLinks = $$('.nav-wrap nav a[href^="#"]');
  const sections = navLinks
    .map(link => $(link.getAttribute('href')))
    .filter(Boolean);

  let ticking = false;
  function updateScrollUI() {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progressBar.style.transform = `scaleX(${Math.min(1, y / max)})`;
    header.classList.toggle('is-scrolled', y > 32);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollUI);
      ticking = true;
    }
  }, { passive: true });
  updateScrollUI();

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-28% 0px -62% 0px', threshold: 0 });

    sections.forEach(section => sectionObserver.observe(section));
  }

  /* --------------------------------------------------
     Reveal animations
  -------------------------------------------------- */
  const reveals = $$('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.11, rootMargin: '0px 0px -4% 0px' });
    reveals.forEach(el => revealObserver.observe(el));
  }

  /* --------------------------------------------------
     Animated hero counters
  -------------------------------------------------- */
  const statValues = $$('.hero-stats b');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;

      statValues.forEach(el => {
        const original = el.textContent.trim();
        const number = parseFloat(original.replace(/[^0-9.]/g, ''));
        if (!Number.isFinite(number)) return;
        const isDecimal = original.includes('.');
        const suffix = original.replace(/[0-9.]/g, '');
        const duration = 950;
        const started = performance.now();

        function frame(now) {
          const p = Math.min(1, (now - started) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const value = number * eased;
          el.textContent = `${isDecimal ? value.toFixed(1) : Math.round(value)}${suffix}`;
          if (p < 1) requestAnimationFrame(frame);
          else el.textContent = original;
        }
        requestAnimationFrame(frame);
      });
      statObserver.disconnect();
    }, { threshold: 0.55 });
    const stats = $('.hero-stats');
    if (stats) statObserver.observe(stats);
  }

  /* --------------------------------------------------
     Photographer filtering
  -------------------------------------------------- */
  const filters = $$('.filter');
  const rail = $('.cheese-photographer-grid');
  const getCards = () => $$('.photographer-card:not(.directory-card-ghost)');
  const normalize = text => String(text||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').toLowerCase();
  const queryInput = $('#photographerSearch');
  const sortSelect = $('#photographerSort');
  const resultLabel = $('#photographerResult');
  const emptyState = $('.directory-empty');

  function cardMeta(card){
    const rating = Number(card.dataset.rating || (card.querySelector('.shoot-stats b')?.textContent || '').replace(/[^0-9.]/g,'')) || 0;
    const price = Number(card.dataset.price || (card.querySelector('.price-block strong')?.textContent || '').replace(/[^0-9]/g,'')) || 0;
    const location = card.dataset.location || 'Hà Nội';
    const team = card.dataset.team || '';
    const style = card.dataset.style || 'all';
    const verified = card.dataset.verified !== 'false';
    const name = card.querySelector('h3')?.textContent || '';
    const tags = normalize(card.querySelector('.photographer-tags')?.textContent || '');
    const searchText = normalize(`${name} ${location} ${team} ${style} ${tags}`);
    return { rating, price, location, team, style, verified, tags, searchText, name };
  }

  function updateFilterBadges(){
    const cards = getCards();
    filters.forEach(button => {
      let badge = button.querySelector('.filter-count');
      if(!badge){
        badge = document.createElement('span');
        badge.className = 'filter-count';
        button.append(badge);
      }
      const value = button.dataset.filter;
      const count = value === 'all' ? cards.length : cards.filter(card => card.dataset.style === value).length;
      badge.textContent = count;
    });
    if(resultLabel && !resultLabel.textContent.trim()) resultLabel.textContent = `${cards.length} hồ sơ phù hợp`;
  }
  updateFilterBadges();

  let filterTimer;
  let filterGeneration = 0;

  function getSelectedValues(name){
    return $$(`input[name="${name}"]:checked`).map(input => input.value);
  }

  function matchesAdvanced(card){
    const meta = cardMeta(card);
    const query = normalize(queryInput?.value.trim() || '');
    if (query && !meta.searchText.includes(query)) return false;

    const selectedTeams = getSelectedValues('teamFilter');
    if (selectedTeams.length && !selectedTeams.includes(meta.team)) return false;

    const selectedLocations = getSelectedValues('locationFilter');
    if (selectedLocations.length && !selectedLocations.includes(meta.location)) return false;

    const selectedSupport = getSelectedValues('supportFilter').map(normalize);
    if (selectedSupport.length && !selectedSupport.every(tag => meta.tags.includes(tag))) return false;

    const budget = document.querySelector('input[name="budgetFilter"]:checked')?.value || 'all';
    if (budget === 'under-2500000' && !(meta.price < 2500000)) return false;
    if (budget === '2500000-3000000' && !(meta.price >= 2500000 && meta.price <= 3000000)) return false;
    if (budget === '3000000-4000000' && !(meta.price > 3000000 && meta.price <= 4000000)) return false;
    if (budget === 'over-4000000' && !(meta.price > 4000000)) return false;

    const minRating = Number(document.querySelector('input[name="ratingFilter"]:checked')?.value || '0');
    if (minRating && meta.rating < minRating) return false;

    const verifiedOnly = document.getElementById('directoryVerifiedOnly')?.checked;
    if (verifiedOnly && !meta.verified) return false;

    // Directory date/session filter is resolved against Admin/Supabase by
    // 11-directory-availability.js. Only apply it after a reliable lookup.
    const scheduleDate = document.getElementById('directoryShootDate')?.value || '';
    const scheduleSlot = document.querySelector('input[name="directoryTimeSlot"]:checked')?.value || '';
    const availabilityState = document.getElementById('photographers')?.dataset.availabilityStatus || 'idle';
    if (scheduleDate && scheduleSlot && (availabilityState === 'ready' || availabilityState === 'partial')) {
      if (card.dataset.scheduleDate !== scheduleDate || card.dataset.scheduleSlot !== scheduleSlot) return false;
      if (card.dataset.scheduleAvailable !== 'true') return false;
    }

    return true;
  }

  // Motion for the dedicated photographer directory only.
  // The old implementation waited for exit timers before reflowing the grid.
  // That made rapid filter changes fight each other and caused cards to jump.
  // Here, leaving cards are rendered as short-lived visual ghosts while the
  // real grid reflows immediately, then all remaining cards FLIP into place.
  const animatedDirectory = document.documentElement.classList.contains('directory-mode');
  let directoryInitialized = false;
  let directoryMotionGeneration = 0;
  const directoryAnimations = new Set();
  const directoryGhosts = new Set();

  const captureCards = () => new Map(
    getCards()
      .filter(card => !card.classList.contains('hidden'))
      .map(card => [card, card.getBoundingClientRect()])
  );

  function trackDirectoryAnimation(animation, onFinish){
    directoryAnimations.add(animation);
    animation.finished.then(() => {
      directoryAnimations.delete(animation);
      onFinish?.();
    }).catch(() => {
      directoryAnimations.delete(animation);
      onFinish?.();
    });
    return animation;
  }

  function removeDirectoryGhost(ghost){
    directoryGhosts.delete(ghost);
    ghost.remove();
  }

  function createDirectoryGhost(card, rect){
    if (!rect || rect.width < 1 || rect.height < 1) return null;
    const ghost = card.cloneNode(true);
    ghost.classList.remove('reveal', 'visible', 'hidden', 'is-leaving');
    ghost.classList.add('directory-card-ghost');
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    ghost.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(node => {
      node.setAttribute('tabindex', '-1');
      node.setAttribute('aria-hidden', 'true');
    });
    ghost.style.setProperty('--ghost-left', `${rect.left}px`);
    ghost.style.setProperty('--ghost-top', `${rect.top}px`);
    ghost.style.setProperty('--ghost-width', `${rect.width}px`);
    ghost.style.setProperty('--ghost-height', `${rect.height}px`);
    (document.getElementById('photographers') || document.body).append(ghost);
    directoryGhosts.add(ghost);
    return ghost;
  }

  function clearStaleDirectoryMotion(){
    // Existing card animations should never survive into a new filter pass.
    directoryAnimations.forEach(animation => animation.cancel());
    directoryAnimations.clear();
    directoryGhosts.forEach(ghost => ghost.remove());
    directoryGhosts.clear();
    getCards().forEach(card => {
      card.style.removeProperty('translate');
      card.style.removeProperty('scale');
      card.style.removeProperty('filter');
      card.style.removeProperty('will-change');
    });
    document.getElementById('photographers')?.classList.remove('directory-is-filtering');
  }

  function settleDirectoryState(show){
    const visible = new Set(show);
    getCards().forEach(card => {
      card.classList.toggle('hidden', !visible.has(card));
      card.classList.remove('is-leaving');
      if (visible.has(card)) card.classList.add('visible');
    });
    if (resultLabel) {
      resultLabel.setAttribute('aria-live', 'polite');
      const scheduleDate = document.getElementById('directoryShootDate')?.value || '';
      const scheduleSlot = document.querySelector('input[name="directoryTimeSlot"]:checked')?.value || '';
      const availabilityState = document.getElementById('photographers')?.dataset.availabilityStatus || 'idle';
      if (scheduleDate && scheduleSlot && (availabilityState === 'ready' || availabilityState === 'partial')) {
        const parts = scheduleDate.split('-');
        const prettyDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : scheduleDate;
        resultLabel.textContent = `${show.length} thợ còn lịch · ${prettyDate} · ${scheduleSlot}`;
      } else {
        resultLabel.textContent = `${show.length} hồ sơ phù hợp`;
      }
    }
    if (emptyState) emptyState.hidden = show.length > 0;
  }

  function animateDirectory(show, generation, previousPositions){
    const section = document.getElementById('photographers');
    const before = previousPositions || captureCards();
    const currentlyVisible = getCards().filter(card => !card.classList.contains('hidden'));
    const showSet = new Set(show);
    const leaving = currentlyVisible.filter(card => !showSet.has(card));

    clearStaleDirectoryMotion();
    const motionGeneration = ++directoryMotionGeneration;

    if (!directoryInitialized || reducedMotion) {
      directoryInitialized = true;
      settleDirectoryState(show);
      return;
    }

    section?.classList.add('directory-is-filtering');

    // Clone outgoing cards at their exact visual positions. The real cards can
    // be hidden immediately, so the grid never waits on a timeout to reflow.
    const ghosts = leaving.map(card => createDirectoryGhost(card, before.get(card))).filter(Boolean);
    settleDirectoryState(show);

    // Read the new layout once, after all visibility changes are committed.
    const after = new Map(show.map(card => [card, card.getBoundingClientRect()]));

    show.forEach((card, index) => {
      const oldRect = before.get(card);
      const newRect = after.get(card);
      if (!newRect || newRect.width < 1 || newRect.height < 1) return;

      card.style.willChange = 'translate, scale, filter';
      let frames;
      let delay = 0;

      if (oldRect && oldRect.width > 0 && oldRect.height > 0) {
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        const sx = Math.max(.82, Math.min(1.18, oldRect.width / newRect.width));
        const sy = Math.max(.82, Math.min(1.18, oldRect.height / newRect.height));
        const moved = Math.abs(dx) > .5 || Math.abs(dy) > .5 || Math.abs(sx - 1) > .01 || Math.abs(sy - 1) > .01;
        frames = moved
          ? [
              { translate:`${dx}px ${dy}px`, scale:`${sx} ${sy}`, filter:'opacity(1)' },
              { translate:'0 0', scale:'1 1', filter:'opacity(1)' }
            ]
          : [
              { translate:'0 0', scale:'1 1', filter:'opacity(.985)' },
              { translate:'0 0', scale:'1 1', filter:'opacity(1)' }
            ];
      } else {
        delay = Math.min(index * 18, 90);
        frames = [
          { translate:'0 16px', scale:'.965 .965', filter:'opacity(0)' },
          { translate:'0 0', scale:'1 1', filter:'opacity(1)' }
        ];
      }

      const animation = card.animate(frames, {
        duration: oldRect ? 430 : 390,
        delay,
        easing:'cubic-bezier(.22,1,.36,1)',
        fill:'both'
      });
      trackDirectoryAnimation(animation, () => {
        card.style.removeProperty('will-change');
        if (motionGeneration !== directoryMotionGeneration) return;
        card.style.removeProperty('translate');
        card.style.removeProperty('scale');
        card.style.removeProperty('filter');
      });
    });

    ghosts.forEach((ghost, index) => {
      ghost.style.willChange = 'translate, scale, filter';
      const animation = ghost.animate([
        { translate:'0 0', scale:'1 1', filter:'opacity(1)' },
        { translate:'0 7px', scale:'.94 .94', filter:'opacity(0)' }
      ], {
        duration:250,
        delay:Math.min(index * 8, 32),
        easing:'cubic-bezier(.4,0,.2,1)',
        fill:'forwards'
      });
      trackDirectoryAnimation(animation, () => removeDirectoryGhost(ghost));
    });

    const longest = Math.max(430, 390 + Math.min(Math.max(show.length - 1, 0) * 18, 90));
    window.setTimeout(() => {
      if (generation !== filterGeneration || motionGeneration !== directoryMotionGeneration) return;
      section?.classList.remove('directory-is-filtering');
      show.forEach(card => card.style.removeProperty('will-change'));
    }, longest + 40);
  }

  function applyFilter(value, previousPositions) {
    clearTimeout(filterTimer);
    const generation = ++filterGeneration;
    const cards = getCards();
    cards.forEach(card => {
      if (!animatedDirectory) card.getAnimations().forEach(animation => animation.cancel());
      card.classList.remove('is-leaving');
    });

    const matches = card => {
      const styleOk = value === 'all' || card.dataset.style === value;
      return styleOk && matchesAdvanced(card);
    };

    const hide = cards.filter(card => !matches(card));
    const show = cards.filter(matches);

    if (animatedDirectory) {
      animateDirectory(show, generation, previousPositions);
      return;
    }

    hide.forEach(card => {
      if (!card.classList.contains('hidden')) card.classList.add('is-leaving');
    });
    filterTimer = setTimeout(() => {
      if (generation !== filterGeneration) return;
      hide.forEach(card => {
        card.classList.add('hidden');
        card.classList.remove('is-leaving');
      });
      if (resultLabel) resultLabel.textContent = `${show.length} hồ sơ phù hợp`;
      if (emptyState) emptyState.hidden = show.length > 0;
      if (rail && rail.scrollWidth > rail.clientWidth) rail.scrollTo({left:0,behavior:'auto'});
      show.forEach((card, index) => {
        const wasHidden = card.classList.contains('hidden');
        card.classList.remove('hidden', 'is-leaving');
        card.classList.add('visible');
        if (wasHidden && !reducedMotion) card.animate([
          {opacity:0, transform:'translateY(12px)'},
          {opacity:1, transform:'translateY(0)'}
        ], {duration:380,delay:index*24,easing:'cubic-bezier(.2,.75,.2,1)'});
      });
    }, reducedMotion ? 0 : 110);
  }

  // Collapse synchronous filter changes (notably the reset button) into a
  // single render pass on the directory page. Home-page behaviour is unchanged.
  let directoryApplyFrame = 0;
  let pendingPreviousPositions = null;
  const directoryDefaultOrder = animatedDirectory ? getCards().slice() : null;
  function requestFilterApply(previousPositions = null){
    const activeValue = () => $('.filter.active')?.dataset.filter || 'all';
    if (!animatedDirectory) {
      applyFilter(activeValue(), previousPositions);
      return;
    }
    if (previousPositions) pendingPreviousPositions = previousPositions;
    cancelAnimationFrame(directoryApplyFrame);
    directoryApplyFrame = requestAnimationFrame(() => {
      directoryApplyFrame = 0;
      const previous = pendingPreviousPositions;
      pendingPreviousPositions = null;
      applyFilter(activeValue(), previous);
    });
  }

  filters.forEach(button => button.addEventListener('click', () => {
    if (button.classList.contains('active')) return;
    filters.forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    requestFilterApply();
  }));

  queryInput?.addEventListener('input',()=>requestFilterApply());
  sortSelect?.addEventListener('change',event=>{
    const previousPositions = animatedDirectory ? captureCards() : null;
    const list = animatedDirectory && event.target.value === 'default' && directoryDefaultOrder
      ? [...directoryDefaultOrder]
      : [...getCards()];
    if(event.target.value==='name') list.sort((a,b)=>cardMeta(a).name.localeCompare(cardMeta(b).name,'vi'));
    else if(event.target.value==='price') list.sort((a,b)=>cardMeta(a).price-cardMeta(b).price);
    else if(event.target.value==='rating') list.sort((a,b)=>cardMeta(b).rating-cardMeta(a).rating);
    list.forEach(card=>rail?.append(card));
    requestFilterApply(previousPositions);
  });

  ['teamFilter','locationFilter','supportFilter','budgetFilter','ratingFilter'].forEach(name=>{
    $$(`input[name="${name}"]`).forEach(input=>input.addEventListener('change',()=>requestFilterApply()));
  });
  document.getElementById('directoryVerifiedOnly')?.addEventListener('change',()=>requestFilterApply());
  document.getElementById('directoryAvailableSoon')?.addEventListener('change',()=>requestFilterApply());
  document.addEventListener('cheese:directory-availability-updated',()=>requestFilterApply());
  applyFilter($('.filter.active')?.dataset.filter || 'all');
  /* --------------------------------------------------
     Favorites persisted in localStorage
  -------------------------------------------------- */
  const favoriteKey = 'cheese-graduation-favorites';
  let favorites = [];
  try {
    favorites = JSON.parse(localStorage.getItem(favoriteKey) || '[]');
  } catch (_) {
    favorites = [];
  }

  $$('.heart').forEach(button => {
    const card = button.closest('.photographer-card');
    const name = $('h3', card)?.textContent.trim() || 'Photographer';
    const liked = favorites.includes(name);
    button.classList.toggle('liked', liked);
    button.textContent = liked ? '♥' : '♡';
    button.setAttribute('aria-pressed', String(liked));

    button.addEventListener('click', event => {
      event.stopPropagation();
      const isLiked = button.classList.toggle('liked');
      button.textContent = isLiked ? '♥' : '♡';
      button.setAttribute('aria-pressed', String(isLiked));
      button.classList.remove('pop');
      void button.offsetWidth;
      button.classList.add('pop');

      favorites = isLiked
        ? [...new Set([...favorites, name])]
        : favorites.filter(item => item !== name);

      try {
        localStorage.setItem(favoriteKey, JSON.stringify(favorites));
      } catch (_) {}

      showToast(isLiked ? `Đã lưu <b>${name}</b> vào yêu thích ♥` : `Đã bỏ <b>${name}</b> khỏi yêu thích`);
    });
  });

  /* --------------------------------------------------
     Subtle desktop pointer lighting on cards
  -------------------------------------------------- */
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (finePointer && !reducedMotion) {
    getCards().forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', `${x}%`);
        card.style.setProperty('--my', `${y}%`);
      });
    });

    const heroVisual = $('.hero-visual');
    const heroPhoto = $('.main-photo');
    if (heroVisual && heroPhoto) {
      heroVisual.addEventListener('pointermove', event => {
        const rect = heroVisual.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        heroPhoto.style.transform = `rotateY(${nx * 2.2}deg) rotateX(${ny * -2.2}deg)`;
      });
      heroVisual.addEventListener('pointerleave', () => {
        heroPhoto.style.transform = '';
      });
    }
  }

  /* Booking modal is handled by cheese-booking.js */

  /* --------------------------------------------------
     Smooth anchor offset + close menu
  -------------------------------------------------- */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;
      const target = $(href);
      if (!target) return;
      event.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    });
  });
})();



/* ==================================================
   INLINE EXPERIENCE FX — interaction enhancements
   ================================================== */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Brief welcome; independent of slow images or external services.
  const loader = $('.fx-loader');
  let welcomeDone=false;
  const dismissLoader = () => {
    if (!loader || welcomeDone) return;
    welcomeDone=true;
    const moveFocus=loader.contains(document.activeElement);
    loader.classList.add('is-done');
    loader.setAttribute('aria-hidden','true');
    if(moveFocus)document.querySelector('header a, .brand')?.focus({preventScroll:true});
    window.setTimeout(() => loader.remove(), reduced ? 0 : 760);
  };
  loader?.querySelector('.welcome-skip')?.addEventListener('click',dismissLoader);
  loader?.addEventListener('pointerdown', event => {
    if (event.target.closest('.welcome-skip')) return;
    dismissLoader();
  }, { passive:true });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')dismissLoader();});
  document.addEventListener('pointerdown',()=>dismissLoader(),{once:true,capture:true,passive:true});
  window.setTimeout(dismissLoader,reduced ? 300 : 1200);

  // Desktop pointer aura.
  if (fine && !reduced) {
    const aura = document.createElement('div');
    aura.className = 'fx-pointer-aura';
    aura.setAttribute('aria-hidden', 'true');
    document.body.append(aura);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0;
    const render = () => {
      x += (tx - x) * .16;
      y += (ty - y) * .16;
      aura.style.left = `${x}px`;
      aura.style.top = `${y}px`;
      raf = requestAnimationFrame(render);
    };
    document.addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY; aura.classList.add('show');
      if (!raf) raf = requestAnimationFrame(render);
    }, { passive: true });
    document.addEventListener('pointerleave', () => aura.classList.remove('show'));
  }

  // Magnetic movement kept intentionally subtle.
  if (fine && !reduced) {
    $$('.btn, .nav-cta, .book-btn').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * .09;
        const dy = (e.clientY - (r.top + r.height / 2)) * .12;
        el.style.translate = `${dx}px ${dy}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  // Click ripple for primary interactive controls.
  $$('.btn, .nav-cta, .book-btn, .filter').forEach(el => {
    el.addEventListener('click', e => {
      const r = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'fx-ripple';
      ripple.style.left = `${e.clientX - r.left}px`;
      ripple.style.top = `${e.clientY - r.top}px`;
      el.append(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  });
  // Real Work smooth carousel: native swipe + reliable buttons + center focus.
  function initRealWorkCarousel(){
    const grid=$('#realWorkGrid');
    if(!grid)return;

    if(grid._cheeseCarouselAbort)grid._cheeseCarouselAbort.abort();
    if(grid._cheeseAutoTimer)window.clearTimeout(grid._cheeseAutoTimer);
    if(grid._cheeseResumeTimer)window.clearTimeout(grid._cheeseResumeTimer);
    if(grid._cheeseScrollIdle)window.clearTimeout(grid._cheeseScrollIdle);

    const controller=new AbortController();
    grid._cheeseCarouselAbort=controller;
    const signal=controller.signal;

    // Any old clones from previous versions are removed permanently.
    $$('.real-card.real-clone',grid).forEach(card=>card.remove());

    const cards=$$('.real-card',grid);
    if(!cards.length)return;

    cards.forEach((card,index)=>{
      card.dataset.realLogical=String(index);
      const image=card.querySelector('img');
      if(image){
        image.draggable=false;
        image.setAttribute('draggable','false');
      }
      card.classList.remove('real-clone','is-near');
      card.style.removeProperty('--rw-scale');
      card.style.removeProperty('--rw-opacity');
      card.style.removeProperty('--rw-blur');
      card.style.removeProperty('--rw-saturate');
      card.style.removeProperty('--rw-brightness');
      card.style.removeProperty('--rw-focus');
      card.style.removeProperty('--rw-caption');
    });

    const count=cards.length;
    const mobileCounter=$('#realWorkCounter');
    const desktopCounter=$('#realWorkCounterDesktop');
    const prev=$('#realWorkPrev');
    const next=$('#realWorkNext');
    const section=$('#gallery');
    const dots=()=>$$('#realWorkDots [data-real-dot]');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let current=0;
    let visible=true;
    let scrolling=false;
    let mouseDragging=false;
    let mouseStartX=0;
    let mouseStartScroll=0;
    let touchStartX=0;
    let touchStartY=0;
    let touchStartIndex=0;
    let touchActive=false;
    let raf=0;

    const AUTOPLAY_MS=2000;
    const RESUME_MS=3000;

    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    const targetLeft=card=>card.offsetLeft + card.offsetWidth/2 - grid.clientWidth/2;

    function nearestIndex(){
      const box=grid.getBoundingClientRect();
      const center=box.left+box.width/2;
      let best=Infinity,index=0;
      cards.forEach((card,i)=>{
        const r=card.getBoundingClientRect();
        const d=Math.abs((r.left+r.width/2)-center);
        if(d<best){best=d;index=i}
      });
      return index;
    }

    function updateFocus(){
      const box=grid.getBoundingClientRect();
      const center=box.left+box.width/2;
      let nearest=0,best=Infinity;

      cards.forEach((card,i)=>{
        const r=card.getBoundingClientRect();
        const distance=Math.abs((r.left+r.width/2)-center);
        const range=Math.max(1,r.width*1.02);
        const focus=clamp(1-distance/range,0,1);
        const scale=.78 + focus*.22;
        const opacity=.24 + focus*.76;
        const blur=(1-focus)*2.15;
        const saturate=.64 + focus*.36;
        const brightness=.80 + focus*.20;
        card.style.setProperty('--rw-scale',scale.toFixed(3));
        card.style.setProperty('--rw-opacity',opacity.toFixed(3));
        card.style.setProperty('--rw-blur',`${blur.toFixed(2)}px`);
        card.style.setProperty('--rw-saturate',saturate.toFixed(3));
        card.style.setProperty('--rw-brightness',brightness.toFixed(3));
        card.style.setProperty('--rw-focus',focus.toFixed(3));
        card.style.setProperty('--rw-caption',focus>.82?'1':'0');
        if(distance<best){best=distance;nearest=i}
      });

      current=nearest;
      cards.forEach((card,i)=>card.classList.toggle('is-active',i===current));
      const label=`${String(current+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;
      if(mobileCounter)mobileCounter.textContent=label;
      if(desktopCounter)desktopCounter.textContent=label;
      dots().forEach((dot,i)=>dot.classList.toggle('active',i===current));
    }

    function requestFocusUpdate(){
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(updateFocus);
    }

    function goTo(index,{smooth=true,user=false}={}){
      const normalized=((index%count)+count)%count;
      current=normalized;
      const card=cards[normalized];
      if(!card)return;
      if(user)pauseAutoplay();
      grid.scrollTo({
        left:targetLeft(card),
        behavior:(!smooth||reduced)?'auto':'smooth'
      });
      requestFocusUpdate();
    }

    function stopAutoplay(){
      if(grid._cheeseAutoTimer)window.clearTimeout(grid._cheeseAutoTimer);
      grid._cheeseAutoTimer=0;
    }

    function startAutoplay(){
      stopAutoplay();
      if(reduced||document.hidden||!visible||mouseDragging||count<2)return;
      grid._cheeseAutoTimer=window.setTimeout(()=>{
        goTo(current+1,{smooth:true,user:false});
        startAutoplay();
      },AUTOPLAY_MS);
    }

    function pauseAutoplay(){
      stopAutoplay();
      if(grid._cheeseResumeTimer)window.clearTimeout(grid._cheeseResumeTimer);
      grid._cheeseResumeTimer=window.setTimeout(startAutoplay,RESUME_MS);
    }

    function settleToNearest(){
      current=nearestIndex();
      goTo(current,{smooth:true,user:false});
    }

    grid.addEventListener('scroll',()=>{
      grid.classList.add('is-scrolling');
      requestFocusUpdate();
      if(grid._cheeseScrollIdle)window.clearTimeout(grid._cheeseScrollIdle);
      grid._cheeseScrollIdle=window.setTimeout(()=>{
        grid.classList.remove('is-scrolling');
        current=nearestIndex();
        updateFocus();
      },110);
    },{passive:true,signal});

    // Direct swipe on the image: native movement stays smooth, then we snap exactly one card.
    grid.addEventListener('touchstart',e=>{
      const t=e.touches?.[0];
      if(!t)return;
      touchActive=true;
      touchStartX=t.clientX;
      touchStartY=t.clientY;
      touchStartIndex=nearestIndex();
      pauseAutoplay();
    },{passive:true,signal});

    grid.addEventListener('touchend',e=>{
      if(!touchActive)return;
      touchActive=false;
      const t=e.changedTouches?.[0];
      const dx=t ? t.clientX-touchStartX : 0;
      const dy=t ? t.clientY-touchStartY : 0;
      const horizontal=Math.abs(dx)>Math.abs(dy)*1.15;
      const swipe=Math.abs(dx)>=38;

      if(grid._cheeseScrollIdle)window.clearTimeout(grid._cheeseScrollIdle);
      grid._cheeseScrollIdle=window.setTimeout(()=>{
        if(horizontal&&swipe){
          // Finger moves left => next image; right => previous image.
          goTo(touchStartIndex+(dx<0?1:-1),{smooth:true,user:false});
        }else{
          current=nearestIndex();
          goTo(current,{smooth:true,user:false});
        }
        updateFocus();
        pauseAutoplay();
      },70);
    },{passive:true,signal});

    grid.addEventListener('touchcancel',()=>{
      touchActive=false;
      current=nearestIndex();
      goTo(current,{smooth:true,user:false});
      pauseAutoplay();
    },{passive:true,signal});

    // Mouse drag only. This does not interfere with touch scrolling.
    grid.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse'||e.button!==0)return;
      mouseDragging=true;
      mouseStartX=e.clientX;
      mouseStartScroll=grid.scrollLeft;
      grid.classList.add('is-mouse-dragging');
      pauseAutoplay();
      try{grid.setPointerCapture(e.pointerId)}catch(_){}
    },{signal});

    grid.addEventListener('pointermove',e=>{
      if(!mouseDragging||e.pointerType!=='mouse')return;
      grid.scrollLeft=mouseStartScroll-(e.clientX-mouseStartX)*1.12;
      requestFocusUpdate();
    },{signal});

    const endMouseDrag=e=>{
      if(!mouseDragging)return;
      mouseDragging=false;
      grid.classList.remove('is-mouse-dragging');
      try{grid.releasePointerCapture(e.pointerId)}catch(_){}
      current=nearestIndex();
      goTo(current,{smooth:true,user:false});
      pauseAutoplay();
    };
    grid.addEventListener('pointerup',endMouseDrag,{signal});
    grid.addEventListener('pointercancel',endMouseDrag,{signal});

    prev?.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      goTo(current-1,{smooth:true,user:true});
    },{signal});
    next?.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      goTo(current+1,{smooth:true,user:true});
    },{signal});

    dots().forEach((dot,i)=>dot.addEventListener('click',e=>{
      e.preventDefault();
      goTo(i,{smooth:true,user:true});
    },{signal}));

    grid.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'){e.preventDefault();goTo(current-1,{smooth:true,user:true})}
      if(e.key==='ArrowRight'){e.preventDefault();goTo(current+1,{smooth:true,user:true})}
    },{signal});

    if('IntersectionObserver' in window&&section){
      const observer=new IntersectionObserver(entries=>{
        visible=!!entries[0]?.isIntersecting;
        if(visible)startAutoplay();else stopAutoplay();
      },{threshold:.12});
      observer.observe(section);
      signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
    }

    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)stopAutoplay();else startAutoplay();
    },{signal});

    window.addEventListener('resize',()=>{
      window.clearTimeout(grid._cheeseResizeTimer);
      grid._cheeseResizeTimer=window.setTimeout(()=>{
        goTo(current,{smooth:false,user:false});
        updateFocus();
      },90);
    },{passive:true,signal});

    // Center the first card after layout/images have had a chance to settle.
    const start=()=>{
      goTo(0,{smooth:false,user:false});
      updateFocus();
      startAutoplay();
    };
    requestAnimationFrame(()=>requestAnimationFrame(start));
  }
  initRealWorkCarousel();
  document.addEventListener('cheese:real-work-rendered',()=>requestAnimationFrame(initRealWorkCarousel));

  // Gallery lightbox.
  const figures = $$('.masonry figure');
  if (figures.length) {
    const box = document.createElement('div');
    box.className = 'fx-lightbox';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = `
      <button class="fx-lightbox-close" type="button" aria-label="Đóng ảnh">×</button>
      <div class="fx-lightbox-stage"><img alt=""></div>
      <div class="fx-lightbox-meta"><span class="fx-lightbox-caption"></span><span>ESC · đóng</span></div>`;
    document.body.append(box);
    const boxImg = $('img', box);
    const caption = $('.fx-lightbox-caption', box);
    const close = () => {
      box.classList.remove('open');
      box.setAttribute('aria-hidden', 'true');
      document.body.style.removeProperty('overflow');
    };
    const open = figure => {
      const source = $('img', figure);
      if (!source) return;
      boxImg.src = source.currentSrc || source.src;
      boxImg.alt = source.alt || '';
      caption.textContent = $('figcaption', figure)?.textContent || source.alt || 'Cheese.graduation';
      box.classList.add('open');
      box.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      $('.fx-lightbox-close', box).focus();
    };
    figures.forEach(figure => figure.addEventListener('click', () => open(figure)));
    $('.fx-lightbox-close', box).addEventListener('click', close);
    box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('fx-lightbox-stage')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')) close(); });
  }

  // Mark visible sections for a one-time ambient glow.
  if (!reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('fx-section-live');
        observer.unobserve(entry.target);
      });
    }, { threshold: .26 });
    $$('main > section').forEach(section => observer.observe(section));
  }
})();
