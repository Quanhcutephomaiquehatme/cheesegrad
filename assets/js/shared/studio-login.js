(() => {
'use strict';
const $=s=>document.querySelector(s),auth=window.CheeseAuth;
let busy=false;
function selectedRole(){return window.CheeseLoginRole?.role||document.body.dataset.loginRole||'admin';}
function defaultButton(){return selectedRole()==='admin'?'Đăng nhập Admin →':'Đăng nhập Photographer →';}
function state(value){busy=value;$('#loginButton').disabled=value;$('#loginButton').textContent=value?'Đang kiểm tra tài khoản…':defaultButton();}
async function route(enforceSelected=false){
 const account=await auth.resolve();
 if(!account)return false;
 if(enforceSelected&&account.role!==selectedRole()){
  const actual=account.role==='admin'?'Admin':'Photographer';
  const chosen=selectedRole()==='admin'?'Admin':'Photographer';
  try{await auth.client.auth.signOut({scope:'local'});}catch{}
  throw Error(`Tài khoản này thuộc không gian ${actual}. Hãy chọn tab ${actual} thay vì ${chosen} rồi đăng nhập lại.`);
 }
 location.replace(auth.destination(account.role));return true;
}
$('#loginForm').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;state(true);$('#authError').textContent='';
 try{
  if(!auth.client)throw Error('Chưa kết nối được dịch vụ đăng nhập. Kiểm tra mạng và cấu hình studio.');
  const {error}=await auth.client.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});
  if(error)throw Error('Không đăng nhập được. Kiểm tra email, mật khẩu và kết nối mạng.');
  $('#password').value='';await route(true);
 }catch(error){$('#authError').textContent=error.message;}
 finally{state(false);}
});
(async()=>{state(true);try{await route(false);}catch(error){$('#authError').textContent=error.message;}finally{state(false);}})();
})();
