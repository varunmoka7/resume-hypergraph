# resume-hypergraph: instructions for AI agents

This repository turns a resume into an interactive graph page. Any agent that can read files and run `node` can do it. Codex, Gemini CLI, Cursor and others read this file; Claude Code uses the plugin in `.claude-plugin/`.

## When someone asks for a graph of their resume

Read `skills/resume-graph/SKILL.md` and follow it from start to finish. ROOT, as that file uses the word, is this repository's folder. Work in a folder called `resume-graph/` inside the person's current directory, not inside this repository.

The skill names two helper agents, `company-profiler` and `checker`. If your tool has subagents, use them the way the skill describes; their instructions are in `agents/`. If it has none, do those parts yourself in order. Everything else is plain files and four commands:

    node ROOT/scripts/profile.mjs check resume-graph/profile.json resume-graph/resume.txt
    node ROOT/scripts/profile.mjs links resume-graph/profile.json
    node ROOT/scripts/profile.mjs logos resume-graph/profile.json
    node ROOT/scripts/profile.mjs build resume-graph/profile.json resume-graph/index.html resume-graph/resume.txt

Three rules hold throughout: nothing about the person is invented, facts about organisations come from a page you opened, and private details stay out. The skill spells them out.

To try it on a made-up resume: `examples/lena-hoffmann-resume.txt`.

## When working on this repository itself

- `view/` is the published page: plain HTML, CSS and JavaScript, no libraries and no build step. Keep it that way.
- After changing `view/`, run `python3 scripts/serve.py 8131` and `browser-harness < scripts/check-layout.py` (every sample, four screen sizes, no overlapping labels).
- After changing `scripts/profile.mjs` or the data format, run `node scripts/profile.mjs check` on each file in `view/data/`.
- The data format is defined once, in `skills/resume-graph/PROFILE-FORMAT.md`.
- Sample people and companies are made up. Do not add a real person's resume to the repository.
