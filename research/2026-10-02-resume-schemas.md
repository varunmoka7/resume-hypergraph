# Resume data standards and tools: what to build on

Date: 2026-10-02. Time-boxed web research (about 20 minutes). Items marked UNVERIFIED were not confirmed from a primary source.

## 1. Schema comparison

| Schema | Sections covered | Strengths | Gaps | Licence | Adoption |
|---|---|---|---|---|---|
| JSON Resume | basics, work, volunteer, education, awards, certificates, publications, skills, languages, interests, references, projects, meta | Plain JSON, small, one JSON Schema (draft 7), many themes, many converters | Skills are a flat list with keywords; no link from a skill to a job; one `highlights` string list per job | MIT (old repo). The schema now lives in the jsonresume.org monorepo (`packages/schema`, npm `@jsonresume/schema`). The old repo was archived 2026-06-12 | De facto standard among developers. Old repo 2.4k stars. Registry claims 400+ theme packages on npm (a search summary; one source said about 46 "official"; count UNVERIFIED) |
| Europass | XML v3.0: personal info, work experience, education and training, skills and competences, achievements, attachments. A JSON variant exists on the Europass portal. Newer "Europass Learning Model" covers credentials | Official in the EU; strong language and education fields | XML v3.0 is archived and no longer maintained; the current Europass profile JSON shape was not read by me (UNVERIFIED); heavy | No licence stated on the catalogue page; owned by CEDEFOP/EU | Large in the EU, mostly through the Europass web editor rather than as an open data format |
| schema.org Person | `hasOccupation` (with Role for dates), `worksFor`, `alumniOf`, `hasCredential`, `knowsAbout`, `knowsLanguage`, `award`, `skills` | Linked-data friendly; Google reads it as JSON-LD, useful for SEO on a personal site | Not designed as a resume; no bullets per job; Role-with-dates is awkward | CC BY-SA 4.0 (docs); free to use | Very wide as markup, rare as a resume exchange format |
| HR Open Standards (HR-XML / HR-JSON) | Resume/CV project covers education, work experience, certifications; also Candidate and PositionOpening. JSON Schema and XSD exist | Built for system-to-system exchange between recruiting software | Heavy, enterprise-shaped; I could not find the exact current Candidate schema page (UNVERIFIED); no public developer community around personal sites | Standards stated as free to download | Used in recruiting vendors and US government (per secondary sources), not by individuals |
| LinkedIn data export | Not a schema, a CSV archive. Files seen in third-party tools: Profile, Positions, Education, Skills, Certifications, Recommendations, Posts, Connections (full export only) | Where most people already have their data; Positions has one row per role | CSV, column names change over time; skills are not tied to positions; no projects text guarantee. I did not download a real export, so file and column lists come from third-party tools (UNVERIFIED) | LinkedIn terms; it is the user's own data | Nearly everyone with a professional profile |
| FRESH / FRESCA | employment, skills, education, projects, publications, speaking, awards, writing, affiliation, languages, more | Richer than JSON Resume; converts to and from JSON Resume (HackMyResume) | Smaller community; HackMyResume is its main tool | MIT; 558 stars, 77 commits | Low. Looks dormant (activity dates UNVERIFIED) |

Other schemas I did not research: Open Skills / ESCO (EU skill taxonomy), O*NET, Open Badges, W3C Verifiable Credentials. ESCO is the one that might matter if we ever want to normalise skill names.

## 2. JSON Resume against our profile.json

Our shape (from `data/profile.json`): `name`, `roleLine`, `next`, `links[]`, `nodes[]` (id, group, label, kind, months, text, role, period, location, org{}, sections[{title, items[]}], skills[], technology[]), `skills[]` (id, label, intro, uses{nodeId: sentence}).

| JSON Resume | Our field | Fit |
|---|---|---|
| `basics.name` | `name` | Clean |
| `basics.label` | `roleLine` | Clean |
| `basics.summary` | none (closest: `roleLine`, `next`) | Partial; we have no summary paragraph |
| `basics.email/phone/url/profiles/image/location` | `links[]` (email, LinkedIn, GitHub as label+url) | Maps by converting profiles into links. We have no phone, image or location |
| `work[]` (name, position, location, startDate, endDate, summary, highlights, url, description) | node with group `work`: label, role, location, period, text, sections, org.url | Maps. We use a free-text `period`; they use ISO dates. We compute `months` from dates, so ISO dates are better input. Their `highlights` is a flat list, our `sections` is titled groups of items |
| `volunteer[]` | node, group `work` or a `volunteer` group | Clean if we allow any group name |
| `education[]` (institution, area, studyType, dates, score, courses) | node, group `education`: label, role as degree | Clean; `score` and `courses` have no slot |
| `projects[]` (name, description, highlights, keywords, dates, url, roles, entity, type) | node, group `projects` | Clean; `keywords` become skills |
| `awards[]`, `certificates[]`, `publications[]` | nodes in their own groups | Clean if groups are free-form |
| `languages[]`, `interests[]` | `interests` could become the `personal` group nodes (our "Cycling"); `languages` have no node home | Partial |
| `references[]` | none | We lack it; probably should not add it |
| `skills[]` (name, level, keywords) | `skills[]` (id, label, intro) without `uses` | Only the label maps. Their `level` and `keywords` have no equivalent |
| `meta` | none | Ignore |

