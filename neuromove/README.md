# NeuroMove Rehab — Sistema de Reabilitação Neuromotora

Sistema web (HTML/CSS/JS puro) de reabilitação neuromotora com rastreamento de mão
(MediaPipe Hands, 21 pontos) e de olhos (MediaPipe Face Mesh, com íris), gestos de
agarrar/soltar, controle por piscadas, 5 exercícios terapêuticos, cadastro de
paciente em JSON, histórico de sessões e relatório automático (impressão/PDF).

## Por que não funciona no preview do Claude.ai

O MediaPipe só é distribuído via jsDelivr/npm, e o sandbox de preview de artifacts
do Claude só carrega scripts de `cdnjs.cloudflare.com`. Por isso este projeto foi
entregue como arquivos separados, para você rodar no seu próprio ambiente — local
ou no GitHub Pages — onde essa restrição não existe.

## Rodar localmente

A câmera só funciona em contexto seguro (`https://` ou `http://localhost`), então
não dá para abrir o `index.html` direto com duplo clique (`file://`). Suba um
servidor simples na pasta do projeto:

```bash
cd neuromove
python3 -m http.server 8080
# depois acesse http://localhost:8080 no navegador
```

Ou, se preferir usar seu servidor Debian/Nginx (como você já faz com o totem e o
bombas.html), copie a pasta `neuromove/` para dentro de `/var/www/` e acesse via
`http://SEU_IP/neuromove/` — mas note que a **câmera do navegador só libera em
HTTPS** fora do `localhost`. Duas saídas práticas:
1. Configurar um certificado (ex.: Let's Encrypt, se o domínio for público, ou um
   certificado autoassinado aceito manualmente no navegador para uso interno).
2. Acessar via `http://localhost` diretamente na máquina que roda o servidor.

## Publicar no GitHub Pages (mais simples, HTTPS de graça)

```bash
cd neuromove
git init
git add .
git commit -m "NeuroMove Rehab v1.0"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/neuromove-rehab.git
git push -u origin main
```

Depois, no repositório no GitHub: **Settings → Pages → Branch: main → Save**.
Em alguns minutos o site fica disponível em
`https://SEU_USUARIO.github.io/neuromove-rehab/`, já em HTTPS — a câmera funciona
direto, sem configuração extra.

## Estrutura

```
neuromove/
├── index.html          telas e estrutura da interface
├── style.css            identidade visual
├── js/
│   ├── storage.js        cadastro do paciente (localStorage) no schema JSON pedido
│   ├── tracking.js        MediaPipe Hands + Face Mesh, gestos, piscadas, olhar
│   ├── exercises.js       os 5 exercícios e a coleta de métricas
│   ├── report.js          geração do relatório de sessão
│   └── app.js             telas, navegação e o "cérebro" da aplicação
└── README.md
```

## Como os dados são salvos

Cada paciente é salvo no `localStorage` do navegador (chave
`neuromove_pacientes_v1`), no formato JSON que você especificou (dados pessoais,
terapeuta, configurações, sessões, histórico). Como é `localStorage`, os dados
ficam **só naquele navegador/computador** — use os botões "Exportar JSON" (na tela
de relatório e na de histórico) para guardar backups ou migrar de máquina.

## Calibração

Antes do primeiro exercício, o sistema roda 3 passos:
1. **Detecção** — confirma que MediaPipe está enxergando mão e rosto.
2. **Lateralidade dos olhos** — pede para o paciente piscar o olho **esquerdo**
   uma vez; o sistema aprende, na hora, qual conjunto de pontos do Face Mesh
   corresponde a qual olho do paciente (evita erro de espelhamento).
3. **Confirmação de gestos** — pede para abrir e fechar a mão, para garantir
   que o gesto de "agarrar" está sendo reconhecido antes de começar.

## Limitações conhecidas (para ficar claro com o paciente/terapeuta)

- A detecção de gesto (mão aberta/fechada) usa uma heurística geométrica sobre os
  21 pontos — funciona bem de frente para a câmera, com boa luz; pode falhar em
  ângulos muito inclinados.
- O rastreio de olhar (esquerda/direita/cima/baixo) é aproximado — mais confiável
  para as piscadas (usadas nos comandos) do que para direção fina do olhar.
- Isto **não é um dispositivo médico certificado**; é uma ferramenta de apoio a
  exercícios, sob supervisão do terapeuta responsável.
