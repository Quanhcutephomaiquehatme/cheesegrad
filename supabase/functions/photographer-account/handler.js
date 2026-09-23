// Service credentials remain inside the Edge Function; never returned or logged.
export async function handle(request,env,createClient) {
 const origin=request.headers.get('Origin')||'';
 const allowed=(env.get('ALLOWED_ORIGINS')||'').split(',').map(s=>s.trim()).filter(Boolean);
 const headers={'Content-Type':'application/json','Vary':'Origin','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
 if(origin&&allowed.includes(origin))headers['Access-Control-Allow-Origin']=origin;
 const reply=(status,message,extra={})=>new Response(JSON.stringify({message,...extra}),{status,headers});
 if(origin&&!allowed.includes(origin))return reply(403,'Tên miền chưa được cấp phép.');
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply(405,'Phương thức không hỗ trợ.');
 const url=env.get('SUPABASE_URL'),anon=env.get('SUPABASE_ANON_KEY'),secret=env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!anon||!secret)return reply(503,'Chưa cấu hình dịch vụ tài khoản.');
 const authorization=request.headers.get('Authorization')||'';
 if(!authorization.startsWith('Bearer '))return reply(401,'Vui lòng đăng nhập admin.');
 try {
  const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const auth=await caller.auth.getUser(authorization.slice(7));
  if(auth.error||!auth.data.user)return reply(401,'Phiên đăng nhập không hợp lệ.');
  const permission=await caller.rpc('is_admin');
  if(permission.error||permission.data!==true)return reply(403,'Chỉ admin được quản lý tài khoản thợ.');
  const raw=await request.text();if(raw.length>4096)return reply(413,'Dữ liệu quá dài.');
  let body;try{body=JSON.parse(raw);}catch{return reply(400,'Dữ liệu không hợp lệ.');}
  const id=String(body.photographer_id||''),email=String(body.email||'').trim().toLowerCase(),password=body.password;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof password!=='string'||password.length<10||password.length>128)return reply(400,'Chọn thợ, nhập email hợp lệ và mật khẩu 10–128 ký tự.');
  const service=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const p=await service.from('photographers').select('id').eq('id',id).maybeSingle();
  if(p.error||!p.data)return reply(404,'Không tìm thấy hồ sơ thợ.');
  const admins=await service.from('admin_users').select('email');
  if(admins.error)return reply(503,'Không kiểm tra được quyền tài khoản.');
  const isAdminEmail=e=>admins.data.some(a=>a.email.toLowerCase()===String(e).toLowerCase());
  if(isAdminEmail(email))return reply(409,'Không dùng tài khoản admin làm tài khoản thợ.');
  const mapping=await service.from('photographer_accounts').select('user_id').eq('photographer_id',id).maybeSingle();
  if(mapping.error)return reply(503,'Chưa thiết lập liên kết tài khoản thợ.');
  if(mapping.data){
   const existing=await service.auth.admin.getUserById(mapping.data.user_id);
   if(existing.error||!existing.data.user||isAdminEmail(existing.data.user.email))return reply(409,'Liên kết tài khoản cần quản trị kiểm tra lại.');
   if(existing.data.user.email.toLowerCase()!==email)return reply(409,'Email đã được liên kết. Chỉ đặt mật khẩu mới cho email này.');
   const updated=await service.auth.admin.updateUserById(mapping.data.user_id,{password});
   if(updated.error)return reply(400,'Không đặt được mật khẩu. Kiểm tra yêu cầu mật khẩu của studio.');
   return reply(200,'Đã đặt mật khẩu mới.',{email,updated:true});
  }
  const created=await service.auth.admin.createUser({email,password,email_confirm:true});
  if(created.error||!created.data.user)return reply(409,'Không tạo được tài khoản. Email có thể đã tồn tại hoặc mật khẩu chưa đạt yêu cầu.');
  const linked=await service.from('photographer_accounts').insert({user_id:created.data.user.id,photographer_id:id});
  if(linked.error){
   const cleanup=await service.auth.admin.deleteUser(created.data.user.id);
   return reply(409,cleanup.error?'Chưa liên kết được. Quản trị cần kiểm tra tài khoản vừa tạo trước khi thử lại.':'Thợ đã có tài khoản hoặc liên kết thất bại. Hãy tải lại rồi thử lại.');
  }
  return reply(200,'Đã tạo và liên kết tài khoản với thợ.',{email,created:true});
 } catch {return reply(500,'Không xử lý được yêu cầu. Vui lòng thử lại.');}
}
