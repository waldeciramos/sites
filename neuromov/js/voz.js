// voz.js — fala mais natural e leve (usada pelo app e pelo Jogo das Cores).
// A voz "robótica" vem de duas coisas: (1) a voz padrão do aparelho e (2) frases longas lidas de uma vez só.
// Aqui: escolhemos automaticamente a melhor voz pt-BR instalada (Natural/Online/Google/Luciana...),
// falamos frase por frase com pequenas pausas e variação leve de tom, como uma pessoa falando.
(function(){
  "use strict";
  const KEY = 'nm_voz';
  const synth = window.speechSynthesis;
  let cache = null, gen = 0, timer = null;

  function lerEscolha(){ try{ return localStorage.getItem(KEY)||''; }catch(e){ return ''; } }
  function gravarEscolha(v){ try{ localStorage.setItem(KEY, v||''); }catch(e){} }

  function listaPt(){
    if(!synth) return [];
    let todas = []; try{ todas = synth.getVoices() || []; }catch(e){}
    return todas.filter(v=>/^pt([-_]|$)/i.test(v.lang||''));
  }
  function nota(v){
    const n = (v.name||'').toLowerCase();
    let s = 0;
    if(/^pt[-_]br/i.test(v.lang)) s += 30;
    if(/natural|neural/.test(n)) s += 120;          // Microsoft "Online (Natural)"
    if(/premium|enhanced|aprimorad/.test(n)) s += 90; // iOS/macOS vozes melhores
    if(/online/.test(n)) s += 60;
    if(/google/.test(n)) s += 50;
    if(/francisca|luciana|fernanda|vit[oó]ria|maria|camila|thalita|joana|helena|leticia/.test(n)) s += 40; // vozes femininas, mais suaves
    if(/compact|espeak|robot/.test(n)) s -= 80;
    if(v.localService === false) s += 10;
    return s;
  }
  function melhor(){
    const pt = listaPt();
    if(!pt.length) return null;
    const pref = lerEscolha();
    if(pref){ const f = pt.find(v=>v.name===pref); if(f) return f; }
    return pt.slice().sort((a,b)=>nota(b)-nota(a))[0];
  }

  // limpa emojis e símbolos que o leitor pronunciaria de forma estranha
  function limpar(t){
    return String(t||'')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu,'')
      .replace(/[✓✔✗✘★☆→←•·]/g,' ')
      .replace(/\s+/g,' ').trim();
  }
  // separa em frases curtas (também quebra frases longas em vírgulas)
  function partes(t){
    const out = [];
    (t.match(/[^.!?…]+[.!?…]*/g)||[t]).forEach(f=>{
      f = f.trim(); if(!f) return;
      if(f.length > 70){
        const pedacos = f.split(/(?<=,)\s+/);
        let acc = '';
        pedacos.forEach(p=>{ if((acc+' '+p).length > 70 && acc){ out.push(acc.trim()); acc = p; } else acc += ' '+p; });
        if(acc.trim()) out.push(acc.trim());
      } else out.push(f);
    });
    return out;
  }

  function parar(){
    gen++; clearTimeout(timer);
    try{ synth && synth.cancel(); }catch(e){}
  }

  // falar(texto, {ligado:true, onend:fn, ritmo:1})
  function falar(texto, op){
    op = op || {};
    if(!synth || op.ligado === false) { if(op.onend) setTimeout(op.onend,0); return; }
    const frases = partes(limpar(texto));
    if(!frases.length){ if(op.onend) setTimeout(op.onend,0); return; }
    parar();
    const id = gen;
    const voz = melhor();
    const base = (op.ritmo || 1) * 1.0;
    let i = 0;
    function proxima(){
      if(id !== gen) return;
      if(i >= frases.length){ if(op.onend) op.onend(); return; }
      const f = frases[i++];
      const u = new SpeechSynthesisUtterance(f);
      u.lang = 'pt-BR';
      if(voz) u.voice = voz;
      // leve variação em cada frase: evita a "monotonia de robô"
      const ultima = i === frases.length;
      u.rate  = Math.max(.8, Math.min(1.15, base * (0.97 + Math.random()*0.08)));
      u.pitch = ultima ? 1.0 + Math.random()*0.04 : 1.06 + Math.random()*0.06;
      u.volume = 1;
      let seguiu = false;
      const seguir = ()=>{ if(seguiu) return; seguiu = true; timer = setTimeout(proxima, /[!?]$/.test(f) ? 160 : 230); };
      u.onend = seguir; u.onerror = seguir;
      // segurança: alguns navegadores não disparam onend
      setTimeout(seguir, 1500 + f.length*130);
      try{ synth.speak(u); }catch(e){ seguir(); }
    }
    proxima();
  }

  function preencherSeletor(sel){
    if(!sel) return;
    const pt = listaPt();
    const atual = lerEscolha();
    sel.innerHTML = '<option value="">Automática (melhor disponível)</option>' +
      pt.map(v=>`<option value="${v.name.replace(/"/g,'&quot;')}"${v.name===atual?' selected':''}>${v.name}</option>`).join('');
    sel.onchange = ()=>{ gravarEscolha(sel.value); falar('Oi! Assim é a minha voz. Gostou?'); };
  }

  if(synth){
    synth.onvoiceschanged = ()=>{ cache = null; const s = document.getElementById('selVoz'); if(s) preencherSeletor(s); };
    try{ synth.getVoices(); }catch(e){}
  }

  window.NM_VOZ = { falar, parar, melhor, listaPt, preencherSeletor };
})();
