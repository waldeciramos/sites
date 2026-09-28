// exercises.js — 4 exercícios (só mão), gesto direto: mão fecha = agarra, mão abre = solta.

const EXERCISE_DEFS = [
  {id:'cesto',       icon:'🏀', nome:'Basquete Cerebral', desc:'Feche a mão pra pegar a bola e leve até a tabela.', niveis:3, repsDefault:10},
  {id:'abrirFechar', icon:'✊', nome:'Abrir e Fechar',      desc:'Responda aos comandos ABRA / FECHE.',              niveis:3, repsDefault:10},
  {id:'seguir',      icon:'➰', nome:'Segue o Movimento',   desc:'Acompanhe o alvo com a mão.',                      niveis:3, repsDefault:10},
  {id:'cantos',      icon:'🎯', nome:'4 Cantos',            desc:'Leve as 4 bolinhas dos cantos até o centro.',      niveis:1, repsDefault:10},
];

function rand(a,b){ return a+Math.random()*(b-a); }
function dist(x1,y1,x2,y2){ return Math.hypot(x1-x2,y1-y2); }

function drawZone(ctx,x,y,r,w,h,color,label,strokeOnly){
  const px=x*w, py=y*h, pr=r*Math.min(w,h);
  ctx.beginPath();
  ctx.arc(px,py,pr,0,Math.PI*2);
  if(strokeOnly){ ctx.strokeStyle=color; ctx.lineWidth=3; ctx.stroke(); }
  else { ctx.fillStyle=color; ctx.fill(); }
  if(label){
    ctx.font=Math.round(pr*1.1)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(11,46,44,.9)';
    ctx.fillText(label, px, py);
  }
}

function drawBall(ctx,x,y,r,w,h,held){
  const px=x*w, py=y*h, pr=r*Math.min(w,h);
  ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2);
  ctx.fillStyle = held? '#F2A93B' : '#E8732A';
  ctx.fill();
  ctx.strokeStyle='#0B2E2C'; ctx.lineWidth=Math.max(1,pr*0.06); ctx.stroke();
  // linhas de bola de basquete
  ctx.beginPath(); ctx.moveTo(px-pr,py); ctx.lineTo(px+pr,py);
  ctx.moveTo(px,py-pr); ctx.lineTo(px,py+pr);
  ctx.strokeStyle='rgba(11,46,44,.5)'; ctx.lineWidth=Math.max(1,pr*0.05); ctx.stroke();
}

function drawBackboard(ctx,x,y,w,h){
  const px=x*w, py=y*h;
  const bw=w*0.22, bh=h*0.14;
  // tabela
  ctx.fillStyle='rgba(234,241,238,.92)';
  ctx.strokeStyle='#0B2E2C'; ctx.lineWidth=3;
  ctx.fillRect(px-bw/2, py-bh, bw, bh);
  ctx.strokeRect(px-bw/2, py-bh, bw, bh);
  ctx.strokeStyle='#F2A93B'; ctx.lineWidth=2;
  ctx.strokeRect(px-bw*0.28, py-bh*0.78, bw*0.56, bh*0.5);
  // aro
  const rimY = py-bh*0.06, rimW=bw*0.5;
  ctx.beginPath(); ctx.ellipse(px, rimY, rimW/2, rimW*0.16, 0, 0, Math.PI*2);
  ctx.strokeStyle='#C1502E'; ctx.lineWidth=4; ctx.stroke();
  // rede (linhas simples)
  ctx.strokeStyle='rgba(234,241,238,.7)'; ctx.lineWidth=1.4;
  for(let i=-2;i<=2;i++){
    ctx.beginPath(); ctx.moveTo(px+i*rimW*0.09, rimY+2); ctx.lineTo(px+i*rimW*0.16, rimY+rimW*0.55); ctx.stroke();
  }
  return {rimX:px/w, rimY:rimY/h, rimR:(rimW/2)/Math.min(w,h)};
}

