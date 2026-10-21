const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const R=['4','5','6','7','Q','J','K','A','2','3'],S=['♣','♥','♠','♦'];
const AVC=[
{n:'Careca barbudo',bg:'#8fd3ff',sh:'#2e7d32',sk:'#f1c19b',h:'bald',hc:'#777',b:'full',g:1},
{n:'Jovem de boné',bg:'#ffd166',sh:'#e53935',sk:'#e0a97c',h:'cap',hc:'#222',hat:'#1565c0'},
{n:'Criança',bg:'#c3f0ca',sh:'#ff8f00',sk:'#f5cba7',h:'short',hc:'#7b4a1e',kid:1},
{n:'Vovó',bg:'#f8bbd0',sh:'#6a1b9a',sk:'#f1c19b',h:'bun',hc:'#ddd',g:1},
{n:'Black power',bg:'#b39ddb',sh:'#00897b',sk:'#8d5a3b',h:'afro',hc:'#1b1b1b'},
{n:'Moicano',bg:'#ffab91',sh:'#3949ab',sk:'#c68642',h:'mohawk',hc:'#d81b60',b:'stache'},
{n:'Mineiro de chapéu',bg:'#a5d6a7',sh:'#795548',sk:'#d9a066',h:'hat',hc:'#6d4c41',b:'stache'},
{n:'Ruivo de óculos',bg:'#90caf9',sh:'#546e7a',sk:'#f5cba7',h:'short',hc:'#d84315',g:1},
{n:'Garota de tranças',bg:'#fff59d',sh:'#d81b60',sk:'#a9714b',h:'pig',hc:'#212121',kid:1},
{n:'Vovô bigodudo',bg:'#ce93d8',sh:'#37474f',sk:'#f1c19b',h:'bald',hc:'#ccc',b:'stache',g:1},
{n:'Palhaço',bg:'#80deea',sh:'#fdd835',sk:'#fff3e0',h:'afro',hc:'#e53935',x:'clown'},
{n:'Loira',bg:'#ffcc80',sh:'#26a69a',sk:'#f5cba7',h:'long',hc:'#f9d71c'},
{n:'Barbudo ruivo',bg:'#bcaaa4',sh:'#c62828',sk:'#e8b48a',h:'short',hc:'#bf360c',b:'full'},
{n:'Morena de coque',bg:'#b2dfdb',sh:'#ad1457',sk:'#b5784a',h:'bun',hc:'#1b1b1b'},
{n:'Roqueiro',bg:'#9fa8da',sh:'#212121',sk:'#e0a97c',h:'long',hc:'#3e2723',b:'goat'},
{n:'Super-herói',bg:'#ffe082',sh:'#1565c0',sk:'#e0a97c',h:'short',hc:'#222',x:'mask'},
{n:'Pirata',bg:'#81d4fa',sh:'#5d4037',sk:'#d9a066',h:'bald',hc:'#222',b:'full',x:'patch'},
{n:'Robô',bg:'#cfd8dc',sh:'#607d8b',sk:'#b0bec5',h:'none',hc:'#000',x:'robot'},
{n:'Alienígena',bg:'#212b5a',sh:'#7e57c2',sk:'#9ccc65',h:'none',hc:'#000',x:'alien'}];
function avatar(i){
 const c=AVC[+i%AVC.length],H=c.hc,r=c.kid?18:15;
 const back={afro:`<circle cx="32" cy="22" r="20" fill="${H}"/>`,long:`<rect x="12" y="14" width="40" height="38" rx="14" fill="${H}"/>`,pig:`<circle cx="12" cy="36" r="6" fill="${H}"/><circle cx="52" cy="36" r="6" fill="${H}"/>`,bun:`<circle cx="32" cy="8" r="7" fill="${H}"/>`}[c.h]||'';
 const top=`<path d="M16 28c0-14 8-17 16-17s16 3 16 17c-3-7-8-9-16-9s-13 2-16 9z" fill="${H}"/>`;
 const front={short:top,long:top,pig:top,bun:top,afro:`<path d="M17 24c2-8 8-9 15-9s13 1 15 9c-5-3-10-4-15-4s-10 1-15 4z" fill="${H}"/>`,mohawk:`<path d="M27 6h10l2 16H25z" fill="${H}"/>`,bald:`<circle cx="17" cy="27" r="4" fill="${H}"/><circle cx="47" cy="27" r="4" fill="${H}"/>`,cap:`<path d="M15 26c0-14 8-16 17-16s17 2 17 16z" fill="${c.hat}"/><rect x="14" y="24" width="30" height="4" rx="2" fill="${c.hat}"/>`,hat:`<ellipse cx="32" cy="17" rx="24" ry="4" fill="${H}"/><path d="M20 17c0-10 5-12 12-12s12 2 12 12z" fill="${H}"/>`}[c.h]||'';
 const head=c.x==='robot'?`<rect x="15" y="14" width="34" height="32" rx="5" fill="${c.sk}"/><path d="M32 14V7" stroke="#555" stroke-width="2"/><circle cx="32" cy="6" r="2.5" fill="#e53935"/>`:`<ellipse cx="32" cy="30" rx="${r}" ry="${r+3}" fill="${c.sk}"/><circle cx="${32-r}" cy="31" r="3.5" fill="${c.sk}"/><circle cx="${32+r}" cy="31" r="3.5" fill="${c.sk}"/>`;
 const bd={full:`<path d="M17 36c0 14 6 18 15 18s15-4 15-18c-3 6-7 8-15 8s-12-2-15-8z" fill="${H}"/>`,goat:`<path d="M27 42c0 8 3 10 5 10s5-2 5-10z" fill="${H}"/>`,stache:`<path d="M22 38q5-3 10 0q5-3 10 0q-5 4-10 2q-5 2-10-2z" fill="${H}"/>`}[c.b]||'';
 const eyes=c.x==='alien'?`<ellipse cx="24" cy="29" rx="5" ry="7" fill="#111"/><ellipse cx="40" cy="29" rx="5" ry="7" fill="#111"/>`:`<circle cx="25" cy="29" r="3" fill="#fff"/><circle cx="39" cy="29" r="3" fill="#fff"/><circle cx="25.5" cy="29.5" r="1.6" fill="#222"/><circle cx="39.5" cy="29.5" r="1.6" fill="#222"/>`;
 const ex=(c.x==='mask'?`<path d="M15 26h34v7H15z" fill="#111"/>`:'')+(c.x==='patch'?`<path d="M15 22c0-10 8-12 17-12s17 2 17 12z" fill="#d32f2f"/>`:'');
 const ex2=c.x==='patch'?`<circle cx="25" cy="29" r="4" fill="#111"/>`:'';
 const gl=c.g?`<g fill="none" stroke="#222" stroke-width="1.5"><circle cx="25" cy="29" r="5.5"/><circle cx="39" cy="29" r="5.5"/><path d="M30.5 29h3"/></g>`:'';
 const nose=c.x==='clown'?`<circle cx="32" cy="35" r="4" fill="#e53935"/>`:`<ellipse cx="32" cy="35" rx="2.2" ry="2.8" fill="#0003"/>`;
 const mouth=`<path d="M23 40q9 9 18 0z" fill="#7a1f1f"/><path d="M24.5 40h15q-7.5 3-15 0z" fill="#fff"/>`;
 return `<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><rect width="64" height="64" fill="${c.bg}"/><path d="M6 64c2-13 14-17 26-17s24 4 26 17z" fill="${c.sh}"/>${back}${head}${front}${ex}${bd}${mouth}${nose}${eyes}${ex2}${gl}</svg>`;
}
const NOMES=['Você','Dona Mercedes','Tio Chico','Sô Tião'];
const LAB=['Você','Adversário 1','Parceiro','Adversário 2'];
const pick=a=>a[Math.random()*a.length|0];
const VOZ={truco:['Truco, sô!','Pede truco, uai!'],mais:['Seis, sô!','Aumenta aí!'],corri:['Corri, uai!','Cê me pegou, sô!'],aceito:['Vem, sô!','Aceito, uai!'],medo:['Tá com medo?']};
const FT=[(a,t)=>`${a}, ${t}!`,a=>`${a}, marreco!`,(a,t)=>`Bora, ${t}! ${a}!`];
const FM=[t=>`Tá com medo, ${t}?`,()=>'Vai, corre, marreco!',()=>'Vai correr, medroso!',t=>`Arregou, ${t}!`];
let VZ=JSON.parse(localStorage.getItem('tw-voz3')||'{"v":"","r":0.92,"p":1}');
let G=null,rec=null;

