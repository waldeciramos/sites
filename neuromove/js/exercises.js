// exercises.js — os 5 exercícios de neuromodulação, coleta de métricas e desenho no canvas.

const EXERCISE_DEFS = [
  {id:'cesto',      icon:'🏀', nome:'Basquete Cerebral',     desc:'Leve o objeto até o cesto certo.', niveis:3},
  {id:'abrirFechar',icon:'✊', nome:'Abrir e Fechar',         desc:'Responda aos comandos ABRA / FECHE.', niveis:3},
  {id:'seguir',     icon:'➰', nome:'Segue o Movimento',      desc:'Acompanhe o alvo com a mão.', niveis:3},
  {id:'pegarSoltar',icon:'🎯', nome:'Pegar e Soltar',         desc:'Distribua os objetos nos locais certos.', niveis:3},
  {id:'duplo',      icon:'👁️', nome:'Controle Duplo',         desc:'Mão para segurar, olhos para direcionar.', niveis:2},
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
    ctx.font='22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(11,46,44,.85)';
    ctx.fillText(label, px, py);
  }
}

function drawCursor(ctx,x,y,w,h,holdProgress){
  const px=x*w, py=y*h;
  ctx.beginPath(); ctx.arc(px,py,17,0,Math.PI*2);
  ctx.strokeStyle='rgba(242,169,59,.95)'; ctx.lineWidth=3; ctx.stroke();
  if(holdProgress!=null){
    ctx.beginPath(); ctx.arc(px,py,25,-Math.PI/2,-Math.PI/2+holdProgress*Math.PI*2);
    ctx.strokeStyle='#3E8E6B'; ctx.lineWidth=4; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2); ctx.fillStyle='#F2A93B'; ctx.fill();
}

const HOLD_MS = 500;

class ExerciseBase{
  constructor(nivel, sensibilidade){
    this.nivel = nivel;
    this.sens = sensibilidade || 1.0;
    this.startTime = performance.now();
    this.done = false;
    this.score = 0;
    this.correct = 0; this.incorrect = 0;
    this.reactionTimes = [];
    this.precisions = [];
    this.blinks = 0;
    this.gazeCounts = {esquerdo:0, direito:0, centro:0};
    this.speeds = [];
    this.onFeedback = null; // (msg, tipo) definido pelo app
    this.onFinish = null;
    this.finishReason = '';
  }
  feedback(msg, tipo){ if(this.onFeedback) this.onFeedback(msg, tipo||'ok'); }
  beep(tipo){ if(window.NM_SOUND) window.NM_SOUND.beep(tipo); }
  finish(reason){
    if(this.done) return;
    this.done = true;
    this.finishReason = reason;
    if(this.onFinish) this.onFinish();
  }
  trackFace(face){
    if(!face) return;
    if(face.gazeDir==='centro') this.gazeCounts.centro++;
    else {
      const side = mapImgSideToPatientSide(face.gazeDir);
      this.gazeCounts[side]++;
    }
  }
  metricas(){
    const durSec = (performance.now()-this.startTime)/1000;
    const olhar = Object.entries(this.gazeCounts).sort((a,b)=>b[1]-a[1])[0][0];
    const velocidadeMedia = this.speeds.length ? this.speeds.reduce((a,b)=>a+b,0)/this.speeds.length : 0;
    return {
      duracao: Math.round(durSec),
      pontuacao: this.score,
      nivel: this.nivel,
      tempoReacaoMedio: this.reactionTimes.length ? Math.round(this.reactionTimes.reduce((a,b)=>a+b,0)/this.reactionTimes.length) : null,
      precisaoMedia: this.precisions.length ? Math.round(this.precisions.reduce((a,b)=>a+b,0)/this.precisions.length) : null,
      movimentosCorretos: this.correct,
      movimentosIncorretos: this.incorrect,
      piscadas: this.blinks,
      olharPredominante: olhar,
      velocidadeMedia: Math.round(velocidadeMedia*1000)/1000,
    };
  }
}

// mapeia lado da imagem crua (não espelhada) para lado do paciente, coerente com Tracking.groupAIsLeftEye
function mapImgSideToPatientSide(imgSide){
  // convenção: lado_esq_img acompanha o mesmo referencial do grupo A de landmarks (olho esquerdo do paciente por padrão)
  const groupAIsLeft = Tracking.getGroupAIsLeftEye();
  if(imgSide==='lado_esq_img') return groupAIsLeft ? 'esquerdo' : 'direito';
  return groupAIsLeft ? 'direito' : 'esquerdo';
}

