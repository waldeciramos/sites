#!/usr/bin/env bash
# Converte qualquer vídeo para um formato que toca em qualquer TV/navegador.
# Uso:  bash converter-video.sh entrada.mov [saida.mp4]
# Gera  saida.mp4 (H.264 + AAC, início rápido) e, ao lado, saida.webm (plano B para navegadores sem H.264).
# Precisa do ffmpeg:  sudo apt install ffmpeg
set -euo pipefail
IN="${1:?Informe o vídeo de entrada}"; OUT="${2:-${IN%.*}-tv.mp4}"; WEBM="${OUT%.*}.webm"
VF="scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30"
ffmpeg -y -i "$IN" -vf "$VF" -c:v libx264 -profile:v main -level 4.0 -pix_fmt yuv420p -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart "$OUT"
read -r -p "Gerar também o plano B em WebM (demora mais)? [s/N] " R
if [ "${R:-n}" = "s" ] || [ "${R:-n}" = "S" ]; then
  ffmpeg -y -i "$IN" -vf "$VF" -c:v libvpx-vp9 -b:v 0 -crf 34 -deadline good -cpu-used 4 -row-mt 1 -c:a libopus -b:a 96k "$WEBM"
fi
echo "Pronto: $OUT"
