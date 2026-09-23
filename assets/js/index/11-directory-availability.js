(() => {
  'use strict';

  const isDirectory = document.documentElement.classList.contains('directory-mode') ||
    new URLSearchParams(location.search).get('trang') === 'tho';
  if (!isDirectory) return;

  const start = () => {
  const section = document.getElementById('photographers');
  if (!section) return;

  const cfg = window.CHEESE_CONFIG || {};
  const usable = /^https:\/\/.+\.supabase\.co$/i.test(String(cfg.supabaseUrl || '').trim()) &&
    !String(cfg.supabaseAnonKey || '').includes('PASTE_') &&
    String(cfg.supabaseAnonKey || '').length > 20 &&
    !!window.supabase;
  const db = usable ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const pad = n => String(n).padStart(2, '0');
  const localToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const dateVN = value => {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
  };
  const safeParam = value => encodeURIComponent(String(value || ''));
  const cardSlug = card => {
    const link = card.querySelector('.profile-link');
    if (!link) return '';
    try { return new URL(link.href, location.href).searchParams.get('tho') || ''; }
    catch (_) { return ''; }
  };
  const cards = () => [...section.querySelectorAll('.photographer-card:not(.directory-card-ghost)')];

  const panel = document.createElement('section');
  panel.className = 'directory-availability-panel';
  panel.setAttribute('aria-label', 'Chọn ngày và thời gian chụp');
  panel.innerHTML = `
    <div class="directory-availability-copy">
      <span class="directory-availability-kicker"><i aria-hidden="true"></i> Lịch trống từ Admin</span>
      <strong>Chọn ngày bạn muốn chụp</strong>
      <small>Chỉ hiện photographer còn trống đúng khung thời gian đã chọn.</small>
    </div>
    <div class="directory-availability-controls">
      <label class="directory-date-field">
        <span>Ngày chụp</span>
        <input id="directoryShootDate" type="date" aria-label="Ngày chụp">
      </label>
      <fieldset class="directory-session-field">
        <legend>Thời gian chụp</legend>
        <div class="directory-session-toggle">
          <label><input type="radio" name="directoryTimeSlot" value="Sáng" checked><span><b>☀</b> Sáng</span></label>
          <label><input type="radio" name="directoryTimeSlot" value="Chiều"><span><b>◐</b> Chiều</span></label>
          <label><input type="radio" name="directoryTimeSlot" value="Cả ngày"><span><b>◉</b> Cả ngày</span></label>
        </div>
      </fieldset>
      <button class="directory-schedule-clear" id="directoryScheduleClear" type="button" hidden>Xóa lịch</button>
    </div>
    <div class="directory-availability-status" id="directoryAvailabilityStatus" role="status" aria-live="polite">
      <span class="directory-status-dot" aria-hidden="true"></span>
      <span>Chọn ngày để xem thợ còn lịch.</span>
    </div>`;

  const main = section.querySelector('.directory-main');
  const selectionNote = main?.querySelector('.directory-selection-note');
  const resultsBar = main?.querySelector('.directory-results-bar');
  if (!main) return;
  if (selectionNote) selectionNote.insertAdjacentElement('afterend', panel);
  else if (resultsBar) main.insertBefore(panel, resultsBar);
  else main.prepend(panel);

  const dateInput = panel.querySelector('#directoryShootDate');
  const clearButton = panel.querySelector('#directoryScheduleClear');
  const status = panel.querySelector('#directoryAvailabilityStatus');
  const slotInputs = [...panel.querySelectorAll('input[name="directoryTimeSlot"]')];
  dateInput.min = localToday();

  const initialParams = new URLSearchParams(location.search);
  const initialDate = initialParams.get('ngay');
  const initialSlot = initialParams.get('gio');
  if (initialDate && initialDate >= dateInput.min) dateInput.value = initialDate;
  if (initialSlot === 'Sáng' || initialSlot === 'Chiều' || initialSlot === 'Cả ngày') {
    slotInputs.forEach(input => { input.checked = input.value === initialSlot; });
  }

  let lookupGeneration = 0;
  const getSlot = () => panel.querySelector('input[name="directoryTimeSlot"]:checked')?.value || 'Sáng';
  const setStatus = (mode, text) => {
    section.dataset.availabilityStatus = mode;
    status.dataset.state = mode;
    status.querySelector('span:last-child').textContent = text;
  };

  const setCardChip = (card, state, slot) => {
    let chip = card.querySelector('.directory-card-availability');
    if (!chip) {
      chip = document.createElement('div');
      chip.className = 'directory-card-availability';
      const body = card.querySelector('.card-body');
      if (body) body.insertBefore(chip, body.firstChild);
    }
    if (state === 'true') {
      chip.innerHTML = `<i aria-hidden="true"></i>Còn lịch ${slot.toLowerCase()}`;
      chip.hidden = false;
    } else {
      chip.hidden = true;
      chip.textContent = '';
    }
  };

  const clearCardAvailability = () => {
    cards().forEach(card => {
      delete card.dataset.scheduleDate;
      delete card.dataset.scheduleSlot;
      delete card.dataset.scheduleAvailable;
      setCardChip(card, '', '');
    });
  };

  const syncBookingLinks = (date, slot, reliable) => {
    cards().forEach(card => {
      const slug = cardSlug(card);
      const link = card.querySelector('.booking-page-link');
      if (!link || !slug) return;
      const params = new URLSearchParams({ tho: slug });
      if (date && slot && reliable && card.dataset.scheduleAvailable === 'true') {
        params.set('ngay', date);
        params.set('gio', slot);
      }
      link.href = `lien-he.html?${params.toString()}`;
    });
  };

  const syncPageUrl = (date, slot) => {
    const url = new URL(location.href);
    if (date) {
      url.searchParams.set('ngay', date);
      url.searchParams.set('gio', slot);
    } else {
      url.searchParams.delete('ngay');
      url.searchParams.delete('gio');
    }
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const notifyFilter = () => {
    document.dispatchEvent(new CustomEvent('cheese:directory-availability-updated'));
  };

  async function waitForPhotographers() {
    // photographer-public.js is loaded before this file, but its DB request may
    // still be resolving. Waiting keeps names/cards aligned with Admin data.
    try {
      if (window.CHEESE_PHOTOGRAPHERS_READY) await window.CHEESE_PHOTOGRAPHERS_READY;
    } catch (_) {}
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function refreshAvailability() {
    const generation = ++lookupGeneration;
    const date = dateInput.value;
    const slot = getSlot();
    clearButton.hidden = !date;
    syncPageUrl(date, slot);

    if (!date) {
      clearCardAvailability();
      setStatus('idle', 'Chọn ngày để xem thợ còn lịch.');
      syncBookingLinks('', '', false);
      notifyFilter();
      return;
    }

    if (date < dateInput.min) {
      dateInput.value = '';
      clearCardAvailability();
      setStatus('error', 'Ngày chụp phải từ hôm nay trở đi.');
      syncPageUrl('', slot);
      notifyFilter();
      return;
    }

    await waitForPhotographers();
    if (generation !== lookupGeneration) return;

    const currentCards = cards().filter(card => getComputedStyle(card).display !== 'none');
    currentCards.forEach(card => {
      card.dataset.scheduleDate = date;
      card.dataset.scheduleSlot = slot;
      card.dataset.scheduleAvailable = 'loading';
      setCardChip(card, '', slot);
    });
    setStatus('loading', `Đang kiểm tra lịch ${slot.toLowerCase()} ngày ${dateVN(date)}…`);

    if (!db) {
      currentCards.forEach(card => { card.dataset.scheduleAvailable = 'unknown'; });
      setStatus('error', 'Chưa kết nối Supabase nên chưa thể đọc lịch thật từ Admin.');
      syncBookingLinks(date, slot, false);
      notifyFilter();
      return;
    }

    const results = await Promise.all(currentCards.map(async card => {
      const photographer = card.querySelector('h3')?.textContent?.trim() || '';
      if (!photographer) return { card, ok: false, available: false };
      try {
        const { data, error } = await db.rpc('get_available_slots', {
          p_photographer: photographer,
          p_shoot_date: date
        });
        if (error) throw error;
        const row = (data || []).find(item => item.time_slot === slot);
        return { card, ok: true, available: row ? !!row.available : false };
      } catch (error) {
        console.warn(`Availability ${photographer}:`, error?.message || error);
        return { card, ok: false, available: false };
      }
    }));

    if (generation !== lookupGeneration) return;

    let success = 0;
    let available = 0;
    results.forEach(result => {
      const { card, ok, available: isAvailable } = result;
      card.dataset.scheduleDate = date;
      card.dataset.scheduleSlot = slot;
      if (ok) {
        success += 1;
        if (isAvailable) available += 1;
        card.dataset.scheduleAvailable = isAvailable ? 'true' : 'false';
        setCardChip(card, isAvailable ? 'true' : 'false', slot);
      } else {
        card.dataset.scheduleAvailable = 'unknown';
        setCardChip(card, '', slot);
      }
    });

    if (!success) {
      setStatus('error', 'Không đọc được lịch từ Admin. Danh sách thợ chưa bị ẩn để tránh báo sai.');
      syncBookingLinks(date, slot, false);
      notifyFilter();
      return;
    }

    const failed = results.length - success;
    section.dataset.availabilityStatus = failed ? 'partial' : 'ready';
    status.dataset.state = failed ? 'partial' : 'ready';
    status.querySelector('span:last-child').textContent = failed
      ? `${available} thợ xác nhận còn lịch ${slot.toLowerCase()} ${dateVN(date)} · ${failed} hồ sơ chưa kiểm tra được.`
      : available
        ? `${available} thợ còn lịch ${slot.toLowerCase()} ngày ${dateVN(date)}.`
        : `Chưa có thợ trống ${slot.toLowerCase()} ngày ${dateVN(date)}.`;

    syncBookingLinks(date, slot, true);
    notifyFilter();
  }

  dateInput.addEventListener('change', refreshAvailability);
  slotInputs.forEach(input => input.addEventListener('change', () => {
    if (input.checked) refreshAvailability();
  }));
  clearButton.addEventListener('click', () => {
    dateInput.value = '';
    slotInputs.forEach(input => { input.checked = input.value === 'Sáng'; });
    refreshAvailability();
    dateInput.focus();
  });

  // The main reset button emits this after clearing its other controls.
  document.addEventListener('cheese:directory-reset-schedule', () => {
    dateInput.value = '';
    slotInputs.forEach(input => { input.checked = input.value === 'Sáng'; });
    refreshAvailability();
  });

  if (dateInput.value) refreshAvailability();
  else {
    section.dataset.availabilityStatus = 'idle';
    syncBookingLinks('', '', false);
  }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
