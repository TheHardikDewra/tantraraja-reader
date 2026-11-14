/* nav.js: book chrome like Apple Books.
   Top bar (Contents, chapter title, Search, Bookmark), bottom bar (whole-book scrubber),
   Contents + Bookmarks sheet, Search sheet, ribbon marker, auto-hiding chrome, first-run hint.
   Talks to the rest of the app only through window.TR (see core.js contract). */
(function () {
  const TR = window.TR;
  if (!TR) return;

  /* ---------- Phosphor icons (regular + fill), inlined from @phosphor-icons/core@2.1.1 ---------- */
  const P = {
    list: 'M80,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H88A8,8,0,0,1,80,64Zm136,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM44,52A12,12,0,1,0,56,64,12,12,0,0,0,44,52Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,116Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,180Z',
    search: 'M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z',
    bookmark: 'M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z',
    bookmarkFill: 'M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z',
    x: 'M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z',
    tap: 'M56,76a60,60,0,0,1,120,0,8,8,0,0,1-16,0,44,44,0,0,0-88,0,8,8,0,1,1-16,0Zm140,44a27.9,27.9,0,0,0-13.36,3.39A28,28,0,0,0,144,106.7V76a28,28,0,0,0-56,0v80l-3.82-6.13a28,28,0,0,0-48.41,28.17l29.32,50A8,8,0,1,0,78.89,220L49.6,170a12,12,0,1,1,20.78-12l.14.23,18.68,30A8,8,0,0,0,104,184V76a12,12,0,0,1,24,0v68a8,8,0,1,0,16,0V132a12,12,0,0,1,24,0v20a8,8,0,0,0,16,0v-4a12,12,0,0,1,24,0v36c0,21.61-7.1,36.3-7.16,36.42a8,8,0,0,0,3.58,10.73A7.9,7.9,0,0,0,208,232a8,8,0,0,0,7.16-4.42c.37-.73,8.85-18,8.85-43.58V148A28,28,0,0,0,196,120Z',
    pencil: 'M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z',
    aa: 'M87.24,52.59a8,8,0,0,0-14.48,0l-64,136a8,8,0,1,0,14.48,6.81L39.9,160h80.2l16.66,35.4a8,8,0,1,0,14.48-6.81ZM47.43,144,80,74.79,112.57,144ZM200,96c-12.76,0-22.73,3.47-29.63,10.32a8,8,0,0,0,11.26,11.36c3.8-3.77,10-5.68,18.37-5.68,13.23,0,24,9,24,20v3.22A42.76,42.76,0,0,0,200,128c-22.06,0-40,16.15-40,36s17.94,36,40,36a42.73,42.73,0,0,0,24-7.25,8,8,0,0,0,16-.75V132C240,112.15,222.06,96,200,96Zm0,88c-13.23,0-24-9-24-20s10.77-20,24-20,24,9,24,20S213.23,184,200,184Z',
    trash: 'M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z',
  };
  const icon = (name, cls = '') => `<svg class="tr-ico ${cls}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="${P[name]}"/></svg>`;

  /* ---------- small helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const raf2 = fn => requestAnimationFrame(() => requestAnimationFrame(fn));
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toc = () => TR.state.toc || [];
  function chapterLabel(id) {
    if (id === '00-front-matter') return 'Front matter';
    return 'Paṭala ' + parseInt(id, 10);
  }

  /* ---------- chapter text cache (shared by Contents headings, Search, scrubber weights) ---------- */
  const cache = { dev: {}, iast: {} };          // script -> id -> {text, h2, folded, map}
  const inflight = {};
  function loadChapter(script, id) {
    if (cache[script][id]) return Promise.resolve(cache[script][id]);
    const key = script + ':' + id;
    if (inflight[key]) return inflight[key];
    inflight[key] = fetch(`data/${script}/${id}.html`).then(r => r.text()).then(html => {
      const t = document.createElement('template');
      t.innerHTML = html;
      const h2 = t.content.querySelector('h2');
      const entry = { text: t.content.textContent, h2: h2 ? h2.textContent.trim() : '' };
      cache[script][id] = entry;
      delete inflight[key];
      return entry;
    }).catch(() => { delete inflight[key]; return null; });
    return inflight[key];
  }
  async function loadAll(script, onEach) {
    const ids = toc().map(c => c.id);
    let i = 0, done = 0;
    const worker = async () => {
      while (i < ids.length) {
        const id = ids[i++];
        const e = await loadChapter(script, id);
        done++;
        if (onEach) onEach(id, e, done, ids.length);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
    updateWeights();
  }
  /* Fold text for matching: lower case, and (for IAST) without diacritics. Keeps a map back to original offsets. */
  function fold(text, stripMarks) {
    if (!stripMarks) return { folded: text.toLowerCase(), map: null };
    let out = '';
    const map = new Int32Array(text.length * 2 + 1);
    let n = 0;
    for (let i = 0; i < text.length; i++) {
      const f = text[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      for (let k = 0; k < f.length; k++) { map[n++] = i; }
      out += f;
    }
    map[n] = text.length;
    return { folded: out, map: map.subarray(0, n + 1) };
  }
  function foldedOf(script, entry) {
    if (!entry.f) entry.f = fold(entry.text, script === 'iast');
    return entry.f;
  }

  /* ---------- text offsets inside #page-content (same coordinate system as highlights) ---------- */
  const content = () => document.getElementById('page-content');
  const viewport = () => document.getElementById('viewport') || content();
  function textNodes(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const out = []; let n, pos = 0;
    while ((n = w.nextNode())) { out.push({ n, start: pos }); pos += n.nodeValue.length; }
    return out;
  }
  function offsetOf(node, off) {
    const root = content(); if (!root || !root.contains(node)) return -1;
    if (node.nodeType !== 3) {
      // element position: count text before child[off]
      const r = document.createRange(); r.setStart(root, 0); r.setEnd(node, off);
      return r.toString().length;
    }
    for (const t of textNodes(root)) if (t.n === node) return t.start + off;
    return -1;
  }
  function rangeFor(start, end) {
    const root = content(); if (!root) return null;
    const nodes = textNodes(root);
    let s = null, e = null;
    for (const t of nodes) {
      const len = t.n.nodeValue.length;
      if (!s && start <= t.start + len) s = [t.n, Math.max(0, start - t.start)];
      if (!e && end <= t.start + len) { e = [t.n, Math.max(0, end - t.start)]; break; }
    }
    if (!s) return null;
    if (!e) { const last = nodes[nodes.length - 1]; e = [last.n, last.n.nodeValue.length]; }
    const r = document.createRange();
    try { r.setStart(s[0], s[1]); r.setEnd(e[0], e[1]); } catch (_) { return null; }
    return r;
  }
  function caretAt(x, y) {
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); return r ? [r.startContainer, r.startOffset] : null; }
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); return p ? [p.offsetNode, p.offset] : null; }
    return null;
  }
  /* Character range [start, end] that is visible on the current page, or null. */
  function visibleRange() {
    const root = content(), vp = viewport(); if (!root || !vp) return null;
    const pg = TR.paginator;
    if (pg && pg.offsetAtPage) {
      try {
        const p = TR.state.page, last = p >= (TR.state.pageCount || 1) - 1;
        const start = pg.offsetAtPage(p);
        const end = last ? root.textContent.length : Math.max(start, pg.offsetAtPage(p + 1) - 1);
        if (typeof start === 'number' && start >= 0) return { start, end };
      } catch (_) {}
    }
    const r = vp.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    document.body.classList.add('tr-hit-test');
    let min = Infinity, max = -1;
    try {
      for (let row = 0; row < 14; row++) {
        const y = r.top + 6 + (r.height - 12) * row / 13;
        for (let col = 0; col < 6; col++) {
          const x = r.left + 6 + (r.width - 12) * col / 5;
          const c = caretAt(x, y);
          if (!c || !root.contains(c[0])) continue;
          const o = offsetOf(c[0], c[1]);
          if (o < 0) continue;
          if (o < min) min = o; if (o > max) max = o;
        }
      }
    } finally { document.body.classList.remove('tr-hit-test'); }
    return max < 0 ? null : { start: min, end: max };
  }
  function isVisible(range) {
    const vp = viewport().getBoundingClientRect();
    const rects = Array.from(range.getClientRects()).filter(q => q.width || q.height);
    return rects.some(q => q.left >= vp.left - 2 && q.right <= vp.right + 2 && q.top >= vp.top - 2 && q.bottom <= vp.bottom + 2);
  }

  /* ---------- reveal a character offset: go to the page that holds it, optionally flash it ---------- */
  let pendingReveal = null;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function revealOffset(start, end, flash) {
    const range = rangeFor(start, end); if (!range) return;
    const pg = TR.paginator;
    if (pg && pg.pageOfOffset && pg.goTo) {
      const target = pg.pageOfOffset(start);
      if (target !== TR.state.page) { pg.goTo(target); await wait(reduced() ? 40 : 380); }
    }
    if (pg && pg.goTo && !isVisible(range)) {
      const vp = viewport().getBoundingClientRect();
      const q = range.getClientRects()[0] || range.getBoundingClientRect();
      let target = TR.state.page;
      if (q.left < vp.left || q.right > vp.right) target += Math.floor((q.left - vp.left) / vp.width);
      else target += Math.floor((q.top - vp.top) / vp.height);
      const clamp = p => Math.max(0, Math.min((TR.state.pageCount || 1) - 1, p));
      target = clamp(target);
      pg.goTo(target);
      await wait(reduced() ? 40 : 380);
      // correct small misses (two-page spreads, gaps between columns)
      for (let tries = 0; tries < 4 && !isVisible(range); tries++) {
        const q2 = range.getClientRects()[0] || range.getBoundingClientRect();
        const v2 = viewport().getBoundingClientRect();
        const dir = (q2.left >= v2.right || q2.top >= v2.bottom) ? 1 : -1;
        const next = clamp(TR.state.page + dir);
        if (next === TR.state.page) break;
        pg.goTo(next);
        await wait(reduced() ? 40 : 380);
      }
    }
    if (flash) flashRange(range);
  }
  function flashRange(range) {
    const vp = viewport().getBoundingClientRect();
    const layer = el('div', 'tr-flash-layer');
    Array.from(range.getClientRects()).forEach(q => {
      if (q.right < vp.left || q.left > vp.right || q.bottom < vp.top || q.top > vp.bottom) return;
      const b = el('div', 'tr-flash');
      b.style.cssText = `left:${q.left - 2}px;top:${q.top - 1}px;width:${q.width + 4}px;height:${q.height + 2}px`;
      layer.appendChild(b);
    });
    panels.appendChild(layer);
    raf2(() => layer.classList.add('fade'));
    setTimeout(() => layer.remove(), 2200);
  }

  /* ---------- DOM: top bar ---------- */
  const topL = $('#topbar-left'), topT = $('#topbar-title'), topR = $('#topbar-right');
  const panels = $('#panels') || document.body.appendChild(el('div'));
  if (!topL || !topT || !topR) return;
  topL.innerHTML = `<button class="tr-btn" id="tr-btn-toc" aria-label="Contents (T)" title="Contents (T)">${icon('list')}<span class="tr-btn-label">Contents</span></button>`;
  topT.innerHTML = '<span class="tr-title-text"></span>';
  topR.innerHTML = `<button class="tr-btn tr-icon-btn" id="tr-btn-search" aria-label="Search (/)" title="Search (/)">${icon('search')}</button>
    <button class="tr-btn tr-icon-btn" id="tr-btn-bm" aria-label="Bookmark this page (B)" title="Bookmark (B)" aria-pressed="false">${icon('bookmark', 'off')}${icon('bookmarkFill', 'on')}</button>`;

  /* ---------- DOM: bottom bar scrubber ---------- */
  const prog = $('#progress');
  prog.innerHTML = `<div class="tr-scrub" role="slider" tabindex="0" aria-label="Book position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="tr-track"></div><div class="tr-thumb"></div>
      <div class="tr-preview" aria-hidden="true"><div class="tr-preview-title"></div><div class="tr-preview-sub"></div></div>
    </div>
    <div class="tr-prog-label" aria-live="polite"></div>`;
  const scrub = $('.tr-scrub', prog), track = $('.tr-track', prog), thumb = $('.tr-thumb', prog);
  const preview = $('.tr-preview', prog), progLabel = $('.tr-prog-label', prog);
  let weights = [];
  function updateWeights() {
    const s = TR.state.script, list = toc();
    const all = list.every(c => cache[s][c.id]);
    weights = list.map(c => all ? Math.max(1, cache[s][c.id].text.length) : 1);
    buildTrack();
  }
  function buildTrack() {
    track.innerHTML = '';
    toc().forEach((c, i) => {
      const seg = el('div', 'tr-seg', '<i></i>');
      seg.style.flexGrow = weights[i] || 1;
      track.appendChild(seg);
    });
    paintProgress();
  }
  function cum() { const out = [0]; weights.forEach(w => out.push(out[out.length - 1] + w)); return out; }
  /* fraction of the whole book -> {index, frac within chapter} and back */
  function fracToPos(f) {
    const c = cum(), total = c[c.length - 1] || 1, t = Math.max(0, Math.min(0.99999, f)) * total;
    let i = 0; while (i < weights.length - 1 && t >= c[i + 1]) i++;
    return { index: i, frac: (t - c[i]) / (weights[i] || 1) };
  }
  function posToFrac(index, frac) {
    const c = cum(), total = c[c.length - 1] || 1;
    return (c[index] + frac * (weights[index] || 1)) / total;
  }
  function currentFrac() {
    const i = Math.max(0, TR.chapterIndex(TR.state.chapter));
    const pc = Math.max(1, TR.state.pageCount || 1);
    return { i, frac: pc > 1 ? TR.state.page / (pc - 1) : 0 };
  }
  function paintProgress(overrideF) {
    if (!weights.length) return;
    const cur = currentFrac();
    const f = overrideF != null ? overrideF : posToFrac(cur.i, cur.frac * 0.999);
    const p = overrideF != null ? fracToPos(f) : { index: cur.i, frac: cur.frac };
    Array.from(track.children).forEach((seg, i) => {
      seg.firstChild.style.width = (i < p.index ? 100 : i === p.index ? p.frac * 100 : 0) + '%';
      seg.classList.toggle('current', i === cur.i);
    });
    thumb.style.left = (f * 100) + '%';
    scrub.setAttribute('aria-valuenow', Math.round(f * 100));
    scrub.setAttribute('aria-valuetext', `${chapterLabel(TR.state.chapter)}, page ${TR.state.page + 1} of ${TR.state.pageCount}`);
  }
  function paintLabels() {
    const id = TR.state.chapter;
    $('.tr-title-text', topT).textContent = TR.titleOf(id) || '';
    progLabel.textContent = `Page ${TR.state.page + 1} of ${Math.max(1, TR.state.pageCount)} · ${chapterLabel(id)}`;
  }

  // scrub drag (mouse, touch, Pencil = pointer events)
  let dragging = false, dragF = 0;
  function fFromEvent(e) { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); }
  function showPreview(f) {
    const p = fracToPos(f), c = toc()[p.index]; if (!c) return;
    const entry = cache[TR.state.script][c.id];
    $('.tr-preview-title', preview).textContent = TR.titleOf(c.id);
    const pc = c.id === TR.state.chapter ? TR.state.pageCount : 0;
    $('.tr-preview-sub', preview).textContent = (entry && entry.h2 ? entry.h2 + ' · ' : '') + (pc ? `Page ${Math.round(p.frac * (pc - 1)) + 1} of ${pc}` : chapterLabel(c.id));
    const w = track.getBoundingClientRect().width;
    const pw = preview.offsetWidth || 180;
    preview.style.left = Math.max(pw / 2, Math.min(w - pw / 2, f * w)) + 'px';
    preview.classList.add('show');
    if (!entry) loadChapter(TR.state.script, c.id).then(e2 => { if (dragging && e2 && fracToPos(dragF).index === p.index) showPreview(dragF); });
  }
  scrub.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    dragging = true; scrub.setPointerCapture(e.pointerId); scrub.classList.add('dragging');
    dragF = fFromEvent(e); paintProgress(dragF); showPreview(dragF); keepChrome(true);
    e.preventDefault();
  });
  scrub.addEventListener('pointermove', e => {
    if (dragging) { dragF = fFromEvent(e); paintProgress(dragF); showPreview(dragF); }
    else if (e.pointerType === 'mouse') { showPreview(fFromEvent(e)); }
  });
  scrub.addEventListener('pointerleave', () => { if (!dragging) preview.classList.remove('show'); });
  const endDrag = e => {
    if (!dragging) return;
    dragging = false; scrub.classList.remove('dragging'); preview.classList.remove('show'); keepChrome(false);
    jumpTo(fracToPos(dragF));
  };
  scrub.addEventListener('pointerup', endDrag);
  scrub.addEventListener('pointercancel', () => { dragging = false; scrub.classList.remove('dragging'); preview.classList.remove('show'); keepChrome(false); paintProgress(); });
  scrub.addEventListener('keydown', e => {
    const i = TR.chapterIndex(TR.state.chapter);
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); TR.paginator && TR.paginator.next ? TR.paginator.next() : null; }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); TR.paginator && TR.paginator.prev ? TR.paginator.prev() : null; }
    else if (e.key === 'PageDown' && i < toc().length - 1) { e.preventDefault(); TR.emit('nav:goto', { chapter: toc()[i + 1].id, page: 0 }); }
    else if (e.key === 'PageUp' && i > 0) { e.preventDefault(); TR.emit('nav:goto', { chapter: toc()[i - 1].id, page: 0 }); }
  });
  let pendingFrac = null;
  function jumpTo(p) {
    const c = toc()[p.index]; if (!c) return;
    if (c.id === TR.state.chapter) {
      const pc = Math.max(1, TR.state.pageCount);
      if (TR.paginator && TR.paginator.goTo) TR.paginator.goTo(Math.round(p.frac * (pc - 1)));
      paintProgress();
    } else {
      pendingFrac = { chapter: c.id, frac: p.frac };
      TR.emit('nav:goto', { chapter: c.id, page: 0 });
    }
  }

  /* ---------- chrome auto-hide ---------- */
  let hideTimer = null, holdCount = 0;
  const sheetOpen = () => !!$('.tr-sheet.open', panels);
  function setChrome(show) {
    document.body.classList.toggle('chrome-hidden', !show);
    if (show) scheduleHide();
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (holdCount > 0 || sheetOpen() || dragging || hintShown) return scheduleHide();
      document.body.classList.add('chrome-hidden');
    }, 3000);
  }
  function keepChrome(on) { holdCount = Math.max(0, holdCount + (on ? 1 : -1)); if (!on) scheduleHide(); }
  document.querySelectorAll('.chrome').forEach(bar => {
    bar.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') keepChrome(true); });
    bar.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') keepChrome(false); });
    bar.addEventListener('focusin', () => setChrome(true));
  });
  // desktop: moving the mouse near the top or bottom edge brings the bars back
  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !document.body.classList.contains('chrome-hidden')) return;
    if (e.clientY < 56 || e.clientY > window.innerHeight - 56) setChrome(true);
  }, { passive: true });
  TR.on('ui:toggle-chrome', () => setChrome(document.body.classList.contains('chrome-hidden')));

  /* ---------- sheets ---------- */
  const scrim = el('div', 'tr-scrim'); panels.appendChild(scrim);
  let lastFocus = null;
  function openSheet(sheet) {
    closeSheets(true);
    lastFocus = document.activeElement;
    setChrome(true);
    sheet.hidden = false;
    scrim.classList.add('show');
    raf2(() => sheet.classList.add('open'));
  }
  function closeSheets(silent) {
    panels.querySelectorAll('.tr-sheet.open').forEach(s => {
      s.classList.remove('open');
      setTimeout(() => { if (!s.classList.contains('open')) s.hidden = true; }, 320);
    });
    scrim.classList.remove('show');
    if (!silent && lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (_) {} }
    scheduleHide();
  }
  scrim.addEventListener('click', () => closeSheets());

  /* Contents + Bookmarks sheet */
  const tocSheet = el('section', 'tr-sheet tr-sheet-left');
  tocSheet.hidden = true;
  tocSheet.setAttribute('role', 'dialog'); tocSheet.setAttribute('aria-label', 'Contents');
  tocSheet.innerHTML = `<header class="tr-sheet-head">
      <div class="tr-sheet-titles"><div class="tr-book-title">Tantrarājatantra</div><div class="tr-book-sub">with the Manoramā commentary</div></div>
      <button class="tr-btn tr-icon-btn tr-close" aria-label="Close">${icon('x')}</button>
    </header>
    <div class="tr-seg-ctl" role="tablist">
      <button role="tab" class="tr-tab active" data-tab="toc" aria-selected="true">Contents</button>
      <button role="tab" class="tr-tab" data-tab="bm" aria-selected="false">Bookmarks</button>
    </div>
    <div class="tr-sheet-body"><ol class="tr-toc-list"></ol><div class="tr-bm-list" hidden></div></div>`;
  panels.appendChild(tocSheet);
  const tocList = $('.tr-toc-list', tocSheet), bmList = $('.tr-bm-list', tocSheet);
  $('.tr-close', tocSheet).addEventListener('click', () => closeSheets());
  tocSheet.querySelectorAll('.tr-tab').forEach(t => t.addEventListener('click', () => setTab(t.dataset.tab)));
  function setTab(tab) {
    tocSheet.querySelectorAll('.tr-tab').forEach(t => { const on = t.dataset.tab === tab; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    tocList.hidden = tab !== 'toc'; bmList.hidden = tab !== 'bm';
    if (tab === 'bm') renderBookmarks();
  }
  function renderToc() {
    const s = TR.state.script;
    tocList.innerHTML = toc().map(c => {
      const e = cache[s][c.id];
      const cur = c.id === TR.state.chapter;
      return `<li><button class="tr-toc-item${cur ? ' current' : ''}" data-id="${c.id}"${cur ? ' aria-current="true"' : ''}>
        <span class="tr-toc-num">${c.id === '00-front-matter' ? '' : parseInt(c.id, 10)}</span>
        <span class="tr-toc-text"><span class="tr-toc-title">${esc(c[s] || c.id)}</span>${e && e.h2 ? `<span class="tr-toc-h2">${esc(e.h2)}</span>` : ''}</span>
      </button></li>`;
    }).join('');
  }
  tocList.addEventListener('click', e => {
    const b = e.target.closest('.tr-toc-item'); if (!b) return;
    closeSheets(true);
    if (b.dataset.id !== TR.state.chapter) TR.emit('nav:goto', { chapter: b.dataset.id, page: 0 });
    else if (TR.paginator && TR.paginator.goTo) TR.paginator.goTo(0);
  });
  function openToc() {
    setTab('toc');
    renderToc();
    openSheet(tocSheet);
    const cur = $('.tr-toc-item.current', tocSheet);
    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center' }), 30);
    setTimeout(() => $('.tr-tab.active', tocSheet).focus({ preventScroll: true }), 60);
    // fill chapter headings lazily
    const s = TR.state.script;
    let pendingPaint = null;
    loadAll(s, () => { if (!pendingPaint) pendingPaint = setTimeout(() => { pendingPaint = null; if (!tocSheet.hidden && TR.state.script === s) { const st = $('.tr-sheet-body', tocSheet).scrollTop; renderToc(); $('.tr-sheet-body', tocSheet).scrollTop = st; } }, 120); });
  }

  /* Bookmarks */
  const getBms = () => TR.store.get('bookmarks', []);
  const setBms = b => TR.store.set('bookmarks', b);
  function bookmarksHere() {
    const s = TR.state.script, id = TR.state.chapter, vr = lastVisible;
    return getBms().filter(b => b.chapter === id && (
      (vr && b.script === s && typeof b.offset === 'number') ? (b.offset >= vr.start && b.offset <= vr.end) : b.page === TR.state.page));
  }
  function toggleBookmark() {
    lastVisible = visibleRange();
    const here = bookmarksHere();
    let all = getBms();
    if (here.length) {
      all = all.filter(b => !here.includes(b));
    } else {
      const entry = { chapter: TR.state.chapter, page: TR.state.page, snippet: '', created: Date.now(), script: TR.state.script };
      const root = content();
      if (lastVisible && root) {
        entry.offset = lastVisible.start;
        entry.snippet = root.textContent.slice(lastVisible.start, lastVisible.start + 140).replace(/\s+/g, ' ').trim().slice(0, 110);
      } else if (root) entry.snippet = root.textContent.replace(/\s+/g, ' ').trim().slice(0, 110);
      all.push(entry);
    }
    // keep store objects identity-free
    setBms(all.map(b => ({ ...b })));
    paintBookmarkState(true);
    if (!bmList.hidden) renderBookmarks();
  }
  function renderBookmarks() {
    const all = getBms().slice().sort((a, b) => (TR.chapterIndex(a.chapter) - TR.chapterIndex(b.chapter)) || (a.page - b.page));
    if (!all.length) { bmList.innerHTML = `<div class="tr-empty">${icon('bookmark')}<p>No bookmarks yet.</p><p class="tr-muted">Press B or tap the bookmark at the top right to save this page.</p></div>`; return; }
    bmList.innerHTML = all.map(b => `<div class="tr-bm-row" data-created="${b.created}">
        <button class="tr-bm-item" data-created="${b.created}">
          <span class="tr-bm-meta">${esc(TR.titleOf(b.chapter))} · Page ${b.page + 1}</span>
          <span class="tr-bm-snip">${esc(b.snippet || '')}</span>
          <span class="tr-bm-date">${new Date(b.created).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </button>
        <button class="tr-btn tr-icon-btn tr-bm-del" data-created="${b.created}" aria-label="Delete bookmark">${icon('trash')}</button>
      </div>`).join('');
  }
  bmList.addEventListener('click', e => {
    const del = e.target.closest('.tr-bm-del');
    if (del) { setBms(getBms().filter(b => String(b.created) !== del.dataset.created)); renderBookmarks(); paintBookmarkState(); return; }
    const it = e.target.closest('.tr-bm-item'); if (!it) return;
    const b = getBms().find(x => String(x.created) === it.dataset.created); if (!b) return;
    closeSheets(true);
    const useOffset = typeof b.offset === 'number' && b.script === TR.state.script;
    if (b.chapter === TR.state.chapter) {
      if (useOffset) revealOffset(b.offset, b.offset + 1, false);
      else if (TR.paginator && TR.paginator.goTo) TR.paginator.goTo(b.page);
    } else {
      if (useOffset) pendingReveal = { chapter: b.chapter, start: b.offset, end: b.offset + 1, flash: false };
      TR.emit('nav:goto', { chapter: b.chapter, page: useOffset ? 0 : b.page });
    }
  });

  /* Ribbon marker on the page corner */
  const ribbon = el('div', 'tr-ribbon'); ribbon.setAttribute('aria-hidden', 'true'); panels.appendChild(ribbon);
  function placeRibbon() {
    const vp = viewport(); if (!vp) return;
    const r = vp.getBoundingClientRect();
    ribbon.style.left = (r.right - 44) + 'px';
    ribbon.style.top = Math.max(0, r.top) + 'px';
  }
  let lastVisible = null;
  function paintBookmarkState(animate) {
    const on = bookmarksHere().length > 0;
    const btn = $('#tr-btn-bm');
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? 'Remove bookmark (B)' : 'Bookmark this page (B)');
    placeRibbon();
    if (on && animate) { ribbon.classList.remove('show'); void ribbon.offsetWidth; }
    ribbon.classList.toggle('show', on);
  }

  /* Search sheet */
  const searchSheet = el('section', 'tr-sheet tr-sheet-right');
  searchSheet.hidden = true;
  searchSheet.setAttribute('role', 'dialog'); searchSheet.setAttribute('aria-label', 'Search the book');
  searchSheet.innerHTML = `<header class="tr-sheet-head">
      <label class="tr-search-field">${icon('search')}<input type="search" placeholder="Search the book" autocomplete="off" spellcheck="false" aria-label="Search the book"></label>
      <button class="tr-btn tr-close tr-text-btn">Done</button>
    </header>
    <div class="tr-search-status tr-muted"></div>
    <div class="tr-sheet-body"><ol class="tr-results"></ol></div>`;
  panels.appendChild(searchSheet);
  const sInput = $('input', searchSheet), sStatus = $('.tr-search-status', searchSheet), sResults = $('.tr-results', searchSheet);
  $('.tr-close', searchSheet).addEventListener('click', () => closeSheets());
  let searchSeq = 0, searchTimer = null, resultsData = [];
  sInput.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 180); });
  sInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const first = $('.tr-result', sResults); if (first) first.click(); }
    if (e.key === 'ArrowDown') { const first = $('.tr-result', sResults); if (first) { e.preventDefault(); first.focus(); } }
  });
  sResults.addEventListener('keydown', e => {
    const items = Array.from(sResults.querySelectorAll('.tr-result')); const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && i >= 0 && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
    if (e.key === 'ArrowUp' && i >= 0) { e.preventDefault(); (i === 0 ? sInput : items[i - 1]).focus(); }
  });
  async function runSearch() {
    const seq = ++searchSeq, s = TR.state.script;
    const raw = sInput.value.trim();
    if (raw.length < 2) { sResults.innerHTML = ''; sStatus.textContent = raw ? 'Type at least 2 letters.' : ''; return; }
    const q = fold(raw, s === 'iast').folded;
    const MAX = 300;
    let count = 0, html = [];
    resultsData = [];
    const ids = toc().map(c => c.id);
    const loadedAll = ids.every(id => cache[s][id]);
    if (!loadedAll) sStatus.textContent = 'Loading chapters…';
    await loadAll(s, (id, e, done, total) => { if (seq === searchSeq && done < total) sStatus.textContent = `Loading chapters ${done} of ${total}…`; });
    if (seq !== searchSeq) return;
    for (const id of ids) {
      const e = cache[s][id]; if (!e) continue;
      const f = foldedOf(s, e);
      let from = 0, hits = [];
      while (count < MAX) {
        const k = f.folded.indexOf(q, from); if (k < 0) break;
        const start = f.map ? f.map[k] : k, end = f.map ? f.map[k + q.length] : k + q.length;
        hits.push([start, end]); count++; from = k + q.length;
      }
      if (!hits.length) continue;
      html.push(`<li class="tr-result-group"><div class="tr-result-chapter">${esc(TR.titleOf(id))}<span class="tr-muted">${hits.length}${hits.length >= MAX ? '+' : ''}</span></div><ol>`);
      for (const [a, b] of hits) {
        const pre = e.text.slice(Math.max(0, a - 48), a).replace(/\s+/g, ' ');
        const post = e.text.slice(b, b + 72).replace(/\s+/g, ' ');
        const n = resultsData.push({ chapter: id, start: a, end: b }) - 1;
        html.push(`<li><button class="tr-result" data-n="${n}">${a > 48 ? '…' : ''}${esc(pre)}<mark>${esc(e.text.slice(a, b))}</mark>${esc(post)}…</button></li>`);
      }
      html.push('</ol></li>');
      if (count >= MAX) break;
    }
    sResults.innerHTML = html.join('');
    sStatus.textContent = count ? `${count >= MAX ? MAX + '+' : count} result${count === 1 ? '' : 's'}` : 'No results in this script.' + (s === 'dev' ? ' Try the IAST script for Latin letters.' : '');
  }
  sResults.addEventListener('click', e => {
    const b = e.target.closest('.tr-result'); if (!b) return;
    const r = resultsData[+b.dataset.n]; if (!r) return;
    closeSheets(true);
    if (r.chapter === TR.state.chapter) { setTimeout(() => revealOffset(r.start, r.end, true), 60); }
    else { pendingReveal = { chapter: r.chapter, start: r.start, end: r.end, flash: true }; TR.emit('nav:goto', { chapter: r.chapter, page: 0 }); }
  });
  function openSearch() {
    openSheet(searchSheet);
    setTimeout(() => { sInput.focus(); sInput.select(); }, 60);
    loadAll(TR.state.script);
  }

  /* ---------- first-run hint card ---------- */
  let hintShown = false;
  function maybeHint() {
    if (TR.store.get('nav:hint-seen', false)) return;
    hintShown = true;
    const card = el('div', 'tr-hint');
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'How to read');
    card.innerHTML = `<div class="tr-hint-title">Reading this book</div>
      <ul>
        <li>${icon('tap')}<span>Tap the right or left edge, swipe, or use the arrow keys to turn pages.</span></li>
        <li>${icon('pencil')}<span>Select text, or draw across it with Apple Pencil, to highlight.</span></li>
        <li>${icon('aa')}<span>Tap Aa for themes, text size and script.</span></li>
      </ul>
      <button class="tr-hint-ok">Start reading</button>`;
    panels.appendChild(card);
    raf2(() => card.classList.add('show'));
    const done = () => { TR.store.set('nav:hint-seen', true); hintShown = false; card.classList.remove('show'); setTimeout(() => card.remove(), 320); scheduleHide(); };
    $('.tr-hint-ok', card).addEventListener('click', done);
    card.addEventListener('keydown', e => { if (e.key === 'Escape') done(); });
  }

  /* ---------- buttons + keyboard ---------- */
  $('#tr-btn-toc').addEventListener('click', () => tocSheet.classList.contains('open') ? closeSheets() : openToc());
  $('#tr-btn-search').addEventListener('click', () => searchSheet.classList.contains('open') ? closeSheets() : openSearch());
  $('#tr-btn-bm').addEventListener('click', toggleBookmark);
  window.addEventListener('keydown', e => {
    const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (e.key === 'Escape' && sheetOpen()) { e.preventDefault(); e.stopImmediatePropagation(); closeSheets(); return; }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); e.stopImmediatePropagation(); openSearch(); return; }
    if (sheetOpen()) { if (!typing && /^(Arrow(Left|Right)| |PageUp|PageDown)$/.test(e.key)) e.stopImmediatePropagation(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 't' || e.key === 'T') { e.preventDefault(); openToc(); }
    else if (e.key === '/') { e.preventDefault(); openSearch(); }
    else if (e.key === 'b' || e.key === 'B') { e.preventDefault(); toggleBookmark(); }
  }, true);

  /* ---------- events from the reader ---------- */
  TR.on('page:changed', d => {
    if (d) { if (d.page != null) TR.state.page = d.page; if (d.pageCount != null) TR.state.pageCount = d.pageCount; }
    TR.store.set('page:' + TR.state.chapter, TR.state.page);
    if (!weights.length || weights.length !== toc().length) updateWeights();
    paintLabels(); paintProgress();
    if (pendingFrac && pendingFrac.chapter === TR.state.chapter) {
      const pf = pendingFrac; pendingFrac = null;
      const target = Math.round(pf.frac * (Math.max(1, TR.state.pageCount) - 1));
      if (target > 0 && TR.paginator && TR.paginator.goTo) { TR.paginator.goTo(target); return; }
    }
    if (pendingReveal && pendingReveal.chapter === TR.state.chapter) {
      const pr = pendingReveal; pendingReveal = null;
      raf2(() => revealOffset(pr.start, pr.end, pr.flash));
    }
    raf2(() => { lastVisible = visibleRange(); paintBookmarkState(false); });
    scheduleHide();
  });
  TR.on('chapter:loaded', d => {
    if (d && d.id) TR.state.chapter = d.id;
    if (!weights.length || weights.length !== toc().length) updateWeights();
    paintLabels(); paintProgress();
    ribbon.classList.remove('show');
    // without a paginator, still reveal search targets
    if (!TR.paginator && pendingReveal && pendingReveal.chapter === d.id) { const pr = pendingReveal; pendingReveal = null; raf2(() => revealOffset(pr.start, pr.end, pr.flash)); }
    if (!hintShown && !TR.store.get('nav:hint-seen', false)) setTimeout(maybeHint, 600);
  });
  TR.on('script:changed', () => { updateWeights(); if (!tocSheet.hidden) renderToc(); if (!searchSheet.hidden) runSearch(); });
  TR.on('layout:changed', () => raf2(() => { lastVisible = visibleRange(); paintBookmarkState(false); }));
  window.addEventListener('resize', () => { placeRibbon(); paintProgress(); }, { passive: true });

  paintLabels();
  scheduleHide();

  TR.nav = { openToc, openSearch, toggleBookmark, closeSheets, showChrome: () => setChrome(true) };
})();
