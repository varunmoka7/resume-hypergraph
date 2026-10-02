# resume-hypergraph

Turns a resume into an interactive graph for a personal website. The person sits in the
centre, the things they have done sit around them in groups, and skills sit at the edges.
A skill is a hyperedge: it connects every place it was used, and each connection carries
one sentence saying what was done there with it.

The result is one HTML file. Plain HTML, CSS and JavaScript, no build step, no libraries.

See it live: [varunmoka.com](https://varunmoka.com), the site this tool grew out of. More
examples with made-up people: https://resume-hypergraph.vercel.app

## Ways to use it

**1. With Claude Code (the full version).** Inside Claude Code:

    /plugin marketplace add varunmoka7/resume-hypergraph
    /plugin install resume-graph@resume-hypergraph

Then give it a resume: `/resume-graph:resume-graph my-cv.pdf`, or just say "turn my resume
into a graph". It runs in one go without questions: it reads the resume, starts one agent per
employer and school to look each up on the web, fetches their logos, writes the sentences,
has a separate agent check them against the resume, builds the page and opens it.

| Command | Step |
|---|---|
| `/resume-graph:resume-graph` | The whole thing |
| `/resume-graph:read` | Read the resume, sort entries into groups |
| `/resume-graph:company` | Research one organisation and write that entry's panel |
| `/resume-graph:skills` | Choose the skills and write one sentence per place used |
| `/resume-graph:check` | Check every sentence against the resume |
| `/resume-graph:publish` | Build the page |

**2. With Claude on the web.** Run `sh scripts/pack-skill.sh`, upload `dist/resume-graph.zip`
under Settings, Capabilities, Skills, then share a resume in a chat and ask for a graph.
Not yet tested there.

**3. With Codex, Gemini CLI, Cursor or another agent.** The skill is plain instructions plus one
Node script, so any agent that reads files and runs commands can follow it.

| Agent | How |
|---|---|
| Any of them | Clone this repo, open it in the agent and say "turn my resume at ~/cv.pdf into a graph". `AGENTS.md` tells it what to do. |
| Codex | `sh scripts/pack-skill.sh`, then `cp -R dist/resume-graph ~/.codex/skills/`. The skill is then available in every project. |
| Gemini CLI | `gemini extensions install https://github.com/varunmoka7/resume-hypergraph` |
| Others with a skills folder | Copy `dist/resume-graph` into it (`~/.agents/skills/` is common). |

Agents without subagents do the company research one entry at a time; the result is the same.

**4. By hand.** Write the data file yourself (format: `skills/resume-graph/PROFILE-FORMAT.md`,
examples in `view/data/`) and build:

    node scripts/profile.mjs build my-profile.json index.html

## What it will not do

- It does not invent. Sentences about the person come from the resume; a number that is not
  in the resume fails the check.
- It does not publish private details: phone, street address, date of birth, marital status,
  references. Contact links only with a yes.
- It does not describe an organisation it could not find.

## Look at it locally

    python3 scripts/serve.py 8131

- http://localhost:8131/view/ is the graph (`?p=short` and `?p=long` for the other samples).
  All sample people and companies are made up.
- http://localhost:8131/ is the front page: examples, how to make your own, and a drop zone
  that opens a data file the tool made so you can see the graph, edit it and download the page.
  It does not read resumes; the tool does that inside your agent.

## What is where

| Path | What |
|---|---|
| `view/` | The page: `index.html`, `graph.js`, `style.css`, sample data |
| `skills/` | The Claude skill and its steps |
| `agents/` | The two agents the skill starts: one profiles an entry, one checks the result |
| `AGENTS.md` | Instructions for Codex, Gemini CLI and other agents |
| `examples/` | A made-up resume to try it on |
| `scripts/profile.mjs` | Checks a data file and builds the one-file page |
| `scripts/check-layout.py` | Loads every sample at four screen sizes, fails on overlapping labels |
| `research/` | Notes on resume sections across professions and on existing resume formats |

The graph folds long groups into a "+ N more" row and shows a plain list on phones.

MIT licence.
