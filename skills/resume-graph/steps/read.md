# Step 1: read the resume

## Get the text

- PDF: read it directly. If the text layer is broken (letters run together, columns interleaved), read the pages as images.
- Word (.docx): `textutil -convert txt file.docx` on a Mac, `pandoc file.docx -t plain` elsewhere, or unzip it and strip the tags from `word/document.xml`.
- JSON Resume (`basics`, `work`, `education`, ...): the structure maps straight across; still write the sentences yourself.
- Two-column layouts (common in German and Europass CVs): the dates are in the left column and belong to the entry on their right.

Save all of it, one resume after another, as `resume-graph/resume.txt`: plain text in reading order, every number and date exactly as printed. A table row becomes one line with its cells separated by ` | `. The check compares numbers against this file, and later steps quote from it.

## Several versions of one resume

Merge them into one person. The same employer with overlapping dates is one entry; keep the most detailed wording. If two versions disagree on a date or a title, use the most recent resume and note the disagreement for the final message.

## Sort every entry into a group

| Resume heading (and its relatives) | Group id |
|---|---|
| Work experience, employment, professional experience, Berufserfahrung, internships, placements, clerkships, military service, research positions | `work` |
| Education, degrees, Ausbildung, apprenticeship, residency, fellowship training, executive programmes | `education` |
| Projects, open source, hackathons, portfolio pieces, case studies | `projects` |
| Founded companies, self-employment | `venture` |
| Freelance, consulting practice, clients | `freelance` |
| Publications, papers, patents, books | `publications` |
| Teaching, courses taught, supervision, workshops | `teaching` |
| Talks, presentations, press, interviews | `talks` |
| Exhibitions, shows, commissions, collections | `exhibitions` |
| Certifications, licences, registrations, tickets | `credentials` |
| Awards, honours, scholarships, grants, fellowships | `awards` |
| Boards, advisory roles, committees, peer review, memberships | `service` |
| Volunteering, student societies, community roles | `volunteering` |
| Interests, hobbies | `personal` |

A heading that fits none of these keeps its own name: make an id from it (`field-deployments`), use it as the group, and add `{id, label}` to `groups` with the heading as written. Never drop such a section and never put it under `work` to be safe.

Sort by what an entry is, not by where it sits on the page. A mixed table ("Additional experience", "Other") is sorted row by row. A course or team project goes in `projects`. Keep each group's entries in the resume's order, most important first.

## Rules for entries

- **One employer, several titles:** one node. The titles and their dates go in a section called "Role progression" in step 2. Split into two nodes only when the roles were in clearly different functions or places.
- **Several organisations on one line** ("Part-time: Flink, Picnic, Wen Cheng"): one node each when the resume gives each its own role or dates. Otherwise one node, labelled as the resume labels it, and step 2 gives it no `org`.
- **Jobs that overlap in time** are normal. Keep both and do not comment on it.
- **Internship, part-time job, working student:** group `work`, and say so in `kind` ("Intern, controlling · Feb 2025 to Jul 2025").
- **Freelance with many clients:** one node for the practice; the clients become a section in step 2. Name a client only if the resume names it.
- **Long lists** (forty publications): one node each, in the resume's order. The page folds the tail away.
- **An award, grade, thesis or scholarship that belongs to one degree or job** is part of that node (`grade`, or a line in a section), not a node of its own.
- **Dates:** copy them as written into `period` and `kind`. Compute `months` only when start and end are both known ("today" counts as now), counting the first and the last month: Oct 2025 to Jun 2026 is 9. Never guess a date; undated entries simply have none.
- **Gaps:** do not mention or explain them. A career break is a node only if the resume lists it as one.
- **Summary or profile paragraph:** becomes `roleLine` (at most about 12 words, in the person's own words where you can) and, if they state what they want next, `next`. The rest of the paragraph is not shown anywhere.
- **Languages:** go in `languages` with the level as written.
- **A plain list of skills:** keep it aside for step 4. It is not a group.
- **Contact details and personal data:** see rule 3 in SKILL.md. Note what you left out so you can report it.

At this point the file looks like this. Every node needs `id`, `group`, `label`, `kind`, `text` and `skills` (empty for now); the rest only where the resume gives it.

```json
{
  "name": "Lena Hoffmann",
  "roleLine": "Final-year economics student looking for a first analyst role.",
  "links": [{ "label": "LinkedIn", "url": "https://www.linkedin.com/in/example" }],
  "nodes": [
    { "id": "stadtwerke", "group": "work", "label": "Stadtwerke Leipzig",
      "kind": "Intern, controlling · Feb 2025 to Jul 2025", "months": 6,
      "role": "Intern, controlling", "period": "Feb 2025 to Jul 2025", "location": "Leipzig",
      "text": "Six-month internship in the controlling team.", "skills": [] }
  ],
  "skills": []
}
```
