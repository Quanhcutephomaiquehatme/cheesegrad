(() => {
  'use strict';
  const fallback=(window.CHEESE_HERO_LOCAL_IMAGES||[]).map((image_url,i)=>({
    id:`local-${i+1}`,image_url,sort_order:(i+1)*10,active:true,alt_text:`Ảnh tốt nghiệp Cheese.Graduation ${i+1}`
  }));
  const cfg=window.CHEESE_CONFIG||{};
  const configured=/^https:\/\/.+\.supabase\.co$/i.test(String(cfg.supabaseUrl||'').trim()) &&
    !String(cfg.supabaseAnonKey||'').includes('PASTE_') && String(cfg.supabaseAnonKey||'').length>20 && window.supabase;

  function safe(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function groupHtml(items,offset=0){
    return items.map((item,i)=>`<figure class="hero-shot portrait"><img src="${safe(item.image_url)}" alt="${safe(item.alt_text||`Ảnh tốt nghiệp Cheese.Graduation ${offset+i+1}`)}" decoding="async" ${offset+i>5?'loading="lazy"':''}></figure>`).join('');
  }
  function render(items){
    const valid=(items||[]).filter(x=>x&&x.image_url);
    if(!valid.length)return;
    const split=Math.ceil(valid.length/2);
    const top=valid.slice(0,split), bottom=valid.slice(split);
    const topItems=top.length?top:valid;
    const bottomItems=bottom.length?bottom:valid;
    const topTrack=document.querySelector('.hero-strip-top .hero-strip-track');
    const bottomTrack=document.querySelector('.hero-strip-bottom .hero-strip-track');
    if(topTrack){const g=groupHtml(topItems,0);topTrack.innerHTML=`<div class="hero-strip-group">${g}</div><div class="hero-strip-group" aria-hidden="true">${g}</div>`;}
    if(bottomTrack){const g=groupHtml(bottomItems,topItems.length);bottomTrack.innerHTML=`<div class="hero-strip-group">${g}</div><div class="hero-strip-group" aria-hidden="true">${g}</div>`;}
    document.documentElement.style.setProperty('--cg-hero-photo-count',String(valid.length));
  }

  async function load(){
    let items=fallback;
    if(configured){
      try{
        const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
        const {data,error}=await db.from('site_hero_images').select('id,image_url,alt_text,sort_order,active').eq('active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
        if(!error && Array.isArray(data) && data.length)items=data;
        else if(error)console.warn('Hero images:',error.message);
      }catch(err){console.warn('Hero images:',err.message);}
    }
    render(items);
    window.CHEESE_HERO_IMAGES=items;
    return items;
  }
  window.CHEESE_HERO_READY=load();
})();