// ---------------- Exercício 1: Basquete Cerebral ----------------
class ExCesto extends ExerciseBase{
  constructor(nivel, sens){
    super(nivel, sens);
    this.holding = false; this.holdStart = null;
    this.timeLimit = nivel>=2 ? 30 : null;
    this.repsTarget = 8;
    this.newRound();
  }
  newRound(){
    this.source = {x:rand(0.2,0.35), y:rand(0.35,0.55), r:0.06};
    if(this.nivel>=3){
      this.baskets = [
        {x:rand(0.6,0.75), y:rand(0.25,0.4), r:0.09, correct:true},
        {x:rand(0.6,0.75), y:rand(0.6,0.75), r:0.09, correct:false},
      ];
    } else {
      this.baskets = [{x:0.75, y:0.55, r:0.1, correct:true}];
    }
    this.roundStart = performance.now();
    this.grabAt = null;
  }
  update(hand, face, dt, ctx, w, h){
    this.trackFace(face);
    if(this.timeLimit!=null){
      const remaining = this.timeLimit - (performance.now()-this.startTime)/1000;
      if(remaining<=0){ this.finish('Tempo esgotado.'); return; }
    }
    if(this.nivel>=2){
      this.baskets.forEach(b=>{ b.x += Math.sin(performance.now()/900+b.y*10)*0.0009; });
    }
    if(!this.holding){
      drawZone(ctx, this.source.x, this.source.y, this.source.r, w, h, 'rgba(242,169,59,.9)', '🏀');
    }
    this.baskets.forEach(b=> drawZone(ctx,b.x,b.y,b.r,w,h, b.correct?'rgba(62,142,107,.45)':'rgba(193,80,46,.35)', '🧺'));

    if(!hand){ this.holdStart=null; return; }
    this.speeds.push(hand.speed||0);
    const cx=hand.x, cy=hand.y;

    if(!this.holding){
      if(dist(cx,cy,this.source.x,this.source.y) < this.source.r+0.05){
        if(this.holdStart==null) this.holdStart=performance.now();
        drawCursor(ctx,cx,cy,w,h,Math.min(1,(performance.now()-this.holdStart)/HOLD_MS));
        if(performance.now()-this.holdStart>=HOLD_MS){
          this.holding=true; this.holdStart=null; this.grabAt=performance.now();
          this.beep('grab');
        }
      } else { this.holdStart=null; drawCursor(ctx,cx,cy,w,h,null); }
    } else {
      drawZone(ctx, cx, cy, this.source.r, w, h, 'rgba(242,169,59,.9)', '🏀');
      let hitBasket = null;
      for(const b of this.baskets){ if(dist(cx,cy,b.x,b.y) < b.r+0.04){ hitBasket=b; break; } }
      if(hitBasket){
        if(this.holdStart==null) this.holdStart=performance.now();
        drawCursor(ctx,cx,cy,w,h,Math.min(1,(performance.now()-this.holdStart)/HOLD_MS));
        if(performance.now()-this.holdStart>=HOLD_MS){
          this.holding=false; this.holdStart=null;
          const reaction = performance.now()-this.grabAt;
          this.reactionTimes.push(reaction);
          const precisao = Math.max(0, 100 - dist(cx,cy,hitBasket.x,hitBasket.y)/hitBasket.r*40);
          this.precisions.push(precisao);
          if(hitBasket.correct){
            this.correct++; this.score += 10 + (this.timeLimit? 3:0); this.beep('hit');
            this.feedback('Boa! +'+ (10+(this.timeLimit?3:0)) +' pontos', 'ok');
          } else {
            this.incorrect++; this.beep('miss');
            this.feedback('Cesto errado — tente o marcado em verde.', 'bad');
          }
          if(this.correct+this.incorrect >= this.repsTarget){ this.finish('Meta de repetições concluída.'); return; }
          this.newRound();
        }
      } else { this.holdStart=null; drawCursor(ctx,cx,cy,w,h,null); }
    }
  }
}

