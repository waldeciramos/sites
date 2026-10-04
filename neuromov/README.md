# NeuroMove Rehab — Sistema de Reabilitação Neuromotora (mão)

Sistema web (HTML/CSS/JS puro) de reabilitação com rastreamento de mão via câmera
(MediaPipe Hands, 21 pontos), gesto direto de agarrar (mão fechada) e soltar (mão
aberta), 4 exercícios terapêuticos, cadastro de paciente, histórico de sessões,
gráfico de evolução e relatório automático (impressão/PDF).

## Os 4 exercícios

1. **Basquete Cerebral** — mão aberta se aproxima da bola, fecha a mão pra agarrar,
   carrega até a tabela/aro e abre a mão pra soltar. 3 níveis (aro parado → aro se
   move → tempo limite).
2. **Abrir e Fechar** — o sistema manda "ABRA" ou "FECHE" e mede o tempo de reação;
   uma mãozinha na tela espelha o gesto em tempo real, e conta as repetições certas.
3. **Segue o Movimento** — acompanhar um alvo que se move em padrões (horizontal,
   vertical, diagonal, circular).
4. **4 Cantos** — 4 bolinhas nos cantos da tela; o paciente leva uma de cada vez até
   o alvo central com o mesmo gesto abrir/fechar. Cronômetro sempre visível.

A quantidade de repetições (padrão: 10) é definida pelo fisioterapeuta no menu,
antes do primeiro exercício da sessão — depois disso fica travada e vale pra todos
os exercícios daquela sessão. O relatório só é gerado ao final do **último**
exercício da sessão (quando a sessão é encerrada).

## Correções recentes (celular, voz e cores)

- **Jogo das Cores**: corrigido erro que travava o início do jogo (ficava só o cartão cinza, sem número nem bolinhas). Layout refeito pra caber em qualquer celular (em pé e deitado), com as bolinhas coloridas sempre visíveis; o título e o nome da cor não são mais cortados.
- **Voz**: cada jogo fala só no **começo** (explica o que fazer + nome do paciente) e no **final** (parabéns). Nada de falas repetidas durante a partida. No Jogo das Cores, o botão 🔊 repete a cor quando quiser; em Ajustes dá pra ligar a fala da cor a cada tentativa.
- **Vazamento de ouvintes**: os jogos antigos continuavam "ouvindo" a mão depois de terminar e falavam por cima dos novos. Agora são desligados ao fim de cada jogo, e a câmera é liberada.
- **Enquadramento no celular**: durante os jogos a tela é inteira (sem cabeçalho), o palco ocupa o espaço que sobra e o cursor da mão fica alinhado com a imagem da câmera.
- **Bolas coloridas**: "Bolas na Cesta" agora usa 4 cores; "Bolinhas no Lixinho" mostra as 4 cores sempre separadas e o nome da cor pedida aparece numa faixa sem cortar; no Basquete a bola não some mais quando a mão sai do quadro.
- Rodapé **By Waldeci Ramos** em todas as telas.

## Novidades (rodada 2)

- **Abrir e Fechar**: agora tem uma mãozinha divertida (amarela, com carinha e punho azul, no estilo do layout) que **mostra o que fazer** — ela abre e fecha para o paciente fazer junto. Embaixo aparece a mãozinha do paciente, que fica verde quando acerta. Os comandos alternam (abre, fecha, abre...), sem pressa e com uma pausa entre eles.
- **Repetições de verdade**: o número escolhido no menu (de 1 a 30) vale para todos os jogos. Cada jogo termina sozinho ao chegar nele, mostra os **pontos** e o botão **Próximo: (nome do jogo)** leva direto ao jogo seguinte (Basquete → Abrir e Fechar → Labirinto → Bolas na Cesta → Bolinhas no Lixinho → Jogo das Cores). Também vale para o **Jogo das Cores** (tentativas por nível). Antes os jogos reiniciavam em "séries" e nunca terminavam, e o mínimo era 3.
- **Pegar sem ser "fino"**: gesto de abrir/fechar estável (não pisca; precisa de 2 quadros), funciona com a mão inclinada, posição suavizada, tolerância de ~0,45 s se a câmera perder a mão, área de pegar bem maior e soltar só depois de abrir de verdade. Pinça (Lixinho) com histerese.
- **Labirinto**: a bolinha **não sai do caminho** nem se a mão atravessar as paredes — ela anda em passos pequenos, desliza na parede e para.
- **Voz mais leve**: `js/voz.js` escolhe a melhor voz pt-BR do aparelho (Natural/Online/Google/Luciana...), fala frase por frase com pausas e pequena variação de tom, e as falas ficaram mais soltas ("fecha a mãozinha pra pegar a bola..."). Em Configurações (⚙) dá para escolher a voz que soar melhor. No Jogo das Cores a voz não fala mais a cor sílaba por sílaba (as sílabas só acendem na tela).
- **Mais rápido**: modelo de mão leve em celular, câmera reaproveitada entre um jogo e o próximo, textos da tela atualizados ~8x/s em vez de todo quadro, e menos espera entre tentativas no Jogo das Cores.
- **Bugs**: no Abrir e Fechar a mão já aberta contava acerto instantâneo; as repetições voltavam para 10 sozinhas ao abrir o histórico; diálogo de parabéns com faixa cortada; confete passando por cima do texto.

## Por que não funciona no preview do Claude.ai

