// exercises.js — 4 exercícios (só mão), gesto direto: mão fecha = agarra, mão abre = solta.

const EXERCISE_DEFS = [
  {id:'cesto',       icon:'🏀', nome:'Basquete',             desc:'Feche a mão pra pegar a bola e leve até a cesta.',          niveis:3, repsDefault:10},
  {id:'abrirFechar', icon:'✊', nome:'Abrir e Fechar',       desc:'Responda aos comandos ABRA / FECHE.',                       niveis:3, repsDefault:10},
  {id:'labirinto',   icon:'🧩', nome:'Labirinto',            desc:'Segure a bola e passe pelo caminho até a estrela.',         niveis:1, repsDefault:3},
  {id:'cantos',      icon:'🎯', nome:'Bolas na Cesta',       desc:'Leve as bolinhas dos 4 cantos até a cesta do meio.',        niveis:1, repsDefault:10},
  {id:'pega',        icon:'🤏', nome:'Bolinhas no Lixinho',  desc:'Pegue com a ponta dos dedos a bola da cor pedida.',         niveis:1, repsDefault:10},
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

// mãozinha esquemática que espelha o gesto atual (mão aberta/fechada)
function drawHandIcon(ctx, cx, cy, size, open){
  ctx.save();
  ctx.translate(cx,cy);
  ctx.fillStyle='rgba(234,241,238,.95)';
  ctx.strokeStyle='#1E5AA8'; ctx.lineWidth=2;
  // palma
  ctx.beginPath(); ctx.ellipse(0, size*0.15, size*0.32, size*0.4, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // dedos
  const fingerLen = open? size*0.55 : size*0.16;
  const spread = open? 0.34 : 0.14;
  for(let i=-2;i<=2;i++){
    const ang = -Math.PI/2 + i*spread;
    const baseX = Math.sin(ang)*size*0.22, baseY = -size*0.1+Math.cos(ang)*0.02;
    const tipX = Math.sin(ang)*(size*0.22+fingerLen), tipY = baseY - Math.cos(ang)*fingerLen*0.6 - fingerLen*0.4;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(tipX, tipY);
    ctx.lineWidth = size*0.13;
    ctx.lineCap='round';
    ctx.strokeStyle = open ? '#3E8E6B' : '#F2A93B';
    ctx.stroke();
  }
  ctx.restore();
}

class ExerciseBase{
  constructor(nivel, sens, reps){
    this.nivel = nivel;
    this.sens = sens || 1.0;
    this.reps = reps || 10;
    this.startTime = performance.now();
    this.done = false;
    this.score = 0;
    this.correct = 0; this.incorrect = 0;
    this.reactionTimes = [];
    this.precisions = [];
    this.speeds = [];
    this.onFeedback = null;
    this.onFinish = null;
    this.finishReason = '';
    this._unsub = [];
    // séries: exercícios "sem fim" (bolinha e dedos) usam isso pra avisar e
    // recomeçar a contagem sozinhos, sem nunca parar por conta própria.
    this.rodada = 1;
    this.roundProgress = null; // só usado pelos exercícios "sem fim" (bolinha e dedos)
  }
  completeRound(msgPrefix){
    this.roundProgress = 0;
    this.rodada++;
    this.feedback((msgPrefix?msgPrefix+' ':'')+`Série ${this.rodada-1} concluída — vamos para a série ${this.rodada}! 💪`, 'ok');
  }
  listen(evt, fn){ Tracking.on(evt, fn); this._unsub.push([evt,fn]); }
  feedback(msg, tipo){ if(this.onFeedback) this.onFeedback(msg, tipo||'ok'); }
  say(t){ falar(t); }
  beep(tipo){ if(window.NM_SOUND) window.NM_SOUND.beep(tipo); }
  dispose(){
    // remove os ouvintes de mão deste exercício (antes ficavam ativos e falavam por cima dos próximos jogos)
    this._unsub.forEach(([evt,fn])=>Tracking.off(evt,fn));
    this._unsub = [];
  }
  finish(reason){
    if(this.done) return;
    this.done = true;
    this.finishReason = reason;
    this.dispose();
    if(this.onFinish) this.onFinish();
  }
  metricas(){
    const durSec = (performance.now()-this.startTime)/1000;
    const velocidadeMedia = this.speeds.length ? this.speeds.reduce((a,b)=>a+b,0)/this.speeds.length : 0;
    return {
      duracao: Math.round(durSec),
      pontuacao: this.score,
      nivel: this.nivel,
      tempoReacaoMedio: this.reactionTimes.length ? Math.round(this.reactionTimes.reduce((a,b)=>a+b,0)/this.reactionTimes.length) : null,
      precisaoMedia: this.precisions.length ? Math.round(this.precisions.reduce((a,b)=>a+b,0)/this.precisions.length) : null,
      movimentosCorretos: this.correct,
      movimentosIncorretos: this.incorrect,
      velocidadeMedia: Math.round(velocidadeMedia*1000)/1000,
    };
  }
}

// ---------------- Exercício 1: Basquete Cerebral ----------------
class ExCesto extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.held=false; this.roundProgress=0; this.hoop={x:0.68,y:0.3};
    this.netAmp=0; this.tt=0; this.fall=null;
    this.newRound();
    this.listen('handClose', (pos)=>{
      if(this.done || this.held) return;
      if(dist(pos.x,pos.y,this.ball.x,this.ball.y) < this.ball.r+0.06){ this.held=true; this.grabAt=performance.now(); this.beep('grab'); }
    });
    this.listen('handOpen', (pos)=>{ if(this.done || !this.held) return; this.releaseBall(pos); });
    this.say('Vamos jogar basquete'+(NOME()?', '+NOME():'')+'! Feche a mão para pegar a bola, leve até a cesta e abra a mão para soltar.');
  }
  newRound(){ this.ball={x:rand(0.15,0.3), y:rand(0.6,0.78), r:0.11}; this.roundStart=performance.now(); }
  releaseBall(pos){
    this.held=false;
    const rim=this._rim||{rimX:this.hoop.x, rimY:this.hoop.y, rimR:0.12};
    const d=dist(pos.x,pos.y,rim.rimX,rim.rimY), n=NOME();
    this.reactionTimes.push(performance.now()-this.grabAt);
    this.precisions.push(Math.max(0, 100 - d/rim.rimR*35));
    if(d < rim.rimR+0.07){
      this.correct++; this.score+=10; this.beep('hit'); this.netAmp=1;
      this.fall={x:rim.rimX, y:rim.rimY, vy:0.15, t:0};
      this.feedback('Cesta! +10 pontos','ok');
    } else {
      this.incorrect++; this.beep('miss'); this.feedback('Quase! Tente mirar na cesta.','bad');
    }
    this.roundProgress++;
    if(this.roundProgress >= this.reps) this.completeRound();
    this.newRound();
  }
  update(hand, dt, ctx, w, h){
    this.tt+=dt; this.netAmp=Math.max(0,this.netAmp-dt*0.7);
    const f=this.fall; if(f){ f.t+=dt; f.vy+=dt*0.9; f.y+=f.vy*dt; if(f.t>0.8) this.fall=null; }
    this._rim=drawHoop(ctx,this.hoop.x,this.hoop.y,w,h,this.netAmp,this.tt,()=>{ if(f) drawBall(ctx,f.x,f.y,this.ball.r*0.8,w,h,false); });
    if(hand){
      this.speeds.push(hand.speed||0);
      if(this.held){ this.ball.x=hand.x; this.ball.y=hand.y; }
    }
    // a bola é sempre desenhada, mesmo quando a mão some do enquadramento
    drawBall(ctx, this.ball.x, this.ball.y, this.ball.r, w, h, this.held);
    if(hand) drawCursorRing(ctx, hand.x, hand.y, w, h, hand.open);
  }
}

