#!/usr/bin/env bash
# Clínica TV — instalador para Debian (testado na lógica para Debian 12/13; precisa de root)
# Uso:  sudo bash instalar-debian.sh [--porta 80] [--senha MINHASENHA] [--rede 192.168.2.0/24]
#   --porta   porta do site (padrão 80)
#   --senha   senha do painel (se omitir, o script pergunta)
#   --rede    (opcional) liga o firewall (ufw) liberando SÓ essa rede para SSH e para o site
# Rodar de novo = atualizar: configurações (dados/) e arquivos enviados (midia/) são preservados.
set -euo pipefail

PORTA=80; SENHA=""; REDE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --porta) PORTA="$2"; shift 2;;
    --senha) SENHA="$2"; shift 2;;
    --rede)  REDE="$2";  shift 2;;
    -h|--help) sed -n '2,8p' "$0"; exit 0;;
    *) echo "Opção desconhecida: $1"; exit 1;;
  esac
done

[ "$(id -u)" -eq 0 ] || { echo "Rode como root:  sudo bash $0"; exit 1; }
ORIGEM="$(cd "$(dirname "$0")" && pwd)"
DEST=/opt/clinicatv
[ -f "$ORIGEM/server.js" ] && [ -f "$ORIGEM/index.html" ] || { echo "Rode o script dentro da pasta do pacote (onde estão server.js e index.html)."; exit 1; }

echo "==> 1/6 Instalando o Node.js (se faltar)"
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs ca-certificates
fi
NODEV="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODEV" -ge 18 ] || { echo "Node $NODEV é antigo. Precisa do Node 18 ou mais novo."; exit 1; }
echo "    Node $(node -v)"

echo "==> 2/6 Usuário do serviço"
id clinicatv >/dev/null 2>&1 || useradd --system --home "$DEST" --shell /usr/sbin/nologin clinicatv

echo "==> 3/6 Copiando arquivos para $DEST"
mkdir -p "$DEST/dados" "$DEST/midia"
cp -a "$ORIGEM/index.html" "$ORIGEM/admin.html" "$ORIGEM/server.js" "$ORIGEM/logo.svg" "$ORIGEM/config.json" "$DEST/"
for f in README.md MANUAL-DEBIAN.html converter-video.sh; do [ -f "$ORIGEM/$f" ] && cp -a "$ORIGEM/$f" "$DEST/" || true; done
rm -rf "$DEST/assets" "$DEST/fontes"; cp -a "$ORIGEM/assets" "$ORIGEM/fontes" "$DEST/"
[ -d "$ORIGEM/midia" ] && cp -an "$ORIGEM/midia/." "$DEST/midia/"   # não sobrescreve mídias que já existem
# 1ª instalação: parte da configuração do pacote; nas atualizações a configuração salva é mantida
[ -f "$DEST/dados/config.json" ] || cp "$ORIGEM/config.json" "$DEST/dados/config.json"

echo "==> 4/6 Senha do painel"
if [ ! -f "$DEST/dados/acesso.json" ] || [ -n "$SENHA" ]; then
  if [ -z "$SENHA" ]; then
    read -r -s -p "    Escolha a senha do painel (usuário: admin): " SENHA; echo
    read -r -s -p "    Repita a senha: " S2; echo
    [ "$SENHA" = "$S2" ] || { echo "As senhas não conferem."; exit 1; }
  fi
  [ "${#SENHA}" -ge 4 ] || { echo "Senha muito curta (mínimo 4)."; exit 1; }
  SENHA_TV="$SENHA" node -e '
    const c=require("crypto"),fs=require("fs"),salt=c.randomBytes(16).toString("hex");
    const hash=c.scryptSync(process.env.SENHA_TV,salt,32).toString("hex");
    fs.writeFileSync("'"$DEST"'/dados/acesso.json",JSON.stringify({usuario:"admin",salt,hash},null,2),{mode:0o600});'
  echo "    Senha gravada."
else
  echo "    Mantida a senha atual (use --senha para trocar)."
fi

chown -R clinicatv:clinicatv "$DEST"
chmod 640 "$DEST/dados/acesso.json"
chmod +x "$DEST/server.js" 2>/dev/null || true

echo "==> 5/6 Serviço (inicia sozinho com o servidor)"
printf 'PORT=%s\nHOST=0.0.0.0\n' "$PORTA" > /etc/clinicatv.env
cp "$ORIGEM/clinicatv.service" /etc/systemd/system/clinicatv.service
systemctl daemon-reload
systemctl enable clinicatv >/dev/null 2>&1
systemctl restart clinicatv
sleep 1.5
systemctl is-active --quiet clinicatv || { echo "O serviço não subiu. Veja:  journalctl -u clinicatv -n 50"; exit 1; }

echo "==> 6/6 Firewall"
if [ -n "$REDE" ]; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y ufw
  ufw allow from "$REDE" to any port 22 proto tcp
  ufw allow from "$REDE" to any port "$PORTA" proto tcp
  ufw default deny incoming; ufw default allow outgoing
  ufw --force enable
  echo "    Firewall ligado: só a rede $REDE acessa o SSH e o site."
else
  echo "    Não alterado (use --rede 192.168.2.0/24 para liberar só a sua rede interna)."
fi

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
SUF=""; [ "$PORTA" = "80" ] || SUF=":$PORTA"
echo
echo "Pronto!  Na TV (ou em qualquer aparelho da rede) abra:   http://${IP}${SUF}/"
echo "Painel administrativo:                                   http://${IP}${SUF}/admin.html   (usuário: admin)"
echo "Ver se está rodando:  systemctl status clinicatv     Logs:  journalctl -u clinicatv -f"
