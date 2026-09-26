#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .work
python3.11 -m venv .work/venv
. .work/venv/bin/activate
pip install -q -r requirements.txt
curl -sSfL -o .work/pose.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task
curl -sSfL -o .work/mpfb.zip "https://extensions.blender.org/download/sha256:4f0a879d64a39bf646fbf5f53601ac678855da329d650617dca5737548239a87/add-on-mpfb-v2.0.17.zip"
curl -sSfL -o .work/mh_assets.zip https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip
unzip -o -q .work/mh_assets.zip -d .work/mhdata
python -c "import bpy; bpy.ops.extensions.package_install_files(filepath='$PWD/.work/mpfb.zip', repo='user_default', enable_on_install=True); bpy.ops.wm.save_userpref()"
python character.py
