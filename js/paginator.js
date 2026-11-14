/* paginator.js: turns #page-content into book pages with CSS columns.
   One "page" = one screen (one page, or a two-page spread when the window is wider than 1100px).
   Exposes TR.paginator = {next, prev, goTo, relayout, offsetAtPage, pageOfOffset, goToOffset}. */
(function () {
  const TR = window.TR;
  const viewport = document.getElementById('viewport');
  const content = document.getElementById('page-content');
  const reader = document.getElementById('reader');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE_MS = 320;
  const SPREAD_MIN = 1100;

  let W = 0;            // width of one screen (px)
  let page = 0;
  let pageCount = 1;
  let ready = false;    // a chapter has been laid out
  let leaving = false;  // we asked boot for the next/prev chapter and are waiting
  let leaveTimer = 0;
  let loadToken = 0;
  let animTimer = 0;

  /* ---------- layout ---------- */
  function margin() {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tr-margin'));
    return isFinite(v) ? v : 28;
  }

  function applyColumns() {
    const spread = window.innerWidth > SPREAD_MIN;
    document.body.classList.toggle('tr-spread', spread);
    let w = viewport.clientWidth;
    if (spread) w = Math.floor(w / 2) * 2;
    W = Math.max(1, w);
    const m = margin();
    const pageW = spread ? W / 2 : W;
    const colW = Math.max(40, pageW - 2 * m);
    const s = content.style;
    s.width = W + 'px';
    s.paddingLeft = m + 'px';
    s.paddingRight = m + 'px';
    s.columnWidth = colW + 'px';
    s.columnGap = 2 * m + 'px';
    s.columnCount = spread ? '2' : '1';
  }

  function measurePages() {
    const box = content.getBoundingClientRect();
    let right = 0;
    const last = lastVisibleNode();
    if (last) {
      const r = document.createRange();
      r.selectNodeContents(last);
      const rects = r.getClientRects();
      for (let i = 0; i < rects.length; i++) right = Math.max(right, rects[i].right - box.left);
    }
    const byScroll = content.scrollWidth;
    if (!right) right = byScroll;
    return Math.max(1, Math.floor((Math.max(right, 1) - 1) / W) + 1);
  }

  function lastVisibleNode() {
    let el = content.lastElementChild;
    while (el && !el.textContent.trim()) el = el.previousElementSibling;
    return el || content;
  }

  function setTransform(px, animate) {
    clearTimeout(animTimer);
    const anim = animate && !reduceMotion.matches;
    content.classList.toggle('tr-anim', anim);
    content.style.transform = `translate3d(${px}px,0,0)`;
    if (anim) animTimer = setTimeout(() => content.classList.remove('tr-anim'), EASE_MS + 40);
  }

  let anchor = 0;        // text offset at the top of the current page, kept across relayouts
  function show(n, animate, keepAnchor) {
    page = Math.max(0, Math.min(pageCount - 1, n | 0));
    setTransform(-page * W, animate);
    if (!keepAnchor) { try { anchor = page > 0 ? offsetAtPage(page) : 0; } catch (e) { anchor = 0; } }
    announce();
  }

  function announce() {
    const s = TR.state;
    s.page = page; s.pageCount = pageCount;
    TR.store.set('page:' + s.chapter, page);
    TR.emit('page:changed', { chapter: s.chapter, page, pageCount });
    updateFolio();
  }

  /* ---------- text offsets (match highlights: offsets over #page-content textContent) ---------- */
  function textNodes() {
    const list = [];
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    let n, off = 0;
    while ((n = walker.nextNode())) { list.push({ node: n, start: off }); off += n.data.length; }
    return list;
  }

  const rng = document.createRange();
  function charRect(node, i) {
    const len = node.data.length;
    for (let k = i; k < Math.min(len, i + 6); k++) {
      rng.setStart(node, k); rng.setEnd(node, k + 1);
      const rects = rng.getClientRects();
      if (rects.length && (rects[0].width || rects[0].height)) return rects[0];
    }
    return null;
  }
  function nodeEndRight(node) {
    rng.selectNodeContents(node);
    const rects = rng.getClientRects();
    let right = -Infinity;
    for (let i = 0; i < rects.length; i++) if (rects[i].width || rects[i].height) right = Math.max(right, rects[i].right);
    return right;
  }

  /* First character offset whose glyph sits on page n. */
  function offsetAtPage(n) {
    if (!W) return 0;
    const left0 = content.getBoundingClientRect().left;
    const T = n * W;
    const nodes = textNodes();
    if (!nodes.length || n <= 0) return 0;
    // binary search the first node whose end reaches page n
    let lo = 0, hi = nodes.length - 1, hit = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const r = nodeEndRight(nodes[mid].node);
      if (r === -Infinity) { // collapsed whitespace node: step forward linearly
        let k = mid + 1, found = false;
        while (k <= hi) { const rr = nodeEndRight(nodes[k].node); if (rr !== -Infinity) { if (rr - left0 > T + 1) { hit = k; hi = mid - 1; } else lo = k + 1; found = true; break; } k++; }
        if (!found) hi = mid - 1;
        continue;
      }
      if (r - left0 > T + 1) { hit = mid; hi = mid - 1; } else lo = mid + 1;
    }
    if (hit < 0) return nodes[nodes.length - 1].start + nodes[nodes.length - 1].node.data.length;
    const { node, start } = nodes[hit];
    let a = 0, b = node.data.length - 1, best = b;
    while (a <= b) {
      const mid = (a + b) >> 1;
      const rect = charRect(node, mid);
      if (rect && rect.left - left0 >= T - 0.5) { best = mid; b = mid - 1; } else a = mid + 1;
    }
    return start + best;
  }

  /* Page that holds character offset `off`. */
  function pageOfOffset(off) {
    if (!W) return 0;
    const left0 = content.getBoundingClientRect().left;
    const nodes = textNodes();
    if (!nodes.length) return 0;
    let lo = 0, hi = nodes.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (nodes[mid].start <= off) lo = mid; else hi = mid - 1; }
    for (let k = lo; k < nodes.length; k++) {
      const { node, start } = nodes[k];
      const i = Math.max(0, Math.min(node.data.length - 1, off - start));
      if (!node.data.length) continue;
      const rect = charRect(node, k === lo ? i : 0);
      if (rect) return Math.max(0, Math.min(pageCount - 1, Math.floor((rect.left - left0 + 1) / W)));
    }
    return pageCount - 1;
  }

  /* ---------- public actions ---------- */
  function goTo(n, opts) {
    if (!ready) return;
    const animate = !(opts && opts.animate === false);
    show(n, animate);
  }
  function goToOffset(off, opts) {
    if (!ready) return;
    show(pageOfOffset(off), !(opts && opts.animate === false), true);
    anchor = off;
  }

  function next() {
    if (!ready || leaving) return;
    if (page < pageCount - 1) return show(page + 1, true);
    leave('chapter:end', -1);
  }
  function prev() {
    if (!ready || leaving) return;
    if (page > 0) return show(page - 1, true);
    leave('chapter:start', 1);
  }
  function leave(evt, dir) {
    const i = TR.chapterIndex(TR.state.chapter);
    const toc = TR.state.toc || [];
    const atEdge = evt === 'chapter:end' ? i >= toc.length - 1 : i <= 0;
    if (atEdge && toc.length) { bump(dir); return; }
    leaving = true;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => { leaving = false; }, 4000);
    TR.emit(evt, { chapter: TR.state.chapter });
  }
  /* Small rubber-band nudge when there is nothing further to turn to. */
  function bump(dir) {
    if (reduceMotion.matches) return;
    const base = -page * W;
    setTransform(base + dir * 18, true);
    setTimeout(() => setTransform(base, true), 140);
  }

  /* Re-paginate, keeping the first visible character on screen. */
  function relayout() {
    if (!ready) { applyColumns(); return; }
    // settings.js changes the CSS vars before emitting, so use the anchor saved at the last page turn
    const keep = anchor;
    applyColumns();
    void content.offsetHeight;
    pageCount = measurePages();
    const n = keep > 0 ? pageOfOffset(keep) : 0;
    show(n, false, true);
  }

  /* ---------- chapter load ---------- */
  TR.on('chapter:loaded', async d => {
    const token = ++loadToken;
    leaving = false; clearTimeout(leaveTimer);
    applyColumns();
    setTransform(0, false);
    void content.offsetHeight;
    // wait (briefly) for the book fonts so the page count is right the first time
    try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]); } catch (e) {}
    if (token !== loadToken) return;
    applyColumns();
    void content.offsetHeight;
    pageCount = measurePages();
    ready = true;
    const target = d && d.atEnd ? pageCount - 1 : (d && d.page) || 0;
    show(target, false);
    if (!reduceMotion.matches && content.animate) {
      content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    }
  });

  TR.on('layout:changed', () => requestAnimationFrame(relayout));

  let rafId = 0, lastW = 0, lastH = 0;
  function scheduleRelayout() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const w = viewport.clientWidth, h = viewport.clientHeight;
      const spreadNow = window.innerWidth > SPREAD_MIN;
      if (w === lastW && h === lastH && spreadNow === document.body.classList.contains('tr-spread')) return;
      lastW = w; lastH = h;
      relayout();
    });
  }
  if (window.ResizeObserver) new ResizeObserver(scheduleRelayout).observe(viewport);
  window.addEventListener('resize', scheduleRelayout);
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', () => { if (ready) requestAnimationFrame(relayout); });
  }

  /* ---------- input: tap / click zones and swipe ---------- */
  function selectionActive() {
    const sel = window.getSelection && window.getSelection();
    return !!(sel && !sel.isCollapsed && String(sel).length);
  }
  function interactiveTarget(t) {
    return t && t.closest && t.closest('a, button, input, textarea, select, label, mark, [data-hl], .hl, [role="button"], [contenteditable="true"]');
  }

  let g = null; // current gesture
  viewport.addEventListener('pointerdown', e => {
    if (e.pointerType === 'pen') return;              // the pencil is for highlighting
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!e.isPrimary) { g = null; return; }           // second finger: pinch or similar
    g = {
      id: e.pointerId, type: e.pointerType, x: e.clientX, y: e.clientY, t: performance.now(),
      lastX: e.clientX, lastT: performance.now(), vx: 0,
      hadSelection: selectionActive(), dragging: false, cancelled: false,
    };
  });

  viewport.addEventListener('pointermove', e => {
    if (!g || e.pointerId !== g.id || g.cancelled) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    const now = performance.now();
    if (now > g.lastT) { g.vx = 0.8 * ((e.clientX - g.lastX) / (now - g.lastT)) + 0.2 * g.vx; }
    g.lastX = e.clientX; g.lastT = now;
    if (!g.dragging) {
      if (g.type === 'mouse') return;                 // mouse drag = text selection
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) <= Math.abs(dy) * 1.2 || g.hadSelection || selectionActive()) { g.cancelled = true; return; }
      if (!ready || leaving) { g.cancelled = true; return; }
      g.dragging = true;
      content.classList.remove('tr-anim');
      try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
    }
    if (selectionActive()) { g.cancelled = true; snapBack(); return; }
    let off = dx;
    const atStart = page === 0 && dx > 0, atEnd = page === pageCount - 1 && dx < 0;
    if (atStart || atEnd) off = rubber(dx);
    content.style.transform = `translate3d(${-page * W + off}px,0,0)`;
    e.preventDefault();
  });

  function rubber(dx) {
    const lim = W * 0.5;
    const s = Math.sign(dx), a = Math.abs(dx);
    return s * lim * (1 - 1 / (a * 0.55 / lim + 1));
  }
  function snapBack() { setTransform(-page * W, true); }

  function endGesture(e, cancelled) {
    if (!g || e.pointerId !== g.id) return;
    const gs = g; g = null;
    const dx = e.clientX - gs.x, dy = e.clientY - gs.y;
    const dt = performance.now() - gs.t;
    if (gs.dragging) {
      if (cancelled) return snapBack();
      const fast = Math.abs(gs.vx) > 0.35 && Math.sign(gs.vx) === Math.sign(dx);
      const far = Math.abs(dx) > W * 0.18;
      if ((fast || far) && Math.abs(dx) > 20) {
        if (dx < 0) { if (page < pageCount - 1) show(page + 1, true); else { snapBack(); next(); } }
        else { if (page > 0) show(page - 1, true); else { snapBack(); prev(); } }
      } else snapBack();
      return;
    }
    if (cancelled || gs.cancelled) return;
    // a tap or a click
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6 || dt > 600) return;
    if (gs.hadSelection || selectionActive()) return;
    if (e.defaultPrevented || interactiveTarget(e.target)) return;
    const r = viewport.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    if (fx > 2 / 3) next();
    else if (fx < 1 / 3) prev();
    else toggleChrome();
  }
  viewport.addEventListener('pointerup', e => endGesture(e, false));
  viewport.addEventListener('pointercancel', e => endGesture(e, true));

  function toggleChrome() {
    const before = document.body.classList.contains('chrome-hidden');
    TR.emit('ui:toggle-chrome', {});
    if (document.body.classList.contains('chrome-hidden') === before) document.body.classList.toggle('chrome-hidden');
  }

  /* ---------- trackpad / wheel ---------- */
  let wheelAcc = 0, wheelLock = false, wheelIdle = 0, wheelHold = 0;
  viewport.addEventListener('wheel', e => {
    if (e.ctrlKey) return;                            // pinch zoom
    const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    const d = horiz ? e.deltaX : e.deltaY;
    e.preventDefault();
    clearTimeout(wheelIdle);
    wheelIdle = setTimeout(() => { wheelLock = false; wheelAcc = 0; clearTimeout(wheelHold); }, 180);
    if (wheelLock) return;
    wheelAcc += d * (e.deltaMode === 1 ? 16 : 1);
    if (Math.abs(wheelAcc) > 36) {
      wheelAcc > 0 ? next() : prev();
      wheelAcc = 0; wheelLock = true;
      clearTimeout(wheelHold);
      wheelHold = setTimeout(() => { wheelLock = false; }, 1100); // long momentum tails still release
    }
  }, { passive: false });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return;
    if (document.querySelector('#panels [open], #panels .open, #panels [aria-hidden="false"]')) return;
    let handled = true;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': next(); break;
      case 'ArrowLeft': case 'PageUp': prev(); break;
      case ' ': case 'Spacebar': e.shiftKey ? prev() : next(); break;
      case 'Home': goTo(0); break;
      case 'End': goTo(pageCount - 1); break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });

  /* ---------- folio: "12 / 48" if nav.js has not drawn progress ---------- */
  const folio = document.createElement('div');
  folio.className = 'tr-folio';
  folio.setAttribute('aria-live', 'polite');
  reader.appendChild(folio);
  function navHasProgress() {
    const p = document.getElementById('progress');
    return !!(p && (p.childElementCount || p.textContent.trim()));
  }
  function updateFolio() {
    if (navHasProgress()) { folio.hidden = true; return; }
    folio.hidden = false;
    folio.textContent = `${page + 1} / ${pageCount}`;
  }

  applyColumns();
  TR.paginator = {
    next, prev, goTo, relayout, goToOffset, offsetAtPage, pageOfOffset,
    get page() { return page; }, get pageCount() { return pageCount; },
  };
})();
