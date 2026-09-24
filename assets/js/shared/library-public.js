(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const cfg=window.CHEESE_CONFIG||{};
const usable=/^https:\/\/.+\.supabase\.co$/i.test(String(cfg.supabaseUrl||'').trim())&&!String(cfg.supabaseAnonKey||'').includes('PASTE_')&&String(cfg.supabaseAnonKey||'').length>20&&window.supabase;
const db=usable?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const PAGE_SIZE=40;
const fallback=[{"image_url": "assets/images/real-work/real-work-01.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-01.webp", "alt_text": "NEU · Hoa và lễ phục", "width": 1365, "height": 2048, "sort_order": 0}, {"image_url": "assets/images/real-work/real-work-03.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-03.webp", "alt_text": "NEU · Kiến trúc biểu tượng", "width": 1365, "height": 2048, "sort_order": 10}, {"image_url": "assets/images/real-work/real-work-11.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-11.webp", "alt_text": "Nụ cười giữa khuôn viên", "width": 1365, "height": 2048, "sort_order": 20}, {"image_url": "assets/images/real-work/real-work-05.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-05.webp", "alt_text": "NEU · Khoảnh khắc trong hội trường", "width": 1376, "height": 2048, "sort_order": 30}, {"image_url": "assets/images/real-work/real-work-06.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-06.webp", "alt_text": "FTU · Nắng chiều", "width": 1365, "height": 2048, "sort_order": 40}, {"image_url": "assets/images/real-work/real-work-10.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-10.webp", "alt_text": "Kiến trúc đường cong", "width": 1365, "height": 2048, "sort_order": 50}, {"image_url": "assets/images/real-work/real-work-08.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-08.webp", "alt_text": "FTU · Góc hoa giấy", "width": 1365, "height": 2048, "sort_order": 60}, {"image_url": "assets/images/real-work/real-work-16.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-16.webp", "alt_text": "Khoảnh khắc cùng chim bồ câu", "width": 1285, "height": 2047, "sort_order": 70}, {"image_url": "assets/images/real-work/real-work-13.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-13.webp", "alt_text": "Nét cổ điển ngày tốt nghiệp", "width": 1365, "height": 2048, "sort_order": 80}, {"image_url": "assets/images/real-work/real-work-18.webp", "thumbnail_url": "assets/images/library-thumbs/real-work-18.webp", "alt_text": "Toàn cảnh trong khuôn viên", "width": 1365, "height": 2048, "sort_order": 90}].map((x,i)=>({id:`fallback-${i}`,active:true,...x}));
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let images=[],activeIndex=0,totalCount=0,offset=0,loading=false,hasMore=true,usingFallback=!db,loadFailed=false,sentinelObserver=null;
const box=$('#libraryMasonry'),loadingBox=$('#libraryLoading'),empty=$('#libraryEmpty'),count=$('#libraryCount'),more=$('#libraryMore'),loadBtn=$('#libraryLoadMore'),loadedText=$('#libraryLoadedText'),sentinel=$('#librarySentinel');
function countText(){if(count)count.textContent=String(totalCount||images.length);if(loadedText)loadedText.textContent=loadFailed?`Chưa tải được. Bấm để thử lại.`:totalCount?`Đã tải ${images.length} / ${totalCount} ảnh`:`Đã tải ${images.length} ảnh`;if(more)more.hidden=!hasMore}
function cardHTML(x,index){const w=Number(x.width||0),h=Number(x.height||0),thumb=x.thumbnail_url||x.image_url,attrs=w&&h?` width="${w}" height="${h}"`:'';return `<figure class="library-card is-new" data-library-index="${index}"><img src="${esc(thumb)}" alt="${esc(x.alt_text||'Ảnh Cheese.Graduation')}"${attrs} loading="lazy" decoding="async"><figcaption>${esc(x.alt_text||'Cheese.Graduation')}</figcaption></figure>`}
function append(items,reset=false){if(reset){images=[];box.innerHTML=''}const start=images.length;images.push(...items.filter(x=>x?.image_url));box.insertAdjacentHTML('beforeend',images.slice(start).map((x,i)=>cardHTML(x,start+i)).join(''));$$('[data-library-index]',box).slice(start).forEach(card=>card.addEventListener('click',()=>openLightbox(Number(card.dataset.libraryIndex))));loadingBox.hidden=true;empty.hidden=!!images.length;countText()}
async function fetchCount(){if(!db)return fallback.length;const {count,error}=await db.from('site_library_images').select('id',{count:'exact',head:true}).eq('active',true);if(error)throw error;return Number(count||0)}
async function loadNext(){if(loading||!hasMore)return;loading=true;loadFailed=false;if(loadBtn){loadBtn.disabled=true;loadBtn.textContent='Đang tải…'};countText();try{if(usingFallback){if(!images.length){totalCount=fallback.length;append(fallback,true);offset=fallback.length}hasMore=false;countText();return}if(!totalCount)totalCount=await fetchCount();const {data,error}=await db.from('site_library_images').select('id,image_url,thumbnail_url,alt_text,width,height,sort_order,active,created_at').eq('active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:true}).order('id',{ascending:true}).range(offset,offset+PAGE_SIZE-1);if(error)throw error;const rows=data||[];if(!rows.length){totalCount=offset;hasMore=false;countText();return}append(rows,offset===0);offset+=rows.length;hasMore=offset<totalCount;countText()}catch(err){console.warn('Library:',err.message);loadFailed=true;if(!images.length){usingFallback=true;totalCount=fallback.length;append(fallback,true);offset=fallback.length;hasMore=false}countText()}finally{loading=false;if(loadBtn){loadBtn.disabled=false;loadBtn.textContent=loadFailed?'Thử tải lại':'Tải thêm ảnh'};loadingBox.hidden=true;if(hasMore&&!loadFailed&&sentinelObserver&&sentinel){requestAnimationFrame(()=>{sentinelObserver.unobserve(sentinel);sentinelObserver.observe(sentinel)})}}}
const modal=$('#libraryLightbox'),lightImg=$('#libraryLightboxImage'),incomingImg=$('#libraryLightboxIncoming'),stage=$('#libraryLightboxStage'),figure=$('#libraryLightboxFigure'),caption=$('#libraryLightboxCaption'),indicator=$('#libraryLightboxCount');
let lightboxBusy=false,pendingDelta=0,swipeStartX=0,swipeStartY=0,swipeTracking=false;
const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function preloadUrl(url){return new Promise(resolve=>{if(!url){resolve(false);return}const im=new Image();im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=url})}
function preloadNeighbors(){[images[activeIndex-1],images[activeIndex+1]].filter(Boolean).forEach(x=>{const pre=new Image();pre.src=x.image_url})}
function updateLightboxMeta(){const item=images[activeIndex];if(!item)return;caption.textContent=item.alt_text||'Cheese.Graduation';indicator.textContent=`${String(activeIndex+1).padStart(2,'0')} / ${String(totalCount||images.length).padStart(2,'0')}`;preloadNeighbors()}
function showLightbox(){const item=images[activeIndex];if(!item)return;lightImg.src=item.image_url;lightImg.alt=item.alt_text||'Ảnh Cheese.Graduation';incomingImg.removeAttribute('src');incomingImg.alt='';stage.classList.remove('anim-next','anim-prev');figure.classList.remove('switching');updateLightboxMeta()}
function openLightbox(i){activeIndex=i;showLightbox();modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeLightbox(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';stage.classList.remove('anim-next','anim-prev');figure.classList.remove('switching');lightboxBusy=false;pendingDelta=0}
async function transitionTo(nextIndex,direction){
 const item=images[nextIndex];if(!item)return;
 if(prefersReduced){activeIndex=nextIndex;showLightbox();return}
 lightboxBusy=true;figure.classList.add('switching');
 await preloadUrl(item.image_url);
 incomingImg.src=item.image_url;incomingImg.alt=item.alt_text||'Ảnh Cheese.Graduation';
 stage.classList.remove('anim-next','anim-prev');void stage.offsetWidth;stage.classList.add(direction>0?'anim-next':'anim-prev');
 await new Promise(resolve=>setTimeout(resolve,390));
 activeIndex=nextIndex;lightImg.src=item.image_url;lightImg.alt=item.alt_text||'Ảnh Cheese.Graduation';incomingImg.removeAttribute('src');incomingImg.alt='';stage.classList.remove('anim-next','anim-prev');figure.classList.remove('switching');updateLightboxMeta();lightboxBusy=false;
 if(pendingDelta){const queued=pendingDelta;pendingDelta=0;move(queued)}
}
async function move(delta){
 if(!images.length)return;
 if(lightboxBusy){pendingDelta=delta;return}
 if(delta>0&&activeIndex===images.length-1&&hasMore)await loadNext();
 if(delta>0&&activeIndex===images.length-1)return;
 const nextIndex=(activeIndex+delta+images.length)%images.length;
 if(nextIndex===activeIndex)return;
 await transitionTo(nextIndex,delta)
}
$$('[data-library-close]').forEach(x=>x.addEventListener('click',closeLightbox));
$('#libraryPrev')?.addEventListener('click',()=>move(-1));$('#libraryNext')?.addEventListener('click',()=>move(1));loadBtn?.addEventListener('click',loadNext);
if(stage){
 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;swipeTracking=true;swipeStartX=e.clientX;swipeStartY=e.clientY;try{stage.setPointerCapture(e.pointerId)}catch(_){}});
 stage.addEventListener('pointerup',e=>{if(!swipeTracking)return;swipeTracking=false;const dx=e.clientX-swipeStartX,dy=e.clientY-swipeStartY;try{stage.releasePointerCapture(e.pointerId)}catch(_){}if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.15)move(dx<0?1:-1)});
 stage.addEventListener('pointercancel',()=>{swipeTracking=false});
}
document.addEventListener('keydown',e=>{if(!modal.classList.contains('open'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});
if('IntersectionObserver'in window&&sentinel){sentinelObserver=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting&&hasMore&&!loading)loadNext()},{rootMargin:'700px 0px'});sentinelObserver.observe(sentinel)}
loadNext();
})();