// ---------------- Exercício 2: Abrir e Fechar ----------------
class ExAbrirFechar extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.commandInterval = Math.max(1600 - nivel*300, 800);
    this.roundIdx = 0;
    this.say('Vamos treinar a mão'+(NOME()?', '+NOME():'')+'! Quando aparecer ABRA, abra a mão. Quando aparecer FECHE, feche a mão.');
    this.nextRound();
  }
  nextRound(){
    if(this.roundIdx>=this.reps){ this.finish('Sequência concluída.'); return; }
    this.roundIdx++;
    this.awaiting = Math.random()<0.5 ? 'abra' : 'feche';
    this.commandAt = performance.now();
    this.answered = false;
  }
  update(hand, dt, ctx, w, h){
    const promptEl = document.getElementById('gamePrompt');
    if(promptEl) promptEl.innerHTML = `<span>${this.awaiting==='abra'?'ABRA':'FECHE'}</span>`;

    drawHandIcon(ctx, w*0.5, h*0.72, Math.min(w,h)*0.22, hand? hand.open : true);

    if(hand){
      this.speeds.push(hand.speed||0);
      if(!this.answered){
        const wantOpen = this.awaiting==='abra';
        if(hand.open===wantOpen){
          this.answered = true;
          const reaction = performance.now()-this.commandAt;
          this.reactionTimes.push(reaction);
          this.correct++; this.score += 8; this.beep('hit');
          this.feedback('Certo! '+Math.round(reaction)+' ms', 'ok');
          setTimeout(()=>this.nextRound(), 500);
        }
      }
    }
    if(!this.answered && performance.now()-this.commandAt > this.commandInterval+2200){
      this.answered = true;
      this.incorrect++; this.beep('miss');
      this.feedback('Tempo esgotado para esse comando.', 'bad');
      setTimeout(()=>this.nextRound(), 400);
    }
  }
  finish(reason){
    const promptEl = document.getElementById('gamePrompt');
    if(promptEl) promptEl.innerHTML='';
    super.finish(reason);
  }
}

