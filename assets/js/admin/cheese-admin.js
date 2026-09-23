(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const cfg=window.CHEESE_CONFIG||{};
const configured=/^https:\/\/.+\.supabase\.co$/i.test(String(cfg.supabaseUrl||'').trim())&&!String(cfg.supabaseAnonKey||'').includes('PASTE_')&&String(cfg.supabaseAnonKey||'').length>20&&window.supabase;
const db=window.CheeseAuth.client;
const DEFAULT_PHOTOGRAPHERS=[
 {id:'p1',slug:'quang-anh',name:'Quang Anh',team:'Founder',active:true,price_amount:2300000,price_label:null,style:'Trong trẻo · Outdoor',bio:'',tags:['Trong trẻo','Outdoor'],cover_url:'assets/photographers/quang-anh.jpg',gallery_urls:[],sort_order:10,rating:null,shoots_count:0},
 {id:'p2',slug:'chi',name:'Chi',team:'Ekip 1',active:true,price_amount:2800000,price_label:null,style:'Editorial · Đèn',bio:'',tags:['Editorial','Đèn'],cover_url:'assets/photographers/chi.jpg',gallery_urls:[],sort_order:20,rating:null,shoots_count:0},
 {id:'p3',slug:'minh',name:'Minh',team:'Ekip 1',active:true,price_amount:2500000,price_label:null,style:'Film · Vintage',bio:'',tags:['Film','Vintage'],cover_url:'assets/photographers/minh.jpg',gallery_urls:[],sort_order:30,rating:null,shoots_count:0},
 {id:'p4',slug:'ngoc-hoang',name:'Ngọc Hoàng',team:'Ekip 2',active:true,price_amount:3100000,price_label:null,style:'Cinematic · Flash',bio:'',tags:['Cinematic','Flash'],cover_url:'assets/photographers/ngoc-hoang.jpg',gallery_urls:[],sort_order:40,rating:null,shoots_count:0},
 {id:'p5',slug:'minh-anh',name:'Minh Anh',team:'Ekip 2',active:true,price_amount:0,price_label:'Liên hệ',style:'Chân dung',bio:'',tags:['Chân dung'],cover_url:'assets/photographers/minh-anh.jpg',gallery_urls:[],sort_order:50,rating:null,shoots_count:0},
 {id:'p6',slug:'quang-vinh',name:'Quang Vinh',team:'Ekip 3',active:true,price_amount:0,price_label:'Liên hệ',style:'Ảnh nhóm',bio:'',tags:['Ảnh nhóm'],cover_url:'assets/photographers/quang-vinh.jpg',gallery_urls:[],sort_order:60,rating:null,shoots_count:0}
];
const DEFAULT_SERVICES=[
 {name:'Bong bóng / khói màu',value:'Cần xác nhận'},
 {name:'Đèn flash & đèn liên tục',value:'Cần xác nhận'},
 {name:'Trang phục & phụ kiện',value:'Cần xác nhận'},
 {name:'Trợ lý đi cùng',value:'Cần xác nhận'},
 {name:'Bàn giao file ảnh gốc',value:'Cần xác nhận'}
];
DEFAULT_PHOTOGRAPHERS.forEach(p=>{
 p.photographer_type=p.photographer_type||(String(p.team||'').toLowerCase()==='founder'?'founder':'regular');
 p.location_text='Hà Nội';
 p.drive_url='https://drive.google.com/drive/folders/1G-XZlKOZDOYzBti6ezr2jWXFBdeBcpMk?usp=sharing';
 const b=Number(p.price_amount||0);
 p.yearbook_prices={'1':b,'2':b?b+300000:0,'3':b?b+600000:0,'4':b?b+900000:0,'5':b?b+1200000:0};
 p.graduation_prices={ceremony:1700000,pregrad:2000000,'pregrad-plus':2500000};
 p.graduation_extra_per_person=300000;
 p.services=DEFAULT_SERVICES.map(x=>({...x}));
});
let demoMode=false, photographers=[], bookings=[], blocks=[], manualEvents=[], takecareStaff=[], takecareShifts=[], financeRecords=[], activeBooking=null, activeFinanceBooking=null, currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1), selectedDay=null;
const DEFAULT_PRICING=JSON.parse(JSON.stringify(window.CHEESE_BOOKING_PRICES||{}));
let pricingSettings=JSON.parse(JSON.stringify(DEFAULT_PRICING));
let realtimeChannel=null, unreadNotifications=[], notificationsStarted=false;

const STATUS={new:'Mới',contacted:'Đã liên hệ',deposit_pending:'Chờ cọc',confirmed:'Đã chốt',completed:'Hoàn thành',cancelled:'Hủy',rejected:'Từ chối'};
const DEPOSIT={unpaid:'Chưa cọc',partial:'Cọc một phần',paid:'Đã cọc đủ',refunded:'Hoàn cọc'};
const TAKECARE_RATE_DEFAULT={full_day:400000,half_morning:250000,half_afternoon:250000};
const TAKECARE_SHIFT_LABEL={full_day:'Cả ngày',half_morning:'Nửa ngày sáng',half_afternoon:'Nửa ngày chiều'};
const money=n=>new Intl.NumberFormat('vi-VN').format(Number(n||0))+'đ';
const moneyDigits=v=>String(v??'').replace(/[^\d]/g,'');
const moneyInputNumber=(el,fallback=0)=>{const d=moneyDigits(el?.value);return d?Number(d):Number(fallback||0)};
const moneyInputText=v=>{const d=moneyDigits(v);return d?new Intl.NumberFormat('vi-VN').format(Number(d)):''};
function setMoneyInput(el,v){if(el)el.value=moneyInputText(v)}
function bindMoneyInputs(root=document){
  $$('[data-money-input]',root).forEach(el=>{
    if(el.dataset.moneyBound==='1')return;
    el.dataset.moneyBound='1';
    el.type='text';el.inputMode='numeric';
    el.value=moneyInputText(el.value);
    el.addEventListener('input',()=>{
      const digits=moneyDigits(el.value);
      el.value=digits?new Intl.NumberFormat('vi-VN').format(Number(digits)):'';
    });
    el.addEventListener('focus',()=>requestAnimationFrame(()=>el.setSelectionRange?.(el.value.length,el.value.length)));
  });
}

bindMoneyInputs(document);
const dateVN=s=>s?new Date(s+'T00:00:00').toLocaleDateString('vi-VN'):'—';
const dateTimeVN=s=>s?new Date(s).toLocaleString('vi-VN'):'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const active=b=>!['cancelled','rejected'].includes(b.status);
const photographerTypeLabel=t=>t==='founder'?'Founder':(t==='partner'?'Thợ đối tác':'Thợ thường');
const photographerCommissionRate=t=>t==='founder'?0:(t==='partner'?15:20);
const photographerByName=name=>photographers.find(p=>p.name===name);
const financeByBooking=id=>financeRecords.find(r=>String(r.booking_id)===String(id));
function financeCalc(booking,record=null,draft=null){
  const p=photographerByName(booking?.photographer);
  const rawType=record?.photographer_type||p?.photographer_type||'regular';
  const type=['founder','partner','regular'].includes(rawType)?rawType:'regular';
  const rate=Number(record?.commission_rate||photographerCommissionRate(type));
  const source=draft||record||{};
  const gross=Number(source.gross_revenue||0);
  const takecare=Number(source.takecare_cost||0),travel=Number(source.travel_cost||0),post=Number(source.postproduction_cost||0),other=Number(source.other_cost||0);
  const costs=takecare+travel+post+other;
  const studioShare=Math.round(gross*rate/100);
  const photographerShare=Math.max(0,gross-studioShare);
  const customerReceived=Number(source.customer_received ?? booking?.deposit_amount ?? 0);
  const photographerPaid=Number(source.photographer_paid||0);
  return {
    type,rate,gross,takecare,travel,post,other,costs,studioShare,photographerShare,
    customerReceived,photographerPaid,
    studioNet:studioShare-costs,
    receivable:Math.max(0,gross-customerReceived),
    photographerPayable:Math.max(0,photographerShare-photographerPaid),
    cashHeld:customerReceived-photographerPaid-costs
  };
}


