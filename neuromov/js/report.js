// report.js — relatório de sessão (impressão/PDF) + gráfico de evolução entre sessões.

const Report = {
  build(wrapper, sessao){
    const p = wrapper.paciente;
    const exs = sessao.exerciciosRealizados;
    const melhor = exs.slice().sort((a,b)=>b.pontuacao-a.pontuacao)[0];
    const pontuacaoTotal = exs.reduce((a,e)=>a+e.pontuacao,0);
    const precisaoMedia = avg(exs.map(e=>e.metricas.precisaoMedia).filter(v=>v!=null));
    const reacaoMedia = avg(exs.map(e=>e.metricas.tempoReacaoMedio).filter(v=>v!=null));
    const areaMelhoria = exs.slice().sort((a,b)=> (a.metricas.precisaoMedia||0)-(b.metricas.precisaoMedia||0))[0];

    const chartImg = buildEvolutionChart(p);

    return `
      <h2>Relatório de Sessão — NeuroMove Rehab</h2>
      <h3>Dados do paciente</h3>
      <div class="rline"><span>Nome</span><span>${esc(p.nome)}</span></div>
      <div class="rline"><span>Data da sessão</span><span>${new Date(sessao.data).toLocaleString('pt-BR')}</span></div>
      <div class="rline"><span>Duração total</span><span>${fmtDur(sessao.duracaoTotal)}</span></div>
      <div class="rline"><span>Terapeuta</span><span>${esc(p.terapeuta.nome||'—')}</span></div>
      <div class="rline"><span>Sessão nº</span><span>${p.sessoes.findIndex(s=>s.data===sessao.data)>=0 ? (p.sessoes.length - p.sessoes.findIndex(s=>s.data===sessao.data)) : p.sessoes.length}</span></div>

      <h3>Resumo de desempenho</h3>
      <div class="rgrid">
        <div class="rline"><span>Exercícios realizados</span><span>${exs.length}</span></div>
        <div class="rline"><span>Pontuação total</span><span>${pontuacaoTotal}</span></div>
        <div class="rline"><span>Melhor resultado</span><span>${esc(melhor?melhor.nome:'—')}</span></div>
        <div class="rline"><span>Área de melhoria</span><span>${esc(areaMelhoria?areaMelhoria.nome:'—')}</span></div>
      </div>

      <h3>Análise de métricas — Mão</h3>
      <div class="rgrid">
        <div class="rline"><span>Precisão média</span><span>${precisaoMedia!=null?precisaoMedia+'%':'—'}</span></div>
        <div class="rline"><span>Tempo de reação médio</span><span>${reacaoMedia!=null?reacaoMedia+' ms':'—'}</span></div>
      </div>

      <h3>Exercícios da sessão</h3>
      ${exs.map(e=>`
        <div class="rline"><span>${esc(e.nome)} (nível ${e.nivel})</span><span>${e.pontuacao} pts · ${e.metricas.movimentosCorretos}✓/${e.metricas.movimentosIncorretos}✗</span></div>
      `).join('')}

      <h3>Progresso comparativo (vs. sessão anterior)</h3>
      ${exs.map(e=>{
        const anterior = ultimaExecucao(wrapper, e.nome, 0);
        if(!anterior) return `<div class="rline"><span>${esc(e.nome)}</span><span>primeira execução registrada</span></div>`;
        const deltaScore = e.pontuacao - anterior.pontuacao;
        return `<div class="rline"><span>${esc(e.nome)}</span><span>${deltaScore>=0?'+':''}${deltaScore} pts vs. sessão anterior</span></div>`;
      }).join('')}

      <h3>Evolução entre sessões</h3>
      ${chartImg ? `<img src="${chartImg}" style="width:100%;border-radius:8px;margin:6px 0;" alt="Gráfico de evolução">`
                 : `<p style="font-size:12px;color:#5a6f6a;">O gráfico aparece a partir da 2ª sessão registrada.</p>`}

      <h3>Recomendações</h3>
      <div class="rline"><span>Foco sugerido</span><span>${esc(areaMelhoria?areaMelhoria.nome:'—')}</span></div>

      <h3>Observações do terapeuta</h3>
      <div style="border:1px dashed #c4d3cd;border-radius:8px;height:70px;"></div>
    `;
  }
};