// ---------------- Exercício 3: Labirinto ----------------
const MAZES=[
  {main:[[.12,.15],[.5,.15],[.5,.4],[.15,.4],[.15,.68],[.6,.68],[.6,.88],[.88,.88]], extra:[[[.5,.15],[.88,.15],[.88,.3]],[[.15,.4],[.15,.28]]]},
  {main:[[.12,.88],[.12,.6],[.45,.6],[.45,.3],[.8,.3],[.8,.12]], extra:[[[.45,.6],[.8,.6],[.8,.78]],[[.12,.6],[.12,.4]]]},
  {main:[[.88,.12],[.88,.4],[.5,.4],[.5,.62],[.2,.62],[.2,.88],[.7,.88]], extra:[[[.88,.4],[.88,.55]],[[.5,.62],[.5,.8]]]},
];
class ExLabirinto extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.roundProgress=0; this.mi=0; this.w=1; this.h=1;
    this.load();
    this.listen('handClose', (pos)=>{
      if(this.done || this.held) return;
      if(pxd(pos,this.ball,this.w,this.h) < this.w*0.14){ this.held=true; this.grabAt=performance.now(); this.beep('grab'); }
    });
    this.listen('handOpen', ()=>{ this.held=false; });
    this.say('Vamos passar pelo labirinto'+(NOME()?', '+NOME():'')+'! Feche a mão na bola, siga o caminho sem sair dele e leve até a estrela.');
  }
  load(){
    const m=MAZES[this.mi%MAZES.length]; this.maze=m; this.segs=[];
    [m.main,...m.extra].forEach(p=>{ for(let i=0;i<p.length-1;i++) this.segs.push([p[i],p[i+1]]); });
    const s=m.main[0]; this.ball={x:s[0], y:s[1], r:0.055}; this.end=m.main[m.main.length-1];
    this.held=false; this.bumpAt=0; this.bumps=0; this.startedAt=performance.now();
  }
  inside(px,py){
    const w=this.w,h=this.h,half=w*0.085;
    return this.segs.some(([a,b])=>{
      const ax=a[0]*w, ay=a[1]*h, bx=b[0]*w, by=b[1]*h, dx=bx-ax, dy=by-ay;
      const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));
      return Math.hypot(px-(ax+t*dx), py-(ay+t*dy)) <= half;
    });
  }
  update(hand, dt, ctx, w, h){
    this.w=w; this.h=h; const half=w*0.085;
    ctx.lineCap='round'; ctx.lineJoin='round';
    const paths=[this.maze.main,...this.maze.extra];
    const stroke=(wd,col)=>{ ctx.lineWidth=wd; ctx.strokeStyle=col; paths.forEach(p=>{ ctx.beginPath(); p.forEach((q,i)=>{ if(i) ctx.lineTo(q[0]*w,q[1]*h); else ctx.moveTo(q[0]*w,q[1]*h); }); ctx.stroke(); }); };
    stroke(half*2+14,'#fff'); stroke(half*2+4,'#2A74D0'); stroke(half*2-8,'#BFE3FF');
    drawStar(ctx,this.end[0]*w,this.end[1]*h,half*0.95);
    if(hand){
      this.speeds.push(hand.speed||0);
      if(this.held){
        const hx=hand.x*w, hy=hand.y*h;
        if(this.inside(hx,hy) && Math.hypot(hx-this.ball.x*w,hy-this.ball.y*h) < w*0.3){ this.ball.x=hand.x; this.ball.y=hand.y; }
        else if(performance.now()-this.bumpAt>1800){ this.bumpAt=performance.now(); this.bumps++; this.incorrect++; this.beep('miss'); this.feedback('Opa! Fique dentro do caminho 😉','bad'); }
      }
    }
    drawBall(ctx,this.ball.x,this.ball.y,this.ball.r,w,h,this.held);
    if(hand) drawCursorRing(ctx,hand.x,hand.y,w,h,hand.open);
    if(pxd(this.ball,{x:this.end[0],y:this.end[1]},w,h) < half*1.1){
      this.correct++; this.score+=15; this.roundProgress++; this.beep('hit');
      this.reactionTimes.push(performance.now()-this.startedAt);
      this.precisions.push(Math.max(40,100-this.bumps*15));
      this.feedback('Chegou na estrela! +15 pontos','ok');
      if(this.roundProgress>=this.reps) this.completeRound();
      this.mi++; this.load();
    }
  }
}

