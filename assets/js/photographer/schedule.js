(() => {
'use strict';
const $=s=>document.querySelector(s), cfg=window.CHEESE_CONFIG||{};
const db=window.CheeseAuth.client;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dayDate=s=>new Date(`${s}T12:00:00`),dateLabel=s=>dayDate(s).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
const statusText={new:'Mới',contacted:'Đã liên hệ',deposit_pending:'Chờ cọc',confirmed:'Đã chốt',completed:'Hoàn thành',cancelled:'Đã hủy',rejected:'Từ chối',blocked:'Khóa lịch',manual:'Lịch bổ sung'};
const pending=x=>['new','contacted','deposit_pending'].includes(x.status),active=x=>!['cancelled','rejected'].includes(x.status);
let month=dayDate(today());month.setDate(1);
const demoConfirmations=new Map();let activeDetail=null;
let selected=null,items=[],member=null,demo=false,requestId=0,loggedIn=false,lastFocus=null;
const bounds=()=>({from:iso(new Date(month.getFullYear(),month.getMonth(),1)),to:iso(new Date(month.getFullYear(),month.getMonth()+1,0))});
const tone=x=>x.status==='confirmed'?'confirmed':pending(x)?'pending':'blocked';
const sort=(a,b)=>a.date.localeCompare(b.date)||({'Cả ngày':0,'Sáng':1,'Chiều':2}[a.slot]??3)-({'Cả ngày':0,'Sáng':1,'Chiều':2}[b.slot]??3)||a.id.localeCompare(b.id);
function clearData(){activeDetail=null;demoConfirmations.clear();items=[];member=null;selected=null;$('#agenda').replaceChildren();$('#calendar').replaceChildren();$('#memberName').textContent='';$('#memberTeam').textContent='';$('#detailBody').replaceChildren();$('#detailTitle').textContent='';if($('#detailDialog').open)$('#detailDialog').close();}
function reset(){requestId++;loggedIn=false;demo=false;clearData();$('#workspace').hidden=true;$('#authScreen').hidden=false;}
function openWorkspace(){loggedIn=true;$('#authScreen').hidden=true;$('#workspace').hidden=false;$('#demoBanner').hidden=!demo;$('#logoutButton').textContent=demo?'Thoát xem thử':'Đăng xuất';}
function filtered(){const q=norm($('#scheduleSearch').value),state=$('#statusFilter').value;return items.filter(x=>(!selected||x.date===selected)&&(!q||norm([x.title,x.code,x.school,x.class_name,x.slot].join(' ')).includes(q))&&(state==='all'||state==='active'&&active(x)||state==='pending'&&pending(x)||state==='blocked'&&x.kind!=='booking'||state==='cancelled'&&!active(x)||x.status===state));}
function render(){
 const title=month.toLocaleDateString('vi-VN',{month:'long',year:'numeric'});$('#monthTitle').textContent=title[0].toUpperCase()+title.slice(1);
 $('#memberName').textContent=member?.name||'';$('#memberTeam').textContent=[member?.team,'Lịch được studio phân công'].filter(Boolean).join(' · ');
 const bookings=items.filter(x=>x.kind==='booking');$('#monthCount').textContent=bookings.filter(active).length;$('#confirmedCount').textContent=bookings.filter(x=>x.status==='confirmed').length;$('#pendingCount').textContent=bookings.filter(pending).length;$('#blockedCount').textContent=new Set(items.filter(x=>x.kind==='block'||x.kind==='manual'&&x.blocks_booking).map(x=>x.date)).size;
 const first=new Date(month.getFullYear(),month.getMonth(),1),offset=(first.getDay()+6)%7,total=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 $('#calendar').innerHTML=Array.from({length:Math.ceil((offset+total)/7)*7},(_,i)=>{
  const d=new Date(month.getFullYear(),month.getMonth(),i-offset+1),key=iso(d),inside=d.getMonth()===month.getMonth(),events=items.filter(x=>x.date===key&&active(x));
  return `<button class="day ${inside?'':'outside'} ${key===today()?'today':''} ${key===selected?'selected':''}" data-day="${key}" ${inside?'':'disabled'} aria-pressed="${key===selected}" ${key===today()?'aria-current="date"':''} aria-label="${dateLabel(key)}, ${events.length} lịch"><span class="day-number">${d.getDate()}</span><span class="dots">${[...new Set(events.map(tone))].map(t=>`<i class="${t}"></i>`).join('')}</span>${events.length?`<small>${events.length} lịch</small>`:''}</button>`;
 }).join('');
 $('#agendaTitle').textContent=selected?`Ngày ${dateLabel(selected)}`:'Lịch trong tháng';const rows=filtered().sort(sort);$('#resultCount').textContent=`${rows.length} lịch phù hợp`;
 $('#agenda').innerHTML=rows.length?rows.map(x=>`<button class="event-card" data-id="${esc(x.id)}"><div class="event-meta"><span>${dateLabel(x.date)} · ${esc(x.slot)}</span><span class="pill ${tone(x)}">${esc(statusText[x.status]||x.status)}</span></div><h3>${esc(x.title)}</h3><p>${esc([x.school,x.class_name].filter(Boolean).join(' · ')||x.package_name||(x.kind==='block'?'Khung giờ không nhận lịch':'Lịch bổ sung từ studio'))}</p><div class="event-end"><span>${esc(x.kind==='block'?'Lịch khóa':x.confirmed_at?'✓ Bạn đã xác nhận':'◷ Bạn chưa xác nhận')}</span><span>Xem chi tiết ↗</span></div></button>`).join(''):`<div class="empty"><strong>Chưa có lịch phù hợp</strong>Thử chọn ngày khác hoặc thay đổi bộ lọc.</div>`;
}
function demoData(){const date=n=>iso(new Date(month.getFullYear(),month.getMonth(),n));return {member:{name:'Quang Anh',team:'Founder · Xem thử'},items:[
 {id:'demo1',kind:'booking',date:date(5),slot:'Sáng',title:'Lớp 12A1 · Lịch mẫu',school:'Trường học minh họa',class_name:'12A1',group_size:'30 người',package_name:'Kỷ yếu',code:'DEMO-01',status:'confirmed',note:'Tập trung tại cổng trường. Đây là nội dung minh họa.'},
 {id:'demo2',kind:'booking',date:date(12),slot:'Chiều',title:'Nhóm tốt nghiệp · Lịch mẫu',school:'Khuôn viên đại học',group_size:'4 người',code:'DEMO-02',status:'deposit_pending',note:'Chờ studio xác nhận trước buổi chụp.'},
 {id:'demo3',kind:'block',date:date(16),slot:'Cả ngày',title:'Ngày không nhận lịch',status:'blocked'},
 {id:'demo4',kind:'booking',date:date(22),slot:'Sáng',title:'Chân dung tốt nghiệp · Lịch mẫu',package_name:'Tốt nghiệp đại học',code:'DEMO-03',status:'confirmed',group_size:'1 người'},
 {id:'demo5',kind:'manual',date:date(22),slot:'Chiều',title:'Trao đổi concept với studio',status:'manual',blocks_booking:false,note:'Chuẩn bị moodboard trước buổi chụp.'},
 {id:'demo6',kind:'booking',date:date(27),slot:'Cả ngày',title:'Lịch đã hủy · Minh họa',code:'DEMO-04',status:'cancelled'}]};}
function friendly(error){if(error?.message?.includes('PHOTOGRAPHER_NOT_LINKED'))return 'Tài khoản chưa được studio gắn với hồ sơ thợ đang hoạt động. Hãy liên hệ quản trị để cấp quyền.';if(['PGRST202','42883'].includes(error?.code))return 'Studio chưa kích hoạt trang lịch thợ. Quản trị cần cài bản cập nhật lịch thợ trước khi sử dụng.';if(error?.message?.includes('AUTH_REQUIRED'))return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';return 'Không tải được lịch. Kiểm tra kết nối rồi bấm Làm mới; nếu vẫn lỗi, hãy liên hệ studio.';}
async function load(){const token=++requestId;$('#dataError').hidden=true;$('#refreshButton').disabled=true;$('#syncNote').textContent='Đang tải lịch…';items=[];render();try{let data;if(demo)data=demoData();else{if(!db)throw Error('No connection');const b=bounds();const response=await db.rpc('photographer_my_schedule',{p_from:b.from,p_to:b.to});if(response.error)throw response.error;data=response.data;}if(token!==requestId||!loggedIn)return;member=data.member;items=Array.isArray(data.items)?data.items:[];if(demo)items.forEach(x=>{x.revision=1;x.confirmed_at=demoConfirmations.get(x.id)||null;});render();$('#syncNote').textContent=demo?'Chế độ xem thử · Không đọc hoặc ghi lịch thật':`Cập nhật lúc ${new Date().toLocaleTimeString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})} · Tự làm mới mỗi phút`;}catch(error){if(token!==requestId)return;items=[];render();$('#dataError').textContent=friendly(error);$('#dataError').hidden=false;$('#agenda').innerHTML='<div class="empty"><strong>Chưa tải được dữ liệu</strong>Thông tin lịch sẽ xuất hiện sau khi kết nối thành công.</div>';['monthCount','confirmedCount','pendingCount','blockedCount'].forEach(id=>$('#'+id).textContent='—');$('#syncNote').textContent='Lịch chưa được đồng bộ.';}finally{if(token===requestId)$('#refreshButton').disabled=false;}}
function details(id){const x=items.find(item=>item.id===id);if(!x)return;activeDetail={...x};$('#confirmMessage').textContent=x.confirmed_at?'Bạn đã xác nhận lúc '+new Date(x.confirmed_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'';$('#confirmSchedule').hidden=x.kind==='block'||!!x.confirmed_at||['cancelled','rejected','completed'].includes(x.status);$('#confirmSchedule').disabled=false;lastFocus=document.activeElement;$('#detailTitle').textContent=x.title;const pairs=[['Ngày',dateLabel(x.date)],['Ca chụp',x.slot],['Trạng thái',statusText[x.status]],['Mã lịch',x.code],['Trường / địa điểm đã ghi nhận',x.school],['Lớp / nhóm',x.class_name],['Số người',x.group_size],['Gói chụp',x.package_name],['Ghi chú buổi chụp',x.note],['Ảnh hưởng nhận lịch',x.kind==='manual'?(x.blocks_booking?'Có khóa khung giờ':'Không khóa khung giờ'):null]];$('#detailBody').innerHTML='<dl>'+pairs.filter(([,v])=>v).map(([label,v])=>`<div><dt>${esc(label)}</dt><dd>${esc(v)}</dd></div>`).join('')+(x.phone?`<div><dt>Liên hệ khách</dt><dd><a href="tel:${esc(String(x.phone).replace(/[^+0-9]/g,''))}">${esc(x.phone)}</a></dd></div>`:'')+'</dl>';if(!$('#detailDialog').open)$('#detailDialog').showModal();}

$('#confirmSchedule').addEventListener('click',async()=>{
 const item=activeDetail;if(!item||item.kind==='block')return;
 const button=$('#confirmSchedule'),epoch=requestId;button.disabled=true;$('#confirmMessage').textContent='Đang gửi xác nhận…';
 try{
  let time;
  if(demo){time=new Date().toISOString();demoConfirmations.set(item.id,time);}
  else{
   const {data,error}=await db.rpc('photographer_confirm_schedule',{p_kind:item.kind,p_id:item.id.split(':')[1],p_revision:item.revision});
   if(error)throw error;time=data.confirmed_at;
  }
  if(!loggedIn||epoch!==requestId)return;
  const current=items.find(x=>x.id===item.id);if(current)current.confirmed_at=time;
  render();if(activeDetail?.id!==item.id)return;activeDetail.confirmed_at=time;button.hidden=true;
  $('#confirmMessage').textContent=demo?'Đã xác nhận trong bản xem thử. Không gửi về admin thật.':'Đã xác nhận. Studio sẽ thấy trạng thái nhận lịch của bạn.';
 }catch(error){
  if(!loggedIn||epoch!==requestId)return;
  if(error.message?.includes('SCHEDULE_CHANGED_OR_NOT_ALLOWED')){
   button.hidden=true;$('#confirmMessage').textContent='Lịch đã thay đổi hoặc không còn được giao cho bạn. Đóng chi tiết và làm mới để xem lại trước khi xác nhận.';
  }else{$('#confirmMessage').textContent='Chưa gửi được xác nhận. Kiểm tra kết nối rồi thử lại.';button.disabled=false;}
 }
});

$('#calendar').addEventListener('click',event=>{const button=event.target.closest('[data-day]');if(!button||button.disabled)return;selected=button.dataset.day;render();$('#calendar').querySelector(`[data-day="${selected}"]`)?.focus();});
$('#agenda').addEventListener('click',event=>{const button=event.target.closest('[data-id]');if(button)details(button.dataset.id);});
['closeDetail','detailDone'].forEach(id=>$('#'+id).addEventListener('click',()=>$('#detailDialog').close()));$('#detailDialog').addEventListener('close',()=>lastFocus?.focus());
$('#previousMonth').addEventListener('click',()=>{month.setMonth(month.getMonth()-1);selected=null;load();});$('#nextMonth').addEventListener('click',()=>{month.setMonth(month.getMonth()+1);selected=null;load();});$('#todayButton').addEventListener('click',()=>{month=dayDate(today());month.setDate(1);selected=today();load();});$('#allMonth').addEventListener('click',()=>{selected=null;render();});$('#statusFilter').addEventListener('change',render);$('#scheduleSearch').addEventListener('input',render);$('#refreshButton').addEventListener('click',load);
$('#logoutButton').addEventListener('click',async()=>{if(demo){location.replace('dang-nhap.html');return;}try{await window.CheeseAuth.logout();reset();}catch(error){$('#dataError').textContent=error.message;$('#dataError').hidden=false;}});
async function bootstrap(){
 if(new URLSearchParams(location.search).get('demo')==='1'){demo=true;openWorkspace();await load();return;}
 const account=await window.CheeseAuth.guard('photographer');if(!account)return;
 openWorkspace();await load();
 db.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'&&!demo){reset();location.replace('dang-nhap.html');}});
}
queueMicrotask(bootstrap);
setInterval(()=>{if(loggedIn&&!demo&&!document.hidden&&!$('#detailDialog').open&&!$('#refreshButton').disabled)load();},60000);
})();
