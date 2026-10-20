/* Online: o anfitrião (jogador 1) roda o jogo e envia a cada pessoa só a visão dela. */
let HS=false,peer,conn,isH=false,conns={},P={},W={},J={};
function hideBtn(){HS=false;const b=document.createElement('button');b.className='sec';b.id='bH';b.textContent='Esconder carta: não';b.onclick=()=>{HS=!HS;b.textContent='Esconder carta: '+(HS?'sim':'não')};$('#actions').append(b)}
function runBtn(){const b=document.createElement('button');b.className='sec';b.textContent='Correr';b.onclick=()=>{if(confirm('Correr desta mão? O adversário ganha '+(G.stake||1)+' tento(s).'))G.pick&&G.pick({run:1})};$('#actions').append(b)}
const bc=m=>Object.values(conns).forEach(c=>c.open&&c.send(m));
const act=a=>{conn.send({t:'a',a});$('#actions').innerHTML=''};
const view=me=>({n:G.n,me,names:G.names,av:G.av,pts:G.pts,games:G.games,mode:G.mode,vira:G.vira,man:G.man,stake:G.stake,ferro:G.ferro,table:G.table,
  cnt:G.hands.map(h=>h.length),hand:G.hands[me]||[],pa:G.n===4&&G.show11===team(me)?G.hands[(me+2)%4]:null,wait:me===0?G.wait:W[me]||0,cur:G.cur,dealer:G.dealer,vz:G.vz});

/* anfitrião: envia visões, falas e mensagens */
const _render=render,_say=say,_ask=ask;
render=()=>{draw(view(0));if(isH)Object.keys(conns).forEach(s=>conns[s].open&&conns[s].send({t:'view',v:view(+s)}))};
say=(s,t)=>{if(isH)bc({t:'say',s,x:t});return _say(s,t)};
ask=(m,o,s=0)=>{if(!isH||s===0)return _ask(m,o);conns[s].send({t:'ask',m,o});return new Promise(r=>P[s]=r)};
new MutationObserver(()=>{const x=$('#toast').textContent;if(isH&&!/^Sua vez|O que você|Jogar ou/.test(x))bc({t:'toast',x})}).observe($('#toast'),{childList:true,characterData:true,subtree:true});
function esperaRemoto(s){
  W[s]=1;render();const ok=!G.noTruco&&G.stake<12&&G.lastRaise!==team(s);
  conns[s].send({t:'turn',ok,vz:G.vz,l:{1:'Truco!',3:'Seis!',6:'Nove!',9:'Doze!'}[G.stake]});
  return new Promise(r=>P[s]=a=>{W[s]=0;r(a)})}

/* desenho da mesa para jogadores remotos (você sempre embaixo) */
function draw(v){
  const T=$('#table');T.querySelectorAll('.seat').forEach(e=>e.remove());const n=v.n,me=v.me;
  for(let s=0;s<n;s++){
    const k=(s-me+n)%n,d=document.createElement('div');d.className='seat '+(n===2?['s0','s1b']:['s0','s1','s2','s3'])[k];d.id='seat'+s;
    let cs;
    if(s===me)cs=v.hand.map((c,i)=>v.ferro?`<div class="card back ${v.wait?'ok':''}" data-i="${i}"></div>`:cardH(c,v.wait?'ok':'',i)).join('');
    else if(v.pa&&k===2)cs=v.pa.map(c=>cardH(c)).join('');
    else cs=Array(v.cnt[s]).fill('<div class="card back"></div>').join('');
    if(v.cur===s)d.classList.add('turn');if(v.table.some(x=>x.s===s))d.classList.add('done');const tg=s===v.dealer?'<em class="tg">PÉ</em>':n===4&&s===(v.dealer+n-1)%n?'<em class="tg c">CONTRAPÉ</em>':'';d.innerHTML=`<div class="av">${avatar(v.av[s])}</div>${v.names[s]}${tg}<div class="hand ${s===me?'':'sm'}">${cs}</div>`;T.append(d)}
  $('#center').innerHTML=v.table.map(x=>`<div>${x.h?'':cardH(x.c)}<small>${v.names[x.s]}${x.h?'<br>escondeu a carta':''}</small></div>`).join('');
  $('#deck').innerHTML=v.vira?cardH(v.vira):'';score()}

