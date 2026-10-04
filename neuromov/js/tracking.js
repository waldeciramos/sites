// tracking.js — MediaPipe Hands (21 pontos), gestos de agarrar (mão fechada) e soltar (mão aberta).

const Tracking = (function(){

  const FINGER_TIPS = [4,8,12,16,20];
  const FINGER_PIPS = [3,6,10,14,18];

  let handsModel=null;
  let videoEl=null;
  let stream=null;
  let running=false;
  let loopId=0;          // evita dois loops rodando ao mesmo tempo (duplicava eventos)
  let onFrameCb=null;
  let lastHand=null;
  let prevPalm=null, prevT=0;
  let mapper=null;       // converte coordenadas do vídeo -> coordenadas do palco (object-fit:cover)

  const listeners = {};
  function on(evt, fn){ (listeners[evt]=listeners[evt]||[]).push(fn); }
  function off(evt, fn){ listeners[evt]=(listeners[evt]||[]).filter(f=>f!==fn); }
  function clearListeners(){ Object.keys(listeners).forEach(k=>{ listeners[k]=[]; }); }
  function emit(evt, data){ (listeners[evt]||[]).slice().forEach(fn=>{ try{ fn(data); }catch(e){ console.error(e); } }); }
  function setMapper(fn){ mapper = fn || null; }

  function releaseCamera(){
    if(stream){ try{ stream.getTracks().forEach(t=>t.stop()); }catch(e){} stream=null; }
    if(videoEl){ try{ videoEl.srcObject=null; }catch(e){} }
  }

  // aspect = largura/altura do palco; no celular em pé (aspect<1) pede vídeo em pé
  async function init(videoElement, aspect){
    releaseCamera();
    videoEl = videoElement;
    if(!handsModel){
      handsModel = new Hands({locateFile:(f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`});
      handsModel.setOptions({maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.6, minTrackingConfidence:0.6});
      handsModel.onResults(onHandResults);
    }
    const portrait = aspect && aspect < 1;
    stream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode:'user', width:{ideal: portrait?480:640}, height:{ideal: portrait?640:480}},
      audio:false
    });
    videoEl.srcObject = stream;
    await new Promise(res=>{
      if(videoEl.readyState>=2) return res();
      videoEl.onloadeddata = ()=>res();
      setTimeout(res, 4000);
    });
    try{ await videoEl.play(); }catch(e){}
    lastHand = null; prevPalm = null;
    return stream;
  }

  function start(frameCb){
    onFrameCb = frameCb;
    running = true;
    const id = ++loopId;
    loop(id);
  }
  function stop(){
    running = false; loopId++; onFrameCb = null;
    releaseCamera();       // libera a câmera (antes ficava ligada o tempo todo)
    lastHand = null; prevPalm = null;
  }

  async function loop(id){
    if(!running || id!==loopId) return;
    if(videoEl && videoEl.readyState>=2){
      try{ await handsModel.send({image:videoEl}); }catch(e){ console.warn('hands.send', e); }
      if(!running || id!==loopId) return;
      if(onFrameCb) onFrameCb({hand:lastHand});
    }
    requestAnimationFrame(()=>loop(id));
  }

  function onHandResults(results){
    if(!results.multiHandLandmarks || !results.multiHandLandmarks.length){
      if(lastHand && !lastHand.open) emit('handOpen', {x:lastHand.x,y:lastHand.y}); // solta se perder rastreio
      lastHand = null;
      return;
    }
    const lm = results.multiHandLandmarks[0];
    const palmIdx = [0,5,9,13,17];
    let px=0, py=0;
    palmIdx.forEach(i=>{ px+=lm[i].x; py+=lm[i].y; });
    px/=palmIdx.length; py/=palmIdx.length;

    const FINGER_NAMES = ['thumb','index','middle','ring','pinky'];
    const fingers = {};
    let extended = 0;
    for(let f=1; f<5; f++){
      const isExt = lm[FINGER_TIPS[f]].y < lm[FINGER_PIPS[f]].y - 0.02;
      fingers[FINGER_NAMES[f]] = isExt;
      if(isExt) extended++;
    }
    const thumbExtended = Math.abs(lm[4].x - lm[0].x) > Math.abs(lm[3].x - lm[0].x);
    fingers.thumb = thumbExtended;
    if(thumbExtended) extended++;

    // distância polegar->cada dedo, normalizada pelo tamanho da mão, pra detectar "pinça" (toque do polegar em cada dedo)
    const p2 = (a,b)=>Math.hypot(a.x-b.x, a.y-b.y);
    const handSize = p2(lm[0], lm[9]) || 0.001;
    const pinch = {
      index:  p2(lm[4], lm[8])  < handSize*0.55,
      middle: p2(lm[4], lm[12]) < handSize*0.55,
      ring:   p2(lm[4], lm[16]) < handSize*0.55,
      pinky:  p2(lm[4], lm[20]) < handSize*0.55,
    };

    const isOpen = extended >= 3;
    const wasOpen = lastHand ? lastHand.open : true;

    const now = performance.now();
    let speed = 0;
    if(prevPalm){
      const dt = (now-prevT)/1000 || 0.016;
      speed = Math.hypot(px-prevPalm.x, py-prevPalm.y)/dt;
    }
    prevPalm = {x:px,y:py}; prevT = now;

    // espelha x para bater com o vídeo espelhado e ajusta ao recorte do palco
    const m = mapper ? mapper(1-px, py) : {x:1-px, y:py};
    const mx = m.x, my = m.y;

    lastHand = {x:mx, y:my, open:isOpen, extendedCount:extended, fingers, pinch, speed};

    if(wasOpen && !isOpen) emit('handClose', {x:mx,y:my});
    if(!wasOpen && isOpen) emit('handOpen', {x:mx,y:my});
  }

  function getLastHand(){ return lastHand; }

  return { init, start, stop, on, off, clearListeners, setMapper, getLastHand };
})();
