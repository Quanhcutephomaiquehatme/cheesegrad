(()=>{
 const section=document.getElementById('photographers');
 if(!section)return;
 const rail=section.querySelector('.cheese-photographer-grid');
 if(!rail)return;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const isDirectory=new URLSearchParams(location.search).get('trang')==='tho';

 const visibleCards=()=>[...rail.querySelectorAll('.photographer-card:not(.hidden)')];
 const currentCardIndex=()=>{
   const cards=visibleCards();
   if(!cards.length)return 0;
   const left=rail.scrollLeft;
   let best=0,bestDistance=Infinity;
   cards.forEach((card,index)=>{
     const distance=Math.abs(card.offsetLeft-left);
     if(distance<bestDistance){bestDistance=distance;best=index;}
   });
   return best;
 };
 const move=direction=>{
   const cards=visibleCards();
   if(!cards.length)return;
   const current=currentCardIndex();
   const next=Math.max(0,Math.min(cards.length-1,current+direction));
   const card=cards[next];
   rail.scrollTo({left:card.offsetLeft-rail.offsetLeft,behavior:reduced?'auto':'smooth'});
   cards.forEach((item,index)=>item.classList.toggle('is-rail-active',index===next));
 };
 rail.addEventListener('keydown',event=>{
   if(event.target!==rail)return;
   if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
     event.preventDefault();
     move(event.key==='ArrowRight'?1:-1);
   }
 });
 section.classList.remove('grid-view');
 const prevButton=document.getElementById('photographerPrev');
 const nextButton=document.getElementById('photographerNext');
 prevButton?.addEventListener('click',()=>move(-1));
 nextButton?.addEventListener('click',()=>move(1));
 const updateNavButtons=()=>{
   if(isDirectory)return;
   const cards=visibleCards();
   const index=currentCardIndex();
   if(prevButton)prevButton.disabled=index<=0&&rail.scrollLeft<=2;
   if(nextButton)nextButton.disabled=index>=cards.length-1&&rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-2;
 };


 // Desktop mouse drag: update only scrollLeft in rAF. No per-card transforms while dragging.
 let dragging=false,moved=false,startX=0,startScroll=0,pointerId=null,pendingX=0,dragRaf=0,lastX=0,lastT=0,velocity=0,momentumRaf=0;
 const renderDrag=()=>{
   dragRaf=0;
   if(!dragging)return;
   rail.scrollLeft=startScroll-(pendingX-startX);
 };
 const queueDrag=x=>{
   pendingX=x;
   if(!dragRaf)dragRaf=requestAnimationFrame(renderDrag);
 };
 const nearestCard=()=>{
   const cards=visibleCards();
   if(!cards.length)return null;
   const box=rail.getBoundingClientRect();
   const targetX=box.left+Math.min(box.width/2,cards[0].getBoundingClientRect().width/2+4);
   let best=null,bestDistance=Infinity;
   cards.forEach(card=>{
     const r=card.getBoundingClientRect();
     const distance=Math.abs(r.left-targetX);
     if(distance<bestDistance){bestDistance=distance;best=card;}
   });
   return best;
 };
 const markActive=()=>{
   if(isDirectory)return;
   const active=nearestCard();
   visibleCards().forEach(card=>card.classList.toggle('is-rail-active',card===active));
 };


 rail.addEventListener('pointerdown',event=>{
   if(isDirectory||event.pointerType!=='mouse'||event.button!==0||event.target.closest('button,a,input,select'))return;
   if(momentumRaf){cancelAnimationFrame(momentumRaf);momentumRaf=0;}
   dragging=true;moved=false;startX=event.clientX;pendingX=event.clientX;startScroll=rail.scrollLeft;pointerId=event.pointerId;lastX=event.clientX;lastT=performance.now();velocity=0;
   rail.classList.add('is-dragging');
 });
 rail.addEventListener('pointermove',event=>{
   if(!dragging||event.pointerId!==pointerId)return;
   const delta=event.clientX-startX;
   if(!moved&&Math.abs(delta)>4){
     moved=true;
     try{rail.setPointerCapture(event.pointerId)}catch(_){ }
   }
   if(moved){
     event.preventDefault();
     const now=performance.now();
     const dt=Math.max(1,now-lastT);
     velocity=(event.clientX-lastX)/dt;
     lastX=event.clientX;lastT=now;
     queueDrag(event.clientX);
   }
 });
 const release=event=>{
   if(!dragging)return;
   if(moved)rail.scrollLeft=startScroll-(pendingX-startX);
   dragging=false;
   if(dragRaf){cancelAnimationFrame(dragRaf);dragRaf=0;}
   rail.classList.remove('is-dragging');
   if(event&&pointerId!=null){try{rail.releasePointerCapture(pointerId)}catch(_){ }}
   pointerId=null;
   if(moved&&!reduced){
     let v=Math.max(-24,Math.min(24,-velocity*15));
     const glide=()=>{
       if(Math.abs(v)<.18){momentumRaf=0;markActive();return;}
       rail.scrollLeft+=v;
       v*=.92;
       momentumRaf=requestAnimationFrame(glide);
     };
     momentumRaf=requestAnimationFrame(glide);
   }else{
     requestAnimationFrame(markActive);
   }
 };
 window.addEventListener('pointerup',release);
 rail.addEventListener('pointercancel',event=>{release(event);moved=false;});
 rail.addEventListener('lostpointercapture',release);
 rail.addEventListener('dragstart',event=>event.preventDefault());
 rail.addEventListener('click',event=>{
   if(moved){event.preventDefault();event.stopImmediatePropagation();moved=false;}
 },true);

 // Touch stays 100% native. Only update the active card once scrolling has stopped.
 let scrollIdle=0;
 rail.addEventListener('scroll',()=>{
   if(isDirectory)return;
   clearTimeout(scrollIdle);
   scrollIdle=setTimeout(()=>{markActive();updateNavButtons();},130);
 },{passive:true});
 if('onscrollend' in window){rail.addEventListener('scrollend',()=>{markActive();updateNavButtons();},{passive:true});}
 window.addEventListener('resize',()=>requestAnimationFrame(markActive),{passive:true});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{markActive();updateNavButtons();}));

 if(isDirectory)document.title='Tất cả thợ ảnh | Cheese.Graduation';
 document.querySelectorAll('.nav-wrap nav a,.mobile-drawer a,.nav-cta,.hero-main-btn').forEach(link=>{
   if(link.getAttribute('href')==='#photographers'||link.getAttribute('href')===location.pathname+'#photographers'){
     link.href=location.pathname+'?trang=tho';
     if(link.closest('nav'))link.textContent='Chọn thợ';
   }
 });
 if(isDirectory){
   document.querySelectorAll('.nav-wrap a,.mobile-drawer a').forEach(link=>{
     const href=link.getAttribute('href');
     if(href&&href.startsWith('#'))link.href=location.pathname+href;
   });
 }

 const slug=new URLSearchParams(location.search).get('tho');
 const cards=[...rail.querySelectorAll('.profile-link')];
 const i=cards.findIndex(link=>new URL(link.href).searchParams.get('tho')===slug);
 if(i>=0){
   const neighbours=document.createElement('nav');
   neighbours.className='profile-neighbours';
   neighbours.setAttribute('aria-label','Chuyển hồ sơ thợ');
   const before=cards[(i-1+cards.length)%cards.length],after=cards[(i+1)%cards.length];
   for(const [link,prefix] of [[before,'← '],[after,'Tiếp theo: ']]){
     const a=document.createElement('a');
     a.href=link.href;
     a.textContent=prefix+link.closest('article').querySelector('h3').textContent;
     neighbours.append(a);
   }
   document.querySelector('.profile-shell')?.append(neighbours);
 }
})();