// ---------- Relatório de evolução do ciclo (1, 2 ou 'geral') ----------
// Usa os dados agregados que já vêm prontos de Programa (storage.js).
Report.buildCycle = function(wrapper, modo){
  const p = wrapper.paciente;
  const off = Programa.offset(p);
  const nTotal = Programa.feitas(p);
  const todas = Programa.cronologicas(p); // só sessões com dados (feitas no app)
  let rangeIni, rangeFim, titulo;
  if(modo === 'geral'){ rangeIni = 1; rangeFim = Programa.TOTAL; titulo = 'Relatório geral do programa'; }
  else { rangeIni = (modo-1)*Programa.CICLO+1; rangeFim = modo*Programa.CICLO; titulo = 'Relatório do ciclo '+modo; }
  // recorte local (índices dentro de `todas`, que só tem as sessões com dados no app)
  const aIdx = Math.max(0, rangeIni-off-1), bIdx = Math.max(0, rangeFim-off);
  const sess = todas.slice(aIdx, bIdx);
  const doneNoRange = Math.max(0, Math.min(nTotal,rangeFim) - rangeIni + 1); // conta as de antes do sistema também
  if(!sess.length && !doneNoRange) return `<h2>${titulo}</h2><p>Ainda não há sessões neste período.</p>`;
  if(!sess.length) return `<h2>${titulo}</h2><p>As ${doneNoRange} sessão(ões) deste período foram realizadas antes deste sistema, sem dados detalhados de exercício aqui.</p>`;

  const alvo = rangeFim-rangeIni+1;
  const completo = doneNoRange >= alvo;
  const nIni = off + aIdx + 1, nFim = nIni + sess.length - 1;
  const st = sess.map(Programa.stats);
  const ultima = st[st.length-1];
  // referência de "melhoria desde o início": a 1ª sessão com dados no app (pode não
  // ser a sessão 1 real do tratamento, se houver sessões de antes do sistema)
  const base = Programa.stats(todas[0]);
  const baseRotulo = off>0 ? `Sessão ${off+1} (1ª c/ dados no sistema)` : 'Sessão 1';

  const pct = (a,b,inverso)=>{
    if(a==null || b==null || a===0) return null;
    const v = Math.round(((b-a)/a)*100);
    return inverso ? -v : v;
  };
  const fmtPct = (v)=> v==null ? '—' : `<span class="${v>=0?'delta-up':'delta-down'}">${v>=0?'+':''}${v}%</span>`;
  const linha = (nome, chave, un, inverso)=>{
    const a = base[chave], b = ultima[chave];
    return `<tr><td>${nome}</td><td>${a!=null?a+un:'—'}</td><td>${b!=null?b+un:'—'}</td><td>${fmtPct(pct(a,b,inverso))}</td></tr>`;
  };

  const tabela = sess.map((s,i)=>{
    const t = st[i];
    return `<tr><td>${nIni+i}</td><td>${new Date(s.data).toLocaleDateString('pt-BR')}</td><td>${t.pontos}</td><td>${t.precisao!=null?t.precisao+'%':'—'}</td><td>${t.reacao!=null?t.reacao+' ms':'—'}</td><td>${t.acerto!=null?t.acerto+'%':'—'}</td></tr>`;
  }).join('');

  const nomes = [];
  sess.forEach(s=>s.exerciciosRealizados.forEach(e=>{ if(!nomes.includes(e.nome)) nomes.push(e.nome); }));
  const porExercicio = nomes.map(nome=>{
    let primeiro=null, ultimo=null;
    todas.forEach(s=>{ const e = s.exerciciosRealizados.find(x=>x.nome===nome); if(e && !primeiro) primeiro=e; });
    sess.forEach(s=>{ const e = s.exerciciosRealizados.find(x=>x.nome===nome); if(e) ultimo=e; });
    if(!primeiro || !ultimo) return '';
    const d = pct(primeiro.pontuacao, ultimo.pontuacao, false);
    return `<tr><td>${esc(nome)}</td><td>${primeiro.pontuacao}</td><td>${ultimo.pontuacao}</td><td>${fmtPct(d)}</td></tr>`;
  }).join('');

  const ultimaEhBase = (sess[sess.length-1] === todas[0]);
  const dPontos = pct(base.pontos, ultima.pontos, false);
  const dPrec = base.precisao!=null && ultima.precisao!=null ? ultima.precisao-base.precisao : null;
  const dReac = pct(base.reacao, ultima.reacao, true);
  let conclusao = '';
  if(ultimaEhBase) conclusao = `Esta é a ${off>0?'primeira sessão com dados no sistema':'sessão inicial'} (linha de base). A comparação começa a partir da sessão seguinte.`;
  else {
    const partes = [];
    if(dPontos!=null) partes.push(`pontuação total ${dPontos>=0?'subiu':'caiu'} ${Math.abs(dPontos)}%`);
    if(dPrec!=null) partes.push(`precisão média ${dPrec>=0?'subiu':'caiu'} ${Math.abs(dPrec)} ponto(s) percentual(is)`);
    if(dReac!=null) partes.push(`tempo de reação ${dReac>=0?'melhorou':'piorou'} ${Math.abs(dReac)}%`);
    conclusao = `Da ${baseRotulo.toLowerCase()} até a sessão ${nFim}: ` + (partes.length ? partes.join('; ') + '.' : 'dados insuficientes para comparar.');
  }

  const grafico = buildCycleChart(sess.map((s,i)=>({n:nIni+i, pontos:st[i].pontos})), titulo);

  return `
    <h2>${titulo} — NeuroMove Rehab</h2>
    <div class="rline"><span>Paciente</span><span>${esc(p.nome)}</span></div>
    <div class="rline"><span>Terapeuta</span><span>${esc(p.terapeuta.nome||'—')}</span></div>
    <div class="rline"><span>Sessões analisadas</span><span>${rangeIni} a ${rangeFim} (${doneNoRange} de ${alvo}${off>0?', '+sess.length+' com dados aqui':''})</span></div>
    <div class="rline"><span>Situação</span><span>${completo ? 'CICLO COMPLETO ✓' : 'PARCIAL — faltam '+(alvo-doneNoRange)+' sessão(ões)'}</span></div>
    <div class="rline"><span>Período</span><span>${new Date(sess[0].data).toLocaleDateString('pt-BR')} a ${new Date(sess[sess.length-1].data).toLocaleDateString('pt-BR')}</span></div>
    ${off>0 ? `<div class="rline"><span>Sessões antes deste sistema</span><span>${off} (contam na meta, sem dados de exercício aqui)</span></div>` : ''}

    <h3>Melhoria desde ${off>0?'o início do registro no sistema':'a 1ª sessão'}</h3>
    <table>
      <tr><th>Indicador</th><th>${baseRotulo}</th><th>Sessão ${nFim}</th><th>Variação</th></tr>
      ${linha('Pontuação total','pontos',' pts',false)}
      ${linha('Precisão média','precisao','%',false)}
      ${linha('Taxa de acerto','acerto','%',false)}
      ${linha('Tempo de reação (menor = melhor)','reacao',' ms',true)}
    </table>
    <p style="font-size:13px;margin:8px 0;"><b>Conclusão:</b> ${conclusao}</p>

    <h3>Evolução sessão a sessão</h3>
    ${grafico ? `<img src="${grafico}" style="width:100%;border-radius:8px;margin:6px 0;" alt="Gráfico de evolução do ciclo">` : ''}
    <table>
      <tr><th>Sessão</th><th>Data</th><th>Pontos</th><th>Precisão</th><th>Reação</th><th>Acertos</th></tr>
      ${tabela}
    </table>

    <h3>Evolução por exercício</h3>
    <table>
      <tr><th>Exercício</th><th>1ª vez (pts)</th><th>Última (pts)</th><th>Variação</th></tr>
      ${porExercicio || '<tr><td colspan="4">—</td></tr>'}
    </table>

    ${modo==='geral' ? (()=>{
      const c1 = Programa.sessoesDoCiclo(p,1), c2 = Programa.sessoesDoCiclo(p,2);
      let descansoHtml = '';
      if(c1.length && c2.length){
        const dias = Math.round((new Date(c2[0].data) - new Date(c1[c1.length-1].data)) / (1000*60*60*24));
        const ok = dias >= Programa.DESCANSO_DIAS;
        descansoHtml = `<div class="rline"><span>Descanso entre ciclo 1 e ciclo 2</span><span>${dias} dia(s) ${ok?'✓ dentro do protocolo (mín. '+Programa.DESCANSO_DIAS+')':'⚠ abaixo do mínimo de '+Programa.DESCANSO_DIAS+' dias'}</span></div>`;
      }
      if(!c1.length || !c2.length) return descansoHtml;
      const m = (arr,k)=>{ const v = arr.map(Programa.stats).map(x=>x[k]).filter(x=>x!=null); return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : null; };
      const row = (nome,k,un,inv)=>{ const a=m(c1,k), b=m(c2,k); return `<tr><td>${nome}</td><td>${a!=null?a+un:'—'}</td><td>${b!=null?b+un:'—'}</td><td>${fmtPct(pct(a,b,inv))}</td></tr>`; };
      return `<h3>Ciclo 1 × Ciclo 2 (médias)</h3>
        ${descansoHtml}
        <table>
        <tr><th>Indicador</th><th>Ciclo 1</th><th>Ciclo 2</th><th>Variação</th></tr>
        ${row('Pontuação total','pontos',' pts',false)}
        ${row('Precisão média','precisao','%',false)}
        ${row('Taxa de acerto','acerto','%',false)}
        ${row('Tempo de reação','reacao',' ms',true)}
      </table>`;
    })() : ''}

    <h3>Observações do terapeuta</h3>
    <div style="border:1px dashed #c4d3cd;border-radius:8px;height:90px;"></div>
  `;
};

