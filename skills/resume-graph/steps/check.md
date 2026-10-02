# Step 5: check

## Run the script

```
node ROOT/scripts/profile.mjs check resume-graph/profile.json resume-graph/resume.txt
```

Run it from the folder that contains `resume-graph/`. It fails on: missing fields, ids that do not match, a group that is neither standard nor named in `groups`, a list field (`sections`, `items`, `technology`, `skills`) that is not a list, a node-skill pair with no `uses` sentence, unsafe links, and any number in what the profile says about the person that does not appear in the resume. It warns on: text that looks like a phone number or other private detail, organisation descriptions with no source, unconnected skills, labels that will be cut.

Fix every error in the data, not by loosening the wording until it passes. A number that is not in the resume is removed or corrected to what the resume says. Read each warning and either fix it or be ready to say why it stands.

Then check the links, if there is network access:

```
node ROOT/scripts/profile.mjs links resume-graph/profile.json
```

It opens every `org.url`, `org.source` and contact link. A page that is gone fails. A page that moved prints its new address: use that one. A page that refuses scripts is only reported; open it yourself.

If `node` is not available, do the same checks by reading: the lists above are all the script does.

## Read it through

The script cannot tell whether a sentence is true to the resume. Someone has to read. If you can start a subagent, give this part to one that has not seen your drafts: ROOT, the paths of `profile.json` and `resume.txt`, and this file. It needs web access to open the sources. Otherwise do it yourself, slowly.

For every node `text`, every section item and every `uses` sentence: find the resume line that supports it. Mark it unsupported if it adds a result, a scale, a tool, a responsibility or a cause the resume does not state. Unsupported sentences are cut back to what the resume says, or removed.

For every `org`: open `org.source` and confirm it is the right organisation and that the page states the description, the industry and the headquarters. Whatever the page does not state comes out.

Also confirm: no private detail from rule 3 anywhere; no contact link the person did not agree to; nothing from the resume silently missing (every entry on the resume is a node, part of a node, or on your list of things left out).

Rerun the script after any change.
