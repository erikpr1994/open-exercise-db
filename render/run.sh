#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
. .work/venv/bin/activate
ffmpeg=$(python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
python pose.py "$@"
mkdir -p .work/out
for id in "$@"; do
  rm -rf ".work/frames/$id"
  RES="${RES:-440}" python animate.py "$id" ".work/frames/$id"
  "$ffmpeg" -y -loglevel error -framerate 24 -i ".work/frames/$id/f_%04d.png" \
    -vf "scale=400:400,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 ".work/out/$id.gif"
done