function buildCycleChart(pontos, titulo){
  if(pontos.length < 2) return null;
  const w=640, h=260, pad=40;
  const canvas = document.createElement('canvas');
  canvas.width=w; canvas.height=h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
  const vals = pontos.map(x=>x.pontos);
  const maxV = Math.max(...vals, 10);
  const stepX = (w-pad*2)/Math.max(1,pontos.length-1);
  const toY = (v)=> h-pad - (v/maxV)*(h-pad*2);
  ctx.strokeStyle='#c4d3cd'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pad,pad); ctx.lineTo(pad,h-pad); ctx.lineTo(w-pad,h-pad); ctx.stroke();
  ctx.beginPath();
  vals.forEach((v,i)=>{ const x=pad+i*stepX, y=toY(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
  ctx.strokeStyle='#F2A93B'; ctx.lineWidth=3; ctx.stroke();
  vals.forEach((v,i)=>{
    const x=pad+i*stepX, y=toY(v);
    ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle='#0B2E2C'; ctx.fill();
    ctx.font='11px sans-serif'; ctx.fillStyle='#0B2E2C'; ctx.textAlign='center';
    ctx.fillText(String(v), x, y-10);
    ctx.fillText('S'+pontos[i].n, x, h-pad+16);
  });
  ctx.font='13px sans-serif'; ctx.textAlign='left';
  ctx.fillText('Pontuação total por sessão — '+titulo, pad, 20);
  return canvas.toDataURL('image/png');
}

// Gera um gráfico de linha simples (pontuação total por sessão, da mais antiga pra mais nova)
function buildEvolutionChart(p){
  const sessoes = p.sessoes.slice().reverse(); // mais antiga primeiro
  if(sessoes.length < 2) return null;
  const pontos = sessoes.map(s => s.exerciciosRealizados.reduce((a,e)=>a+e.pontuacao,0));

  const w=640, h=260, pad=40;
  const canvas = document.createElement('canvas');
  canvas.width=w; canvas.height=h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);

  const maxV = Math.max(...pontos, 10);
  const minV = 0;
  const stepX = (w-pad*2)/Math.max(1,pontos.length-1);
  const toY = (v)=> h-pad - (v-minV)/(maxV-minV)*(h-pad*2);

  // eixos
  ctx.strokeStyle='#c4d3cd'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pad,pad); ctx.lineTo(pad,h-pad); ctx.lineTo(w-pad,h-pad); ctx.stroke();

  // linha
  ctx.beginPath();
  pontos.forEach((v,i)=>{ const x=pad+i*stepX, y=toY(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
  ctx.strokeStyle='#F2A93B'; ctx.lineWidth=3; ctx.stroke();

  // pontos + rótulos
  pontos.forEach((v,i)=>{
    const x=pad+i*stepX, y=toY(v);
    ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle='#0B2E2C'; ctx.fill();
    ctx.font='11px sans-serif'; ctx.fillStyle='#0B2E2C'; ctx.textAlign='center';
    ctx.fillText(String(v), x, y-10);
    ctx.fillText('S'+(i+1), x, h-pad+16);
  });

  ctx.font='13px sans-serif'; ctx.fillStyle='#0B2E2C'; ctx.textAlign='left';
  ctx.fillText('Pontuação total por sessão', pad, 20);

  return canvas.toDataURL('image/png');
}

function avg(arr){ return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null; }
function esc(s){ return String(s==null?'—':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDur(sec){ sec=Math.round(sec||0); const m=Math.floor(sec/60), s=sec%60; return `${m}min ${s}s`; }
