(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const data={
 admin:{
  image:'assets/images/login/admin-hero-custom.jpg', imageAlt:'Không gian quản trị Cheese.Graduation',
  kicker:'ADMIN / STUDIO', eyebrow:'QUẢN TRỊ STUDIO',
  title:'Điều hành studio.<br><em>Giữ mọi thứ liền mạch.</em>',
  text:'Quản lý booking, lịch chụp, photographer, bảng giá và vận hành studio trong một không gian.',
  heading:'Đăng nhập Admin', intro:'Dành cho tài khoản quản trị Cheese.Graduation.',
  badge:'ADMIN ACCESS', hint:'Quản trị studio', emailLabel:'Email Admin', emailPlaceholder:'admin@studio.com', passwordPlaceholder:'Nhập mật khẩu Admin',
  button:'Đăng nhập Admin →', help:'Chưa có tài khoản Admin hoặc quên mật khẩu? Liên hệ quản trị hệ thống để được hỗ trợ.'
 },
 photographer:{
  image:'assets/images/hero/hero-01.webp', imageAlt:'Photographer Cheese.Graduation trong buổi chụp',
  kicker:'PHOTOGRAPHER / CREW', eyebrow:'LỊCH CHỤP CÁ NHÂN',
  title:'Mỗi buổi chụp.<br><em>Một câu chuyện.</em>',
  text:'Xem lịch cá nhân, thông tin buổi chụp và những booking studio đã phân công cho bạn.',
  heading:'Đăng nhập Photographer', intro:'Không gian làm việc riêng dành cho photographer của studio.',
  badge:'PHOTOGRAPHER ACCESS', hint:'Lịch chụp cá nhân', emailLabel:'Email Photographer', emailPlaceholder:'Email tài khoản của bạn', passwordPlaceholder:'Nhập mật khẩu Photographer',
  button:'Đăng nhập Photographer →', help:'Chưa được cấp tài khoản hoặc chưa liên kết hồ sơ thợ? Liên hệ Admin để được kích hoạt.'
 }
};
let role='admin';
function setRole(next,initial=false){
 if(!data[next])return; role=next; const d=data[next];
 document.body.dataset.loginRole=next;
 const layout=$('#authScreen'), panel=$('#roleLoginPanel'), image=$('#roleHeroImage');
 layout?.classList.toggle('role-admin',next==='admin'); layout?.classList.toggle('role-photographer',next==='photographer');
 if(!initial)panel?.classList.add('is-switching');
 $$('.login-role-button').forEach(btn=>{const active=btn.dataset.loginRole===next;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',String(active));});
 const apply=()=>{
  if(image){image.src=d.image;image.alt=d.imageAlt;image.style.transform='scale(1.015)';}
  $('#roleHeroKicker').textContent=d.kicker; $('#roleHeroEyebrow').textContent=d.eyebrow; $('#roleHeroTitle').innerHTML=d.title; $('#roleHeroText').textContent=d.text;
  $('#loginHeading').textContent=d.heading; $('#loginIntro').textContent=d.intro; $('#rolePanelBadge').textContent=d.badge; $('#rolePanelHint').textContent=d.hint;
  $('#emailLabel').textContent=d.emailLabel; $('#email').placeholder=d.emailPlaceholder; $('#password').placeholder=d.passwordPlaceholder; $('#loginButton').textContent=d.button; $('#loginHelp').textContent=d.help;
  $('#authError').textContent='';
  panel?.classList.remove('is-switching');
 };
 if(initial)apply(); else setTimeout(apply,110);
}
$$('.login-role-button').forEach(btn=>btn.addEventListener('click',()=>setRole(btn.dataset.loginRole)));
window.CheeseLoginRole={get role(){return role;},setRole};
setRole('admin',true);
})();
