// resume-hypergraph: the landing, the full-screen network, the side panel and the ground.
// Everything about the person comes from one data file, data/<name>.json (shape in README.md).
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPhone = () => innerWidth < 720;
  const desk = () => !isPhone();
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let net = null, svg, parts, netState = null, panelFor = null, lastFocus = null;
  let graphOpen = false, glide = null, groundStarted = false;

  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const h = (tag, attrs = {}, kids = []) => {
    const e = document.createElement(tag);
    for (const k in attrs) k === 'text' ? (e.textContent = attrs[k]) : e.setAttribute(k, attrs[k]);
    kids.forEach(c => c && e.appendChild(c));
    return e;
  };
  // the data file is written by a model from an uploaded resume: a link may only be a web address, a mail address or a local asset
  const safeUrl = u => /^(https?:\/\/|mailto:|assets\/)/i.test(u || '') ? u : null;
  const initials = () => net.name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');

  const SHAPES = { company: 'M0,-10L10,0L0,10L-10,0Z', parttime: 'M0,-7L7,0L0,7L-7,0Z', project: 'M9,0L4.5,7.8L-4.5,7.8L-9,0L-4.5,-7.8L4.5,-7.8Z', education: 'M-7,-7H7V7H-7Z', personal: 'M0,-8L8,6H-8Z' };
  const BASE = { company: 10, parttime: 7, project: 9, education: 7, personal: 8 };
  const COLORS = { company: '#E0C58F', parttime: '#E0C58F', project: '#B7A3E0', education: '#8FB3E0', personal: '#E39E9E' };
  const SHAPE_OF = { work: 'company', venture: 'company', projects: 'project', parttime: 'parttime', education: 'education', personal: 'personal' };
  // the groups, in the order they claim a column
  const THEMES = { work: 'Work experience', education: 'Education', projects: 'Projects', venture: 'Entrepreneurship', parttime: 'Part-time jobs', personal: 'Hobbies' };
  const LEGEND = { company: 'Company', parttime: 'Part-time job', project: 'Project', education: 'Education', personal: 'Hobby' };

  // drop references to things that are not there, so one bad id cannot blank the page
  function clean(d) {
    d.nodes ||= []; d.skills ||= [];
    const skillIds = new Set(d.skills.map(k => k.id)), nodeIds = new Set(d.nodes.map(n => n.id));
    d.nodes.forEach(n => {
      n.skills = (n.skills || []).filter(k => skillIds.has(k));
      if (!nodeIds.has(n.parent) || n.parent === n.id) delete n.parent;
      if (!THEMES[n.group]) n.group = 'work';
    });
    return d;
  }

  // ---------- landing ----------
  function fillPage() {
    document.title = net.name;
    $('meta[name="description"]').setAttribute('content', [net.name, net.roleLine].filter(Boolean).join(': '));
    $$('[data-k]').forEach(e => { e.textContent = net[e.dataset.k] || ''; });
    const photo = safeUrl(net.photo), btn = $('#portrait');
    btn.replaceChildren(photo ? h('img', { src: photo, alt: net.name, width: 300, height: 300 }) : h('span', { class: 'initials', text: initials() }));
    if (!photo) btn.setAttribute('aria-label', net.name);
    const cv = safeUrl(net.cv);
    $$('[data-cv]').forEach(a => { a.hidden = !cv; if (cv) a.setAttribute('href', cv); });
    $$('.links').forEach(box => box.replaceChildren(...(net.links || []).filter(l => safeUrl(l.url)).map(l =>
      h('a', l.url.startsWith('mailto:') ? { href: l.url, text: l.label } : { href: l.url, target: '_blank', rel: 'noopener', text: l.label }))));
  }
  // Desktop: everything shows at once and the photo click opens the graph.
  // Phones: a click (or 2.5 s) reveals the links; the list of nodes follows below.
  function wireLanding() {
    const landing = $('.landing'), btn = $('#portrait');
    if (desk()) {
      landing.classList.add('revealed');
      btn.removeAttribute('aria-expanded');
      btn.setAttribute('aria-controls', 'work');
      btn.addEventListener('click', () => openGraph());
      return;
    }
    const open = () => { landing.classList.add('revealed'); btn.setAttribute('aria-expanded', 'true'); };
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', open);
    setTimeout(open, 2500); // opens by itself if nobody clicks
  }

  function draw() { return desk() ? drawNetwork() : drawList(); }

  // ---------- phones: the same nodes and skills as a plain list ----------
  // ponytail: a list, not a graph. Draw a phone network when someone asks for one.
  function drawList() {
    if (svg) { svg.remove(); svg = null; }
    if (netState) { netState.stop(); netState = null; }
    $('.mlist')?.remove();
    const item = (label, meta, sel) => {
      const b = h('button', { type: 'button', text: label });
      b.addEventListener('click', () => openPanel(sel, b));
      return h('li', {}, [b, meta ? h('p', { class: 'meta', text: meta }) : null]);
    };
    $('.stage').appendChild(h('div', { class: 'mlist' }, [
      ...Object.entries(THEMES).flatMap(([k, title]) => {
        const ms = net.nodes.filter(n => n.group === k);
        return ms.length ? [h('h2', { text: title }), h('ul', {}, ms.map(n => item(n.label, n.kind, { kind: 'node', id: n.id })))] : [];
      }),
      ...(net.skills.length ? [h('h2', { text: 'Skills' }), h('ul', {}, net.skills.map(k => item(k.label, null, { kind: 'skill', id: k.id })))] : []),
    ]));
  }

  // ---------- desktop: the photo glides into the graph, which unfolds on its own clock ----------
  function hideAll() { if (netState) { netState.g.style.opacity = 0; parts.photoNode.style.opacity = 0; } }
  function showAll() { if (netState) { netState.stop(); netState.place(1); netState.g.style.opacity = ''; parts.photoNode.style.opacity = ''; } }
  function unfoldTimed() {
    if (reduce) return showAll();
    netState.unfold(() => { if (!groundStarted) { groundStarted = true; ground(); } });
  }
  function openGraph(push = true) {
    if (graphOpen || !netState) return;
    graphOpen = true;
    if (push) history.pushState({ graph: true }, '', '#work');
    const btn = $('#portrait');
    document.body.classList.add('graph-on');
    hideAll();
    const done = () => {
      parts.photoNode.style.opacity = '';
      btn.style.visibility = 'hidden';
      unfoldTimed();
      $('.stage').focus({ preventScroll: true });
    };
    if (reduce || !window.gsap || !push) { window.gsap?.set(btn, { clearProps: 'transform' }); done(); return; }
    // the landing photo glides and shrinks from the centre to its place in the graph
    const r = btn.getBoundingClientRect(), { x: px, y: py } = parts.photo;
    if (glide) glide.kill();
    glide = gsap.to(btn, { x: px - (r.left + r.width / 2), y: py - (r.top + r.height / 2), scale: 2 * parts.photoR / r.width, duration: 0.8, ease: 'power2.inOut', onComplete: done });
  }
  function closeGraph() {
    if (!graphOpen) return;
    graphOpen = false;
    const btn = $('#portrait');
    const from = (btn.style.visibility === 'hidden' ? $('.photo-face', parts.photoNode) : btn).getBoundingClientRect();
    closePanel();
    btn.style.visibility = '';
    hideAll();
    document.body.classList.remove('graph-on');
    if (glide) glide.kill();
    if (reduce || !window.gsap) { if (window.gsap) gsap.set(btn, { clearProps: 'transform' }); btn.focus({ preventScroll: true }); return; }
    gsap.set(btn, { clearProps: 'transform' });
    const to = btn.getBoundingClientRect();
    glide = gsap.fromTo(btn, { x: from.left + from.width / 2 - (to.left + to.width / 2), y: from.top + from.height / 2 - (to.top + to.height / 2), scale: from.width / to.width }, { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'power2.inOut', onComplete: () => { gsap.set(btn, { clearProps: 'transform' }); btn.focus({ preventScroll: true }); } });
  }
  // Back button, Escape and the photo in the graph all return to the landing through history
  function leaveGraph() {
    if (location.hash === '#work' && history.state && history.state.graph) history.back();
    else { history.replaceState(null, '', location.pathname + location.search); closeGraph(); }
  }

  // ---------- the network: the person at the centre, what they have done around them, skills at the edges ----------
  // A skill is a hyperedge: hovering it draws one band to every place it was used.
  function drawNetwork() {
    const stage = $('.stage');
    if (svg) svg.remove();
    if (netState) netState.stop();
    $('.mlist')?.remove();
    const w = stage.clientWidth, hgt = stage.clientHeight, cx = w / 2, cy = hgt * .54, pr = 40;
    svg = el('svg', { viewBox: `0 0 ${w} ${hgt}`, class: 'net' });
    stage.insertBefore(svg, $('#graph-alt'));
    parts = { photo: { x: cx, y: cy }, photoR: pr };

    const nodes = [{ id: 'me', type: 'me', label: net.name, x: cx, y: cy, bb: { x: -pr, y: -pr, width: 2 * pr, height: 2 * pr } }]
      .concat(net.nodes.map(n => ({ ...n, type: 'exp', shape: SHAPE_OF[n.group] })), net.skills.map(k => ({ ...k, id: 's:' + k.id, type: 'skill' })));
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    const links = net.nodes.map(n => ({ source: byId[n.parent || 'me'], target: byId[n.id], story: true }))
      .concat(net.nodes.flatMap(n => n.skills.map(k => ({ source: byId[n.id], target: byId['s:' + k] }))));

    const g = el('g', { class: 'net-g' }, svg), themeG = el('g', {}, g), bandG = el('g', {}, g), linkG = el('g', {}, g), nodeG = el('g', {}, g);
    const lineEls = links.map(l => el('line', { class: l.story ? 'nl' : 'nl skill' }, linkG));
    const nodeEls = [];
    const add = n => { const e = el('g', { class: `nn ${n.type}`, tabindex: 0, role: 'button', 'data-id': n.id, 'aria-label': n.label }, nodeG); nodeEls.push([n, e]); return e; };

    // Skills: two alphabetical columns at the edges, never more than 640 px from the centre.
    const skillNodes = nodes.filter(n => n.type === 'skill').sort((a, b) => a.label.localeCompare(b.label));
    skillNodes.forEach(n => { const e = add(n); el('circle', { r: 4 }, e); el('text', { x: 9, y: 4 }, e).textContent = n.label; });
    const skillWidth = Math.max(0, ...nodeEls.map(([, e]) => e.querySelector('text').getComputedTextLength())) + 9;
    const half = Math.min(cx - 32, 640), skillRows = Math.ceil(skillNodes.length / 2), skillStep = Math.min(.07, .68 / Math.max(1, skillRows - 1));
    skillNodes.forEach((n, i) => {
      n.x = i % 2 === 0 ? cx - half : cx + half - skillWidth;
      n.y = cy + hgt * skillStep * (Math.floor(i / 2) - (skillRows - 1) / 2);
    });

    // Everything else: rows in two columns either side of the photo, one block per group, labels pointing outwards.
    // Each group goes into the shorter column, so the two sides stay balanced.
    // ponytail: rows shrink to fit and overlap past about 25 rows a side; the extraction step caps how many nodes a resume gets.
    const cols = [[], []], rowsIn = col => col.reduce((s, ms) => s + ms.length + 2, 0); // two empty rows between groups, for the caption
    Object.keys(THEMES).map(k => nodes.filter(n => n.type === 'exp' && n.group === k)).filter(ms => ms.length)
      .forEach(ms => cols[rowsIn(cols[1]) < rowsIn(cols[0]) ? 1 : 0].push(ms));
    const off = pr + 60, maxChars = Math.max(12, Math.floor((half - off - skillWidth - 50) / 7.8));
    const short = s => s.length > maxChars ? s.slice(0, maxChars - 1).trimEnd() + '…' : s;
    cols.forEach((col, right) => {
      const rows = rowsIn(col) - 2, step = Math.min(.075, .7 / Math.max(1, rows - 1)), side = right ? 1 : -1;
      // area follows time spent, floored so short roles stay clickable and capped so a row never touches the next
      const maxR = Math.min(26, step * hgt * .42), all = col.flat();
      all.forEach(n => { n.r = n.months ? Math.min(maxR, Math.max(11, 26 * Math.sqrt(n.months / 70))) : Math.min(maxR, BASE[n.shape]); });
      const colR = Math.max(...all.map(n => n.r));
      let y = -step * (rows - 1) / 2;
      col.forEach(ms => { ms.forEach(n => {
        n.x = cx + side * off; n.y = cy + hgt * y; y += step;
        const e = add(n), col = COLORS[n.shape], b = BASE[n.shape], sg = el('g', { transform: `scale(${n.r / b})` }, e), logo = safeUrl(n.logo);
        if (logo) { // the logo fills the shape
          el('clipPath', { id: 'logo-' + n.id }, sg).appendChild(el('path', { d: SHAPES[n.shape] }));
          el('path', { d: SHAPES[n.shape], fill: '#fff' }, sg);
          el('image', { href: logo, x: -b * .8, y: -b * .8, width: b * 1.6, height: b * 1.6, 'clip-path': `url(#logo-${n.id})`, preserveAspectRatio: 'xMidYMid slice' }, sg);
          el('path', { d: SHAPES[n.shape], fill: 'none', stroke: col, 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }, sg);
        } else el('path', { d: SHAPES[n.shape], fill: col }, sg);
        el('text', { x: side * (colR + 7), y: 5, 'text-anchor': right ? 'start' : 'end' }, e).textContent = short(n.label);
      }); y += step * 2; });
    });
    nodeEls.forEach(([n, e]) => { n.bb = e.getBBox(); });
    nodes.forEach(n => { n.x1 = n.x; n.y1 = n.y; });

    // a soft box around each group's rows, captioned; drawn at the final layout so nodes unfold into it
    cols.flat().forEach(ms => {
      const x0 = Math.min(...ms.map(n => n.x1 + n.bb.x)) - 14, x1 = Math.max(...ms.map(n => n.x1 + n.bb.x + n.bb.width)) + 14;
      const y0 = Math.min(...ms.map(n => n.y1 + n.bb.y)) - 10, y1 = Math.max(...ms.map(n => n.y1 + n.bb.y + n.bb.height)) + 10;
      el('rect', { class: 'net-theme', x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 18 }, themeG);
      el('text', { class: 'net-area', x: x0 + 14, y: y0 - 8 }, themeG).textContent = THEMES[ms[0].group];
    });
    const lg = el('g', { class: 'net-legend', transform: `translate(32,${hgt - 24})` }, svg);
    let lx = 0; // each entry is as wide as its label; only the shapes this profile uses
    [...Object.entries(LEGEND).filter(([shape]) => nodes.some(n => n.shape === shape)), ...(skillNodes.length ? [['skill', 'Skill']] : [])].forEach(([shape, txt]) => {
      if (shape === 'skill') el('circle', { cx: lx + 7, cy: -4, r: 4, class: 'skill-dot' }, lg);
      else el('path', { d: SHAPES[shape], fill: COLORS[shape], transform: `translate(${lx + 7},-4) scale(${shape === 'parttime' ? .7 : .6})` }, lg);
      el('text', { x: lx + 20, y: 0 }, lg).textContent = txt;
      lx += 20 + txt.length * 7.3 + 24;
    });

    const place = (p = 1, at = null) => {
      nodes.forEach(n => {
        const q = at ? at(n) : p;
        n.x = cx + (n.x1 - cx) * q; n.y = cy + (n.y1 - cy) * q;
      });
      links.forEach((l, i) => { const e = lineEls[i]; e.setAttribute('x1', l.source.x); e.setAttribute('y1', l.source.y); e.setAttribute('x2', l.target.x); e.setAttribute('y2', l.target.y); });
      nodeEls.forEach(([n, e]) => e.setAttribute('transform', `translate(${n.x},${n.y})`));
    };
    let raf = 0;
    const order = n => n.type === 'exp' ? 1 + net.nodes.findIndex(x => x.id === n.id) * .35 : 5 + nodes.indexOf(n) * .04;
    const unfold = done => {
      const t0 = performance.now();
      g.classList.add('unfolding'); // no hover fade while the unfold drives opacity
      const step = now => {
        let finished = true;
        const prog = n => { const q = Math.max(0, Math.min(1, (now - t0 - order(n) * 150) / 650)); if (q < 1) finished = false; return 1 - Math.pow(1 - q, 3); };
        place(1, prog);
        nodeEls.forEach(([n, e]) => { e.style.opacity = Math.min(1, Math.max(0, (now - t0 - order(n) * 150) / 300)); });
        lineEls.forEach((e, i) => { e.style.opacity = Math.min(1, Math.max(0, (now - t0 - order(links[i].target) * 150 - 250) / 400)); });
        if (finished) { nodeEls.forEach(([, e]) => { e.style.opacity = ''; }); lineEls.forEach(e => { e.style.opacity = ''; }); g.classList.remove('unfolding'); raf = 0; done && done(); } else raf = requestAnimationFrame(step);
      };
      step(t0); // place everything at the centre before the layer shows, so the finished graph never flashes
      g.style.opacity = '';
    };
    const near = id => new Set([id, ...links.filter(l => l.source.id === id || l.target.id === id).flatMap(l => [l.source.id, l.target.id])]);
    const band = id => {
      bandG.replaceChildren();
      if (!id || !id.startsWith('s:')) return;
      const k = byId[id], members = links.filter(l => l.target.id === id).map(l => l.source);
      const b = el('g', { class: 'band' }, bandG);
      members.forEach(m => el('line', { x1: k.x, y1: k.y, x2: m.x, y2: m.y }, b));
      [k, ...members].forEach(m => el('circle', { cx: m.x, cy: m.y, r: 22 }, b));
    };
    const light = id => {
      band(id);
      const s = id && near(id);
      nodeEls.forEach(([n, e]) => { e.classList.toggle('dim', !!s && !s.has(n.id)); e.classList.toggle('on', n.id === id); });
      lineEls.forEach((e, i) => { const l = links[i], on = !!s && (l.source.id === id || l.target.id === id); e.classList.toggle('on', on); e.classList.toggle('dim', !!s && !on); });
    };
    let current = null;
    const mark = sel => {
      current = sel ? (sel.kind === 'skill' ? 's:' + sel.id : sel.id) : null;
      nodeEls.forEach(([n, e]) => e.classList.toggle('current', n.id === current));
      light(current);
      frame(current);
    };
    // with the panel open, pan and zoom so the selection, its neighbours and the photo fit left of the panel
    const frame = id => {
      if (!id || !document.body.classList.contains('panel-open')) { svg.style.transform = ''; return; }
      const pts = [...near(id)].map(k => byId[k]), lw = w - $('#panel').offsetWidth;
      const x0 = Math.min(...pts.map(n => n.x + n.bb.x)), x1 = Math.max(...pts.map(n => n.x + n.bb.x + n.bb.width));
      const y0 = Math.min(...pts.map(n => n.y + n.bb.y)), y1 = Math.max(...pts.map(n => n.y + n.bb.y + n.bb.height));
      const s = Math.min(1, (lw - 96) / (x1 - x0), (hgt - 200) / (y1 - y0));
      svg.style.transform = `translate(${lw / 2 - s * (x0 + x1) / 2}px, ${hgt / 2 - s * (y0 + y1) / 2}px) scale(${s})`;
    };
    nodeEls.forEach(([n, e]) => {
      const on = () => light(n.id), off = () => light(current);
      e.addEventListener('mouseenter', on); e.addEventListener('focus', on);
      e.addEventListener('mouseleave', off); e.addEventListener('blur', off);
      const open = () => openPanel(n.type === 'skill' ? { kind: 'skill', id: n.id.slice(2) } : { kind: 'node', id: n.id }, e);
      e.addEventListener('click', open);
      e.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
    });
    netState = { g, place, unfold, mark, stop: () => { if (raf) cancelAnimationFrame(raf); raf = 0; g.classList.remove('unfolding'); nodeEls.forEach(([, e]) => { e.style.opacity = ''; }); lineEls.forEach(e => { e.style.opacity = ''; }); } };

    // the photo (or the initials), pinned in the centre; it leads back to the landing
    const ph = el('g', { class: 'photo-node', tabindex: 0, role: 'button', 'aria-label': net.name }, svg), photo = safeUrl(net.photo);
    el('circle', { class: photo ? '' : 'photo-face', cx, cy, r: pr + 5, fill: 'var(--bg)', stroke: 'var(--moss)', 'stroke-width': 2 }, ph);
    if (photo) {
      el('clipPath', { id: 'photo-clip' }, ph).appendChild(el('circle', { cx, cy, r: pr }));
      el('image', { class: 'photo-face photo-img', href: photo, x: cx - pr, y: cy - pr, width: 2 * pr, height: 2 * pr, 'clip-path': 'url(#photo-clip)', preserveAspectRatio: 'xMidYMid slice' }, ph);
    } else el('text', { class: 'photo-initials', x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, ph).textContent = initials();
    parts.photoNode = ph;
    ph.addEventListener('click', () => leaveGraph());
    ph.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); leaveGraph(); } });

    place(1);
    $('#graph-alt').textContent = net.nodes.map(n => `${n.label} (${n.kind}): ${n.skills.map(k => net.skills.find(x => x.id === k).label).join(', ')}`).join('; ') + '.';
    graphOpen ? showAll() : hideAll();
    if (panelFor) mark(panelFor);
  }

  // ---------- the side panel ----------
  // A node's panel: the organisation first, then the person's role there, then the work.
  function nodeSection(id) {
    const n = net.nodes.find(x => x.id === id), o = n.org || {}, edu = n.group === 'education';
    const row = (k, v) => v ? [h('dt', { text: k }), typeof v === 'string' ? h('dd', { text: v }) : h('dd', {}, [v])] : [];
    const url = safeUrl(o.url), logo = safeUrl(n.logo);
    const site = url ? h('a', { href: url, target: '_blank', rel: 'noopener' }, [h('span', { text: url.replace(/^https?:\/\/(www\.)?/, '') }), h('span', { class: 'ext', 'aria-hidden': 'true', text: '↗' })]) : null;
    const orgRows = [...row(edu ? 'Institution' : 'Industry', o.about), ...row('Headquarters', o.hq), ...row('Website', site)];
    const myRows = [...row(edu ? 'Degree' : 'Position', n.role), ...row('Period', n.period), ...row('Grade', n.grade), ...row('Location', n.location)];
    return [
      myRows.length ? null : h('p', { class: 'meta', text: n.kind }),
      h('div', { class: 'panel-head' }, [logo ? h('img', { src: logo, alt: '', class: 'panel-logo' }) : null, h('h2', { id: 'panel-title', text: n.label })]),
      ...(o.description || orgRows.length ? [h('h3', { class: 'part', text: 'Profile' }), o.description ? h('p', { class: 'about', text: o.description }) : null, orgRows.length ? h('dl', { class: 'profile' }, orgRows) : null] : []),
      ...(myRows.length ? [h('h3', { class: 'part', text: edu ? 'My degree' : 'My role' }), h('dl', { class: 'profile mine' }, myRows), h('h3', { class: 'part', text: edu ? 'Studies' : 'Work' })] : []),
      h('p', { class: 'summary', text: n.text }),
      ...(n.sections || []).flatMap(sec => [h('h4', { class: 'sub', text: sec.title }), h('ul', { class: 'items' }, sec.items.map(it => h('li', { text: it })))]),
      ...(n.skills.length ? [h('h3', { class: 'part', text: 'Skills' }), h('ul', { class: 'tags' }, n.skills.map(k => h('li', {}, [h('button', { type: 'button', class: 'tag', 'data-open-skill': k, text: net.skills.find(x => x.id === k).label })])))] : []),
      ...(n.technology ? [h('h3', { class: 'part', text: 'Technology used' }), h('p', { text: n.technology.join(' · ') })] : []),
    ];
  }
  // A skill's panel: one block per place it was used, saying what was done there with it.
  function skillSection(id) {
    const k = net.skills.find(x => x.id === id), used = net.nodes.filter(n => n.skills.includes(id));
    return [
      h('p', { class: 'meta', text: 'Skill' }),
      h('h2', { id: 'panel-title', text: k.label }),
      k.intro ? h('p', { class: 'intro', text: k.intro }) : null,
      h('h3', { class: 'part', text: 'Used at' }),
      h('ul', { class: 'theme-roles uses' }, used.map(n => h('li', {}, [h('button', { type: 'button', 'data-open-node': n.id, text: n.label }), h('p', { class: 'meta', text: n.kind }),
        (k.uses || {})[n.id] ? h('p', { class: 'use', text: k.uses[n.id] }) : null]))),
    ];
  }
  function openPanel(sel, from) {
    const panel = $('#panel'), body = $('.panel-body', panel);
    panelFor = sel;
    if (from) lastFocus = from;
    body.replaceChildren(...(sel.kind === 'skill' ? skillSection(sel.id) : nodeSection(sel.id)).filter(Boolean));
    $$('[data-open-node]', body).forEach(b => b.addEventListener('click', () => openPanel({ kind: 'node', id: b.dataset.openNode })));
    $$('[data-open-skill]', body).forEach(b => b.addEventListener('click', () => openPanel({ kind: 'skill', id: b.dataset.openSkill })));
    document.body.classList.add('panel-open');
    panel.scrollTop = 0;
    netState?.mark(sel);
    $('.panel-close', panel).focus({ preventScroll: true });
  }
  function closePanel() {
    if (!panelFor) return;
    panelFor = null;
    document.body.classList.remove('panel-open');
    netState?.mark(null);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  function wirePanel() {
    const panel = $('#panel');
    panel.hidden = false; // kept out of view and out of the accessibility tree by CSS until opened
    $('.panel-close', panel).addEventListener('click', closePanel);
    addEventListener('keydown', e => {
      if (e.key === 'Tab' && panelFor) {
        const focusable = $$('button, a, [tabindex]:not([tabindex="-1"])', panel).filter(e => !e.hidden && getComputedStyle(e).visibility !== 'hidden');
        const first = focusable[0], last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        return;
      }
      if (e.key === 'Escape') { if (panelFor) closePanel(); else if (desk() && graphOpen) leaveGraph(); }
    });
  }

  // ---------- ground: a slow WebGL gradient behind the graph ----------
  function ground() {
    const canvas = $('.ground');
    if (reduce || isPhone()) return;
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `precision mediump float;uniform vec2 r;uniform float t;
      void main(){vec2 u=gl_FragCoord.xy/r;float a=6.2831*t/48.;
      float f=.5+.5*sin(u.x*2.3+a)*cos(u.y*1.9-a*.7);
      float d=1.-smoothstep(.1,.85,distance(u,vec2(.5+.12*sin(a*.5),.55)));
      float m=.5+.5*sin(u.x*3.1-u.y*2.2+a*1.3);
      vec3 bg=vec3(14.,17.,16.)/255.,deep=vec3(18.,32.,26.)/255.,moss=vec3(78.,127.,82.)/255.;
      vec3 c=mix(bg,deep,f*d)+(moss-bg)*.05*m*d;
      gl_FragColor=vec4(min(c,vec3(26.,42.,34.)/255.),1.);}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pg = gl.createProgram();
    gl.attachShader(pg, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pg);
    if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) return;
    gl.useProgram(pg);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pg, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const ur = gl.getUniformLocation(pg, 'r'), ut = gl.getUniformLocation(pg, 't');
    let raf, t0 = performance.now();
    const frame = now => {
      const w = canvas.clientWidth, hh = canvas.clientHeight, dpr = Math.min(devicePixelRatio, 1.5);
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(hh * dpr); gl.viewport(0, 0, canvas.width, canvas.height); }
      gl.uniform2f(ur, canvas.width, canvas.height); gl.uniform1f(ut, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    canvas.classList.add('on');
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(frame); });
  }

  // ---------- start ----------
  async function start() {
    // ?p=name picks data/name.json; the default is data/profile.json
    const file = (new URLSearchParams(location.search).get('p') || 'profile').replace(/[^\w-]/g, '');
    try { net = clean(await fetch(`data/${file}.json`).then(r => { if (!r.ok) throw r; return r.json(); })); } catch { return; }
    fillPage();
    wireLanding();
    wirePanel();
    draw();
    if (desk()) {
      addEventListener('popstate', () => { if (location.hash === '#work') openGraph(false); else closeGraph(); });
      if (location.hash === '#work') openGraph(false); // a link straight to the graph opens it without the glide
    }
    let timer, lastW = innerWidth;
    addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (innerWidth !== lastW) { lastW = innerWidth; draw(); } }, 150); // phones fire resize on scroll; redraw on width only
    });
  }
  start();
})();