function photographerNames(){return photographers.filter(p=>p.active!==false).sort((a,b)=>(a.sort_order||100)-(b.sort_order||100)).map(p=>p.name)}
function syncPhotographerOptions(){
  const names=photographerNames();
  [['calendarPhotographer','all','Tất cả photographer'],['filterPhotographer','all','Tất cả photographer']].forEach(([id,val,label])=>{
    const sel=$('#'+id);if(!sel)return;const old=sel.value;sel.innerHTML=`<option value="${val}">${label}</option>`+names.map(n=>`<option>${esc(n)}</option>`).join('');if([...sel.options].some(o=>o.value===old))sel.value=old;
  });
  const manual=$('#manualEventPhotographer');if(manual){const old=manual.value;manual.innerHTML=names.map(n=>`<option>${esc(n)}</option>`).join('');if([...manual.options].some(o=>o.value===old))manual.value=old;}
  const bookingEdit=$('#editPhotographer');if(bookingEdit){const old=bookingEdit.value;bookingEdit.innerHTML=names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');if([...bookingEdit.options].some(o=>o.value===old))bookingEdit.value=old;}
  const financeFilter=$('#financePhotographerFilter');if(financeFilter){const old=financeFilter.value;financeFilter.innerHTML='<option value="all">Tất cả photographer</option>'+names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');if([...financeFilter.options].some(o=>o.value===old))financeFilter.value=old;}
}

$('#logoutButton').addEventListener('click',async()=>{if(demoMode){location.replace('dang-nhap.html');return;}try{await window.CheeseAuth.logout();}catch(error){alert(error.message);}});
async function bootstrap(){
 if(new URLSearchParams(location.search).get('demo')==='1'){demoMode=true;await enterAdmin('Demo local');return;}
 const account=await window.CheeseAuth.guard('admin');if(!account)return;
 await enterAdmin(account.user.email);
 db.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'&&!demoMode){$('#loginScreen').style.display='';location.replace('dang-nhap.html');}});
}
queueMicrotask(bootstrap);

async function enterAdmin(email){
  $('#loginScreen').style.display='none'; $('#adminEmail').textContent=email;
  $('#syncStatus').textContent=demoMode?'Dữ liệu demo cục bộ':'Đồng bộ Supabase';
  await loadAll();
  if (!demoMode) startRealtimeNotifications();
}

function demoSeed(){
  const saved=JSON.parse(localStorage.getItem('cheese_demo_bookings_v1')||'[]');
  if(saved.length)return saved;
  const d=new Date(), iso=x=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+x).toISOString().slice(0,10);
  return [
    {id:'d1',booking_code:'CG-DEMO-01',created_at:new Date().toISOString(),customer_name:'Nguyễn Minh Anh',phone:'0988 123 456',contact_link:'',school:'THPT Demo',class_name:'Nhóm bạn thân',group_size:'4 người',photographer:'Quang Anh',package_name:'Gói Full Day',shoot_date:iso(2),time_slot:'Cả ngày',note:'Muốn concept sân trường',status:'new',deposit_amount:0,deposit_status:'unpaid',internal_note:''},
    {id:'d2',booking_code:'CG-DEMO-02',created_at:new Date(Date.now()-86400000).toISOString(),customer_name:'Trần Thu Hà',phone:'0912 345 678',school:'THPT Demo 2',class_name:'Nhóm đôi',group_size:'2 người',photographer:'Chi',package_name:'Gói tiêu chuẩn',shoot_date:iso(4),time_slot:'Sáng',note:'',status:'confirmed',deposit_amount:1000000,deposit_status:'paid',internal_note:'Đã xác nhận concept'},
    {id:'d3',booking_code:'CG-DEMO-03',created_at:new Date(Date.now()-172800000).toISOString(),customer_name:'Lê Hoàng',phone:'0966 111 222',school:'THPT Demo 3',class_name:'Nhóm tốt nghiệp',group_size:'5 người',photographer:'Minh',package_name:'Gói tiêu chuẩn',shoot_date:iso(4),time_slot:'Chiều',note:'',status:'deposit_pending',deposit_amount:500000,deposit_status:'partial',internal_note:'Chờ chuyển phần cọc còn lại'}
  ];
}
async function loadAll(){
  try{
    if(demoMode){
      photographers=JSON.parse(localStorage.getItem('cheese_demo_photographers_v2')||'null')||DEFAULT_PHOTOGRAPHERS.map(p=>({...p}));
      bookings=demoSeed();
      blocks=JSON.parse(localStorage.getItem('cheese_demo_blocks_v1')||'[]');
      manualEvents=JSON.parse(localStorage.getItem('cheese_demo_calendar_events_v1')||'[]');
      takecareStaff=JSON.parse(localStorage.getItem('cheese_demo_takecare_staff_v1')||'[]');
      takecareShifts=JSON.parse(localStorage.getItem('cheese_demo_takecare_shifts_v1')||'[]');
      financeRecords=JSON.parse(localStorage.getItem('cheese_demo_finance_v1')||'[]');
      pricingSettings=JSON.parse(localStorage.getItem('cheese_demo_pricing_v1')||'null')||JSON.parse(JSON.stringify(DEFAULT_PRICING));pricingSettings.takecareFullDayRate=Number(pricingSettings.takecareFullDayRate||400000);pricingSettings.takecareHalfDayRate=Number(pricingSettings.takecareHalfDayRate||250000);
    }else{
      const [pq,bq,blq,meq,prq,tcq,tcsq,fq]=await Promise.all([
        db.from('photographers').select('*').order('sort_order').order('created_at'),
        db.from('bookings').select('*').order('created_at',{ascending:false}),
        db.from('photographer_blocks').select('*').order('block_date'),
        db.from('calendar_events').select('*').order('event_date'),
        db.from('site_pricing').select('*').eq('id','main').maybeSingle(),
        db.from('takecare_staff').select('*').order('active',{ascending:false}).order('name'),
        db.from('takecare_shifts').select('*').order('work_date',{ascending:false}),
        db.from('booking_finance').select('*').order('updated_at',{ascending:false})
      ]);
      if(pq.error)throw pq.error;if(bq.error)throw bq.error;if(blq.error)throw blq.error;if(meq.error)throw meq.error;
      photographers=pq.data||[];bookings=bq.data||[];blocks=blq.data||[];manualEvents=meq.data||[];
      if(tcq.error){console.warn('Take Care staff:',tcq.error.message);takecareStaff=[]}else takecareStaff=tcq.data||[];
      if(tcsq.error){console.warn('Take Care shifts:',tcsq.error.message);takecareShifts=[]}else takecareShifts=tcsq.data||[];
      if(fq.error){console.warn('Booking finance:',fq.error.message);financeRecords=[]}else financeRecords=fq.data||[];
      if(prq.error){
        console.warn('Pricing table:',prq.error.message);
        pricingSettings=JSON.parse(JSON.stringify(DEFAULT_PRICING));
      }else if(prq.data){
        pricingSettings={...JSON.parse(JSON.stringify(DEFAULT_PRICING)),referencePriceFrom:Number(prq.data.reference_price_from||1500000),teamBasePrices:prq.data.team_prices||[],provinceGroups:prq.data.province_groups||[],provinceDetails:prq.data.province_details||{},takecareFullDayRate:Number(prq.data.takecare_full_day_rate||400000),takecareHalfDayRate:Number(prq.data.takecare_half_day_rate||250000)};
      }else {pricingSettings=JSON.parse(JSON.stringify(DEFAULT_PRICING));pricingSettings.takecareFullDayRate=400000;pricingSettings.takecareHalfDayRate=250000;}
    }
    syncPhotographerOptions();
    renderAll();
  }catch(err){alert('Không tải được dữ liệu: '+err.message);}
}
function renderAll(){renderCrewConfirmations();renderStats();renderRecent();renderBookings();renderCalendar();renderManualEventManager();renderPhotographers();renderPricingSettings();renderTakecare();renderFinance();if(selectedDay)renderDayPanel(selectedDay);}

function scheduleDateInPeriod(dateString,year,month=null){
  if(!dateString)return false;
  const d=new Date(dateString+'T00:00:00');
  if(Number.isNaN(d.getTime())||d.getFullYear()!==year)return false;
  return month===null||d.getMonth()===month;
}
function renderStats(){
  const now=new Date(),m=now.getMonth(),y=now.getFullYear();
  const monthBookings=bookings.filter(b=>active(b)&&scheduleDateInPeriod(b.shoot_date,y,m));
  const yearBookings=bookings.filter(b=>active(b)&&scheduleDateInPeriod(b.shoot_date,y));
  const monthManual=manualEvents.filter(e=>scheduleDateInPeriod(e.event_date,y,m));
  const yearManual=manualEvents.filter(e=>scheduleDateInPeriod(e.event_date,y));
  const revenue=bks=>bks.reduce((sum,b)=>{
    const f=financeByBooking(b.id);
    return sum+(Number(f?.gross_revenue||0)>0?Number(f.gross_revenue):Number(b.deposit_amount||0));
  },0);

  $('#statMonth').textContent=monthBookings.length+monthManual.length;
  $('#statYear').textContent=yearBookings.length+yearManual.length;
  $('#statMoneyMonth').textContent=money(revenue(monthBookings));
  $('#statMoneyYear').textContent=money(revenue(yearBookings));
  const monthLabel=$('#statMonthLabel'),yearLabel=$('#statYearLabel');
  if(monthLabel)monthLabel.textContent=`${monthBookings.length} booking · ${monthManual.length} lịch tự thêm`;
  if(yearLabel)yearLabel.textContent=`${yearBookings.length} booking · ${yearManual.length} lịch tự thêm`;
}

function slotRank(slot){
  const s=String(slot||'').toLowerCase();
  if(s.includes('sáng'))return 1;
  if(s.includes('chiều'))return 2;
  if(s.includes('cả'))return 3;
  return 4;
}
function upcomingScheduleItems(){
  const today=ymd(new Date());
  const bookingItems=bookings.filter(b=>active(b)&&String(b.shoot_date||'')>=today).map(b=>({
    kind:'booking',id:b.id,date:b.shoot_date,time_slot:b.time_slot||'',photographer:b.photographer||'',
    title:b.customer_name||'Khách chụp',subtitle:[b.school,b.class_name,b.package_name].filter(Boolean).join(' · '),
    search:[b.booking_code,b.customer_name,b.phone,b.customer_email,b.school,b.class_name,b.package_name,b.photographer,b.note].join(' ').toLowerCase(),
    raw:b
  }));
  const manualItems=manualEvents.filter(e=>String(e.event_date||'')>=today).map(e=>({
    kind:'manual',id:e.id,date:e.event_date,time_slot:e.time_slot||'',photographer:e.photographer||'',
    title:e.title||'Lịch tự thêm',subtitle:[manualEventTypeLabel(e.event_type),e.source,e.note].filter(Boolean).join(' · '),
    search:[e.title,e.photographer,e.source,e.note,e.event_type,e.time_slot].join(' ').toLowerCase(),
    raw:e
  }));
  return [...bookingItems,...manualItems].sort((a,b)=>
    String(a.date).localeCompare(String(b.date))||
    slotRank(a.time_slot)-slotRank(b.time_slot)||
    String(a.photographer).localeCompare(String(b.photographer),'vi')
  );
}
function scheduleCardHtml(item){
  if(item.kind==='booking'){
    const b=item.raw;
    const statusClass=b.status==='confirmed'||b.status==='completed'?'confirmed':'pending';
    return `<article class="upcoming-card" data-schedule-kind="booking" data-schedule-id="${b.id}">
      <div class="upcoming-time">${esc(b.time_slot||'Chưa chọn ca')}</div>
      <div class="upcoming-main">
        <h3>${esc(b.customer_name||'Khách chụp')} · ${esc(b.photographer||'Chưa chọn thợ')}</h3>
        <p>${esc([b.school,b.class_name,b.package_name].filter(Boolean).join(' · ')||'Booking từ website')}</p>
        <div class="upcoming-tags">
          <span>${esc(b.booking_code||'Booking')}</span>
          <span class="${statusClass}">${esc(STATUS[b.status]||b.status||'')}</span>
          <span>${esc(b.phone||'Không có SĐT')}</span>${crewConfirmationBadge(b)}
        </div>
      </div>
      <div class="upcoming-side">
        <strong>${money(b.deposit_amount||0)}</strong>
        <small>${esc(DEPOSIT[b.deposit_status]||b.deposit_status||'Chưa cọc')}</small>
        <button class="schedule-edit" type="button" data-booking-edit="${b.id}">Sửa lịch</button>
        <button class="schedule-delete" type="button" data-booking-delete="${b.id}">Xóa lịch</button>
      </div>
    </article>`;
  }
  const e=item.raw;
  return `<article class="upcoming-card manual" data-schedule-kind="manual" data-schedule-id="${e.id}">
    <div class="upcoming-time">${esc(e.time_slot||'—')}</div>
    <div class="upcoming-main">
      <h3>${esc(e.title||'Lịch tự thêm')} · ${esc(e.photographer||'')}</h3>
      <p>${esc([e.source,e.note].filter(Boolean).join(' · ')||manualEventTypeLabel(e.event_type))}</p>
      <div class="upcoming-tags">
        <span class="manual-tag">Lịch Admin</span>${crewConfirmationBadge(e)}
        <span>${esc(manualEventTypeLabel(e.event_type))}</span>
        <span>${e.blocks_booking?'Chặn booking':'Chỉ nội bộ'}</span>
      </div>
    </div>
    <div class="upcoming-side">
      <strong>${e.blocks_booking?'Hết lịch':'Nội bộ'}</strong>
      <small>Lịch Admin tự thêm</small>
      <button class="schedule-edit" type="button" data-manual-card-edit="${e.id}">Sửa lịch</button>
      <button class="schedule-delete" type="button" data-manual-card-delete="${e.id}">Xóa lịch</button>
    </div>
  </article>`;
}
function renderScheduleGroups(items,root,compact=false){
  if(!root)return;
  const groups=new Map();
  items.forEach(item=>{
    if(!groups.has(item.date))groups.set(item.date,[]);
    groups.get(item.date).push(item);
  });
  root.innerHTML=[...groups.entries()].map(([date,list])=>`
    <section class="upcoming-day-group">
      <header class="upcoming-day-head">
        <b>${dateVN(date)}</b>
        <span>${list.length} lịch</span>
      </header>
      <div class="upcoming-day-items">
        ${list.map(scheduleCardHtml).join('')}
      </div>
    </section>`).join('');
  $$('[data-schedule-kind="booking"]',root).forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('button'))return;openDrawer(el.dataset.scheduleId)}));
  $$('[data-schedule-kind="manual"]',root).forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('button'))return;openManualEvent(el.dataset.scheduleId)}));
  $$('[data-booking-edit]',root).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openDrawer(btn.dataset.bookingEdit)}));
  $$('[data-booking-delete]',root).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();deleteBookingById(btn.dataset.bookingDelete)}));
  $$('[data-manual-card-edit]',root).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openManualEvent(btn.dataset.manualCardEdit)}));
  $$('[data-manual-card-delete]',root).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();deleteManualEventById(btn.dataset.manualCardDelete)}));
}
function renderRecent(){
  const items=upcomingScheduleItems().slice(0,6);
  const box=$('#overviewUpcoming'),empty=$('#overviewUpcomingEmpty');
  renderScheduleGroups(items,box,true);
  if(empty)empty.hidden=!!items.length;
}
function renderBookings(){
  const q=($('#searchInput')?.value||'').trim().toLowerCase();
  const p=$('#filterPhotographer')?.value||'all';
  const items=upcomingScheduleItems().filter(item=>
    (!q||item.search.includes(q))&&(p==='all'||item.photographer===p)
  );
  const box=$('#upcomingScheduleList');
  renderScheduleGroups(items,box);
  if($('#bookingEmpty'))$('#bookingEmpty').hidden=!!items.length;
}
['searchInput','filterPhotographer'].forEach(id=>{
  const el=$('#'+id);if(el)el.addEventListener(id==='searchInput'?'input':'change',renderBookings);
});
$$('[data-open-upcoming]').forEach(btn=>btn.addEventListener('click',()=>switchView('bookings')));

function switchView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  $$('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  const map={
    overview:['Tổng quan','Theo dõi lịch chụp theo tháng, năm và doanh thu đã ghi nhận.'],
    calendar:['Lịch chụp','Bấm vào từng ngày để xem đầy đủ các lịch và thông tin chi tiết trong ngày đó.'],
    bookings:['Lịch sắp tới','Các lịch có ngày chụp từ hôm nay trở đi, xếp lần lượt theo từng ngày có lịch.'],
    photographers:['Photographer','Sửa giá, thông tin, ảnh, loại thợ và trạng thái hiển thị.'],
    finance:['Dòng tiền','Theo dõi doanh thu, chi phí, phần STU và tiền photographer nhận qua studio.'],
    hero:['Ảnh giao diện','Quản lý ảnh đầu trang, Real Work và ảnh profile photographer.'],
    pricing:['Bảng giá & phụ phí','Sửa giá tham khảo, hạng ekip và toàn bộ phụ phí di chuyển.'],
    takecare:['Take Care','Quản lý nhân sự, ngày làm và chi phí Take Care theo từng ca.']
  };
  $('#viewTitle').textContent=map[name][0];$('#viewSubtitle').textContent=map[name][1];$('#mobileView').value=name;
}
$$('.nav button').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$('#mobileView').addEventListener('change',e=>switchView(e.target.value));

function ymd(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function renderCalendar(){
  const grid=$('#calendarGrid'), phot=$('#calendarPhotographer').value;
  const y=currentMonth.getFullYear(),m=currentMonth.getMonth();
  $('#monthTitle').textContent=`Tháng ${m+1} · ${y}`;
  const start=new Date(y,m,1), mondayIndex=(start.getDay()+6)%7, first=new Date(y,m,1-mondayIndex);
  const dows=['T2','T3','T4','T5','T6','T7','CN'];
  let html=dows.map(d=>`<div class="dow">${d}</div>`).join('');
  const today=ymd(new Date());
  for(let i=0;i<42;i++){
    const d=new Date(first);d.setDate(first.getDate()+i);const ds=ymd(d),other=d.getMonth()!==m;
    const dayBookings=bookings.filter(b=>b.shoot_date===ds&&active(b)&&(phot==='all'||b.photographer===phot));
    const dayBlocks=blocks.filter(x=>x.block_date===ds&&(phot==='all'||x.photographer===phot));
    const dayManual=manualEvents.filter(x=>x.event_date===ds&&(phot==='all'||x.photographer===phot));
    let full=false;
    if(phot!=='all'){
      const slots=new Set(dayBookings.map(b=>b.time_slot));
      const manualSlots=new Set(dayManual.filter(x=>x.blocks_booking).map(x=>x.time_slot));
      full=
        slots.has('Cả ngày') ||
        manualSlots.has('Cả ngày') ||
        ((slots.has('Sáng')||manualSlots.has('Sáng'))&&(slots.has('Chiều')||manualSlots.has('Chiều'))) ||
        dayBlocks.some(x=>x.time_slot==='Cả ngày');
    }
    const state=dayBlocks.length?'blocked':full?'full':'';
    const combined=[
      ...dayBookings.map(b=>({
        kind:'booking', id:b.id,
        html:`<div class="event ${b.deposit_status==='paid'?'paid':(['unpaid','partial'].includes(b.deposit_status)?'pending':'')}">${esc(b.photographer)} · ${esc(b.time_slot)} · ${esc(b.customer_name)}</div>`
      })),
      ...dayManual.map(x=>({
        kind:'manual', id:x.id,
        html:`<div class="event manual ${esc(x.event_type)} ${x.blocks_booking?'':'no-block'}">${esc(x.photographer)} · ${esc(x.time_slot)} · ${esc(x.title)}</div>`
      }))
    ];
    const events=combined.slice(0,3).map(x=>x.html).join('');
    const more=combined.length>3?`<div class="event">+${combined.length-3} lịch khác</div>`:'';
    html+=`<div class="day ${other?'other ':''}${ds===today?'today ':''}${state}" data-date="${ds}"><span class="num">${d.getDate()}</span><span class="day-state">${dayBlocks.length?'Khóa':full?'Kín':''}</span>${events}${more}</div>`;
  }
  grid.innerHTML=html;
  $$('.day[data-date]',grid).forEach(el=>el.addEventListener('click',()=>{
    selectedDay=el.dataset.date;
    $$('.day[data-date]',grid).forEach(x=>x.classList.toggle('selected',x.dataset.date===selectedDay));
    renderDayPanel(selectedDay);
    $('#dayPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  if(selectedDay)$$('.day[data-date]',grid).forEach(x=>x.classList.toggle('selected',x.dataset.date===selectedDay));
}
$('#calendarPhotographer').addEventListener('change',()=>{renderCalendar();renderManualEventManager();if(selectedDay)renderDayPanel(selectedDay)});
$('#prevMonth').addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1,1);renderCalendar();renderManualEventManager()});
$('#nextMonth').addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1,1);renderCalendar();renderManualEventManager()});
$('#todayButton').addEventListener('click',()=>{currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar();renderManualEventManager()});

