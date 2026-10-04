// tracking.js — MediaPipe Hands (21 pontos), gestos de agarrar (mão fechada) e soltar (mão aberta).
// Versão estável: gesto com histerese (não "pisca"), tolerância a perda rápida do rastreio,
// posição suavizada, detecção independente da inclinação da mão e câmera reaproveitada entre jogos.

const Tracking = (function(){

  const TIPS = [4,8,12,16,20];
  const PIPS = [3,6,10,14,18];
  const GRACE_MS = 450;      // quanto tempo mantém a mão "viva" se o rastreio falhar por um instante

  let handsModel=null, videoEl=null, stream=null;
  let running=false, loopId=0, onFrameCb=null;
  let lastHand=null, lastSeenT=0;
  let prevPalm=null, prevT=0;
  let mapper=null;
  let isOpenState=true, flipCount=0;       // histerese do gesto
  let sx=null, sy=null;                    // posição suavizada
  let pinchState={index:false,middle:false,ring:false,pinky:false};

  const listeners = {};
  function on(evt, fn){ (listeners[evt]=listeners[evt]||[]).push(fn); }
  function off(evt, fn){ listeners[evt]=(listeners[evt]||[]).filter(f=>f!==fn); }
  function clearListeners(){ Object.keys(listeners).forEach(k=>{ listeners[k]=[]; }); }
  function emit(evt, data){ (listeners[evt]||[]).slice().forEach(fn=>{ try{ fn(data); }catch(e){ console.error(e); } }); }
  function setMapper(fn){ mapper = fn || null; }

  function leve(){
    // celular / aparelho simples: modelo leve (bem mais rápido, precisão suficiente pra abrir/fechar e pinça)
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');
    return mobile || (navigator.hardwareConcurrency||8) <= 4;
  }

  function resetEstado(){
    lastHand=null; prevPalm=null; sx=sy=null; isOpenState=true; flipCount=0;
    pinchState={index:false,middle:false,ring:false,pinky:false};
  }
  function liberarCamera(){
    if(stream){ try{ stream.getTracks().forEach(t=>t.stop()); }catch(e){} stream=null; }
    if(videoEl){ try{ videoEl.srcObject=null; }catch(e){} }
  }

  async function init(videoElement, aspect){
    videoEl = videoElement;
    if(!handsModel){
      handsModel = new Hands({locateFile:(f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`});
      handsModel.setOptions({maxNumHands:1, modelComplexity: leve()?0:1, minDetectionConfidence:0.55, minTrackingConfidence:0.5});
      handsModel.onResults(onHandResults);
    }
    resetEstado();
    // reaproveita a câmera já aberta (troca de jogo bem mais rápida)
    if(stream && stream.active){
      if(videoEl.srcObject !== stream) videoEl.srcObject = stream;
    } else {
      const portrait = aspect && aspect < 1;
      stream = await navigator.mediaDevices.getUserMedia({
        video:{facingMode:'user', width:{ideal: portrait?480:640}, height:{ideal: portrait?640:480}, frameRate:{ideal:30}},
        audio:false
      });
      videoEl.srcObject = stream;
    }
    await new Promise(res=>{
      if(videoEl.readyState>=2) return res();
      videoEl.onloadeddata = ()=>res();
      setTimeout(res, 4000);
    });
    try{ await videoEl.play(); }catch(e){}
    return stream;
  }

  function start(frameCb){
    onFrameCb = frameCb; running = true;
    const id = ++loopId; loop(id);
  }
  // pausa: para de processar mas MANTÉM a câmera aberta (usado entre um jogo e o próximo)
  function pause(){ running=false; loopId++; onFrameCb=null; }
  // stop: para tudo e libera a câmera
  function stop(){ pause(); liberarCamera(); resetEstado(); }

  async function loop(id){
    if(!running || id!==loopId) return;
    if(videoEl && videoEl.readyState>=2){
      try{ await handsModel.send({image:videoEl}); }catch(e){ console.warn('hands.send', e); }
      if(!running || id!==loopId) return;
      // tolerância: se perdeu a mão há pouco, mantém a última posição; depois disso entrega null
      if(lastHand && performance.now()-lastSeenT > GRACE_MS){
        const l = lastHand; lastHand = null; sx=sy=null;
        if(!l.open) emit('handOpen', {x:l.x,y:l.y});   // solta a bola se perdeu a mão de verdade
        isOpenState = true; flipCount = 0;
      }
      if(onFrameCb) onFrameCb({hand:lastHand});
    }
    requestAnimationFrame(()=>loop(id));
  }

  const d2 = (a,b)=>Math.hypot(a.x-b.x, a.y-b.y);

  function onHandResults(results){
    if(!results.multiHandLandmarks || !results.multiHandLandmarks.length) return;   // a tolerância é tratada no loop
    const lm = results.multiHandLandmarks[0];
    const now = performance.now();
    lastSeenT = now;

    // centro da palma
    let px=0, py=0; [0,5,9,13,17].forEach(i=>{ px+=lm[i].x; py+=lm[i].y; }); px/=5; py/=5;

    // dedo estendido = ponta mais longe do pulso que a articulação do meio (funciona com a mão inclinada)
    const wrist = lm[0];
    let ext = 0;
    for(let f=1; f<5; f++){ if(d2(lm[TIPS[f]], wrist) > d2(lm[PIPS[f]], wrist)*1.12) ext++; }
    // histerese: abre com 3+ dedos, fecha com 1 ou menos; no meio mantém o estado
    let desejado = isOpenState;
    if(ext >= 3) desejado = true; else if(ext <= 1) desejado = false;
    const wasOpen = isOpenState;
    if(desejado !== isOpenState){
      flipCount++;
      if(flipCount >= 2){ isOpenState = desejado; flipCount = 0; }   // precisa de 2 quadros seguidos
    } else flipCount = 0;

    // pinça com histerese (começa a 0,6 e só solta a 0,82 do tamanho da mão)
    const hs = d2(lm[0], lm[9]) || 0.001;
    const pinch = {};
    [['index',8],['middle',12],['ring',16],['pinky',20]].forEach(([nome,idx])=>{
      const r = d2(lm[4], lm[idx]) / hs;
      if(r < 0.60) pinchState[nome] = true; else if(r > 0.82) pinchState[nome] = false;
      pinch[nome] = pinchState[nome];
    });

    let speed = 0;
    if(prevPalm){ const dt=(now-prevT)/1000 || 0.016; speed = Math.hypot(px-prevPalm.x, py-prevPalm.y)/dt; }
    prevPalm = {x:px,y:py}; prevT = now;

    // espelha x e ajusta ao recorte do palco; depois suaviza (tira o tremor, deixa "pegar" mais fácil)
    const m = mapper ? mapper(1-px, py) : {x:1-px, y:py};
    if(sx===null){ sx=m.x; sy=m.y; } else { sx += (m.x-sx)*0.55; sy += (m.y-sy)*0.55; }

    lastHand = {x:sx, y:sy, open:isOpenState, extendedCount:ext, pinch, speed};

    if(wasOpen && !isOpenState) emit('handClose', {x:sx,y:sy});
    if(!wasOpen && isOpenState) emit('handOpen', {x:sx,y:sy});
  }

  function getLastHand(){ return lastHand; }

  return { init, start, pause, stop, on, off, clearListeners, setMapper, getLastHand };
})();
