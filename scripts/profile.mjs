#!/usr/bin/env node
// Checks a profile data file and builds the one-file page from it. No dependencies.
//   node scripts/profile.mjs check <profile.json> [resume.txt]
//   node scripts/profile.mjs build <profile.json> <out.html> [resume.txt]
// With resume.txt, every number in the profile's sentences must also appear in the resume.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SAFE_URL = /^(https?:\/\/|mailto:|assets\/|data:image\/(png|jpeg|webp);base64,)/i; // same rule as view/graph.js
const ID = /^[a-z0-9][a-z0-9-]*$/;
const PRIVATE = [
  [{ test: t => (t.match(/\+?\d[\d\s().\/-]{7,}\d/g) || []).some(m => m.replace(/\D/g, '').length >= 9) }, 'looks like a phone number'], // nine digits or more, so "2014 - 2016" passes
  [/\b(date of birth|born on|born in|d\.o\.b|geboren|geburtsdatum)\b/i, 'date or place of birth'],
  [/\b(marital status|married|unmarried|single|verheiratet|ledig|familienstand)\b/i, 'marital status'],
  [/\b(religion|caste|father'?s name|nationality:|staatsangehörigkeit)\b/i, 'personal detail'],
];

export function check(d, resume) {
  const errors = [], warnings = [], str = v => typeof v === 'string' && v.trim();
  if (!str(d.name)) errors.push('name is missing');
  if (!Array.isArray(d.nodes) || !d.nodes.length) errors.push('nodes is empty');
  const nodes = d.nodes || [], skills = d.skills || [];
  const nodeIds = new Set(), skillIds = new Set();
  for (const k of skills) {
    if (!ID.test(k.id || '')) errors.push(`skill id "${k.id}" must be lowercase letters, digits and hyphens`);
    if (skillIds.has(k.id)) errors.push(`skill id "${k.id}" is used twice`);
    skillIds.add(k.id);
    if (!str(k.label)) errors.push(`skill ${k.id} has no label`);
    if (!str(k.intro)) warnings.push(`skill ${k.id} has no intro`);
  }
  for (const n of nodes) {
    if (!ID.test(n.id || '') || n.id === 'me') errors.push(`node id "${n.id}" must be lowercase letters, digits and hyphens`);
    if (nodeIds.has(n.id)) errors.push(`node id "${n.id}" is used twice`);
    nodeIds.add(n.id);
    for (const f of ['group', 'label', 'kind', 'text']) if (!str(n[f])) errors.push(`node ${n.id} has no ${f}`);
    if (str(n.label) && n.label.length > 60) warnings.push(`node ${n.id}: label is ${n.label.length} characters and will be cut on screen; put the full name in org.description`);
    if (n.months != null && !(n.months > 0)) errors.push(`node ${n.id}: months must be a positive number`);
    for (const k of n.skills || []) {
      if (!skillIds.has(k)) errors.push(`node ${n.id} names unknown skill "${k}"`);
      else if (!str((skills.find(x => x.id === k).uses || {})[n.id])) errors.push(`skill ${k} has no "uses" sentence for node ${n.id}`); // the sentence is the point of the graph
    }
    if (n.org && str(n.org.description) && !str(n.org.source)) warnings.push(`node ${n.id}: organisation description has no source link`);
    for (const u of [n.logo, n.org && n.org.url, n.org && n.org.source]) if (u && !SAFE_URL.test(u)) errors.push(`node ${n.id}: "${String(u).slice(0, 60)}" is not a web address`);
  }
  for (const n of nodes) if (n.parent && !nodeIds.has(n.parent)) errors.push(`node ${n.id} names unknown parent "${n.parent}"`);
  for (const k of skills) {
    const users = nodes.filter(n => (n.skills || []).includes(k.id));
    if (!users.length) warnings.push(`skill ${k.id} is not used by any node and will sit unconnected`);
    for (const id of Object.keys(k.uses || {})) if (!users.some(n => n.id === id)) errors.push(`skill ${k.id} has a "uses" sentence for ${id}, which does not list this skill`);
  }
  for (const g of d.groups || []) if (!str(g.id) || !str(g.label)) errors.push('every entry in groups needs an id and a label');
  for (const l of d.links || []) if (!str(l.label) || !SAFE_URL.test(l.url || '')) errors.push(`link "${l.label}" needs a label and a web or mail address`);
  for (const u of [d.photo, d.cv]) if (u && !SAFE_URL.test(u)) errors.push(`"${String(u).slice(0, 60)}" is not a usable path`);
  if (skills.length > 24) warnings.push(`${skills.length} skills: more than 24 gets hard to read`);

  // every sentence the page shows, with where it sits
  const texts = [['roleLine', d.roleLine], ['next', d.next],
    ...nodes.flatMap(n => [[`node ${n.id} text`, n.text], [`node ${n.id} kind`, n.kind], [`node ${n.id} location`, n.location], ...(n.sections || []).flatMap(s => (s.items || []).map(it => [`node ${n.id} "${s.title}"`, it]))]),
    ...skills.flatMap(k => Object.entries(k.uses || {}).map(([id, t]) => [`skill ${k.id} at ${id}`, t]))].filter(([, t]) => str(t));
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
  html = swap(html, '<meta name="description" content="">', `<meta name="description" content="${esc([d.name, d.roleLine].filter(Boolean).join(': '))}">`);
  html = swap(html, '<link rel="stylesheet" href="style.css">', `<style>${read('style.css')}</style>`);
  return swap(html, '<script src="graph.js" defer></script>', `<script>window.PROFILE=${data}</script>\n<script>document.addEventListener('DOMContentLoaded',()=>{${read('graph.js')}})</script>`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, file, a, b] = process.argv.slice(2), isBuild = cmd === 'build', resumeFile = isBuild ? b : a;
  if (!['check', 'build'].includes(cmd) || !file || (isBuild && !a)) { console.error('usage: profile.mjs check <profile.json> [resume.txt]\n       profile.mjs build <profile.json> <out.html> [resume.txt]'); process.exit(2); }
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { errors, warnings } = check(d, resumeFile ? fs.readFileSync(resumeFile, 'utf8') : null);
  warnings.forEach(w => console.log('warning: ' + w));
  errors.forEach(e => console.log('error:   ' + e));
  console.log(`${file}: ${(d.nodes || []).length} entries, ${(d.skills || []).length} skills, ${errors.length} errors, ${warnings.length} warnings`);
  if (errors.length) process.exit(1);
  if (isBuild) {
    fs.writeFileSync(a, build(d, path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'view')));
    console.log(`wrote ${a}`);
  }
}
