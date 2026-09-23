(async () => {
 if(window.CHEESE_PHOTOGRAPHERS_READY) await window.CHEESE_PHOTOGRAPHERS_READY;
 const cards = [...document.querySelectorAll('.photographer-card')];
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 const dbRows=window.CHEESE_DB_PHOTOGRAPHERS||[];
 const profiles = cards.map((card,index) => {
  const slug=new URL(card.querySelector('.profile-link').href).searchParams.get('tho');
  const dbp=dbRows.find(p=>p.slug===slug);
  const statBs=card.querySelectorAll('.shoot-stats b');
  const cover=Number(card.querySelector('.card-image').dataset.cover||0);
  return {
   slug,
   pending:dbp?false:card.dataset.pending==='true',
   name:dbp?.name||card.querySelector('h3').textContent,
   price:dbp?(String(dbp.price_label||'').trim()||(Number(dbp.price_amount||0)>0?new Intl.NumberFormat('vi-VN').format(Number(dbp.price_amount))+'đ':'Liên hệ')):card.querySelector('.price-block strong').textContent,
   rating:dbp?.rating||statBs[0]?.textContent||'—',
   shoots:dbp?Number(dbp.shoots_count||0):(statBs[1]?.textContent||'0'),
   location:dbp?.location_text||'Hà Nội',
   driveUrl:dbp?.drive_url||'',
   tags:(dbp?.tags&&dbp.tags.length)?dbp.tags:[...card.querySelectorAll('.photographer-tags span')].map(el=>el.textContent),
   photo:dbp?.cover_url||window.CHEESE_PHOTOS[cover]?.src,
   cover,
   team:dbp?.team||card.dataset.team,
   style:dbp?.style||'',
   bio:dbp?.bio||'',
   gallery:(dbp?.gallery_urls||[]).filter(Boolean),
   services:Array.isArray(dbp?.services)?dbp.services:[]
  };
 });
 cards.forEach(card => {
   card.addEventListener('click',event=>{
    if(event.target.closest('button,a'))return;
    location.href=card.querySelector('.profile-link').href;
   });
 });
 const slug=new URLSearchParams(location.search).get('tho');
 if(!slug)return;
 const profile=profiles.find(p=>p.slug===slug);
 const home=location.pathname;
 const page=document.getElementById('profilePage');
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 if(!profile){
   page.innerHTML=`<div class="profile-shell"><h1>Chưa tìm thấy hồ sơ này</h1><a href="${home}#photographers">← Quay lại chọn thợ</a></div>`;
   return;
 }

 document.title=`${profile.name} · Hồ sơ thợ ảnh | Cheese.Graduation`;

 document.querySelectorAll('.nav-wrap a,.mobile-drawer a').forEach(link=>{
   const hash=link.getAttribute('href');
   if(hash&&hash.startsWith('#'))link.href=home+hash;
 });

 const dbPhotos=[profile.photo,...(profile.gallery||[])].filter(Boolean);
 const photos=dbPhotos.length
   ? [...new Set(dbPhotos)].slice(0,5)
   : Array.from({length:5},(_,i)=>window.CHEESE_PHOTOS[(profile.cover+i)%window.CHEESE_PHOTOS.length].src);

 const defaultServices=[
   {name:'Bong bóng / khói màu',value:'Cần xác nhận'},
   {name:'Đèn flash & đèn liên tục',value:'Cần xác nhận'},
   {name:'Trang phục & phụ kiện',value:'Cần xác nhận'},
   {name:'Trợ lý đi cùng',value:'Cần xác nhận'},
   {name:'Bàn giao file ảnh gốc',value:'Cần xác nhận'}
 ];
 const services=(profile.services&&profile.services.length?profile.services:defaultServices).map(x=>typeof x==='string'?{name:x,value:'Cần xác nhận'}:x);

 const directBooking=`lien-he.html?tho=${encodeURIComponent(profile.slug)}`;


 page.innerHTML=`
 <div class="profile-shell">
   <div class="profile-breadcrumb">
     <a href="${home}?trang=tho">Chọn thợ</a>
     <span>/</span>
     <span>${safe(profile.name)}</span>
   </div>

   <section class="profile-gallery" aria-label="5 ảnh nổi bật của photographer">
     <div class="profile-slides" tabindex="0" aria-label="Vuốt ngang hoặc dùng nút để xem ảnh">
       ${photos.map((src,i)=>`
         <figure>
           <img src="${safe(src)}" alt="Ảnh nổi bật ${i+1} của ${safe(profile.name)}" ${i?'loading="lazy"':''}>
         </figure>`).join('')}
     </div>
     <button type="button" class="profile-photo-arrow prev" aria-label="Ảnh trước">‹</button>
     <button type="button" class="profile-photo-arrow next" aria-label="Ảnh tiếp theo">›</button>
   </section>

   <div class="profile-gallery-meta">
     <span>${photos.length>1?`Vuốt ngang để xem ${photos.length-1} ảnh còn lại`:'Ảnh nổi bật của photographer'}</span>
     <div class="profile-dots">
       ${photos.map((_,i)=>`<button class="profile-dot" aria-label="Xem ảnh ${i+1}" aria-current="${i===0}"></button>`).join('')}
     </div>
     <span id="photoCount" aria-live="polite">01 / ${String(photos.length).padStart(2,'0')}</span>
   </div>

   ${(()=>{
     const drive=String(profile.driveUrl||(window.CHEESE_DRIVE_LINKS||{})[profile.slug]||'').trim();
     return drive
       ? `<a class="profile-drive-primary" href="${safe(drive)}" target="_blank" rel="noopener">Xem album đầy đủ của ${safe(profile.name)} trên Google Drive ↗</a>`
       : `<span class="profile-drive-primary is-pending">Album Google Drive đang cập nhật</span>`;
   })()}

   <section class="profile-info">
     <div class="profile-name-row">
       <h1>${safe(profile.name)}</h1>
       <span class="profile-team">${safe(profile.team)}</span>
     </div>
     <p class="profile-summary">
       <span class="profile-location-line">${safe(profile.location||'Hà Nội')} · ${profile.pending ? 'Đang cập nhật đánh giá' : `<span class="star">★</span> <b>${profile.rating}</b> · ${profile.shoots} buổi đã chụp`}</span>
       <span class="profile-bio-line">${safe(profile.bio||(`Phong cách ${profile.style||profile.tags.join(' · ')}`))}</span>
     </p>
     <div class="profile-tags">
       ${profile.tags.map(t=>`<span>${safe(t)}</span>`).join('')}
       <span>Cá nhân / nhóm</span>
     </div>
   </section>

   <section class="profile-section">
     <h2>Dịch vụ đi kèm</h2>
     <dl class="service-list">
       ${services.map(item=>`<div><dt>${safe(item.name||'Dịch vụ')}</dt><dd>${safe(item.value||'Cần xác nhận')}</dd></div>`).join('')}
     </dl>
   </section>

   <section class="profile-section profile-simple-booking" id="profileBooking">
     <div class="profile-simple-booking-copy">
       <small>Giá từ</small>
       <strong>${safe(profile.price)}</strong>
       <p>Chọn đặt lịch để chuyển sang trang liên hệ với ${safe(profile.name)}.</p>
     </div>
     <a class="profile-simple-booking-btn" href="${directBooking}">Đặt lịch ${safe(profile.name)} <span>↗</span></a>
   </section>
 </div>

 <div class="profile-bookbar">
   <div class="profile-bookbar-inner">
     <div>
       <small>Giá từ</small>
       <strong>${safe(profile.price)}</strong>
     </div>
     <a href="${directBooking}">Đặt lịch ${safe(profile.name)} ↗</a>
   </div>
 </div>`;

 const slides=page.querySelector('.profile-slides');
 const dots=[...page.querySelectorAll('.profile-dot')];
 let current=0;
 const maxIndex=photos.length-1;

 const go=i=>{
   const target=Math.max(0,Math.min(maxIndex,i));
   slides.scrollTo({
     left:target*slides.clientWidth,
     behavior:reduced?'auto':'smooth'
   });
 };

 page.querySelector('.prev').addEventListener('click',()=>go(current===0?maxIndex:current-1));
 page.querySelector('.next').addEventListener('click',()=>go(current===maxIndex?0:current+1));
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));

 slides.addEventListener('keydown',e=>{
   if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
     e.preventDefault();
     const delta=e.key==='ArrowRight'?1:-1;
     let next=current+delta;
     if(next<0)next=maxIndex;
     if(next>maxIndex)next=0;
     go(next);
   }
 });

 slides.addEventListener('scroll',()=>{
   current=Math.max(0,Math.min(maxIndex,Math.round(slides.scrollLeft/slides.clientWidth)));
   dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===current)));
   document.getElementById('photoCount').textContent=`${String(current+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;
 },{passive:true});

 page.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{
   e.preventDefault();
   const target=document.querySelector(link.getAttribute('href'));
   if(target)target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
 }));
})();
