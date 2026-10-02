# resume-hypergraph

Turns a resume into an interactive graph for a personal website. The person sits in the
centre, the things they have done sit around them in groups, and skills sit at the edges.
A skill is a hyperedge: it connects every place it was used, and each connection carries
one sentence saying what was done there with it.

The result is one HTML file. Plain HTML, CSS and JavaScript, no build step, no libraries.

## Three ways to use it

**1. With Claude Code (the full version).** Clone this repo, then inside Claude Code:

    /plugin marketplace add /path/to/resume-hypergraph
    /plugin install resume-graph

Then give it a resume: `/resume-graph:resume-graph my-cv.pdf`, or just say "turn my resume
into a graph". It reads the resume, looks up each employer and school on the web, writes
the sentences, checks them against the resume, and builds the page.

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

**3. By hand.** Write the data file yourself (format: `skills/resume-graph/PROFILE-FORMAT.md`,
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
- http://localhost:8131/ is an upload page: drop a data file, see the graph, edit, download.
  Reading a resume straight from this page needs a server part (`api/extract`) that is not built.

## What is where

| Path | What |
|---|---|
| `view/` | The page: `index.html`, `graph.js`, `style.css`, sample data |
| `skills/` | The Claude skill and its steps |
| `scripts/profile.mjs` | Checks a data file and builds the one-file page |
| `scripts/check-layout.py` | Loads every sample at four screen sizes, fails on overlapping labels |
| `research/` | Notes on resume sections across professions and on existing resume formats |

The graph folds long groups into a "+ N more" row and shows a plain list on phones.

MIT licence.
