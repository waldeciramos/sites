// app.js — orquestra telas, cadastro, calibração, jogo e relatórios.
(function(){
"use strict";

const state = {
  wrapper: null,
  calibStep: 1,
  calibHandSeen: false,
  calibHandOpenSeen: false, calibHandCloseSeen: false,
  currentExerciseId: null,
  currentNivel: 1,
  sessionExercicios: [],
  sessionReps: 10,
  sessionRepsLocked: false,
};

// ---------- Som ----------
window.NM_SOUND = (function(){
  let ctx = null;
  function ac(){ if(!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)(); return ctx; }
  function beep(type){
    const toggle = document.getElementById('toggleSound');
    if(toggle && !toggle.checked) return;
    try{
      const c = ac();
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      const freqs = {grab:520, hit:780, miss:180};
      o.frequency.value = freqs[type]||440;
      g.gain.value = 0.06;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+0.18);
      o.stop(c.currentTime+0.2);
    }catch(e){}
  }
  return {beep};
})();

// ---------- Tela cheia + manter em primeiro plano ----------
// Obs.: por segurança dos navegadores, nenhum site consegue bloquear de fato
// notificações de outros apps (WhatsApp etc.) — isso depende do sistema
// (modo "Não perturbe", app fixado/kiosk). Aqui fazemos o que dá pra fazer
// via navegador: tela cheia + travar a tela pra não apagar (Wake Lock) +
// tentar voltar sozinho quando o usuário retorna ao app.
let wakeLock = null;
async function requestWakeLock(){
  try{
    if('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
  }catch(e){ /* sem suporte ou permissão — segue sem travar a tela */ }
}
function releaseWakeLock(){
  if(wakeLock){ wakeLock.release().catch(()=>{}); wakeLock = null; }
}
function toggleFullscreen(){
  if(!document.fullscreenElement){
    document.documentElement.requestFullscreen?.().catch(()=>{});
  } else {
    document.exitFullscreen?.().catch(()=>{});
  }
}
document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);
document.getElementById('btnFullscreenSettings').addEventListener('click', ()=>{ toggleFullscreen(); closeSettings(); });

let wasFullscreenBeforeHide = false;
document.addEventListener('fullscreenchange', ()=>{
  if(document.fullscreenElement) wasFullscreenBeforeHide = true;
});
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState==='visible'){
    const emGame = document.getElementById('screen-game').classList.contains('active');
    const emCalib = document.getElementById('screen-calib').classList.contains('active');
    if(emGame || emCalib){
      requestWakeLock();
      if(document.fullscreenElement===null && wasFullscreenBeforeHide){
        document.documentElement.requestFullscreen?.().catch(()=>{});
      }
    }
  }
});

// ---------- Navegação ----------
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('globalNav').style.display = (id==='screen-home'||id==='screen-login')?'none':'flex';
}

// ---------- HOME: só pede o nome (sem login, sem cadastro) ----------
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function primeiroNome(){ return (state.wrapper && state.wrapper.paciente.nome || '').split(' ')[0]; }
function renderPatientList(){
  const i=document.getElementById('nameInput'); let n='';
  try{ n=localStorage.getItem('nm_nome')||''; }catch(e){}
  if(i && !i.value) i.value=n;
}
async function startWithName(){
  const inp=document.getElementById('nameInput'), nome=inp.value.trim();
  if(!nome){ inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); return; }
  try{ localStorage.setItem('nm_nome', nome); }catch(e){}
  const norm=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const todos=await Storage.all();
  let w=todos.find(x=>norm(x.paciente.nome)===norm(nome));
  if(!w){ w=Storage.novoPaciente({nome, sensibilidade:1.0, dificuldadeInicial:1, maoDominante:'Destra'}); await Storage.upsert(w); }
  state.wrapper=w; state.extraOk=true;
  startCalibration();
}
document.getElementById('btnStartName').addEventListener('click', startWithName);
document.getElementById('nameInput').addEventListener('keydown', e=>{ if(e.key==='Enter') startWithName(); });

// ---------- CALIBRAÇÃO (só mão) ----------
let calibCtx, calibVideoEl;