// ---------------- Exercício 4: Bolas na Cesta (4 cantos) ----------------
class ExCantos extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.hoop={x:0.5,y:0.5}; this.held=null; this.roundProgress=0; this.netAmp=0; this.tt=0; this.fall=null;
    this.newRound();
    this.listen('handClose', (pos)=>{
      if(this.done || this.held) return;
      for(const b of this.balls){ if(!b.delivered && dist(pos.x,pos.y,b.x,b.y) < b.r+0.06){ this.held=b; this.grabAt=performance.now(); this.beep('grab'); break; } }
    });
    this.listen('handOpen', (pos)=>{ if(this.done || !this.held) return; this.releaseBall(pos); });
    this.say('Agora vamos encher a cesta'+(NOME()?', '+NOME():'')+'! Feche a mão numa bolinha colorida, leve até a cesta do meio e abra a mão.');
  }
  newRound(){
    // 4 bolinhas coloridas, uma em cada canto (cores em ordem aleatória a cada rodada)
    const cores=CORES.slice().sort(()=>Math.random()-.5);
    this.balls=[{x:.15,y:.22},{x:.85,y:.22},{x:.15,y:.82},{x:.85,y:.82}].map((p,i)=>({x:p.x,y:p.y,r:0.085,delivered:false,c:cores[i]}));
  }
  releaseBall(pos){
    const b=this.held; this.held=null;
    const rim=this._rim||{rimX:0.5,rimY:0.5,rimR:0.12}, d=dist(pos.x,pos.y,rim.rimX,rim.rimY), n=NOME();
    this.reactionTimes.push(performance.now()-this.grabAt);
    this.precisions.push(Math.max(0, 100 - d/rim.rimR*35));
    if(d < rim.rimR+0.08){
      b.delivered=true; this.correct++; this.score+=10; this.roundProgress++; this.beep('hit'); this.netAmp=1;
      this.fall={x:rim.rimX,y:rim.rimY,vy:0.15,t:0};
      this.feedback('Na cesta! +10 pontos','ok');
      if(this.roundProgress >= this.reps) this.completeRound();
    } else {
      b.x=pos.x; b.y=pos.y; this.incorrect++; this.beep('miss'); this.feedback('Quase! A cesta é no meio.','bad');
    }
    if(this.balls.every(x=>x.delivered)) this.newRound();
  }
  update(hand, dt, ctx, w, h){
    this.tt+=dt; this.netAmp=Math.max(0,this.netAmp-dt*0.7);
    const f=this.fall; if(f){ f.t+=dt; f.vy+=dt*0.9; f.y+=f.vy*dt; if(f.t>0.8) this.fall=null; }
    this._rim=drawHoop(ctx,this.hoop.x,this.hoop.y,w,h,this.netAmp,this.tt,()=>{ if(f) drawBall(ctx,f.x,f.y,0.07,w,h,false); });
    this.balls.forEach(b=>{ if(!b.delivered) drawColorBall(ctx,b.x,b.y,b.r,w,h,b.c,this.held===b); });
    if(!hand) return;
    this.speeds.push(hand.speed||0);
    if(this.held){ this.held.x=hand.x; this.held.y=hand.y; }
    drawCursorRing(ctx,hand.x,hand.y,w,h,hand.open);
  }
}

