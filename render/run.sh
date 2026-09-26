#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
. .work/venv/bin/activate
ffmpeg=$(python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
python pose.py "$@"
mkdir -p .work/out
failed=()
for id in "$@"; do
  rm -rf ".work/frames/$id"
  if ! RES="${RES:-440}" python animate.py "$id" ".work/frames/$id"; then
    echo "Skipped $id" >&2
    failed+=("$id")
    continue
  fi
  "$ffmpeg" -y -loglevel error -framerate 24 -i ".work/frames/$id/f_%04d.png" \
    -vf "scale=400:400,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 ".work/out/$id.gif"
done
if ((${#failed[@]})); then
  echo "Failed: ${failed[*]}" >&2
  exit 1
fi
