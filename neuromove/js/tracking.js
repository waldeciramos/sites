// tracking.js — MediaPipe Hands (21 pontos) + Face Mesh (íris/piscadas), gestos e eventos.

const Tracking = (function(){

  // Índices de landmark do MediaPipe FaceMesh (com refineLandmarks=true → inclui íris)
  // Grupo A = landmarks que ficam do lado ESQUERDO da imagem CRUA (não espelhada) da câmera.
  // Qual olho do paciente (esquerdo/direito) cada grupo representa é definido na calibração,
  // porque isso depende de como a pessoa está de frente pra câmera — evita erro de lateralidade.
  const EYE_GROUP_A = {contour:[33,160,158,133,153,144], iris:468};
  const EYE_GROUP_B = {contour:[362,385,387,263,373,380], iris:473};

  // Índices de landmark do MediaPipe Hands
  const FINGER_TIPS = [4,8,12,16,20];
  const FINGER_PIPS = [3,6,10,14,18]; // junta anterior à ponta (thumb usa IP=3)
  const WRIST = 0;

  let handsModel=null, faceModel=null;
  let videoEl=null;
  let running=false;
  let onFrameCb=null;

  let lastHand=null;   // {x,y,open:bool, landmarks, palmSpeed}
  let lastFace=null;   // {gazeX, gazeY, earA, earB}
  let prevPalm=null, prevT=0;

  // calibração de lateralidade dos olhos: true => grupo A é o olho ESQUERDO do paciente
  let groupAIsLeftEye = true;

  const listeners = {};
  function on(evt, fn){ (listeners[evt]=listeners[evt]||[]).push(fn); }
  function emit(evt, data){ (listeners[evt]||[]).forEach(fn=>fn(data)); }

  async function init(videoElement){
    videoEl = videoElement;
    handsModel = new Hands({locateFile:(f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`});
    handsModel.setOptions({maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.6, minTrackingConfidence:0.6});
    handsModel.onResults(onHandResults);

    faceModel = new FaceMesh({locateFile:(f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}`});
    faceModel.setOptions({maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.6, minTrackingConfidence:0.6});
    faceModel.onResults(onFaceResults);

    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user', width:{ideal:640}, height:{ideal:480}}, audio:false});
    videoEl.srcObject = stream;
    await new Promise(res=>{
      if(videoEl.readyState>=2) res(); else videoEl.onloadedmetadata=()=>res();
    });
    return stream;
  }

  function start(frameCb){
    onFrameCb = frameCb;
    running = true;
    loop();
  }
  function stop(){ running = false; }

  async function loop(){
    if(!running) return;
    if(videoEl && videoEl.readyState>=2){
      await handsModel.send({image:videoEl});
      await faceModel.send({image:videoEl});
      if(onFrameCb) onFrameCb({hand:lastHand, face:lastFace});
    }
    requestAnimationFrame(loop);
  }

  // ---------- Mão ----------
  function onHandResults(results){
    if(!results.multiHandLandmarks || !results.multiHandLandmarks.length){
      if(lastHand && lastHand.open===false) emit('handOpen', {}); // solta se perder rastreio segurando
      lastHand = null;
      return;
    }
    const lm = results.multiHandLandmarks[0];
    // centro da palma: média do punho + MCPs
    const palmIdx = [0,5,9,13,17];
    let px=0, py=0;
    palmIdx.forEach(i=>{ px+=lm[i].x; py+=lm[i].y; });
    px/=palmIdx.length; py/=palmIdx.length;

    // heurística de dedos estendidos: ponta mais "alta" (y menor) que a junta PIP
    let extended = 0;
    for(let f=1; f<5; f++){ // indicador, médio, anelar, mínimo (ignora polegar pela geometria variável)
      if(lm[FINGER_TIPS[f]].y < lm[FINGER_PIPS[f]].y - 0.02) extended++;
    }
    // polegar: usa distância x em relação à base da mão
    const thumbExtended = Math.abs(lm[4].x - lm[0].x) > Math.abs(lm[3].x - lm[0].x);
    if(thumbExtended) extended++;

    const isOpen = extended >= 3;
    const wasOpen = lastHand ? lastHand.open : true;

    const now = performance.now();
    let speed = 0;
    if(prevPalm){
      const dt = (now-prevT)/1000 || 0.016;
      speed = Math.hypot(px-prevPalm.x, py-prevPalm.y)/dt;
    }
    prevPalm = {x:px,y:py}; prevT = now;

    // espelha x para bater com o vídeo espelhado na tela
    const mx = 1-px;

    lastHand = {x:mx, y:py, open:isOpen, landmarks:lm, speed};

    if(wasOpen && !isOpen) emit('handClose', {x:mx,y:py});
    if(!wasOpen && isOpen) emit('handOpen', {x:mx,y:py});
  }

  // ---------- Rosto / olhos ----------
  const blinkState = { A:{closed:false, lastOpenAt:0, blinkTimes:[]}, B:{closed:false, lastOpenAt:0, blinkTimes:[]} };
  const EAR_THRESHOLD = 0.21;
  const DOUBLE_BLINK_WINDOW = 550; // ms

  function eyeAspectRatio(lm, idx){
    // idx.contour = [p1(canto externo?), p2(topo1), p3(topo2), p4(canto interno), p5(fundo2), p6(fundo1)]
    const [i1,i2,i3,i4,i5,i6] = idx.contour;
    const p1=lm[i1], p2=lm[i2], p3=lm[i3], p4=lm[i4], p5=lm[i5], p6=lm[i6];
    const d = (a,b)=>Math.hypot(a.x-b.x, a.y-b.y);
    const vert = d(p2,p6)+d(p3,p5);
    const horiz = 2*d(p1,p4);
    return horiz>0 ? vert/horiz : 0.3;
  }

  function gazeRatio(lm, idx){
    const [i1,,,i4] = idx.contour;
    const p1=lm[i1], p4=lm[i4], iris=lm[idx.iris];
    const minX = Math.min(p1.x,p4.x), maxX = Math.max(p1.x,p4.x);
    const w = maxX-minX || 0.001;
    return (iris.x - minX)/w; // 0=um lado, 1=outro lado
  }

  function onFaceResults(results){
    if(!results.multiFaceLandmarks || !results.multiFaceLandmarks.length){ lastFace=null; return; }
    const lm = results.multiFaceLandmarks[0];

    const earA = eyeAspectRatio(lm, EYE_GROUP_A);
    const earB = eyeAspectRatio(lm, EYE_GROUP_B);
    const gazeA = gazeRatio(lm, EYE_GROUP_A);
    const gazeB = gazeRatio(lm, EYE_GROUP_B);

    processBlink('A', earA);
    processBlink('B', earB);

    // direção horizontal média do olhar (0=esquerda,1=direita da imagem CRUA)
    const gazeAvg = (gazeA+gazeB)/2;
    let gazeDir = 'centro';
    if(gazeAvg < 0.38) gazeDir = 'lado_esq_img';
    else if(gazeAvg > 0.62) gazeDir = 'lado_dir_img';

    lastFace = {earA, earB, gazeAvg, gazeDir, landmarks:lm};
  }

  function processBlink(group, ear){
    const st = blinkState[group];
    const now = performance.now();
    const closed = ear < EAR_THRESHOLD;
    if(closed && !st.closed){
      st.closed = true;
    } else if(!closed && st.closed){
      st.closed = false;
      st.blinkTimes.push(now);
      st.blinkTimes = st.blinkTimes.filter(t=>now-t < DOUBLE_BLINK_WINDOW+50);
      emit('eyeSideBlink', {group, count:1});
      // decide depois de uma pequena espera se foi piscada simples ou dupla
      const myTimes = st.blinkTimes;
      setTimeout(()=>{
        if(myTimes.length>=2){
          emit('blinkDouble', {group: mapGroupToSide(group)});
        } else if(myTimes.length===1){
          emit('blinkSingle', {group: mapGroupToSide(group)});
        }
        st.blinkTimes = [];
      }, DOUBLE_BLINK_WINDOW);
    }
  }

  function mapGroupToSide(group){
    // 'esquerdo'/'direito' = olho do PACIENTE, conforme calibrado
    if(group==='A') return groupAIsLeftEye ? 'esquerdo' : 'direito';
    return groupAIsLeftEye ? 'direito' : 'esquerdo';
  }

  function setGroupAIsLeftEye(val){ groupAIsLeftEye = val; }
  function getGroupAIsLeftEye(){ return groupAIsLeftEye; }

  function getLastHand(){ return lastHand; }
  function getLastFace(){ return lastFace; }

  return { init, start, stop, on, getLastHand, getLastFace, setGroupAIsLeftEye, getGroupAIsLeftEye, EAR_THRESHOLD };
})();
