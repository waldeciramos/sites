# Clínica TV
TV indoor para clínicas: publicações com efeitos, recados, clima, programação do dia, frases, serviços, rádio e barra de notícias com data e hora. Idealizado por Waldeci Ramos.

## Publicar no GitHub Pages
1. Crie um repositório e envie o conteúdo desta pasta (index.html, admin.html, assets, config.json, logo.svg, midia, fontes).
2. Settings → Pages → Branch `main` / `(root)` → Save.
3. TV: `https://SEU-USUARIO.github.io/SEU-REPO/` · Admin: `.../admin.html` (usuário `admin`, senha `admin123` — troque).
4. No GitHub o admin salva no navegador. Para atualizar as TVs: Admin → Publicar e Backup → "Baixar config.json" → substitua no repositório. TVs em "Do arquivo config.json" atualizam em até 2 minutos. Imagens e vídeos vão na pasta `midia/`.

## No servidor Debian
Use o `war.zip` e o `instalador.html`: lá tudo é salvo no servidor, o envio de imagens e vídeos funciona pelo painel e as TVs atualizam ao vivo. Esta mesma pasta (`public/`) é a que o servidor serve.

## Na TV
**F** tela cheia · **R** gira a tela (neste aparelho) · **M** rádio · **N** próxima rádio. Endereço com `?o=v` força vertical e `?m=1` força o modo celular.

## Fontes
Coloque `Qurova.woff2` e `Agency.woff2` (ou .otf/.ttf) na pasta `fontes/`. Confira a licença de cada fonte.
