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
  const FONTS = ['Qurova', 'Agency', 'Rajdhani', 'Exo 2', 'Audiowide', 'Teko', 'Comfortaa', 'Quicksand', 'Fredoka', 'Righteous', 'Montserrat', 'Poppins', 'Rubik', 'Baloo 2', 'Oswald', 'Bebas Neue', 'Anton', 'Archivo Black', 'Russo One', 'Orbitron', 'Playfair Display', 'Pacifico', 'Lobster', 'Dancing Script', 'Permanent Marker', 'Bangers'];
  const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;700&family=Quicksand:wght@500;700&family=Fredoka:wght@400;600&family=Righteous&family=Montserrat:wght@400;500;600;700;800&family=Poppins:wght@400;600;700;800&family=Rubik:wght@500;800&family=Baloo+2:wght@600;800&family=Oswald:wght@400;600;700&family=Bebas+Neue&family=Anton&family=Archivo+Black&family=Russo+One&family=Orbitron:wght@500;800&family=Exo+2:wght@600;800&family=Audiowide&family=Teko:wght@500;700&family=Playfair+Display:wght@600;800&family=Pacifico&family=Lobster&family=Dancing+Script:wght@600;700&family=Permanent+Marker&family=Bangers&display=swap';

  /* ---------- Rádios: endereços oficiais de áudio (SRG SSR). Aceita também o link da página do player ---------- */
  const SWISS = {
    pop: 'https://stream.srg-ssr.ch/srgssr/rsp/mp3/128',
    jazz: 'https://stream.srg-ssr.ch/srgssr/rsj/mp3/128',
    classic: 'https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128'
  };
  function resolveStream(u) {
    u = String(u || '').trim();
    const m = /radioswiss(pop|jazz|classic)\.ch/i.exec(u);
    if (m && /webplayer|\.ch\/?$|\.ch\/(en|de|fr|it)\/?$/i.test(u)) return SWISS[m[1].toLowerCase()];
    return u;
  }

  /* ---------- Efeitos de texto ---------- */
  const EFFECTS = [['none', 'Nenhum'], ['sombra', 'Sombra'], ['neon', 'Neon'], ['neonpulse', 'Neon piscando'], ['contorno', 'Contorno vazado'], ['gradiente', 'Gradiente de cores'], ['brilho', 'Brilho passando'], ['3d', '3D'], ['retro', 'Retrô'], ['fogo', 'Fogo'], ['glitch', 'Glitch (TV)'], ['baixo', 'Baixo relevo (gravado)'], ['alto', 'Alto relevo']];
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

  /* zona = retângulo dentro da tela central (valores em % da tela), com imagem, vídeo, YouTube ou texto */
  const zdef = (z) => {
    z = Object.assign({ id: '', type: 'image', src: '', x: 0, y: 0, w: 50, h: 50, fit: 'cover', items: [], radius: 0, border: 0, borderColor: '#ffffff', shadow: false, sound: false, text: '', color: '#ffffff', size: 1, align: 'center', bg: '#0f766e', bgAlpha: 0, font: '' }, z || {});
    z.id = z.id || rid();
    z.items = (Array.isArray(z.items) ? z.items : []).map((it) => Object.assign({ type: 'image', src: '', seconds: 8, fit: 'cover', sound: false }, it));
    ['x', 'y', 'w', 'h'].forEach((k) => { z[k] = Math.round(Math.min(100, Math.max(0, +z[k] || 0)) * 10) / 10; });
    z.w = Math.max(4, Math.min(z.w, 100 - z.x)); z.h = Math.max(4, Math.min(z.h, 100 - z.y));
    return z;
  };
  function normSlide(s) {
    s = Object.assign({ id: '', type: 'text', active: true, seconds: 12, every: 0, split: false, splitBase: 'manter', start: '', end: '', fit: 'cover', pos: 'bottom', icon: '', bg1: '#0f766e', bg2: '#134e4a', src: '', tpl: 'cheia', trans: '', kb: '', bgfx: '', bgvid: '', vfit: 'contain', vpos: 'centro', vsize: 100, vimg: '', vimgfit: 'cover', vline: true, vlineColor: '#ffffff', vlineW: 4, ytSound: false, vSound: true, ytStart: 0, zones: [], zEnd: 'tempo' }, s || {});
    s.id = s.id || rid();
    s.t1 = tdef(s.t1 || { text: s.title || '' });
    s.t2 = tdef(s.t2 || { text: s.body || '', effect: 'none', anim: 'fade' });
    delete s.title; delete s.body;
    s.zones = (Array.isArray(s.zones) ? s.zones : []).map(zdef);
    return s;
  }

  const day = (end) => [{ time: '07:30', text: 'Abertura da clínica' }, { time: '08:00', text: 'Atendimentos da manhã' }, { time: '12:00', text: 'Pausa para o almoço' }, { time: '13:30', text: 'Atendimentos da tarde' }, { time: end, text: 'Encerramento' }];

  const DEFAULT_STATIONS = () => [
    { name: 'Radio Swiss Pop', url: SWISS.pop },
    { name: 'Radio Swiss Jazz', url: SWISS.jazz },
    { name: 'Radio Swiss Classic', url: SWISS.classic }
  ];
  const CLOCK_OLD = '#0f766e';
  const DEFAULT = {
    version: 8,
    general: {
      name: 'Clínica TV', subtitle: 'Fisio Clínica Estiva', logo: 'logo.svg',
      brandBg: '#ffffff', brandFg: '#0b1d2e',
      city: 'Estiva, MG', lat: -22.4553, lon: -46.0214,
      primary: '#1fb6a6', secondary: '#d4a93c',
      theme: 'claro', sidebarStyle: 'clara', autoFullscreen: true, transVideo: '', tempColor: '#1fa35c', orientation: 'auto', sidebar: 'normal', frame: 'cheia', zoom: 100, margin: 0, transition: 'fade',
      show: { brand: true, weather: true, schedule: true, verse: true, services: false, ticker: true },
      slideSeconds: 12, verseSeconds: 25, headlineSeconds: 9, tickerSpeed: 90, showSeconds: true,
      fontDisplay: 'Qurova', fontBody: 'Agency', fontCustomSrc: '',
      tickerFont: '', tickerSize: 100,
      svcMode: 'passando', svcSpeed: 60, svcFont: '', svcSize: 100,
      newsProxy: '',
      stageMode: 'slides', mosaic: { id: 'mosaico', bg1: '#0b3b4a', bg2: '#0b1d2e', zones: [] },
      sideLogo: 'midia/logo-clinica.png', sideLogoShow: true, sideLogoH: 100, sideLogoBg: '#ffffff', wmOpacity: 75, wmPos: 'br',
      clock: { font: 'Rajdhani', size: 115, effect: 'baixo', color: '#1565d8', glow: '#38bdf8', g1: '#0646b8', g2: '#1e9bff' }
    },
    radio: { enabled: true, autoplay: true, volume: 0.6, nowPlayingUrl: '', current: 0, viz: 'barras', stations: DEFAULT_STATIONS() },
    newsSources: [],
    slides: [
      { type: 'text', icon: '💙', seconds: 10, bgfx: 'aurora', bg1: '#0f766e', bg2: '#134e4a', t1: { text: 'Bem-vindo(a)!', effect: 'brilho', anim: 'zoom' }, t2: { text: 'Aqui o seu bem-estar é a nossa prioridade.', effect: 'sombra', anim: 'fade' } },
      { type: 'text', icon: '', seconds: 12, bgfx: 'ondas', trans: 'slide', bg1: '#1d4ed8', bg2: '#1e3a8a', t1: { text: 'Fisioterapia Ortopédica', effect: 'neon', glow: '#38bdf8', anim: 'up' }, t2: { text: 'Reabilitação de lesões, dores articulares e pós-cirúrgico.', effect: 'none', anim: 'fade' } },
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
      { cat: 'aviso', text: 'Chegue com 10 minutos de antecedência e avise a recepção em caso de falta.', active: true },
      { cat: 'saude', text: 'Caminhar 30 minutos por dia faz bem ao coração e às articulações.', active: true }
    ],
    services: [
      { icon: '', label: 'Fisioterapia ortopédica', active: true }, { icon: '🧘', label: 'Pilates', active: true }, { icon: '🏃', label: 'RPG', active: true },
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

  const MODES = ['manchetes', 'trecho', 'pagina'];
  function normSource(s) {
    s = s || {};
    return { id: s.id || rid(), url: String(s.url || '').trim(), label: s.label || '', cat: s.cat || 'transito', mode: MODES.includes(s.mode) ? s.mode : 'manchetes',
      max: Math.min(20, Math.max(1, +s.max || 5)), minutes: Math.max(5, +s.minutes || 15), filter: s.filter || '', exclude: s.exclude || '', selector: s.selector || '', js: !!s.js, active: s.active !== false };
  }

  function normalize(cfg, wasVersion) {
    cfg.slides = (cfg.slides || []).map(normSlide);
    if (!Array.isArray(cfg.categories) || !cfg.categories.length) cfg.categories = clone(DEFAULT.categories);
    cfg.ticker = (cfg.ticker || []).map((t) => ({ cat: t.cat || t.type || 'aviso', text: t.text || '', active: t.active !== false, detail: t.detail || '', seconds: +t.seconds || 0, start: t.start || '', end: t.end || '', anim: t.anim || 'up' }));
    cfg.services = (cfg.services || []).map((v) => ({ icon: v.icon || '', label: v.label || '', active: v.active !== false, type: v.type === 'image' || v.type === 'video' ? v.type : '', src: v.src || '', stage: v.stage !== false, seconds: (v.seconds === 0 || v.seconds === '0') ? 0 : (+v.seconds || 8) }));
    cfg.newsSources = (Array.isArray(cfg.newsSources) ? cfg.newsSources : []).map(normSource);
    const r = cfg.radio;
    r.stations = (Array.isArray(r.stations) ? r.stations : []).map((s) => ({ name: s.name || '', url: s.url || '' }));
    // configurações antigas (v2): entram as 3 rádios, relógio azul novo e sem o osso 🦴
    if (wasVersion < 3) {
      if (!r.stations.length) { r.stations = DEFAULT_STATIONS(); r.enabled = true; }
      const c = cfg.general.clock; if (c && (c.color === CLOCK_OLD || c.effect === 'brilho')) cfg.general.clock = clone(DEFAULT.general.clock);
      cfg.services.forEach((v) => { if (v.icon === '🦴') v.icon = ''; }); cfg.slides.forEach((s) => { if (s.icon === '🦴') s.icon = ''; });
      cfg.ticker = cfg.ticker.filter((t) => !/^Exemplo:/.test(t.text));
    }
    // v4: tela cheia sem borda e sem a faixa de serviços. v5: lateral clara com o layout em relevo das janelas do admin e relógio azul.
    // Só roda uma vez em configurações salvas antes; depois disso o que você escolher no admin é respeitado.
    if (wasVersion < 4) { const g = cfg.general; g.frame = 'cheia'; g.autoFullscreen = true; g.show = Object.assign({}, g.show, { services: false }); }
    if (wasVersion < 5) {
      const g = cfg.general, c = g.clock || {};
      g.sidebarStyle = 'clara';
      if (!c.color || c.color === '#0a58ca' || c.color === '#eaf6ff' || c.color === CLOCK_OLD) g.clock = clone(DEFAULT.general.clock);
    }
    // v6: relógio em baixo relevo e temperatura verde em alto relevo (só troca o relógio se ainda for o azul padrão anterior)
    if (wasVersion < 6) { const g = cfg.general, c = g.clock || {}; if (!c.color || c.color === '#0a58ca' || c.color === '#eaf6ff' || c.color === CLOCK_OLD) g.clock = clone(DEFAULT.general.clock); }
    // v7: a faixa de serviços ("barrinhas") foi removida da TV
    cfg.general.show.services = false;
    cfg.general.mosaic.zones = (Array.isArray(cfg.general.mosaic.zones) ? cfg.general.mosaic.zones : []).map(zdef);
    if (!['slides', 'zonas'].includes(cfg.general.stageMode)) cfg.general.stageMode = 'slides';
    // v8: as zonas passam a ser uma propaganda como as outras (entram no rodízio, com horário e tempo próprios).
    // O antigo "mosaico fixo" vira uma publicação do tipo Zonas e a tela volta ao modo de slides. Roda uma vez.
    if (wasVersion < 8) {
      const g = cfg.general, m = g.mosaic || {};
      if (m.zones && m.zones.length && (g.stageMode === 'zonas' || m.zones.some((z) => z.src || (z.items && z.items.length) || (z.type === 'text' && z.text)))) {
        cfg.slides.push(normSlide({ type: 'zonas', seconds: 30, bg1: m.bg1 || '#0b3b4a', bg2: m.bg2 || '#0b1d2e', zEnd: 'tempo', zones: clone(m.zones) }));
        g.mosaic.zones = [];
      }
      g.stageMode = 'slides';
      if (!g.sideLogo || g.sideLogo === 'midia/logo-clinica.jpg') g.sideLogo = 'midia/logo-clinica.png';   // PNG com fundo transparente (marca d'água)
      g.sideLogoShow = true; g.wmOpacity = g.wmOpacity || 75; g.wmPos = g.wmPos || 'br';
    }
    cfg.version = 8;
    r.current = Math.min(Math.max(0, +r.current || 0), Math.max(0, r.stations.length - 1));
    if (!['barras', 'espelho', 'onda', 'off'].includes(r.viz)) r.viz = 'barras';
    if (!['escura', 'clara'].includes(cfg.general.sidebarStyle)) cfg.general.sidebarStyle = 'escura';
    return cfg;
  }
  const build = (raw) => normalize(merge(DEFAULT, raw), (raw && +raw.version) || 2);

  // TV de verdade (index.html sem ?preview) começa sempre lendo o config.json publicado; o admin e o pré-visualizar usam o navegador
  const isTV = () => /(^|\/)(index\.html)?$/.test(location.pathname) && !/[?&]preview/.test(location.search);
  function getMode() { try { return localStorage.getItem(MODE_KEY) || (isTV() ? 'repo' : 'local'); } catch (e) { return isTV() ? 'repo' : 'local'; } }
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
  const TOKEN_KEY = 'infotv_token';
  const getToken = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } };
  const setToken = (t) => { try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch (e) {} };
  const authErr = (r) => (r.status === 401 ? new Error('sessão expirada: saia e entre de novo no painel') : new Error('HTTP ' + r.status));
  function saveServer(cfg) {
    const body = JSON.stringify(cfg);
    inflight = inflight.catch(() => {}).then(async () => { const r = await fetch('api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-token': getToken() }, body }); if (!r.ok) throw authErr(r); });
    return inflight;
  }
  async function login(user, pass) {
    const r = await fetch('api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: user, senha: pass }) });
    if (!r.ok) return false; const j = await r.json(); setToken(j.token || ''); return !!j.token;
  }
  async function hasSession() { if (!getToken()) return false; try { const r = await fetch('api/sessao', { headers: { 'x-token': getToken() }, cache: 'no-store' }); return r.ok; } catch (e) { return false; } }
  async function changeAccess(user, pass) {
    const r = await fetch('api/acesso', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-token': getToken() }, body: JSON.stringify({ usuario: user, senha: pass }) });
    if (!r.ok) throw authErr(r);
  }
  function save(cfg) { if (SRV === true) return saveServer(cfg); localStorage.setItem(KEY, JSON.stringify(cfg)); try { bc && bc.postMessage('changed'); } catch (e) {} }
  async function upload(file) {
    const r = await fetch('api/upload', { method: 'POST', headers: { 'x-token': getToken(), 'x-filename': encodeURIComponent(file.name), 'Content-Type': file.type || 'application/octet-stream' }, body: file });
    if (!r.ok) throw authErr(r);
    return (await r.json()).url;
  }
  function onChange(fn) {
    if (bc) bc.onmessage = fn;
    window.addEventListener('storage', (e) => { if (e.key === KEY || e.key === ORIENT_KEY) fn(); });
    // servidor Debian: avisos ao vivo (SSE). Se a conexão cair, o navegador reconecta sozinho.
    srvP.then((ok) => { if (!ok || !window.EventSource) return; try { const es = new EventSource('api/eventos'); es.addEventListener('mudou', () => fn()); } catch (e) {} });
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

  /* ---------- Acesso do admin: arquivo acesso.json { "usuario": "...", "senha": "..." } (ou "hash") ---------- */
  async function loadAccess() {
    try { const r = await fetch('acesso.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return null; const j = await r.json(); return j && (j.usuario || j.user) ? { user: String(j.usuario || j.user), pass: j.senha != null ? String(j.senha) : (j.pass != null ? String(j.pass) : ''), hash: j.hash || j.senha_hash || '' } : null; } catch (e) { return null; }
  }

  /* ---------- Notícias a partir de endereços (RSS ou página): manchetes, trechos ou resumo ---------- */
  const InfoNews = (function () {
    const clean = (s) => String(s == null ? '' : s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    const norm = (s) => clean(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const NOISE = /dd\/mm|\[[^\]]*\]|^slide \d|^sucesso|cookie|newsletter|pol[ií]tica de privacidade|termos de uso|todos os direitos|^menu$|^buscar|fale conosco|^saiba mais|^clique|^voltar|^ver mais|^leia mais|^acess(ar|e)\b|^compartilh|^pular para|^skip to|^login|^entrar$|^cadastr/i;
    const cut = (s, n) => { s = clean(s); if (s.length <= n) return s; const c = s.slice(0, n), i = Math.max(c.lastIndexOf('. '), c.lastIndexOf('; ')); return i > n * 0.5 ? c.slice(0, i + 1) : c.replace(/\s+\S*$/, '') + '…'; };
    const htmlText = (h) => { try { return clean(new DOMParser().parseFromString('<body>' + h + '</body>', 'text/html').body.textContent); } catch (e) { return clean(String(h).replace(/<[^>]+>/g, ' ')); } };
    const mdClean = (s) => clean(String(s).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`>]+/g, '').replace(/^[-+•]\s+/, ''));
    const okTitle = (t) => t.length >= 8 && t.length <= 200 && !NOISE.test(t);

    function fromFeed(doc) {
      return [...doc.querySelectorAll('item, entry')].map((it) => {
        const g = (q) => { const e = it.querySelector(q); return e ? clean(e.textContent) : ''; };
        return { title: g('title'), snippet: htmlText(g('description') || g('summary') || g('content') || g('content\\:encoded')) };
      }).filter((x) => x.title);
    }
    function nextSnippet(h) {
      let e = h.nextElementSibling, n = 0;
      while (e && n++ < 3) { const t = clean(e.textContent); if (t.length >= 20 && !/^h[1-6]$/i.test(e.tagName)) return t; if (/^h[1-6]$/i.test(e.tagName)) break; e = e.nextElementSibling; }
      return '';
    }
    function fromHtml(doc, src) {
      doc.querySelectorAll('script,style,noscript,svg,nav,footer,form,iframe').forEach((n) => n.remove());
      const out = [], seen = new Set(), add = (title, snippet) => { title = clean(title); if (!title || seen.has(norm(title))) return; seen.add(norm(title)); out.push({ title, snippet: clean(snippet) }); };
      if (src.selector) { try { doc.querySelectorAll(src.selector).forEach((n) => add(n.textContent, '')); } catch (e) {} return out; }
      doc.querySelectorAll('h1,h2,h3,h4,[class*="headline" i],[class*="manchete" i]').forEach((h) => { const t = clean(h.textContent); if (okTitle(t) || (t.length >= 3 && nextSnippet(h))) add(t, nextSnippet(h)); });
      if (out.length < 3) doc.querySelectorAll('a[href]').forEach((a) => { const t = clean(a.textContent); if (t.length >= 35 && t.length <= 180 && t.split(' ').length >= 5 && okTitle(t)) add(t, ''); });
      return out;
    }
    function pageSummary(doc) {
      const m = (q) => { const e = doc.querySelector(q); return e ? clean(e.getAttribute('content')) : ''; };
      return m('meta[name="description"]') || m('meta[property="og:description"]') || '';
    }
    function fromMarkdown(md) {
      const lines = String(md).split(/\r?\n/).map((l) => l.trim()), out = [], seen = new Set();
      const add = (title, snippet) => { title = mdClean(title); if (!title || seen.has(norm(title))) return; seen.add(norm(title)); out.push({ title, snippet: mdClean(snippet || '') }); };
      lines.forEach((l, i) => {
        const m = /^#{1,4}\s+(.+)/.exec(l); if (!m) return;
        let sn = ''; for (let k = i + 1; k < Math.min(lines.length, i + 6); k++) { const x = lines[k]; if (!x) continue; if (/^#/.test(x)) break; const t = mdClean(x); if (t.length >= 8 && !/^\[?!\[/.test(x)) { sn = t; break; } }
        add(m[1], sn);
      });
      if (out.length < 3) lines.forEach((l) => { const m = /^[-*+]?\s*\[([^\]]{35,180})\]\([^)]*\)\s*$/.exec(l); if (m) add(m[1], ''); });
      return out;
    }
    function build(raw, src, kind) {
      const head = raw.slice(0, 600);
      let list, summary = '';
      if (/<rss|<feed|<channel|<item[ >]/i.test(head)) { list = fromFeed(new DOMParser().parseFromString(raw, 'text/xml')); }
      else if (kind === 'md' && !/<html|<!doctype|<body/i.test(head)) {
        list = fromMarkdown(raw); const d = /^Description:\s*(.+)$/im.exec(raw); summary = d ? clean(d[1]) : ''; const t = /^Title:\s*(.+)$/im.exec(raw); if (!summary && t) summary = clean(t[1]);
      } else { const doc = new DOMParser().parseFromString(raw, 'text/html'); summary = pageSummary(doc); list = fromHtml(doc, src); }
      const filt = norm(src.filter).split(',').map((x) => x.trim()).filter(Boolean), excl = norm(src.exclude).split(',').map((x) => x.trim()).filter(Boolean);
      const keep = (x) => { const t = norm(src.mode === 'manchetes' ? x.title : x.title + ' ' + x.snippet); return (!filt.length || filt.some((f) => t.includes(f))) && !excl.some((f) => t.includes(f)); };
      list = list.filter((x) => !NOISE.test(x.title) && !(x.snippet && NOISE.test(x.snippet)) ).filter(keep);
      const mode = src.mode || 'manchetes', max = Math.min(20, Math.max(1, +src.max || 5)), host = (() => { try { return new URL(src.url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })();
      let items;
      if (mode === 'pagina') { const s = summary && keep({ title: summary, snippet: '' }) ? [{ text: cut(summary, 220), detail: src.label || host }] : []; items = s.length ? s : list.slice(0, 1).map((x) => ({ text: cut(x.snippet || x.title, 220), detail: src.label || host })); }
      else if (mode === 'trecho') items = list.map((x) => x.snippet ? { text: cut(x.snippet, 220), detail: cut(x.title, 90) } : { text: cut(x.title, 220), detail: src.label || host });
      else items = list.map((x) => ({ text: cut(x.title, 200), detail: src.label || host }));
      return items.slice(0, max);
    }
    async function grab(u, ms) {
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), ms || 15000);
      try { const r = await fetch(u, { signal: ac.signal, cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.text(); } finally { clearTimeout(to); }
    }
    // tenta: leitor próprio → direto → proxies públicos → leitor com JavaScript (r.jina.ai)
    async function fetchSource(src, proxy) {
      const url = String(src.url || '').trim(); if (!/^https?:\/\//i.test(url)) return { items: [], via: '', error: 'Endereço inválido (use http:// ou https://)' };
      const enc = encodeURIComponent(url), T = [];
      if (proxy) T.push(['seu proxy', proxy.includes('{url}') ? proxy.replace('{url}', enc) : proxy + enc, 'html']);
      const direto = ['direto', url, 'html'], ao = ['allorigins', 'https://api.allorigins.win/raw?url=' + enc, 'html'], cp = ['corsproxy', 'https://corsproxy.io/?url=' + enc, 'html'], jina = ['leitor com JavaScript', 'https://r.jina.ai/' + url, 'md'];
      // servidor da própria TV (modo Debian): busca a página por dentro, sem depender de sites públicos
      if (window.InfoTV && window.InfoTV.serverNow && window.InfoTV.serverNow()) {
        const sv = ['servidor', 'api/noticia?url=' + enc, 'html'], svj = ['servidor + leitor JavaScript', 'api/noticia?url=' + encodeURIComponent('https://r.jina.ai/' + url), 'md'];
        (src.js ? [svj, sv] : [sv, svj]).forEach((t) => T.push(t));
      }
      (src.js ? [jina, ao, cp, direto] : [direto, ao, cp, jina]).forEach((t) => T.push(t));
      let err = 'Nenhum texto encontrado nesta página';
      for (const [via, u, kind] of T) {
        try { const raw = await grab(u); const items = build(raw, src, kind); if (items.length) return { items, via, error: '' }; } catch (e) { err = 'Não foi possível abrir a página (' + (e && e.message ? e.message : e) + ')'; }
      }
      return { items: [], via: '', error: err };
    }
    return { fetchSource, build };
  })();

  // Converte links "de página" em links diretos do arquivo (GitHub blob, Dropbox, Google Drive), para vídeo/imagem abrirem na TV.
  function mediaURL(u) {
    u = String(u || '').trim(); let m;
    if ((m = u.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/blob\/(.+?)(?:\?.*)?$/i))) return 'https://raw.githubusercontent.com/' + m[1] + '/' + m[2] + '/' + m[3];
    if ((m = u.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/raw\/(.+?)(?:\?.*)?$/i))) return 'https://raw.githubusercontent.com/' + m[1] + '/' + m[2] + '/' + m[3];
    if (/^https?:\/\/(?:www\.)?dropbox\.com\//i.test(u)) return u.replace(/^https?:\/\/(?:www\.)?dropbox\.com/i, 'https://dl.dropboxusercontent.com').replace(/[?&]dl=0/, '');
    if ((m = u.match(/^https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/i))) return 'https://drive.google.com/uc?export=download&id=' + m[1];
    return u;
  }
  window.InfoTV = { mediaURL, DEFAULT, clone, merge, build, normSlide, normSource, tdef, rid, FONTS, FONTS_CSS, EFFECTS, ANIMS, load, loadLocal, loadRepo, save, onChange, upload, isServer: () => srvP, serverNow: () => SRV, getMode, setMode, getOrient, setOrient, sha256, resolveStream, loadAccess, login, hasSession, setToken, getToken, changeAccess, zdef };
  window.InfoNews = InfoNews;
  window.InfoFX = { style: fxStyle, text: fxText };
  try { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS_CSS; document.head.appendChild(l); } catch (e) {}
})();
