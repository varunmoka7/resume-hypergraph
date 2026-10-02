# Step 2: profile one entry

You are given one node and the resume lines that belong to it. Return the finished node as JSON, with the same `id` and `group`. If you are a subagent, reply with the JSON first, with no code fence and no text before it, then one line on anything you could not confirm.

## The organisation (`org`)

Only for entries with a named organisation: an employer, a school, a client, an issuing body.

1. Search the web for it. Use what the resume gives you (city, industry, dates) to tell it apart from others with the same name.
2. Open its own site, or failing that a reliable profile of it. A search result snippet is not a source: open the page and read it.
3. Write:
   - `description`: one sentence on what the organisation does, in neutral words. No slogans, founders, founding year, funding or size.
   - `about`: the industry in two or three words. For a school, the kind of institution.
   - `hq`: city and country, if the page states it. Otherwise leave it out.
   - `url`: its website.
   - `source`: the address of the page you read, as it stood after any redirect. Everything in `org` must be on that page.

If you cannot find it, or cannot tell which of several it is, or the resume itself hides the name ("a European bank"), or the node names several organisations at once, leave `org` out. A missing description is fine. A description of the wrong company on someone's personal site is not.

Everything in `org` is about the organisation. Nothing in it is a claim about the person.

## The person's part

All of this comes from the resume lines you were given, and nothing else.

- `label`: the organisation's short everyday name ("WHO Europe", not the full legal name). For a project, paper or award, its title.
- `role`: the job title or degree exactly as the resume gives it. If the resume gives a department or a field but no title, leave `role` out.
- `period`, `location`, `grade`: as the resume states them. Do not work out a location from the organisation's name or its headquarters.
- `kind`: role and dates on one line.
- `text`: one or two sentences on what they did there overall. Plain verbs. No adjectives the resume does not use, and nothing the resume only implies.
- A project done for a named client: `label` is the project, and the client is named in `text`. `org` describes the client only if the resume calls it the client.
- `sections`: sort the resume's bullet points for this entry into two to four groups by what the work was about, each with a short title, in this shape: `[{ "title": "Driver app", "items": ["Cut failed first delivery attempts from 9% to 6%."] }]`. Keep every number exactly. One bullet may be tightened but must still say what the resume says. Add a "Role progression" section when there were several titles: one line per title with its dates.
- `technology`: tools and technologies the resume names for this entry.
- Leave `skills` and `logo` as they are. Later steps fill them.

A thin entry (one line on the resume) gets a `text` and no sections. Do not pad it.
