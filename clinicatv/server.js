#!/usr/bin/env node
/* Clínica TV — servidor interno (Debian ou qualquer sistema com Node 18+)
   Sem dependências: usa só o que já vem no Node.
   - Serve o site (index.html, admin.html, midia/ …) com suporte a vídeo por trechos (Range)
   - Guarda a configuração em dados/config.json (as TVs atualizam ao vivo)
   - Recebe imagens/vídeos enviados pelo painel (midia/)
   Sistema idealizado por Waldeci Ramos */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = +process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'dados'));
const MIDIA = path.resolve(process.env.MIDIA_DIR || path.join(ROOT, 'midia'));
const CONFIG = path.join(DATA, 'config.json');
const ACESSO = path.join(DATA, 'acesso.json');
const MAX_UPLOAD = (+process.env.MAX_UPLOAD_MB || 1024) * 1024 * 1024;
const SESSION_MS = 12 * 3600 * 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};
const UPLOAD_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.m4v', '.webm', '.mov', '.woff', '.woff2', '.ttf', '.otf']);
// nunca servidos pelo site (código do servidor, senhas, instalador)
const BLOCKED = [/^\/server\.js$/i, /^\/acesso\.json$/i, /^\/dados(\/|$)/i, /^\/instalar-debian\.sh$/i, /^\/clinicatv\.service$/i, /^\/node_modules(\/|$)/i, /^\/\./, /\/\.\./];

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(MIDIA, { recursive: true });
if (!fs.existsSync(CONFIG) && fs.existsSync(path.join(ROOT, 'config.json'))) fs.copyFileSync(path.join(ROOT, 'config.json'), CONFIG);

/* ---------------- acesso (senha do painel) ---------------- */
const hashPass = (pass, salt) => crypto.scryptSync(String(pass), salt, 32).toString('hex');
function readAcesso() {
  for (const f of [ACESSO, path.join(ROOT, 'acesso.json')]) {
    try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j && (j.usuario || j.user)) return j; } catch (e) { /* tenta o próximo */ }
  }
  return { usuario: 'admin', senha: 'admin123' };
}
function checkLogin(user, pass) {
  const a = readAcesso(), u = String(a.usuario || a.user || '');
  const same = (x, y) => { const bx = Buffer.from(String(x)), by = Buffer.from(String(y)); return bx.length === by.length && crypto.timingSafeEqual(bx, by); };
  if (!same(user, u)) return false;
  if (a.hash && a.salt) return same(hashPass(pass, a.salt), a.hash);
  return a.senha != null && String(a.senha) !== '' && same(pass, a.senha);
}
const sessions = new Map();   // token -> expira em
const newToken = () => { const t = crypto.randomBytes(24).toString('hex'); sessions.set(t, Date.now() + SESSION_MS); return t; };
function authed(req) {
  const t = req.headers['x-token']; if (!t) return false;
  const e = sessions.get(t); if (!e) return false;
  if (e < Date.now()) { sessions.delete(t); return false; }
  return true;
}
const fails = new Map();   // ip -> {n, until}
const ipOf = (req) => (req.socket.remoteAddress || '').replace('::ffff:', '');

/* ---------------- avisos ao vivo (SSE) ---------------- */
const clients = new Set();
function broadcast(ev) { for (const r of clients) { try { r.write('event: ' + ev + '\ndata: ' + Date.now() + '\n\n'); } catch (e) { clients.delete(r); } } }
setInterval(() => { for (const r of clients) { try { r.write(': ping\n\n'); } catch (e) { clients.delete(r); } } }, 25000).unref();

/* ---------------- utilidades ---------------- */
const send = (res, code, body, headers) => { const b = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body); res.writeHead(code, Object.assign({ 'Content-Type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, headers || {})); res.end(b); };
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const parts = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > limit) { reject(new Error('grande demais')); req.destroy(); } else parts.push(c); });
    req.on('end', () => resolve(Buffer.concat(parts))); req.on('error', reject);
  });
}
const safeName = (n) => {
  n = decodeURIComponent(String(n || 'arquivo')).replace(/\\/g, '/').split('/').pop().normalize('NFC');
  const ext = path.extname(n).toLowerCase(); let base = path.basename(n, path.extname(n)).replace(/[^\p{L}\p{N}._ -]+/gu, '').replace(/\s+/g, '-').replace(/^[.-]+/, '').slice(0, 80) || 'arquivo';
  return { base, ext };
};

