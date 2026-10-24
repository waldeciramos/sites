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

## Novidades da versão 9.4
- **Zonas dentro da propaganda**: a aba "Tela em zonas" saiu. Em *Publicações* escolha o tipo **Zonas** e monte os quadros; cada propaganda de zonas tem seu tempo e entra no rodízio. Quem usava o mosaico fixo teve o desenho convertido em uma publicação de zonas automaticamente. Cada quadro tem um **×** vermelho para tirar a zona.
- **Passar a cada N minutos**: em qualquer publicação (vídeo, imagem, zonas…) o campo *Passar a cada (minutos)* faz ela aparecer, por exemplo, de 30 em 30 minutos (assim que a que estiver na tela terminar). 0 = rodízio normal.
- **Marca d'água**: o logo da clínica saiu da coluna lateral e fica transparente no canto inferior direito do campo de propagandas (posição, tamanho e transparência em *Identidade*). `midia/logo-clinica.png` já vem com fundo transparente.
- **Celular**: ao abrir, aparece "Toque para abrir em tela cheia"; um toque no meio expande a tela e liga a rádio. No iPhone o Safari não tem tela cheia de site: use Compartilhar → Adicionar à Tela de Início.
- **Barra inferior** (dia, mês, hora e informações) com o mesmo relevo esculpido/rebaixado da lateral e a fonte do relógio (Rajdhani).
- **Trânsito/notícias**: no servidor Debian a própria TV busca a página (`/api/noticia`), sem depender de sites públicos. Precisa atualizar o `server.js` e reiniciar: `sudo systemctl restart clinicatv`. A fonte Motiva vem marcada como **Ativa**; confira em Notícias → 🔎 Buscar agora.

## Versão 9.5 — dividir qualquer publicação em zonas e TV ao vivo
- Em *Publicações*, cada item tem a opção **✂ Dividir esta tela em zonas**. Ao marcar, aparece o editor: modelos prontos (2, 3, 4, 6 zonas…), arrastar para posicionar, puxar os cantos para o tamanho, e em cada zona escolher imagem, vídeo, lista, YouTube, **TV ao vivo** ou texto. "Fundo da divisão" escolhe entre manter o conteúdo da própria publicação atrás das zonas ou só as zonas.
- **TV ao vivo** (zona ou publicação de tela toda): transmissão HLS (`.m3u8`, leitor `assets/hls.min.js` já incluído), YouTube ao vivo (link da live ou do canal `youtube.com/channel/UC…`) ou página da internet (alguns sites não permitem). Precisa de internet na TV.

## Versão 9.6 — zonas mais fáceis
- Ao marcar **✂ Dividir esta tela em zonas** numa publicação de imagem, vídeo, YouTube ou TV ao vivo, o conteúdo dela vira a **zona 1** (com o nome do arquivo) e o fundo da publicação sai, para não tocar duas vezes.
- Escolha a divisão por **miniaturas numeradas** (2 colunas, 3 colunas, 1 grande + 2, em pé no meio + 2 laterais, 4, 6 quadros…). Cada zona mostra seu **número e o nome** do vídeo/imagem dentro do quadro.
- Abaixo do quadro há um **cartão por zona**: tipo, escolher da pasta midia, enviar do computador ou colar o caminho/link. Os botões ↖ ↗ ↙ ↘ ◎ ⛶ levam a zona ao canto, ao centro ou à tela toda; você também pode **arrastar uma foto/vídeo do computador direto para o quadro**.

## Versão 9.7 — cache e pasta midia do GitHub
- **Publicar e Backup › 🧹 Cache**: *Limpar cache e recarregar* (apaga as cópias do navegador sem perder a configuração) e *Descartar o que está só neste navegador* (volta ao `config.json` publicado). Na TV, abrir `index.html?limpar=1` faz a limpeza.
- Os arquivos `index.html` e `admin.html` chamavam `assets/core.js?v=9.3`; o número agora muda a cada versão (9.7), para o navegador não usar um `core.js` velho. **Ao atualizar no GitHub, troque `assets/core.js` junto com os dois HTML.** A TV também se recarrega sozinha, já ignorando o cache, quando detecta versão nova.
- **GitHub Pages**: as listas "Escolher da pasta midia" leem a pasta `midia` do repositório pela API pública do GitHub (o repositório é descoberto pelo endereço; se precisar, ajuste em Publicar e Backup › 📂 Pasta midia do GitHub). Envie os arquivos ao repositório e use "Testar e atualizar a lista".
- **Debian**: o arquivo enviado pelo painel é gravado em `midia/` no servidor e já aparece na lista.
- Link do YouTube colado em "Vídeo MP4" (publicação, zona ou lista) vira YouTube automaticamente.

## Versão 9.8 — publicar no GitHub pelo painel
- **Publicar e Backup › 🚀 Publicar no GitHub**: envia o `config.json` direto para o repositório (sem baixar e subir à mão). Precisa de uma chave (fine-grained token) só do repositório da TV, com *Contents: Read and write*; ela fica guardada apenas no navegador do admin.
- No GitHub Pages o painel não grava no site: o que se muda fica no navegador até ser publicado. A TV lê só o `config.json` do repositório e atualiza em até 2 minutos. Se o painel mostrar versão antiga, use *Descartar o que está só neste navegador*.
