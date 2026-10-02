#!/usr/bin/env node
// Checks a profile data file and builds the one-file page from it. No dependencies.
//   node scripts/profile.mjs check <profile.json> [resume.txt]
//   node scripts/profile.mjs build <profile.json> <out.html> [resume.txt]
//   node scripts/profile.mjs logos <profile.json>     fetch a logo for every entry that has org.url and no logo
//   node scripts/profile.mjs links <profile.json>     open every web address in the profile; fails on one that is gone
// With resume.txt, every number in the profile's sentences must also appear in the resume.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SAFE_URL = /^(https?:\/\/|mailto:|assets\/|data:image\/(png|jpeg|webp);base64,)/i; // same rule as view/graph.js
const ID = /^[a-z0-9][a-z0-9-]*$/;
const PRIVATE = [
  [{ test: t => (t.match(/\+?\d[\d\s().\/-]{7,}\d/g) || []).some(m => m.replace(/\D/g, '').length >= 9) }, 'looks like a phone number'], // nine digits or more, so "2014 - 2016" passes
  [/\b(date of birth|born on|born in|d\.o\.b|geboren|geburtsdatum)\b/i, 'date or place of birth'],
  [/\b(marital status|married|unmarried|verheiratet|ledig|familienstand)\b/i, 'marital status'], // not "single": it is in "single-page app"
  [/\b(religion|caste|father'?s name|nationality:|staatsangehörigkeit)\b/i, 'personal detail'],
];
const GROUPS = 'work education projects venture freelance publications teaching talks exhibitions credentials awards service volunteering personal other'.split(' '); // same ids as view/graph.js

export function check(d, resume) {
  const errors = [], warnings = [], str = v => typeof v === 'string' && v.trim();
  const list = (v, what) => { if (v == null || Array.isArray(v)) return v || []; if (what) errors.push(`${what} must be a list`); return []; }; // the page calls .map and .join on these
  if (!str(d.name)) errors.push('name is missing');
  const nodes = list(d.nodes, 'nodes'), skills = list(d.skills, 'skills');
  if (!nodes.length && !errors.includes('nodes must be a list')) errors.push('nodes is empty');
  const nodeIds = new Set(), skillIds = new Set(), groupIds = new Set([...GROUPS, ...list(d.groups, 'groups').map(g => g.id)]);
  for (const k of skills) {
    if (!ID.test(k.id || '')) errors.push(`skill id "${k.id}" must be lowercase letters, digits and hyphens`);
    if (skillIds.has(k.id)) errors.push(`skill id "${k.id}" is used twice`);
    skillIds.add(k.id);
    if (!str(k.label)) errors.push(`skill ${k.id} has no label`);
    if (!str(k.intro)) warnings.push(`skill ${k.id} has no intro`);
    if (str(k.label) && k.label.length > 28) warnings.push(`skill ${k.id}: label is ${k.label.length} characters; long skill labels squeeze every other label on the page, aim for under 25`);
  }
  for (const n of nodes) {
    if (!ID.test(n.id || '') || n.id === 'me') errors.push(`node id "${n.id}" must be lowercase letters, digits and hyphens`);
    if (nodeIds.has(n.id)) errors.push(`node id "${n.id}" is used twice`);
    nodeIds.add(n.id);
    for (const f of ['group', 'label', 'kind', 'text']) if (!str(n[f])) errors.push(`node ${n.id} has no ${f}`);
    if (str(n.label) && n.label.length > 60) warnings.push(`node ${n.id}: label is ${n.label.length} characters and will be cut on screen; put the full name in org.description`);
    if (n.months != null && !(n.months > 0)) errors.push(`node ${n.id}: months must be a positive number`);
    if (str(n.group) && !groupIds.has(n.group)) errors.push(`node ${n.id}: group "${n.group}" is not a standard group and is not named in groups`);
    list(n.technology, `node ${n.id}: technology`);
    for (const s of list(n.sections, `node ${n.id}: sections`)) if (!str(s.title) || !Array.isArray(s.items)) errors.push(`node ${n.id}: every section needs a title and a list of items`);
    for (const k of list(n.skills, `node ${n.id}: skills`)) {
      if (!skillIds.has(k)) errors.push(`node ${n.id} names unknown skill "${k}"`);
      else if (!str((skills.find(x => x.id === k).uses || {})[n.id])) errors.push(`skill ${k} has no "uses" sentence for node ${n.id}`); // the sentence is the point of the graph
    }
    if (n.org && str(n.org.description) && !str(n.org.source)) warnings.push(`node ${n.id}: organisation description has no source link`);
    for (const u of [n.logo, n.org && n.org.url, n.org && n.org.source]) if (u && !SAFE_URL.test(u)) errors.push(`node ${n.id}: "${String(u).slice(0, 60)}" is not a web address`);
  }
  for (const n of nodes) if (n.parent && !nodeIds.has(n.parent)) errors.push(`node ${n.id} names unknown parent "${n.parent}"`);
  for (const k of skills) {
    const users = nodes.filter(n => list(n.skills).includes(k.id));
    if (!users.length) warnings.push(`skill ${k.id} is not used by any node and will sit unconnected`);
    for (const id of Object.keys(k.uses || {})) if (!users.some(n => n.id === id)) errors.push(`skill ${k.id} has a "uses" sentence for ${id}, which does not list this skill`);
  }
  for (const g of list(d.groups)) if (!str(g.id) || !str(g.label)) errors.push('every entry in groups needs an id and a label');
  for (const l of list(d.links, 'links')) if (!str(l.label) || !SAFE_URL.test(l.url || '')) errors.push(`link "${l.label}" needs a label and a web or mail address`);
  for (const u of [d.photo, d.cv]) if (u && !SAFE_URL.test(u)) errors.push(`"${String(u).slice(0, 60)}" is not a usable path`);
  if (skills.length > 24) warnings.push(`${skills.length} skills: more than 24 gets hard to read`);

  // everything the page says about the person, with where it sits. Not org (that comes from the web) and not a skill's intro (that is about the skill).
  const texts = [['roleLine', d.roleLine], ['next', d.next],
    ...nodes.flatMap(n => [...['label', 'kind', 'text', 'role', 'period', 'grade', 'location'].map(f => [`node ${n.id} ${f}`, n[f]]), ...list(n.technology).map(t => [`node ${n.id} technology`, t]),
      ...list(n.sections).flatMap(s => [[`node ${n.id} section title`, s.title], ...list(s.items).map(it => [`node ${n.id} "${s.title}"`, it])])]),
    ...skills.flatMap(k => [[`skill ${k.id} label`, k.label], ...Object.entries(k.uses || {}).map(([id, t]) => [`skill ${k.id} at ${id}`, t])])].filter(([, t]) => str(t));
  for (const [where, t] of texts) for (const [re, what] of PRIVATE) if (re.test(t)) warnings.push(`${where}: ${what}? "${t.slice(0, 70)}"`);
  if (resume) { // a number the resume never states was made up or mistyped
    const have = new Set(resume.match(/\d[\d.,]*\d|\d/g) || []), plain = s => s.replace(/[.,]/g, '');
    const known = new Set([...have].map(plain));
    for (const [where, t] of texts) for (const num of t.match(/\d[\d.,]*\d|\d/g) || []) if (!known.has(plain(num))) errors.push(`${where}: the number ${num} is not in the resume. "${t.slice(0, 70)}"`);
  }
  return { errors, warnings };
}

export function build(d, viewDir) {
  const read = f => fs.readFileSync(path.join(viewDir, f), 'utf8');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const data = JSON.stringify(d).replace(/</g, '\\u003c'); // so nothing in the data can close the script tag
  const swap = (html, from, to) => { if (!html.includes(from)) throw new Error(`view/index.html no longer contains ${from}`); return html.replace(from, () => to); };
  let html = read('index.html');
  html = swap(html, '<title>Profile</title>', `<title>${esc(d.name)}</title>`);
  html = swap(html, '<meta name="description" content="">', `<meta name="description" content="${esc([d.name, d.roleLine].filter(Boolean).join(': '))}">\n<meta property="og:type" content="profile">\n<meta property="og:title" content="${esc(d.name)}">\n<meta property="og:description" content="${esc(d.roleLine || '')}">`); // what a shared link shows
  html = swap(html, '<link rel="stylesheet" href="fonts.css">\n', '');
  const css = read('fonts.css') + read('style.css'); // the fonts ride inside the file
  html = swap(html, '<link rel="stylesheet" href="style.css">', `<style>${css}</style>`);
  return swap(html, '<script src="graph.js" defer></script>', `<script>window.PROFILE=${data}</script>\n<script>document.addEventListener('DOMContentLoaded',()=>{${read('graph.js')}})</script>`);
}

// An organisation's logo, from its own site: the icon it publishes for phone home screens, else its favicon
// (through Google's favicon service, which returns a PNG). Stored inside the data, so the page stays one file.
export async function findLogo(siteUrl) {
  const site = new URL(siteUrl);
  if (!/^https?:$/.test(site.protocol)) return null;
  const get = u => fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'Mozilla/5.0 (resume-hypergraph)' } });
  const candidates = [];
  try {
    for (const tag of (await (await get(site.href)).text()).match(/<link\b[^>]*>/gi) || []) {
      const href = /href=["']?([^"'\s>]+)/i.exec(tag)?.[1];
      if (href && /rel=["']?[^"'>]*apple-touch-icon/i.test(tag)) candidates.push(new URL(href, site.href).href);
    }
  } catch { /* the site is down or blocks scripts: fall through to the favicon */ }
  candidates.push(site.origin + '/apple-touch-icon.png', `https://www.google.com/s2/favicons?domain=${site.hostname}&sz=128`);
  for (const u of candidates) {
    try {
      const r = await get(u), type = (r.headers.get('content-type') || '').split(';')[0].trim();
      if (!r.ok || !/^image\/(png|jpeg|webp)$/.test(type)) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 300 || buf.length > 150_000) continue; // a blank placeholder, or too heavy to carry in the page
      return `data:${type};base64,${buf.toString('base64')}`;
    } catch { /* try the next one */ }
  }
  return null;
}

// Every web address in the profile: gone, moved, or fine.
export async function checkLinks(d) {
  const urls = [...new Set([...(d.links || []).map(l => l.url), ...(d.nodes || []).flatMap(n => n.org ? [n.org.url, n.org.source] : [])].filter(u => /^https?:/i.test(u || '')))];
  return Promise.all(urls.map(async u => {
    try {
      const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'Mozilla/5.0 (resume-hypergraph)' } });
      if (r.status === 404 || r.status === 410) return [u, 'gone', `status ${r.status}`];
      if (!r.ok) return [u, 'unconfirmed', `status ${r.status}, the site may refuse scripts; open it yourself`];
      const host = x => new URL(x).hostname.replace(/^www\./, ''); // a redirect to /en or /de on the same site is not a move
      return host(r.url) === host(u) ? [u, 'ok', ''] : [u, 'moved', `now ${r.url}`];
    } catch { return [u, 'gone', 'did not open']; }
  }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, file, a, b] = process.argv.slice(2), isBuild = cmd === 'build', resumeFile = isBuild ? b : a;
  if (!['check', 'build', 'logos', 'links'].includes(cmd) || !file || (isBuild && !a)) {
    console.error('usage: profile.mjs check <profile.json> [resume.txt]\n       profile.mjs build <profile.json> <out.html> [resume.txt]\n       profile.mjs logos <profile.json>\n       profile.mjs links <profile.json>');
    process.exit(2);
  }
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (cmd === 'logos') {
    const todo = (d.nodes || []).filter(n => !n.logo && n.org && n.org.url);
    const found = await Promise.all(todo.map(n => findLogo(n.org.url).catch(() => null)));
    todo.forEach((n, i) => { if (found[i]) n.logo = found[i]; console.log(`${found[i] ? 'logo   ' : 'no logo'} ${n.id}  ${n.org.url}`); });
    fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
    console.log(`${found.filter(Boolean).length} of ${todo.length} logos added to ${file}`);
  } else if (cmd === 'links') {
    const res = await checkLinks(d);
    res.forEach(([u, state, note]) => console.log(`${state.padEnd(11)} ${u}${note ? '  (' + note + ')' : ''}`));
    const gone = res.filter(r => r[1] === 'gone').length;
    console.log(`${res.length} links, ${gone} gone, ${res.filter(r => r[1] === 'moved').length} moved`);
    if (gone) process.exit(1);
  } else {
    const { errors, warnings } = check(d, resumeFile ? fs.readFileSync(resumeFile, 'utf8') : null);
    warnings.forEach(w => console.log('warning: ' + w));
    errors.forEach(e => console.log('error:   ' + e));
    console.log(`${file}: ${Array.isArray(d.nodes) ? d.nodes.length : 0} entries, ${Array.isArray(d.skills) ? d.skills.length : 0} skills, ${errors.length} errors, ${warnings.length} warnings`);
    if (errors.length) process.exit(1);
    if (isBuild) {
      fs.writeFileSync(a, build(d, path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'view')));
      console.log(`wrote ${a}`);
    }
  }
}
