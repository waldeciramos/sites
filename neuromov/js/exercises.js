// exercises.js — 4 exercícios (só mão), gesto direto: mão fecha = agarra, mão abre = solta.

const EXERCISE_DEFS = [
  {id:'cesto',       icon:'🏀', nome:'Basquete',             desc:'Feche a mãozinha pra pegar a bola e leve até a cesta.',      niveis:3, repsDefault:10},
  {id:'abrirFechar', icon:'✊', nome:'Abrir e Fechar',       desc:'Faça junto com a mãozinha: abre e fecha!',                    niveis:3, repsDefault:10},
  {id:'labirinto',   icon:'🧩', nome:'Labirinto',            desc:'Leve a bolinha pelo caminho até a estrela.',                  niveis:1, repsDefault:3},
  {id:'cantos',      icon:'🎯', nome:'Bolas na Cesta',       desc:'Leve as bolinhas coloridas dos cantos até a cesta do meio.',  niveis:1, repsDefault:10},
  {id:'pega',        icon:'🤏', nome:'Bolinhas no Lixinho',  desc:'Pegue com a pontinha dos dedos a bola da cor pedida.',        niveis:1, repsDefault:10},
  {id:'cores',       icon:'🎨', nome:'Jogo das Cores',       desc:'Ouça a cor, fale e arraste a bolinha até o número certo.',    niveis:1, repsDefault:5, externo:true},
];

function rand(a,b){ return a+Math.random()*(b-a); }
function dist(x1,y1,x2,y2){ return Math.hypot(x1-x2,y1-y2); }

function drawZone(ctx,x,y,r,w,h,color,label,strokeOnly){
  const px=x*w, py=y*h, pr=r*Math.min(w,h);
  ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2);
  if(strokeOnly){ ctx.strokeStyle=color; ctx.lineWidth=4; ctx.setLineDash([pr*.35,pr*.2]); ctx.stroke(); ctx.setLineDash([]); }
  else {
    ctx.save(); ctx.shadowColor='rgba(0,0,0,.3)'; ctx.shadowBlur=10; ctx.shadowOffsetY=4; ctx.fillStyle=color; ctx.fill(); ctx.restore();
    ctx.lineWidth=Math.max(2,pr*.07); ctx.strokeStyle='rgba(255,255,255,.95)'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(px-pr*.3,py-pr*.4,pr*.3,pr*.15,-.5,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,.45)'; ctx.fill();
  }
  if(label){
    ctx.font='700 '+Math.round(pr*1.1)+'px Fredoka,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#fff'; ctx.lineWidth=3; ctx.strokeStyle='rgba(18,64,110,.8)'; ctx.strokeText(label,px,py); ctx.fillText(label, px, py);
  }
}

function drawBall(ctx,x,y,r,w,h,held){
  const px=x*w, py=y*h, pr=r*Math.min(w,h);
  const g=ctx.createRadialGradient(px-pr*.35,py-pr*.4,pr*.1,px,py,pr);
  g.addColorStop(0,held?'#FFE79A':'#FFB86B'); g.addColorStop(.6,held?'#FFAE1F':'#F26B1D'); g.addColorStop(1,'#B8420A');
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.4)'; ctx.shadowBlur=pr*.5; ctx.shadowOffsetY=pr*.2;
  ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fillStyle=g; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(px-pr,py); ctx.lineTo(px+pr,py); ctx.moveTo(px,py-pr); ctx.lineTo(px,py+pr);
  ctx.strokeStyle='rgba(120,40,0,.45)'; ctx.lineWidth=Math.max(1,pr*.05); ctx.stroke();
  ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.strokeStyle='#fff'; ctx.lineWidth=Math.max(2,pr*.08); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(px-pr*.35,py-pr*.42,pr*.28,pr*.16,-.6,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fill();
}

function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function falar(t){ if(window.NM_SPEAK) window.NM_SPEAK(t); }
const NOME=()=>window.NM_NOME||'';
function pxd(a,b,w,h){ return Math.hypot((a.x-b.x)*w,(a.y-b.y)*h); }
function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

