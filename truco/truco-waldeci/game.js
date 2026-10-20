const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const R=['4','5','6','7','Q','J','K','A','2','3'],S=['♣','♥','♠','♦'];
const AV=['🤠','🧙','🐵','🐸','🦊','🐼','🤖','👽','🐷','🧛','🐔','🦄'];
const NOMES=['Você','Dona Mercedes','Tio Chico','Sô Tião'];
const LAB=['Você','Adversário 1','Parceiro','Adversário 2'];
const FALAS=['Pede seis, sô!','Tá com medo, uai?','Bora ver!','Num tem jeito não!'];
let G=null,rec=null;

/* ---------- tema, manual, histórico ---------- */
const setTema=t=>{document.documentElement.dataset.theme=t;localStorage.setItem('tw-tema',t)};
setTema(localStorage.getItem('tw-tema')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
$('#bTema').onclick=()=>setTema(document.documentElement.dataset.theme==='dark'?'light':'dark');
$('#bMan').onclick=()=>$('#dMan').showModal();$('#xMan').onclick=()=>$('#dMan').close();
$('#tV').onclick=()=>{$('#mV').classList.remove('hide');$('#mN').classList.add('hide');$('#tV').className='';$('#tN').className='sec'};
$('#tN').onclick=()=>{$('#mN').classList.remove('hide');$('#mV').classList.add('hide');$('#tN').className='';$('#tV').className='sec'};
const lerH=()=>{try{return JSON.parse(localStorage.getItem('tw-hist')||'[]')}catch(e){return[]}};
const salvar=r=>{const h=lerH();h.unshift(r);localStorage.setItem('tw-hist',JSON.stringify(h.slice(0,200)))};
$('#bHist').onclick=()=>{const h=lerH();$('#hist').innerHTML=h.length?h.map(r=>`<p>${r.data}: ${r.times[0]} ${r.partidas[0]} x ${r.partidas[1]} ${r.times[1]} (${r.modo})</p>`).join(''):'<p>Nenhuma partida salva ainda. Termine uma partida para ela aparecer aqui.</p>';$('#dHist').showModal()};
$('#xHist').onclick=()=>$('#dHist').close();
$('#bClr').onclick=()=>{if(confirm('Apagar todo o histórico deste aparelho?')){localStorage.removeItem('tw-hist');$('#bHist').click()}};
$('#bExp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(lerH(),null,2)],{type:'application/json'}));a.download='truco-waldeci-historico.json';a.click()};

/* ---------- configuração ---------- */
$('#players').innerHTML=[0,1,2,3].map(i=>`<div class="row" id="pr${i}"><label for="nm${i}">${LAB[i]}</label><input id="nm${i}" value="${NOMES[i]}" maxlength="16"><select id="av${i}" aria-label="Avatar de ${LAB[i]}">${AV.map((a,j)=>`<option ${j===[0,4,2,6][i]?'selected':''}>${a}</option>`).join('')}</select></div>`).join('');
const verN=()=>{const n=+$('#n').value;[2,3].forEach(i=>$('#pr'+i).classList.toggle('hide',n===2));$('#pr1 label').textContent=n===2?'Adversário':'Adversário 1'};
$('#n').onchange=verN;verN();
$('#go').onclick=()=>{
  const n=+$('#n').value,ids=[0,1,2,3].slice(0,n);
  G={n,mode:$('#mode').value,names:ids.map(i=>$('#nm'+i).value.trim()||NOMES[i]),av:ids.map(i=>$('#av'+i).value),pts:[0,0],games:[0,0],dealer:n-1,hands:[],table:[],hum:[0]};
  $('#setup').classList.add('hide');$('#game').classList.remove('hide');run();
};

/* ---------- cartas e força ---------- */
const team=s=>s%2,tname=t=>G.n===4?G.names[t]+' e '+G.names[t+2]:G.names[t];
function baralho(){const d=[];for(let r=0;r<10;r++)for(let s=0;s<4;s++)d.push({r,s});
  for(let i=39;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[d[i],d[j]]=[d[j],d[i]]}return d}
function pw(c){
  if(G.mode==='velha'){if(c.r===0&&c.s===0)return 104;if(c.r===3&&c.s===1)return 103;if(c.r===7&&c.s===2)return 102;if(c.r===3&&c.s===3)return 101;return c.r}
  return c.r===G.man?100+(3-c.s):c.r}
const val=c=>pw(c)>=100?1.5:pw(c)>=8?1:pw(c)/9*.7;
const avg=t=>{const l=G.hands.filter((h,s)=>team(s)===t).flat();return l.length?l.reduce((a,c)=>a+val(c),0)/l.length:0};
const cardH=(c,cls='',i='')=>`<div class="card ${S[c.s]==='♥'||S[c.s]==='♦'?'r':''} ${cls}" data-i="${i}"><b>${R[c.r]}<br>${S[c.s]}</b><i>${S[c.s]}</i><b class="bt">${R[c.r]}<br>${S[c.s]}</b></div>`;

/* ---------- tela ---------- */
const toast=t=>$('#toast').textContent=t;
function score(){
  $('#score').innerHTML=[0,1].map(t=>`<div class="team"><span class="tn">${tname(t)}<small>${G.games[t]} partida(s) ganha(s)</small></span><div class="digi">${String(G.pts[t]).padStart(2,"0")}</div><div class="dots">${Array.from({length:12},(_,i)=>`<i class="${i<G.pts[t]?'on':''}"></i>`).join('')}</div></div>`).join('')+
  `<div class="team">${G.mode==='novo'&&G.vira?'Vira '+R[G.vira.r]+S[G.vira.s]+'<br>Manilha: '+R[G.man]:'Manilha velha'}<br>Mão vale ${G.stake||1}</div>`;
}
function render(){
  const T=$('#table');T.querySelectorAll('.seat').forEach(e=>e.remove());
  const pos=G.n===2?['s0','s1b']:['s0','s1','s2','s3'];
  for(let s=0;s<G.n;s++){
    const d=document.createElement('div');d.className='seat '+pos[s];d.id='seat'+s;
    let cs;
    if(s===0)cs=G.hands[0].map((c,i)=>G.ferro?`<div class="card back ${G.wait?'ok':''}" data-i="${i}"></div>`:cardH(c,G.wait?'ok':'',i)).join('');
    else if(s===2&&G.show11===0)cs=G.hands[s].map(c=>cardH(c)).join('');
    else cs=G.hands[s].map(()=>'<div class="card back"></div>').join('');
    d.innerHTML=`<div class="av">${G.av[s]}</div>${G.names[s]}<div class="hand ${s===0?'':'sm'}">${cs}</div>`;T.append(d);
  }
  $('#center').innerHTML=G.table.map(x=>`<div>${cardH(x.c)}<small>${G.names[x.s]}</small></div>`).join('');
  score();
}
$('#table').onclick=e=>{const c=e.target.closest('.card.ok');if(c&&G.pick){G.pick({card:+c.dataset.i,hide:HS});HS=false}};
function ask(msg,opts){toast(msg);const a=$('#actions');a.innerHTML=opts.map((o,i)=>`<button data-i="${i}">${o}</button>`).join('');
  return new Promise(r=>a.onclick=e=>{const b=e.target.closest('button');if(b){a.innerHTML='';a.onclick=null;r(+b.dataset.i)}})}
async function say(s,t){
  const d=$('#seat'+s);if(d){const b=document.createElement('div');b.className='bubble';b.textContent=t;d.append(b);setTimeout(()=>b.remove(),1300)}
  if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance(t);u.lang='pt-BR';speechSynthesis.speak(u)}await sleep(1300)}
async function embaralhar(){
  const dk=$('#deck');dk.innerHTML=Array.from({length:8},()=>'<div class="card back"></div>').join('');dk.classList.add('shuf');
  toast('Embaralhando...');await sleep(1700);dk.classList.remove('shuf');dk.innerHTML=G.vira?cardH(G.vira):'<div class="card back"></div>'}

/* ---------- apostas ---------- */
async function callTruco(seat){
  let ct=team(seat),cs=seat;
  if(G.noTruco||G.stake>=12||G.lastRaise===ct)return;
  while(true){
    const nx=G.stake+(G.stake===1?2:3),nome={3:'Truco',6:'Seis',9:'Nove',12:'Doze'}[nx];
    await say(cs,nome+'!');
    const rt=1-ct,hs=G.hum.find(x=>team(x)===rt),rs=hs??1;let r;
    if(hs!==undefined)r=await ask(`${G.names[cs]} pediu ${nome}! O que você faz?`,['Aceitar','Correr'].concat(nx<12?['Pedir '+(nx+3)]:[]),hs);
    else{const a=avg(rt),x=a+Math.random()*.5;r=nx<12&&a>1.15&&Math.random()<.3?2:(x>.55+nx/30?0:1);
      await say(rs,['Vem!','Corri!','Pede mais, sô!'][r])}
    if(r===1)throw{end:[ct,G.stake,'o outro correu do '+nome]};
    G.stake=nx;render();
    if(r===0){G.lastRaise=ct;return}
    ct=rt;cs=rs;
  }
}

/* ---------- jogo ---------- */
function botCard(s){
  const h=G.hands[s].map((c,i)=>({i,p:pw(c)})).sort((a,b)=>a.p-b.p);
  const best=G.table.reduce((b,x)=>!b||pv(x)>pv(b)?x:b,null);
  if(!best)return h[h.length>>1].i;
  if(team(best.s)===team(s))return h[0].i;
  const w=h.find(x=>x.p>pv(best));return(w||h[0]).i}
const pv=x=>x.h?-1:pw(x.c);
function jogar(s,i,h=false){G.table.push({s,c:G.hands[s].splice(i,1)[0],h});render()}
function esperaHumano(s=0){
  if(s)return esperaRemoto(s);
  G.wait=true;render();
  const ok=!G.noTruco&&G.stake<12&&G.lastRaise!==0;
  $('#actions').innerHTML=ok?`<button id="bT">${{1:'Truco!',3:'Seis!',6:'Nove!',9:'Doze!'}[G.stake]}</button>`:'';
  if(ok)$('#bT').onclick=()=>G.pick&&G.pick({truco:1});
  if(G.vz>0)hideBtn();
  toast('Sua vez: toque numa carta');
  return new Promise(r=>G.pick=a=>{G.pick=null;G.wait=false;$('#actions').innerHTML='';r(a)})}
async function turno(s){
  G.cur=s;render();
  if(G.hum.includes(s)){while(true){const a=await esperaHumano(s);if(a.truco){G.wait=false;await callTruco(s);continue}jogar(s,a.card,!!a.hide&&G.vz>0);break}}
  else{toast('Vez de '+G.names[s]);await sleep(800);
    if(!G.noTruco&&G.lastRaise!==team(s)&&avg(team(s))>1&&Math.random()<.3){await say(s,FALAS[Math.random()*4|0]);await callTruco(s)}
    const bi=botCard(s);jogar(s,bi,G.vz>0&&pw(G.hands[s][bi])<4&&Math.random()<.25)}
}
function decide(r){const[a,b,c]=r;
  if(r.length>=2){if(a>=0&&a===b)return a;if(a<0&&b>=0)return b;if(a>=0&&b<0)return a}
  if(r.length===3){if(c>=0)return c;return a>=0?a:-2}}
async function onze(t){
  const hs=G.hum.find(x=>team(x)===t);
  if(hs!==undefined)return(await ask('Mão de onze! '+(G.n===4?'Você vê as cartas do parceiro. ':'')+'Jogar ou correr?',['Jogar (vale 3)','Correr (adversário ganha 1)'],hs))===0;
  toast('O adversário está com 11 e vai decidir...');await sleep(1500);
  const j=avg(1)+Math.random()*.4>.8;await say(1,j?'Vou jogar!':'Eu corro!');return j}
async function fim(w,p,msg){
  if(w<0)toast('Mão empatada: ninguém marca.');
  else{G.pts[w]=Math.min(12,G.pts[w]+p);toast(`${tname(w)} marcou ${p} (${msg||'ganhou a mão'})`)}
  score();await sleep(1800);
  if(G.pts[0]>=12||G.pts[1]>=12){
    const t=G.pts[0]>=12?0:1;G.games[t]++;const tudo=G.games[t]===2;
    salvar({data:new Date().toLocaleString('pt-BR'),modo:G.mode==='velha'?'manilha velha':'ponto acima',times:[tname(0),tname(1)],partidas:[...G.games]});
    await ask(`${tname(t)} ganhou ${tudo?'a disputa':'a partida'}! (${G.games[0]} x ${G.games[1]})`,[tudo?'Nova disputa':'Próxima partida']);
    G.pts=[0,0];if(tudo)G.games=[0,0];
  }
}
async function mao(){
  const n=G.n,d=baralho();G.hands=Array.from({length:n},()=>d.splice(0,3));
  G.vira=null;if(G.mode==='novo'){G.vira=d.pop();G.man=(G.vira.r+1)%10}
  Object.assign(G,{stake:1,lastRaise:-1,ferro:false,noTruco:false,show11:null,table:[],wait:false});
  G.hands.forEach((_,i)=>G.hands[i]);const guarda=G.hands;G.hands=Array.from({length:n},()=>[]);render();
  await embaralhar();G.hands=guarda;render();
  try{
    const a=G.pts[0]===11,b=G.pts[1]===11;
    if(a&&b){G.ferro=true;G.noTruco=true;render();toast('Mão de ferro: ninguém vê as cartas e ninguém truca.');await sleep(1800)}
    else if(a||b){const t=a?0:1;G.noTruco=true;G.show11=t;render();
      if(!await onze(t))throw{end:[1-t,1,'correu da mão de onze']};G.stake=3;render()}
    const r=[];let lead=(G.dealer+1)%n;
    for(let v=0;v<3;v++){
      G.table=[];render();
      G.vz=v;for(let k=0;k<n;k++)await turno((lead+k)%n);G.cur=-1;
      await sleep(900);
      const top=Math.max(...G.table.map(pv)),w=G.table.filter(x=>pv(x)===top),tm=new Set(w.map(x=>team(x.s)));
      if(tm.size>1){r.push(-1);toast('Embuchou! Empatou a vaza.')}else{r.push([...tm][0]);lead=w[0].s;toast(G.names[lead]+' levou a vaza')}
      await sleep(800);
      const res=decide(r);if(res!==undefined)throw{end:[res,G.stake,'']};
    }
  }catch(e){if(!e.end)throw e;await fim(...e.end)}
}
async function run(){while(true){await mao();G.dealer=(G.dealer+1)%G.n}}

/* ---------- voz ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
$('#bVoz').onclick=()=>{
  if(!SR){alert('Este navegador não tem reconhecimento de voz. Use o Chrome ou o botão de truco.');return}
  if(rec){const r=rec;rec=null;r.stop();$('#bVoz').textContent='Voz off';return}
  rec=new SR();rec.lang='pt-BR';rec.continuous=true;
  rec.onresult=e=>{const t=e.results[e.results.length-1][0].transcript.toLowerCase();if(/truco|seis|nove|doze/.test(t)&&G&&G.pick&&G.wait)G.pick({truco:1})};
  rec.onend=()=>{if(rec)try{rec.start()}catch(e){}};rec.start();$('#bVoz').textContent='Voz on'};