async function startCalibration(){
  showScreen('screen-calib');
  requestWakeLock();
  state.calibStep = 1;
  state.calibHandSeen = false;
  state.calibHandOpenSeen = false; state.calibHandCloseSeen = false;
  renderCalibStep();

  calibVideoEl = document.getElementById('video');
  const overlay = document.getElementById('calibOverlay');
  calibCtx = overlay.getContext('2d');

  if(typeof Hands === 'undefined'){
    document.getElementById('calibStepText').textContent =
      'Não foi possível carregar o MediaPipe Hands. Isso acontece quando a página é aberta ' +
      'dentro do preview do Claude.ai. Rode local (http://localhost) ou publique no GitHub Pages.';
    return;
  }

  try{
    await Tracking.init(calibVideoEl);
  }catch(e){
    document.getElementById('calibStepText').textContent = 'Não foi possível acessar a câmera. Verifique as permissões do navegador.';
    return;
  }
  resizeCanvas(overlay, document.getElementById('calibStage'));
  Tracking.start(onCalibFrame);
}

function resizeCanvas(canvas, stage){
  canvas.width = stage.clientWidth; canvas.height = stage.clientHeight;
}

function onCalibFrame({hand}){
  const ctx = calibCtx, w=ctx.canvas.width, h=ctx.canvas.height;
  ctx.clearRect(0,0,w,h);

  document.getElementById('handChip').textContent = 'mão: ' + (hand ? (hand.open?'aberta ✋':'fechada ✊') : 'não detectada');

  if(hand){
    state.calibHandSeen = true;
    if(hand.open) state.calibHandOpenSeen = true; else state.calibHandCloseSeen = true;
    ctx.beginPath(); ctx.arc(hand.x*w, hand.y*h, 16, 0, Math.PI*2);
    ctx.strokeStyle = hand.open ? '#3E8E6B' : '#F2A93B'; ctx.lineWidth=3; ctx.stroke();
  }

  if(state.calibStep===1 && state.calibHandSeen){
    document.getElementById('calibStepText').textContent = 'Mão detectada. Toque em "Continuar".';
    document.getElementById('btnCalibNext').disabled = false;
  }
  if(state.calibStep===2 && state.calibHandOpenSeen && state.calibHandCloseSeen){
    document.getElementById('calibStepText').textContent = 'Gestos confirmados. Toque em "Continuar" para concluir.';
    document.getElementById('btnCalibNext').disabled = false;
  }
}

function renderCalibStep(){
  const title = document.getElementById('calibStepTitle');
  const text = document.getElementById('calibStepText');
  document.getElementById('btnCalibNext').disabled = true;
  if(state.calibStep===1){
    title.textContent = 'Passo 1 — Detecção';
    text.textContent = 'Posicione a mão dentro do quadro, com boa iluminação.';
  } else if(state.calibStep===2){
    title.textContent = 'Passo 2 — Confirmar gestos';
    text.textContent = 'Abra e feche a mão diante da câmera para confirmar a detecção do gesto de agarrar/soltar.';
  }
}

document.getElementById('btnCalibBack').addEventListener('click', ()=>{
  if(state.calibStep>1){ state.calibStep--; renderCalibStep(); }
  else { Tracking.stop(); releaseWakeLock(); showScreen('screen-home'); renderPatientList(); }
});
document.getElementById('btnCalibNext').addEventListener('click', ()=>{
  if(state.calibStep<2){ state.calibStep++; renderCalibStep(); }
  else {
    Tracking.stop();
    releaseWakeLock();
    goToMenu();
  }
});

