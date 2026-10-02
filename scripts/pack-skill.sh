#!/bin/sh
# Packs the skill as one self-contained folder and zip: dist/resume-graph/ and dist/resume-graph.zip.
# The zip is for upload to Claude on the web (Settings, Capabilities, Skills). The folder can be copied into any
# agent's skills directory (~/.codex/skills, ~/.agents/skills, ~/.claude/skills).
# Usage: sh scripts/pack-skill.sh
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/resume-graph/scripts
cp -R skills/resume-graph/. dist/resume-graph/
cp scripts/profile.mjs dist/resume-graph/scripts/
mkdir dist/resume-graph/view && cp view/index.html view/graph.js view/style.css dist/resume-graph/view/ && cp -R view/fonts dist/resume-graph/view/
(cd dist && zip -qr resume-graph.zip resume-graph)
echo "dist/resume-graph.zip"