What we have that they lack:
- `skills[].uses`: one sentence per skill-per-node connection. This is the core idea and has no home in JSON Resume.
- Node `skills[]` linking a node to skill ids (a hyperedge incidence list).
- Groups as an open set of labels (JSON Resume has fixed sections, which act as the group).
- `org` block, `technology[]`, `intro`, `next`.

What they have that we lack: `summary`, `phone`, `image`, `profiles` with usernames, `score`, `courses`, `level`, `references`, `languages` as first-class, ISO dates, `meta`.

Practical consequence: converting JSON Resume to our format is lossy in only a minor way, but it yields a graph with no skill-to-node sentences. Those must be produced by the model (or typed by the person). Converting ours to JSON Resume is easy and loses `uses` sentences, except that each could be appended to that node's `highlights`.

## 3. Recommendation

Do these, in this order of value:

1. Accept JSON Resume as an input. Cost: a small converter (about 100 lines, no model call needed for the structure; one model call to write the `uses` sentences from highlights). Benefit: anyone who already has a JSON Resume file, a Reactive Resume export (it exports JSON and imports JSON Resume; export shape UNVERIFIED), or ResuLLMe output can bring it. This also gives us a deterministic path with no model for the part that is just structure.
2. Export to JSON Resume. Cost: another small converter. Benefit: person can reuse their data with 400+ themes and say the tool does not lock them in. Low risk. Do it after input.
3. Do not make JSON Resume the intermediate format the model writes. Reason: it has no place for the thing we care about (skill-at-node sentences), so we would need a custom extension block anyway, and then the model would write two things. Keep our own `profile.json` as the model target. Cost of doing it the other way: either an `x-` extension or a second file, plus forcing every node into the fixed section names.
4. Do not ignore it. Ignoring means every user with existing data starts over, and the largest set of ready-made converters, parsers and sample files targets this schema.

LinkedIn export (CSV zip) is the second most useful input. Reading Positions.csv, Education.csv, Skills.csv with a small CSV reader and one model pass is cheap and covers the largest group of people. Verify the real column names against an actual export before building (I did not).

Europass, HR Open and schema.org: skip as inputs for now. Consider emitting schema.org Person JSON-LD into the page head later, because it is cheap and helps search engines.

## 4. Parsers and builders

| Project | What it does | Licence | Maintained? | Output |
|---|---|---|---|---|
| OpenResume (xitanggg/open-resume) | Browser resume builder and PDF parser, all client-side, uses PDF.js | AGPL-3.0 | 8.9k stars; recent activity UNVERIFIED | PDF built with react-pdf; parser result is an internal structure |
| Reactive Resume (AmruthPillai) | Self-hostable builder, 15 templates, imports JSON Resume | MIT | 43.7k stars, 6k+ commits, looks active; last release date UNVERIFIED | JSON, PDF, DOCX |
| pyresparser | Python NLP parser for PDF and DOCX | licence not confirmed (I believe MIT; UNVERIFIED) | 957 stars, 73 commits, Travis badge, probably dormant | Dict: name, email, mobile, skills, total experience, college, degree, designation, companies |
| ResuLLMe (IvanIsCoding) | Streamlit app: PDF or Word to LLM (OpenAI or Gemini) to JSON Resume to LaTeX PDF | MIT | 476 stars, 143 commits; last commit date UNVERIFIED | JSON Resume plus PDF |
| jsonify-resume (ashishbinu) | CLI: PDF to JSON Resume through OpenAI | MIT | 7 stars, 4 commits, uses the revchatgpt library; treat as abandoned | JSON Resume |
| ResumeParser (PublicityPort) | Hybrid ML and rules parser to JSON | not checked | not checked | JSON |
| HackMyResume | CLI that builds from FRESH or JSON Resume and converts between them | MIT (UNVERIFIED) | older project | HTML, PDF, Word, LaTeX, Markdown |
| lockedin (daypunk) | Builds a markdown ontology of personal experience from interviews and PDF/DOCX/MD/TXT | not checked | not checked | Markdown vault, rendered resumes |