function manualEventTypeLabel(type){
  return type==='personal'?'Lịch cá nhân':type==='existing_booking'?'Lịch đã có / đã chốt':'Lịch khác';
}
function renderManualEventManager(){
  const box=$('#manualMonthList'),empty=$('#manualMonthEmpty'),summary=$('#manualMonthSummary');
  if(!box)return;
  const phot=$('#calendarPhotographer')?.value||'all';
  const y=currentMonth.getFullYear(),m=currentMonth.getMonth();
  const prefix=`${y}-${String(m+1).padStart(2,'0')}`;
  const items=manualEvents
    .filter(x=>String(x.event_date||'').slice(0,7)===prefix&&(phot==='all'||x.photographer===phot))
    .sort((a,b)=>String(a.event_date).localeCompare(String(b.event_date))||String(a.time_slot).localeCompare(String(b.time_slot)));
  if(summary)summary.textContent=phot==='all'?`${items.length} lịch tự thêm · Tháng ${m+1}/${y}`:`${phot} · ${items.length} lịch tự thêm · Tháng ${m+1}/${y}`;
  box.innerHTML=items.map(x=>`<article class="manual-month-row">
    <div class="manual-month-date"><b>${dateVN(x.event_date)}</b><small>${manualEventTypeLabel(x.event_type)}</small></div>
    <div class="manual-month-photographer"><b>${esc(x.photographer)}</b></div>
    <div class="manual-month-slot"><b>${esc(x.time_slot)}</b></div>
    <div class="manual-month-title"><b>${esc(x.title)}</b><small>${esc(x.note||x.source||'Không có ghi chú')}</small></div>
    <div class="manual-month-status"><span class="${x.blocks_booking?'blocking':''}">${x.blocks_booking?'Chặn booking':'Chỉ nội bộ'}</span></div>
    <div class="manual-month-actions"><button class="edit" type="button" data-month-manual-edit="${x.id}">Sửa lịch</button><button class="delete" type="button" data-month-manual-delete="${x.id}">Xóa lịch</button></div>
  </article>`).join('');
  if(empty)empty.hidden=!!items.length;
  $$('[data-month-manual-edit]',box).forEach(btn=>btn.addEventListener('click',()=>openManualEvent(btn.dataset.monthManualEdit)));
  $$('[data-month-manual-delete]',box).forEach(btn=>btn.addEventListener('click',()=>deleteManualEventById(btn.dataset.monthManualDelete)));
}
$('#addCalendarEventFromList')?.addEventListener('click',()=>openManualEvent(null,selectedDay));

function renderDayPanel(ds){
  const panel=$('#dayPanel'),phot=$('#calendarPhotographer').value;
  panel.hidden=false;$('#dayTitle').textContent=`Lịch ngày ${dateVN(ds)}`;
  const list=bookings.filter(b=>b.shoot_date===ds&&active(b)&&(phot==='all'||b.photographer===phot))
    .sort((a,b)=>slotRank(a.time_slot)-slotRank(b.time_slot));
  const manual=manualEvents.filter(x=>x.event_date===ds&&(phot==='all'||x.photographer===phot))
    .sort((a,b)=>slotRank(a.time_slot)-slotRank(b.time_slot));
  $('#daySummary').textContent=phot==='all'
    ? `${list.length+manual.length} lịch · ${list.length} booking khách · ${manual.length} lịch tự thêm`
    : `${phot} · ${list.length+manual.length} lịch trong ngày`;

  const bookingHtml=list.map(b=>{
    const depositClass=b.deposit_status==='paid'?'paid':'pending';
    return `<article class="day-booking detailed" data-id="${b.id}">
      <div class="day-detail-head">
        <div class="day-detail-title">
          <b>${esc(b.time_slot)} · ${esc(b.customer_name||'Khách chụp')}</b>
          <span>${esc(b.booking_code||'Booking')} · ${esc(b.photographer||'')}</span>
        </div>
        <div class="day-detail-badges">
          <span>${esc(STATUS[b.status]||b.status||'')}</span>
          <span class="${depositClass}">${esc(DEPOSIT[b.deposit_status]||b.deposit_status||'')}</span>
        </div>
      </div>
      <div class="day-detail-grid">
        <div><small>Liên hệ</small><b>${esc(b.phone||'—')}</b></div>
        <div><small>Trường / nhóm</small><b>${esc([b.school,b.class_name].filter(Boolean).join(' · ')||'—')}</b></div>
        <div><small>Gói chụp</small><b>${esc(b.package_name||'—')}</b></div>
        <div><small>Tiền đã ghi nhận</small><b>${money(b.deposit_amount||0)}</b></div>
      </div>
      ${(b.note||b.internal_note)?`<p class="day-detail-note">${b.note?`Khách: ${esc(b.note)}`:''}${b.note&&b.internal_note?' · ':''}${b.internal_note?`Nội bộ: ${esc(b.internal_note)}`:''}</p>`:''}
      <div class="schedule-inline-actions">
        <button class="schedule-edit" type="button" data-day-booking-edit="${b.id}">Sửa lịch</button>
        <button class="schedule-delete" type="button" data-day-booking-delete="${b.id}">Xóa lịch</button>
      </div>
    </article>`;
  }).join('');

  const manualHtml=manual.map(x=>`<article class="day-booking manual-entry detailed">
    <div class="day-detail-head">
      <div class="day-detail-title">
        <b>${esc(x.time_slot)} · ${esc(x.title)}</b>
        <span>${esc(x.photographer)} · Lịch Admin tự thêm</span>
      </div>
      <div class="day-detail-badges">
        <span>${esc(manualEventTypeLabel(x.event_type))}</span>
        <span>${x.blocks_booking?'Chặn booking':'Chỉ nội bộ'}</span>
      </div>
    </div>
    <div class="day-detail-grid">
      <div><small>Photographer</small><b>${esc(x.photographer||'—')}</b></div>
      <div><small>Nguồn lịch</small><b>${esc(x.source||'—')}</b></div>
      <div><small>Khung giờ</small><b>${esc(x.time_slot||'—')}</b></div>
      <div><small>Website khách</small><b>${x.blocks_booking?'Hết lịch':'Không chặn'}</b></div>
    </div>
    ${x.note?`<p class="day-detail-note">${esc(x.note)}</p>`:''}
    <div class="day-event-actions">
      <button class="day-event-edit" type="button" data-manual-edit="${x.id}">Sửa lịch</button>
      <button class="day-event-delete" type="button" data-manual-delete="${x.id}">Xóa</button>
    </div>
  </article>`).join('');

  $('#dayBookings').innerHTML=(bookingHtml+manualHtml)||'<div class="empty">Ngày này chưa có lịch.</div>';
  $$('.day-booking[data-id]').forEach(x=>x.addEventListener('click',e=>{if(e.target.closest('button'))return;openDrawer(x.dataset.id)}));
  $$('[data-day-booking-edit]').forEach(x=>x.addEventListener('click',e=>{e.stopPropagation();openDrawer(x.dataset.dayBookingEdit)}));
  $$('[data-day-booking-delete]').forEach(x=>x.addEventListener('click',e=>{e.stopPropagation();deleteBookingById(x.dataset.dayBookingDelete)}));
  $$('[data-manual-edit]').forEach(x=>x.addEventListener('click',e=>{e.stopPropagation();openManualEvent(x.dataset.manualEdit)}));
  $$('[data-manual-delete]').forEach(x=>x.addEventListener('click',e=>{e.stopPropagation();deleteManualEventById(x.dataset.manualDelete)}));

  const btn=$('#toggleBlockDay');
  if(phot==='all'){btn.disabled=true;btn.textContent='Chọn photographer để khóa lịch';return}
  btn.disabled=false;
  const blocked=blocks.some(x=>x.photographer===phot&&x.block_date===ds&&x.time_slot==='Cả ngày');
  btn.textContent=blocked?'Mở lại ngày':'Khóa cả ngày';
  btn.dataset.blocked=blocked?'1':'0';btn.dataset.date=ds;btn.dataset.photographer=phot;
}
$('#toggleBlockDay').addEventListener('click',async()=>{
  const b=$('#toggleBlockDay'), phot=b.dataset.photographer, date=b.dataset.date, isBlocked=b.dataset.blocked==='1'; if(!phot||!date)return;
  try{
    if(demoMode){
      if(isBlocked) blocks=blocks.filter(x=>!(x.photographer===phot&&x.block_date===date&&x.time_slot==='Cả ngày'));
      else blocks.push({id:'block-'+Date.now(),photographer:phot,block_date:date,time_slot:'Cả ngày',note:'Khóa từ admin'});
      localStorage.setItem('cheese_demo_blocks_v1',JSON.stringify(blocks));
    }else if(isBlocked){
      const {error}=await db.from('photographer_blocks').delete().eq('photographer',phot).eq('block_date',date).eq('time_slot','Cả ngày');if(error)throw error;
    }else{
      const {error}=await db.from('photographer_blocks').insert({photographer:phot,block_date:date,time_slot:'Cả ngày',note:'Khóa từ admin'});if(error)throw error;
    }
    await loadAll();
  }catch(err){alert(err.message)}
});