// ---------------- Exercício 5: Bolinhas no Lixinho (pinça com a ponta dos dedos) ----------------
class ExPega extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.roundProgress=0; this.held=null; this.lock=false; this.binGlow=0; this.w=1; this.h=1;
    this.bin={x:0.5,y:0.82,r:0.14};
    this.balls=CORES.map(c=>({c,x:0,y:0,r:0.075}));
    this.shuffleHomes();
    this.target=null;
    this.pickTarget();
    // explica só no começo: nome + o que fazer
    this.say('Vamos brincar'+(NOME()?', '+NOME():'')+'! Olhe o nome da cor lá em cima, pegue a bola dessa cor com a ponta dos dedos e solte em cima do lixinho.');
  }
  // 4 posições fixas (2x2) sem sobreposição: as 4 cores ficam sempre visíveis
  shuffleHomes(){
    const homes=[{x:.27,y:.30},{x:.73,y:.30},{x:.27,y:.56},{x:.73,y:.56}].sort(()=>Math.random()-.5);
    this.balls.forEach((b,i)=>{ if(this.held===b) return; b.x=homes[i].x; b.y=homes[i].y; });
  }
  pickTarget(){
    let c; do{ c=pick(CORES); }while(c===this.target);
    this.target=c; this.promptAt=performance.now();
  }
  update(hand, dt, ctx, w, h){
    this.w=w; this.h=h; this.binGlow=Math.max(0,this.binGlow-dt);
    const pe=document.getElementById('gamePrompt');
    if(pe){
      pe.style.top='46px'; pe.style.transform='none';
      pe.innerHTML='<span class="pp">Pegue a bola <b style="color:'+this.target.l+'">'+this.target.n.toUpperCase()+'</b> 🤏</span>';
    }
    drawBin(ctx,this.bin.x*w,this.bin.y*h,w,this.binGlow);
    this.balls.forEach(b=>drawColorBall(ctx,b.x,b.y,b.r,w,h,b.c,this.held===b));
    if(!hand) return;
    this.speeds.push(hand.speed||0);
    const pm=hand.pinch||{}, pinching=!!(pm.index||pm.middle||pm.ring||pm.pinky);
    if(this.held){
      this.held.x=hand.x; this.held.y=hand.y;
      if(!pinching){
        const b=this.held; this.held=null;
        if(pxd(b,this.bin,w,h) < this.bin.r*w + b.r*Math.min(w,h)*0.5){
          this.correct++; this.score+=10; this.roundProgress++; this.beep('hit'); this.binGlow=0.6;
          this.reactionTimes.push(performance.now()-this.promptAt);
          this.feedback('No lixinho! +10 pontos','ok');
          this.shuffleHomes();
          if(this.roundProgress>=this.reps) this.completeRound();
          this.pickTarget();
        } else {
          this.incorrect++; this.beep('miss'); this.feedback('Solte em cima do lixinho!','bad');
          this.shuffleHomes();
        }
      }
    } else if(pinching && !this.lock){
      const near=this.balls.find(b=>pxd(hand,b,w,h) < b.r*Math.min(w,h) + Math.min(w,h)*0.09);
      if(near){
        if(near.c===this.target){ this.held=near; this.beep('grab'); }
        else{ this.lock=true; this.incorrect++; this.beep('miss'); this.feedback('Essa é a bola '+near.c.n+'. Procure a '+this.target.n+'!','bad'); }
      }
    }
    if(!pinching) this.lock=false;
    drawCursorRing(ctx,hand.x,hand.y,w,h,hand.open);
  }
  finish(reason){
    const pe=document.getElementById('gamePrompt');
    if(pe){ pe.innerHTML=''; pe.style.top=''; pe.style.transform=''; }
    super.finish(reason);
  }
}

