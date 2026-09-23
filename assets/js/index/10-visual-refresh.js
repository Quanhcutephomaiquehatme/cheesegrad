(() => {
'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const marks=[...document.querySelectorAll('.brand-watermark')];
let frame=0;
function update(){
  frame=0;
  document.body.classList.toggle('studio-scrolled',scrollY>28);
  if(reduced.matches)return;
  marks.forEach(mark=>{
    const r=mark.parentElement.getBoundingClientRect();
    if(r.bottom>0&&r.top<innerHeight){
      mark.style.setProperty('--brand-drift',Math.max(-14,Math.min(14,(innerHeight/2-r.top)*.025))+'px');
    }
  });
}
addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
update();
reduced.addEventListener('change',()=>{marks.forEach(m=>m.style.removeProperty('--brand-drift'));update();});
if(reduced.matches||!('IntersectionObserver'in window))return;

// Keep only small supporting-card reveals. Section headings now use continuous subtle CSS motion.
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    observer.unobserve(entry.target);
    if(reduced.matches)return;
    entry.target.animate([
      {opacity:.7,translate:'0 10px'},
      {opacity:1,translate:'0 0'}
    ],{duration:520,easing:'cubic-bezier(.22,1,.36,1)'});
  });
},{threshold:.12});
document.querySelectorAll('.step,.trust-card').forEach(el=>observer.observe(el));
})();
