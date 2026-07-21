(() => {
  'use strict';
  const A = 'recursos-visuales/';
  const dialogues = [
    'Hola... Quería disculparme por todo, porque sé que me equivoqué y la verdad nunca quise decir cosas muy feas o que no eran.',
    'Simplemente estaba enojado, y no estaba enojado contigo... Estaba enojado conmigo mismo porque sé que al final yo tuve la culpa.',
    'Todo lo que pasó es un error que me carcome la cabeza todos los días. Me arrepiento de todo porque yo fui el responsable de que todo se acabara y de que todo se arruinara, y lo sé.',
    'Pero nunca lo hice con mala intención. La verdad es que soy bastante despistado; a veces olvido cosas, incluso olvido muchas veces quién soy.',
    'Muchas veces lo hago porque sí, pero muchas veces me enfoco demasiado en el trabajo, que es lo que estuve haciendo este último año.',
    'He estado intentando ser mejor y conseguir algo con lo que yo pueda tener éxito. Lo hacía por muchas personas, y también por ti y por Beliel.',
    'Tenía un sueño y tenía que empezar a hacer las cosas que fueran necesarias para cumplirlo, sin importar que me desvelara como lo hago actualmente, trabajando hasta desmayarme por el cansancio.',
    'Sé que no fui el mejor, sé que me olvidé de muchas cosas... Pero esto ya no es una súplica ni nada para que vuelvas a verme.',
    'Es para decir que yo mismo me busqué todo lo que tengo y voy a tener que vivir con eso. Te deseo lo mejor, éxitos siempre en toda tu vida.',
    'Y quiero que sepas que a pesar de todo y sin importar qué, siempre estuve y estaré orgulloso de ti.',
    'Esta web va a estar disponible hasta finales de este año, pero el proyecto fuente se mantendrá abierto en el siguiente repositorio de GitHub: [Enlace al Repositorio de GitHub].',
    'Adiós, y muchas gracias por los recuerdos tan lindos y por haber estado en una etapa de mi vida donde sí requería tu presencia.',
    '¡Feliz cumpleaños número 20! Te mereces que este día sea especial.'
  ];
  const $ = (id) => document.getElementById(id);
  const screens = {dialogue: $('dialogue-screen'), menu: $('menu-screen'), game: $('game-screen')};
  let dialogueIndex = 0;
  function showScreen(name){Object.values(screens).forEach(s=>s.classList.add('is-hidden')); screens[name].classList.remove('is-hidden');}
  function renderDialogue(){ const text=$('dialogue-text'); if(dialogueIndex===10){text.innerHTML='Esta web va a estar disponible hasta finales de este año, pero el proyecto fuente se mantendrá abierto en el siguiente repositorio de GitHub: <a href="https://github.com/outage-lost/beliel" target="_blank" rel="noreferrer">Enlace al Repositorio de GitHub</a>.';}else{text.textContent=dialogues[dialogueIndex];} $('dialogue-count').textContent=`${String(dialogueIndex+1).padStart(2,'0')} / ${dialogues.length}`; }
  function advanceDialogue(){if(dialogueIndex < dialogues.length-1){dialogueIndex++;renderDialogue();}else{localStorage.setItem('milena-dialogue-seen','1');showScreen('menu');}}
  function startDialogue(){dialogueIndex=0;renderDialogue();showScreen('dialogue');}
  $('dialogue-screen').addEventListener('click', advanceDialogue); document.addEventListener('keydown', e=>{if((e.key===' '||e.key==='Enter')&&!screens.dialogue.classList.contains('is-hidden')){e.preventDefault();advanceDialogue();}else if((e.key===' '||e.key==='ArrowUp')&&!screens.game.classList.contains('is-hidden')){e.preventDefault();runner.jump();}});
  $('replay-dialogue').addEventListener('click', startDialogue); $('start-button').addEventListener('click', ()=>{showScreen('game');runner.start();}); $('restart-button').addEventListener('click', ()=>runner.start()); $('menu-button').addEventListener('click', ()=>{runner.stop();showScreen('menu');});

  const canvas=$('game-canvas'), ctx=canvas.getContext('2d'); let W=0,H=0,dpr=1;
  const runner = {running:false,raf:0,last:0,score:0,high:Number(localStorage.getItem('milena-high-score')||0),speed:330,ground:0,groundOffset:0,groundImage:null,player:{x:0,y:0,w:88,h:103,vy:0,onGround:true},obstacles:[],spawnIn:1.3,sheet:null,sheetReady:false,frame:0,frameTime:0,spriteWidth:311,spriteHeight:363,
    resize(){dpr=Math.min(2,window.devicePixelRatio||1);W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);this.ground=H-Math.min(86,Math.max(58,H*.105));this.player.x=Math.max(22,W*.1);if(this.player.onGround)this.player.y=this.ground-this.player.h;},
    async start(){this.stop();showScreen('game');this.resize();this.score=0;this.speed=Math.max(300,W*.29);this.obstacles=[];this.spawnIn=1.2;this.groundOffset=0;this.player.vy=0;this.player.onGround=true;this.player.y=this.ground-this.player.h;$('score').textContent='00000';$('high-score').textContent=String(this.high).padStart(5,'0');$('game-over').classList.add('is-hidden');this.running=true;this.last=performance.now();if(!this.sheet)this.loadSheet();this.loadGround();this.raf=requestAnimationFrame(t=>this.loop(t));},
    stop(){this.running=false;cancelAnimationFrame(this.raf);},
    async loadSheet(){try{const data=await fetch(A+'avatar-animado-mil-20260721-041007.piskel').then(r=>r.json());const layer=JSON.parse(data.piskel.layers[0]);const chunk=layer.chunks[0];this.spriteWidth=data.piskel.width;this.spriteHeight=data.piskel.height;this.sheet=new Image();this.sheet.onload=()=>{this.sheetReady=true;};this.sheet.src=chunk.base64PNG;}catch(e){this.sheet=null;this.sheetReady=false;}},
    loadGround(){if(this.groundImage)return;this.groundImage=new Image();this.groundImage.src=A+'paisaje-de-fondo-carrusel-secuencial.png';},
    jump(){if(this.running&&this.player.onGround){this.player.vy=-700;this.player.onGround=false;}},
    addObstacle(){const type=Math.random()<.5?'box':'bag';const img=new Image();img.src=A+(type==='box'?'obstaculo-1-caja.png':'obstaculo-2-mochila-removebg-preview.png');const h=type==='box'?54:60,w=type==='box'?70:66;this.obstacles.push({x:W+30,y:this.ground-h,w,h,img});this.spawnIn=1.1+Math.random()*1.5;},
    loop(now){if(!this.running)return;const dt=Math.min(.032,(now-this.last)/1000);this.last=now;this.score+=dt*10;this.speed+=dt*2.5;this.groundOffset=(this.groundOffset+this.speed*dt)%W;this.spawnIn-=dt;if(this.spawnIn<=0)this.addObstacle();const p=this.player;p.vy+=1850*dt;p.y+=p.vy*dt;if(p.y>=this.ground-p.h){p.y=this.ground-p.h;p.vy=0;p.onGround=true;}this.frameTime+=dt;if(this.frameTime>.11){this.frame=(this.frame+1)%11;this.frameTime=0;}this.obstacles.forEach(o=>o.x-=this.speed*dt);this.obstacles=this.obstacles.filter(o=>o.x+o.w>-30);const hitbox={x:p.x+17,y:p.y+9,w:p.w-34,h:p.h-16};for(const o of this.obstacles){if(hitbox.x<o.x+o.w-8&&hitbox.x+hitbox.w>o.x+8&&hitbox.y<o.y+o.h&&hitbox.y+hitbox.h>o.y+8){this.end();return;}}this.draw();this.raf=requestAnimationFrame(t=>this.loop(t));},
    draw(){ctx.clearRect(0,0,W,H);if(this.groundImage&&this.groundImage.complete&&this.groundImage.naturalWidth){const stripH=Math.min(86,H*.105),sourceH=92;for(let x=-this.groundOffset;x<W;x+=W){ctx.drawImage(this.groundImage,0,this.groundImage.naturalHeight-sourceH,this.groundImage.naturalWidth,sourceH,x,this.ground,W,stripH);}}for(const o of this.obstacles){if(o.img.complete&&o.img.naturalWidth)ctx.drawImage(o.img,o.x,o.y,o.w,o.h);}if(this.sheetReady&&this.sheet&&this.sheet.naturalWidth){ctx.drawImage(this.sheet,this.frame*this.spriteWidth,0,this.spriteWidth,this.spriteHeight,this.player.x,this.player.y,this.player.w,this.player.h);}else{ctx.fillStyle='#304d3c';ctx.beginPath();ctx.arc(this.player.x+44,this.player.y+20,18,0,Math.PI*2);ctx.fill();ctx.fillRect(this.player.x+19,this.player.y+38,50,65);} $('score').textContent=String(Math.floor(this.score)).padStart(5,'0');},
    end(){this.running=false;cancelAnimationFrame(this.raf);const current=Math.floor(this.score);if(current>this.high){this.high=current;localStorage.setItem('milena-high-score',String(this.high));}$('final-score').textContent=current;$('final-high-score').textContent=this.high;$('high-score').textContent=String(this.high).padStart(5,'0');$('game-over').classList.remove('is-hidden');}
  };
  window.addEventListener('resize',()=>{if(!screens.game.classList.contains('is-hidden'))runner.resize();}); canvas.addEventListener('pointerdown',()=>runner.jump());
  if(localStorage.getItem('milena-dialogue-seen'))showScreen('menu');else startDialogue();
})();