/* ---------------- API ---------------- */
async function api(req, res, url) {
  const name = url.pathname.slice(5);   // depois de /api/
  if (name === 'ping') return send(res, 200, { clinicatv: true, versao: 1 });

  if (name === 'eventos') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 3000\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
  }

  if (name === 'config' && req.method === 'GET') {
    try { return send(res, 200, fs.readFileSync(CONFIG), { 'Content-Type': 'application/json; charset=utf-8' }); }
    catch (e) { return send(res, 200, fs.existsSync(path.join(ROOT, 'config.json')) ? fs.readFileSync(path.join(ROOT, 'config.json')) : '{}', { 'Content-Type': 'application/json; charset=utf-8' }); }
  }

  if (name === 'login' && req.method === 'POST') {
    const ip = ipOf(req), f = fails.get(ip) || { n: 0, until: 0 };
    if (f.until > Date.now()) return send(res, 429, { erro: 'Muitas tentativas. Aguarde um minuto.' });
    let j = {}; try { j = JSON.parse((await readBody(req, 10000)).toString('utf8')); } catch (e) { return send(res, 400, { erro: 'pedido inválido' }); }
    if (checkLogin(j.usuario, j.senha)) { fails.delete(ip); return send(res, 200, { token: newToken() }); }
    f.n++; if (f.n >= 5) { f.until = Date.now() + 60000; f.n = 0; } fails.set(ip, f);
    return send(res, 401, { erro: 'Usuário ou senha incorretos' });
  }

  // daqui para baixo precisa estar logado
  if (!authed(req)) return send(res, 401, { erro: 'não autorizado' });

  if (name === 'sessao') return send(res, 200, { ok: true });

  if (name === 'config' && req.method === 'PUT') {
    let body; try { body = await readBody(req, 8 * 1024 * 1024); JSON.parse(body.toString('utf8')); } catch (e) { return send(res, 400, { erro: 'JSON inválido' }); }
    const tmp = CONFIG + '.tmp'; fs.writeFileSync(tmp, body); fs.renameSync(tmp, CONFIG);
    broadcast('mudou'); return send(res, 200, { ok: true });
  }

  if (name === 'acesso' && req.method === 'POST') {
    let j = {}; try { j = JSON.parse((await readBody(req, 10000)).toString('utf8')); } catch (e) { return send(res, 400, { erro: 'pedido inválido' }); }
    const u = String(j.usuario || '').trim(), p = String(j.senha || ''); if (!u) return send(res, 400, { erro: 'informe o usuário' });
    const old = readAcesso(); const salt = crypto.randomBytes(16).toString('hex');
    const out = p ? { usuario: u, salt, hash: hashPass(p, salt) } : { usuario: u, salt: old.salt, hash: old.hash, senha: old.senha };
    if (p && p.length < 4) return send(res, 400, { erro: 'senha muito curta' });
    fs.writeFileSync(ACESSO, JSON.stringify(out, null, 2), { mode: 0o600 }); return send(res, 200, { ok: true });
  }

  if (name === 'midia' && req.method === 'GET') {
    const list = fs.readdirSync(MIDIA).filter((f) => !f.startsWith('.')).map((f) => { const s = fs.statSync(path.join(MIDIA, f)); return { nome: f, url: 'midia/' + f, bytes: s.size, em: s.mtimeMs }; }).sort((a, b) => b.em - a.em);
    return send(res, 200, list);
  }

  if (name === 'upload' && req.method === 'POST') {
    const { base, ext } = safeName(req.headers['x-filename']);
    if (!UPLOAD_EXT.has(ext)) return send(res, 415, { erro: 'tipo de arquivo não permitido (' + (ext || 'sem extensão') + ')' });
    const len = +req.headers['content-length'] || 0; if (len > MAX_UPLOAD) return send(res, 413, { erro: 'arquivo grande demais' });
    let fn = base + ext, i = 1; while (fs.existsSync(path.join(MIDIA, fn))) fn = base + '-' + (++i) + ext;
    const dest = path.join(MIDIA, fn), tmp = dest + '.part';
    const out = fs.createWriteStream(tmp); let n = 0, dead = false;
    req.on('data', (c) => { n += c.length; if (n > MAX_UPLOAD && !dead) { dead = true; out.destroy(); req.destroy(); try { fs.unlinkSync(tmp); } catch (e) { /* já saiu */ } } });
    req.pipe(out);
    out.on('finish', () => { if (dead) return; fs.renameSync(tmp, dest); send(res, 200, { url: 'midia/' + fn, bytes: n }); });
    out.on('error', () => { try { fs.unlinkSync(tmp); } catch (e) { /* ok */ } if (!res.headersSent) send(res, 500, { erro: 'falha ao gravar' }); });
    req.on('aborted', () => { out.destroy(); try { fs.unlinkSync(tmp); } catch (e) { /* ok */ } });
    return;
  }

  return send(res, 404, { erro: 'não existe' });
}

