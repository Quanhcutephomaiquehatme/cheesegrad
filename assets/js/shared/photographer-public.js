(() => {
  'use strict';
  const cfg=window.CHEESE_CONFIG||{};
  const usable=/^https:\/\/.+\.supabase\.co$/i.test(String(cfg.supabaseUrl||'').trim()) &&
    !String(cfg.supabaseAnonKey||'').includes('PASTE_') && String(cfg.supabaseAnonKey||'').length>20 && window.supabase;

  const money=n=>Number(n||0)>0?new Intl.NumberFormat('vi-VN').format(Number(n))+'đ':'';
  const displayPrice=p=>String(p.price_label||'').trim() || (Number(p.price_amount||0)>0?money(p.price_amount):'Liên hệ');
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fallbackCover=slug=>`assets/photographers/${slug}.jpg`;

  function updatePublicProfileObject(rows){
    const target=window.CHEESE_PROFILES;
    if(!target)return;
    const previous={...target};
    Object.keys(target).forEach(k=>delete target[k]);
    rows.forEach(p=>{
      const old=previous[p.slug]||{};
      target[p.slug]={
        ...old,
        name:p.name,
        team:p.team||'',
        price:displayPrice(p),
        priceAmount:Number(p.price_amount||0),
        style:p.style||old.style||'',
        bio:p.bio||'',
        tags:Array.isArray(p.tags)?p.tags:[],
        photo:p.cover_url||old.photo||fallbackCover(p.slug),
        gallery:Array.isArray(p.gallery_urls)?p.gallery_urls:[],
        rating:p.rating,
        shoots:Number(p.shoots_count||0),
        location:p.location_text||'Hà Nội',
        driveUrl:p.drive_url||'',
        yearbookPrices:p.yearbook_prices||{},graduationPrices:p.graduation_prices||{},graduationExtraPerPerson:Number(p.graduation_extra_per_person||300000),services:Array.isArray(p.services)?p.services:[]
      };
    });
  }

  function cardSlug(card){
    const link=card.querySelector('.profile-link');
    if(!link)return '';
    try{return new URL(link.href,location.href).searchParams.get('tho')||''}catch(_){return ''}
  }

  function makeCard(p){
    const article=document.createElement('article');
    article.className='photographer-card cheese-photographer-card reveal visible';
    article.dataset.team=p.team||'';
    article.dataset.style='dynamic';
    article.dataset.dynamic='true';
    article.innerHTML=`
      <div class="card-image" data-cover="0"><span class="badge">${safe(p.team||'Photographer')}</span><button aria-label="Yêu thích" class="heart" type="button">♡</button></div>
      <div class="card-body">
        <h3>${safe(p.name)}</h3>
        <div class="photographer-tags">${(p.tags||[]).map(t=>`<span>${safe(t)}</span>`).join('')||`<span>${safe(p.style||'Photographer')}</span>`}</div>
        <div class="shoot-stats">${p.rating?`<span class="star">★</span> <b>${safe(p.rating)}</b> · `:'Đang cập nhật · '}<b>${Number(p.shoots_count||0)}</b></div>
        <div class="price-block"><small>Giá từ</small><strong>${safe(displayPrice(p))}</strong></div>
        <div class="photographer-card-actions"><a class="card-book-link profile-link" href="?tho=${encodeURIComponent(p.slug)}">Xem hồ sơ &amp; ảnh <span>↗</span></a><a class="card-book-now booking-page-link" href="lien-he.html?tho=${encodeURIComponent(p.slug)}"><span class="book-live-dot" aria-hidden="true"></span>Đặt lịch ${safe(p.name)} <span>↗</span></a></div>
      </div>`;
    const img=article.querySelector('.card-image');
    if(p.cover_url)img.style.backgroundImage=`url("${String(p.cover_url).replace(/"/g,'%22')}")`;
    article.addEventListener('click',e=>{if(!e.target.closest('button,a'))location.href=article.querySelector('.profile-link').href});
    return article;
  }

  function applyIndex(rows){
    const rail=document.querySelector('#photographers .cheese-photographer-grid');
    if(!rail)return;
    const cards=[...rail.querySelectorAll('.photographer-card')];
    const bySlug=new Map(cards.map(c=>[cardSlug(c),c]));
    const live=new Set(rows.map(p=>p.slug));
    cards.forEach(c=>{if(!live.has(cardSlug(c)))c.style.display='none'});
    rows.forEach(p=>{
      let card=bySlug.get(p.slug);
      if(!card){card=makeCard(p);rail.append(card);bySlug.set(p.slug,card)}
      card.style.display='';card.dataset.team=p.team||'';
      const badge=card.querySelector('.badge');if(badge)badge.textContent=p.team||'Photographer';
      const h3=card.querySelector('h3');if(h3)h3.textContent=p.name;
      const tags=card.querySelector('.photographer-tags');if(tags)tags.innerHTML=(p.tags||[]).map(t=>`<span>${safe(t)}</span>`).join('')||`<span>${safe(p.style||'Photographer')}</span>`;
      const price=card.querySelector('.price-block strong');if(price)price.textContent=displayPrice(p);
      const stats=card.querySelector('.shoot-stats');if(stats)stats.innerHTML=p.rating?`<span class="star">★</span> <b>${safe(p.rating)}</b> · <b>${Number(p.shoots_count||0)}</b>`:`Đang cập nhật · <b>—</b><b hidden>${Number(p.shoots_count||0)}</b>`;
      const profile=card.querySelector('.profile-link');if(profile)profile.href=`?tho=${encodeURIComponent(p.slug)}`;
      const book=card.querySelector('.booking-page-link');if(book){book.href=`lien-he.html?tho=${encodeURIComponent(p.slug)}`;book.innerHTML=`<span class="book-live-dot" aria-hidden="true"></span>Đặt lịch ${safe(p.name)} <span>↗</span>`}
      const image=card.querySelector('.card-image');if(image&&p.cover_url)image.style.backgroundImage=`url("${String(p.cover_url).replace(/"/g,'%22')}")`;
    });
  }

  const ready=(async()=>{
    if(!usable){window.CHEESE_DB_PHOTOGRAPHERS=[];return []}
    try{
      const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
      const {data,error}=await db.from('photographers').select('id,slug,name,team,active,price_amount,price_label,style,bio,tags,cover_url,gallery_urls,sort_order,rating,shoots_count,location_text,drive_url,yearbook_prices,graduation_prices,graduation_extra_per_person,services').eq('active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
      if(error)throw error;
      const rows=data||[];
      window.CHEESE_DB_PHOTOGRAPHERS=rows;
      updatePublicProfileObject(rows);
      applyIndex(rows);
      return rows;
    }catch(err){
      console.warn('Photographer sync:',err.message);
      window.CHEESE_DB_PHOTOGRAPHERS=[];
      return [];
    }
  })();
  window.CHEESE_PHOTOGRAPHERS_READY=ready;
})();