// ---------- MENU DE EXERCÍCIOS ----------
function goToMenu(){
  showScreen('screen-menu');
  const p = state.wrapper.paciente;
  const n1 = p.nome.split(' ')[0];
  document.getElementById('menuPatientName').textContent = 'Oi, '+n1+'! 👋';
  document.getElementById('menuPatientMeta').textContent =
    pick([`Que bom te ver por aqui, ${n1}! Escolha um jogo e vamos nessa 🚀`,`${n1}, hoje você vai arrasar! Qual jogo vai ser? 😎`,`${n1}, essa mãozinha está pronta pra brilhar! ✨`]) +
    (p.sessoes.length ? ` · ${p.sessoes.length} partida(s) · média ${p.historico.mediaDesempenho} pts` : '');

  renderProgramPanel();

  const grid = document.getElementById('exerciseGrid');
  grid.innerHTML = '';
  EXERCISE_DEFS.forEach(ex=>{
    const card = document.createElement('div');
    card.className = 'ex-card';
    card.innerHTML = `<div class="ex-icon">${ex.icon}</div><div class="txt"><h3>${ex.nome}</h3><p>${ex.desc}</p></div>`;
    card.addEventListener('click', ()=>chooseNivelAndStart(ex));
    grid.appendChild(card);
  });

  if(state.sessionExercicios.length===0 && !state.sessionRepsLocked){
    state.sessionReps = EXERCISE_DEFS[0].repsDefault;
  }
  const repsInput = document.getElementById('sessionReps');
  repsInput.value = state.sessionReps;
  repsInput.disabled = state.sessionRepsLocked;
  document.getElementById('sessionRepsHint').textContent = state.sessionRepsLocked
    ? 'Repetições fixadas para esta sessão (definidas no primeiro exercício).'
    : 'Vale para todos os exercícios desta sessão. Pode ajustar antes do primeiro exercício.';
}
function renderProgramPanel(){
  const p = state.wrapper.paciente;
  const { n, concluido, ciclo, noCiclo } = Programa.painel(p);
  const el = document.getElementById('programPanel');
  let dots = '';
  for(let i=1;i<=Programa.TOTAL;i++){
    dots += `<span class="${i<=n?'done':(i===n+1?'next':'')}">${i}</span>`;
  }
  let titulo, nota;
  if(concluido){
    titulo = 'Programa concluído <span class="prog-badge ok">20/20</span>';
    nota = 'Os 2 ciclos foram finalizados. Veja os relatórios completos em "Ver histórico e relatórios". Novas sessões contam como extras.';
  } else {
    titulo = `Ciclo ${ciclo} de 2 <span class="prog-badge">${noCiclo}/${Programa.CICLO}</span>`;
    nota = `Próxima: sessão ${n+1} de ${Programa.TOTAL}. `
         + (noCiclo===Programa.CICLO-1 ? 'Ao concluí-la, o relatório completo do ciclo '+ciclo+' será gerado.' : `Faltam ${Programa.CICLO-noCiclo} para fechar o ciclo ${ciclo}.`);
  }
  el.innerHTML = `
    <h3>Programa de tratamento</h3>
    <div class="prog-top"><span>${titulo}</span><span class="big">${Math.min(n,Programa.TOTAL)}/${Programa.TOTAL}</span></div>
    <div class="prog-bar"><i style="width:${Math.min(100,n/Programa.TOTAL*100)}%"></i></div>
    <div class="prog-dots">${dots}</div>
    <p class="prog-note">${nota}</p>`;
}

document.getElementById('sessionReps').addEventListener('change', (e)=>{
  const v = parseInt(e.target.value)||10;
  state.sessionReps = Math.max(3, Math.min(30, v));
  e.target.value = state.sessionReps;
});

document.getElementById('btnGoHistory').addEventListener('click', renderHistory);
document.getElementById('btnRecalibrate').addEventListener('click', startCalibration);
document.getElementById('btnGoHome').addEventListener('click', ()=>{
  state.wrapper = null;
  state.sessionExercicios = [];
  state.sessionRepsLocked = false;
  renderPatientList(); showScreen('screen-home');
});

function chooseNivelAndStart(ex){
  const p = state.wrapper.paciente;
  if(false && state.sessionExercicios.length===0 && !state.extraOk){
    if(!confirm('O programa de 20 sessões deste paciente já foi concluído.\n\nDeseja iniciar uma sessão EXTRA (fora do programa)?')) return;
    state.extraOk = true;
  }
  const nivel = Math.max(1, Math.min(ex.niveis, state.wrapper.paciente.configuracoes.dificuldadeInicial));
  state.sessionRepsLocked = true; // a partir do 1º exercício, trava a config de repetições da sessão
  startExercise(ex.id, nivel);
}

// ---------- JOGO ----------
let gameVideoEl, gameCtx, gameStage, gameStartWallTime=0, lastFrameT=0;

