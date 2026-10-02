# Step 6: publish

## Build the page

```
node ROOT/scripts/profile.mjs build resume-graph/profile.json resume-graph/index.html resume-graph/resume.txt
```

This checks the data again and writes one HTML file with the styles, the script and the data inside it.

If `node` is not available, make the file by hand from `ROOT/view/index.html`: put the person's name in `<title>`, replace the stylesheet link with a `<style>` holding `view/style.css` (a page built by hand cannot carry the font files, so it shows the reader's system fonts), and replace the `graph.js` script tag with two inline scripts, the first `window.PROFILE = ` followed by the JSON with every `<` character written as `\u003c` (so nothing in the data can close the script tag), the second `view/graph.js` wrapped in `document.addEventListener('DOMContentLoaded', () => { ... })`.

A photo: if the person gave one, shrink it to about 400 by 400 pixels, and set `photo` to it as an embedded `data:image/jpeg;base64,...` value before building. Without one the page shows their initials. Do not take a photo out of the resume unasked.

## Look at it

Open `resume-graph/index.html` in the person's browser: `open` on a Mac, `xdg-open` on Linux, `start` on Windows (it works straight from the file). If you have no browser, say in the final message that nobody has looked at the page yet. If you can take a screenshot, do, and look: the graph opens when the centre is clicked, labels are readable, a click on a skill shows its sentences. Fix what is off in the data and rebuild.

## Hand it over

Tell the person:

- The page is one file. If they want a link to share, they can say "put it online" and you will do it (see below). It also works on any web host, or inside an existing page through an `<iframe>`.
- `profile.json` is the source. To change anything, edit it (or ask you to) and build again.
- Logos belong to their organisations. To drop one, delete that node's `logo` and build again.
- The page has a small "Made with resume-hypergraph" link in the corner. To drop it, set `"credit": false` in `profile.json` and build again.
- It is a public page once uploaded. They should read it once as a stranger would before they do.

Do not upload or deploy it yourself unless they ask you to.

## Put it online, when they ask

Only `index.html` goes online. Never upload `resume.txt` or the resume itself: they hold the private details the page leaves out.

Use the first of these that works, and do not ask which:

1. **An artifact**, if your tool can publish one (the Claude app, Claude Code). Publish `resume-graph/index.html` as it is. It stays private until they share it, so tell them to open the artifact's Share menu to get a link other people can open.
2. **GitHub Pages**, if `gh auth status` shows they are logged in:

   ```
   mkdir resume-graph/site && cp resume-graph/index.html resume-graph/site/ && cd resume-graph/site
   git init -q -b main && git add index.html && git commit -q -m "Resume graph"
   gh repo create resume-graph --public --source . --push
   gh api -X POST "repos/{owner}/{repo}/pages" -f "source[branch]=main" -f "source[path]=/"
   ```

   If the name `resume-graph` is taken in their account, use another one. The last command prints the address as `html_url`, `https://<their-name>.github.io/resume-graph/`. It takes a minute or two to come up: request it until it answers before you hand it over. To update the page later, copy the new `index.html` into `resume-graph/site`, commit and `git push`.
3. **By hand**, if neither works: tell them to open https://app.netlify.com/drop and drag `resume-graph/index.html` onto it.

Then give them the link, and say once that anyone who has it can read the page.
