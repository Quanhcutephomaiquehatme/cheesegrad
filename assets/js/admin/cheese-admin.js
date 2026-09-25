(() => {
'use strict';
const cfg=window.CHEESE_CONFIG||{};
const client=window.supabase&&cfg.supabaseUrl&&cfg.supabaseAnonKey?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const destination=role=>role==='admin'?'admin.html':'lich-tho.html';
async function resolve(){
 if(!client)throw Error('Chưa kết nối được dịch vụ đăng nhập. Kiểm tra mạng và cấu hình studio.');
 const {data,error}=await client.auth.getSession();if(error)throw error;
 if(!data.session)return null;
 const permission=await client.rpc('is_admin');
 if(permission.error)throw Error('Chưa kiểm tra được quyền tài khoản. Vui lòng thử lại.');
 if(permission.data===true)return {role:'admin',user:data.session.user};
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const crew=await client.rpc('photographer_my_schedule',{p_from:day,p_to:day});
 if(crew.error){
  if(crew.error.message?.includes('PHOTOGRAPHER_NOT_LINKED'))throw Error('Tài khoản chưa được gắn với hồ sơ thợ đang hoạt động. Vui lòng liên hệ admin.');
  throw Error('Chưa kiểm tra được quyền thợ. Kiểm tra kết nối hoặc liên hệ admin để kích hoạt trang lịch.');
 }
 if(!crew.data?.member)throw Error('Tài khoản chưa được cấp quyền truy cập.');
 return {role:'photographer',user:data.session.user};
}
async function guard(role){
 try{
  const account=await resolve();
  if(!account){location.replace('dang-nhap.html');return null;}
  if(account.role!==role){location.replace(destination(account.role));return null;}
  return account;
 }catch(error){
  console.error('CheeseAuth.guard:',error);
  try{if(client)await client.auth.signOut({scope:'local'});}catch{}
  location.replace('dang-nhap.html');
  return null;
 }
}
async function logout(){
 if(client){const {error}=await client.auth.signOut({scope:'local'});if(error)throw Error('Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại.');}
 location.replace('dang-nhap.html');
}
window.CheeseAuth={client,resolve,guard,logout,destination};
})();