// Cesta grande, bonita, com rede que balança (amp 0..1, tt = tempo). mid() desenha a bola entre o aro de trás e a rede.
function drawHoop(ctx,x,y,w,h,amp,tt,mid){
  const px=x*w, py=y*h, bw=w*0.42, bh=h*0.2;
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.3)'; ctx.shadowBlur=12; ctx.shadowOffsetY=5;
  const g=ctx.createLinearGradient(0,py-bh,0,py); g.addColorStop(0,'#fff'); g.addColorStop(1,'#CFEAFF');
  rr(ctx,px-bw/2,py-bh,bw,bh,14); ctx.fillStyle=g; ctx.fill(); ctx.restore();
  rr(ctx,px-bw/2,py-bh,bw,bh,14); ctx.lineWidth=5; ctx.strokeStyle='#2A74D0'; ctx.stroke();
  rr(ctx,px-bw*0.24,py-bh*0.72,bw*0.48,bh*0.45,6); ctx.lineWidth=3; ctx.strokeStyle='#FF9A1F'; ctx.stroke();
  const rimW=bw*0.58, rimY=py-bh*0.04, ry=rimW*0.17;
  ctx.beginPath(); ctx.ellipse(px,rimY,rimW/2,ry,0,Math.PI,Math.PI*2); ctx.strokeStyle='#C23B14'; ctx.lineWidth=6; ctx.stroke();
  if(mid) mid();
  const nh=rimW*0.8, sw=amp*Math.sin(tt*16)*rimW*0.14, n=7;
  ctx.strokeStyle='rgba(255,255,255,.95)'; ctx.lineWidth=2;
  for(let i=0;i<n;i++){ const f=i/(n-1)-0.5; ctx.beginPath(); ctx.moveTo(px+f*rimW,rimY);
    ctx.quadraticCurveTo(px+f*rimW*0.8+sw*0.6,rimY+nh*0.5,px+f*rimW*0.45+sw,rimY+nh); ctx.stroke(); }
  for(let k=1;k<=3;k++){ const t=k/3.4; ctx.beginPath();
    for(let i=0;i<n;i++){ const f=i/(n-1)-0.5, X=px+f*rimW*(1-0.55*t)+sw*t*t*1.2, Y=rimY+nh*t; if(i) ctx.lineTo(X,Y); else ctx.moveTo(X,Y); }
    ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(px,rimY,rimW/2,ry,0,0,Math.PI); ctx.strokeStyle='#FF5A24'; ctx.lineWidth=7; ctx.stroke();
  return {rimX:px/w, rimY:rimY/h, rimR:(rimW/2)/Math.min(w,h)};
}
function drawStar(ctx,cx,cy,r){
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.3)'; ctx.shadowBlur=8; ctx.beginPath();
  for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rad=i%2?r*0.45:r; ctx.lineTo(cx+Math.cos(a)*rad, cy+Math.sin(a)*rad); }
  ctx.closePath(); const g=ctx.createLinearGradient(0,cy-r,0,cy+r); g.addColorStop(0,'#FFE27A'); g.addColorStop(1,'#FF9A1F');
  ctx.fillStyle=g; ctx.fill(); ctx.lineWidth=4; ctx.strokeStyle='#fff'; ctx.stroke(); ctx.restore();
}
const CORES=[{n:'azul',h:'#2B78E6',l:'#8EC5FF'},{n:'amarela',h:'#F5B400',l:'#FFE27A'},{n:'verde',h:'#2FAE2A',l:'#9BE87F'},{n:'vermelha',h:'#E53D2F',l:'#FF9A8F'}];
function drawColorBall(ctx,x,y,r,w,h,c,held){
  const px=x*w, py=y*h, pr=r*Math.min(w,h)*(held?1.12:1);
  const g=ctx.createRadialGradient(px-pr*.35,py-pr*.4,pr*.1,px,py,pr); g.addColorStop(0,c.l); g.addColorStop(.7,c.h); g.addColorStop(1,'#00000055');
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.4)'; ctx.shadowBlur=pr*.5; ctx.shadowOffsetY=pr*.2;
  ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fillStyle=g; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.strokeStyle='#fff'; ctx.lineWidth=Math.max(2,pr*.1); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(px-pr*.35,py-pr*.42,pr*.28,pr*.16,-.6,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fill();
}
function drawBin(ctx,px,py,w,glow){
  const bw=w*0.26, bh=bw*1.05;
  ctx.save(); if(glow>0){ ctx.shadowColor='#fff'; ctx.shadowBlur=36*glow; }
  ctx.beginPath(); ctx.moveTo(px-bw/2,py-bh/2); ctx.lineTo(px+bw/2,py-bh/2); ctx.lineTo(px+bw*0.4,py+bh/2); ctx.lineTo(px-bw*0.4,py+bh/2); ctx.closePath();
  const g=ctx.createLinearGradient(px-bw/2,0,px+bw/2,0); g.addColorStop(0,'#2FAE2A'); g.addColorStop(.5,'#7BE35F'); g.addColorStop(1,'#1B7F1B');
  ctx.fillStyle=g; ctx.fill(); ctx.lineWidth=5; ctx.strokeStyle='#fff'; ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.ellipse(px,py-bh/2,bw*0.56,bw*0.1,0,0,Math.PI*2); ctx.fillStyle='#1B7F1B'; ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.stroke();
  ctx.font='700 '+Math.round(bw*0.42)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.fillText('♻',px,py+bh*0.05);
}