// mãozinha esquemática pro exercício de dedos: destaca o dedo-alvo e acende
// em verde quando o polegar toca no dedo certo
const FINGER_LABELS = {index:'indicador', middle:'médio', ring:'anelar', pinky:'mindinho'};
const FINGER_ORDER  = ['index','middle','ring','pinky'];

function drawHandFingerTarget(ctx, cx, cy, size, target, hand){
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle='rgba(234,241,238,.95)';
  ctx.strokeStyle='#1E5AA8'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0, size*0.28, size*0.34, size*0.42, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();

  FINGER_ORDER.forEach((f,i)=>{
    const ang = -Math.PI/2 + (i-1.5)*0.32;
    const baseX = Math.sin(ang)*size*0.20, baseY = -size*0.02;
    const len = size*0.58;
    const tipX = Math.sin(ang)*(size*0.20+len), tipY = baseY - Math.cos(ang)*len*0.75 - len*0.28;
    const isTarget = f===target;
    const pinchedNow = hand && hand.pinch && hand.pinch[f];
    ctx.beginPath(); ctx.moveTo(baseX,baseY); ctx.lineTo(tipX,tipY);
    ctx.lineWidth = size*0.13; ctx.lineCap='round';
    ctx.strokeStyle = pinchedNow ? '#3E8E6B' : (isTarget ? '#F2A93B' : 'rgba(30,90,168,.3)');
    ctx.stroke();
    if(isTarget){
      ctx.beginPath(); ctx.arc(tipX,tipY,size*0.115,0,Math.PI*2);
      ctx.strokeStyle = pinchedNow ? '#3E8E6B' : '#C1502E'; ctx.lineWidth=3; ctx.stroke();
    }
  });
  // polegar
  const anyPinch = hand && hand.pinch && Object.values(hand.pinch).some(Boolean);
  ctx.beginPath();
  ctx.moveTo(-size*0.20, size*0.10);
  ctx.lineTo(-size*0.46, size*0.32-(anyPinch?size*0.10:0));
  ctx.lineWidth = size*0.15; ctx.lineCap='round';
  ctx.strokeStyle = anyPinch ? '#3E8E6B' : '#F2A93B';
  ctx.stroke();
  ctx.restore();
}

