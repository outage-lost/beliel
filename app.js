(() => {
  'use strict';
  const A = 'recursos-visuales/';
  const $ = (id) => document.getElementById(id);
  const screens = {menu: $('menu-screen'), game: $('game-screen')};
  const sessionKey = 'beliel-session';
  let currentUser = null;

  const api = {
    async request(path, options = {}) {
      const headers = {'Content-Type':'application/json', ...(options.headers || {})};
      const saved = readSession();
      if (saved?.token) headers.Authorization = `Bearer ${saved.token}`;
      const response = await fetch(path, {...options, headers});
      const payload = await response.json();
      if (!response.ok) { const error = new Error(payload.error || 'No se pudo completar la solicitud.'); error.status = response.status; throw error; }
      return payload;
    },
    register(username, phrase) { return this.request('/api/users/register', {method:'POST',body:JSON.stringify({username,phrase})}); },
    login(username, phrase) { return this.request('/api/users/login', {method:'POST',body:JSON.stringify({username,phrase})}); },
    leaderboard() { return this.request('/api/leaderboard'); },
    score(score) { return this.request('/api/scores', {method:'POST',body:JSON.stringify({score})}); }
  };
  function readSession(){try{return JSON.parse(localStorage.getItem(sessionKey));}catch{return null;}}
  function saveSession(payload){currentUser=payload.user;localStorage.setItem(sessionKey,JSON.stringify({token:payload.token,user:payload.user}));updatePlayerLabels();}
  function clearSession(){currentUser=null;localStorage.removeItem(sessionKey);updatePlayerLabels();}
  function updatePlayerLabels(){const name=currentUser?`@${currentUser.username}`:'Sin jugador';$('active-player').textContent=name;$('hud-username').textContent=name;}
  function showScreen(name){Object.values(screens).forEach((screen)=>screen.classList.add('is-hidden'));screens[name].classList.remove('is-hidden');}
  function formatScore(value){return String(Math.max(0,Math.floor(value))).padStart(5,'0');}
  function normalizePhrase(value, trim = false){const cleaned=value.toLowerCase().replace(/[^a-z ]/g,'').replace(/ {2,}/g,' ');return trim?cleaned.trim():cleaned;}
  function normalizeUsername(value){return value.toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,16);}
  function escapeHtml(value){return value.replace(/[&<>'"]/g,(character)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));}

  async function loadLeaderboard(){
    try{const data=await api.leaderboard();$('leaderboard-count').textContent=`${data.totalUsers} jugadores`;$('leaderboard-list').innerHTML=data.entries.length?data.entries.map((entry,index)=>`<li><span class="rank">${String(index+1).padStart(2,'0')}</span><span class="leader-name">@${escapeHtml(entry.username)}</span><strong class="leader-score">${formatScore(entry.score)}</strong></li>`).join(''):'<li class="leaderboard-empty">Todavía no hay marcas.</li>';$('leaderboard-status').textContent=currentUser?'Tu mejor marca aparece después de tu primera partida.':'Los mejores puntajes aparecen aquí.';}
    catch{$('leaderboard-list').innerHTML='<li class="leaderboard-empty">Tabla no disponible.</li>';$('leaderboard-status').textContent='No se pudo conectar con la clasificación.';}
  }

  const authDialog=$('username-dialog');
  function requestAuth(){ $('username-input').value='';$('phrase-input').value='';$('username-error').textContent='';if(authDialog.showModal)authDialog.showModal();else authDialog.setAttribute('open','');setTimeout(()=>$('username-input').focus(),50); }
  $('username-input').addEventListener('input',(event)=>{event.target.value=normalizeUsername(event.target.value);});
  $('phrase-input').addEventListener('input',(event)=>{event.target.value=normalizePhrase(event.target.value);});
  $('username-form').addEventListener('submit',async(event)=>{
    event.preventDefault();const username=normalizeUsername($('username-input').value);const phrase=normalizePhrase($('phrase-input').value,true);$('username-input').value=username;$('phrase-input').value=phrase;
    if(!/^[a-z0-9_]{3,16}$/.test(username)){ $('username-error').textContent='El nombre necesita entre 3 y 16 caracteres.';return; }
    if(!/^[a-z]+(?: [a-z]+)+$/.test(phrase)||phrase.length<8){$('username-error').textContent='Escribe una frase de al menos dos palabras, solo con letras minúsculas.';return;}
    const submit=$('username-form').querySelector('.auth-submit');submit.disabled=true;submit.textContent='COMPROBANDO…';$('username-error').textContent='';
    try{let result;try{result=await api.register(username,phrase);}catch(error){if(error.status!==409)throw error;result=await api.login(username,phrase);}saveSession(result);authDialog.close();await loadLeaderboard();}
    catch(error){$('username-error').textContent=error.message;}
    finally{submit.disabled=false;submit.textContent='CONTINUAR';}
  });
  $('change-player').addEventListener('click',()=>{clearSession();requestAuth();});

  const canvas=$('game-canvas');const ctx=canvas.getContext('2d');const playerElement=$('player-sprite');const freezeCanvas=$('player-freeze');const freezeCtx=freezeCanvas.getContext('2d');let W=0,H=0,dpr=1;
  const runner={
    running:false,raf:0,last:0,score:0,high:0,speed:420,speedMultiplier:1,viewportScale:1,ground:0,groundOffset:0,groundImage:null,baseGravity:2200,baseJumpVelocity:930,gravity:2200,jumpVelocity:930,coyote:0,jumpBuffer:0,boosts:[],player:{x:0,y:0,w:156,h:182,vy:0,onGround:true},obstacles:[],sunflowers:[],spawnIn:1.6,sunflowerIn:3,
    resize(){dpr=Math.min(2,window.devicePixelRatio||1);W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);this.viewportScale=W<=700?.62:1;this.baseGravity=2200*this.viewportScale;this.baseJumpVelocity=930*Math.sqrt(this.viewportScale);this.gravity=this.baseGravity;this.jumpVelocity=this.baseJumpVelocity;this.ground=H-Math.min(86,Math.max(58,H*.105));this.player.w=156*this.viewportScale;this.player.h=182*this.viewportScale;this.player.x=Math.max(22,W*.1);if(this.player.onGround)this.player.y=this.ground-this.player.h;},
    async start(){this.stop();showScreen('game');this.resize();this.score=0;this.high=Number(currentUser?.score||0);this.speedMultiplier=1;this.speed=420*this.viewportScale;this.boosts=[];this.obstacles=[];this.sunflowers=[];this.spawnIn=1.8;this.sunflowerIn=5.2+Math.random()*3.8;this.groundOffset=0;this.coyote=0;this.jumpBuffer=0;this.player.vy=0;this.player.onGround=true;this.player.y=this.ground-this.player.h;this.restoreRunningFrame();playerElement.classList.add('is-hidden');$('score').textContent='00000';$('speed-value').textContent='1.0×';$('sunflower-count').textContent='0';$('high-score').textContent=formatScore(this.high);$('boost-indicator').classList.add('is-hidden');$('game-over').classList.add('is-hidden');this.running=true;this.last=performance.now();try{if(!playerElement.complete||!playerElement.naturalWidth)await new Promise((resolve,reject)=>{playerElement.onload=resolve;playerElement.onerror=reject;});}catch(error){console.warn('No se pudo cargar el avatar.',error);}if(!this.running)return;this.loadGround();playerElement.classList.remove('is-hidden');this.syncPlayerElement();this.raf=requestAnimationFrame((time)=>this.loop(time));},
    stop(){this.running=false;cancelAnimationFrame(this.raf);this.restoreRunningFrame();playerElement.classList.add('is-hidden');},
    loadGround(){if(!this.groundImage){this.groundImage=new Image();this.groundImage.src=A+'paisaje-de-fondo-carrusel-secuencial.png';}},
    freezeFrame(){if(!playerElement.naturalWidth)return;freezeCanvas.width=Math.max(1,Math.round(this.player.w));freezeCanvas.height=Math.max(1,Math.round(this.player.h));freezeCtx.clearRect(0,0,freezeCanvas.width,freezeCanvas.height);freezeCtx.drawImage(playerElement,0,0,freezeCanvas.width,freezeCanvas.height);freezeCanvas.classList.remove('is-hidden');playerElement.classList.add('is-hidden');this.syncPlayerElement();},
    restoreRunningFrame(){freezeCanvas.classList.add('is-hidden');playerElement.classList.remove('is-hidden');},
    jumpArcFactor(){return this.speedMultiplier<2?1:1-.10*Math.min(1,(this.speedMultiplier-2)/(3.7-2));},
    jump(){if(!this.running)return;if(this.player.onGround||this.coyote>0){const factor=this.jumpArcFactor();this.gravity=this.baseGravity/(factor*factor);this.jumpVelocity=this.baseJumpVelocity/factor;this.player.vy=-this.jumpVelocity;this.player.onGround=false;this.coyote=0;this.jumpBuffer=0;this.freezeFrame();}else this.jumpBuffer=.14;},
    addObstacle(){const type=Math.random()<.5?'box':'bag';const img=new Image();img.src=A+(type==='box'?'obstaculo-1-caja.png':'obstaculo-2-mochila-removebg-preview.png');const scale=this.viewportScale;const h=(type==='box'?87:96)*scale,w=(type==='box'?113:106)*scale;this.obstacles.push({x:W+30,y:this.ground-h,w,h,img});},
    addSunflower(){const img=new Image();img.src=A+'girasoles-removebg-preview.png';const size=113*1.1*this.viewportScale;this.sunflowers.push({x:W+30,y:this.ground-size,w:size,h:size,img});},
    nextObstacleDelay(){const maxWidth=115*this.viewportScale;const airtime=(2*this.jumpVelocity)/this.gravity;const reachable=this.speed*airtime;return Math.max(520*this.viewportScale,reachable+maxWidth+240*this.viewportScale)/this.speed;},
    activeBoosts(now){this.boosts=this.boosts.filter((boost)=>boost.expires>now);return this.boosts.length;},
    updateBoostHud(now){const count=this.activeBoosts(now);const indicator=$('boost-indicator');indicator.classList.toggle('is-hidden',count===0);if(count){const nearest=Math.min(...this.boosts.map((boost)=>boost.expires-now));$('boost-value').textContent=`${Math.min(16,2**count).toFixed(1)}×`;$('boost-time').textContent=`${Math.ceil(nearest/1000)}s`;}},
    loop(now){if(!this.running)return;const dt=Math.min(.032,(now-this.last)/1000);this.last=now;const progress=Math.min(1,this.score/1800);this.speedMultiplier=1+2.7*Math.pow(progress,.72);this.speed=420*this.speedMultiplier*this.viewportScale;const multiplier=Math.min(16,2**this.activeBoosts(now));this.score+=dt*10*multiplier;this.groundOffset=(this.groundOffset+this.speed*dt+W)%W;this.spawnIn-=dt;this.sunflowerIn-=dt;if(this.spawnIn<=0){this.addObstacle();this.spawnIn=this.nextObstacleDelay();}if(this.sunflowerIn<=0){this.addSunflower();this.sunflowerIn=5.2+Math.random()*7.4;}
      const p=this.player;if(!p.onGround){this.coyote=Math.max(0,this.coyote-dt);}this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);p.vy+=this.gravity*dt;p.y+=p.vy*dt;if(p.y>=this.ground-p.h){p.y=this.ground-p.h;p.vy=0;if(!p.onGround){this.restoreRunningFrame();this.gravity=this.baseGravity;this.jumpVelocity=this.baseJumpVelocity;}p.onGround=true;this.coyote=.11;if(this.jumpBuffer>0)this.jump();}
      this.obstacles.forEach((o)=>o.x-=this.speed*dt);this.sunflowers.forEach((s)=>s.x-=this.speed*dt);this.obstacles=this.obstacles.filter((o)=>o.x+o.w>-30);this.sunflowers=this.sunflowers.filter((s)=>s.x+s.w>-30);const hitbox={x:p.x+p.w*.2,y:p.y+p.h*.1,w:p.w*.6,h:p.h*.82};if(this.obstacles.some((o)=>hitbox.x<o.x+o.w*.9&&hitbox.x+hitbox.w>o.x+o.w*.1&&hitbox.y<o.y+o.h&&hitbox.y+hitbox.h>o.y+o.h*.08)){this.end();return;}for(let i=this.sunflowers.length-1;i>=0;i--){const s=this.sunflowers[i];if(hitbox.x<s.x+s.w&&hitbox.x+hitbox.w>s.x&&hitbox.y<s.y+s.h&&hitbox.y+hitbox.h>s.y){this.sunflowers.splice(i,1);this.boosts.push({expires:now+10000});$('sunflower-count').textContent=String(Number($('sunflower-count').textContent)+1);}}
      this.updateBoostHud(now);$('speed-value').textContent=`${this.speedMultiplier.toFixed(1)}×`;$('score').textContent=formatScore(this.score);$('high-score').textContent=formatScore(Math.max(this.high,this.score));this.syncPlayerElement();this.draw();this.raf=requestAnimationFrame((time)=>this.loop(time));},
    syncPlayerElement(){const left=`${this.player.x}px`,top=`${this.player.y}px`,width=`${this.player.w}px`,height=`${this.player.h}px`;[playerElement,freezeCanvas].forEach((element)=>{element.style.left=left;element.style.top=top;element.style.width=width;element.style.height=height;});},
    draw(){ctx.clearRect(0,0,W,H);const stripH=Math.min(102,H*.13),sourceH=120;ctx.fillStyle='#304d3c';ctx.fillRect(0,this.ground,W,H-this.ground);if(this.groundImage?.complete&&this.groundImage.naturalWidth){for(let x=-this.groundOffset;x<W;x+=W)ctx.drawImage(this.groundImage,0,this.groundImage.naturalHeight-sourceH,this.groundImage.naturalWidth,sourceH,x,this.ground,W,stripH);}else{ctx.fillStyle='#657b58';ctx.fillRect(0,this.ground,W,H-this.ground);ctx.fillStyle='#304d3c';ctx.fillRect(0,this.ground,W,4);}this.sunflowers.forEach((s)=>{if(s.img.complete&&s.img.naturalWidth)ctx.drawImage(s.img,s.x,s.y,s.w,s.h);});this.obstacles.forEach((o)=>{if(o.img.complete&&o.img.naturalWidth)ctx.drawImage(o.img,o.x,o.y,o.w,o.h);});},
    async end(){this.running=false;cancelAnimationFrame(this.raf);this.restoreRunningFrame();playerElement.classList.add('is-hidden');const current=Math.floor(this.score);$('final-score').textContent=current;$('high-score').textContent=formatScore(Math.max(this.high,current));$('game-over-player').textContent=currentUser?`@${currentUser.username}`:'runner';$('score-result').textContent='Guardando tu mejor marca…';$('game-over').classList.remove('is-hidden');try{const result=await api.score(current);this.high=result.user.score;$('high-score').textContent=formatScore(this.high);$('score-result').textContent=result.updated?'Nueva marca global registrada.':'Tu marca global no cambió.';loadLeaderboard();}catch(error){$('score-result').textContent=error.status===401?'La sesión expiró; la partida terminó sin sincronizarse.':error.message;}}
  };
  $('start-button').addEventListener('click',()=>currentUser?runner.start():requestAuth());$('restart-button').addEventListener('click',()=>runner.start());$('menu-button').addEventListener('click',()=>{runner.stop();showScreen('menu');loadLeaderboard();});canvas.addEventListener('pointerdown',()=>runner.jump());document.addEventListener('keydown',(event)=>{if(!screens.game.classList.contains('is-hidden')&&(event.key===' '||event.key==='ArrowUp')){event.preventDefault();runner.jump();}});window.addEventListener('resize',()=>{if(!screens.game.classList.contains('is-hidden')){runner.resize();runner.syncPlayerElement();}});
  const saved=readSession();if(saved?.token&&saved.user){currentUser=saved.user;updatePlayerLabels();}else requestAuth();loadLeaderboard();
})();
