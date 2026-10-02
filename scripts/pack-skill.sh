#!/bin/sh
# Packs the skill as one self-contained zip for upload to Claude on the web (Settings, Capabilities, Skills).
# Usage: sh scripts/pack-skill.sh   ->   dist/resume-graph.zip
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/resume-graph/scripts
cp -R skills/resume-graph/. dist/resume-graph/
cp scripts/profile.mjs dist/resume-graph/scripts/
mkdir dist/resume-graph/view && cp view/index.html view/graph.js view/style.css dist/resume-graph/view/
(cd dist && zip -qr resume-graph.zip resume-graph)
echo "dist/resume-graph.zip"
