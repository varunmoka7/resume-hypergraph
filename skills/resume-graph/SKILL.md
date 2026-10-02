---
name: resume-graph
description: Turn a resume or CV into an interactive graph page for a personal website. The person sits in the centre, their jobs, studies and projects sit around them in groups, and each skill connects every place it was used with one sentence of evidence. Use when someone shares a resume (PDF, Word, text, JSON Resume) and asks to "turn my resume into a graph", "make a hypergraph of my CV", "build my resume graph", "make a portfolio page from my resume", or runs /resume-graph.
---

# Resume graph

You turn one person's resume into one data file (`profile.json`) and one web page (`index.html`) that draws it. The page is theirs to put on their own site.

**ROOT** is the folder that contains both `scripts/profile.mjs` and `view/`. Look in this skill's own folder first; if they are not there, it is the folder two levels up (the repository root, where the sibling folders `read`, `company`, `skills`, `check` and `publish` are one-step shortcuts into this same skill). Find it once and use it for every path below. Run every command from the folder that contains `resume-graph/`, the working folder.

Read `PROFILE-FORMAT.md` (next to this file) before writing any data.

## Three rules that hold in every step

1. **Nothing about the person is invented.** Every sentence about what they did comes from their resume. You may shorten and reword. You may not add a fact, a number, a tool or a result the resume does not state. Numbers are copied exactly.
2. **Facts about organisations come from a page you opened**, and the address goes in `org.source`. If you cannot find or cannot tell which organisation it is, leave `org` out. Never describe a company from memory.
3. **Private details stay out**: phone number, street address, date and place of birth, marital status, nationality, religion, parents' names, licence and registration numbers, references. Email and other contact links go in only if the person says yes.

## Run it in one go

Do all six steps without stopping to ask. The person asked for a graph, and a finished page they can look at is easier to judge than questions about a draft. Stop only if there is no resume to read. Things you would have asked go in the final message as "say if you want this changed".

**Which file:** the one the person gave. If they gave none, look in the current folder for a PDF, Word or text file whose name contains cv, resume, lebenslauf or curriculum. One match: use it. Several that look like versions of the same person's resume: use them all. None: ask for the file.

**Contact links, without asking:** keep the public profile links printed on the resume (LinkedIn, GitHub, a personal site, a portfolio). Leave out the email address and everything else in rule 3.

Work in a folder named `resume-graph/` in the current directory unless told otherwise. Each step has its own file under `steps/`; read it when you get there.

1. **Read** (`steps/read.md`). Get the plain text of every resume, save it as `resume-graph/resume.txt`, and write a first `resume-graph/profile.json` with the profile fields and one bare node per entry. No `org`, no `sections`, no skills yet.
2. **Profile each entry** (`steps/company.md`), in parallel. For every node that names an organisation or has more than a line of detail, start a `company-profiler` agent, all in one message, each given ROOT, the node, and the resume lines that belong to it. With more than twelve such nodes, give each agent two or three. Merge what they return into `profile.json`.
   - No `company-profiler` agent type: start ordinary subagents on a mid-size model with the same input and tell them to follow `steps/company.md`.
   - No subagents at all (Claude on the web): do the nodes yourself, one after another.
   - No web access: skip the `org` blocks and say so at the end.
3. **Logos.** `node ROOT/scripts/profile.mjs logos resume-graph/profile.json`. It takes each organisation's icon from its own website (through `org.url`) and stores it in the node, so the mark in the graph and the panel show the logo. Entries it finds nothing for keep the plain shape. Without network access, skip it.
4. **Skills** (`steps/skills.md`). With all nodes final, choose the skills and write the `uses` sentences.
5. **Check** (`steps/check.md`). Run the script and fix every error. Then start a `checker` agent with ROOT and the two file paths for the read-through (no such agent: an ordinary subagent that has not seen your drafts; no subagents: read it through yourself). Fix what it finds and rerun the script.
6. **Publish** (`steps/publish.md`). Build `resume-graph/index.html` and open it in the person's browser.

## What to say at the end

Keep it short and plain:

- where the page and the data file are, and that the page is open in their browser;
- how many entries and skills the graph has;
- what was left out and why: private details, the email address, skills with no evidence in the resume, organisations you could not identify;
- anything you decided for them that they may want changed (a date two resume versions disagreed on, an unusual heading you kept as its own group), each as one line they can answer;
- any warning the check still prints.

Then offer: "Tell me what to change and I'll rebuild it." Do not describe the graph as impressive; the person will look at it.
