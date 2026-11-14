/* highlights.js: Apple Books style highlighter.
   - Select text (mouse drag, long-press, keyboard) -> floating menu: 5 colours, underline, note, copy.
   - Apple Pencil (pointerType 'pen') paints the highlight live under the tip, commits on lift.
   - New highlights sweep in line by line like a marker stroke.
   - Highlights are <mark class="hl hl-yellow" data-id> wrappers, stored per contract under
     TR.store 'hl:<script>:<chapter>' = [{id, start, end, color, style, note, text, created}]
     where start/end are character offsets into #page-content textContent.
   - Notes: tiny margin marker, small editor. TR.highlights.openList() lists everything with export/import.
   Talks to the rest of the app only through window.TR. */
(function () {
  const TR = window.TR;
  if (!TR) return;

  /* ---------- Phosphor icons, inlined from @phosphor-icons/core@2.1.1 ---------- */
  const P = {
    highlighter: 'M253.66,106.34a8,8,0,0,0-11.32,0L192,156.69,107.31,72l50.35-50.34a8,8,0,1,0-11.32-11.32L96,60.69A16,16,0,0,0,93.18,79.5L72,100.69a16,16,0,0,0,0,22.62L76.69,128,18.34,186.34a8,8,0,0,0,3.13,13.25l72,24A7.88,7.88,0,0,0,96,224a8,8,0,0,0,5.66-2.34L136,187.31l4.69,4.69a16,16,0,0,0,22.62,0l21.19-21.18A16,16,0,0,0,203.31,168l50.35-50.34A8,8,0,0,0,253.66,106.34ZM93.84,206.85l-55-18.35L88,139.31,124.69,176ZM152,180.69,83.31,112,104,91.31,172.69,160Z',
    highlighterFill: 'M253.66,106.34a8,8,0,0,0-11.32,0L192,156.69,107.31,72l50.35-50.34a8,8,0,1,0-11.32-11.32L96,60.69A16,16,0,0,0,93.18,79.5L72,100.69a16,16,0,0,0,0,22.62L76.69,128,18.34,186.34a8,8,0,0,0,3.13,13.25l72,24A7.88,7.88,0,0,0,96,224a8,8,0,0,0,5.66-2.34L136,187.31l4.69,4.69a16,16,0,0,0,22.62,0l21.18-21.18A16,16,0,0,0,203.31,168l50.35-50.34A8,8,0,0,0,253.66,106.34ZM152,180.69,83.31,112,104,91.31,172.69,160Z',
    underline: 'M200,224a8,8,0,0,1-8,8H64a8,8,0,0,1,0-16H192A8,8,0,0,1,200,224Zm-72-24a64.07,64.07,0,0,0,64-64V56a8,8,0,0,0-16,0v80a48,48,0,0,1-96,0V56a8,8,0,0,0-16,0v80A64.07,64.07,0,0,0,128,200Z',
    notePencil: 'M229.66,58.34l-32-32a8,8,0,0,0-11.32,0l-96,96A8,8,0,0,0,88,128v32a8,8,0,0,0,8,8h32a8,8,0,0,0,5.66-2.34l96-96A8,8,0,0,0,229.66,58.34ZM124.69,152H104V131.31l64-64L188.69,88ZM200,76.69,179.31,56,192,43.31,212.69,64ZM224,128v80a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h80a8,8,0,0,1,0,16H48V208H208V128a8,8,0,0,1,16,0Z',
    noteFill: 'M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H156.69A15.92,15.92,0,0,0,168,219.31L219.31,168A15.92,15.92,0,0,0,224,156.69V48A16,16,0,0,0,208,32ZM96,88h64a8,8,0,0,1,0,16H96a8,8,0,0,1,0-16Zm32,80H96a8,8,0,0,1,0-16h32a8,8,0,0,1,0,16ZM96,136a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Zm64,68.69V160h44.7Z',
    copy: 'M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z',
    trash: 'M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z',
    x: 'M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z',
    check: 'M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z',
    download: 'M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z',
    upload: 'M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V144a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z',
  };
  const icon = (name, cls = '') => `<svg class="hl-ico ${cls}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="${P[name]}"/></svg>`;

  /* ---------- constants + helpers ---------- */
  const COLORS = ['yellow', 'green', 'blue', 'pink', 'purple'];
  const NAMES = { yellow: 'Yellow', green: 'Green', blue: 'Blue', pink: 'Pink', purple: 'Purple' };
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const content = () => document.getElementById('page-content');
  const viewport = () => document.getElementById('viewport');
  const panels = () => document.getElementById('panels') || document.body;
  const raf2 = fn => requestAnimationFrame(() => requestAnimationFrame(fn));
  const uid = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const key = (sc, ch) => `hl:${sc}:${ch}`;
  const load = (ch = TR.state.chapter, sc = TR.state.script) => { const v = TR.store.get(key(sc, ch), []); return Array.isArray(v) ? v : []; };
  const save = (list, ch = TR.state.chapter, sc = TR.state.script) => TR.store.set(key(sc, ch), list);
  const pref = { get color() { return TR.store.get('hlpref:color', 'yellow'); }, set color(v) { TR.store.set('hlpref:color', v); } };

  function isDarkBg() {
    const c = getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g);
    if (!c) return false;
    const [r, g, b] = c.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 110;
  }
  function syncDark() { document.body.classList.toggle('hl-dark', isDarkBg()); }

  /* ---------- text offsets over #page-content textContent ---------- */
  function offsetOf(node, off) {
    const r = document.createRange();
    r.setStart(content(), 0);
    try { r.setEnd(node, off); } catch (e) { return 0; }
    return r.toString().length;
  }
  function rangeToOffsets(range) {
    const root = content();
    if (!root || !root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
    let start = offsetOf(range.startContainer, range.startOffset);
    let end = offsetOf(range.endContainer, range.endOffset);
    if (end < start) [start, end] = [end, start];
    const text = root.textContent;
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    return end > start ? { start, end } : null;
  }

  /* ---------- DOM wrapping ---------- */
  const BLOCKISH = /^(ARTICLE|BLOCKQUOTE|DIV|SECTION|UL|OL|TABLE|TBODY|TR|MAIN|BODY)$/;
  function markClass(h) {
    return `hl hl-${COLORS.includes(h.color) ? h.color : 'yellow'}` + (h.style === 'underline' ? ' hl-underline' : '') + (h.note ? ' hl-has-note' : '');
  }
  function wrap(h) {
    const root = content();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const parts = [];
    let pos = 0, n;
    while ((n = walker.nextNode())) {
      const len = n.data.length, s = pos;
      pos += len;
      if (pos <= h.start) continue;
      if (s >= h.end) break;
      parts.push([n, Math.max(0, h.start - s), Math.min(len, h.end - s)]);
    }
    const marks = [];
    for (const [node, a, b] of parts) {
      if (a >= b || !node.parentNode) continue;
      if (BLOCKISH.test(node.parentNode.nodeName) && !node.data.slice(a, b).trim()) continue;
      let t = node;
      if (a > 0) t = t.splitText(a);
      if (b - a < t.data.length) t.splitText(b - a);
      const m = document.createElement('mark');
      m.className = markClass(h);
      m.dataset.id = h.id;
      t.parentNode.insertBefore(m, t);
      m.appendChild(t);
      marks.push(m);
    }
    return marks;
  }
  function unwrapMarks(marks) {
    const parents = new Set();
    marks.forEach(m => {
      const p = m.parentNode; if (!p) return;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      p.removeChild(m); parents.add(p);
    });
    parents.forEach(p => p.normalize());
  }
  const marksOf = id => Array.from(content().querySelectorAll(`mark.hl[data-id="${id}"]`));

  /* Re-draw every highlight of the current chapter from storage. */
  function repaint() {
    const root = content(); if (!root) return;
    unwrapMarks(Array.from(root.querySelectorAll('mark.hl')));
    const list = load();
    if (list.length) {
      const text = root.textContent;
      let fixed = false;
      for (const h of list) {
        // if the text moved (data edit), re-anchor by the saved quote
        if (h.text && text.slice(h.start, h.end) !== h.text) {
          let i = text.indexOf(h.text, Math.max(0, h.start - 2000));
          if (i < 0) i = text.indexOf(h.text);
          if (i < 0) continue;
          h.start = i; h.end = i + h.text.length; fixed = true;
        }
        wrap(h);
      }
      if (fixed) save(list);
    }
    placeNotes();
  }

  /* ---------- line rectangles (for the sweep and the pencil) ---------- */
  function mergeLines(rectList) {
    const out = [];
    for (const r of rectList) {
      if (r.width < 0.5 || r.height < 1) continue;
      const last = out[out.length - 1];
      if (last && Math.abs(last.top - r.top) < r.height * 0.5 && r.left - last.right < 4 && r.left >= last.left - 1) {
        last.right = Math.max(last.right, r.right); last.bottom = Math.max(last.bottom, r.bottom); last.top = Math.min(last.top, r.top);
      } else out.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    }
    return out.map(r => ({ ...r, width: r.right - r.left, height: r.bottom - r.top }));
  }
  function visibleRect() { const v = viewport(); return v ? v.getBoundingClientRect() : { left: 0, top: 0, right: innerWidth, bottom: innerHeight, width: innerWidth, height: innerHeight }; }
  function onScreen(r, vp) { return r.right > vp.left + 1 && r.left < vp.right - 1 && r.bottom > vp.top && r.top < vp.bottom; }

  /* ---------- fx layer: sweep + live pencil ink ---------- */
  let fx = null;
  function fxLayer() {
    if (!fx || !fx.isConnected) { fx = el('div', 'hl-fx'); fx.setAttribute('aria-hidden', 'true'); panels().appendChild(fx); }
    return fx;
  }
  const jitter = (a) => (Math.random() * 2 - 1) * a;
  function inkBox(r, color, underline) {
    const d = el('div', `hl-ink hl-ink-${color}` + (underline ? ' hl-ink-ul' : ''));
    const top = underline ? r.bottom - 2.5 : r.top + jitter(0.6);
    const h = underline ? 2 : r.height + jitter(0.8);
    d.style.cssText = `left:${r.left - 1}px;top:${top}px;width:${r.width + 2}px;height:${h}px;transform:rotate(${jitter(0.25).toFixed(2)}deg)`;
    return d;
  }

  /* The signature marker stroke: each line fills left to right, one after another. */
  function sweep(marks, h) {
    if (!marks.length) return;
    if (reduced()) { marks.forEach(m => m.animate && m.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' })); return; }
    syncDark();
    const vp = visibleRect();
    const rects = [];
    marks.forEach(m => rects.push(...m.getClientRects()));
    const lines = mergeLines(rects).filter(r => onScreen(r, vp));
    if (!lines.length) return;
    const layer = fxLayer();
    marks.forEach(m => m.classList.add('hl-sweeping'));
    const per = Math.max(160, Math.min(300, 250));
    const step = per * 0.72;
    let done = 0;
    const boxes = lines.map((r, i) => {
      const d = inkBox(r, h.color, h.style === 'underline');
      layer.appendChild(d);
      const a = d.animate([{ clipPath: 'inset(0 100% 0 0 round 2px)' }, { clipPath: 'inset(0 0% 0 0 round 2px)' }],
        { duration: per * Math.min(1.25, Math.max(0.7, r.width / 420)), delay: i * step, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'both' });
      a.onfinish = () => { if (++done === boxes.length) finish(); };
      return d;
    });
    let ended = false;
    function finish() {
      if (ended) return; ended = true;
      marks.forEach(m => m.classList.remove('hl-sweeping'));
      requestAnimationFrame(() => boxes.forEach(b => b.remove()));
    }
    setTimeout(finish, lines.length * step + per * 1.4 + 200); // safety net
  }

  /* ---------- create / change / remove ---------- */
  function create(start, end, color, style, opts = {}) {
    const root = content(); if (!root) return null;
    const text = root.textContent;
    const list = load();
    let note = opts.note || '';
    const keep = [];
    for (const h of list) {
      if (h.end > start && h.start < end) { // overlap: merge into one, like Apple Books
        start = Math.min(start, h.start); end = Math.max(end, h.end);
        if (h.note) note = note ? note + '\n' + h.note : h.note;
        unwrapMarks(marksOf(h.id));
      } else keep.push(h);
    }
    const h = { id: uid(), start, end, color, style: style || 'highlight', note, text: text.slice(start, end), created: new Date().toISOString() };
    keep.push(h); keep.sort((a, b) => a.start - b.start);
    save(keep);
    pref.color = color;
    const marks = wrap(h);
    if (opts.animate !== false) sweep(marks, h);
    placeNotes();
    TR.emit('highlights:changed', { chapter: TR.state.chapter });
    return h;
  }
  function update(id, patch) {
    const list = load();
    const h = list.find(x => x.id === id); if (!h) return null;
    Object.assign(h, patch);
    save(list);
    marksOf(id).forEach(m => { m.className = markClass(h); });
    if ('color' in patch) pref.color = h.color;
    placeNotes();
    TR.emit('highlights:changed', { chapter: TR.state.chapter });
    return h;
  }
  function remove(id) {
    save(load().filter(x => x.id !== id));
    const marks = marksOf(id);
    if (!reduced() && marks.length && marks[0].animate) {
      marks.forEach(m => m.classList.add('hl-removing'));
      setTimeout(() => { unwrapMarks(marksOf(id)); placeNotes(); }, 200);
    } else { unwrapMarks(marks); placeNotes(); }
    TR.emit('highlights:changed', { chapter: TR.state.chapter });
  }
  const getH = id => load().find(x => x.id === id);

  /* ---------- clipboard + toast ---------- */
  function copyText(t) {
    const fallback = () => { const ta = el('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(fallback); else fallback();
    toast('Copied');
  }
  let toastEl = null, toastTimer = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = el('div', 'hl-ui hl-toast'); toastEl.setAttribute('role', 'status'); panels().appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
  }

  /* ---------- floating menu ---------- */
  const menu = el('div', 'hl-ui hl-menu');
  menu.setAttribute('role', 'toolbar'); menu.setAttribute('aria-label', 'Highlight');
  menu.innerHTML = `<div class="hl-swatches">${COLORS.map((c, i) => `<button type="button" class="hl-swatch hl-sw-${c}" data-color="${c}" aria-label="${NAMES[c]} highlight (${i + 1})" title="${NAMES[c]} (${i + 1})">${icon('check', 'hl-sw-check')}</button>`).join('')}</div>
    <span class="hl-sep" aria-hidden="true"></span>
    <button type="button" class="hl-btn" data-act="underline" aria-label="Underline (U)" title="Underline (U)">${icon('underline')}</button>
    <button type="button" class="hl-btn" data-act="note" aria-label="Note (N)" title="Note (N)">${icon('notePencil')}</button>
    <button type="button" class="hl-btn" data-act="copy" aria-label="Copy (C)" title="Copy (C)">${icon('copy')}</button>
    <button type="button" class="hl-btn" data-act="remove" aria-label="Remove highlight (Delete)" title="Remove (Delete)">${icon('trash')}</button>`;
  let menuState = null; // {mode:'selection', range} | {mode:'highlight', id}

  function placePopover(pop, rects, preferBelow) {
    const vw = innerWidth, vh = innerHeight;
    pop.style.left = '0px'; pop.style.top = '0px';
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    const first = rects[0], last = rects[rects.length - 1];
    const topLimit = 56; // keep clear of the top bar
    let top, below = preferBelow;
    if (!below && first.top - ph - 10 < topLimit) below = true;
    if (below && last.bottom + ph + 10 > vh - 8) below = false;
    const anchor = below ? last : first;
    top = below ? anchor.bottom + 10 : anchor.top - ph - 10;
    let left = (anchor.left + anchor.right) / 2 - pw / 2;
    left = Math.max(8, Math.min(vw - pw - 8, left));
    top = Math.max(8, Math.min(vh - ph - 8, top));
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
    pop.dataset.side = below ? 'below' : 'above';
  }
  function showPop(pop) {
    if (!pop.isConnected) panels().appendChild(pop);
    pop.classList.remove('open');
    void pop.offsetWidth;
    pop.classList.add('open');
  }
  function openMenu(state, rects) {
    closeEditor();
    menuState = state;
    const h = state.mode === 'highlight' ? getH(state.id) : null;
    menu.classList.toggle('is-highlight', !!h);
    menu.querySelectorAll('.hl-swatch').forEach(b => {
      const on = !!h && b.dataset.color === h.color;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    const ul = menu.querySelector('[data-act="underline"]');
    const ulOn = !!h && h.style === 'underline';
    ul.classList.toggle('active', ulOn); ul.setAttribute('aria-pressed', String(ulOn));
    const nb = menu.querySelector('[data-act="note"]');
    nb.classList.toggle('active', !!(h && h.note));
    if (!menu.isConnected) panels().appendChild(menu);
    menu.hidden = false;
    const coarse = matchMedia('(pointer: coarse)').matches;
    placePopover(menu, rects, state.mode === 'selection' && coarse); // iOS puts its own callout above, so go below
    showPop(menu);
  }
  function closeMenu() {
    if (!menuState) return;
    menuState = null;
    menu.classList.remove('open');
    setTimeout(() => { if (!menuState) menu.hidden = true; }, 160);
  }
  function rectsOfRange(range) { return mergeLines(Array.from(range.getClientRects())); }
  function rectsOfId(id) {
    const vp = visibleRect();
    const rs = []; marksOf(id).forEach(m => rs.push(...m.getClientRects()));
    const lines = mergeLines(rs);
    const vis = lines.filter(r => onScreen(r, vp));
    return vis.length ? vis : lines;
  }

  function currentSelectionRange() {
    const sel = getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    const root = content();
    if (!root || !root.contains(r.commonAncestorContainer)) return null;
    if (!String(sel).trim()) return null;
    return r;
  }
  function maybeSelectionMenu() {
    const r = currentSelectionRange();
    if (!r) { if (menuState && menuState.mode === 'selection') closeMenu(); return; }
    const rects = rectsOfRange(r);
    if (!rects.length) return;
    openMenu({ mode: 'selection', range: r.cloneRange() }, rects);
  }
  function selectionToHighlight(color, style, extra) {
    const r = currentSelectionRange() || (menuState && menuState.range);
    if (!r) return null;
    const o = rangeToOffsets(r);
    const sel = getSelection(); if (sel) sel.removeAllRanges();
    closeMenu();
    if (!o) return null;
    return create(o.start, o.end, color, style, extra);
  }

  function menuAction(act, color) {
    const st = menuState; if (!st) return;
    if (st.mode === 'selection') {
      if (color) return void selectionToHighlight(color, 'highlight');
      if (act === 'underline') return void selectionToHighlight(pref.color, 'underline');
      if (act === 'note') { const h = selectionToHighlight(pref.color, 'highlight'); if (h) setTimeout(() => openEditor(h.id), reduced() ? 0 : 260); return; }
      if (act === 'copy') { const r = currentSelectionRange() || st.range; copyText(String(r)); closeMenu(); return; }
      return;
    }
    const h = getH(st.id); if (!h) return closeMenu();
    if (color) { update(h.id, { color, style: h.style === 'underline' ? 'underline' : 'highlight' }); return closeMenu(); }
    if (act === 'underline') { update(h.id, { style: h.style === 'underline' ? 'highlight' : 'underline' }); return closeMenu(); }
    if (act === 'note') { closeMenu(); return openEditor(h.id); }
    if (act === 'copy') { copyText(h.text); return closeMenu(); }
    if (act === 'remove') { closeMenu(); remove(h.id); }
  }
  menu.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); }); // keep the selection alive
  menu.addEventListener('click', e => {
    e.stopPropagation();
    const b = e.target.closest('button'); if (!b) return;
    menuAction(b.dataset.act, b.dataset.color);
  });

  /* ---------- note editor ---------- */
  const editor = el('div', 'hl-ui hl-editor');
  editor.setAttribute('role', 'dialog'); editor.setAttribute('aria-label', 'Note');
  editor.innerHTML = `<div class="hl-ed-quote"></div>
    <textarea class="hl-ed-text" rows="4" placeholder="Add a note" aria-label="Note text"></textarea>
    <div class="hl-ed-row"><button type="button" class="hl-btn hl-ed-del" aria-label="Delete note" title="Delete note">${icon('trash')}</button>
    <span class="hl-ed-hint">Saved as you type</span><button type="button" class="hl-ed-done">Done</button></div>`;
  editor.hidden = true;
  const edText = $('.hl-ed-text', editor);
  let edId = null, edTimer = 0;
  function openEditor(id) {
    const h = getH(id); if (!h) return;
    closeMenu();
    edId = id;
    $('.hl-ed-quote', editor).textContent = h.text.length > 140 ? h.text.slice(0, 140) + '…' : h.text;
    $('.hl-ed-quote', editor).dataset.color = h.color;
    edText.value = h.note || '';
    if (!editor.isConnected) panels().appendChild(editor);
    editor.hidden = false;
    placePopover(editor, rectsOfId(id), true);
    showPop(editor);
    setTimeout(() => { try { edText.focus({ preventScroll: true }); } catch (e) { edText.focus(); } }, 30);
  }
  function saveEditor() {
    if (!edId) return;
    const h = getH(edId); if (!h) return;
    const v = edText.value.trim();
    if (v !== (h.note || '')) update(edId, { note: v });
  }
  function closeEditor() {
    if (!edId) return;
    clearTimeout(edTimer); saveEditor(); edId = null;
    editor.classList.remove('open');
    setTimeout(() => { if (!edId) editor.hidden = true; }, 160);
    if (document.activeElement === edText) edText.blur();
  }
  edText.addEventListener('input', () => { clearTimeout(edTimer); edTimer = setTimeout(saveEditor, 350); });
  editor.addEventListener('pointerdown', e => e.stopPropagation());
  editor.addEventListener('click', e => {
    e.stopPropagation();
    if (e.target.closest('.hl-ed-done')) closeEditor();
    else if (e.target.closest('.hl-ed-del')) { edText.value = ''; closeEditor(); }
  });
  editor.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); closeEditor(); }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); closeEditor(); }
  });

  /* ---------- margin note markers ---------- */
  let notesLayer = null, trackUntil = 0;
  function placeNotes() {
    const root = content(); if (!root) return;
    if (!notesLayer || !notesLayer.isConnected) { notesLayer = el('div', 'hl-notes'); panels().appendChild(notesLayer); }
    const vp = visibleRect();
    const withNotes = load().filter(h => h.note);
    const used = new Set();
    for (const h of withNotes) {
      const first = root.querySelector(`mark.hl[data-id="${h.id}"]`);
      let btn = notesLayer.querySelector(`[data-id="${h.id}"]`);
      const r = first && Array.from(first.getClientRects()).find(x => x.width > 0);
      if (!r || !onScreen(r, vp)) { if (btn) btn.remove(); continue; }
      // left edge of this line inside its block, so the marker sits in the page margin
      const block = first.closest('p, h1, h2, li, blockquote') || first.parentElement;
      let lineLeft = r.left;
      try {
        const br = document.createRange(); br.selectNodeContents(block);
        for (const lr of br.getClientRects()) if (Math.abs(lr.top - r.top) < r.height * 0.6 && lr.width > 0) lineLeft = Math.min(lineLeft, lr.left);
      } catch (e) {}
      const size = 16;
      let x = lineLeft - size - 6;
      if (x < vp.left + 2) x = vp.left + 2;
      if (!btn) {
        btn = el('button', 'hl-ui hl-note-pin', icon('noteFill'));
        btn.type = 'button'; btn.dataset.id = h.id;
        btn.setAttribute('aria-label', 'Open note'); btn.title = h.note.slice(0, 80);
        btn.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); });
        btn.addEventListener('click', e => { e.stopPropagation(); openEditor(btn.dataset.id); });
        notesLayer.appendChild(btn);
      }
      btn.title = h.note.slice(0, 80);
      btn.dataset.color = h.color;
      btn.style.transform = `translate(${Math.round(x)}px, ${Math.round(r.top + (r.height - size) / 2)}px)`;
      used.add(h.id);
    }
    notesLayer.querySelectorAll('.hl-note-pin').forEach(b => { if (!used.has(b.dataset.id)) b.remove(); });
  }
  /* follow the page while the paginator animates a turn (about 320ms) */
  function trackNotes(ms = 420) {
    trackUntil = performance.now() + ms;
    const loop = () => { placeNotes(); if (performance.now() < trackUntil) requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  /* ---------- Apple Pencil: paint live under the tip ---------- */
  function caretAt(x, y) {
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); if (p && p.offsetNode) return { node: p.offsetNode, offset: p.offset }; }
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (r) return { node: r.startContainer, offset: r.startOffset }; }
    return null;
  }
  const onText = t => { const root = content(); return !!(root && t && t !== root && t.nodeType === 1 && root.contains(t)); };
  let pen = null, penRaf = 0, penInk = [];
  function penStart(e) {
    if (!onText(e.target)) return false;
    const c = caretAt(e.clientX, e.clientY);
    if (!c || !content().contains(c.node)) return false;
    e.preventDefault(); e.stopPropagation();
    closeMenu(); closeEditor();
    const sel = getSelection(); if (sel) sel.removeAllRanges();
    syncDark();
    pen = { id: e.pointerId, anchor: c, x: e.clientX, y: e.clientY, moved: false, focus: c, target: e.target, t: performance.now() };
    document.body.classList.add('hl-pen-active');
    return true;
  }
  function penRange() {
    if (!pen) return null;
    const r = document.createRange();
    const a = pen.anchor, b = pen.focus;
    try {
      r.setStart(a.node, a.offset); r.setEnd(a.node, a.offset);
      const cmp = r.comparePoint(b.node, b.offset);
      if (cmp < 0) { r.setStart(b.node, b.offset); r.setEnd(a.node, a.offset); } else r.setEnd(b.node, b.offset);
    } catch (err) { return null; }
    return r;
  }
  function penDraw() {
    penRaf = 0;
    const r = penRange(); if (!r) return;
    const lines = mergeLines(Array.from(r.getClientRects()));
    const layer = fxLayer();
    const color = pref.color;
    while (penInk.length < lines.length) { const d = inkBox(lines[penInk.length], color, false); d.classList.add('hl-ink-live'); layer.appendChild(d); penInk.push(d); }
    while (penInk.length > lines.length) penInk.pop().remove();
    lines.forEach((ln, i) => { const d = penInk[i]; d.style.left = (ln.left - 1) + 'px'; d.style.width = (ln.width + 2) + 'px'; d.style.top = ln.top + 'px'; d.style.height = ln.height + 'px'; });
  }
  function penMove(e) {
    if (!pen || e.pointerId !== pen.id) return;
    e.stopPropagation(); e.preventDefault();
    if (!pen.moved && Math.hypot(e.clientX - pen.x, e.clientY - pen.y) < 4) return;
    pen.moved = true;
    const c = caretAt(e.clientX, e.clientY);
    if (c && content().contains(c.node)) pen.focus = c;
    if (!penRaf) penRaf = requestAnimationFrame(penDraw);
  }
  function penEnd(e, cancelled) {
    if (!pen || e.pointerId !== pen.id) return;
    e.stopPropagation();
    const p = pen; pen = null;
    cancelAnimationFrame(penRaf); penRaf = 0;
    document.body.classList.remove('hl-pen-active');
    const ink = penInk; penInk = [];
    if (!cancelled && p.moved) {
      pen = p; const r = penRange(); pen = null;
      const o = r && rangeToOffsets(r);
      if (o) create(o.start, o.end, pref.color, 'highlight', { animate: false });
      requestAnimationFrame(() => ink.forEach(d => d.remove()));
      swallowClick = true;
      return;
    }
    ink.forEach(d => d.remove());
    if (cancelled) return;
    // a pencil tap: on a highlight opens its menu, elsewhere acts like a finger tap
    const m = p.target.closest && p.target.closest('mark.hl');
    swallowClick = true;
    if (m) openHighlightMenu(m.dataset.id);
    else zoneTap(e.clientX, null);
  }

  /* ---------- taps on highlights, dismissal, selection tracking ---------- */
  let down = false, tap = null, swallowClick = false, swallowTimer = 0, selTimer = 0;
  function zoneOf(x) { const r = visibleRect(); const fx = (x - r.left) / r.width; return fx > 2 / 3 ? 'next' : fx < 1 / 3 ? 'prev' : 'mid'; }
  /* The paginator ignores taps on <mark>, so page-turn taps that land on a highlight are done here. */
  function zoneTap(x, id) {
    const z = zoneOf(x);
    const pg = TR.paginator;
    if (z === 'next' && pg) return pg.next();
    if (z === 'prev' && pg) return pg.prev();
    if (id) return openHighlightMenu(id);
    const before = document.body.classList.contains('chrome-hidden');
    TR.emit('ui:toggle-chrome', {});
    if (document.body.classList.contains('chrome-hidden') === before) document.body.classList.toggle('chrome-hidden');
  }
  function openHighlightMenu(id) {
    const rects = rectsOfId(id); if (!rects.length) return;
    openMenu({ mode: 'highlight', id }, rects);
  }
  const anyOpen = () => !!(menuState || edId);

  window.addEventListener('pointerdown', e => {
    swallowClick = false; clearTimeout(swallowTimer);
    if (e.pointerType === 'pen' && penStart(e)) return;
    if (e.target.closest && e.target.closest('.hl-ui, .hl-sheet')) return;
    down = true;
    if (anyOpen()) {
      // first tap outside only dismisses (like Apple Books); it must not turn the page
      const hadSel = !!currentSelectionRange();
      closeMenu(); closeEditor();
      if (!hadSel && viewport() && viewport().contains(e.target)) { e.stopPropagation(); swallowClick = true; }
      tap = null;
      return;
    }
    const m = e.target.closest && e.target.closest('mark.hl');
    tap = (m && content().contains(m) && (e.pointerType !== 'mouse' || e.button === 0)) ? { id: m.dataset.id, x: e.clientX, y: e.clientY, t: performance.now(), sel: !!currentSelectionRange() } : null;
  }, true);
  window.addEventListener('pointermove', e => { if (pen) penMove(e); }, true);
  window.addEventListener('pointerup', e => {
    if (pen && e.pointerId === pen.id) return penEnd(e, false);
    down = false;
    if (swallowClick) { e.stopPropagation(); swallowTimer = setTimeout(() => { swallowClick = false; }, 450); }
    const t = tap; tap = null;
    if (t && !t.sel && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 7 && performance.now() - t.t < 600 && !currentSelectionRange()) {
      swallowClick = true; swallowTimer = setTimeout(() => { swallowClick = false; }, 450);
      zoneTap(e.clientX, t.id);
      return;
    }
    setTimeout(maybeSelectionMenu, 20);
  }, true);
  window.addEventListener('pointercancel', e => { if (pen && e.pointerId === pen.id) return penEnd(e, true); down = false; tap = null; }, true);
  window.addEventListener('click', e => { if (swallowClick && !(e.target.closest && e.target.closest('.hl-ui, .hl-sheet'))) { e.stopPropagation(); e.preventDefault(); swallowClick = false; } }, true);

  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    if (pen) return;
    const r = currentSelectionRange();
    if (!r) { if (menuState && menuState.mode === 'selection') closeMenu(); return; }
    if (down) return;                       // mouse drag: wait for pointerup
    selTimer = setTimeout(maybeSelectionMenu, 280); // touch handles / keyboard: wait until it settles
  });

  /* iPad: stop the Pencil from scrolling or starting a native selection on the text. */
  function bindStylusGuard() {
    const root = content(); if (!root || root._hlGuard) return;
    root._hlGuard = true;
    root.addEventListener('touchstart', e => {
      const ts = e.touches || [];
      for (let i = 0; i < ts.length; i++) if (ts[i].touchType === 'stylus' && onText(e.target)) { e.preventDefault(); return; }
    }, { passive: false });
    root.addEventListener('touchmove', e => {
      const ts = e.touches || [];
      for (let i = 0; i < ts.length; i++) if (ts[i].touchType === 'stylus' && pen) { e.preventDefault(); return; }
    }, { passive: false });
  }

  /* ---------- keyboard ---------- */
  window.addEventListener('keydown', e => {
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === 'Escape') {
      if (edId) { e.preventDefault(); e.stopPropagation(); return closeEditor(); }
      if (menuState) { e.preventDefault(); e.stopPropagation(); const s = getSelection(); if (s && menuState.mode === 'selection') s.removeAllRanges(); return closeMenu(); }
      if (sheetOpen()) { e.preventDefault(); e.stopPropagation(); return closeList(); }
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (menuState) {
      const k = e.key.toLowerCase();
      const n = parseInt(k, 10);
      let done = true;
      if (n >= 1 && n <= 5) menuAction(null, COLORS[n - 1]);
      else if (k === 'u') menuAction('underline');
      else if (k === 'n') menuAction('note');
      else if (k === 'c') menuAction('copy');
      else if ((k === 'backspace' || k === 'delete') && menuState.mode === 'highlight') menuAction('remove');
      else if (/^(arrowleft|arrowright|pageup|pagedown| )$/.test(k)) { closeMenu(); done = false; }
      else done = false;
      if (done) { e.preventDefault(); e.stopPropagation(); }
      return;
    }
    if (sheetOpen() && /^(ArrowLeft|ArrowRight|PageUp|PageDown| |Home|End)$/.test(e.key)) { e.stopPropagation(); return; }
    // H highlights the current selection with the last colour
    if ((e.key === 'h' || e.key === 'H') && currentSelectionRange()) { e.preventDefault(); e.stopPropagation(); selectionToHighlight(pref.color, 'highlight'); }
  }, true);

  /* ---------- list panel: all highlights + notes, export / import ---------- */
  const scrim = el('div', 'hl-scrim');
  const sheet = el('section', 'hl-sheet');
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Highlights and notes'); sheet.setAttribute('aria-hidden', 'true');
  sheet.hidden = true;
  sheet.innerHTML = `<header class="hl-sheet-head">
      <div class="hl-sheet-titles"><div class="hl-sheet-title">Highlights &amp; Notes</div><div class="hl-sheet-sub"></div></div>
      <button type="button" class="hl-btn hl-close" aria-label="Close">${icon('x')}</button>
    </header>
    <div class="hl-seg" role="tablist">
      <button type="button" class="hl-tab active" data-filter="all" role="tab" aria-selected="true">All</button>
      <button type="button" class="hl-tab" data-filter="notes" role="tab" aria-selected="false">Notes</button>
    </div>
    <div class="hl-sheet-body"><ol class="hl-list"></ol></div>
    <footer class="hl-sheet-foot">
      <button type="button" class="hl-foot-btn" data-act="export">${icon('download')}<span>Export JSON</span></button>
      <button type="button" class="hl-foot-btn" data-act="import">${icon('upload')}<span>Import JSON</span></button>
      <input type="file" accept="application/json,.json" hidden>
    </footer>`;
  const listEl = $('.hl-list', sheet), fileIn = $('input[type=file]', sheet);
  let filter = 'all';
  const sheetOpen = () => sheet.classList.contains('open');

  function allHighlights(sc = TR.state.script) {
    const out = [];
    const ids = (TR.state.toc || []).map(c => c.id);
    for (const ch of ids) for (const h of load(ch, sc)) out.push({ ...h, chapter: ch });
    return out;
  }
  function fmtDate(iso) {
    const d = new Date(iso); if (isNaN(d)) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function renderList() {
    const items = allHighlights();
    const shown = filter === 'notes' ? items.filter(h => h.note) : items;
    $('.hl-sheet-sub', sheet).textContent = `${items.length} highlight${items.length === 1 ? '' : 's'} · ${items.filter(h => h.note).length} note${items.filter(h => h.note).length === 1 ? '' : 's'}`;
    if (!shown.length) {
      listEl.innerHTML = `<li class="hl-empty">${icon('highlighter')}<p>${filter === 'notes' ? 'No notes yet.' : 'No highlights yet.'}</p><p class="hl-muted">Select text, or draw across a line with Apple Pencil. Tap a highlight to add a note.</p></li>`;
      return;
    }
    let html = '', lastCh = null;
    for (const h of shown) {
      if (h.chapter !== lastCh) { html += `<li class="hl-group">${esc(TR.titleOf(h.chapter))}</li>`; lastCh = h.chapter; }
      const q = h.text.length > 280 ? h.text.slice(0, 280) + '…' : h.text;
      html += `<li><button type="button" class="hl-item" data-chapter="${esc(h.chapter)}" data-id="${esc(h.id)}">
        <span class="hl-item-bar hl-bar-${esc(h.color)}${h.style === 'underline' ? ' is-ul' : ''}" aria-hidden="true"></span>
        <span class="hl-item-main"><span class="hl-item-quote">${esc(q)}</span>
        ${h.note ? `<span class="hl-item-note">${icon('noteFill')}<span>${esc(h.note)}</span></span>` : ''}
        <span class="hl-item-meta">${esc(NAMES[h.color] || '')}${h.style === 'underline' ? ' underline' : ''} · ${esc(fmtDate(h.created))}</span></span>
      </button></li>`;
    }
    listEl.innerHTML = html;
  }
  function openList() {
    closeMenu(); closeEditor();
    renderList();
    if (!sheet.isConnected) { panels().appendChild(scrim); panels().appendChild(sheet); }
    sheet.hidden = false; scrim.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('open'); scrim.classList.add('show');
    sheet.setAttribute('aria-hidden', 'false');
    const b = document.getElementById('hl-open-btn'); if (b) { b.classList.add('active'); b.setAttribute('aria-expanded', 'true'); }
    setTimeout(() => { const c = $('.hl-close', sheet); try { c.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function closeList() {
    if (!sheetOpen()) return;
    sheet.classList.remove('open'); scrim.classList.remove('show');
    sheet.setAttribute('aria-hidden', 'true');
    const b = document.getElementById('hl-open-btn'); if (b) { b.classList.remove('active'); b.setAttribute('aria-expanded', 'false'); }
    setTimeout(() => { if (!sheetOpen()) { sheet.hidden = true; scrim.hidden = true; } }, 340);
  }
  scrim.addEventListener('click', closeList);
  sheet.addEventListener('keydown', e => { if (e.key !== 'Escape') e.stopPropagation(); });
  sheet.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('.hl-close')) return closeList();
    const tab = t.closest('.hl-tab');
    if (tab) { filter = tab.dataset.filter; sheet.querySelectorAll('.hl-tab').forEach(x => { const on = x === tab; x.classList.toggle('active', on); x.setAttribute('aria-selected', String(on)); }); return renderList(); }
    const item = t.closest('.hl-item');
    if (item) return jumpTo(item.dataset.chapter, item.dataset.id);
    const f = t.closest('.hl-foot-btn');
    if (f && f.dataset.act === 'export') return exportJSON();
    if (f && f.dataset.act === 'import') { fileIn.value = ''; return fileIn.click(); }
  });
  fileIn.addEventListener('change', () => { const f = fileIn.files && fileIn.files[0]; if (f) f.text().then(importJSON).catch(() => toast('Could not read that file')); });

  /* ---------- jump to a highlight ---------- */
  let pendingReveal = null;
  function jumpTo(chapter, id) {
    closeList();
    const h = load(chapter).find(x => x.id === id);
    pendingReveal = { chapter, id, off: h ? h.start : 0 };
    if (chapter === TR.state.chapter) raf2(reveal);
    else TR.emit('nav:goto', { chapter, page: 0 });
  }
  function reveal() {
    const p = pendingReveal; if (!p || p.chapter !== TR.state.chapter) return;
    pendingReveal = null;
    const pg = TR.paginator;
    if (pg && pg.goToOffset) pg.goToOffset(p.off);
    else if (pg && pg.goTo) {
      const m = marksOf(p.id)[0]; const vp = visibleRect();
      if (m) { const r = m.getClientRects()[0]; if (r) pg.goTo(TR.state.page + Math.floor((r.left - vp.left) / vp.width)); }
    }
    setTimeout(() => {
      trackNotes(60);
      if (reduced()) return;
      marksOf(p.id).forEach(m => m.animate && m.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], { duration: 1100, easing: 'ease-in-out' }));
    }, reduced() ? 0 : 360);
  }

  /* ---------- export / import (the reader's backup) ---------- */
  function collectAll() {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const m = /^tr:hl:(dev|iast):(.+)$/.exec(k || '');
        if (m) { const v = TR.store.get(k.slice(3), []); if (Array.isArray(v) && v.length) data[m[1] + ':' + m[2]] = v; }
      }
    } catch (e) {}
    return data;
  }
  function exportJSON() {
    const highlights = collectAll();
    const count = Object.values(highlights).reduce((n, a) => n + a.length, 0);
    const payload = { app: 'tantraraja-reader', kind: 'highlights', version: 1, exported: new Date().toISOString(), count, highlights };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = el('a'); a.href = URL.createObjectURL(blob);
    a.download = `tantraraja-highlights-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast(`Exported ${count} highlight${count === 1 ? '' : 's'}`);
  }
  function importJSON(txt) {
    let data;
    try { data = JSON.parse(txt); } catch (e) { return toast('That file is not valid JSON'); }
    const src = data && data.highlights && typeof data.highlights === 'object' ? data.highlights : data;
    let added = 0;
    for (const k of Object.keys(src || {})) {
      const m = /^(?:hl:)?(dev|iast):(.+)$/.exec(k); if (!m || !Array.isArray(src[k])) continue;
      const [, sc, ch] = m;
      const cur = load(ch, sc);
      const ids = new Set(cur.map(h => h.id));
      for (const h of src[k]) {
        if (!h || typeof h.start !== 'number' || typeof h.end !== 'number' || h.end <= h.start) continue;
        const item = { id: String(h.id || uid()), start: h.start, end: h.end, color: COLORS.includes(h.color) ? h.color : 'yellow', style: h.style === 'underline' ? 'underline' : 'highlight', note: String(h.note || ''), text: String(h.text || ''), created: h.created || new Date().toISOString() };
        if (ids.has(item.id)) { const i = cur.findIndex(x => x.id === item.id); cur[i] = item; } else { cur.push(item); ids.add(item.id); added++; }
      }
      cur.sort((a, b) => a.start - b.start);
      save(cur, ch, sc);
    }
    repaint(); renderList();
    toast(added ? `Imported ${added} new highlight${added === 1 ? '' : 's'}` : 'Nothing new to import');
  }

  /* ---------- top bar button ---------- */
  function ensureButton() {
    const right = document.getElementById('topbar-right');
    if (!right || document.getElementById('hl-open-btn')) return;
    const b = el('button', 'tr-btn tr-icon-btn hl-topbtn', icon('highlighter', 'tr-ico off') + icon('highlighterFill', 'tr-ico on'));
    b.id = 'hl-open-btn'; b.type = 'button';
    b.setAttribute('aria-label', 'Highlights and notes'); b.title = 'Highlights and notes';
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', e => { e.stopPropagation(); sheetOpen() ? closeList() : openList(); });
    right.insertBefore(b, right.firstChild);
  }
  function watchTopbar() {
    const right = document.getElementById('topbar-right'); if (!right || right._hlObs) return;
    right._hlObs = true;
    new MutationObserver(ensureButton).observe(right, { childList: true });
    ensureButton();
  }

  /* ---------- wiring ---------- */
  TR.on('chapter:loaded', () => {
    closeMenu(); closeEditor();
    bindStylusGuard(); watchTopbar(); syncDark();
    repaint();
  });
  TR.on('page:changed', d => {
    closeMenu();
    const root = content();
    if (root && !root.querySelector('mark.hl') && load().length) repaint(); // someone rebuilt the DOM
    trackNotes();
    if (pendingReveal && d && d.chapter === pendingReveal.chapter) raf2(reveal);
  });
  TR.on('layout:changed', () => { closeMenu(); raf2(() => { syncDark(); repaint(); trackNotes(); }); });
  TR.on('script:changed', () => { closeMenu(); closeEditor(); });
  window.addEventListener('resize', () => { closeMenu(); requestAnimationFrame(placeNotes); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchTopbar); else setTimeout(watchTopbar, 0);

  TR.highlights = { openList, closeList, repaint, list: allHighlights, exportJSON, importJSON };
})();
