// report.js — monta o relatório de sessão a partir do template especificado.

const Report = {
  build(wrapper, sessao){
    const p = wrapper.paciente;
    const exs = sessao.exerciciosRealizados;
    const melhor = exs.slice().sort((a,b)=>b.pontuacao-a.pontuacao)[0];
    const pontuacaoTotal = exs.reduce((a,e)=>a+e.pontuacao,0);
    const precisaoMedia = avg(exs.map(e=>e.metricas.precisaoMedia).filter(v=>v!=null));
    const reacaoMedia = avg(exs.map(e=>e.metricas.tempoReacaoMedio).filter(v=>v!=null));
    const piscadasTotais = exs.reduce((a,e)=>a+(e.metricas.piscadas||0),0);
    const olhares = exs.map(e=>e.metricas.olharPredominante);
    const olharPred = moda(olhares);

    const areaMelhoria = exs.slice().sort((a,b)=> (a.metricas.precisaoMedia||0)-(b.metricas.precisaoMedia||0))[0];

    return `
      <h2>Relatório de Sessão — Neuro Reabilitação</h2>
      <h3>Dados do paciente</h3>
      <div class="rline"><span>Nome</span><span>${esc(p.nome)}</span></div>
      <div class="rline"><span>Data da sessão</span><span>${new Date(sessao.data).toLocaleString('pt-BR')}</span></div>
      <div class="rline"><span>Duração total</span><span>${fmtDur(sessao.duracaoTotal)}</span></div>
      <div class="rline"><span>Terapeuta</span><span>${esc(p.terapeuta.nome||'—')}</span></div>

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

      <h3>Análise de métricas — Olhos</h3>
      <div class="rgrid">
        <div class="rline"><span>Piscadas totais</span><span>${piscadasTotais}</span></div>
        <div class="rline"><span>Direção predominante</span><span>${esc(olharPred)}</span></div>
      </div>

      <h3>Exercícios da sessão</h3>
      ${exs.map(e=>`
        <div class="rline"><span>${esc(e.nome)} (nível ${e.nivel})</span><span>${e.pontuacao} pts · ${e.metricas.movimentosCorretos}✓/${e.metricas.movimentosIncorretos}✗</span></div>
      `).join('')}

      <h3>Progresso comparativo</h3>
      ${exs.map(e=>{
        const anterior = ultimaExecucao(wrapper, e.nome, 0);
        if(!anterior) return `<div class="rline"><span>${esc(e.nome)}</span><span>primeira execução registrada</span></div>`;
        const deltaScore = e.pontuacao - anterior.pontuacao;
        return `<div class="rline"><span>${esc(e.nome)}</span><span>${deltaScore>=0?'+':''}${deltaScore} pts vs. sessão anterior</span></div>`;
      }).join('')}

      <h3>Recomendações</h3>
      <div class="rline"><span>Foco sugerido</span><span>${esc(areaMelhoria?areaMelhoria.nome:'—')}</span></div>

      <h3>Observações do terapeuta</h3>
      <div style="border:1px dashed #c4d3cd;border-radius:8px;height:70px;"></div>
    `;
  }
};

function avg(arr){ return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null; }
function moda(arr){
  const c={}; arr.forEach(v=>c[v]=(c[v]||0)+1);
  return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
}
function esc(s){ return String(s==null?'—':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDur(sec){ sec=Math.round(sec||0); const m=Math.floor(sec/60), s=sec%60; return `${m}min ${s}s`; }
