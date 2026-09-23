(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const modal = $('#bookingModal');
  const form = $('#bookingForm');
  if (!modal || !form) return;

  const statusBadge = $('#bookingDbStatus');
  const photographerName = $('#photographerName');
  const photographerSelect = $('#bkPhotographer');
  const dateInput = $('#bkDate');
  const timeSelect = $('#bkTimeSlot');
  const phoneInput = $('#bkPhone');
  const availabilityBox = $('#availabilityBox');
  const availabilityTitle = $('#availabilityTitle');
  const availabilityText = $('#availabilityText');
  const refreshAvailability = $('#refreshAvailability');
  const submitButton = $('#bookingSubmit');
  const successCard = $('#bookingSuccess');
  const bookingCode = $('#bookingCode');

  const cfg = window.CHEESE_CONFIG || {};
  const configured =
    /^https:\/\/.+\.supabase\.co$/i.test(String(cfg.supabaseUrl || '').trim()) &&
    !String(cfg.supabaseAnonKey || '').includes('PASTE_') &&
    String(cfg.supabaseAnonKey || '').length > 20 &&
    window.supabase;

  const client = configured
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');
  dateInput.min = minDate;

  if (configured) {
    statusBadge.className = 'db-status connected';
    statusBadge.innerHTML = '<i></i><span>Hệ thống đặt lịch đang hoạt động</span>';
  } else {
    statusBadge.className = 'db-status demo';
    statusBadge.innerHTML = '<i></i><span>Chế độ demo · chưa nối Supabase</span>';
  }

  let lastFocused = null;
  let slotState = null;

  const openModal = (name = '') => {
    lastFocused = document.activeElement;
    form.hidden = false;
    successCard.hidden = true;
    form.reset();
    timeSelect.querySelectorAll('option').forEach(o => o.disabled = false);
    dateInput.min = minDate;
    slotState = null;
    availabilityBox.hidden = true;

    if (name && [...photographerSelect.options].some(o => o.value === name)) {
      photographerSelect.value = name;
      photographerName.textContent = name;
    } else {
      photographerName.textContent = 'photographer';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => $('#bkCustomerName')?.focus(), 120);
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lastFocused?.focus?.();
  };

  $$('.booking-trigger').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.photographer || ''));
  });
  $$('[data-booking-close]').forEach(el => el.addEventListener('click', closeModal));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  photographerSelect.addEventListener('change', () => {
    photographerName.textContent = photographerSelect.value || 'photographer';
    if (dateInput.value) checkAvailability();
  });
  dateInput.addEventListener('change', checkAvailability);
  refreshAvailability.addEventListener('click', checkAvailability);

  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/[^0-9+\s.-]/g, '').slice(0, 18);
  });

  function setAvailabilityUI(result) {
    availabilityBox.hidden = false;
    timeSelect.querySelectorAll('option').forEach(o => {
      if (!o.value) return;
      o.disabled = false;
    });

    if (!result) {
      availabilityTitle.textContent = 'Chưa kiểm tra được lịch';
      availabilityText.textContent = 'Bạn vẫn có thể gửi yêu cầu; ekip sẽ xác nhận lại.';
      return;
    }

    slotState = result;
    const morning = result['Sáng'] !== false;
    const afternoon = result['Chiều'] !== false;
    const fullDay = result['Cả ngày'] !== false;

    const opt = value => [...timeSelect.options].find(o => o.value === value);
    if (opt('Sáng')) opt('Sáng').disabled = !morning;
    if (opt('Chiều')) opt('Chiều').disabled = !afternoon;
    if (opt('Cả ngày')) opt('Cả ngày').disabled = !fullDay;

    if (timeSelect.selectedOptions[0]?.disabled) timeSelect.value = '';

    const free = [
      morning ? 'Sáng' : null,
      afternoon ? 'Chiều' : null,
      fullDay ? 'Cả ngày' : null
    ].filter(Boolean);

    if (!morning && !afternoon) {
      availabilityTitle.textContent = 'Photographer đã kín ngày này';
      availabilityText.textContent = 'Hãy chọn ngày khác hoặc photographer khác.';
    } else {
      availabilityTitle.textContent = 'Lịch còn trống';
      availabilityText.textContent = `Có thể nhận: ${free.join(' · ')}`;
    }
  }

  async function checkAvailability() {
    const photographer = photographerSelect.value;
    const shootDate = dateInput.value;
    if (!photographer || !shootDate) {
      availabilityBox.hidden = true;
      return;
    }

    availabilityBox.hidden = false;
    availabilityTitle.textContent = 'Đang kiểm tra lịch...';
    availabilityText.textContent = `${photographer} · ${shootDate}`;

    if (!client) {
      setAvailabilityUI({'Sáng': true, 'Chiều': true, 'Cả ngày': true});
      availabilityText.textContent += ' · demo';
      return;
    }

    try {
      const { data, error } = await client.rpc('get_available_slots', {
        p_photographer: photographer,
        p_shoot_date: shootDate
      });
      if (error) throw error;
      const state = {'Sáng': true, 'Chiều': true, 'Cả ngày': true};
      (data || []).forEach(row => state[row.time_slot] = !!row.available);
      setAvailabilityUI(state);
    } catch (err) {
      console.error(err);
      setAvailabilityUI(null);
    }
  }

  function localBookingCode() {
    const d = new Date();
    const date = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const tail = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `CG-${date}-${tail}`;
  }

  function collectPayload() {
    const data = new FormData(form);
    return {
      customer_name: String(data.get('customer_name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      customer_email: String(data.get('customer_email') || '').trim() || null,
      contact_link: String(data.get('contact_link') || '').trim() || null,
      school: String(data.get('school') || '').trim() || null,
      class_name: String(data.get('class_name') || '').trim() || null,
      group_size: String(data.get('group_size') || ''),
      photographer: String(data.get('photographer') || ''),
      package_name: String(data.get('package_name') || ''),
      shoot_date: String(data.get('shoot_date') || ''),
      time_slot: String(data.get('time_slot') || ''),
      note: String(data.get('note') || '').trim() || null
    };
  }

  function saveLocalDemo(payload, code) {
    const key = 'cheese_demo_bookings_v1';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.unshift({
      id: crypto.randomUUID?.() || `${Date.now()}`,
      booking_code: code,
      created_at: new Date().toISOString(),
      status: 'new',
      deposit_amount: 0,
      deposit_status: 'unpaid',
      internal_note: '',
      ...payload
    });
    localStorage.setItem(key, JSON.stringify(current.slice(0, 200)));
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const payload = collectPayload();

    if (slotState && slotState[payload.time_slot] === false) {
      timeSelect.setCustomValidity('Khung giờ này đã kín.');
      timeSelect.reportValidity();
      timeSelect.setCustomValidity('');
      return;
    }

    submitButton.disabled = true;
    const original = submitButton.innerHTML;
    submitButton.innerHTML = 'Đang gửi yêu cầu <span>···</span>';

    try {
      let code;

      if (client) {
        const { data, error } = await client.rpc('submit_booking', {
          p_customer_name: payload.customer_name,
          p_phone: payload.phone,
          p_customer_email: payload.customer_email,
          p_contact_link: payload.contact_link,
          p_school: payload.school,
          p_class_name: payload.class_name,
          p_group_size: payload.group_size,
          p_photographer: payload.photographer,
          p_package_name: payload.package_name,
          p_shoot_date: payload.shoot_date,
          p_time_slot: payload.time_slot,
          p_note: payload.note
        });
        if (error) throw error;
        code = data?.[0]?.booking_code || data?.booking_code;
        if (!code) throw new Error('Không nhận được mã booking.');
      } else {
        code = localBookingCode();
        saveLocalDemo(payload, code);
      }

      form.hidden = true;
      bookingCode.textContent = code;
      successCard.hidden = false;

      window.dispatchEvent(new CustomEvent('cheese:booking-submitted', {
        detail: { booking_code: code, ...payload }
      }));
    } catch (err) {
      console.error(err);
      const msg = /SLOT_UNAVAILABLE/i.test(err.message || '')
        ? 'Khung giờ này vừa được người khác giữ. Vui lòng chọn giờ hoặc ngày khác.'
        : `Không gửi được yêu cầu: ${err.message || 'Vui lòng thử lại.'}`;
      alert(msg);
      if (/SLOT_UNAVAILABLE/i.test(err.message || '')) checkAvailability();
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = original;
    }
  });

  // Public helper for future CTA buttons.
  window.CheeseBooking = { open: openModal, close: closeModal };
})();
