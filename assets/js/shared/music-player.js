(() => {
  'use strict';

  const AUDIO_SRC = 'assets/audio/mot-thoi-truant-fu.m4a';
  const KEY_TIME = 'cheese-music-time-v3';
  const KEY_UPDATED = 'cheese-music-updated-v3';
  const KEY_WANTED = 'cheese-music-wanted-v3';
  const WINDOW_TOKEN = '__CHEESE_MUSIC_STATE__';
  const VOLUME = 0.22;

  const safeLocal = {
    get(key){ try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key,value){ try { localStorage.setItem(key,value); } catch (_) {} }
  };
  const safeSession = {
    get(key){ try { return sessionStorage.getItem(key); } catch (_) { return null; } },
    set(key,value){ try { sessionStorage.setItem(key,value); } catch (_) {} }
  };

  function readWindowState(){
    try{
      const name=String(window.name||'');
      const idx=name.lastIndexOf(WINDOW_TOKEN);
      if(idx<0)return null;
      const raw=name.slice(idx+WINDOW_TOKEN.length);
      return JSON.parse(decodeURIComponent(raw));
    }catch(_){return null}
  }

  function writeWindowState(state){
    try{
      const name=String(window.name||'');
      const idx=name.lastIndexOf(WINDOW_TOKEN);
      const base=idx>=0?name.slice(0,idx):name;
      window.name=base+WINDOW_TOKEN+encodeURIComponent(JSON.stringify(state));
    }catch(_){}
  }

  function ensureStyle(){
    if(document.getElementById('cheese-shared-music-style'))return;
    const style=document.createElement('style');
    style.id='cheese-shared-music-style';
    style.textContent=`
      .music-toggle{
        position:fixed;right:18px;bottom:18px;z-index:1200;
        display:flex;align-items:center;gap:9px;
        border:1px solid rgba(255,255,255,.2);
        background:#102a43;color:#fff;border-radius:999px;
        padding:10px 14px 10px 11px;
        box-shadow:0 12px 35px rgba(10,28,44,.22);
        font:700 12px/1 "Be Vietnam Pro",Arial,sans-serif;
        cursor:pointer;transition:transform .25s ease,background .25s ease
      }
      .music-toggle:hover{transform:translateY(-2px);background:#153a59}
      .music-toggle.is-playing{background:#d8ab00;color:#102a43}
      .music-toggle.is-waiting{background:#173d5d;color:#fff}
      .music-bars{display:flex;align-items:flex-end;gap:2px;width:15px;height:14px}
      .music-bars i{display:block;width:3px;height:6px;background:currentColor;border-radius:3px;transform-origin:bottom}
      .music-toggle.is-playing .music-bars i:nth-child(1){animation:cheeseMusicBar .75s ease-in-out infinite alternate}
      .music-toggle.is-playing .music-bars i:nth-child(2){animation:cheeseMusicBar .55s .12s ease-in-out infinite alternate}
      .music-toggle.is-playing .music-bars i:nth-child(3){animation:cheeseMusicBar .68s .22s ease-in-out infinite alternate}
      @keyframes cheeseMusicBar{to{height:14px}}
      @media(max-width:620px){.music-toggle{right:12px;bottom:12px;padding:9px 12px 9px 10px;font-size:11px}}
    `;
    document.head.appendChild(style);
  }

  function ensurePlayer(){
    let audio=document.getElementById('cheeseMusic');
    if(!audio){
      audio=document.createElement('audio');
      audio.id='cheeseMusic';
      audio.preload='auto';
      audio.loop=true;
      audio.autoplay=true;
      audio.setAttribute('playsinline','');
      audio.setAttribute('aria-hidden','true');
      const source=document.createElement('source');
      source.src=AUDIO_SRC;
      source.type='audio/mp4';
      audio.appendChild(source);
      document.body.appendChild(audio);
    }

    let btn=document.getElementById('musicToggle');
    if(!btn){
      btn=document.createElement('button');
      btn.id='musicToggle';
      btn.type='button';
      btn.className='music-toggle';
      btn.setAttribute('aria-label','Bật hoặc tắt nhạc nền');
      btn.setAttribute('aria-pressed','false');
      btn.innerHTML=`<span aria-hidden="true" class="music-bars"><i></i><i></i><i></i></span><span class="music-label">Bật nhạc</span>`;
      document.body.appendChild(btn);
    }
    return {audio,btn};
  }

  ensureStyle();
  const {audio,btn}=ensurePlayer();
  const label=btn.querySelector('.music-label');
  audio.volume=VOLUME;

  // Mặc định mỗi tab mới đều muốn phát nhạc. Nếu khách tắt nhạc,
  // trạng thái tắt chỉ được giữ trong tab hiện tại khi đổi trang/reload.
  let wanted=safeSession.get(KEY_WANTED)!=='off';
  let restored=false;
  let initialized=false;

  // Chụp snapshot NGAY KHI script chạy, trước khi audio có thể timeupdate.
  // Điều này tránh lỗi trang mới ghi đè vị trí cũ bằng 0:00.
  const windowState=readWindowState();
  const storedTime=Number(safeLocal.get(KEY_TIME));
  const storedUpdated=Number(safeLocal.get(KEY_UPDATED));
  const initialTime=Number.isFinite(storedTime) && storedTime>=0
    ? storedTime
    : (Number.isFinite(Number(windowState?.time)) ? Number(windowState.time) : 0);
  const initialUpdated=Number.isFinite(storedUpdated) && storedUpdated>0
    ? storedUpdated
    : (Number.isFinite(Number(windowState?.updated)) ? Number(windowState.updated) : Date.now());

  function setUI(on,waiting=false){
    btn.classList.toggle('is-playing',on);
    btn.classList.toggle('is-waiting',waiting&&!on);
    btn.setAttribute('aria-pressed',on?'true':'false');
    if(label)label.textContent=on?'Tắt nhạc':(waiting?'Chạm để nghe':'Bật nhạc');
  }

  function getState(){
    return {time:Number.isFinite(audio.currentTime)?audio.currentTime:0,updated:Date.now(),wanted};
  }

  function savePosition(){
    if(!restored || !Number.isFinite(audio.currentTime))return;
    const state=getState();
    safeLocal.set(KEY_TIME,String(state.time));
    safeLocal.set(KEY_UPDATED,String(state.updated));
    writeWindowState(state);
  }

  function targetTime(){
    const elapsed=Math.max(0,(Date.now()-initialUpdated)/1000);
    let target=Math.max(0,initialTime+Math.min(elapsed,10));
    if(Number.isFinite(audio.duration)&&audio.duration>0)target%=audio.duration;
    return target;
  }

  function restorePosition(){
    if(restored)return;
    try{audio.currentTime=targetTime()}catch(_){}
    restored=true;
    savePosition();
  }

  function waitForMetadata(){
    if(audio.readyState>=1)return Promise.resolve();
    return new Promise(resolve=>{
      const done=()=>resolve();
      audio.addEventListener('loadedmetadata',done,{once:true});
      // Không treo vô hạn nếu browser tải metadata chậm.
      setTimeout(done,1800);
    });
  }

  async function tryAudiblePlay(){
    if(!wanted)return false;
    audio.muted=false;
    audio.volume=VOLUME;
    try{
      await audio.play();
      setUI(true,false);
      return true;
    }catch(_){
      return false;
    }
  }

  async function startMutedWarmup(){
    // Muted autoplay thường được browser cho phép. Nó giúp timeline tiếp tục
    // ngay cả khi autoplay có tiếng bị chặn. Tương tác đầu tiên sẽ bật tiếng.
    if(!wanted)return;
    try{
      audio.muted=true;
      await audio.play();
      setUI(false,true);
    }catch(_){
      setUI(false,true);
    }
  }

  async function initialize(){
    if(initialized)return;
    initialized=true;
    await waitForMetadata();
    restorePosition();
    if(!wanted){
      audio.pause();
      setUI(false,false);
      return;
    }
    const audible=await tryAudiblePlay();
    if(!audible)await startMutedWarmup();
  }

  async function resumeWithSound(){
    if(!wanted)return;
    if(!restored){
      await waitForMetadata();
      restorePosition();
    }
    audio.muted=false;
    try{
      await audio.play();
      setUI(true,false);
    }catch(_){
      setUI(false,true);
    }
  }

  function stopMusic(){
    wanted=false;
    safeSession.set(KEY_WANTED,'off');
    savePosition();
    audio.pause();
    audio.muted=false;
    setUI(false,false);
  }

  function enableMusic(){
    wanted=true;
    safeSession.set(KEY_WANTED,'on');
    resumeWithSound();
  }

  btn.addEventListener('click',()=>{
    if(wanted && !audio.paused && !audio.muted)stopMusic();
    else enableMusic();
  });

  audio.addEventListener('play',()=>{
    if(!audio.muted)setUI(true,false);
  });
  audio.addEventListener('pause',()=>{
    if(!wanted)setUI(false,false);
  });
  audio.addEventListener('timeupdate',()=>{
    // Chỉ lưu SAU KHI đã khôi phục vị trí cũ.
    if(restored&&!audio.paused)savePosition();
  });

  // Lưu sớm ngay khi người dùng bấm một liên kết nội bộ.
  document.addEventListener('pointerdown',event=>{
    if(event.target.closest('a[href]'))savePosition();
  },{capture:true,passive:true});

  window.addEventListener('pagehide',savePosition);
  window.addEventListener('beforeunload',savePosition);
  window.addEventListener('pageshow',()=>{
    if(wanted&&restored&&audio.paused)tryAudiblePlay();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&wanted&&restored&&audio.paused)tryAudiblePlay();
  });

  // Khi browser chặn autoplay có tiếng, chỉ cần khách chạm/click/phím ở bất kỳ đâu.
  // Không cần bấm riêng nút nhạc.
  const firstInteraction=()=>{
    if(wanted && (audio.paused||audio.muted))resumeWithSound();
    document.removeEventListener('pointerdown',firstInteraction,true);
    document.removeEventListener('touchstart',firstInteraction,true);
    document.removeEventListener('keydown',firstInteraction,true);
  };
  document.addEventListener('pointerdown',firstInteraction,{once:true,capture:true,passive:true});
  document.addEventListener('touchstart',firstInteraction,{once:true,capture:true,passive:true});
  document.addEventListener('keydown',firstInteraction,{once:true,capture:true});

  initialize();
})();