// ---------------------------------------------------------------------------
// Mãozinha divertida (estilo do layout: amarelinha, contorno branco, punho azul, carinha).
// t = 0 (fechada) .. 1 (aberta). opt: {glow:0..1, gray:bool}
// ---------------------------------------------------------------------------
function drawCartoonHand(ctx, cx, cy, s, t, opt){
  opt = opt||{}; const gray=!!opt.gray, glow=opt.glow||0;
  const c1=gray?'#E3EBF3':'#FFE48F', c2=gray?'#AFC2D6':'#FFB62E';
  const e=t*t*(3-2*t);
  ctx.save(); ctx.translate(cx,cy); ctx.lineCap='round'; ctx.lineJoin='round';
  if(glow>0){
    ctx.beginPath(); ctx.arc(0,0.1*s,0.78*s,0,Math.PI*2);
    ctx.fillStyle='rgba(123,227,95,'+(0.28*glow)+')'; ctx.fill();
    ctx.strokeStyle='rgba(123,227,95,'+(0.95*glow)+')'; ctx.lineWidth=0.035*s; ctx.stroke();
  }
  ctx.fillStyle='rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(0,0.72*s,0.32*s,0.05*s,0,0,Math.PI*2); ctx.fill();
  const grad=(y0,y1)=>{ const q=ctx.createLinearGradient(0,y0,0,y1); q.addColorStop(0,c1); q.addColorStop(1,c2); return q; };
  // dedos
  const base=[-.225,-.075,.075,.225], len=[.40,.47,.44,.35], fw=.15*s, ow=.045*s;
  for(let i=0;i<4;i++){
    const off=(i-1.5)*0.2*e, L=(0.1+(len[i]-0.1)*e)*s;
    const bx=base[i]*s, by=-0.04*s, tx=bx+Math.sin(off)*L, ty=by-Math.cos(off)*L;
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(tx,ty); ctx.strokeStyle='#fff'; ctx.lineWidth=fw+ow*2; ctx.stroke();
    ctx.strokeStyle=grad(ty,by); ctx.lineWidth=fw; ctx.stroke();
  }
  // palma
  rr(ctx,-.31*s,-.12*s,.62*s,.62*s,.24*s);
  ctx.fillStyle=grad(-.12*s,.5*s); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=.05*s; ctx.stroke();
  // nós dos dedos (aparecem com a mão fechada)
  if(e<0.98){
    ctx.save(); ctx.globalAlpha=1-e;
    for(let i=0;i<4;i++){
      ctx.beginPath(); ctx.arc(base[i]*s,-.05*s,.088*s,0,Math.PI*2);
      ctx.fillStyle=grad(-.14*s,.04*s); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=.03*s; ctx.stroke();
    }
    ctx.restore();
  }
  // polegar
  const rx=-.27*s, ry=.28*s, tx2=(-.62+(.10+.62)*(1-e))*s, ty2=(.02+(.38-.02)*(1-e))*s;
  ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(tx2,ty2); ctx.strokeStyle='#fff'; ctx.lineWidth=fw*1.05+ow*2; ctx.stroke();
  ctx.strokeStyle=grad(Math.min(ry,ty2),Math.max(ry,ty2)+1); ctx.lineWidth=fw*1.05; ctx.stroke();
  // punho (manguinha azul)
  rr(ctx,-.27*s,.44*s,.54*s,.2*s,.07*s);
  const q=ctx.createLinearGradient(0,.44*s,0,.64*s); q.addColorStop(0,gray?'#C9D6E2':'#6CC4FF'); q.addColorStop(1,gray?'#9FB3C8':'#2A74D0');
  ctx.fillStyle=q; ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=.035*s; ctx.stroke();
  // carinha
  ctx.fillStyle='rgba(255,110,150,.45)';
  [-.19,.19].forEach(x=>{ ctx.beginPath(); ctx.arc(x*s,.14*s,.045*s,0,Math.PI*2); ctx.fill(); });
  [-.105,.105].forEach(x=>{
    ctx.beginPath(); ctx.arc(x*s,.05*s,.042*s,0,Math.PI*2); ctx.fillStyle='#12406E'; ctx.fill();
    ctx.beginPath(); ctx.arc((x+.013)*s,.037*s,.014*s,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
  });
  ctx.beginPath(); ctx.arc(0,.12*s,.09*s,.15*Math.PI,.85*Math.PI); ctx.strokeStyle='#12406E'; ctx.lineWidth=.03*s; ctx.stroke();
  ctx.restore();
}

function drawCursorRing(ctx, x, y, w, h, open){
  const px=x*w, py=y*h;
  ctx.beginPath(); ctx.arc(px,py,20,0,Math.PI*2);
  ctx.fillStyle = open ? 'rgba(123,227,95,.18)' : 'rgba(255,154,31,.35)'; ctx.fill();
  ctx.strokeStyle = open ? 'rgba(123,227,95,.95)' : 'rgba(255,154,31,1)'; ctx.lineWidth=4; ctx.stroke();
  ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
}
function textoBorda(ctx,t,x,y,px,cor){
  ctx.font='700 '+Math.round(px)+'px Fredoka,"Trebuchet MS",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.lineWidth=Math.max(3,px*.22); ctx.strokeStyle='#1D5BB0'; ctx.strokeText(t,x,y); ctx.fillStyle=cor||'#fff'; ctx.fillText(t,x,y);
}

class ExerciseBase{
  constructor(nivel, sens, reps){
    this.nivel = nivel;
    this.sens = sens || 1.0;
    this.reps = Math.max(1, reps || 10);
    this.startTime = performance.now();
    this.done = false; this.ending = false;
    this.score = 0;
    this.correct = 0; this.incorrect = 0;
    this.reactionTimes = []; this.precisions = []; this.speeds = [];
    this.onFeedback = null; this.onFinish = null; this.finishReason = '';
    this._unsub = [];
    this.rodada = 1;
    this.roundProgress = 0;     // repetições concluídas (acertos)
    this.W = 1; this.H = 1;
    this._prompt = null;
  }
  listen(evt, fn){ Tracking.on(evt, fn); this._unsub.push([evt,fn]); }
  dispose(){ this._unsub.forEach(([evt,fn])=>Tracking.off(evt,fn)); this._unsub = []; }
  feedback(msg, tipo){ if(this.onFeedback) this.onFeedback(msg, tipo||'ok'); }
  say(t){ falar(t); }
  beep(tipo){ if(window.NM_SOUND) window.NM_SOUND.beep(tipo); }
  setPrompt(html, top){
    const pe=document.getElementById('gamePrompt'); if(!pe) return;
    const key=html+'|'+(top||'');
    if(key===this._prompt) return;          // só mexe no DOM quando muda (mais rápido)
    this._prompt=key; pe.style.top=top||''; pe.style.transform=top?'none':''; pe.innerHTML=html;
  }
  clearPrompt(){ const pe=document.getElementById('gamePrompt'); if(pe){ pe.innerHTML=''; pe.style.top=''; pe.style.transform=''; } this._prompt=null; }
  // chegou nas repetições escolhidas: mostra a última animação e encerra pontuando
  concluir(){
    if(this.ending || this.done) return;
    this.ending = true;
    setTimeout(()=>this.finish('Concluído'), 1100);
  }
  acerto(pontos){ this.correct++; this.score+=pontos; this.roundProgress++; if(this.roundProgress>=this.reps) this.concluir(); }
  finish(reason){
    if(this.done) return;
    this.done = true; this.finishReason = reason;
    this.clearPrompt(); this.dispose();
    if(this.onFinish) this.onFinish();
  }
  metricas(){
    const durSec = (performance.now()-this.startTime)/1000;
    const vm = this.speeds.length ? this.speeds.reduce((a,b)=>a+b,0)/this.speeds.length : 0;
    return {
      duracao: Math.round(durSec), pontuacao: this.score, nivel: this.nivel,
      tempoReacaoMedio: this.reactionTimes.length ? Math.round(this.reactionTimes.reduce((a,b)=>a+b,0)/this.reactionTimes.length) : null,
      precisaoMedia: this.precisions.length ? Math.round(this.precisions.reduce((a,b)=>a+b,0)/this.precisions.length) : null,
      movimentosCorretos: this.correct, movimentosIncorretos: this.incorrect,
      velocidadeMedia: Math.round(vm*1000)/1000,
    };
  }
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ---------------- Exercício 1: Basquete ----------------
class ExCesto extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.held=false; this.hoop={x:0.68,y:0.3};
    this.netAmp=0; this.tt=0; this.fall=null; this.openT=0; this.lastPos=null;
    this.newRound();
    const n=NOME();
    this.say('Vamos jogar basquete'+(n?', '+n:'')+'? Fecha a mãozinha pra pegar a bola, leva até a cesta e abre pra soltar. Bora lá!');
  }
  newRound(){ this.ball={x:rand(0.15,0.3), y:rand(0.62,0.78), r:0.11}; this.roundStart=performance.now(); }
  releaseBall(pos){
    this.held=false;
    const w=this.W,h=this.H,m=Math.min(w,h);
    const rim=this._rim||{rimX:this.hoop.x, rimY:this.hoop.y, rimR:0.12};
    const dpx=pxd(pos,{x:rim.rimX,y:rim.rimY},w,h);
    this.reactionTimes.push(performance.now()-this.grabAt);
    this.precisions.push(Math.max(0, 100 - dpx/(rim.rimR*m)*35));
    if(dpx < rim.rimR*m + m*0.13){
      this.beep('hit'); this.netAmp=1;
      this.fall={x:rim.rimX, y:rim.rimY, vy:0.15, t:0};
      this.feedback('Cesta! +10 pontos','ok');
      this.acerto(10);
      if(!this.ending) this.newRound();
    } else {
      this.incorrect++; this.beep('miss'); this.feedback('Quase! Tente de novo.','bad');
      this.ball.x=clamp(pos.x,0.1,0.9); this.ball.y=clamp(pos.y,0.45,0.88);   // a bola fica onde caiu
    }
  }
  update(hand, dt, ctx, w, h){
    this.W=w; this.H=h; const m=Math.min(w,h), now=performance.now();
    this.tt+=dt; this.netAmp=Math.max(0,this.netAmp-dt*0.7);
    const f=this.fall; if(f){ f.t+=dt; f.vy+=dt*0.9; f.y+=f.vy*dt; if(f.t>0.8) this.fall=null; }
    this._rim=drawHoop(ctx,this.hoop.x,this.hoop.y,w,h,this.netAmp,this.tt,()=>{ if(f) drawBall(ctx,f.x,f.y,this.ball.r*0.8,w,h,false); });
    if(hand && !this.ending){
      this.lastPos={x:hand.x,y:hand.y};
      this.speeds.push(hand.speed||0);
      if(!this.held && !hand.open && pxd(hand,this.ball,w,h) < m*(this.ball.r+0.16)){ this.held=true; this.grabAt=now; this.openT=0; this.beep('grab'); }
      if(this.held){
        this.ball.x=hand.x; this.ball.y=hand.y;
        if(hand.open){ if(!this.openT) this.openT=now; if(now-this.openT>140){ this.openT=0; this.releaseBall(hand); } } else this.openT=0;
      }
    } else if(!hand && this.held && this.lastPos){ this.releaseBall(this.lastPos); }
    drawBall(ctx, this.ball.x, this.ball.y, this.ball.r, w, h, this.held);   // a bola nunca some
    if(hand) drawCursorRing(ctx, hand.x, hand.y, w, h, hand.open);
  }
}

