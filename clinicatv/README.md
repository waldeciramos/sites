# Clínica TV
TV indoor para clínicas: publicações com efeitos, recados, clima, programação do dia, frases, serviços, rádio e barra de notícias com data e hora. Idealizado por Waldeci Ramos.

## Publicar no GitHub Pages
1. Crie um repositório e envie o conteúdo desta pasta (index.html, admin.html, acesso.json, assets, config.json, logo.svg, midia, fontes).
2. Settings → Pages → Branch `main` / `(root)` → Save.
3. TV: `https://SEU-USUARIO.github.io/SEU-REPO/` · Admin: `.../admin.html` (usuário e senha iniciais estão no arquivo `acesso.json`).
4. No GitHub o admin salva no navegador. Para atualizar as TVs: Admin → Publicar e Backup → "Baixar config.json" → substitua no repositório. TVs em "Do arquivo config.json" atualizam em até 2 minutos. Imagens e vídeos vão na pasta `midia/`.

## No servidor Debian
Use o `war.zip` e o `instalador.html`: lá tudo é salvo no servidor, o envio de imagens e vídeos funciona pelo painel e as TVs atualizam ao vivo. Esta mesma pasta (`public/`) é a que o servidor serve.

## Na TV
**F** tela cheia · **R** gira a tela (neste aparelho) · **M** rádio · **N** próxima rádio. Endereço com `?o=v` força vertical e `?m=1` força o modo celular.

## Fontes
Coloque `Qurova.woff2` e `Agency.woff2` (ou .otf/.ttf) na pasta `fontes/`. Confira a licença de cada fonte.

## Novidades desta versão
- **Rádio**: Radio Swiss Pop, Jazz e Classic já cadastradas. No admin → Rádio, escolha "Rádio que toca na TV" (troca na hora), edite nome/endereço de cada uma ou cadastre outras. Pode colar o endereço da página do player (radioswiss*.ch/…/webplayer) que o sistema converte para o áudio. Gráfico de som ao lado da rádio (barras, espelho ou onda).
- **Faixa de serviços**: passando como letreiro (ou parada), com velocidade, fonte e tamanho no admin. Cada serviço aceita foto ou vídeo (miniatura no cartão e/ou na tela central).
- **Barra de notícias**: fonte e tamanho no admin. Em "Notícias automáticas" cole o endereço de um site ou feed RSS (ex.: rodovias.motiva.com.br/minas-sp/) e escolha pegar manchetes, trecho da mensagem ou resumo da página; filtro por palavras e atualização automática.
- **Relógio**: fonte Rajdhani (embutida em `fontes/`) em azul forte; fonte, tamanho e cores no admin.
- **Acesso**: `acesso.json` com `usuario` e `senha` (ou `hash` SHA-256 com prefixo `infotv:`). Senha trocada no painel tem prioridade sobre o arquivo.

## Sobre as notícias por endereço
O navegador não deixa ler outro site direto, então a TV usa leitores públicos (allorigins, corsproxy e r.jina.ai, este com JavaScript). Se quiser independência deles, informe seu próprio proxy em Rodapé → "Proxy próprio" (use `{url}` onde entra o endereço). Dados com mais de 3 horas deixam de ser exibidos.
