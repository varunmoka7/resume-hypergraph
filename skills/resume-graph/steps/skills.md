# Step 4: skills

A skill here is what joins the entries together: hover one on the page and a band runs to every place it was used. So a skill is only worth having if you can say, for each place, what was done there with it.

1. **Collect candidates** from two places: the resume's own skills list, and what the entries show the person doing (planning routes, running experiments, managing a team).
2. **Keep a candidate only if at least one entry's resume lines show it in use.** A skill the resume lists but never shows in use is left out; note it for the final report so the person can say where they used it.
3. **Merge near-duplicates** ("project management" and "managing projects"). Prefer the person's own wording for the label.
4. **Aim for 8 to 24 skills.** Favour those used in two or more entries, since those are the ones that draw a connection. Keep a single-entry skill only when its sentence can name a concrete thing done; if all you can write is that the skill was used there, drop it. With more than 24, drop the weakest single-entry ones.
5. **A tool or language** (Python, Excel, SAP) is a skill when the person presents it as one and it shows up in an entry. Otherwise it stays in that entry's `technology`.
6. **A spoken language** is a skill only if an entry shows it used for work. Otherwise it lives in `languages`.

For each skill write:

- `id` and `label` (short: over about 24 characters crowds the edge of the page).
- `intro`: one plain sentence on what the skill is, written for someone outside the field. It says nothing about the person.
- `uses`: for every entry that uses it, one sentence on what was done there with this skill, taken from that entry's resume lines. Different entries get different sentences. If you cannot write the sentence from the resume, the entry does not use the skill.

Then add the skill's id to the `skills` list of each of those entries. The two sides must agree: every id in a node's `skills` has a `uses` sentence for that node, and the reverse.