// mãozinha esquemática que espelha o gesto atual (mão aberta/fechada)
function drawHandIcon(ctx, cx, cy, size, open){
  ctx.save();
  ctx.translate(cx,cy);
  ctx.fillStyle='rgba(234,241,238,.95)';
  ctx.strokeStyle='#0B2E2C'; ctx.lineWidth=2;
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
  }
  listen(evt, fn){ Tracking.on(evt, fn); this._unsub.push([evt,fn]); }
  feedback(msg, tipo){ if(this.onFeedback) this.onFeedback(msg, tipo||'ok'); }
  beep(tipo){ if(window.NM_SOUND) window.NM_SOUND.beep(tipo); }
  finish(reason){
    if(this.done) return;
    this.done = true;
    this.finishReason = reason;
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
    this.held = false;
    this.timeLimit = nivel>=2 ? 40 : null;
    this.hoop = {x:0.78, y:0.28};
    this.newRound();
    this.listen('handClose', (pos)=>{
      if(this.done || this.held) return;
      if(dist(pos.x,pos.y,this.ball.x,this.ball.y) < this.ball.r+0.06){
        this.held = true; this.grabAt = performance.now(); this.beep('grab');
      }
    });
    this.listen('handOpen', (pos)=>{
      if(this.done || !this.held) return;
      this.releaseBall(pos);
    });
  }
  newRound(){
    this.ball = {x:rand(0.18,0.32), y:rand(0.55,0.75), r:0.075};
    this.roundStart = performance.now();
  }
  releaseBall(pos){
    this.held = false;
    const rim = this._rim || {rimX:this.hoop.x, rimY:this.hoop.y-0.06, rimR:0.09};
    const d = dist(pos.x,pos.y,rim.rimX,rim.rimY);
    const reaction = performance.now()-this.grabAt;
    this.reactionTimes.push(reaction);
    const precisao = Math.max(0, 100 - d/rim.rimR*35);
    this.precisions.push(precisao);
    if(d < rim.rimR+0.045){
      this.correct++; this.score += 10 + (this.timeLimit?3:0); this.beep('hit');
      this.feedback('Cesta! +'+(10+(this.timeLimit?3:0))+' pontos', 'ok');
    } else {
      this.incorrect++; this.beep('miss');
      this.feedback('Quase! Tente mirar na tabela.', 'bad');
    }
    if(this.correct+this.incorrect >= this.reps){ this.finish('Meta de repetições concluída.'); return; }
    this.newRound();
  }
  update(hand, dt, ctx, w, h){
    if(this.timeLimit!=null){
      const remaining = this.timeLimit - (performance.now()-this.startTime)/1000;
      if(remaining<=0){ this.finish('Tempo esgotado.'); return; }
    }
    this._rim = drawBackboard(ctx, this.hoop.x, this.hoop.y, w, h);

    if(!hand) return;
    this.speeds.push(hand.speed||0);
    if(this.held){ this.ball.x = hand.x; this.ball.y = hand.y; }
    drawBall(ctx, this.ball.x, this.ball.y, this.ball.r, w, h, this.held);
    drawCursorRing(ctx, hand.x, hand.y, w, h, hand.open);
  }
}

// ---------------- Exercício 2: Abrir e Fechar ----------------
class ExAbrirFechar extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.commandInterval = Math.max(1600 - nivel*300, 800);
    this.roundIdx = 0;
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

