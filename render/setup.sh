#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .work
python3 -m venv .work/venv
. .work/venv/bin/activate
pip install -q -r requirements.txt
clone() {
  [ -d ".work/$1" ] || git clone -q "https://github.com/facebookresearch/$1.git" ".work/$1"
  git -C ".work/$1" checkout -q "$2"
}
clone sam-3d-body b5c765a0d89d789985e186d396315e7590887b94
clone dinov3 6876159a11b4df116f30f667f8c9888617df0751
curl -sSfL -o .work/mpfb.zip "https://extensions.blender.org/download/sha256:4f0a879d64a39bf646fbf5f53601ac678855da329d650617dca5737548239a87/add-on-mpfb-v2.0.17.zip"
curl -sSfL -o .work/mh_assets.zip https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip
unzip -o -q .work/mh_assets.zip -d .work/mhdata
python -c "import bpy, os; bpy.ops.extensions.package_install_files(filepath='$PWD/.work/mpfb.zip', repo='user_default', enable_on_install=True); bpy.ops.wm.save_userpref(); os._exit(0)"
python character.py
hf download facebook/sam-3d-body-dinov3 --local-dir .work/sam-3d-body-dinov3