async function startExercise(id, nivel){
  state.currentExerciseId = id;
  state.currentNivel = nivel;
  showScreen('screen-game');
  requestWakeLock();
  gameVideoEl = document.getElementById('videoGame');
  const overlay = document.getElementById('gameOverlay');
  gameCtx = overlay.getContext('2d');
  gameStage = document.getElementById('gameStage');
  document.getElementById('gamePrompt').innerHTML='';

  if(typeof Hands==='undefined'){ return; }
  try{ await Tracking.init(gameVideoEl); }catch(e){ return; }
  resizeCanvas(overlay, gameStage);

  const sens = state.wrapper.paciente.configuracoes.sensibilidade || 1.0;
  const inst = ExerciseEngine.start(id, nivel, sens, state.sessionReps);
  inst.onFeedback = showFeedback;
  inst.onFinish = ()=>endExercise(inst);
  gameStartWallTime = performance.now();
  lastFrameT = performance.now();

  document.getElementById('statHits').textContent='0';
  document.getElementById('statErr').textContent='0';
  document.getElementById('statReact').textContent='—';
  document.getElementById('statRep').textContent='0/'+state.sessionReps;

  Tracking.start(onGameFrame);
}

function onGameFrame({hand}){
  const inst = ExerciseEngine.instance;
  if(!inst || inst.done) return;
  const now = performance.now();
  const dt = (now-lastFrameT)/1000; lastFrameT = now;

  const w = gameCtx.canvas.width, h = gameCtx.canvas.height;
  gameCtx.clearRect(0,0,w,h);
  inst.update(hand, dt, gameCtx, w, h);

  document.getElementById('handStateChip').textContent = hand ? (hand.open?'✋ aberta':'✊ fechada') : '— sem mão';
  document.getElementById('gameTimer').textContent = fmtTimer((now-gameStartWallTime)/1000);
  document.getElementById('gameScore').textContent = inst.score+' pts';
  document.getElementById('statHits').textContent = inst.correct;
  document.getElementById('statErr').textContent = inst.incorrect;
  document.getElementById('statReact').textContent = inst.reactionTimes.length ? Math.round(inst.reactionTimes[inst.reactionTimes.length-1]) : '—';
  const repDisplay = inst.roundProgress!=null ? inst.roundProgress : (inst.correct+inst.incorrect);
  document.getElementById('statRep').textContent = repDisplay+'/'+state.sessionReps;
  const roundEl = document.getElementById('gameRound');
  if(roundEl) roundEl.textContent = inst.roundProgress!=null ? ('Série '+inst.rodada) : '';
}

function fmtTimer(sec){
  const m = Math.floor(sec/60), s = Math.floor(sec%60), ms = Math.floor((sec%1)*10);
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+ms;
}

let fbN=0;
function jokeHtml(tipo){
  fbN++; if(fbN%3!==0) return '';
  const n=primeiroNome();
  const ok=[`Mandou bem, ${n}! 🌟`,`${n} está on fire! 🔥`,`Essa foi de craque, ${n}! ⚽`,`Nem o Neymar faz assim, ${n}! 😄`,`Olha esse talento, ${n}! 👏`];
  const ruim=[`Ops! Acontece, ${n} 😅`,`Quase! Respira e tenta de novo, ${n} 💙`,`Essa escapuliu! Bora de novo, ${n}? 🙈`,`Sem stress, ${n}! A próxima é sua 😉`];
  return '<small>'+escapeHtml(pick(tipo==='bad'?ruim:ok))+'</small>';
}
let feedbackTimeout=null;
function showFeedback(msg, tipo){
  const el = document.getElementById('feedbackToast');
  el.innerHTML = escapeHtml(msg) + jokeHtml(tipo);
  el.className = 'feedback-toast show' + (tipo==='bad'?' bad':'');
  clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(()=>el.classList.remove('show'), 1600);
}

document.getElementById('btnEndSession').addEventListener('click', ()=>{
  const inst = ExerciseEngine.instance;
  if(inst) inst.finish('Encerrado manualmente pelo terapeuta/paciente.');
});

function endExercise(inst){
  Tracking.stop();
  releaseWakeLock();
  const def = ExerciseEngine.def(state.currentExerciseId);
  const registro = {
    nome: def.nome,
    duracao: inst.metricas().duracao,
    pontuacao: inst.score,
    nivel: state.currentNivel,
    metricas: (({duracao,pontuacao,nivel, ...m})=>m)(inst.metricas()),
  };
  state.sessionExercicios.push(registro);
  askContinueOrFinish();
}

