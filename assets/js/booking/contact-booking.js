(async () => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let profiles=window.CHEESE_PROFILES||{};
const contact=window.CHEESE_CONTACT||{};
const cfg=window.CHEESE_CONFIG||{};
const configured=/^https:\/\/.+\.supabase\.co$/i.test(String(cfg.supabaseUrl||'').trim()) &&
  !String(cfg.supabaseAnonKey||'').includes('PASTE_') &&
  String(cfg.supabaseAnonKey||'').length>20 &&
  window.supabase;
const db=configured?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
if(window.CHEESE_PRICING_READY){try{await window.CHEESE_PRICING_READY}catch(_){}}
const pricing=window.CHEESE_BOOKING_PRICES||{};
const PACKAGE_EXTRA=pricing.packageExtra||{1:0,2:300000,3:600000,4:900000,5:1200000};
const PROVINCE_GROUPS=pricing.provinceGroups||[];
const GRAD_PACKAGES=pricing.graduationPackages||[];
const GRAD_EXTRA=Number(pricing.graduationExtraPerPerson||300000);
let gradPackageId=(GRAD_PACKAGES[0]&&GRAD_PACKAGES[0].id)||'ceremony';
const photographerSelect=$('#photographerSelect');
const shootType=$('#shootType');
const duration=$('#duration');
const shootDate=$('#shootDate');
const peopleRange=$('#peopleRange');
const provinceSelect=$('#provinceSelect');
const locationDetail=$('#locationDetail');
const conceptInput=$('#conceptInput');
const customerName=$('#customerName');
const customerPhone=$('#customerPhone');
const messageBox=$('#messageBox');
const gradPeopleRange=$('#gradPeopleRange');
const gradShootDateMirror=$('#gradShootDateMirror');
let currentSlug='';
let availability=null;

if(window.CHEESE_PHOTOGRAPHERS_READY){
  try{
    const rows=await window.CHEESE_PHOTOGRAPHERS_READY;
    if(rows&&rows.length){
      const fallback={...profiles};
      profiles={};
      rows.forEach(p=>{
        const old=fallback[p.slug]||{};
        profiles[p.slug]={
          ...old,
          name:p.name,team:p.team||'',
          price:String(p.price_label||'').trim()||(Number(p.price_amount||0)>0?new Intl.NumberFormat('vi-VN').format(Number(p.price_amount))+'đ':'Liên hệ'),
          priceAmount:Number(p.price_amount||0),
          style:p.style||old.style||'',bio:p.bio||'',tags:p.tags||[],location:p.location_text||'Hà Nội',driveUrl:p.drive_url||'',
          photo:p.cover_url||old.photo||`assets/photographers/${p.slug}.jpg`,
          gallery:p.gallery_urls||[],
          yearbookPrices:p.yearbook_prices||{},
          graduationPrices:p.graduation_prices||{},
          graduationExtraPerPerson:Number(p.graduation_extra_per_person||300000),
          services:Array.isArray(p.services)?p.services:[]
        };
      });
    }
  }catch(err){console.warn('Không tải được photographer:',err.message)}
}

const q=new URLSearchParams(location.search);
const requested=q.get('tho');
currentSlug=profiles[requested]?requested:Object.keys(profiles)[0];
Object.entries(profiles).forEach(([slug,p])=>{
  const o=document.createElement('option');
  o.value=slug;o.textContent=`${p.name} · ${p.team}`;
  photographerSelect.appendChild(o);
});
photographerSelect.value=currentSlug;
const firstProvince=document.createElement('option');
firstProvince.value='';firstProvince.textContent='Chọn nơi chụp...';
provinceSelect.appendChild(firstProvince);
PROVINCE_GROUPS.forEach(group=>{
  const og=document.createElement('optgroup');
  og.label=group.label;
  (group.items||[]).forEach(([name,fee])=>{
    const o=document.createElement('option');
    o.value=name;
    o.dataset.fee=fee;
    o.textContent=`${name} · ${fee}`;
    og.appendChild(o);
  });
  provinceSelect.appendChild(og);
});
const compactPopover=$('#compactSwitchPopover');
const compactList=$('#compactSwitchList');
const compactTrigger=$('#compactSwitchTrigger');
const profileEntries=Object.entries(profiles);
compactList.innerHTML=profileEntries.map(([slug,p])=>`
  <button class="compact-photographer-option" type="button" data-slug="${slug}" aria-label="Chọn ${p.name}">
    <img src="${p.photo}" alt="">
    <span>
      <b>${p.name}</b>
      <small>${p.team} · ${p.style}</small>
      <span class="price">${p.price}</span>
    </span>
  </button>`).join('');
function syncCompactSwitch(){
  const p=current();
  $('#compactSwitchAvatar').src=p.photo;
  $('#compactSwitchAvatar').alt=`${p.name} · Cheese.Graduation`;
  $('#compactSwitchName').textContent=`${p.name} · ${p.team}`;
  $$('.compact-photographer-option',compactList).forEach(btn=>{
    const active=btn.dataset.slug===currentSlug;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(active));
  });
}
function openCompactSwitch(){
  compactPopover.classList.add('open');
  compactPopover.setAttribute('aria-hidden','false');
  compactTrigger.setAttribute('aria-expanded','true');
}
function closeCompactSwitch(){
  compactPopover.classList.remove('open');
  compactPopover.setAttribute('aria-hidden','true');
  compactTrigger.setAttribute('aria-expanded','false');
}
compactTrigger.addEventListener('click',openCompactSwitch);
$('#compactSwitchClose').addEventListener('click',closeCompactSwitch);
compactPopover.addEventListener('click',e=>{if(e.target===compactPopover)closeCompactSwitch()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCompactSwitch()});
$$('.compact-photographer-option',compactList).forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.dataset.slug!==currentSlug){
    currentSlug=btn.dataset.slug;
    photographerSelect.value=currentSlug;
    updateProfile(true);
  }
  closeCompactSwitch();
}));
const today=new Date();
shootDate.min=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
function current(){return profiles[currentSlug]}
function dateVN(value){
  if(!value)return 'chưa chốt';
  const [y,m,d]=value.split('-');
  return `${d}/${m}/${y}`;
}
function parseMoney(text){
  const digits=String(text||'').replace(/[^\d]/g,'');
  return digits?Number(digits):null;
}
function formatMoney(n){
  return `${Number(n).toLocaleString('vi-VN')}đ`;
}
function getPeopleCount(){
  return Number(peopleRange.value||1);
}
function getPackageInfo(count=getPeopleCount()){
  const custom=current().yearbookPrices||{};
  const exact=Number(custom[String(count)]||0);
  const base=Number(current().priceAmount||0)||parseMoney(current().price);
  const title=count===1 ? '1 người · gói lẻ' : `${count} người · gói nhóm`;
  if(exact>0) return {title,price:`từ ${formatMoney(exact)}`,note:'Giá riêng của photographer'};
  if(!base) return {title,price:'Thợ báo giá',note:'Photographer này báo giá riêng theo nhu cầu'};
  const extra=Number(PACKAGE_EXTRA[count]||0);
  return {title,price:`từ ${formatMoney(base+extra)}`,note:'Giá tham khảo theo photographer đang chọn'};
}
function selectedDurationLabel(){
  if(duration.value==='Sáng') return 'nửa ngày · buổi sáng';
  if(duration.value==='Chiều') return 'nửa ngày · buổi chiều';
  return 'cả ngày';
}
function slotAllowed(slot){
  return !availability || availability[slot]!==false;
}
function currentProvince(){
  const option=provinceSelect.selectedOptions[0];
  if(!option || !option.value) return '';
  const fee=option.dataset.fee||'';
  return fee ? `${option.value} (+${fee})` : option.value;
}
function setShootType(value){
  shootType.value=value;
  $$('.booking-type-tab').forEach(btn=>{
    const active=btn.dataset.shootType===value;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-selected',String(active));
  });
  const isGrad=value==='Tốt nghiệp đại học';
  $('#yearbookPanel').hidden=isGrad;
  $('#graduationPanel').hidden=!isGrad;
  $('#graduationSchedule').hidden=!isGrad;
  if(isGrad){
    syncGradPackage();
    if(gradShootDateMirror){ gradShootDateMirror.value=shootDate.value||''; }
  }else{
    syncPackageCard();
  }
  buildMessage();
}
function currentGradPackage(){
  return GRAD_PACKAGES.find(p=>p.id===gradPackageId)||GRAD_PACKAGES[0]||{
    id:'ceremony',name:'Chụp Lễ Tốt Nghiệp',basePrice:1700000,maxPeople:2,groupLabel:'Nhóm tối đa 2 người',detail:''
  };
}
function getGradPeopleCount(){ return Number(gradPeopleRange?.value||1); }
function getGradPrice(){
  const pkg=currentGradPackage();
  const custom=current().graduationPrices||{};
  const base=Number(custom[pkg.id]||pkg.basePrice||0);
  const extra=Number(current().graduationExtraPerPerson??GRAD_EXTRA);
  return base+Math.max(0,getGradPeopleCount()-1)*extra;
}
function syncGradPackage(){
  const pkg=currentGradPackage();
  $$('.grad-package-card').forEach(btn=>{
    const active=btn.dataset.gradPackage===pkg.id;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-checked',String(active));
    const id=btn.dataset.gradPackage;
    const def=GRAD_PACKAGES.find(x=>x.id===id);
    const base=Number((current().graduationPrices||{})[id]||def?.basePrice||0);
    const priceNode=btn.querySelector('.grad-price strong');
    if(priceNode)priceNode.textContent=base?formatMoney(base):'Thợ báo giá';
  });
  if(!gradPeopleRange)return;
  gradPeopleRange.max=String(pkg.maxPeople||1);
  if(Number(gradPeopleRange.value)>Number(gradPeopleRange.max)) gradPeopleRange.value=gradPeopleRange.max;
  const count=getGradPeopleCount();
  const price=getGradPrice();
  $('#gradPeopleTitle').textContent=count===1?'1 người · gói lẻ':`${count} người · gói nhóm`;
  $('#gradPeoplePrice').textContent=formatMoney(price);
  $('#gradSummaryTitle').textContent=`${pkg.name} · ${count} người`;
  $('#gradSummaryPrice').textContent=formatMoney(price);
  $('#gradPeopleHelper').textContent=`Gói ${pkg.name}, tối đa ${pkg.maxPeople} người. Mỗi người thêm +${formatMoney(Number(current().graduationExtraPerPerson??GRAD_EXTRA))}.`;
  $('#gradRangeMarks').innerHTML=Array.from({length:Number(pkg.maxPeople||1)},(_,i)=>`<span>${i+1}</span>`).join('');
  const pct=(count-1)/Math.max(1,(Number(pkg.maxPeople||1)-1))*100;
  gradPeopleRange.style.setProperty('--grad-fill',`${Number.isFinite(pct)?pct:0}%`);
}
function getSelectedBookingPackage(){
  if(shootType.value==='Tốt nghiệp đại học'){
    const pkg=currentGradPackage();
    const count=getGradPeopleCount();
    return {title:`${pkg.name} · ${count} người`,price:formatMoney(getGradPrice()),note:pkg.detail};
  }
  return getPackageInfo();
}
function syncPackageCard(){
  const selected=getPeopleCount();
  const info=getPackageInfo(selected);
  $('#packageTitle').textContent=info.title;
  $('#packagePrice').textContent=info.price;
  $('#packagePriceNote').textContent=info.note;
  $$('.package-option').forEach(btn=>{
    const count=Number(btn.dataset.people);
    const active=count===selected;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-checked',String(active));
    const priceNode=btn.querySelector('[data-package-price]');
    if(priceNode) priceNode.textContent=getPackageInfo(count).price;
  });
}
function setDurationMode(mode,preferredSlot=null){
  const fullBtn=$('[data-duration-mode="full"]');
  const halfBtn=$('[data-duration-mode="half"]');
  const halfWrap=$('#halfDayToggle');
  const morning=$('[data-slot-value="Sáng"]');
  const afternoon=$('[data-slot-value="Chiều"]');
  if(mode==='full'){
    duration.value='Cả ngày';
    halfWrap.hidden=true;
    fullBtn.classList.add('active');halfBtn.classList.remove('active');
  }else{
    halfWrap.hidden=false;
    fullBtn.classList.remove('active');halfBtn.classList.add('active');
    let slot=preferredSlot||((duration.value==='Sáng'||duration.value==='Chiều')?duration.value:'Sáng');
    if(availability && availability[slot]===false){
      slot=availability['Sáng']!==false?'Sáng':'Chiều';
    }
    duration.value=slot;
  }
  morning.classList.toggle('active',duration.value==='Sáng');
  afternoon.classList.toggle('active',duration.value==='Chiều');
  buildMessage();
}
function syncDurationButtons(){
  const fullBtn=$('[data-duration-mode="full"]');
  const halfBtn=$('[data-duration-mode="half"]');
  const morning=$('[data-slot-value="Sáng"]');
  const afternoon=$('[data-slot-value="Chiều"]');
  if(!fullBtn)return;
  fullBtn.disabled=!!availability && availability['Cả ngày']===false;
  morning.disabled=!!availability && availability['Sáng']===false;
  afternoon.disabled=!!availability && availability['Chiều']===false;
  halfBtn.disabled=!!availability && availability['Sáng']===false && availability['Chiều']===false;
  if(duration.value==='Cả ngày' && fullBtn.disabled && !halfBtn.disabled) setDurationMode('half');
  if((duration.value==='Sáng'&&morning.disabled)||(duration.value==='Chiều'&&afternoon.disabled)){
    if(!halfBtn.disabled) setDurationMode('half');
    else if(!fullBtn.disabled) setDurationMode('full');
  }
}
$$('[data-duration-mode]').forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.disabled)return;
  setDurationMode(btn.dataset.durationMode==='full'?'full':'half');
}));
$$('[data-slot-value]').forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.disabled)return;
  setDurationMode('half',btn.dataset.slotValue);
}));
$$('.package-option').forEach(btn=>btn.addEventListener('click',()=>{
  peopleRange.value=btn.dataset.people;
  syncPackageCard();
  buildMessage();
}));

