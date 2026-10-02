// Run: node --test scripts/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { check, build } from './profile.mjs';

const view = new URL('../view/', import.meta.url).pathname;
const node = extra => ({ id: 'a', group: 'work', label: 'Acme', kind: 'Engineer · 2020 to 2021', text: 'Built a single-page app.', skills: [], ...extra });
const run = (extra, top = {}) => check({ name: 'Test Person', nodes: [node(extra)], skills: [], ...top }, 'Acme, Engineer, 2020 to 2021');

test('the samples pass', () => {
  for (const f of fs.readdirSync(view + 'data')) assert.deepEqual(check(JSON.parse(fs.readFileSync(view + 'data/' + f, 'utf8'))).errors, [], f);
});
test('a number the resume never states fails, wherever it sits', () => {
  assert.deepEqual(run({}).errors, []);
  for (const extra of [{ grade: '1.3' }, { period: '2020 to 2099' }, { role: 'Engineer 4' }, { label: 'Acme 7' }, { technology: ['Python 3'] }, { sections: [{ title: 'Revenue up 400%', items: [] }] }])
    assert.equal(run(extra).errors.length, 1, JSON.stringify(extra));
});
test('shapes the page would trip over fail', () => {
  for (const extra of [{ technology: 'SQL, Figma' }, { sections: [{ title: 'Work' }] }, { sections: 'Work' }, { skills: 'sql' }, { group: 'wrok' }])
    assert.equal(run(extra).errors.length, 1, JSON.stringify(extra));
  assert.deepEqual(run({ group: 'field-work' }, { groups: [{ id: 'field-work', label: 'Field work' }] }).errors, []);
  assert.deepEqual(check({ name: 'x', nodes: { a: 1 } }).errors, ['nodes must be a list']);
});
test('private details are warned about; ordinary words are not', () => {
  assert.deepEqual(run({}).warnings, []);
  assert.match(run({ role: 'Engineer, call +49 170 1234567' }).warnings[0], /phone number/);
});
test('the built page cannot be broken out of by the data', () => {
  const html = build({ name: 'A </script><script>alert(1)</script>', nodes: [node()], skills: [] }, view);
  assert.ok(!html.includes('</script><script>alert(1)'));
  assert.ok(html.includes('<meta property="og:title" content="A &lt;/script&gt;'));
  assert.ok(!html.includes('fonts.googleapis') && !html.includes('url(fonts/') && html.includes('data:font/woff2;base64,'), 'fonts are inside the file');
});