function openDrawer(id){
  activeBooking=bookings.find(b=>String(b.id)===String(id));if(!activeBooking)return;
  syncPhotographerOptions();
  $('#drawerCode').textContent=activeBooking.booking_code||'Lịch khách';
  $('#drawerCreated').textContent='Tạo '+dateTimeVN(activeBooking.created_at);
  const d=[
    ['Khách',activeBooking.customer_name],
    ['Số điện thoại',activeBooking.phone],
    ['Trường / nhóm',[activeBooking.school,activeBooking.class_name].filter(Boolean).join(' · ')||'—'],
    ['Ngày chụp',dateVN(activeBooking.shoot_date)+' · '+activeBooking.time_slot],
    ['Photographer',activeBooking.photographer],
    ['Thợ xác nhận',activeBooking.photographer_confirmed_at?'Đã xác nhận · '+dateTimeVN(activeBooking.photographer_confirmed_at):'Chưa xác nhận'],
    ['Gói',activeBooking.package_name]
  ];
  $('#detailGrid').innerHTML=d.map(([k,v])=>`<div class="detail"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('');

  $('#editCustomerName').value=activeBooking.customer_name||'';
  $('#editPhone').value=activeBooking.phone||'';
  $('#editShootDate').value=activeBooking.shoot_date||'';
  $('#editTimeSlot').value=activeBooking.time_slot||'Cả ngày';
  $('#editPhotographer').value=activeBooking.photographer||'';
  $('#editSchool').value=activeBooking.school||'';
  $('#editClassName').value=activeBooking.class_name||'';
  $('#editPackageName').value=activeBooking.package_name||'';
  $('#editGroupSize').value=activeBooking.group_size||'';
  $('#editCustomerNote').value=activeBooking.note||'';
  $('#editStatus').value=activeBooking.status;
  $('#editDepositStatus').value=activeBooking.deposit_status;
  setMoneyInput($('#editDepositAmount'),activeBooking.deposit_amount||0);
  $('#editInternalNote').value=activeBooking.internal_note||'';

  $('#drawerBackdrop').classList.add('open');
  $('#bookingDrawer').classList.add('open');
}
function closeDrawer(){$('#drawerBackdrop').classList.remove('open');$('#bookingDrawer').classList.remove('open');activeBooking=null}
$('#drawerClose').addEventListener('click',closeDrawer);$('#drawerBackdrop').addEventListener('click',closeDrawer);
$('#editForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!activeBooking)return;
  if(!e.currentTarget.reportValidity())return;
  const patch={
    customer_name:$('#editCustomerName').value.trim(),
    phone:$('#editPhone').value.trim(),
    shoot_date:$('#editShootDate').value,
    time_slot:$('#editTimeSlot').value,
    photographer:$('#editPhotographer').value,
    school:$('#editSchool').value.trim()||null,
    class_name:$('#editClassName').value.trim()||null,
    package_name:$('#editPackageName').value.trim(),
    group_size:$('#editGroupSize').value.trim(),
    note:$('#editCustomerNote').value.trim()||null,
    status:$('#editStatus').value,
    deposit_status:$('#editDepositStatus').value,
    deposit_amount:moneyInputNumber($('#editDepositAmount')),
    internal_note:$('#editInternalNote').value.trim()||null
  };
  try{
    const bookingId=activeBooking.id;
    if(demoMode){
      bookings=bookings.map(b=>String(b.id)===String(bookingId)?{...b,...patch}:b);
      const local=JSON.parse(localStorage.getItem('cheese_demo_bookings_v1')||'[]');
      if(local.some(b=>String(b.id)===String(bookingId))){
        localStorage.setItem('cheese_demo_bookings_v1',JSON.stringify(
          local.map(b=>String(b.id)===String(bookingId)?{...b,...patch}:b)
        ));
      }
    }else{
      const {error}=await db.from('bookings').update(patch).eq('id',bookingId);
      if(error)throw error;
    }
    const keepDate=patch.shoot_date;
    closeDrawer();
    selectedDay=keepDate;
    currentMonth=new Date(keepDate+'T00:00:00');
    currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth(),1);
    await loadAll();
    switchView('calendar');
    renderDayPanel(keepDate);
    alert('Đã lưu thay đổi lịch.');
  }catch(err){alert('Không lưu được lịch: '+err.message)}
});

async function deleteBookingById(id){
  const item=bookings.find(b=>String(b.id)===String(id));
  if(!item)return;
  const label=[item.booking_code,item.customer_name,dateVN(item.shoot_date),item.time_slot].filter(Boolean).join(' · ');
  if(!confirm(`Xóa lịch này?\n\n${label}\n\nLịch sẽ bị xóa khỏi Admin. Nếu không còn lịch khác chặn khung giờ này thì khách sẽ đặt lại được.`))return;
  const keepDate=item.shoot_date;
  try{
    if(demoMode){
      bookings=bookings.filter(b=>String(b.id)!==String(id));
      const local=JSON.parse(localStorage.getItem('cheese_demo_bookings_v1')||'[]')
        .filter(b=>String(b.id)!==String(id));
      localStorage.setItem('cheese_demo_bookings_v1',JSON.stringify(local));
    }else{
      const {error}=await db.from('bookings').delete().eq('id',id);
      if(error)throw error;
    }
    if(activeBooking&&String(activeBooking.id)===String(id))closeDrawer();
    selectedDay=keepDate;
    await loadAll();
    switchView('calendar');
    renderDayPanel(keepDate);
  }catch(err){alert('Không xóa được lịch: '+err.message)}
}
$('#deleteBooking')?.addEventListener('click',()=>{if(activeBooking)deleteBookingById(activeBooking.id)});


const manualModal=$('#manualEventModal');
const manualForm=$('#manualEventForm');
const manualId=$('#manualEventId');
const manualType=$('#manualEventType');
const manualTitleInput=$('#manualEventTitleInput');
const manualPhotographer=$('#manualEventPhotographer');
const manualDate=$('#manualEventDate');
const manualTime=$('#manualEventTime');
const manualSource=$('#manualEventSource');
const manualNote=$('#manualEventNote');
const manualBlocks=$('#manualEventBlocks');
const manualDelete=$('#deleteManualEvent');

function syncManualWebStatus(){
  const box=$('.manual-web-status'), text=$('#manualWebStatusText');
  if(!box||!text)return;
  const busy=manualBlocks.checked;
  box.classList.toggle('is-free',!busy);
  text.textContent=busy
    ? 'Hết lịch · khách sẽ không chọn được khung giờ này'
    : 'Còn lịch · sự kiện chỉ lưu nội bộ, khách vẫn tra thấy còn';
}
manualBlocks?.addEventListener('change',syncManualWebStatus);

function openManualEvent(id=null,prefillDate=null){
  const item=id?manualEvents.find(x=>String(x.id)===String(id)):null;
  manualForm.reset();
  manualId.value=item?.id||'';
  manualType.value=item?.event_type||'existing_booking';
  manualTitleInput.value=item?.title||'';
  manualPhotographer.value=item?.photographer||($('#calendarPhotographer').value!=='all'?$('#calendarPhotographer').value:photographerNames()[0]||'');
  manualDate.value=item?.event_date||prefillDate||selectedDay||ymd(new Date());
  manualTime.value=item?.time_slot||'Cả ngày';
  manualSource.value=item?.source||'';
  manualNote.value=item?.note||'';
  manualBlocks.checked=item?!!item.blocks_booking:true;
  syncManualWebStatus();
  manualDelete.hidden=!item;
  const saveBtn=$('#saveManualEvent');if(saveBtn)saveBtn.textContent=item?'Lưu thay đổi':'Thêm lịch';
  $('#manualEventTitle').textContent=item?'Sửa lịch':'Thêm lịch vào hệ thống';
  manualModal.classList.add('open');
  manualModal.setAttribute('aria-hidden','false');
  setTimeout(()=>manualTitleInput.focus(),100);
}

function closeManualEvent(){
  manualModal.classList.remove('open');
  manualModal.setAttribute('aria-hidden','true');
}

$('#addCalendarEvent')?.addEventListener('click',()=>openManualEvent(null,selectedDay));
$$('[data-manual-close]').forEach(x=>x.addEventListener('click',closeManualEvent));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&manualModal?.classList.contains('open'))closeManualEvent()});

manualForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!manualForm.reportValidity())return;
  const payload={
    event_type:manualType.value,
    title:manualTitleInput.value.trim(),
    photographer:manualPhotographer.value,
    event_date:manualDate.value,
    time_slot:manualTime.value,
    source:manualSource.value.trim()||null,
    note:manualNote.value.trim()||null,
    blocks_booking:manualBlocks.checked
  };
  try{
    if(demoMode){
      if(manualId.value){
        manualEvents=manualEvents.map(x=>String(x.id)===String(manualId.value)?{...x,...payload}:x);
      }else{
        manualEvents.push({id:'manual-'+Date.now(),created_at:new Date().toISOString(),...payload});
      }
      localStorage.setItem('cheese_demo_calendar_events_v1',JSON.stringify(manualEvents));
    }else if(manualId.value){
      const {error}=await db.from('calendar_events').update(payload).eq('id',manualId.value);
      if(error)throw error;
    }else{
      const {error}=await db.from('calendar_events').insert(payload);
      if(error)throw error;
    }
    closeManualEvent();
    selectedDay=payload.event_date;
    currentMonth=new Date(payload.event_date+'T00:00:00');
    currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth(),1);
    await loadAll();
    switchView('calendar');
    renderDayPanel(selectedDay);
  }catch(err){alert('Không lưu được lịch: '+err.message)}
});

async function deleteManualEventById(id){
  const item=manualEvents.find(x=>String(x.id)===String(id));
  if(!item)return;
  if(!confirm(`Xóa lịch "${item.title}" ngày ${dateVN(item.event_date)}?\n\nThao tác này sẽ bỏ lịch khỏi Admin và nếu lịch đang chặn booking thì khung giờ đó sẽ mở lại cho khách.`))return;
  const keepDay=item.event_date;
  try{
    if(demoMode){
      manualEvents=manualEvents.filter(x=>String(x.id)!==String(id));
      localStorage.setItem('cheese_demo_calendar_events_v1',JSON.stringify(manualEvents));
    }else{
      const {error}=await db.from('calendar_events').delete().eq('id',id);
      if(error)throw error;
    }
    if(manualModal?.classList.contains('open'))closeManualEvent();
    selectedDay=keepDay;
    await loadAll();
    switchView('calendar');
    renderManualEventManager();
    renderDayPanel(keepDay);
  }catch(err){alert('Không xóa được lịch: '+err.message)}
}
manualDelete?.addEventListener('click',()=>{if(manualId.value)deleteManualEventById(manualId.value)});



// ============================================================
// Photographer CMS
// ============================================================
// TAKE CARE CMS — nhân sự + lịch làm + chi phí
function tcMonthValue(){
  const el=$('#takecareMonthFilter');
  if(el?.value)return el.value;
  const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function tcRate(type){
  if(type==='full_day')return Number(pricingSettings.takecareFullDayRate||TAKECARE_RATE_DEFAULT.full_day);
  if(type==='half_morning'||type==='half_afternoon')return Number(pricingSettings.takecareHalfDayRate||TAKECARE_RATE_DEFAULT.half_morning);
  return 0;
}
function tcStaffById(id){return takecareStaff.find(x=>String(x.id)===String(id))}
function tcFilteredShifts(){
  const month=tcMonthValue(),staff=$('#takecareStaffFilter')?.value||'all';
  return takecareShifts.filter(s=>String(s.work_date||'').slice(0,7)===month&&(staff==='all'||String(s.takecare_id)===String(staff))).sort((a,b)=>String(a.work_date).localeCompare(String(b.work_date)));
}
function syncTakecareSelects(){
  const activeStaff=takecareStaff.filter(x=>x.active!==false).sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
  const shiftSel=$('#takecareShiftStaff');
  if(shiftSel){const old=shiftSel.value;shiftSel.innerHTML=activeStaff.length?activeStaff.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join(''):'<option value="">Chưa có Take Care</option>';if([...shiftSel.options].some(o=>o.value===old))shiftSel.value=old;}
  const filter=$('#takecareStaffFilter');
  if(filter){const old=filter.value;filter.innerHTML='<option value="all">Tất cả Take Care</option>'+takecareStaff.map(x=>`<option value="${x.id}">${esc(x.name)}${x.active===false?' · đã ẩn':''}</option>`).join('');if([...filter.options].some(o=>o.value===old))filter.value=old;}
}
function renderTakecare(){
  if(!$('#view-takecare'))return;
  const month=$('#takecareMonthFilter');
  if(month&&!month.value){const d=new Date();month.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  const date=$('#takecareShiftDate');if(date&&!date.value)date.value=ymd(new Date());
  const fullRate=$('#takecareFullDayRate'),halfRate=$('#takecareHalfDayRate');
  if(fullRate)setMoneyInput(fullRate,pricingSettings.takecareFullDayRate||400000);
  if(halfRate)setMoneyInput(halfRate,pricingSettings.takecareHalfDayRate||250000);
  syncTakecareSelects();renderTakecareStaff();renderTakecareSchedule();syncTakecareCostPreview();syncTakecareRateLabels();
}
function renderTakecareStaff(){
  const box=$('#takecareStaffList'),empty=$('#takecareStaffEmpty');if(!box)return;
  const month=tcMonthValue();
  box.innerHTML=takecareStaff.map(person=>{
    const shifts=takecareShifts.filter(s=>String(s.takecare_id)===String(person.id)&&String(s.work_date||'').slice(0,7)===month);
    const total=shifts.reduce((sum,s)=>sum+Number(s.cost_amount||tcRate(s.shift_type)),0);
    return `<div class="takecare-staff-card" data-tc-staff="${person.id}">
      <label><span>Tên</span><input data-tc-field="name" value="${esc(person.name||'')}"></label>
      <label><span>Số điện thoại</span><input data-tc-field="phone" value="${esc(person.phone||'')}"></label>
      <label><span>Ghi chú</span><input data-tc-field="note" value="${esc(person.note||'')}"></label>
      <div class="takecare-staff-actions">
        <button class="tc-save" type="button" data-tc-save="${person.id}">Lưu</button>
        <button class="tc-active ${person.active===false?'inactive':''}" type="button" data-tc-toggle="${person.id}">${person.active===false?'Hiện lại':'Đang hoạt động'}</button>
        <button class="tc-delete" type="button" data-tc-delete="${person.id}">Xóa</button>
      </div>
      <div class="takecare-staff-sub"><span>${shifts.length} ca trong tháng</span><span>${money(total)}</span>${person.active===false?'<span>Đã ẩn</span>':''}</div>
    </div>`;
  }).join('');
  empty.hidden=!!takecareStaff.length;
  $$('[data-tc-save]',box).forEach(btn=>btn.addEventListener('click',()=>saveTakecareStaff(btn.dataset.tcSave)));
  $$('[data-tc-toggle]',box).forEach(btn=>btn.addEventListener('click',()=>toggleTakecareStaff(btn.dataset.tcToggle)));
  $$('[data-tc-delete]',box).forEach(btn=>btn.addEventListener('click',()=>deleteTakecareStaff(btn.dataset.tcDelete)));
}
async function saveTakecareStaff(id){
  const row=$(`[data-tc-staff="${id}"]`);if(!row)return;
  const payload={name:row.querySelector('[data-tc-field="name"]').value.trim(),phone:row.querySelector('[data-tc-field="phone"]').value.trim()||null,note:row.querySelector('[data-tc-field="note"]').value.trim()||null};
  if(!payload.name){alert('Tên Take Care không được để trống.');return}
  try{
    if(demoMode){const p=tcStaffById(id);Object.assign(p,payload);localStorage.setItem('cheese_demo_takecare_staff_v1',JSON.stringify(takecareStaff));renderTakecare();return}
    const {error}=await db.from('takecare_staff').update(payload).eq('id',id);if(error)throw error;await loadAll();switchView('takecare');
  }catch(err){alert('Không lưu được Take Care: '+err.message)}
}
async function toggleTakecareStaff(id){
  const person=tcStaffById(id);if(!person)return;const active=person.active===false;
  try{
    if(demoMode){person.active=active;localStorage.setItem('cheese_demo_takecare_staff_v1',JSON.stringify(takecareStaff));renderTakecare();return}
    const {error}=await db.from('takecare_staff').update({active}).eq('id',id);if(error)throw error;await loadAll();switchView('takecare');
  }catch(err){alert('Không đổi được trạng thái: '+err.message)}
}
async function deleteTakecareStaff(id){
  const person=tcStaffById(id);if(!person)return;
  const hasHistory=takecareShifts.some(s=>String(s.takecare_id)===String(id));
  if(hasHistory){
    alert(`${person.name} đã có lịch làm. Để giữ lịch sử chi phí, hệ thống sẽ ẩn nhân sự này thay vì xóa.`);
    if(person.active!==false)await toggleTakecareStaff(id);return;
  }
  if(!confirm(`Xóa Take Care ${person.name}?`))return;
  try{
    if(demoMode){takecareStaff=takecareStaff.filter(x=>String(x.id)!==String(id));localStorage.setItem('cheese_demo_takecare_staff_v1',JSON.stringify(takecareStaff));renderTakecare();return}
    const {error}=await db.from('takecare_staff').delete().eq('id',id);if(error)throw error;await loadAll();switchView('takecare');
  }catch(err){alert('Không xóa được Take Care: '+err.message)}
}
$('#takecareStaffForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const payload={name:$('#takecareStaffName').value.trim(),phone:$('#takecareStaffPhone').value.trim()||null,note:$('#takecareStaffNote').value.trim()||null,active:true};
  if(!payload.name)return;
  try{
    if(demoMode){takecareStaff.push({id:'tc-'+Date.now(),...payload,created_at:new Date().toISOString()});localStorage.setItem('cheese_demo_takecare_staff_v1',JSON.stringify(takecareStaff));e.currentTarget.reset();renderTakecare();return}
    const {error}=await db.from('takecare_staff').insert(payload);if(error)throw error;e.currentTarget.reset();await loadAll();switchView('takecare');
  }catch(err){alert('Không thêm được Take Care: '+err.message+'\n\nNếu đây là lần đầu dùng mục Take Care, hãy chạy lại supabase-setup.sql.')}
});
function syncTakecareRateLabels(){
  const full=tcRate('full_day'),half=tcRate('half_morning');
  const fullLabel=$('#tcFullRateLabel'),halfLabel=$('#tcHalfRateLabel');
  if(fullLabel)fullLabel.textContent=`× ${money(full)}`;
  if(halfLabel)halfLabel.textContent=`× ${money(half)}`;
  const select=$('#takecareShiftType');
  if(select){
    const labels={
      full_day:`Cả ngày · ${money(full)}`,
      half_morning:`Nửa ngày sáng · ${money(half)}`,
      half_afternoon:`Nửa ngày chiều · ${money(half)}`
    };
    [...select.options].forEach(o=>{if(labels[o.value])o.textContent=labels[o.value]});
  }
}
function syncTakecareRateDraft(){
  const full=moneyInputNumber($('#takecareFullDayRate'),400000),half=moneyInputNumber($('#takecareHalfDayRate'),250000);
  pricingSettings.takecareFullDayRate=full>0?full:400000;
  pricingSettings.takecareHalfDayRate=half>0?half:250000;
  syncTakecareRateLabels();syncTakecareCostPreview();
}
$('#takecareFullDayRate')?.addEventListener('input',syncTakecareRateDraft);
$('#takecareHalfDayRate')?.addEventListener('input',syncTakecareRateDraft);
$('#saveTakecareRates')?.addEventListener('click',async()=>{
  syncTakecareRateDraft();
  const btn=$('#saveTakecareRates'),old=btn.textContent;btn.disabled=true;btn.textContent='Đang lưu...';
  try{
    const full=Number(pricingSettings.takecareFullDayRate||400000),half=Number(pricingSettings.takecareHalfDayRate||250000);
    if(demoMode){
      localStorage.setItem('cheese_demo_pricing_v1',JSON.stringify(pricingSettings));
    }else{
      const {error}=await db.from('site_pricing').upsert({
        id:'main',
        takecare_full_day_rate:full,
        takecare_half_day_rate:half,
        updated_at:new Date().toISOString()
      },{onConflict:'id'});
      if(error)throw error;
    }
    alert(`Đã lưu giá công Take Care:\nCả ngày: ${money(full)}\nNửa ngày: ${money(half)}\n\nLịch cũ giữ nguyên chi phí đã lưu.`);
  }catch(err){
    const msg=String(err.message||'');
    if(/site_pricing|schema cache|Could not find the table/i.test(msg)){
      alert('Supabase chưa có bảng site_pricing. Hãy chạy file SUPABASE-PATCH-PRICING-TAKECARE.sql một lần trong Supabase → SQL Editor, sau đó tải lại Admin.');
    }else alert('Không lưu được giá công Take Care: '+msg);
  }finally{btn.disabled=false;btn.textContent=old}
});
function syncTakecareCostPreview(){const type=$('#takecareShiftType')?.value||'full_day',node=$('#takecareShiftCost');if(node)node.textContent=money(tcRate(type))}
$('#takecareShiftType')?.addEventListener('change',syncTakecareCostPreview);
$('#takecareShiftForm')?.addEventListener('submit',async e=>{
  e.preventDefault();const staffId=$('#takecareShiftStaff').value,date=$('#takecareShiftDate').value,type=$('#takecareShiftType').value,note=$('#takecareShiftNote').value.trim()||null;
  if(!staffId||!date){alert('Hãy chọn Take Care và ngày làm.');return}
  const existing=takecareShifts.find(s=>String(s.takecare_id)===String(staffId)&&s.work_date===date);
  if(existing){alert(`${tcStaffById(staffId)?.name||'Take Care'} đã có ca ${TAKECARE_SHIFT_LABEL[existing.shift_type]||existing.shift_type} ngày ${dateVN(date)}. Mỗi người chỉ có 1 loại ca/ngày.`);return}
  const payload={takecare_id:staffId,work_date:date,shift_type:type,cost_amount:tcRate(type),note};
  try{
    if(demoMode){takecareShifts.push({id:'tcs-'+Date.now(),...payload,created_at:new Date().toISOString()});localStorage.setItem('cheese_demo_takecare_shifts_v1',JSON.stringify(takecareShifts));$('#takecareShiftNote').value='';renderTakecare();return}
    const {error}=await db.from('takecare_shifts').insert(payload);if(error)throw error;$('#takecareShiftNote').value='';await loadAll();switchView('takecare');
  }catch(err){alert('Không thêm được lịch Take Care: '+err.message)}
});
function renderTakecareSchedule(){
  const filtered=tcFilteredShifts(),month=tcMonthValue();
  const allMonth=takecareShifts.filter(s=>String(s.work_date||'').slice(0,7)===month);
  $('#tcStatActive').textContent=takecareStaff.filter(x=>x.active!==false).length;
  $('#tcStatShifts').textContent=allMonth.length;
  $('#tcStatFull').textContent=allMonth.filter(s=>s.shift_type==='full_day').length;
  $('#tcStatHalf').textContent=allMonth.filter(s=>s.shift_type!=='full_day').length;
  $('#tcStatCost').textContent=money(allMonth.reduce((sum,s)=>sum+Number(s.cost_amount||tcRate(s.shift_type)),0));
  const body=$('#takecareShiftRows'),empty=$('#takecareShiftEmpty');
  body.innerHTML=filtered.map(s=>{
    const person=tcStaffById(s.takecare_id);
    return `<tr><td><b>${dateVN(s.work_date)}</b></td><td>${esc(person?.name||'Take Care đã ẩn')}</td><td><span class="tc-shift-pill">${TAKECARE_SHIFT_LABEL[s.shift_type]||esc(s.shift_type)}</span></td><td class="tc-cost">${money(s.cost_amount||tcRate(s.shift_type))}</td><td>${esc(s.note||'—')}</td><td><button class="tc-remove-shift" type="button" data-tc-shift-delete="${s.id}">Xóa</button></td></tr>`;
  }).join('');
  empty.hidden=!!filtered.length;
  $$('[data-tc-shift-delete]',body).forEach(btn=>btn.addEventListener('click',()=>deleteTakecareShift(btn.dataset.tcShiftDelete)));
  renderTakecarePersonSummary(allMonth);
}
function renderTakecarePersonSummary(shifts){
  const box=$('#takecarePersonSummary');if(!box)return;
  const ids=[...new Set(shifts.map(s=>String(s.takecare_id)))];
  box.innerHTML=ids.map(id=>{
    const person=tcStaffById(id),list=shifts.filter(s=>String(s.takecare_id)===id).sort((a,b)=>String(a.work_date).localeCompare(String(b.work_date))),total=list.reduce((sum,s)=>sum+Number(s.cost_amount||tcRate(s.shift_type)),0);
    const dates=list.map(s=>`<span>${dateVN(s.work_date)} · ${TAKECARE_SHIFT_LABEL[s.shift_type]||s.shift_type}</span>`).join('');
    return `<article class="takecare-person-card"><header><div><b>${esc(person?.name||'Take Care đã ẩn')}</b><p>${list.length} ca trong tháng</p></div><strong>${money(total)}</strong></header><div class="takecare-date-tags">${dates}</div></article>`;
  }).join('')||'<div class="empty">Chưa có Take Care làm trong tháng này.</div>';
}
async function deleteTakecareShift(id){
  const shift=takecareShifts.find(s=>String(s.id)===String(id));if(!shift)return;
  if(!confirm(`Xóa lịch ${dateVN(shift.work_date)} của ${tcStaffById(shift.takecare_id)?.name||'Take Care'}?`))return;
  try{
    if(demoMode){takecareShifts=takecareShifts.filter(s=>String(s.id)!==String(id));localStorage.setItem('cheese_demo_takecare_shifts_v1',JSON.stringify(takecareShifts));renderTakecare();return}
    const {error}=await db.from('takecare_shifts').delete().eq('id',id);if(error)throw error;await loadAll();switchView('takecare');
  }catch(err){alert('Không xóa được lịch Take Care: '+err.message)}
}
$('#takecareMonthFilter')?.addEventListener('change',()=>{renderTakecareStaff();renderTakecareSchedule()});
$('#takecareStaffFilter')?.addEventListener('change',renderTakecareSchedule);

// ============================================================
// PRICING CMS — đồng bộ bang-gia.html + lien-he.html
let pricingTeamRows=[];
let pricingProvinceRows=[];

function pricingClone(v){return JSON.parse(JSON.stringify(v||{}))}
function pricingRowsFromSettings(){
  pricingTeamRows=pricingClone(pricingSettings.teamBasePrices||[]);
  const details=pricingSettings.provinceDetails||{};
  pricingProvinceRows=[];
  (pricingSettings.provinceGroups||[]).forEach(group=>{
    (group.items||[]).forEach(([name,fee])=>pricingProvinceRows.push({group:group.label||'',name:name||'',fee:fee||'',note:details[name]||'Tính theo 1 thợ.'}));
  });
}
function renderPricingSettings(){
  const root=$('#teamPriceEditor');if(!root)return;
  pricingRowsFromSettings();
  const reference=$('#pricingReferencePrice');if(reference)setMoneyInput(reference,pricingSettings.referencePriceFrom||1500000);bindMoneyInputs(document);
  renderTeamPriceEditor();renderProvincePriceEditor();
  const label=$('#pricingSyncLabel');if(label)label.textContent=demoMode?'Bảng giá demo lưu trên trình duyệt.':'Bảng giá đang đồng bộ với Supabase.';
}
function renderTeamPriceEditor(){
  const box=$('#teamPriceEditor');if(!box)return;
  box.innerHTML=pricingTeamRows.map((r,i)=>`<div class="pricing-team-row" data-team-row="${i}">
    <label><span>Tên hạng</span><input data-team-field="label" value="${esc(r.label||'')}"></label>
    <label><span>Giá từ</span><input data-team-field="priceFrom" data-money-input="1" type="text" inputmode="numeric" value="${moneyInputText(r.priceFrom||0)}"></label>
    <label><span>Mô tả</span><textarea data-team-field="description">${esc(r.description||'')}</textarea></label>
    <label><span>Ekip liên kết</span><input data-team-field="teams" value="${esc((r.teams||[]).join(', '))}" placeholder="Founder, Ekip 1"></label>
    <button class="pricing-row-remove" type="button" data-team-remove="${i}" aria-label="Xóa">×</button>
  </div>`).join('')||'<div class="empty">Chưa có hạng ekip.</div>';
  $$('[data-team-field]',box).forEach(el=>el.addEventListener('input',()=>{const row=Number(el.closest('[data-team-row]').dataset.teamRow),field=el.dataset.teamField;if(field==='priceFrom')pricingTeamRows[row][field]=moneyInputNumber(el);else if(field==='teams')pricingTeamRows[row][field]=el.value.split(',').map(x=>x.trim()).filter(Boolean);else pricingTeamRows[row][field]=el.value;}));
  $$('[data-team-remove]',box).forEach(btn=>btn.addEventListener('click',()=>{pricingTeamRows.splice(Number(btn.dataset.teamRemove),1);renderTeamPriceEditor()}));bindMoneyInputs(box);
}
function renderProvincePriceEditor(){
  const box=$('#provincePriceEditor');if(!box)return;
  box.innerHTML=pricingProvinceRows.map((r,i)=>`<div class="pricing-province-row" data-province-row="${i}">
    <label><span>Nhóm vùng</span><input data-province-field="group" value="${esc(r.group||'')}"></label>
    <label><span>Tỉnh / khu vực</span><input data-province-field="name" value="${esc(r.name||'')}"></label>
    <label><span>Phụ phí / 1 thợ</span><input data-province-field="fee" value="${esc(r.fee||'')}" placeholder="500.000đ"></label>
    <label><span>Ghi chú</span><textarea data-province-field="note">${esc(r.note||'')}</textarea></label>
    <button class="pricing-row-remove" type="button" data-province-remove="${i}" aria-label="Xóa">×</button>
  </div>`).join('')||'<div class="empty">Chưa có khu vực.</div>';
  $$('[data-province-field]',box).forEach(el=>el.addEventListener('input',()=>{const row=Number(el.closest('[data-province-row]').dataset.provinceRow);pricingProvinceRows[row][el.dataset.provinceField]=el.value;}));
  $$('[data-province-remove]',box).forEach(btn=>btn.addEventListener('click',()=>{pricingProvinceRows.splice(Number(btn.dataset.provinceRemove),1);renderProvincePriceEditor()}));
}
$('#addTeamPrice')?.addEventListener('click',()=>{pricingTeamRows.push({id:'custom-'+Date.now(),label:'Hạng mới',priceFrom:1500000,description:'',teams:[]});renderTeamPriceEditor()});
$('#addProvincePrice')?.addEventListener('click',()=>{pricingProvinceRows.push({group:'Miền Bắc',name:'Khu vực mới',fee:'Liên hệ',note:'Tính theo 1 thợ.'});renderProvincePriceEditor();const rows=$$('.pricing-province-row');rows[rows.length-1]?.querySelector('input')?.focus()});

function collectPricingPayload(){
  const groups=[];const groupMap=new Map();const details={};
  pricingProvinceRows.forEach(row=>{
    const group=String(row.group||'Khu vực khác').trim()||'Khu vực khác';
    const name=String(row.name||'').trim();if(!name)return;
    const fee=String(row.fee||'Liên hệ').trim()||'Liên hệ';
    if(!groupMap.has(group)){const g={label:group,items:[]};groupMap.set(group,g);groups.push(g)}
    groupMap.get(group).items.push([name,fee]);details[name]=String(row.note||'').trim()||'Tính theo 1 thợ.';
  });
  const teams=pricingTeamRows.map((r,i)=>({id:String(r.id||`team-${i+1}`),label:String(r.label||'').trim()||`Hạng ${i+1}`,priceFrom:Number(r.priceFrom||0),description:String(r.description||'').trim(),teams:Array.isArray(r.teams)?r.teams:[]}));
  return {referencePriceFrom:moneyInputNumber($('#pricingReferencePrice'),1500000),teamBasePrices:teams,provinceGroups:groups,provinceDetails:details};
}
$('#savePricingSettings')?.addEventListener('click',async()=>{
  const btn=$('#savePricingSettings'),old=btn.textContent;btn.disabled=true;btn.textContent='Đang lưu...';
  try{
    const payload=collectPricingPayload();
    if(demoMode){localStorage.setItem('cheese_demo_pricing_v1',JSON.stringify(payload));pricingSettings=payload;}
    else{
      const row={id:'main',reference_price_from:payload.referencePriceFrom,team_prices:payload.teamBasePrices,province_groups:payload.provinceGroups,province_details:payload.provinceDetails,takecare_full_day_rate:Number(pricingSettings.takecareFullDayRate||400000),takecare_half_day_rate:Number(pricingSettings.takecareHalfDayRate||250000),updated_at:new Date().toISOString()};
      const {error}=await db.from('site_pricing').upsert(row,{onConflict:'id'});if(error)throw error;
      pricingSettings=payload;
    }
    renderPricingSettings();
    alert('Đã lưu bảng giá và phụ phí. Trang Bảng giá + trang Đặt lịch sẽ dùng dữ liệu mới.');
  }catch(err){const msg=String(err.message||'');if(/site_pricing|schema cache|Could not find the table/i.test(msg))alert('Supabase chưa có bảng site_pricing. Hãy chạy file SUPABASE-PATCH-PRICING-TAKECARE.sql một lần trong Supabase → SQL Editor, sau đó tải lại Admin.');else alert('Không lưu được bảng giá: '+msg);}
  finally{btn.disabled=false;btn.textContent=old}
});

// ============================================================
// FINANCE CONTROL — Founder 0% / đối tác 15% / thợ thường 20%
const financeModal=$('#financeModal');

function financePeriodBookings(){
  const mode=$('#financePeriodMode')?.value||'month';
  const phot=$('#financePhotographerFilter')?.value||'all';
  const type=$('#financeTypeFilter')?.value||'all';
  const monthVal=$('#financeMonth')?.value||'';
  const yearVal=Number($('#financeYear')?.value||new Date().getFullYear());

  return bookings.filter(b=>{
    if(!active(b))return false;
    if(phot!=='all'&&b.photographer!==phot)return false;
    const p=photographerByName(b.photographer);
    const pType=(financeByBooking(b.id)?.photographer_type||p?.photographer_type||'regular');
    if(type!=='all'&&pType!==type)return false;
    if(mode==='all')return true;
    if(!b.shoot_date)return false;
    if(mode==='month')return String(b.shoot_date).slice(0,7)===monthVal;
    return Number(String(b.shoot_date).slice(0,4))===yearVal;
  }).sort((a,b)=>String(b.shoot_date).localeCompare(String(a.shoot_date)));
}

function financeRecordDraftForBooking(b){
  const rec=financeByBooking(b.id);
  if(rec)return rec;
  const p=photographerByName(b.photographer);
  const type=['founder','partner','regular'].includes(p?.photographer_type)?p.photographer_type:'regular';
  return {
    booking_id:b.id,photographer_type:type,commission_rate:photographerCommissionRate(type),
    gross_revenue:0,takecare_cost:0,travel_cost:0,postproduction_cost:0,other_cost:0,
    other_cost_note:'',customer_received:Number(b.deposit_amount||0),photographer_paid:0,note:''
  };
}
function financeTotals(rows){
  return rows.reduce((acc,b)=>{
    const c=financeCalc(b,financeRecordDraftForBooking(b));
    for(const k of ['gross','costs','studioShare','photographerShare','customerReceived','photographerPaid','receivable','photographerPayable','cashHeld','studioNet'])acc[k]+=Number(c[k]||0);
    return acc;
  },{gross:0,costs:0,studioShare:0,photographerShare:0,customerReceived:0,photographerPaid:0,receivable:0,photographerPayable:0,cashHeld:0,studioNet:0});
}
function renderFinance(){
  if(!$('#view-finance'))return;
  const now=new Date();
  const month=$('#financeMonth');if(month&&!month.value)month.value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const year=$('#financeYear');if(year&&!year.value)year.value=now.getFullYear();
  const mode=$('#financePeriodMode')?.value||'month';
  if($('#financeMonthWrap'))$('#financeMonthWrap').hidden=mode!=='month';
  if($('#financeYearWrap'))$('#financeYearWrap').hidden=mode!=='year';

  const rows=financePeriodBookings(),tot=financeTotals(rows);
  $('#finGross').textContent=money(tot.gross);
  $('#finCollected').textContent=money(tot.customerReceived);
  $('#finReceivable').textContent=`Còn phải thu ${money(tot.receivable)}`;
  $('#finStudioShare').textContent=money(tot.studioShare);
  $('#finStudioNet').textContent=`Sau chi phí: ${money(tot.studioNet)}`;
  $('#finPhotographerShare').textContent=money(tot.photographerShare);
  $('#finPhotographerPayable').textContent=`Còn phải trả ${money(tot.photographerPayable)}`;
  $('#finCosts').textContent=money(tot.costs);
  $('#finCashHeld').textContent=money(tot.cashHeld);

  const body=$('#financeRows'),empty=$('#financeEmpty');
  if(!body)return;
  body.innerHTML=rows.map(b=>{
    const rec=financeRecordDraftForBooking(b),c=financeCalc(b,rec);
    const p=photographerByName(b.photographer);
    const saved=!!financeByBooking(b.id);
    return `<tr>
      <td><span class="fin-primary">${dateVN(b.shoot_date)}</span><span class="fin-sub">${esc(b.booking_code||'')} · ${esc(b.customer_name||'')}</span></td>
      <td><span class="fin-primary">${esc(b.photographer||'')}</span><span class="finance-type-pill ${c.type}">${photographerTypeLabel(c.type)} · ${c.rate}%</span></td>
      <td class="fin-money">${money(c.gross)}${!saved?'<span class="fin-sub">Chưa ghi dòng tiền</span>':''}</td>
      <td class="fin-money">${money(c.costs)}<span class="fin-sub">TC ${money(c.takecare)} · Đi ${money(c.travel)}</span></td>
      <td class="fin-money fin-positive">${money(c.studioShare)}<span class="fin-sub">Sau chi phí ${money(c.studioNet)}</span></td>
      <td class="fin-money">${money(c.photographerShare)}</td>
      <td class="fin-money">${money(c.customerReceived)}</td>
      <td class="fin-money">${money(c.photographerPaid)}</td>
      <td class="fin-money ${c.receivable>0?'fin-warning':'fin-positive'}">${money(c.receivable)}</td>
      <td class="fin-money ${c.photographerPayable>0?'fin-warning':'fin-positive'}">${money(c.photographerPayable)}</td>
      <td><button class="finance-edit-btn" type="button" data-finance-booking="${b.id}">${saved?'Sửa dòng tiền':'Nhập dòng tiền'}</button></td>
    </tr>`;
  }).join('');
  empty.hidden=!!rows.length;
  $$('[data-finance-booking]',body).forEach(btn=>btn.addEventListener('click',()=>openFinanceEditor(btn.dataset.financeBooking)));
}
function currentFinanceDraft(){
  return {
    gross_revenue:moneyInputNumber($('#financeGrossRevenue')),
    customer_received:moneyInputNumber($('#financeCustomerReceived')),
    takecare_cost:moneyInputNumber($('#financeTakecareCost')),
    travel_cost:moneyInputNumber($('#financeTravelCost')),
    postproduction_cost:moneyInputNumber($('#financePostCost')),
    other_cost:moneyInputNumber($('#financeOtherCost')),
    photographer_paid:moneyInputNumber($('#financePhotographerPaid'))
  };
}
function renderFinancePreview(){
  if(!activeFinanceBooking)return;
  const p=photographerByName(activeFinanceBooking.photographer);
  const type=['founder','partner','regular'].includes(p?.photographer_type)?p.photographer_type:'regular';
  const rate=photographerCommissionRate(type);
  const c=financeCalc(activeFinanceBooking,{photographer_type:type,commission_rate:rate},currentFinanceDraft());
  $('#financeTypePreview').textContent=photographerTypeLabel(type);
  $('#financeRatePreview').textContent=`${rate}%`;
  $('#financeStudioPreview').textContent=money(c.studioShare);
  $('#financePhotographerPreview').textContent=money(c.photographerShare);
  $('#financeCostPreview').textContent=money(c.costs);
  $('#financeStudioNetPreview').textContent=money(c.studioNet);
  $('#financeReceivablePreview').textContent=money(c.receivable);
  $('#financePayablePreview').textContent=money(c.photographerPayable);
  $('#financeCashPreview').textContent=money(c.cashHeld);
}
function openFinanceEditor(bookingId){
  const b=bookings.find(x=>String(x.id)===String(bookingId));if(!b)return;
  activeFinanceBooking=b;
  const rec=financeRecordDraftForBooking(b);
  $('#financeBookingId').value=b.id;
  $('#financeModalTitle').textContent=`Dòng tiền · ${b.photographer}`;
  $('#financeModalMeta').textContent=`${b.booking_code||'Booking'} · ${b.customer_name||'Khách'} · ${dateVN(b.shoot_date)} · ${b.time_slot||''}`;
  setMoneyInput($('#financeGrossRevenue'),Number(rec.gross_revenue||0)||'');
  setMoneyInput($('#financeCustomerReceived'),Number(rec.customer_received ?? b.deposit_amount ?? 0)||'');
  setMoneyInput($('#financeTakecareCost'),Number(rec.takecare_cost||0)||'');
  setMoneyInput($('#financeTravelCost'),Number(rec.travel_cost||0)||'');
  setMoneyInput($('#financePostCost'),Number(rec.postproduction_cost||0)||'');
  setMoneyInput($('#financeOtherCost'),Number(rec.other_cost||0)||'');
  $('#financeOtherCostNote').value=rec.other_cost_note||'';
  setMoneyInput($('#financePhotographerPaid'),Number(rec.photographer_paid||0)||'');
  $('#financeNote').value=rec.note||'';
  renderFinancePreview();
  financeModal.classList.add('open');financeModal.setAttribute('aria-hidden','false');
}
function closeFinanceEditor(){
  financeModal?.classList.remove('open');financeModal?.setAttribute('aria-hidden','true');activeFinanceBooking=null;
}
$$('[data-finance-close]').forEach(x=>x.addEventListener('click',closeFinanceEditor));
['financeGrossRevenue','financeCustomerReceived','financeTakecareCost','financeTravelCost','financePostCost','financeOtherCost','financePhotographerPaid'].forEach(id=>$('#'+id)?.addEventListener('input',renderFinancePreview));

$('#financeForm')?.addEventListener('submit',async e=>{
  e.preventDefault();if(!activeFinanceBooking||!e.currentTarget.reportValidity())return;
  const p=photographerByName(activeFinanceBooking.photographer);
  const type=['founder','partner','regular'].includes(p?.photographer_type)?p.photographer_type:'regular';
  const rate=photographerCommissionRate(type);
  const payload={
    booking_id:activeFinanceBooking.id,
    photographer_type:type,
    commission_rate:rate,
    gross_revenue:moneyInputNumber($('#financeGrossRevenue')),
    customer_received:moneyInputNumber($('#financeCustomerReceived')),
    takecare_cost:moneyInputNumber($('#financeTakecareCost')),
    travel_cost:moneyInputNumber($('#financeTravelCost')),
    postproduction_cost:moneyInputNumber($('#financePostCost')),
    other_cost:moneyInputNumber($('#financeOtherCost')),
    other_cost_note:$('#financeOtherCostNote').value.trim()||null,
    photographer_paid:moneyInputNumber($('#financePhotographerPaid')),
    note:$('#financeNote').value.trim()||null,
    updated_at:new Date().toISOString()
  };
  try{
    if(demoMode){
      const existing=financeByBooking(payload.booking_id);
      if(existing)Object.assign(existing,payload);else financeRecords.push({id:'fin-'+Date.now(),created_at:new Date().toISOString(),...payload});
      localStorage.setItem('cheese_demo_finance_v1',JSON.stringify(financeRecords));
    }else{
      const {error}=await db.from('booking_finance').upsert(payload,{onConflict:'booking_id'});
      if(error)throw error;
    }
    closeFinanceEditor();await loadAll();switchView('finance');
  }catch(err){
    const msg=String(err.message||'');
    if(/booking_finance|photographer_type|schema cache|Could not find/i.test(msg)){
      alert('Supabase chưa có cấu trúc Dòng tiền. Hãy chạy file SUPABASE-PATCH-FINANCE.sql một lần trong Supabase → SQL Editor, sau đó tải lại Admin.');
    }else alert('Không lưu được dòng tiền: '+msg);
  }
});
$('#financeReset')?.addEventListener('click',async()=>{
  if(!activeFinanceBooking)return;
  const existing=financeByBooking(activeFinanceBooking.id);
  if(!existing){
    $('#financeGrossRevenue').value='';
    setMoneyInput($('#financeCustomerReceived'),Number(activeFinanceBooking.deposit_amount||0)||'');
    $('#financeTakecareCost').value='';$('#financeTravelCost').value='';$('#financePostCost').value='';$('#financeOtherCost').value='';
    $('#financeOtherCostNote').value='';$('#financePhotographerPaid').value='';$('#financeNote').value='';
    renderFinancePreview();return;
  }
  if(!confirm('Xóa toàn bộ dữ liệu dòng tiền đã nhập của buổi chụp này?'))return;
  try{
    if(demoMode){
      financeRecords=financeRecords.filter(x=>String(x.booking_id)!==String(activeFinanceBooking.id));
      localStorage.setItem('cheese_demo_finance_v1',JSON.stringify(financeRecords));
    }else{
      const {error}=await db.from('booking_finance').delete().eq('booking_id',activeFinanceBooking.id);if(error)throw error;
    }
    closeFinanceEditor();await loadAll();switchView('finance');
  }catch(err){alert('Không đặt lại được dòng tiền: '+err.message)}
});

$('#financePeriodMode')?.addEventListener('change',renderFinance);
$('#financeMonth')?.addEventListener('change',renderFinance);
$('#financeYear')?.addEventListener('change',renderFinance);
$('#financePhotographerFilter')?.addEventListener('change',renderFinance);
$('#financeTypeFilter')?.addEventListener('change',renderFinance);
$('#financeReload')?.addEventListener('click',async()=>{await loadAll();switchView('finance')});

// ============================================================
let editorGallery=[];
let editorPhotos=['','','','',''];
let editorPhotoFiles=[null,null,null,null,null];
let editorServices=[];
const photographerModal=$('#photographerEditorModal');
const photographerForm=$('#photographerEditorForm');
const slugify=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const photographerPriceText=p=>String(p.price_label||'').trim()||(Number(p.price_amount||0)>0?money(p.price_amount):'Liên hệ');

function renderPhotographers(){
  const grid=$('#photographerAdminGrid');if(!grid)return;
  const rows=[...photographers].sort((a,b)=>(a.sort_order||100)-(b.sort_order||100));
  grid.innerHTML=rows.map(p=>`<article class="photographer-admin-card">
    <div class="photographer-admin-cover" style="${p.cover_url?`background-image:url('${esc(p.cover_url)}')`:''}"><span class="photographer-admin-status ${p.active===false?'off':''}">${p.active===false?'Đang ẩn':'Đang hiện'}</span></div>
    <div class="photographer-admin-body"><h3>${esc(p.name)}</h3><div class="photographer-admin-meta">${esc(p.team||'Chưa chia ekip')} · ${esc(p.style||'Chưa có phong cách')}</div><span class="photographer-admin-type ${['founder','partner','regular'].includes(p.photographer_type)?p.photographer_type:'regular'}">${p.photographer_type==='founder'?'Founder · STU 0%':(p.photographer_type==='partner'?'Đối tác · STU 15%':'Thường · STU 20%')}</span><div class="photographer-admin-profilemeta"><span>${esc(p.location_text||'Hà Nội')}</span><span>${Math.min(5,(p.cover_url?1:0)+(p.gallery_urls||[]).length)} ảnh hồ sơ</span><span>${p.drive_url?'Có Drive':'Chưa có Drive'}</span></div><div class="photographer-admin-thumbs">${[p.cover_url,...(p.gallery_urls||[])].slice(0,5).concat(Array(5).fill('')).slice(0,5).map(u=>u?`<img src="${esc(u)}" alt="">`:'<span></span>').join('')}</div><div class="photographer-admin-tags">${(p.tags||[]).slice(0,4).map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="photographer-admin-price"><small>Giá từ</small><strong>${esc(photographerPriceText(p))}</strong></div><button class="photographer-edit-btn" type="button" data-photographer-id="${p.id}">Sửa nội dung khách thấy</button><button class="photographer-edit-btn crew-account-btn" type="button" data-crew-account="${p.id}">Tài khoản đăng nhập</button></div>
  </article>`).join('');
  $('#photographerAdminEmpty').hidden=!!rows.length;
  $$('[data-crew-account]',grid).forEach(btn=>btn.addEventListener('click',()=>openCrewAccount(btn.dataset.crewAccount)));
  $$('[data-photographer-id]',grid).forEach(btn=>btn.addEventListener('click',()=>openPhotographerEditor(btn.dataset.photographerId)));
}
function normalizeEditorPhotos(){
  const values=editorPhotos.filter((u,i)=>String(u||'').trim() || editorPhotoFiles[i]);
  const files=editorPhotoFiles.filter((f,i)=>String(editorPhotos[i]||'').trim() || f);
  editorPhotos=[...values,'','','','',''].slice(0,5);
  editorPhotoFiles=[...files,null,null,null,null,null].slice(0,5);
}

const PHOTO_MAX_SOURCE_BYTES=50*1024*1024;
const PHOTO_DIRECT_BYTES=1.65*1024*1024;
const PHOTO_MAX_DIMENSION=2200;
const PHOTO_OUTPUT_QUALITY=.82;
const PHOTO_UPLOAD_HARD_LIMIT=12*1024*1024;

function formatFileSize(bytes){
  const n=Number(bytes||0);
  if(n<1024)return `${n} B`;
  if(n<1024*1024)return `${(n/1024).toFixed(1)} KB`;
  return `${(n/1024/1024).toFixed(1)} MB`;
}

async function decodePhotographerImage(file){
  if('createImageBitmap' in window){
    try{return await createImageBitmap(file,{imageOrientation:'from-image'})}
    catch(_){}
  }
  return await new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Không đọc được file ảnh này. Hãy thử JPG, PNG hoặc WEBP.'))};
    img.src=url;
  });
}

async function canvasToBlob(canvas,type,quality){
  return await new Promise(resolve=>canvas.toBlob(resolve,type,quality));
}

async function optimizePhotographerImage(file){
  if(!file || !String(file.type||'').startsWith('image/'))throw new Error('File đã chọn không phải ảnh.');
  if(file.size>PHOTO_MAX_SOURCE_BYTES)throw new Error(`Ảnh ${file.name} quá lớn (${formatFileSize(file.size)}). Hãy chọn ảnh nhỏ hơn 50 MB.`);

  const image=await decodePhotographerImage(file);
  const width=Number(image.width||image.naturalWidth||0);
  const height=Number(image.height||image.naturalHeight||0);
  if(!width||!height){
    if(typeof image.close==='function')image.close();
    throw new Error('Không xác định được kích thước ảnh.');
  }

  const longest=Math.max(width,height);
  const needsResize=longest>PHOTO_MAX_DIMENSION;
  const needsCompress=file.size>PHOTO_DIRECT_BYTES;

  /* Luôn xuất WebP tối ưu để website nhẹ hơn, kể cả ảnh nguồn đã nhỏ. */

  let scale=Math.min(1,PHOTO_MAX_DIMENSION/longest);
  let targetW=Math.max(1,Math.round(width*scale));
  let targetH=Math.max(1,Math.round(height*scale));
  let blob=null;
  let quality=PHOTO_OUTPUT_QUALITY;

  for(let attempt=0;attempt<4;attempt++){
    const canvas=document.createElement('canvas');
    canvas.width=targetW;canvas.height=targetH;
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx){
      if(typeof image.close==='function')image.close();
      throw new Error('Trình duyệt không thể xử lý ảnh này.');
    }
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(image,0,0,targetW,targetH);
    blob=await canvasToBlob(canvas,'image/webp',quality);
    canvas.width=1;canvas.height=1;
    if(blob && blob.size<=PHOTO_DIRECT_BYTES)break;
    targetW=Math.max(1200,Math.round(targetW*.84));
    targetH=Math.max(1200,Math.round(targetH*.84));
    quality=Math.max(.72,quality-.05);
  }

  if(typeof image.close==='function')image.close();
  if(!blob)throw new Error('Không thể tối ưu ảnh. Hãy thử đổi ảnh sang JPG hoặc WEBP.');

  const base=(file.name||'photo').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'photo';
  const optimized=new File([blob],`${base}.webp`,{type:'image/webp',lastModified:Date.now()});
  if(optimized.size>PHOTO_UPLOAD_HARD_LIMIT){
    throw new Error(`Ảnh sau tối ưu vẫn còn ${formatFileSize(optimized.size)}. Hãy dùng ảnh có kích thước nhỏ hơn.`);
  }
  return {file:optimized,optimized:true,originalSize:file.size,width:targetW,height:targetH};
}

function renderEditorGallery(){
  const box=$('#photographerPhotoSlots');if(!box)return;
  editorPhotos=[...editorPhotos,'','','','',''].slice(0,5);
  editorPhotoFiles=[...editorPhotoFiles,null,null,null,null,null].slice(0,5);
  box.innerHTML=editorPhotos.map((url,i)=>{
    const file=editorPhotoFiles[i];
    const preview=file?URL.createObjectURL(file):String(url||'').trim();
    return `<div class="photographer-photo-slot ${i===0?'is-main':''}" data-photo-slot="${i}">
      <div class="photographer-photo-slot-head"><b>Ảnh ${i+1}</b><span>${i===0?'Ảnh chính':'Ảnh vuốt'}</span></div>
      <div class="photographer-photo-preview ${preview?'has-image':''}" data-photo-preview="${i}" style="${preview?`background-image:url('${esc(preview)}')`:''}">${preview?'':'Chưa có ảnh'}</div>
      <input class="photographer-photo-url" data-photo-url="${i}" value="${esc(url||'')}" placeholder="Dán URL ảnh">
      <div class="photographer-photo-actions">
        <label class="photographer-photo-pick">${preview?'Thay ảnh':'Chọn ảnh'}<input data-photo-file="${i}" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label>
        <button class="photographer-photo-remove" data-photo-remove="${i}" type="button" title="Xóa ảnh">×</button>
      </div>
      <div class="photographer-photo-order"><button data-photo-left="${i}" type="button" ${i===0?'disabled':''}>←</button><button data-photo-right="${i}" type="button" ${i===4?'disabled':''}>→</button></div>
    </div>`;
  }).join('');
  const count=editorPhotos.reduce((n,u,i)=>n+(String(u||'').trim()||editorPhotoFiles[i]?1:0),0);
  const counter=$('#photographerPhotoCounter');if(counter)counter.innerHTML=`Đang có <b>${count} / 5</b> ảnh. Ảnh 1 là ảnh chính. Sau khi chọn ảnh từ máy, bấm <b>Lưu thay đổi</b> để upload.`;
  $$('[data-photo-url]',box).forEach(el=>el.addEventListener('input',()=>{const i=Number(el.dataset.photoUrl);editorPhotos[i]=el.value.trim();editorPhotoFiles[i]=null;const prev=box.querySelector(`[data-photo-preview="${i}"]`);if(prev){prev.style.backgroundImage=editorPhotos[i]?`url("${editorPhotos[i].replace(/"/g,'%22')}")`:'';prev.textContent=editorPhotos[i]?'':'Chưa có ảnh';prev.classList.toggle('has-image',!!editorPhotos[i])}}));
  $$('[data-photo-file]',box).forEach(el=>el.addEventListener('change',async()=>{
    const i=Number(el.dataset.photoFile),source=el.files?.[0];if(!source)return;
    const pick=el.closest('.photographer-photo-pick');
    const counter=$('#photographerPhotoCounter');
    if(pick){pick.classList.add('is-processing');pick.childNodes[0].nodeValue='Đang tối ưu...'}
    el.disabled=true;
    try{
      const result=await optimizePhotographerImage(source);
      editorPhotoFiles[i]=result.file;
      const prev=box.querySelector(`[data-photo-preview="${i}"]`);
      const u=URL.createObjectURL(result.file);
      prev.style.backgroundImage=`url("${u}")`;prev.textContent='';prev.classList.add('has-image');
      if(pick)pick.childNodes[0].nodeValue='Thay ảnh';
      const count=editorPhotos.reduce((n,u,j)=>n+(String(u||'').trim()||editorPhotoFiles[j]?1:0),0);
      if(counter){
        const sizeText=result.optimized
          ? `Đã tự tối ưu <b>${formatFileSize(result.originalSize)} → ${formatFileSize(result.file.size)}</b>.`
          : `Dung lượng ảnh <b>${formatFileSize(result.file.size)}</b>.`;
        counter.innerHTML=`Đang có <b>${count} / 5</b> ảnh. ${sizeText} Bấm <b>Lưu thay đổi</b> để upload.`;
      }
    }catch(err){
      editorPhotoFiles[i]=null;el.value='';
      if(pick)pick.childNodes[0].nodeValue=editorPhotos[i]?'Thay ảnh':'Chọn ảnh';
      alert('Không dùng được ảnh này: '+err.message);
    }finally{
      el.disabled=false;if(pick)pick.classList.remove('is-processing');
    }
  }));
  $$('[data-photo-remove]',box).forEach(el=>el.addEventListener('click',()=>{const i=Number(el.dataset.photoRemove);editorPhotos[i]='';editorPhotoFiles[i]=null;normalizeEditorPhotos();renderEditorGallery()}));
  $$('[data-photo-left]',box).forEach(el=>el.addEventListener('click',()=>{const i=Number(el.dataset.photoLeft);if(i<1)return;[editorPhotos[i-1],editorPhotos[i]]=[editorPhotos[i],editorPhotos[i-1]];[editorPhotoFiles[i-1],editorPhotoFiles[i]]=[editorPhotoFiles[i],editorPhotoFiles[i-1]];renderEditorGallery()}));
  $$('[data-photo-right]',box).forEach(el=>el.addEventListener('click',()=>{const i=Number(el.dataset.photoRight);if(i>3)return;[editorPhotos[i+1],editorPhotos[i]]=[editorPhotos[i],editorPhotos[i+1]];[editorPhotoFiles[i+1],editorPhotoFiles[i]]=[editorPhotoFiles[i],editorPhotoFiles[i+1]];renderEditorGallery()}));
}

function normalizedServices(value){
  if(!Array.isArray(value)||!value.length)return DEFAULT_SERVICES.map(x=>({...x}));
  return value.map(x=>typeof x==='string'?{name:x,value:'Cần xác nhận'}:{name:String(x?.name||''),value:String(x?.value||'Cần xác nhận')}).filter(x=>x.name);
}
function renderEditorServices(){
  const box=$('#photographerServicesEditor');if(!box)return;
  box.innerHTML=editorServices.map((item,i)=>`<div class="photographer-service-row" data-service-row="${i}">
    <label><span>Tên dịch vụ</span><input data-service-name="${i}" value="${esc(item.name)}" placeholder="VD: Trợ lý đi cùng"></label>
    <label><span>Nhãn / giá</span><input data-service-value="${i}" value="${esc(item.value||'')}" placeholder="VD: Miễn phí / +300.000đ"></label>
    <button class="photographer-service-remove" type="button" data-service-remove="${i}" aria-label="Xóa dịch vụ">×</button>
  </div>`).join('')||'<div class="empty">Chưa có dịch vụ đi kèm.</div>';
  $$('[data-service-name]',box).forEach(el=>el.addEventListener('input',()=>{editorServices[Number(el.dataset.serviceName)].name=el.value}));
  $$('[data-service-value]',box).forEach(el=>el.addEventListener('input',()=>{editorServices[Number(el.dataset.serviceValue)].value=el.value}));
  $$('[data-service-remove]',box).forEach(el=>el.addEventListener('click',()=>{editorServices.splice(Number(el.dataset.serviceRemove),1);renderEditorServices()}));
}
$('#addPhotographerService')?.addEventListener('click',()=>{editorServices.push({name:'',value:'Cần xác nhận'});renderEditorServices();const rows=$$('.photographer-service-row');rows[rows.length-1]?.querySelector('input')?.focus()});

function syncPhotographerTypeRate(){
  const type=$('#photographerType')?.value||'regular';
  const node=$('#photographerTypeRate');
  if(node)node.textContent=`STU nhận ${photographerCommissionRate(type)}% · Photographer nhận ${100-photographerCommissionRate(type)}%`;
}
$('#photographerType')?.addEventListener('change',syncPhotographerTypeRate);

function openPhotographerEditor(id=null){
  const item=id?photographers.find(p=>String(p.id)===String(id)):null;
  photographerForm.reset();
  $('#photographerEditorId').value=item?.id||'';
  $('#photographerName').value=item?.name||'';
  $('#photographerSlug').value=item?.slug||'';
  $('#photographerSlug').readOnly=!!item;
  $('#photographerTeam').value=item?.team||'';
  $('#photographerType').value=item?.photographer_type||'regular';
  syncPhotographerTypeRate();
  $('#photographerLocation').value=item?.location_text||'Hà Nội';
  setMoneyInput($('#photographerPrice'),Number(item?.price_amount||0)||'');
  $('#photographerPriceLabel').value=item?.price_label||'';
  const yb=item?.yearbook_prices||{};
  const fallbackBase=Number(item?.price_amount||0);
  for(let n=1;n<=5;n++)setMoneyInput($('#yearbookPrice'+n),Number(yb[String(n)]??(fallbackBase?fallbackBase+(n-1)*300000:0))||'');
  const gp=item?.graduation_prices||{};
  setMoneyInput($('#graduationPriceCeremony'),Number(gp.ceremony??1700000)||'');
  setMoneyInput($('#graduationPricePregrad'),Number(gp.pregrad??2000000)||'');
  setMoneyInput($('#graduationPricePregradPlus'),Number(gp['pregrad-plus']??2500000)||'');
  setMoneyInput($('#graduationExtraPerPerson'),Number(item?.graduation_extra_per_person??300000)||0);
  editorServices=normalizedServices(item?.services);renderEditorServices();
  $('#photographerStyle').value=item?.style||'';
  $('#photographerTags').value=(item?.tags||[]).join(', ');
  $('#photographerBio').value=item?.bio||'';
  $('#photographerDriveUrl').value=item?.drive_url||'';
  $('#photographerRating').value=item?.rating??'';
  $('#photographerShoots').value=Number(item?.shoots_count||0);
  $('#photographerSort').value=Number(item?.sort_order||100);
  $('#photographerActive').checked=item?item.active!==false:true;
  editorPhotos=[item?.cover_url||'',...(item?.gallery_urls||[]).slice(0,4)];
  editorPhotos=[...editorPhotos,'','','','',''].slice(0,5);
  editorPhotoFiles=[null,null,null,null,null];
  editorGallery=editorPhotos.slice(1).filter(Boolean);
  renderEditorGallery();
  $('#photographerEditorTitle').textContent=item?`Sửa ${item.name}`:'Thêm photographer';
  $('#deletePhotographer').hidden=!item;
  photographerModal.classList.add('open');photographerModal.setAttribute('aria-hidden','false');
}
function closePhotographerEditor(){photographerModal.classList.remove('open');photographerModal.setAttribute('aria-hidden','true')}
$('#addPhotographer')?.addEventListener('click',()=>openPhotographerEditor());
$$('[data-photographer-close]').forEach(x=>x.addEventListener('click',closePhotographerEditor));
$('#photographerName')?.addEventListener('input',()=>{if(!$('#photographerEditorId').value)$('#photographerSlug').value=slugify($('#photographerName').value)});

async function uploadPhotographerImage(file,slug,kind='gallery'){
  let uploadFile=(await optimizePhotographerImage(file)).file;
  if(uploadFile.size>PHOTO_UPLOAD_HARD_LIMIT){
    throw new Error(`Ảnh còn quá lớn (${formatFileSize(uploadFile.size)}). Giới hạn an toàn hiện tại là ${formatFileSize(PHOTO_UPLOAD_HARD_LIMIT)}.`);
  }
  const ext=(uploadFile.name.split('.').pop()||'webp').toLowerCase().replace(/[^a-z0-9]/g,'')||'webp';
  const path=`${slug}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const {error}=await db.storage.from('photographers').upload(path,uploadFile,{contentType:uploadFile.type||undefined,upsert:false});
  if(error){
    const msg=String(error.message||'');
    if(/maximum allowed size|too large|entity too large/i.test(msg)){
      throw new Error(`Ảnh vượt giới hạn Supabase. Ảnh đang upload: ${formatFileSize(uploadFile.size)}. Hãy kiểm tra Storage → photographers → Edit bucket → File size limit.`);
    }
    throw error;
  }
  return db.storage.from('photographers').getPublicUrl(path).data.publicUrl;
}

photographerForm?.addEventListener('submit',async e=>{
  e.preventDefault();if(!photographerForm.reportValidity())return;
  const id=$('#photographerEditorId').value;
  const slug=slugify($('#photographerSlug').value||$('#photographerName').value);
  const payload={
    slug,name:$('#photographerName').value.trim(),team:$('#photographerTeam').value.trim()||null,
    photographer_type:['founder','partner','regular'].includes($('#photographerType').value)?$('#photographerType').value:'regular',
    location_text:$('#photographerLocation').value.trim()||'Hà Nội',
    drive_url:$('#photographerDriveUrl').value.trim()||null,
    price_amount:moneyInputNumber($('#yearbookPrice1'))||moneyInputNumber($('#photographerPrice')),price_label:$('#photographerPriceLabel').value.trim()||null,
    yearbook_prices:{'1':moneyInputNumber($('#yearbookPrice1')),'2':moneyInputNumber($('#yearbookPrice2')),'3':moneyInputNumber($('#yearbookPrice3')),'4':moneyInputNumber($('#yearbookPrice4')),'5':moneyInputNumber($('#yearbookPrice5'))},
    graduation_prices:{ceremony:moneyInputNumber($('#graduationPriceCeremony')),pregrad:moneyInputNumber($('#graduationPricePregrad')),'pregrad-plus':moneyInputNumber($('#graduationPricePregradPlus'))},
    graduation_extra_per_person:moneyInputNumber($('#graduationExtraPerPerson')),
    services:editorServices.map(x=>({name:String(x.name||'').trim(),value:String(x.value||'').trim()||'Cần xác nhận'})).filter(x=>x.name),
    style:$('#photographerStyle').value.trim()||null,bio:$('#photographerBio').value.trim()||null,
    tags:$('#photographerTags').value.split(',').map(x=>x.trim()).filter(Boolean),
    rating:$('#photographerRating').value===''?null:Number($('#photographerRating').value),shoots_count:Number($('#photographerShoots').value||0),sort_order:Number($('#photographerSort').value||100),
    active:$('#photographerActive').checked,cover_url:null,gallery_urls:[]
  };
  const save=$('#savePhotographer'),old=save.textContent;save.disabled=true;save.textContent='Đang lưu...';
  try{
    const resolved=[];
    for(let i=0;i<5;i++){
      if(editorPhotoFiles[i]){
        resolved[i]=demoMode?URL.createObjectURL(editorPhotoFiles[i]):await uploadPhotographerImage(editorPhotoFiles[i],slug,i===0?'cover':`gallery-${i+1}`);
      }else resolved[i]=String(editorPhotos[i]||'').trim();
    }
    const compact=resolved.filter(Boolean).slice(0,5);
    payload.cover_url=compact[0]||null;
    payload.gallery_urls=compact.slice(1,5);
    if(demoMode){
      if(id)photographers=photographers.map(p=>String(p.id)===String(id)?{...p,...payload}:p);else photographers.push({id:'demo-'+Date.now(),created_at:new Date().toISOString(),...payload});
      localStorage.setItem('cheese_demo_photographers_v2',JSON.stringify(photographers));
    }else{
      let result=id?await db.from('photographers').update(payload).eq('id',id):await db.from('photographers').insert(payload);if(result.error)throw result.error;
    }
    closePhotographerEditor();await loadAll();switchView('photographers');
  }catch(err){alert('Không lưu được photographer: '+err.message)}finally{save.disabled=false;save.textContent=old}
});

$('#deletePhotographer')?.addEventListener('click',async()=>{
  const id=$('#photographerEditorId').value;if(!id)return;
  const p=photographers.find(x=>String(x.id)===String(id));if(!confirm(`Xóa ${p?.name||'photographer'}? Nếu thợ đã có booking, Supabase sẽ không cho xóa để bảo toàn lịch sử.`))return;
  try{
    if(demoMode){photographers=photographers.filter(x=>String(x.id)!==String(id));localStorage.setItem('cheese_demo_photographers_v2',JSON.stringify(photographers))}
    else{const {error}=await db.from('photographers').delete().eq('id',id);if(error)throw error}
    closePhotographerEditor();await loadAll();
  }catch(err){alert('Không thể xóa thợ này vì có thể đang liên kết với booking/lịch. Hãy bỏ chọn “Hiển thị photographer trên website” để ẩn thợ thay vì xóa.\n\n'+err.message)}
});
function notificationLabel(b){
  return `${b.customer_name || 'Khách mới'} · ${b.photographer || 'Photographer'} · ${dateVN(b.shoot_date)} ${b.time_slot || ''}`;
}

function renderNotificationCenter(){
  const badge=$('#notificationBadge'), list=$('#notifyList');
  if(!badge||!list)return;
  badge.hidden=unreadNotifications.length===0;
  badge.textContent=unreadNotifications.length>99?'99+':String(unreadNotifications.length);
  if(!unreadNotifications.length){
    list.innerHTML='<div class="notify-empty">Chưa có thông báo mới.</div>';
    return;
  }
  list.innerHTML=unreadNotifications.map((b,i)=>`
    <div class="notify-item new" data-notify-id="${esc(b.id)}">
      <b>${esc(b.booking_code || 'Booking mới')}</b>
      <p>${esc(notificationLabel(b))}</p>
      <small>${esc(b.phone || '')}</small>
    </div>`).join('');
  $$('.notify-item[data-notify-id]',list).forEach(el=>el.addEventListener('click',()=>{
    $('#notifyPopover').classList.remove('open');
    switchView('bookings');
    openDrawer(el.dataset.notifyId);
  }));
}

function playBookingChime(){
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return;
    const ctx=new AudioCtx(), now=ctx.currentTime;
    [659.25,783.99,987.77].forEach((freq,i)=>{
      const osc=ctx.createOscillator(), gain=ctx.createGain();
      osc.type='sine';osc.frequency.value=freq;
      gain.gain.setValueAtTime(0.0001,now+i*.11);
      gain.gain.exponentialRampToValueAtTime(.08,now+i*.11+.015);
      gain.gain.exponentialRampToValueAtTime(.0001,now+i*.11+.22);
      osc.connect(gain);gain.connect(ctx.destination);
      osc.start(now+i*.11);osc.stop(now+i*.11+.24);
    });
    setTimeout(()=>ctx.close?.(),900);
  }catch(e){}
}

function showRealtimeToast(b){
  const stack=$('#realtimeToastStack');if(!stack)return;
  const toast=document.createElement('div');
  toast.className='realtime-toast';
  toast.innerHTML=`<b>🔔 BOOKING MỚI · ${esc(b.booking_code || '')}</b>
    <p>${esc(b.customer_name || '')} · ${esc(b.phone || '')}<br>${esc(b.photographer || '')} · ${dateVN(b.shoot_date)} · ${esc(b.time_slot || '')}</p>
    <button type="button">Mở booking</button>`;
  stack.appendChild(toast);
  requestAnimationFrame(()=>toast.classList.add('show'));
  toast.querySelector('button').addEventListener('click',()=>{
    switchView('bookings');openDrawer(b.id);toast.remove();
  });
  setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),300)},10000);
}

function browserNotify(b){
  if(!('Notification'in window)||Notification.permission!=='granted')return;
  try{
    const n=new Notification(`Booking mới · ${b.booking_code || 'Cheese.Graduation'}`,{
      body:`${notificationLabel(b)}\n${b.phone || ''}`,
      tag:`cheese-booking-${b.id || b.booking_code}`,
      renotify:true
    });
    n.onclick=()=>{window.focus();switchView('bookings');openDrawer(b.id);n.close()};
  }catch(e){}
}

async function handleRealtimeBooking(b){
  if(!b||!b.id)return;
  if(!bookings.some(x=>x.id===b.id))bookings.unshift(b);
  unreadNotifications.unshift(b);
  unreadNotifications=unreadNotifications.slice(0,50);
  renderAll();renderNotificationCenter();
  playBookingChime();showRealtimeToast(b);browserNotify(b);
}

function startRealtimeNotifications(){
  if(!db||notificationsStarted)return;
  notificationsStarted=true;
  realtimeChannel=db.channel('cheese-admin-bookings')
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'bookings'},payload=>{
      handleRealtimeBooking(payload.new);
    })
    .subscribe(status=>{
      if(status==='SUBSCRIBED')$('#syncStatus').textContent='Realtime đang hoạt động';
      if(status==='CHANNEL_ERROR')$('#syncStatus').textContent='Realtime lỗi kết nối';
    });
}

$('#adminBell')?.addEventListener('click',()=>$('#notifyPopover').classList.toggle('open'));
$('#clearNotifications')?.addEventListener('click',()=>{
  unreadNotifications=[];renderNotificationCenter();$('#notifyPopover').classList.remove('open');
});
document.addEventListener('click',e=>{
  const pop=$('#notifyPopover'),bell=$('#adminBell');
  if(pop?.classList.contains('open')&&!pop.contains(e.target)&&!bell?.contains(e.target))pop.classList.remove('open');
});
$('#enableNotifications')?.addEventListener('click',async()=>{
  if(!('Notification'in window)){alert('Trình duyệt này không hỗ trợ thông báo hệ thống.');return}
  const permission=await Notification.requestPermission();
  $('#enableNotifications').textContent=permission==='granted'?'Thông báo đã bật':'Bật thông báo';
});
renderNotificationCenter();


// Crew accounts use a privileged server endpoint after admin authorization.
let crewAccountId=null, crewAccountEpoch=0, crewConfirmBusy=false;
function crewConfirmationBadge(item){return `<span class="crew-confirm-badge ${item.photographer_confirmed_at?'yes':'no'}">${item.photographer_confirmed_at?'✓ Thợ đã xác nhận':'◷ Thợ chưa xác nhận'}</span>`;}
function renderCrewConfirmations(){
 const box=$('#crewConfirmationList');if(!box)return;
 const filter=$('#crewConfirmationFilter').value;
 const rows=[...bookings.filter(b=>!['cancelled','rejected'].includes(b.status)).map(b=>({...b,kind:'booking',day:b.shoot_date,title:b.customer_name})),...manualEvents.map(e=>({...e,kind:'manual',day:e.event_date}))]
 .filter(x=>filter==='all'||(filter==='confirmed'?!!x.photographer_confirmed_at:!x.photographer_confirmed_at))
 .sort((a,b)=>String(b.day).localeCompare(String(a.day)));
 box.innerHTML=rows.length?rows.map(x=>`<div class="crew-confirm-row"><div><strong>${esc(x.photographer)} · ${esc(x.title)}</strong><small>${dateVN(x.day)} · ${esc(x.time_slot)}${x.booking_code?' · '+esc(x.booking_code):''}</small></div><div>${crewConfirmationBadge(x)}${x.photographer_confirmed_at?`<small>${dateTimeVN(x.photographer_confirmed_at)}</small>`:''}</div><button type="button" data-crew-open="${x.id}" data-kind="${x.kind}">Xem lịch</button></div>`).join(''):'<div class="empty">Không có lịch trong nhóm này.</div>';
 $$('[data-crew-open]',box).forEach(btn=>btn.addEventListener('click',()=>btn.dataset.kind==='booking'?openDrawer(btn.dataset.crewOpen):openManualEvent(btn.dataset.crewOpen)));
}
async function syncCrewConfirmations(){
 if(!db||demoMode||crewConfirmBusy||$('#loginScreen').style.display!=='none')return;
 crewConfirmBusy=true;
 try{
  const responses=await Promise.all([db.from('bookings').select('id,photographer_confirmed_at,photographer_confirmed_by,schedule_revision'),db.from('calendar_events').select('id,photographer_confirmed_at,photographer_confirmed_by,schedule_revision')]);
  if(responses.some(r=>r.error))throw Error('sync');
  [bookings,manualEvents].forEach((list,i)=>{const updates=new Map(responses[i].data.map(x=>[String(x.id),x]));list.forEach(x=>{const update=updates.get(String(x.id));if(update)Object.assign(x,update);});});
  renderCrewConfirmations();renderRecent();renderBookings();renderCalendar();if(selectedDay)renderDayPanel(selectedDay);
  $('#crewConfirmSync').textContent='Cập nhật xác nhận lúc '+new Date().toLocaleTimeString('vi-VN');
 }catch{ $('#crewConfirmSync').textContent='Chưa đồng bộ được xác nhận. Kiểm tra kết nối hoặc bản cập nhật Supabase.'; }
 finally{crewConfirmBusy=false;}
}
async function openCrewAccount(id){
 const p=photographers.find(p=>p.id===id);if(!p)return;
 const epoch=++crewAccountEpoch;crewAccountId=id;
 $('#crewAccountForm').reset();$('#crewAccountEmail').readOnly=false;$('#crewAccountSave').disabled=true;$('#crewAccountMessage').textContent='';
 $('#crewAccountTitle').textContent='Tài khoản · '+p.name;$('#crewAccountInfo').textContent='Đang kiểm tra tài khoản…';$('#crewAccountDialog').showModal();
 if(demoMode){$('#crewAccountInfo').textContent='Đang xem thử. Đăng nhập admin thật để cấp tài khoản.';return;}
 try{
  const {data,error}=await db.rpc('admin_photographer_account',{p_photographer_id:id});if(error)throw error;
  if(epoch!==crewAccountEpoch)return;
  $('#crewAccountEmail').value=data?.email||'';$('#crewAccountEmail').readOnly=!!data;
  $('#crewAccountInfo').textContent=data?'Đã liên kết với đúng thợ. Nhập mật khẩu mới nếu cần đặt lại.':'Chưa có tài khoản. Nhập email và mật khẩu để tạo và liên kết tự động.';
  $('#crewAccountSave').textContent=data?'Đặt mật khẩu mới':'Tạo tài khoản cho thợ';$('#crewAccountSave').disabled=false;
 }catch{if(epoch===crewAccountEpoch)$('#crewAccountInfo').textContent='Chưa tải được tài khoản. Hãy kiểm tra kết nối và cài bản cập nhật tài khoản thợ.';}
}
$('#closeCrewAccount').addEventListener('click',()=>$('#crewAccountDialog').close());
$('#crewAccountDialog').addEventListener('close',()=>{crewAccountEpoch++;$('#crewAccountPassword').value='';crewAccountId=null;});
$('#crewAccountForm').addEventListener('submit',async event=>{
 event.preventDefault();if(demoMode||!crewAccountId||!event.currentTarget.reportValidity())return;
 const epoch=crewAccountEpoch,id=crewAccountId;$('#crewAccountSave').disabled=true;$('#crewAccountMessage').textContent='Đang lưu tài khoản…';
 const body={photographer_id:id,email:$('#crewAccountEmail').value.trim(),password:$('#crewAccountPassword').value};
 try{
  const {data,error}=await db.functions.invoke('photographer-account',{body});
  if(error){let message='Chưa lưu được. Kiểm tra kết nối hoặc cấu hình dịch vụ tài khoản.';try{message=(await error.context.json()).message||message;}catch{}throw Error(message);}
  if(epoch!==crewAccountEpoch)return;
  $('#crewAccountPassword').value='';$('#crewAccountEmail').readOnly=true;$('#crewAccountMessage').textContent=data.message+' Thợ có thể đăng nhập tại trang lịch dành cho thợ.';$('#crewAccountSave').textContent='Đặt mật khẩu mới';$('#crewAccountInfo').textContent='Tài khoản đã được liên kết.';
 }catch(error){if(epoch===crewAccountEpoch)$('#crewAccountMessage').textContent=error.message;}
 finally{body.password='';if(epoch===crewAccountEpoch)$('#crewAccountSave').disabled=false;}
});
$('#crewConfirmationFilter').addEventListener('change',renderCrewConfirmations);
$('#refreshCrewConfirmation').addEventListener('click',syncCrewConfirmations);
setInterval(()=>{if(!document.hidden)syncCrewConfirmations();},30000);
})();
