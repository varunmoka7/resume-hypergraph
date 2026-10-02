# resume-hypergraph

Turns a resume into an interactive graph for a personal website. The person sits in the
centre, the things they have done sit around them in groups, and skills sit at the edges.
A skill is a hyperedge: it connects every place it was used, and each connection carries
one sentence saying what was done there with it.

Plain HTML, CSS and JavaScript. No build step.

## Run it

    python3 scripts/serve.py 8131

Then open http://localhost:8131/. `?p=short` and `?p=long` load the other samples in `data/`.
All sample people and companies are made up.

## The data file

One JSON file per person (`data/profile.json` is the default):

| Field | What it is |
|---|---|
| `name`, `roleLine`, `next` | The landing text. `next` is optional. |
| `photo`, `cv` | Optional paths under `assets/`. Without a photo the initials are shown. |
| `links` | `[{label, url}]`, web or mail addresses only. |
| `nodes` | What the person has done. Each has `id`, `group`, `label`, `kind` (one line under the label), `text`, and `skills` (ids). Optional: `months` (sets the size), `role`, `period`, `location`, `grade`, `org {description, about, hq, url}`, `sections [{title, items}]`, `technology`, `logo`, `parent`. |
| `skills` | Each has `id`, `label`, `intro`, and `uses`: one sentence per node id saying what was done there. |

Standard groups: `work`, `education`, `projects`, `venture`, `freelance`, `publications`, `teaching`,
`talks`, `exhibitions`, `credentials`, `awards`, `service`, `volunteering`, `personal`. A resume heading
that fits none of them keeps its own name: give the node any other group id and add
`groups: [{id, label}]` to the file. The same list renames a standard group ("Berufserfahrung").
Why these fourteen: `research/2026-10-02-resume-sections.md`.

A group with more rows than fit shows its first rows and a "+ N more" row that opens the full list.

`languages: [{label, level}]` is optional and shows on the landing.

## Check the layout

    browser-harness < scripts/check-layout.py

Loads every sample at four desktop sizes and fails if labels overlap or leave the screen.

## Not built yet

Turning an uploaded resume into the data file, the upload page, and the download.
