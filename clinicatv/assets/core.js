/* InfoTV — núcleo compartilhado (config padrão, leitura/gravação, efeitos de texto)
   Sistema idealizado por Waldeci Ramos */
(function () {
  'use strict';
  const KEY = 'infotv_config_v1';
  const MODE_KEY = 'infotv_mode';       // 'local' | 'repo'
  const ORIENT_KEY = 'infotv_orient';   // ajuste de orientação só deste aparelho

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const rid = () => Math.random().toString(36).slice(2, 8);

  /* ---------- Modo servidor (Debian): detecta a API; no GitHub Pages ela não existe ---------- */
  let SRV = null;
  const srvP = (async () => { try { const r = await fetch('api/ping', { cache: 'no-store' }); const j = await r.json(); SRV = !!(j && j.clinicatv); } catch (e) { SRV = false; } return SRV; })();

  /* ---------- Fontes (Google Fonts) ---------- */
  const FONTS = ['Qurova', 'Agency', 'Comfortaa', 'Quicksand', 'Fredoka', 'Righteous', 'Montserrat', 'Poppins', 'Rubik', 'Baloo 2', 'Oswald', 'Bebas Neue', 'Anton', 'Archivo Black', 'Russo One', 'Orbitron', 'Playfair Display', 'Pacifico', 'Lobster', 'Dancing Script', 'Permanent Marker', 'Bangers'];
  const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;700&family=Quicksand:wght@500;700&family=Fredoka:wght@400;600&family=Righteous&family=Montserrat:wght@400;500;600;700;800&family=Poppins:wght@400;600;700;800&family=Rubik:wght@500;800&family=Baloo+2:wght@600;800&family=Oswald:wght@400;600;700&family=Bebas+Neue&family=Anton&family=Archivo+Black&family=Russo+One&family=Orbitron:wght@500;800&family=Playfair+Display:wght@600;800&family=Pacifico&family=Lobster&family=Dancing+Script:wght@600;700&family=Permanent+Marker&family=Bangers&display=swap';

  /* ---------- Efeitos de texto ---------- */
  const EFFECTS = [['none', 'Nenhum'], ['sombra', 'Sombra'], ['neon', 'Neon'], ['neonpulse', 'Neon piscando'], ['contorno', 'Contorno vazado'], ['gradiente', 'Gradiente de cores'], ['brilho', 'Brilho passando'], ['3d', '3D'], ['retro', 'Retrô'], ['fogo', 'Fogo'], ['glitch', 'Glitch (TV)']];
  const ANIMS = [['none', 'Sem animação'], ['fade', 'Aparecer'], ['up', 'Subir'], ['zoom', 'Zoom'], ['blur', 'Desfocar'], ['letras', 'Letras uma a uma'], ['digitar', 'Máquina de escrever'], ['pulse', 'Pulsar (contínuo)'], ['float', 'Flutuar (contínuo)']];

  function fxStyle(el, st, baseRem) {
    st = st || {};
    el.className = 'fx fx-' + (st.effect || 'none') + ' an-' + (st.anim || 'none');
    el.style.setProperty('--c', st.color || '#ffffff');
    el.style.setProperty('--glow', st.glow || '#00e5ff');
    el.style.setProperty('--g1', st.g1 || '#ffffff');
    el.style.setProperty('--g2', st.g2 || '#ffd54f');
    el.style.fontFamily = st.font ? "'" + st.font + "', var(--fd), sans-serif" : '';
    if (baseRem) el.style.fontSize = (baseRem * (+st.size || 1)) + 'rem';
  }
  function fxText(el, text, st, baseRem) {
    fxStyle(el, st, baseRem);
    text = String(text == null ? '' : text);
    el.dataset.text = text;
    el.textContent = '';
    if (st && (st.anim === 'letras' || st.anim === 'digitar')) {
      const step = st.anim === 'digitar' ? 0.07 : 0.035;
      Array.from(text).forEach((ch, i) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; s.style.setProperty('--d', (i * step) + 's'); el.appendChild(s); });
    } else el.textContent = text;
  }

  /* ---------- Modelo de dados ---------- */
  const tdef = (o) => Object.assign({ text: '', font: '', size: 1, color: '#ffffff', effect: 'sombra', glow: '#00e5ff', g1: '#ffffff', g2: '#ffd54f', anim: 'up' }, o || {});

  function normSlide(s) {
    s = Object.assign({ id: '', type: 'text', active: true, seconds: 12, start: '', end: '', fit: 'cover', pos: 'bottom', icon: '', bg1: '#0f766e', bg2: '#134e4a', src: '', tpl: 'cheia', trans: '', kb: '', bgfx: '' }, s || {});
    s.id = s.id || rid();
    s.t1 = tdef(s.t1 || { text: s.title || '' });
    s.t2 = tdef(s.t2 || { text: s.body || '', effect: 'none', anim: 'fade' });
    delete s.title; delete s.body;
    return s;
  }

  const day = (end) => [{ time: '07:30', text: 'Abertura da clínica' }, { time: '08:00', text: 'Atendimentos da manhã' }, { time: '12:00', text: 'Pausa para o almoço' }, { time: '13:30', text: 'Atendimentos da tarde' }, { time: end, text: 'Encerramento' }];

  const DEFAULT = {
    version: 2,
    general: {
      name: 'Clínica TV', subtitle: 'Fisio Clínica Estiva', logo: 'logo.svg',
      brandBg: '#ffffff', brandFg: '#0b1d2e',
      city: 'Estiva, MG', lat: -22.4553, lon: -46.0214,
      primary: '#1fb6a6', secondary: '#d4a93c',
      theme: 'claro', orientation: 'auto', sidebar: 'normal', frame: 'moldura', zoom: 100, margin: 0, transition: 'fade',
      show: { brand: true, weather: true, schedule: true, verse: true, services: true, ticker: true },
      slideSeconds: 12, verseSeconds: 25, headlineSeconds: 9, tickerSpeed: 90, showSeconds: true,
      fontDisplay: 'Qurova', fontBody: 'Agency', fontCustomSrc: '', sourcesUrl: '',
      clock: { effect: 'brilho', color: '#0f766e', glow: '#1fb6a6', g1: '#0f766e', g2: '#1fb6a6' }
    },
    radio: { enabled: false, autoplay: true, volume: 0.6, nowPlayingUrl: '', stations: [] },
    sources: [],
    slides: [
      { type: 'text', icon: '💙', seconds: 10, bgfx: 'aurora', bg1: '#0f766e', bg2: '#134e4a', t1: { text: 'Bem-vindo(a)!', effect: 'brilho', anim: 'zoom' }, t2: { text: 'Aqui o seu bem-estar é a nossa prioridade.', effect: 'sombra', anim: 'fade' } },
      { type: 'text', icon: '🦴', seconds: 12, bgfx: 'ondas', trans: 'slide', bg1: '#1d4ed8', bg2: '#1e3a8a', t1: { text: 'Fisioterapia Ortopédica', effect: 'neon', glow: '#38bdf8', anim: 'up' }, t2: { text: 'Reabilitação de lesões, dores articulares e pós-cirúrgico.', effect: 'none', anim: 'fade' } },
      { type: 'text', icon: '🧘', seconds: 12, bgfx: 'brilhos', trans: 'zoom', bg1: '#7c3aed', bg2: '#4c1d95', t1: { text: 'Pilates e RPG', effect: 'gradiente', g1: '#ffffff', g2: '#fde68a', anim: 'letras' }, t2: { text: 'Postura, flexibilidade e força com acompanhamento profissional.', effect: 'none', anim: 'fade' } },
      { type: 'text', icon: '💧', seconds: 10, bgfx: 'bolhas', trans: 'wipe', bg1: '#0369a1', bg2: '#0c4a6e', t1: { text: 'Hidrate-se!', effect: '3d', glow: '#0c4a6e', anim: 'zoom' }, t2: { text: 'Beber água ao longo do dia ajuda músculos, articulações e a disposição.', effect: 'none', anim: 'fade' } }
    ].map(normSlide),
    schedule: { 0: [], 1: day('18:00'), 2: day('18:00'), 3: day('18:00'), 4: day('18:00'), 5: day('17:00'), 6: [{ time: '08:00', text: 'Atendimentos (plantão)' }, { time: '12:00', text: 'Encerramento' }] },
    verses: [
      { text: 'O Senhor é o meu pastor; nada me faltará.', ref: 'Salmos 23:1' },
      { text: 'Tudo posso naquele que me fortalece.', ref: 'Filipenses 4:13' },
      { text: 'Entrega o teu caminho ao Senhor; confia nele, e ele o fará.', ref: 'Salmos 37:5' },
      { text: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.', ref: 'Isaías 41:10' },
      { text: 'Amado, desejo que te vá bem em todas as coisas e que tenhas saúde, assim como bem vai a tua alma.', ref: '3 João 1:2' },
      { text: 'Ele sara os quebrantados de coração e lhes ata as feridas.', ref: 'Salmos 147:3' }
    ],
    categories: [
      { id: 'saude', label: 'Saúde e Bem-estar', icon: '💙', color: '#0f9d8f' },
      { id: 'transito', label: 'Trânsito', icon: '🚦', color: '#e08a00' },
      { id: 'aviso', label: 'Aviso da Clínica', icon: '📢', color: '#d93a3a' },
      { id: 'local', label: 'Em Estiva', icon: '📍', color: '#5b5bd6' }
    ],
    ticker: [
      { cat: 'saude', text: 'Beba pelo menos 2 litros de água por dia.', active: true },
      { cat: 'saude', text: 'Levante e alongue-se a cada hora se você trabalha sentado.', active: true },
      { cat: 'transito', text: 'Exemplo: informe aqui as condições do trânsito da região.', active: true },
      { cat: 'aviso', text: 'Chegue com 10 minutos de antecedência e avise a recepção em caso de falta.', active: true },
      { cat: 'local', text: 'Exemplo: adicione aqui avisos e novidades de locais da cidade.', active: true },
      { cat: 'saude', text: 'Caminhar 30 minutos por dia faz bem ao coração e às articulações.', active: true }
    ],
    services: [
      { icon: '🦴', label: 'Fisioterapia ortopédica', active: true }, { icon: '🧘', label: 'Pilates', active: true }, { icon: '🏃', label: 'RPG', active: true },
      { icon: '🧠', label: 'Neurofuncional', active: true }, { icon: '💆', label: 'Drenagem linfática', active: true }, { icon: '💧', label: 'Reabilitação pós-cirúrgica', active: true }
    ],
    admin: { user: 'admin', hash: '' }   // hash vazio = senha padrão "admin123"
  };

  function merge(def, cur) {
    const isO = (x) => x && typeof x === 'object' && !Array.isArray(x);
    if (!isO(def)) return cur === undefined ? clone(def) : cur;
    const out = clone(def);
    if (!isO(cur)) return out;
    Object.keys(cur).forEach((k) => { out[k] = isO(def[k]) && isO(cur[k]) ? merge(def[k], cur[k]) : cur[k]; });
    return out;
  }

  function normalize(cfg) {
    cfg.slides = (cfg.slides || []).map(normSlide);
    if (!Array.isArray(cfg.categories) || !cfg.categories.length) cfg.categories = clone(DEFAULT.categories);
    cfg.ticker = (cfg.ticker || []).map((t) => ({ cat: t.cat || t.type || 'aviso', text: t.text || '', active: t.active !== false, detail: t.detail || '', seconds: +t.seconds || 0, start: t.start || '', end: t.end || '', anim: t.anim || 'up' }));
    cfg.services = (cfg.services || []).map((v) => ({ icon: v.icon || '', label: v.label || '', active: v.active !== false }));
    if (!Array.isArray(cfg.radio.stations)) cfg.radio.stations = [];
    cfg.sources = (cfg.sources || []).map((v) => ({ id: v.id || rid(), name: v.name || '', url: v.url || '', kind: v.kind || 'auto', max: +v.max || 5, active: v.active !== false }));
    return cfg;
  }
  const build = (raw) => normalize(merge(DEFAULT, raw));

  function getMode() { try { return localStorage.getItem(MODE_KEY) || 'local'; } catch (e) { return 'local'; } }
  function setMode(m) { try { localStorage.setItem(MODE_KEY, m); } catch (e) {} }

  function loadLocal() { try { const raw = localStorage.getItem(KEY); return raw ? build(JSON.parse(raw)) : null; } catch (e) { return null; } }
  async function loadRepo() {
    try { const r = await fetch('config.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw 0; return build(await r.json()); } catch (e) { return null; }
  }
  async function load() {
    if (await srvP) { try { const r = await fetch('api/config', { cache: 'no-store' }); if (r.ok) return build(await r.json()); } catch (e) {} }
    if (getMode() === 'repo') return (await loadRepo()) || loadLocal() || build({});
    return loadLocal() || (await loadRepo()) || build({});
  }

  let bc = null; try { bc = new BroadcastChannel('infotv'); } catch (e) {}
  let inflight = Promise.resolve();
  function saveServer(cfg) {
    const body = JSON.stringify(cfg);
    inflight = inflight.catch(() => {}).then(async () => { const r = await fetch('api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body }); if (!r.ok) throw new Error('HTTP ' + r.status); });
    return inflight;
  }
  function save(cfg) { if (SRV === true) return saveServer(cfg); localStorage.setItem(KEY, JSON.stringify(cfg)); try { bc && bc.postMessage('changed'); } catch (e) {} }
  async function upload(file) {
    const f = new FormData(); f.append('arquivo', file, file.name);
    const r = await fetch('api/upload', { method: 'POST', body: f }); if (!r.ok) throw new Error('HTTP ' + r.status);
    return (await r.json()).url;
  }
  function onChange(fn) {
    if (bc) bc.onmessage = fn;
    window.addEventListener('storage', (e) => { if (e.key === KEY || e.key === ORIENT_KEY) fn(); });
    srvP.then((ok) => { if (!ok) return; const sc = document.createElement('script'); sc.src = 'socket.io/socket.io.js'; sc.onload = () => { try { io().on('mudou', fn); } catch (e) {} }; document.head.appendChild(sc); });
  }
  function getOrient() { try { return localStorage.getItem(ORIENT_KEY) || ''; } catch (e) { return ''; } }
  function setOrient(v) { try { v ? localStorage.setItem(ORIENT_KEY, v) : localStorage.removeItem(ORIENT_KEY); } catch (e) {} }

  async function sha256(s) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('infotv:' + s));
      return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
    }
    let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'x' + h;
  }

  window.InfoTV = { DEFAULT, clone, merge, build, normSlide, tdef, rid, FONTS, FONTS_CSS, EFFECTS, ANIMS, load, loadLocal, loadRepo, save, onChange, upload, isServer: () => srvP, getMode, setMode, getOrient, setOrient, sha256 };
  window.InfoFX = { style: fxStyle, text: fxText };
  try { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS_CSS; document.head.appendChild(l); } catch (e) {}
})();
