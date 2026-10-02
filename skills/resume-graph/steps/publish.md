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

- The page is one file. Uploading it to any web host puts it online: their own site, GitHub Pages, Netlify, Vercel. To show it inside an existing page, an `<iframe>` pointing at it works.
- `profile.json` is the source. To change anything, edit it (or ask you to) and build again.
- Logos belong to their organisations. To drop one, delete that node's `logo` and build again.
- The page has a small "Made with resume-hypergraph" link in the corner. To drop it, set `"credit": false` in `profile.json` and build again.
- It is a public page once uploaded. They should read it once as a stranger would before they do.

Do not upload or deploy it yourself unless they ask you to.