function askContinueOrFinish(){
  const n=primeiroNome();
  const ult=state.sessionExercicios[state.sessionExercicios.length-1];
  document.getElementById('dlgTitle').textContent='Mandou bem!';
  document.getElementById('dlgEmoji').textContent=pick(['🏆','🌟','🎉','🥳']);
  document.getElementById('dlgMsg').textContent=pick([`${n}, que partida! Nem o cronômetro acreditou 😄`,`Uau, ${n}! Essa mão está afiada ✨`,`${n} no comando! Bora pro próximo jogo? 🚀`,`Respira, ${n}... você merece um aplauso! 👏`]);
  document.getElementById('dlgScore').textContent='⭐ '+(ult?ult.pontuacao:0)+' pontos';
  const d=document.getElementById('dlg'); d.classList.add('open');
  document.getElementById('dlgNext').onclick=()=>{ d.classList.remove('open'); goToMenu(); };
  document.getElementById('dlgEnd').onclick=()=>{ d.classList.remove('open'); finalizeSession(); };
}

async function finalizeSession(){
  if(!state.sessionExercicios.length){ goToMenu(); return; }
  const duracaoTotal = state.sessionExercicios.reduce((a,e)=>a+e.duracao,0);
  const scoresAnteriores = state.wrapper.paciente.sessoes.flatMap(s=>s.exerciciosRealizados.map(e=>e.pontuacao));
  const mediaAnterior = scoresAnteriores.length ? scoresAnteriores.reduce((a,b)=>a+b,0)/scoresAnteriores.length : null;
  const novaMedia = state.sessionExercicios.reduce((a,e)=>a+e.pontuacao,0)/state.sessionExercicios.length;

  const sessao = {
    data: new Date().toISOString(),
    duracaoTotal,
    exerciciosRealizados: state.sessionExercicios,
    repeticoesConfiguradas: state.sessionReps,
    progresso: { melhoriaPrecisao: null, nivelAtual: state.currentNivel }
  };
  if(mediaAnterior!=null){
    sessao.progresso.melhoriaPrecisao = Math.round(((novaMedia-mediaAnterior)/Math.max(1,mediaAnterior))*100);
  }

  await registrarSessao(state.wrapper, sessao);

  if(mediaAnterior!=null && novaMedia>mediaAnterior){
    setTimeout(()=>alert(`Parabéns, ${primeiroNome()}! Desempenho médio melhorou ${sessao.progresso.melhoriaPrecisao}% em relação às sessões anteriores.`), 100);
  }

  let html = Report.build(state.wrapper, sessao);
  const nSessoes = state.wrapper.paciente.sessoes.length;
  if(nSessoes===Programa.CICLO || nSessoes===Programa.TOTAL){
    const ciclo = nSessoes/Programa.CICLO;
    html += '<hr style="margin:26px 0;border:none;border-top:3px double #123C39;">' + Report.buildCycle(state.wrapper, ciclo);
    if(nSessoes===Programa.TOTAL) html += '<hr style="margin:26px 0;border:none;border-top:3px double #123C39;">' + Report.buildCycle(state.wrapper, 'geral');
    setTimeout(()=>alert(nSessoes===Programa.TOTAL
      ? 'Programa concluído! 20 sessões realizadas. O relatório completo (ciclo 2 + geral) está logo abaixo do relatório da sessão.'
      : 'Ciclo 1 concluído! 10 sessões realizadas. O relatório completo do ciclo está logo abaixo do relatório da sessão.'), 200);
  }
  document.getElementById('reportBody').innerHTML = html;
  state.lastSessao = sessao;
  state.sessionExercicios = [];
  state.sessionRepsLocked = false;
  showScreen('screen-report');
}

document.getElementById('btnPrintReport').addEventListener('click', ()=>window.print());
document.getElementById('btnExportSessionJson').addEventListener('click', ()=>{
  downloadJson(state.lastSessao, `sessao_${state.wrapper.paciente.nome.replace(/\s+/g,'_')}_${Date.now()}.json`);
});
document.getElementById('btnBackFromReport').addEventListener('click', goToMenu);