O MediaPipe só é distribuído via jsDelivr/npm, e o sandbox de preview de artifacts
do Claude só carrega scripts de `cdnjs.cloudflare.com`. Por isso este projeto é
entregue como arquivos separados, pra rodar no seu próprio ambiente — local ou no
GitHub Pages — onde essa restrição não existe.

## Acesso

Sem login e sem cadastro: a tela inicial pede só o **nome** (uma vez, antes de começar). Os jogos usam esse nome para dar boas-vindas e brincar durante as partidas. As pontuações ficam salvas apenas neste navegador, por nome. Nada é gravado no GitHub nem em servidor.

## Pacientes fixos

Os pacientes ficam cadastrados direto em `js/pacientes.js` (lista `PACIENTES_FIXOS`). Pra incluir outro, copie o bloco, troque `id` e dados e suba o arquivo. As sessões de cada um são guardadas por `id`.

## Como os dados são salvos

Ordem de tentativa, automática:

1. **API do GitHub** (se você configurar um token em `js/config.js`) — grava um
   `cadastro.json` de verdade dentro de `data/pacientes/Nome_do_Paciente_xxxxxxxx/`,
   direto no repositório, como um commit. Funciona no GitHub Pages.
2. **`api.php`** (se hospedado em servidor com PHP, tipo seu Debian/Nginx) — mesma
   ideia, mas grava no disco do servidor.
3. **`localStorage`** do navegador — se nenhum dos dois acima estiver disponível.

### Configurando a gravação via GitHub

Edite `js/config.js` e gere um token em
`github.com/settings/personal-access-tokens/new`:
- Tipo: **Fine-grained token**
- Repository access → **Only select repositories** → escolha só o `sites`
- Permissions → **Contents: Read and write** (só essa)
- Cole o token dentro das aspas em `token: ''`

## ⚠️ Sobre segurança (leia antes de usar com pacientes reais)

Este projeto está configurado do jeito que você pediu, mas é importante deixar
registrado o que isso significa na prática:

- O repositório **precisa ficar público** pro GitHub Pages funcionar no plano
  gratuito — não existe "Pages privado" fora do GitHub Enterprise.
- Sendo público, **o token do `config.js`, o `senha.json` e os `cadastro.json` de
  cada paciente (nome, diagnóstico, dados do terapeuta) ficam visíveis pra
  qualquer pessoa** que abrir o link do site e olhar "Ver código-fonte" ou o
  Console do navegador — não precisa nem saber programar.
- O login com usuário/senha impede acesso casual, mas não é proteção técnica: dá
  pra pular direto lendo o `senha.json`.
- O token tem permissão de escrita nesse repositório; se vazar, alguém pode
  alterar ou apagar arquivos. Revogue e gere outro em `github.com/settings/tokens`
  se desconfiar de algo.

Se em algum momento isso passar a incomodar — por exemplo, se o volume de dados de
paciente crescer e você quiser mais seriedade na proteção — o caminho mais simples
é migrar pro backend PHP no seu servidor Debian (`api.php`, já incluso neste
projeto): os dados passam a ficar na sua rede, não no GitHub. Não precisa
reescrever nada — só hospedar lá e deixar `token: ''` vazio no `config.js`.

## Rodar localmente (seu servidor Debian/Nginx com PHP)

```bash
# copie a pasta neuromove/ pra dentro do seu diretório servido pelo Nginx, ex.:
cp -r neuromove /var/www/neuromove
# garanta que o PHP-FPM está habilitado no Nginx para esse diretório
# e que a pasta data/ pode ser criada/escrita pelo usuário do servidor web (www-data):
sudo chown -R www-data:www-data /var/www/neuromove/data
```

Acesse via `http://192.168.2.155/neuromove/` (ou o domínio que você configurar).
A câmera do navegador só libera em **HTTPS ou `localhost`** — em rede interna sem
certificado, acesse pelo `localhost` na própria máquina do servidor, ou configure
um certificado (Let's Encrypt se tiver domínio público, ou autoassinado pra uso
interno).

## Publicar no GitHub Pages (sem PHP, mas HTTPS de graça)

```bash
cd neuromove
git init && git add . && git commit -m "NeuroMove Rehab v2 (só mão)"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

Depois: **Settings → Pages → Branch: main → Save**. Em 1-2 minutos o site fica em
`https://SEU_USUARIO.github.io/SEU_REPO/`, já em HTTPS — a câmera funciona direto.
Os dados dos pacientes ficam salvos no navegador (ver tabela acima).

## Estrutura

```
neuromove/
├── index.html            telas e estrutura da interface (inclui tela de login)
├── style.css              identidade visual
├── api.php                 backend PHP opcional (alternativa mais segura, ver acima)
├── data/
│   ├── senha.json           usuário/senha do login
│   └── pacientes/            onde os cadastros ficam salvos (criado automaticamente)
├── js/
│   ├── config.js             token do GitHub (você preenche)
│   ├── storage.js            GitHub → api.php → localStorage, nessa ordem
│   ├── tracking.js           MediaPipe Hands, gesto agarrar/soltar
│   ├── exercises.js          os 4 exercícios e a coleta de métricas
│   ├── report.js             relatório de sessão + gráfico de evolução
│   └── app.js                telas, login, navegação, configuração de repetições
└── README.md
```

## Limitações conhecidas

- A detecção de gesto (mão aberta/fechada) usa uma heurística geométrica sobre os
  21 pontos — funciona bem de frente para a câmera, com boa luz; pode falhar em
  ângulos muito inclinados ou contraluz forte.
- Isto **não é um dispositivo médico certificado**; é uma ferramenta de apoio a
  exercícios, sob supervisão do terapeuta responsável.