$$('.grad-package-card').forEach(btn=>btn.addEventListener('click',()=>{
  gradPackageId=btn.dataset.gradPackage;
  if(gradPeopleRange) gradPeopleRange.value='1';
  syncGradPackage();
  buildMessage();
}));
gradPeopleRange?.addEventListener('input',()=>{ syncGradPackage(); buildMessage(); });
$$('[data-grad-duration-mode]').forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.disabled)return;
  const mode=btn.dataset.gradDurationMode;
  if(mode==='full') setDurationMode('full'); else setDurationMode('half');
  $$('[data-grad-duration-mode]').forEach(b=>b.classList.toggle('active',b===btn));
  $('#gradHalfDayToggle').hidden=mode==='full';
  syncGradScheduleButtons();
}));
$$('[data-grad-slot-value]').forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.disabled)return;
  setDurationMode('half',btn.dataset.gradSlotValue);
  $('#gradHalfDayToggle').hidden=false;
  syncGradScheduleButtons();
}));
function syncGradScheduleButtons(){
  $$('[data-grad-duration-mode]').forEach(btn=>{
    const mode=btn.dataset.gradDurationMode;
    btn.classList.toggle('active',mode==='full'?duration.value==='Cả ngày':duration.value!=='Cả ngày');
    btn.disabled=mode==='full' ? (!!availability&&availability['Cả ngày']===false) : (!!availability&&availability['Sáng']===false&&availability['Chiều']===false);
  });
  $$('[data-grad-slot-value]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.gradSlotValue===duration.value);
    btn.disabled=!!availability&&availability[btn.dataset.gradSlotValue]===false;
  });
  $('#gradHalfDayToggle').hidden=duration.value==='Cả ngày';
}
function updateProfile(push=false){
  const p=current();
  $('#profilePhoto').src=p.photo;
  $('#profilePhoto').alt=`${p.name} · Cheese.Graduation`;
  $('#profileTeam').textContent=p.team;
  $('#profileName').textContent=p.name;
  $('#profileStyle').textContent=p.style;
  $('#heroName').textContent=p.name+'.';
  $('#messageLabel').textContent=`Tin nhắn gửi studio · ${p.name}`;
  document.title=`Đặt lịch ${p.name} — Cheese.Graduation`;
  if(push)history.replaceState({},'',`lien-he.html?tho=${encodeURIComponent(currentSlug)}`);
  syncCompactSwitch();
  syncPackageCard();
  availability=null;
  resetAvailability();
  if(shootDate.value)checkAvailability();
  buildMessage();
}
function buildMessage(){
  const p=current();
  const pack=getSelectedBookingPackage();
  const province=currentProvince()||'chưa chọn';
  const detail=locationDetail.value.trim()||'chưa ghi cụ thể';
  const concept=conceptInput.value.trim()||'chưa ghi';
  const name=customerName.value.trim()||'chưa ghi';
  const phone=customerPhone.value.trim()||'chưa ghi';
  const availabilityNote=shootDate.value
    ? (slotAllowed(duration.value)?'website đang hiển thị còn lịch':'website đang hiển thị đã kín')
    : 'chưa tra ngày cụ thể';
  const shootTypeLabel=shootType.value==='Kỷ yếu'?'Cá nhân / nhóm':(shootType.value||'Cá nhân / nhóm');
  messageBox.textContent=[
    `Chào ${contact.studioName||'Cheese.Graduation'}, mình muốn đặt lịch chụp.`,
    `- Photographer: ${p.name} (${p.team})`,
    `- Loại buổi chụp: ${shootTypeLabel}`,
    `- Chụp: ${selectedDurationLabel()}`,
    `- Gói chụp: ${pack.title} — ${pack.price}`,
    `- Ngày chụp dự kiến: ${dateVN(shootDate.value)} (${availabilityNote})`,
    `- Tỉnh / thành chụp: ${province}`,
    `- Địa điểm cụ thể: ${detail}`,
    `- Tên khách: ${name}`,
    `- Số điện thoại: ${phone}`,
    `- Concept mong muốn: ${concept}`,
    ``,
    `Studio kiểm tra và xác nhận lịch giúp mình nhé!`
  ].join('\n');
}
function resetAvailability(){
  $$('.availability-slot').forEach(el=>{
    el.className='availability-slot';
    $('span',el).textContent='Chưa tra';
  });
  $('#availabilityText').textContent='Chọn ngày để kiểm tra lịch còn hay đã kín.';
  syncDurationOptions();
}
function syncDurationOptions(){
  syncDurationButtons();
  syncGradScheduleButtons();
  buildMessage();
}
async function checkAvailability(){
  if(!shootDate.value){availability=null;resetAvailability();return}
  const p=current();
  $$('.availability-slot').forEach(el=>{
    el.className='availability-slot loading';
    $('span',el).textContent='Đang tra...';
  });
  $('#availabilityText').textContent=`Đang kiểm tra ${p.name} ngày ${dateVN(shootDate.value)}...`;
  if(!db){
    availability=null;
    $('#noDb').hidden=false;
    $$('.availability-slot').forEach(el=>{
      el.className='availability-slot';
      $('span',el).textContent='Chưa kết nối';
    });
    $('#availabilityText').textContent='Chưa thể đọc lịch thật từ Admin.';
    buildMessage();
    return;
  }
  $('#noDb').hidden=true;
  try{
    const {data,error}=await db.rpc('get_available_slots',{
      p_photographer:p.name,
      p_shoot_date:shootDate.value
    });
    if(error) throw error;
    availability={'Sáng':true,'Chiều':true,'Cả ngày':true};
    (data||[]).forEach(r=>availability[r.time_slot]=!!r.available);
    $$('.availability-slot').forEach(el=>{
      const slot=el.dataset.slot,free=availability[slot]!==false;
      el.className=`availability-slot ${free?'free':'busy'}`;
      $('span',el).textContent=free?'Còn lịch':'Đã kín';
    });
    const free=['Sáng','Chiều','Cả ngày'].filter(s=>availability[s]!==false);
    $('#availabilityText').textContent=free.length
      ? `${p.name}: ${free.join(' · ')} đang còn lịch.`
      : `${p.name}: ngày này hiện đã kín.`;
    syncDurationOptions();
  }catch(err){
    console.error(err);
    availability=null;
    $$('.availability-slot').forEach(el=>{
      el.className='availability-slot';
      $('span',el).textContent='Lỗi tra lịch';
    });
    $('#availabilityText').textContent='Không đọc được lịch. Hãy nhắn studio để kiểm tra trực tiếp.';
    buildMessage();
  }
}
async function copyMessage(showState=true){
  const text=messageBox.textContent;
  try{
    await navigator.clipboard.writeText(text);
  }catch(_){
    const ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    document.execCommand('copy');ta.remove();
  }
  if(showState){
    const btn=$('#copyMessage'),old=btn.textContent;
    btn.textContent='Đã sao chép ✓';btn.classList.add('copied');
    setTimeout(()=>{btn.textContent=old;btn.classList.remove('copied')},1700);
  }
}
function setupContacts(){
  const username=String(contact.instagramUsername||'').replace(/^@/,'').trim();
  const instagram=String(contact.instagramUrl||'').trim()||(username?`https://www.instagram.com/${encodeURIComponent(username)}/`:'');
  const defs=[
    ['#instagramBtn',instagram],    ['#messengerBtn',String(contact.messengerUrl||'').trim()]
  ];
  defs.forEach(([sel,url])=>{
    const el=$(sel);
    if(!url){
      el.classList.add('disabled');el.removeAttribute('target');el.href='#';
      el.addEventListener('click',e=>e.preventDefault());
    }else{
      el.href=url;
      el.addEventListener('click',()=>{copyMessage(false)});
    }
  });
}
photographerSelect.addEventListener('change',()=>{
  currentSlug=photographerSelect.value;updateProfile(true);
});
$$('.booking-type-tab').forEach(btn=>btn.addEventListener('click',()=>setShootType(btn.dataset.shootType)));
[provinceSelect,locationDetail,conceptInput,customerName,customerPhone].forEach(el=>el.addEventListener('input',buildMessage));
shootDate.addEventListener('change',()=>{ if(gradShootDateMirror)gradShootDateMirror.value=shootDate.value; checkAvailability(); });
gradShootDateMirror?.addEventListener('change',()=>{ shootDate.value=gradShootDateMirror.value; checkAvailability(); });
$('#copyMessage').addEventListener('click',()=>copyMessage(true));
setupContacts();
updateProfile(false);
setDurationMode('full');
const oldDate=q.get('ngay'), oldTime=q.get('gio'), oldSize=q.get('soLuong'), oldType=q.get('loai');
if(oldType==='Kỷ yếu'||oldType==='Tốt nghiệp đại học') setShootType(oldType);
else setShootType('Kỷ yếu');
if(oldDate) shootDate.value=oldDate;
if(oldTime&&[...duration.options].some(o=>o.value===oldTime)){ duration.value=oldTime; setDurationMode(oldTime==='Cả ngày'?'full':'half',oldTime); }
const sizeMatch=String(oldSize||'').match(/(\d+)/);
if(sizeMatch){
  const n=Math.min(5,Math.max(1,Number(sizeMatch[1])));
  peopleRange.value=String(n);
}
if(oldDate) checkAvailability(); else buildMessage();
syncPackageCard();
syncGradPackage();
syncGradScheduleButtons();
})();