function downloadJson(obj, filename){
  const blob = new Blob([JSON.stringify(obj,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

// ---------- HISTÓRICO ----------
// Os dados (agrupamento por ciclo, quais relatórios estão disponíveis) vêm
// prontos de Programa (storage.js); aqui só se monta o HTML.
function renderHistory(){
  showScreen('screen-history');
  const p = state.wrapper.paciente;
  document.getElementById('histPatientName').textContent = p.nome;
  const n = p.sessoes.length;

  const sum = document.getElementById('programSummary');
  sum.innerHTML = `<div class="panel program-panel"><h3>Relatórios de evolução</h3>
    <p class="prog-note" style="margin:0 0 10px 0;">Progresso: ${Math.min(n,Programa.TOTAL)} de ${Programa.TOTAL} sessões${n>Programa.TOTAL?' (+'+(n-Programa.TOTAL)+' extra)':''}.</p>
    <div id="cycleBtns" style="display:flex;flex-direction:column;gap:8px;"></div></div>`;
  const box = document.getElementById('cycleBtns');
  const disponiveis = Programa.relatoriosDisponiveis(p);
  if(!disponiveis.length){
    box.innerHTML = '<div class="empty" style="color:#4a5f5a;padding:8px;">Disponível após a 1ª sessão.</div>';
  } else {
    disponiveis.forEach(r=>{
      const b = document.createElement('button');
      b.className = 'btn-primary btn-block';
      b.textContent = `${r.label} — ${r.qtd===r.meta ? 'completo' : 'parcial '+r.qtd+'/'+r.meta}`;
      b.addEventListener('click', ()=>openCycleReport(r.modo));
      box.appendChild(b);
    });
  }

  const list = document.getElementById('historyList');
  if(!n){ list.innerHTML = '<div class="empty">Ainda não há sessões registradas.</div>'; return; }
  list.innerHTML = '';
  Programa.agrupadoPorCiclo(p).forEach(grupo=>{
    const h = document.createElement('div');
    h.className = 'hcycle';
    h.textContent = grupo.ciclo ? ('Ciclo '+grupo.ciclo+' (sessões '+((grupo.ciclo-1)*10+1)+'–'+(grupo.ciclo*10)+')') : 'Sessões extras';
    list.appendChild(h);
    grupo.sessoes.forEach(({numero, sessao:s})=>{
      const div = document.createElement('div');
      div.className = 'history-item';
      const total = s.exerciciosRealizados.reduce((a,e)=>a+e.pontuacao,0);
      div.innerHTML = `<div class="hname">Sessão ${numero} · ${new Date(s.data).toLocaleString('pt-BR')}</div>
        <div class="hmeta">${s.exerciciosRealizados.length} exercício(s) · ${total} pts · ${fmtDurMin(s.duracaoTotal)}</div>`;
      list.appendChild(div);
    });
  });
}
function fmtDurMin(sec){ sec=Math.round(sec||0); return Math.floor(sec/60)+'min '+(sec%60)+'s'; }

function openCycleReport(modo){
  document.getElementById('reportBody').innerHTML = Report.buildCycle(state.wrapper, modo);
  showScreen('screen-report');
}

document.getElementById('btnHistoryBack').addEventListener('click', goToMenu);
document.getElementById('btnExportPatientJson').addEventListener('click', ()=>{
  downloadJson(state.wrapper, `paciente_${state.wrapper.paciente.nome.replace(/\s+/g,'_')}.json`);
});

// ---------- Configurações de acessibilidade ----------
document.getElementById('btnSettings').addEventListener('click', ()=>{
  document.getElementById('settingsPanel').classList.add('open');
  document.getElementById('settingsBackdrop').classList.add('open');
});
document.getElementById('btnCloseSettings').addEventListener('click', closeSettings);
document.getElementById('settingsBackdrop').addEventListener('click', closeSettings);
function closeSettings(){
  document.getElementById('settingsPanel').classList.remove('open');
  document.getElementById('settingsBackdrop').classList.remove('open');
}
document.getElementById('toggleContrast').addEventListener('change', (e)=>document.body.classList.toggle('contrast', e.target.checked));
document.getElementById('toggleFontSize').addEventListener('change', (e)=>document.body.classList.toggle('bigfont', e.target.checked));

// ---------- Init ----------
window.addEventListener('resize', ()=>{
  if(document.getElementById('screen-calib').classList.contains('active')){
    resizeCanvas(document.getElementById('calibOverlay'), document.getElementById('calibStage'));
  }
  if(document.getElementById('screen-game').classList.contains('active')){
    resizeCanvas(document.getElementById('gameOverlay'), gameStage);
  }
});

showScreen('screen-home'); renderPatientList();
renderPatientList();
})();