// ---------------- Exercício 2: Abrir e Fechar (com mãozinha pra fazer junto) ----------------
class ExAbrirFechar extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.tt=0; this.demoT=1; this.mirT=1; this.sparks=[];
    this.awaiting='feche'; this.first=true; this.sawOpposite=true;
    this.cmdAt=performance.now(); this.holdAt=0; this.pausaAte=0; this.answered=false;
    this.timeoutMs = 9000;                 // sem pressa
    const n=NOME();
    this.say('Vamos treinar a mãozinha'+(n?', '+n:'')+'! Olha a mão na tela e faz igualzinho: abre e fecha junto com ela. Vamos lá!');
  }
  nextCommand(){
    this.awaiting = this.awaiting==='abra' ? 'feche' : 'abra';   // sempre alterna: o movimento é de verdade
    this.cmdAt=performance.now(); this.holdAt=0; this.answered=false; this.sawOpposite=false; this.first=false;
  }
  burst(x,y){ for(let i=0;i<9;i++) this.sparks.push({x,y,vx:(Math.random()-.5)*160,vy:-60-Math.random()*120,l:1,e:['⭐','✨','🌟'][i%3]}); }
  update(hand, dt, ctx, w, h){
    this.W=w; this.H=h; this.tt+=dt;
    const now=performance.now(), want=this.awaiting==='abra', pausa=now<this.pausaAte;
    this.setPrompt(pausa ? '<span>👏 Muito bem!</span>' : '<span>'+(want?'ABRA':'FECHE')+'</span>', '7%');

    // layout: em pé = mãozinha de cima + a sua embaixo; deitado = lado a lado
    const wide = w > h*1.25, m=Math.min(w,h);
    const sD = wide ? Math.min(h*0.52, w*0.3) : Math.min(w*0.55, h*0.31);
    const dx = wide ? w*0.30 : w*0.5,  dy = wide ? h*0.52 : h*0.34;
    const sM = wide ? sD*0.62 : Math.min(w*0.26, h*0.14);
    const mx = wide ? w*0.72 : w*0.5,  my = wide ? h*0.56 : h*0.80;

    // mãozinha-guia: mostra o que fazer (abre / fecha) com um balanço leve
    this.demoT += ((want?1:0)-this.demoT)*Math.min(1,dt*6);
    const bob=Math.sin(this.tt*4)*sD*0.025, pulse=1+Math.sin(this.tt*6)*0.025;
    drawCartoonHand(ctx,dx,dy+bob,sD*pulse,this.demoT,{});
    textoBorda(ctx,'Faça igual!',dx,dy+sD*0.84,Math.max(14,m*0.048));

    // a sua mão (espelhada) — fica verde quando acerta
    const casou = !!hand && hand.open===want;
    this.mirT += ((hand&&hand.open?1:0)-this.mirT)*Math.min(1,dt*12);
    drawCartoonHand(ctx,mx,my,sM,this.mirT,{gray:!hand, glow: casou?1:0});
    textoBorda(ctx, hand?(casou?'Isso! 👍':'Sua mão'):'Mostre a mão', mx, my-sM*0.74, Math.max(13,m*0.042));

    // faíscas
    this.sparks=this.sparks.filter(p=>p.l>0);
    this.sparks.forEach(p=>{ p.l-=dt*1.1; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=240*dt; ctx.globalAlpha=Math.max(0,p.l); ctx.font=Math.round(m*0.06)+'px sans-serif'; ctx.textAlign='center'; ctx.fillText(p.e,p.x,p.y); ctx.globalAlpha=1; });

    if(this.ending) return;
    if(pausa) return;
    if(this.pausaAte && now>=this.pausaAte){ this.pausaAte=0; this.nextCommand(); return; }

    if(hand){
      this.speeds.push(hand.speed||0);
      if(hand.open!==want) this.sawOpposite=true;
      if(casou && this.sawOpposite){
        if(!this.holdAt) this.holdAt=now;
        if(now-this.holdAt>=280){                       // segura um instantinho = acerto
          const reacao=now-this.cmdAt;
          this.reactionTimes.push(reacao);
          this.beep('hit'); this.burst(mx,my-sM*0.3);
          this.feedback('Certo! '+Math.round(reacao)+' ms','ok');
          this.acerto(8);
          this.pausaAte=now+(this.ending?0:1000);        // respira antes do próximo (mais devagar)
        }
      } else this.holdAt=0;
    } else this.holdAt=0;

    if(!this.answered && now-this.cmdAt>this.timeoutMs && !this.ending && !(this.pausaAte>now)){
      this.incorrect++; this.beep('miss');
      this.feedback('Sem pressa! Vamos para o próximo.','bad');
      this.pausaAte=now+700;
    }
  }
}

