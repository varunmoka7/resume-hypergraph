# The profile data file

One JSON file holds everything the page shows. The viewer (`view/graph.js`) reads it; `scripts/profile.mjs check` validates it.

```json
{
  "name": "Arjun Mehta",
  "roleLine": "Product manager for logistics software.",
  "next": "Looking for a senior product role at a company that moves physical goods.",
  "languages": [{ "label": "German", "level": "C1" }],
  "links": [{ "label": "LinkedIn", "url": "https://www.linkedin.com/in/example" }],
  "groups": [{ "id": "field-deployments", "label": "Field deployments" }],
  "nodes": [{
    "id": "parcelway", "group": "work", "label": "Parcelway",
    "kind": "Senior Product Manager · Mar 2022 to today", "months": 55,
    "text": "Owns the driver app and the routing service for a parcel carrier.",
    "role": "Senior Product Manager", "period": "Mar 2022 to today", "location": "Hamburg",
    "org": { "description": "…", "about": "Logistics", "hq": "Hamburg, Germany", "url": "https://…", "source": "https://…" },
    "sections": [{ "title": "Driver app", "items": ["Cut failed first delivery attempts from 9% to 6%."] }],
    "technology": ["SQL", "Figma"],
    "skills": ["product", "sql"]
  }],
  "skills": [{
    "id": "sql", "label": "SQL", "intro": "Asking the database directly.",
    "uses": { "parcelway": "Delivery-attempt analysis." }
  }]
}
```

## Top level

| Field | Required | What it is |
|---|---|---|
| `name` | yes | The person's name as they write it. |
| `roleLine` | yes | One short line under the name. At most about 12 words. |
| `next` | no | One sentence on what they are looking for or working towards, if the resume says. |
| `languages` | no | `[{label, level}]`. Level as the resume gives it. |
| `links` | no | `[{label, url}]`. Web or mail addresses only. Only the ones the person agreed to publish. |
| `photo`, `cv` | no | A path under `assets/`, or for `photo` an embedded `data:image/...` picture. |
| `groups` | no | `[{id, label}]`. Names a group that is not one of the standard ones, or renames a standard one. |
| `nodes` | yes | What the person has done. |
| `skills` | yes | The skills that connect the nodes. |

## A node

| Field | Required | What it is |
|---|---|---|
| `id` | yes | Lowercase letters, digits and hyphens. Unique. |
| `group` | yes | A standard group id (below) or a custom id named in `groups`. |
| `label` | yes | The name shown in the graph: the organisation for a job or degree, the title for a project, paper or award. Short. Over about 30 characters it is cut on screen. |
| `kind` | yes | One line under the label: role and dates ("Product Manager · Jan 2019 to Feb 2022"), or the type ("Journal article · 2021", "Hobby"). |
| `text` | yes | One or two sentences on what the person did there. |
| `skills` | yes | Ids from `skills`. May be empty. |
| `months` | no | Length in months, computed from the dates. Sets the size of the mark. Leave out when undated. |
| `role`, `period`, `location`, `grade` | no | Shown as rows in the panel. |
| `org` | no | The organisation: `description` (one sentence on what it does), `about` (industry, or for a school the kind of institution), `hq`, `url`, and `source` (the page the description came from). |
| `sections` | no | `[{title, items[]}]`. The detail of the work, grouped under short titles. Several job titles at one employer go in a section titled "Role progression". |
| `technology` | no | Tools and technologies named for this entry. |
| `logo` | no | Filled in by `profile.mjs logos` from `org.url` as an embedded picture. Can also be a path under `assets/`. |
| `parent` | no | Another node's id, when this entry hangs off it. |

## A skill

| Field | Required | What it is |
|---|---|---|
| `id` | yes | Lowercase letters, digits and hyphens. Unique. |
| `label` | yes | Short name. |
| `intro` | yes | One plain sentence saying what the skill is. Not a claim about the person. |
| `uses` | yes | One sentence per node that lists this skill, keyed by node id, saying what was done there with it. |

A skill is a hyperedge: it joins every node that lists it. Every node-skill pair needs its `uses` sentence; the check fails without it.

## Standard groups

`work`, `education`, `projects`, `venture`, `freelance`, `publications`, `teaching`, `talks`, `exhibitions`, `credentials`, `awards`, `service`, `volunteering`, `personal`.

The graph shows two columns of rows. A group with more rows than fit shows the first ones and a "+ N more" row, so put the most important entries first within each group.