/* ---------------- arquivos do site ---------------- */
function serveFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Não encontrado');
    const ext = path.extname(file).toLowerCase(), type = MIME[ext] || 'application/octet-stream';
    const isMedia = /\.(mp4|m4v|webm|mov|jpe?g|png|gif|webp|woff2?|ttf|otf|mp3|ogg)$/i.test(ext);
    const etag = '"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + '"';
    const h = { 'Content-Type': type, 'Accept-Ranges': 'bytes', ETag: etag, 'Last-Modified': st.mtime.toUTCString(), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': isMedia ? 'public, max-age=3600' : 'no-cache' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    let start = 0, end = st.size - 1, code = 200;
    const rg = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (rg) {
      if (rg[1] === '' && rg[2] !== '') { start = Math.max(0, st.size - +rg[2]); } else { start = rg[1] === '' ? 0 : +rg[1]; if (rg[2] !== '') end = Math.min(end, +rg[2]); }
      if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); }
      code = 206; h['Content-Range'] = 'bytes ' + start + '-' + end + '/' + st.size;
    }
    h['Content-Length'] = end - start + 1;
    res.writeHead(code, h);
    if (req.method === 'HEAD') return res.end();
    const rs = fs.createReadStream(file, { start, end }); rs.on('error', () => res.destroy()); res.on('close', () => rs.destroy()); rs.pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    let p; try { p = decodeURIComponent(url.pathname); } catch (e) { return send(res, 400, 'Endereço inválido'); }
    if (p.startsWith('/api/')) { url.pathname = p; return await api(req, res, url); }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Método não permitido');
    if (p === '/') p = '/index.html';
    if (BLOCKED.some((r) => r.test(p))) return send(res, 404, 'Não encontrado');
    let file;
    if (p.startsWith('/midia/')) file = path.join(MIDIA, p.slice(7)); else file = path.join(ROOT, p);
    const base = p.startsWith('/midia/') ? MIDIA : ROOT;
    if (!path.resolve(file).startsWith(base + path.sep) && path.resolve(file) !== base) return send(res, 404, 'Não encontrado');
    if (p === '/config.json' && fs.existsSync(CONFIG)) file = CONFIG;   // quem lê config.json direto enxerga a versão atual do servidor
    return serveFile(req, res, file);
  } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, { erro: 'erro interno' }); else res.end(); }
});
server.keepAliveTimeout = 65000; server.requestTimeout = 0; server.headersTimeout = 30000;
server.listen(PORT, HOST, () => { console.log('Clínica TV no ar: http://' + (HOST === '0.0.0.0' ? 'IP-DO-SERVIDOR' : HOST) + ':' + PORT + '  (pasta de dados: ' + DATA + ')'); });
process.on('SIGTERM', () => server.close(() => process.exit(0)));