// ---------------- Exercício 5: Toque dos Dedos (oposição polegar-dedo) ----------------
// Isola o movimento de cada dedo contra o polegar — importante pra reabilitação
// motora fina pós-AVC, complementa bem sessões de neuromodulação (o cérebro é
// estimulado a "reencontrar" o caminho motor pra cada dedo individualmente).
class ExDedos extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.roundProgress = 0;
    this.seqIdx = 0;
    this.waitingRelease = false;
    this.target = null;
    this.nextTarget();
  }
  nextTarget(){
    if(this.nivel>=2){
      let next;
      do{ next = FINGER_ORDER[Math.floor(Math.random()*FINGER_ORDER.length)]; }
      while(next===this.target);
      this.target = next;
    } else {
      this.target = FINGER_ORDER[this.seqIdx % FINGER_ORDER.length];
      this.seqIdx++;
    }
    this.promptAt = performance.now();
    this.waitingRelease = false;
  }
  update(hand, dt, ctx, w, h){
    const promptEl = document.getElementById('gamePrompt');
    if(promptEl) promptEl.innerHTML = `<span style="font-size:26px;">Toque o polegar no dedo<br><b>${FINGER_LABELS[this.target]}</b></span>`;

    drawHandFingerTarget(ctx, w*0.5, h*0.66, Math.min(w,h)*0.3, this.target, hand);

    if(!hand) return;
    this.speeds.push(hand.speed||0);
    const pinchMap = hand.pinch || {};
    const pinched = pinchMap[this.target];
    const anyPinch = Object.values(pinchMap).some(Boolean);

    if(this.waitingRelease){
      if(!anyPinch) this.waitingRelease = false;
      return;
    }
    if(pinched){
      const reaction = performance.now()-this.promptAt;
      this.reactionTimes.push(reaction);
      this.correct++; this.score += 8; this.roundProgress++; this.beep('hit');
      this.feedback('Isso! Dedo '+FINGER_LABELS[this.target]+' certinho.', 'ok');
      this.waitingRelease = true;
      if(this.roundProgress >= this.reps) this.completeRound();
      this.nextTarget();
    } else if(anyPinch){
      const wrong = Object.keys(pinchMap).find(k=>pinchMap[k]);
      this.incorrect++; this.beep('miss');
      this.feedback('Esse é o '+FINGER_LABELS[wrong]+' — tente o '+FINGER_LABELS[this.target]+'.', 'bad');
      this.waitingRelease = true;
    }
  }
  finish(reason){
    const promptEl = document.getElementById('gamePrompt');
    if(promptEl) promptEl.innerHTML='';
    super.finish(reason);
  }
}

function drawCursorRing(ctx, x, y, w, h, open){
  const px=x*w, py=y*h;
  ctx.beginPath(); ctx.arc(px,py,16,0,Math.PI*2);
  ctx.strokeStyle = open ? 'rgba(62,142,107,.9)' : 'rgba(242,169,59,.95)';
  ctx.lineWidth=3; ctx.stroke();
  ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
}

const ExerciseEngine = {
  instance: null,
  start(id, nivel, sensibilidade, reps){
    const map = {cesto:ExCesto, abrirFechar:ExAbrirFechar, labirinto:ExLabirinto, cantos:ExCantos, pega:ExPega};
    const Cls = map[id];
    if(this.instance){ this.instance.dispose(); }   // nunca deixar ouvintes do jogo anterior vivos
    this.instance = new Cls(nivel, sensibilidade, reps);
    this.exerciseId = id;
    return this.instance;
  },
  def(id){ return EXERCISE_DEFS.find(e=>e.id===id); }
};