/* jogador remoto: recebe mensagens do anfitrião */
function onMsg(m){
  if(m.t==='lobby')$('#lobTxt').innerHTML='Conectado! Você é o jogador '+(m.seat+1)+'. Aguarde o anfitrião começar.';
  if(m.t==='full')alert('Essa vaga já está ocupada.');
  if(m.t==='view'){$('#lobby').classList.add('hide');$('#game').classList.remove('hide');G=m.v;G.pick=G.wait?act:null;draw(G)}
  if(m.t==='toast')toast(m.x);
  if(m.t==='say')say(m.s,m.x);
  if(m.t==='turn'){if(m.ok){$('#actions').innerHTML=`<button id="bT">${m.l}</button>`;$('#bT').onclick=()=>act({truco:1})}if(m.vz>0)hideBtn();runBtn();toast('Sua vez: toque numa carta')}
  if(m.t==='ask')ask(m.m,m.o).then(i=>conn.send({t:'a',a:i}));
}
$('#join').onclick=()=>{
  const c=($('#code').value||'').trim().toUpperCase();if(c.length!==5)return alert('O código tem 5 caracteres.');
  peer=new Peer();
  peer.on('open',()=>{conn=peer.connect('tw-'+c.slice(0,4),{reliable:true});
    conn.on('open',()=>conn.send({t:'join',team:c[4],name:$('#nm0').value||'Jogador',av:$('#av0').value}));
    conn.on('data',onMsg);conn.on('close',()=>toast('Conexão perdida com o anfitrião.'))});
  peer.on('error',()=>alert('Não foi possível conectar. Confira o código e a internet.'));
  $('#setup').classList.add('hide');$('#lobby').classList.remove('hide');$('#startOn').classList.add('hide');$('#lobTxt').textContent='Conectando...'};

/* anfitrião: cria a sala */
function lista(n){return [0,1,2,3].slice(0,n).map(i=>`${J[i]?'<span class="avs">'+avatar(J[i].av)+'</span> '+J[i].name:'(vaga livre: um bot joga)'}`).join('<br>')}
$('#goOn').onclick=()=>{
  isH=true;const n=+$('#n').value,al='ABCDEFGHJKMNPQRSTUVWXYZ23456789',room=Array.from({length:4},()=>al[Math.random()*31|0]).join('');
  J[0]={name:$('#nm0').value||'Você',av:$('#av0').value};
  peer=new Peer('tw-'+room);
  peer.on('error',e=>alert('Erro de conexão ('+e.type+'). Recarregue a página e tente de novo.'));
  peer.on('open',()=>{
    $('#setup').classList.add('hide');$('#lobby').classList.remove('hide');
    const up=()=>$('#lobTxt').innerHTML=(n===4?`<p>Código do seu <b>parceiro</b>: <b>${room}P</b></p><p>Código dos <b>adversários</b> (2 pessoas): <b>${room}X</b></p>`:`<p>Código do adversário: <b>${room}X</b></p>`)+'<p>'+lista(n)+'</p>';
    up();
    peer.on('connection',c=>{
      c.on('data',m=>{
        if(m.t==='join'){
          const ord=n===4?(m.team==='P'?[2]:[1,3]):[1],seat=ord.find(x=>!conns[x]);
          if(seat===undefined)return c.send({t:'full'});
          conns[seat]=c;c.seat=seat;J[seat]={name:m.name,av:m.av};c.send({t:'lobby',seat});up()}
        else if(m.t==='a'&&P[c.seat])P[c.seat](m.a)});
      c.on('close',()=>{const s=c.seat;delete conns[s];if(G){G.hum=G.hum.filter(x=>x!==s);W[s]=0;P[s]&&P[s]({card:0})}})});
    $('#startOn').onclick=()=>{
      const ids=[0,1,2,3].slice(0,n);
      G={n,mode:$('#mode').value,names:ids.map(i=>J[i]?J[i].name:NOMES[i]),av:ids.map(i=>J[i]?J[i].av:[0,4,2,6][i]),pts:[0,0],games:[0,0],dealer:n-1,hands:[],table:[],hum:[0,...Object.keys(conns).map(Number)]};
      $('#lobby').classList.add('hide');$('#game').classList.remove('hide');run()}})};