// ---------------- Exercício 3: Labirinto (a bolinha NÃO sai do caminho) ----------------
const MAZES=[
  {main:[[.12,.15],[.5,.15],[.5,.4],[.15,.4],[.15,.68],[.6,.68],[.6,.88],[.88,.88]], extra:[[[.5,.15],[.88,.15],[.88,.3]],[[.15,.4],[.15,.28]]]},
  {main:[[.12,.88],[.12,.6],[.45,.6],[.45,.3],[.8,.3],[.8,.12]], extra:[[[.45,.6],[.8,.6],[.8,.78]],[[.12,.6],[.12,.4]]]},
  {main:[[.88,.12],[.88,.4],[.5,.4],[.5,.62],[.2,.62],[.2,.88],[.7,.88]], extra:[[[.88,.4],[.88,.55]],[[.5,.62],[.5,.8]]]},
];
class ExLabirinto extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.mi=0; this.w=1; this.h=1; this.openT=0; this.farT=0; this.warnAt=0;
    this.load();
    const n=NOME();
    this.say('Vamos passear pelo labirinto'+(n?', '+n:'')+'! Fecha a mão na bolinha, segue o caminho sem sair dele e leva até a estrela.');
  }
  load(){
    const m=MAZES[this.mi%MAZES.length]; this.maze=m; this.segs=[];
    [m.main,...m.extra].forEach(p=>{ for(let i=0;i<p.length-1;i++) this.segs.push([p[i],p[i+1]]); });
    const s=m.main[0]; this.ball={x:s[0], y:s[1], r:0.055}; this.end=m.main[m.main.length-1];
    this.held=false; this.bumps=0; this.startedAt=performance.now();
  }
  // ponto (em pixels) dentro do corredor? (mg = folga: a bolinha inteira fica dentro, não só o centro)
  inside(px,py,mg){
    const w=this.w,h=this.h,lim=w*0.085-(mg||0);
    return this.segs.some(([a,b])=>{
      const ax=a[0]*w, ay=a[1]*h, bx=b[0]*w, by=b[1]*h, dx=bx-ax, dy=by-ay;
      const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));
      return Math.hypot(px-(ax+t*dx), py-(ay+t*dy)) <= lim;
    });
  }
  // anda em direção à mão em passos pequenos; se o próximo passo bateria na parede, desliza ou para.
  // Assim a bolinha nunca "pula" a parede, mesmo se a mão atravessar rápido.
  moveBall(tx,ty,dt,mg,m){
    let bx=this.ball.x*this.w, by=this.ball.y*this.h;
    let resto=Math.max(m*2.4*dt,5), bloqueou=false;
    while(resto>0){
      const dx=tx-bx, dy=ty-by, d=Math.hypot(dx,dy);
      if(d<1) break;
      const s=Math.min(3,resto,d), nx=bx+dx/d*s, ny=by+dy/d*s;
      if(this.inside(nx,ny,mg)){ bx=nx; by=ny; }
      else if(this.inside(nx,by,mg) && Math.abs(dx)>0.5){ bx=nx; }
      else if(this.inside(bx,ny,mg) && Math.abs(dy)>0.5){ by=ny; }
      else { bloqueou=true; break; }
      resto-=s;
    }
    this.ball.x=bx/this.w; this.ball.y=by/this.h;
    return bloqueou;
  }
  update(hand, dt, ctx, w, h){
    this.w=w; this.h=h; this.W=w; this.H=h;
    const m=Math.min(w,h), half=w*0.085, now=performance.now(), mg=Math.min(this.ball.r*m*0.4, half*0.35);
    ctx.lineCap='round'; ctx.lineJoin='round';
    const paths=[this.maze.main,...this.maze.extra];
    const stroke=(wd,col)=>{ ctx.lineWidth=wd; ctx.strokeStyle=col; paths.forEach(p=>{ ctx.beginPath(); p.forEach((q,i)=>{ if(i) ctx.lineTo(q[0]*w,q[1]*h); else ctx.moveTo(q[0]*w,q[1]*h); }); ctx.stroke(); }); };
    stroke(half*2+14,'#fff'); stroke(half*2+4,'#2A74D0'); stroke(half*2-8,'#BFE3FF');
    drawStar(ctx,this.end[0]*w,this.end[1]*h,half*0.95);

    if(hand && !this.ending){
      this.speeds.push(hand.speed||0);
      if(!this.held && !hand.open && pxd(hand,this.ball,w,h) < m*(this.ball.r+0.14)){ this.held=true; this.openT=0; this.farT=0; this.beep('grab'); }
      if(this.held){
        if(hand.open){ if(!this.openT) this.openT=now; if(now-this.openT>180){ this.held=false; this.openT=0; } } else this.openT=0;
      }
      if(this.held){
        const tx=hand.x*w, ty=hand.y*h;
        const bloq=this.moveBall(tx,ty,dt,mg,m);
        const longe=Math.hypot(tx-this.ball.x*w, ty-this.ball.y*h);
        if(bloq && longe>half*0.8 && now-this.warnAt>2200){
          this.warnAt=now; this.bumps++; this.incorrect++; this.beep('miss'); this.feedback('Opa! A bolinha fica dentro do caminho 😉','bad');
        }
        // mão muito longe da bolinha por um tempo: solta (é só fechar a mão de novo perto dela)
        if(longe>m*0.55){ this.farT+=dt; if(this.farT>1.2){ this.held=false; this.farT=0; this.feedback('Volte à bolinha e feche a mão','bad'); } } else this.farT=0;
      }
    } else if(!hand){ this.held=false; }

    drawBall(ctx,this.ball.x,this.ball.y,this.ball.r,w,h,this.held);
    if(hand) drawCursorRing(ctx,hand.x,hand.y,w,h,hand.open);
    if(!this.ending && pxd(this.ball,{x:this.end[0],y:this.end[1]},w,h) < half*1.1){
      this.reactionTimes.push(now-this.startedAt);
      this.precisions.push(Math.max(40,100-this.bumps*15));
      this.beep('hit'); this.feedback('Chegou na estrela! +15 pontos','ok');
      this.held=false;
      this.acerto(15);
      this.mi++; if(!this.ending) this.load();
    }
  }
}