/* ---------- tema, manual, histórico ---------- */
const setTema=t=>{document.documentElement.dataset.theme=t;localStorage.setItem('tw-tema',t)};
setTema(localStorage.getItem('tw-tema')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
$('#bTema').onclick=()=>setTema(document.documentElement.dataset.theme==='dark'?'light':'dark');
$('#bMan').onclick=()=>{$('#zaps').innerHTML=[[0,0,'Zap','4 de paus, a mais forte'],[3,1,'Sete de copas','a segunda'],[7,2,'Espadilha','Ás de espadas, a terceira'],[3,3,'Pica-fumo','7 de ouros, a quarta']].map(([r,s,n,d])=>`<div style="text-align:center;font-size:.75rem;max-width:90px">${cardH({r,s})}<br><b>${n}</b><br>${d}</div>`).join('');$('#dMan').showModal()};$('#xMan').onclick=()=>$('#dMan').close();
$('#tV').onclick=()=>{$('#mV').classList.remove('hide');$('#mN').classList.add('hide');$('#tV').className='';$('#tN').className='sec'};
$('#tN').onclick=()=>{$('#mN').classList.remove('hide');$('#mV').classList.add('hide');$('#tN').className='';$('#tV').className='sec'};
const lerH=()=>{try{return JSON.parse(localStorage.getItem('tw-hist')||'[]')}catch(e){return[]}};
const salvar=r=>{const h=lerH();h.unshift(r);localStorage.setItem('tw-hist',JSON.stringify(h.slice(0,200)))};
$('#bHist').onclick=()=>{const h=lerH();$('#hist').innerHTML=h.length?h.map(r=>`<p>${r.data}: ${r.times[0]} ${r.partidas[0]} x ${r.partidas[1]} ${r.times[1]} (${r.modo})</p>`).join(''):'<p>Nenhuma partida salva ainda. Termine uma partida para ela aparecer aqui.</p>';$('#dHist').showModal()};
$('#xHist').onclick=()=>$('#dHist').close();
$('#bClr').onclick=()=>{if(confirm('Apagar todo o histórico deste aparelho?')){localStorage.removeItem('tw-hist');$('#bHist').click()}};
$('#bExp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(lerH(),null,2)],{type:'application/json'}));a.download='truco-waldeci-historico.json';a.click()};

/* ---------- configuração ---------- */
$('#players').innerHTML=[0,1,2,3].map(i=>`<div class="row" id="pr${i}"><label for="nm${i}">${LAB[i]}</label><input id="nm${i}" value="${NOMES[i]}" maxlength="16"><button type="button" class="avb" id="av${i}" value="${[0,4,2,6][i]}" aria-label="Trocar avatar de ${LAB[i]}">${avatar([0,4,2,6][i])}</button></div>`).join('');
document.querySelectorAll('.avb').forEach(b=>b.onclick=()=>{b.value=(+b.value+1)%AVC.length;b.innerHTML=avatar(b.value)});
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
  const d=$('#seat'+s);let bb=null;
  if(d){bb=document.createElement('div');bb.className='bubble';bb.textContent=t;d.append(bb)}
  await Promise.all([falar(t),sleep(900)]);if(bb)bb.remove()}
async function embaralhar(){
  const dk=$('#deck');dk.innerHTML=Array.from({length:8},()=>'<div class="card back"></div>').join('');dk.classList.add('shuf');
  toast('Embaralhando...');await sleep(1700);dk.classList.remove('shuf');dk.innerHTML=G.vira?cardH(G.vira):'<div class="card back"></div>'}

/* ---------- apostas ---------- */
async function callTruco(seat){
  let ct=team(seat),cs=seat;
  if(G.noTruco||G.stake>=12||G.lastRaise===ct)return;
  while(true){
    const nx=G.stake+(G.stake===1?2:3),nome={3:'Truco',6:'Seis',9:'Nove',12:'Doze'}[nx];
    const rt0=1-ct,hs0=G.hum.find(x=>team(x)===rt0),alvo=G.names[hs0??1];await say(cs,pick(FT)(nome,alvo));
    const rt=1-ct,hs=G.hum.find(x=>team(x)===rt),rs=hs??1;let r;
    if(hs!==undefined)r=await ask(`${G.names[cs]} pediu ${nome}! O que você faz?`,['Aceitar','Correr'].concat(nx<12?['Pedir '+(nx+3)]:[]),hs);
    else{const a=avg(rt)+bonus(rt),x=a+Math.random()*.5;r=nx<12&&a>1.15&&Math.random()<.3?2:(x>.55+nx/30?0:1);
      await say(rs,pick([VOZ.aceito,VOZ.corri,VOZ.mais][r]))}
    if(r===1){await say(cs,pick(FM)(G.names[rs]));throw{end:[ct,G.stake,'o outro correu do '+nome]}}
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
  if(G.vz>0)hideBtn();runBtn();
  toast('Sua vez: toque numa carta');
  return new Promise(r=>G.pick=a=>{G.pick=null;G.wait=false;$('#actions').innerHTML='';r(a)})}
async function turno(s){
  G.cur=s;render();
  if(G.hum.includes(s)){while(true){const a=await esperaHumano(s);if(a.run){G.wait=false;throw{end:[1-team(s),G.stake,G.names[s]+' correu da mão']}}if(a.truco){G.wait=false;await callTruco(s);continue}jogar(s,a.card,!!a.hide&&G.vz>0);break}}
  else{toast('Vez de '+G.names[s]);await sleep(800);
    {const a=avg(team(s))+bonus(team(s));if(!G.noTruco&&G.lastRaise!==team(s)&&((a>1.1&&Math.random()<.45)||Math.random()<.05))await callTruco(s)}
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
  if(G.n===2&&w>=0)G.nextLead=w;
  if(w<0)toast('Mão empatada: ninguém marca.');
  else{G.pts[w]=Math.min(12,G.pts[w]+p);toast(`${tname(w)} marcou ${p} (${msg||'ganhou a mão'})`)}
  G.log=G.log||[];G.log.push({m:G.log.length+1,w,p,msg:msg||'ganhou a mão',a:G.pts[0],b:G.pts[1]});score();if(NARRA){const a=w<0?0:w,b=1-a;await say(-1,`${tname(a)} ${G.pts[a]}, ${tname(b)} ${G.pts[b]}`)}else await sleep(1200);
  if(G.pts[0]>=12||G.pts[1]>=12){
    const t=G.pts[0]>=12?0:1;G.games[t]++;const tudo=G.games[t]===2;
    salvar({data:new Date().toLocaleString('pt-BR'),modo:G.mode==='velha'?'manilha velha':'ponto acima',times:[tname(0),tname(1)],partidas:[...G.games]});
    await telaFim(t,tudo);G.log=[];
    G.pts=[0,0];if(tudo)G.games=[0,0];
  }
}
async function cortar(d){
  const n=G.n;if(G.pts[0]===11||G.pts[1]===11)return;
  let c=(G.dealer+1)%n;
  for(let t=0;t<(n===4?2:1);t++){
    let k=0;
    if(G.hum.includes(c)){
      const r=await ask(G.names[c]+', quer cortar o baralho?',['Cortar','Não cortar'].concat(t===0&&n===4?['Passar ao parceiro']:[]),c);
      if(r===2){c=(c+2)%n;continue}k=r===0?1:0}
    else{k=Math.random()<.5?1:0;if(t===0&&n===4&&Math.random()<.2){c=(c+2)%n;continue}}
    if(k)d.push(d.shift());
    return}
}
async function mao(){
  const n=G.n,d=baralho();G.hands=Array.from({length:n},()=>d.splice(0,3));
  G.vira=null;
  Object.assign(G,{stake:1,lastRaise:-1,ferro:false,noTruco:false,show11:null,table:[],wait:false});
  G.hands.forEach((_,i)=>G.hands[i]);const guarda=G.hands;G.hands=Array.from({length:n},()=>[]);render();
  await embaralhar();G.hands=guarda;render();await cortar(d);if(G.mode==='novo'){G.vira=d.pop();if(G.vira.r===G.lastR){d.unshift(G.vira);G.vira=d.pop()}G.lastR=G.vira.r;G.man=(G.vira.r+1)%10;render()}
  try{
    const a=G.pts[0]===11,b=G.pts[1]===11;
    if(a&&b){G.ferro=true;G.noTruco=true;render();toast('Mão de ferro: ninguém vê as cartas e ninguém truca.');await sleep(1800)}
    else if(a||b){const t=a?0:1;G.noTruco=true;G.show11=t;render();
      if(!await onze(t))throw{end:[1-t,1,'correu da mão de onze']};G.stake=3;render()}
    const r=G.res=[];let lead=(G.n===2&&G.nextLead!==undefined)?G.nextLead:(G.dealer+1)%n;
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

/* ---------- voz dos personagens e reinício ---------- */
function vozes(){const l=speechSynthesis.getVoices().filter(v=>/pt/i.test(v.lang));$('#vsel').innerHTML=l.length?l.map(v=>`<option ${v.name===VZ.v?'selected':''}>${v.name}</option>`).join(''):'<option value="">Voz padrão do aparelho</option>'}
if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=vozes;
const gv=()=>{VZ={v:$('#vsel').value,r:+$('#vr').value,p:+$('#vp').value};localStorage.setItem('tw-voz3',JSON.stringify(VZ))};
$('#bSom').onclick=()=>{if('speechSynthesis'in window)vozes();$('#vr').value=VZ.r;$('#vp').value=VZ.p;$('#dVoz').showModal()};
$('#vx').onclick=()=>$('#dVoz').close();
['vsel','vr','vp'].forEach(i=>$('#'+i).onchange=gv);
$('#vt').onclick=()=>{gv();say(0,'Uai, sô! Bora jogar um truquinho?')};
$('#bRe').onclick=()=>{if(confirm('Voltar ao início? A partida atual será perdida.'))location.reload()};

/* ---------- voz natural, narração, tela final, menu ---------- */
let NARRA=localStorage.getItem('tw-narra')!=='0';
function melhorVoz(){const l=speechSynthesis.getVoices().filter(v=>/pt[-_]BR/i.test(v.lang));return l.find(v=>v.name===VZ.v)||l.find(v=>/premium|aprimorada|enhanced|natural|neural|online|siri/i.test(v.name))||l.find(v=>/google|luciana|felipe|joana/i.test(v.name))||l[0]}
const bonus=t=>G.res?(G.res.filter(x=>x===t).length-G.res.filter(x=>x===1-t).length)*.35:0;
let AUD=new Set();fetch('audio/lista.json').then(r=>r.json()).then(l=>AUD=new Set(l)).catch(()=>{});
const pron=t=>t.replace(/marreco/gi,'marréco').replace(/medroso/gi,'medrôso').replace(/patinho/gi,'patínho').replace(/arregou/gi,'arrêgou').replace(/\buai\b/gi,'uái');
function falar(t){return new Promise(res=>{
  const slug=t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const lim=Math.min(7000,900+t.length*110);
  if(AUD.has(slug)){const au=new Audio('audio/'+slug+'.mp3');au.onended=au.onerror=()=>res();au.play().catch(()=>res());setTimeout(res,lim+2000);return}
  if(!('speechSynthesis'in window)){setTimeout(res,900);return}
  const u=new SpeechSynthesisUtterance(pron(t));u.lang='pt-BR';const v=melhorVoz();if(v)u.voice=v;u.rate=VZ.r;u.pitch=VZ.p;
  u.onend=u.onerror=()=>res();setTimeout(res,lim);
  speechSynthesis.resume();speechSynthesis.speak(u)})}
document.addEventListener('pointerdown',()=>{if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}},{once:true});
function telaFim(t,tudo){
  $('#fimT').textContent=(tudo?'Vitória na disputa! ':'Partida ganha! ')+tname(t);
  $('#fimP').textContent=`Partidas: ${G.games[0]} x ${G.games[1]}`;
  $('#fimL').innerHTML=(G.log||[]).map(r=>`<p>Mão ${r.m}: ${r.w<0?'empate':tname(r.w)+' +'+r.p} (${r.msg}) · ${r.a} x ${r.b}</p>`).join('');
  $('#dFim').showModal();
  return new Promise(r=>$('#fimOk').onclick=()=>{$('#dFim').close();r()})}
async function compartilhar(){
  const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,1350);g.addColorStop(0,'#3a2bd8');g.addColorStop(1,'#12104f');x.fillStyle=g;x.fillRect(0,0,1080,1350);
  x.textAlign='center';x.fillStyle='#fff';x.font='bold 80px system-ui,sans-serif';x.fillText('Truco Waldeci',540,120);
  x.font='44px system-ui,sans-serif';x.fillText($('#fimT').textContent,540,200);
  x.fillStyle='#ffcf4a';x.font='bold 230px ui-monospace,Menlo,monospace';x.fillText(String(G.pts[0]).padStart(2,'0')+' x '+String(G.pts[1]).padStart(2,'0'),540,470);
  x.fillStyle='#fff';x.font='52px system-ui,sans-serif';x.fillText(tname(0)+'  x  '+tname(1),540,560);
  x.font='40px system-ui,sans-serif';x.fillText($('#fimP').textContent,540,640);
  x.font='34px system-ui,sans-serif';(G.log||[]).slice(-9).forEach((r,i)=>x.fillText(`Mão ${r.m}: ${r.w<0?'empate':tname(r.w)+' +'+r.p} · ${r.a} x ${r.b}`,540,720+i*58));
  x.fillStyle='#b9b6f5';x.font='30px system-ui,sans-serif';x.fillText('Ideia original de Waldeci',540,1300);
  c.toBlob(async b=>{const f=new File([b],'truco-waldeci.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],text:'Resultado do Truco Waldeci'});return}catch(e){}}
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='truco-waldeci.png';a.click();alert('Imagem salva. Envie pelo WhatsApp.')},'image/png')}
$('#dFim').oncancel=e=>e.preventDefault();$('#fimSh').onclick=compartilhar;
$('#menuBtn').onclick=()=>$('#nav').classList.toggle('open');
$('#nav').addEventListener('click',()=>$('#nav').classList.remove('open'));
$('#vn').onchange=()=>{NARRA=$('#vn').checked;localStorage.setItem('tw-narra',NARRA?'1':'0')};
const _som=$('#bSom').onclick;$('#bSom').onclick=()=>{$('#vn').checked=NARRA;_som()};

document.querySelectorAll('.seg').forEach(g=>g.onclick=e=>{const b=e.target.closest('button');if(!b)return;g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));const s=$('#'+g.dataset.for);s.value=b.dataset.v;s.dispatchEvent(new Event('change'))});
