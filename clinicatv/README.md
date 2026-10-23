# Clínica TV
TV indoor para clínicas: publicações com efeitos, recados, clima, programação do dia, frases, serviços, rádio e barra de notícias com data e hora. Idealizado por Waldeci Ramos.

## Dois modos, o mesmo pacote
- **GitHub Pages**: envie `index.html, admin.html, acesso.json, config.json, logo.svg, assets/, fontes/, midia/`; Settings → Pages → `main` / root. No GitHub o admin salva no navegador; para atualizar as TVs baixe o `config.json` (Publicar e Backup) e substitua no repositório (TVs atualizam em até 2 minutos). Fotos e vídeos vão na pasta `midia/`.
- **Servidor Debian (rede interna)**: `sudo bash instalar-debian.sh` (instala Node, cria o serviço `clinicatv`, define a senha do painel). Tudo é salvo no servidor, envio de fotos/vídeos pelo painel e TVs atualizam ao vivo. Passo a passo completo em **MANUAL-DEBIAN.html**.

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

## Novidades da versão 8.1
- **Sem a faixa de serviços** ("barrinhas"): removida da tela e do painel.
- **Clima**: o dia de hoje fica maior e destacado; "máx" e "mín" escritos.
- **Logo da clínica** na coluna lateral, entre a programação do dia e a rádio (Identidade → Logo na coluna lateral).
- **Propagandas em JPG** já incluídas em `midia/` (APAE, palmilhas, logo).
- **Zonas** (tipo de propaganda): monte a tela com vários quadros de imagem, vídeo, YouTube e texto, arrastando e redimensionando.
- **YouTube** com API oficial: duração 0 = toca até o fim e volta aos slides; opção de som e de início.
- **Vídeos**: aviso na tela quando um vídeo não abre, plano B em `.webm`, passa adiante se travar; `converter-video.sh` converte para H.264+AAC.
- **Rádio**: o gráfico usa o sinal real quando a rádio permite e nunca fica parado.

- **Tela em zonas (mosaico)**: aba "Tela em zonas" — a tela central fica dividida em várias zonas fixas, cada uma com a sua lista de imagens e vídeos e ajuste preencher/inteiro/esticar.