What we can reuse for text extraction (no model needed for this step):

| Need | Library | Licence | Note |
|---|---|---|---|
| PDF text, in browser | pdfjs-dist (Mozilla PDF.js) | Apache-2.0 | The standard choice; OpenResume uses it |
| PDF text, serverless or edge | unpdf (unjs) | MIT | Bundles a serverless build of PDF.js; works in Node, Deno, Bun, browser |
| Word .docx text | mammoth.js | BSD-2-Clause | .docx only, not old .doc |
| Plain text | none | | |
| Scanned PDFs | not covered | | Would need OCR (for example tesseract.js, Apache-2.0, UNVERIFIED) or a vision-capable model reading the PDF directly |

Do not copy code from OpenResume: AGPL-3.0 would apply to our tool and to anything built on it. Reading it for ideas is fine.

Alternative to extraction libraries: send the PDF straight to a model that accepts files. That removes the extraction step but ties the tool to that provider and sends the whole file; text extraction first is cheaper and lets us keep the person's file on their machine until they choose to send text.

## 5. Prior art for resume as graph

I found nothing that matches the idea (skills as hyperedges across jobs, each link carrying a sentence of evidence, drawn on a personal website). Closest items:

- SkillSet (Jac21/SkillSet): front-end demo that turns the JSON Resume `skills` section into a D3 force graph of categories and keywords. Differs: it only draws skill categories, with no jobs, no per-job evidence, no hyperedges. I only saw it through mirror pages; the original repo URL is UNVERIFIED.
- JSON Resume "Jobs Graph" and "Similarity Engine" (jsonresume.org docs 021 and 018): react-force-graph views of job listings and resume similarity, with a resume node as anchor. Differs: it is about matching a resume to job postings, not showing one person's history.
- lockedin: builds a personal experience knowledge graph as markdown from interviews and documents, then renders resumes. Differs: the graph is a private ontology for generating documents, not an interactive public visual. Details UNVERIFIED beyond the summary.
- skills_graph (avk0): relations between technologies from job postings. Different problem.
- Neo4j / networkx / pyvis tutorials and the cognee HR resume-screening example: build graphs from many resumes for screening. Differs: recruiter side, many people, not one person's page.
- Academic work on knowledge graphs built from public resume data (extracting careers and colleague links for talent management). Not an end-user tool.

Honest limit: the search was a few queries, not an exhaustive GitHub search. A similar personal-site project may exist under terms I did not try ("career graph", "portfolio graph", "skill constellation"). Worth one more pass on GitHub topic search before announcing the project as novel.

## 6. Sources

- https://raw.githubusercontent.com/jsonresume/resume-schema/master/schema.json
- https://github.com/jsonresume/resume-schema
- https://jsonresume.org/themes/ and https://registry.jsonresume.org/themes (via search result)
- https://jsonresume.org/docs/021-jobs-graph
- https://jsonresume.org/docs/018-similarity-engine
- https://interoperable-europe.ec.europa.eu/collection/employment-and-working-conditions/solution/europass-xml-schema-v30
- https://interoperable-europe.ec.europa.eu/collection/eu-semantic-interoperability-catalogue/solution/europass-xml-schema
- https://ec.europa.eu/futurium/en/europass/give-your-feedback-data-model-learning-credential-europass-digital-credentials.html
- https://schema.org/Person
- https://www.hropenstandards.org/
- https://ipsnews.net/business/2020/08/05/hr-open-standards-consortium-announces-4-3-0-rc1-candidate-release/
- https://glama.ai/mcp/servers/ittu4qjngd (LinkedIn archive reader, secondary source)
- https://github.com/fresh-standard/fresh-resume-schema
- https://github.com/hacksalot/HackMyResume
- https://www.npmjs.com/package/fresca
- https://github.com/xitanggg/open-resume
- https://github.com/AmruthPillai/Reactive-Resume
- https://github.com/OmkarPathak/pyresparser
- https://github.com/IvanIsCoding/ResuLLMe
- https://github.com/ashishbinu/jsonify-resume
- https://github.com/unjs/unpdf
- https://openapps.pro/packages/mammoth-js and https://licenses.dev/npm/pdfjs-dist/2.4.456 (licence confirmation via search)
- https://github.com/avk0/skills_graph
- https://www.claudepluginhub.com/skills/daypunk-lockedin-plugins-lockedin/lockedin