// ---------------- Exercício 3: Segue o Movimento ----------------
class ExSeguir extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.duration = reps * 3 + nivel*4;
    this.pattern = ['horizontal','vertical','diagonal','circular'][Math.floor(Math.random()*4)];
    this.sampleAcc = 0;
  }
  targetPos(t){
    const speed = 0.55 + this.nivel*0.12;
    switch(this.pattern){
      case 'horizontal': return {x:0.5+0.32*Math.sin(t*speed), y:0.5};
      case 'vertical':   return {x:0.5, y:0.5+0.28*Math.sin(t*speed)};
      case 'diagonal':   return {x:0.5+0.28*Math.sin(t*speed), y:0.5+0.28*Math.sin(t*speed)};
      default:           return {x:0.5+0.28*Math.cos(t*speed), y:0.5+0.28*Math.sin(t*speed)};
    }
  }
  update(hand, dt, ctx, w, h){
    const elapsed = (performance.now()-this.startTime)/1000;
    if(elapsed>=this.duration){ this.finish('Tempo do padrão concluído.'); return; }
    const t = this.targetPos(elapsed);
    drawZone(ctx, t.x, t.y, 0.045, w, h, 'rgba(242,169,59,.9)', null);

    if(hand){
      this.speeds.push(hand.speed||0);
      drawCursorRing(ctx, hand.x, hand.y, w, h, hand.open);
      this.sampleAcc += dt;
      if(this.sampleAcc>=0.2){
        this.sampleAcc = 0;
        const d = dist(hand.x,hand.y,t.x,t.y);
        const precisao = Math.max(0, 100 - d*220);
        this.precisions.push(precisao);
        if(d < 0.1) this.correct++; else this.incorrect++;
      }
    }
  }
}

// ---------------- Exercício 4: 4 Cantos ----------------
class ExCantos extends ExerciseBase{
  constructor(nivel, sens, reps){
    super(nivel, sens, reps);
    this.target = {x:0.5, y:0.5, r:0.12};
    this.held = null;
    this.deliveries = 0;
    this.newRound();
    this.listen('handClose', (pos)=>{
      if(this.done || this.held) return;
      for(const b of this.balls){
        if(b.delivered) continue;
        if(dist(pos.x,pos.y,b.x,b.y) < b.r+0.06){ this.held=b; this.grabAt=performance.now(); this.beep('grab'); break; }
      }
    });
    this.listen('handOpen', (pos)=>{
      if(this.done || !this.held) return;
      this.releaseBall(pos);
    });
  }
  newRound(){
    this.balls = [
      {x:0.14, y:0.18, r:0.06, delivered:false, corner:'sup. esq.'},
      {x:0.86, y:0.18, r:0.06, delivered:false, corner:'sup. dir.'},
      {x:0.14, y:0.82, r:0.06, delivered:false, corner:'inf. esq.'},
      {x:0.86, y:0.82, r:0.06, delivered:false, corner:'inf. dir.'},
    ];
    this.roundStart = performance.now();
  }
  releaseBall(pos){
    const b = this.held; this.held = null;
    const d = dist(pos.x,pos.y,this.target.x,this.target.y);
    const reaction = performance.now()-this.grabAt;
    this.reactionTimes.push(reaction);
    const precisao = Math.max(0, 100 - d/this.target.r*35);
    this.precisions.push(precisao);
    if(d < this.target.r+0.05){
      b.delivered = true;
      this.correct++; this.score += 10; this.deliveries++; this.beep('hit');
      this.feedback('Bola do canto '+b.corner+' entregue!', 'ok');
    } else {
      b.x = pos.x; b.y = pos.y; // fica onde caiu, pode tentar de novo dali
      this.incorrect++; this.beep('miss');
      this.feedback('Fora do alvo — tente de novo.', 'bad');
    }
    if(this.deliveries >= this.reps){ this.finish('Todas as entregas concluídas.'); return; }
    if(this.balls.every(x=>x.delivered)) this.newRound();
  }
  update(hand, dt, ctx, w, h){
    drawZone(ctx, this.target.x, this.target.y, this.target.r, w, h, 'rgba(62,142,107,.4)', '◻');
    this.balls.forEach(b=>{ if(!b.delivered) drawBall(ctx, b.x, b.y, b.r, w, h, this.held===b); });

    if(!hand) return;
    this.speeds.push(hand.speed||0);
    if(this.held){ this.held.x = hand.x; this.held.y = hand.y; }
    drawCursorRing(ctx, hand.x, hand.y, w, h, hand.open);
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
    const map = {cesto:ExCesto, abrirFechar:ExAbrirFechar, seguir:ExSeguir, cantos:ExCantos};
    const Cls = map[id];
    this.instance = new Cls(nivel, sensibilidade, reps);
    this.exerciseId = id;
    return this.instance;
  },
  def(id){ return EXERCISE_DEFS.find(e=>e.id===id); }
};
