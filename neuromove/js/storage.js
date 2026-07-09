// storage.js — persistência local (localStorage) no formato JSON especificado.
const NM_KEY = 'neuromove_pacientes_v1';

const Storage = {
  all(){
    try{
      const raw = localStorage.getItem(NM_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ console.error('Storage.all', e); return []; }
  },
  saveAll(list){
    try{ localStorage.setItem(NM_KEY, JSON.stringify(list)); }
    catch(e){ console.error('Storage.saveAll', e); }
  },
  get(id){
    return this.all().find(p=>p.paciente.id===id) || null;
  },
  upsert(pacienteWrapper){
    const list = this.all();
    const i = list.findIndex(p=>p.paciente.id===pacienteWrapper.paciente.id);
    if(i>=0) list[i]=pacienteWrapper; else list.push(pacienteWrapper);
    this.saveAll(list);
  },
  remove(id){
    this.saveAll(this.all().filter(p=>p.paciente.id!==id));
  },
  novoPaciente(dados){
    const id = (crypto.randomUUID) ? crypto.randomUUID() : ('p-'+Date.now()+'-'+Math.random().toString(16).slice(2));
    const idade = dados.dataNascimento ? calcIdade(dados.dataNascimento) : null;
    return {
      paciente: {
        id,
        nome: dados.nome,
        dataNascimento: dados.dataNascimento || null,
        idade,
        sexo: dados.sexo || null,
        diagnostico: dados.diagnostico || null,
        dataCadastro: new Date().toISOString(),
        terapeuta: {
          nome: dados.terapeutaNome || null,
          registro: dados.terapeutaRegistro || null,
          especialidade: dados.terapeutaEspecialidade || null
        },
        configuracoes: {
          maoDominante: dados.maoDominante || 'Destra',
          dificuldadeInicial: dados.dificuldadeInicial || 1,
          sensibilidade: dados.sensibilidade || 1.0
        },
        calibracaoOlhos: null, // preenchido na calibração: {eyeLeftIsGroupA:boolean}
        sessoes: [],
        historico: { totalSessoes:0, mediaDesempenho:0, ultimaSessao:null }
      }
    };
  }
};

function calcIdade(dataNascISO){
  const nasc = new Date(dataNascISO);
  if(isNaN(nasc)) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear()-nasc.getFullYear();
  const m = hoje.getMonth()-nasc.getMonth();
  if(m<0 || (m===0 && hoje.getDate()<nasc.getDate())) idade--;
  return idade;
}

function registrarSessao(wrapper, sessao){
  const p = wrapper.paciente;
  p.sessoes.unshift(sessao);
  p.sessoes = p.sessoes.slice(0,100);
  p.historico.totalSessoes = p.sessoes.length;
  const scores = p.sessoes.flatMap(s=>s.exerciciosRealizados.map(e=>e.pontuacao));
  p.historico.mediaDesempenho = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  p.historico.ultimaSessao = sessao.data;
  Storage.upsert(wrapper);
}

// retorna a última execução de um exercício específico (para comparação de progresso)
function ultimaExecucao(wrapper, nomeExercicio, excluirSessaoAtualIdx){
  const p = wrapper.paciente;
  for(let i=0;i<p.sessoes.length;i++){
    if(i===excluirSessaoAtualIdx) continue;
    const found = p.sessoes[i].exerciciosRealizados.find(e=>e.nome===nomeExercicio);
    if(found) return found;
  }
  return null;
}