// ---------------- Exercício 4: Bolas na Cesta (4 bolinhas coloridas) ----------------
class ExCantos extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.hoop={x:0.5,y:0.5}; this.held=null; this.netAmp=0; this.tt=0; this.fall=null; this.openT=0; this.lastPos=null;
    this.newRound();
    const n=NOME();
    this.say('Agora vamos encher a cesta'+(n?', '+n:'')+'! Fecha a mão numa bolinha colorida, leva até a cesta do meio e abre pra soltar.');
  }
  newRound(){
    const cores=CORES.slice().sort(()=>Math.random()-.5);
    this.balls=[{x:.15,y:.22},{x:.85,y:.22},{x:.15,y:.82},{x:.85,y:.82}].map((p,i)=>({x:p.x,y:p.y,r:0.085,delivered:false,c:cores[i]}));
  }
  releaseBall(pos){
    const b=this.held; this.held=null;
    const w=this.W,h=this.H,m=Math.min(w,h);
    const rim=this._rim||{rimX:0.5,rimY:0.5,rimR:0.12}, dpx=pxd(pos,{x:rim.rimX,y:rim.rimY},w,h);
    this.reactionTimes.push(performance.now()-this.grabAt);
    this.precisions.push(Math.max(0, 100 - dpx/(rim.rimR*m)*35));
    if(dpx < rim.rimR*m + m*0.14){
      b.delivered=true; this.beep('hit'); this.netAmp=1;
      this.fall={x:rim.rimX,y:rim.rimY,vy:0.15,t:0};
      this.feedback('Na cesta! +10 pontos','ok');
      this.acerto(10);
      if(!this.ending && this.balls.every(x=>x.delivered)) this.newRound();
    } else {
      b.x=clamp(pos.x,0.08,0.92); b.y=clamp(pos.y,0.12,0.9); this.incorrect++; this.beep('miss'); this.feedback('Quase! A cesta é no meio.','bad');
    }
  }
  update(hand, dt, ctx, w, h){
    this.W=w; this.H=h; const m=Math.min(w,h), now=performance.now();
    this.tt+=dt; this.netAmp=Math.max(0,this.netAmp-dt*0.7);
    const f=this.fall; if(f){ f.t+=dt; f.vy+=dt*0.9; f.y+=f.vy*dt; if(f.t>0.8) this.fall=null; }
    this._rim=drawHoop(ctx,this.hoop.x,this.hoop.y,w,h,this.netAmp,this.tt,()=>{ if(f) drawBall(ctx,f.x,f.y,0.07,w,h,false); });
    if(hand && !this.ending){
      this.lastPos={x:hand.x,y:hand.y};
      this.speeds.push(hand.speed||0);
      if(!this.held && !hand.open){
        let melhor=null, md=1e9;
        for(const b of this.balls){ if(b.delivered) continue; const d=pxd(hand,b,w,h); if(d<m*(b.r+0.16) && d<md){ md=d; melhor=b; } }
        if(melhor){ this.held=melhor; this.grabAt=now; this.openT=0; this.beep('grab'); }
      }
      if(this.held){
        this.held.x=hand.x; this.held.y=hand.y;
        if(hand.open){ if(!this.openT) this.openT=now; if(now-this.openT>140){ this.openT=0; this.releaseBall(hand); } } else this.openT=0;
      }
    } else if(!hand && this.held && this.lastPos){ this.releaseBall(this.lastPos); }
    this.balls.forEach(b=>{ if(!b.delivered) drawColorBall(ctx,b.x,b.y,b.r,w,h,b.c,this.held===b); });
    if(hand) drawCursorRing(ctx,hand.x,hand.y,w,h,hand.open);
  }
}