// ---------------- Exercício 2: Abrir e Fechar ----------------
class ExAbrirFechar extends ExerciseBase{
  constructor(nivel, sens){
    super(nivel, sens);
    this.totalRounds = 10;
    this.roundIdx = 0;
    this.commandInterval = Math.max(1400 - nivel*300, 700); // fica mais rápido com o nível
    this.awaiting = null; // 'abra'|'feche'
    this.commandAt = 0;
    this.lastOpen = true;
    this.nextRound();
  }
  nextRound(){
    if(this.roundIdx>=this.totalRounds){ this.finish('Sequência concluída.'); return; }
    this.roundIdx++;
    this.awaiting = Math.random()<0.5 ? 'abra' : 'feche';
    this.commandAt = performance.now();
    this.answered = false;
  }
  update(hand, face, dt, ctx, w, h){
    this.trackFace(face);
    const promptEl = document.getElementById('gamePrompt');
    if(promptEl) promptEl.innerHTML = `<span>${this.awaiting==='abra'?'ABRA':'FECHE'}</span>`;

    if(hand){
      this.speeds.push(hand.speed||0);
      drawCursor(ctx,hand.x,hand.y,w,h,null);
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
    // timeout do comando = erro
    if(!this.answered && performance.now()-this.commandAt > this.commandInterval+2000){
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
  constructor(nivel, sens){
    super(nivel, sens);
    this.duration = 25 + nivel*5;
    this.pattern = ['horizontal','vertical','diagonal','circular'][Math.min(3, Math.floor(Math.random()*4))];
    this.sampleAcc = 0;
  }
  targetPos(t){
    const speed = 0.6 + this.nivel*0.15;
    switch(this.pattern){
      case 'horizontal': return {x:0.5+0.32*Math.sin(t*speed), y:0.5};
      case 'vertical':   return {x:0.5, y:0.5+0.28*Math.sin(t*speed)};
      case 'diagonal':   return {x:0.5+0.28*Math.sin(t*speed), y:0.5+0.28*Math.sin(t*speed)};
      default:           return {x:0.5+0.28*Math.cos(t*speed), y:0.5+0.28*Math.sin(t*speed)};
    }
  }
  update(hand, face, dt, ctx, w, h){
    this.trackFace(face);
    const elapsed = (performance.now()-this.startTime)/1000;
    if(elapsed>=this.duration){ this.finish('Tempo do padrão concluído.'); return; }
    const t = this.targetPos(elapsed);
    drawZone(ctx, t.x, t.y, 0.045, w, h, 'rgba(242,169,59,.9)', null);

    if(hand){
      this.speeds.push(hand.speed||0);
      drawCursor(ctx, hand.x, hand.y, w, h, null);
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

// ---------------- Exercício 4: Pegar e Soltar ----------------
class ExPegarSoltar extends ExerciseBase{
  constructor(nivel, sens){
    super(nivel, sens);
    this.numObjetos = Math.min(1+nivel, 3);
    this.repsTarget = 6;
    this.roundsDone = 0;
    this.newRound();
  }
  newRound(){
    this.objetos = [];
    for(let i=0;i<this.numObjetos;i++){
      this.objetos.push({
        id:i, holding:false, placed:false, holdStart:null,
        src:{x:rand(0.15,0.4), y:rand(0.3,0.75), r:0.05},
        dst:{x:rand(0.6,0.85), y:rand(0.25,0.8), r:0.07},
      });
    }
    this.roundStart = performance.now();
  }
  update(hand, face, dt, ctx, w, h){
    this.trackFace(face);
    this.objetos.forEach(o=>{
      if(o.placed) return;
      if(!o.holding){
        drawZone(ctx,o.src.x,o.src.y,o.src.r,w,h,'rgba(242,169,59,.9)','●');
        drawZone(ctx,o.dst.x,o.dst.y,o.dst.r,w,h,'rgba(234,241,238,.35)','◻');
      } else {
        drawZone(ctx,o.dst.x,o.dst.y,o.dst.r,w,h,'rgba(62,142,107,.4)','◻');
      }
    });

    if(!hand) return;
    this.speeds.push(hand.speed||0);
    const cx=hand.x, cy=hand.y;
    let acting = null;
    for(const o of this.objetos){
      if(o.placed) continue;
      if(!o.holding && dist(cx,cy,o.src.x,o.src.y) < o.src.r+0.05){ acting=o; break; }
      if(o.holding){ acting=o; break; }
    }
    if(!acting){ drawCursor(ctx,cx,cy,w,h,null); return; }

    if(!acting.holding){
      if(acting.holdStart==null) acting.holdStart=performance.now();
      drawCursor(ctx,cx,cy,w,h,Math.min(1,(performance.now()-acting.holdStart)/HOLD_MS));
      if(performance.now()-acting.holdStart>=HOLD_MS){
        acting.holding=true; acting.holdStart=null; acting.grabAt=performance.now();
        this.beep('grab');
      }
    } else {
      drawZone(ctx,cx,cy,acting.src.r,w,h,'rgba(242,169,59,.9)','●');
      if(dist(cx,cy,acting.dst.x,acting.dst.y) < acting.dst.r+0.04){
        if(acting.holdStart==null) acting.holdStart=performance.now();
        drawCursor(ctx,cx,cy,w,h,Math.min(1,(performance.now()-acting.holdStart)/HOLD_MS));
        if(performance.now()-acting.holdStart>=HOLD_MS){
          acting.holding=false; acting.holdStart=null; acting.placed=true;
          const reaction = performance.now()-acting.grabAt;
          this.reactionTimes.push(reaction);
          const precisao = Math.max(0, 100 - dist(cx,cy,acting.dst.x,acting.dst.y)/acting.dst.r*40);
          this.precisions.push(precisao);
          this.correct++; this.score+=10; this.beep('hit');
          this.feedback('Objeto entregue!', 'ok');
        }
      } else { acting.holdStart=null; drawCursor(ctx,cx,cy,w,h,null); }
    }

    if(this.objetos.every(o=>o.placed)){
      this.roundsDone++;
      if(this.roundsDone>=this.repsTarget){ this.finish('Todas as rodadas concluídas.'); return; }
      this.newRound();
    }
  }
}

// ---------------- Exercício 5: Controle Duplo (mão + olhos) ----------------
class ExDuplo extends ExerciseBase{
  constructor(nivel, sens){
    super(nivel, sens);
    this.repsTarget = 6;
    this.newRound();
    this._blinkHandlerLeft = ()=>{ this.blinks++; if(this.holding) this.obj.x = Math.max(0.08, this.obj.x-0.05); };
    this._blinkHandlerRight = ()=>{ this.blinks++; if(this.holding) this.obj.x = Math.min(0.92, this.obj.x+0.05); };
    this._dropHandler = ()=>{ if(this.holding) this.tryDrop(); };
    Tracking.on('blinkSingle', (d)=>{
      if(this.done) return;
      if(d.group==='esquerdo') this._blinkHandlerLeft();
      else this._blinkHandlerRight();
    });
    Tracking.on('blinkDouble', ()=>{ if(!this.done) this._dropHandler(); });
  }
  newRound(){
    this.holding=false; this.holdStart=null;
    this.obj = {x:rand(0.25,0.4), y:0.55};
    this.target = {x:rand(0.6,0.8), y:rand(0.3,0.75), r:0.09};
    this.grabZone = {x:this.obj.x, y:this.obj.y, r:0.055};
  }
  tryDrop(){
    const d = dist(this.obj.x,this.obj.y,this.target.x,this.target.y);
    const precisao = Math.max(0, 100 - d/this.target.r*40);
    this.precisions.push(precisao);
    this.holding=false;
    if(d < this.target.r+0.05){
      this.correct++; this.score+=15; this.beep('hit');
      this.feedback('Entregue com sucesso!', 'ok');
    } else {
      this.incorrect++; this.beep('miss');
      this.feedback('Fora do alvo — tente novamente.', 'bad');
    }
    this.roundsDone = (this.roundsDone||0)+1;
    if(this.roundsDone>=this.repsTarget){ this.finish('Rodadas concluídas.'); return; }
    this.newRound();
  }
  update(hand, face, dt, ctx, w, h){
    this.trackFace(face);
    drawZone(ctx, this.target.x, this.target.y, this.target.r, w, h, 'rgba(62,142,107,.4)', '◻');
    if(!this.holding) drawZone(ctx, this.obj.x, this.obj.y, 0.05, w, h, 'rgba(242,169,59,.9)', '●');
    else drawZone(ctx, this.obj.x, this.obj.y, 0.05, w, h, 'rgba(242,169,59,.9)', '●');

    if(!hand){ this.holdStart=null; return; }
    this.speeds.push(hand.speed||0);
    const cx=hand.x, cy=hand.y;
    drawCursor(ctx,cx,cy,w,h, this.holdStart!=null? Math.min(1,(performance.now()-this.holdStart)/HOLD_MS): null);

    if(!this.holding){
      if(dist(cx,cy,this.obj.x,this.obj.y) < 0.05+0.05){
        if(this.holdStart==null) this.holdStart=performance.now();
        if(performance.now()-this.holdStart>=HOLD_MS){
          this.holding=true; this.holdStart=null; this.grabAt=performance.now(); this.beep('grab');
        }
      } else this.holdStart=null;
    } else {
      // enquanto segura, acompanha levemente a mão em Y (a direção X é só por piscada)
      this.obj.y += (cy-this.obj.y)*0.15;
    }
  }
}

const ExerciseEngine = {
  instance: null,
  start(id, nivel, sensibilidade){
    const map = {cesto:ExCesto, abrirFechar:ExAbrirFechar, seguir:ExSeguir, pegarSoltar:ExPegarSoltar, duplo:ExDuplo};
    const Cls = map[id];
    this.instance = new Cls(nivel, sensibilidade);
    this.exerciseId = id;
    return this.instance;
  },
  def(id){ return EXERCISE_DEFS.find(e=>e.id===id); }
};