// ---------------- Exercício 5: Bolinhas no Lixinho (pinça com a pontinha dos dedos) ----------------
class ExPega extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.held=null; this.lock=false; this.binGlow=0; this.relAt=0;
    this.bin={x:0.5,y:0.82,r:0.14};
    this.balls=CORES.map(c=>({c,x:0,y:0,r:0.075}));
    this.shuffleHomes();
    this.target=null; this.pickTarget();
    const n=NOME();
    this.say('Hora de brincar'+(n?', '+n:'')+'! Olha o nome da cor lá em cima, pega a bolinha dessa cor com a pontinha dos dedos e solta no lixinho.');
  }
  shuffleHomes(){
    const homes=[{x:.27,y:.30},{x:.73,y:.30},{x:.27,y:.56},{x:.73,y:.56}].sort(()=>Math.random()-.5);
    this.balls.forEach((b,i)=>{ if(this.held===b) return; b.x=homes[i].x; b.y=homes[i].y; });
  }
  pickTarget(){
    let c; do{ c=pick(CORES); }while(c===this.target);
    this.target=c; this.promptAt=performance.now();
  }
  update(hand, dt, ctx, w, h){
    this.W=w; this.H=h; const m=Math.min(w,h), now=performance.now();
    this.binGlow=Math.max(0,this.binGlow-dt);
    this.setPrompt('<span class="pp">Pegue a bola <b style="color:'+this.target.l+'">'+this.target.n.toUpperCase()+'</b> 🤏</span>','46px');
    drawBin(ctx,this.bin.x*w,this.bin.y*h,w,this.binGlow);
    this.balls.forEach(b=>drawColorBall(ctx,b.x,b.y,b.r,w,h,b.c,this.held===b));
    if(!hand || this.ending){ if(hand) drawCursorRing(ctx,hand.x,hand.y,w,h,hand.open); return; }
    this.speeds.push(hand.speed||0);
    const pm=hand.pinch||{}, pinching=!!(pm.index||pm.middle||pm.ring||pm.pinky);
    if(this.held){
      this.held.x=hand.x; this.held.y=hand.y;
      if(!pinching){
        if(!this.relAt) this.relAt=now;
        if(now-this.relAt>260){                               // só solta se abrir os dedos de verdade
          this.relAt=0;
          const b=this.held; this.held=null;
          if(pxd(b,this.bin,w,h) < w*0.2 + b.r*m*0.5){
            this.reactionTimes.push(now-this.promptAt);
            this.beep('hit'); this.binGlow=0.6; this.feedback('No lixinho! +10 pontos','ok');
            this.shuffleHomes(); this.acerto(10);
            if(!this.ending) this.pickTarget();
          } else {
            this.incorrect++; this.beep('miss'); this.feedback('Solte em cima do lixinho!','bad'); this.shuffleHomes();
          }
        }
      } else this.relAt=0;
    } else if(pinching && !this.lock){
      const near=this.balls.find(b=>pxd(hand,b,w,h) < b.r*m + m*0.15);
      if(near){
        if(near.c===this.target){ this.held=near; this.relAt=0; this.beep('grab'); }
        else{ this.lock=true; this.incorrect++; this.beep('miss'); this.feedback('Essa é a bola '+near.c.n+'. Procure a '+this.target.n+'!','bad'); }
      }
    }
    if(!pinching) this.lock=false;
    drawCursorRing(ctx,hand.x,hand.y,w,h,hand.open);
  }
}

const ExerciseEngine = {
  instance: null,
  start(id, nivel, sensibilidade, reps){
    const map = {cesto:ExCesto, abrirFechar:ExAbrirFechar, labirinto:ExLabirinto, cantos:ExCantos, pega:ExPega};
    const Cls = map[id];
    if(this.instance){ this.instance.dispose(); }
    this.instance = new Cls(nivel, sensibilidade, reps);
    this.exerciseId = id;
    return this.instance;
  },
  def(id){ return EXERCISE_DEFS.find(e=>e.id===id); }
};
