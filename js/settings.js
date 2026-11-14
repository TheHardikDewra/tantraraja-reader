/* settings.js: Apple Books style "Themes & Settings" sheet.
   Owns the theme colours, text size, line spacing, margins, Latin font, script switch and the commentary toggle.
   Talks to the rest of the app only through window.TR (store, emit, on). */
(function () {
  const TR = window.TR;
  const root = document.documentElement;

  /* Phosphor icons (regular + fill for the active state), inlined. */
  const ICON = {
    textAa: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M87.24,52.59a8,8,0,0,0-14.48,0l-64,136a8,8,0,1,0,14.48,6.81L39.9,160h80.2l16.66,35.4a8,8,0,1,0,14.48-6.81ZM47.43,144,80,74.79,112.57,144ZM200,96c-12.76,0-22.73,3.47-29.63,10.32a8,8,0,0,0,11.26,11.36c3.8-3.77,10-5.68,18.37-5.68,13.23,0,24,9,24,20v3.22A42.76,42.76,0,0,0,200,128c-22.06,0-40,16.15-40,36s17.94,36,40,36a42.73,42.73,0,0,0,24-7.25,8,8,0,0,0,16-.75V132C240,112.15,222.06,96,200,96Zm0,88c-13.23,0-24-9-24-20s10.77-20,24-20,24,9,24,20S213.23,184,200,184Z"/></svg>',
    textAaFill: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M200,156c0,6.5-7.33,12-16,12s-16-5.5-16-12,7.33-12,16-12S200,149.5,200,156ZM232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM143.37,172.88l-44-104a8,8,0,0,0-14.74,0l-44,104a8,8,0,0,0,14.74,6.24L66.84,152h50.32l11.47,27.12a8,8,0,0,0,14.74-6.24ZM216,124c0-15.44-14.36-28-32-28a34.86,34.86,0,0,0-20.78,6.68,8,8,0,0,0,9.56,12.83A18.84,18.84,0,0,1,184,112c8.56,0,15.8,5.36,16,11.76v8A35.24,35.24,0,0,0,184,128c-17.64,0-32,12.56-32,28s14.36,28,32,28a35.13,35.13,0,0,0,16.93-4.26A8,8,0,0,0,216,176ZM73.61,136h36.78L92,92.53Z"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>',
  };

  /* Six themes, each with a light and a dark variant. ONE accent per theme. Solid colours only. */
  const THEMES = {
    original: { name: 'Original',
      light: { bg: '#ffffff', fg: '#1d1d1f', muted: '#6e6e73', accent: '#0a64d8', rule: '#e3e3e8', chrome: '#ffffff', control: '#f2f2f5' },
      dark:  { bg: '#000000', fg: '#e5e5e7', muted: '#8e8e93', accent: '#4c9bff', rule: '#2c2c2e', chrome: '#000000', control: '#1c1c1e' } },
    quiet: { name: 'Quiet',
      light: { bg: '#4a4a4f', fg: '#d6d6da', muted: '#a3a3a8', accent: '#9fb6d6', rule: '#5c5c62', chrome: '#4a4a4f', control: '#55555b' },
      dark:  { bg: '#2b2b2e', fg: '#b4b4b9', muted: '#86868c', accent: '#8ea4c4', rule: '#3d3d41', chrome: '#2b2b2e', control: '#353539' } },
    paper: { name: 'Paper',
      light: { bg: '#f4f1ea', fg: '#2b2925', muted: '#7a766d', accent: '#5b6f8a', rule: '#e1ddd2', chrome: '#f4f1ea', control: '#ebe7dd' },
      dark:  { bg: '#1e1d1b', fg: '#d9d5cc', muted: '#8f8b82', accent: '#8ea3c0', rule: '#33312d', chrome: '#1e1d1b', control: '#292825' } },
    bold: { name: 'Bold', weight: 600,
      light: { bg: '#ffffff', fg: '#000000', muted: '#5c5c61', accent: '#0a58c2', rule: '#e0e0e5', chrome: '#ffffff', control: '#f2f2f5' },
      dark:  { bg: '#000000', fg: '#ffffff', muted: '#9a9aa0', accent: '#5aa4ff', rule: '#2c2c2e', chrome: '#000000', control: '#1c1c1e' } },
    calm: { name: 'Calm',
      light: { bg: '#f1e4c9', fg: '#4a3621', muted: '#86704f', accent: '#a5552a', rule: '#dfcfae', chrome: '#f1e4c9', control: '#e8d9ba' },
      dark:  { bg: '#2a1f15', fg: '#dcc9a8', muted: '#a08a68', accent: '#d48a55', rule: '#3d2f21', chrome: '#2a1f15', control: '#34281c' } },
    focus: { name: 'Focus', lineBoost: 0.15,
      light: { bg: '#fbf5e6', fg: '#24211b', muted: '#7c7566', accent: '#2f6f5e', rule: '#ebe3cf', chrome: '#fbf5e6', control: '#f2ead6' },
      dark:  { bg: '#1b1914', fg: '#e8e0cc', muted: '#968e7c', accent: '#6fb39f', rule: '#2e2b23', chrome: '#1b1914', control: '#25221b' } },
  };
  const ORDER = ['original', 'quiet', 'paper', 'bold', 'calm', 'focus'];
  const LINE = [1.45, 1.65, 1.9];
  const LINE_NAMES = ['Tight', 'Normal', 'Loose'];
  const MARGIN = [16, 28, 52];
  const MARGIN_NAMES = ['Narrow', 'Normal', 'Wide'];
  const LATIN = {
    noto:   { name: 'Noto Serif', css: '"Noto Serif", serif' },
    system: { name: 'System serif', css: 'ui-serif, "New York", "Iowan Old Style", Georgia, "Times New Roman", serif' },
    inter:  { name: 'Inter', css: '"Inter", -apple-system, system-ui, sans-serif' },
  };
  const SIZE_MIN = 14, SIZE_MAX = 34, SIZE_STEP = 2;
  const DEFAULTS = { theme: 'original', mode: 'auto', size: 20, line: 1, margin: 1, latin: 'noto', commentary: true };

  const saved = TR.store.get('settings', {}) || {};
  const s = Object.assign({}, DEFAULTS, saved);
  if (!THEMES[s.theme]) s.theme = DEFAULTS.theme;
  if (!['auto', 'light', 'dark'].includes(s.mode)) s.mode = 'auto';
  if (!LATIN[s.latin]) s.latin = DEFAULTS.latin;
  s.size = clamp(Math.round(+s.size || DEFAULTS.size), SIZE_MIN, SIZE_MAX);
  s.line = clamp(+s.line | 0, 0, 2);
  s.margin = clamp(+s.margin | 0, 0, 2);
  s.commentary = s.commentary !== false;

  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function isDark() { return s.mode === 'dark' || (s.mode === 'auto' && !!(mq && mq.matches)); }
  function soft(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  function palette(id, dark) { return THEMES[id][dark ? 'dark' : 'light']; }

  /* Write every custom property on :root. Runs at load, before the first chapter paints. */
  function apply() {
    const dark = isDark();
    const t = THEMES[s.theme];
    const p = palette(s.theme, dark);
    const v = {
      '--tr-bg': p.bg, '--tr-fg': p.fg, '--tr-muted': p.muted, '--tr-accent': p.accent,
      '--tr-accent-soft': soft(p.accent, dark ? 0.34 : 0.24), '--tr-rule': p.rule,
      '--tr-chrome-bg': p.chrome, '--tr-control-bg': p.control,
      '--tr-weight': String(t.weight || 400),
      '--tr-font-size': s.size + 'px',
      '--tr-line-height': String(+(LINE[s.line] + (t.lineBoost || 0)).toFixed(2)),
      '--tr-margin': MARGIN[s.margin] + 'px',
      '--tr-font-latin': LATIN[s.latin].css,
    };
    for (const k in v) root.style.setProperty(k, v[k]);
    root.dataset.trTheme = s.theme;
    root.dataset.trDark = dark ? '1' : '0';
    root.style.colorScheme = dark ? 'dark' : 'light';
    if (document.body) {
      document.body.dataset.theme = s.theme;
      document.body.dataset.mode = dark ? 'dark' : 'light';
      document.body.classList.toggle('tr-no-commentary', !s.commentary);
    }
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = p.chrome;
    if (sheet) sync();
  }

  let layoutQueued = false;
  function emitLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(() => { layoutQueued = false; TR.emit('layout:changed', {}); });
  }
  function update(patch, layout = true) {
    Object.assign(s, patch);
    TR.store.set('settings', s);
    apply();
    if (layout) emitLayout();
  }

  /* ---------- UI ---------- */
  let sheet = null, scrim = null, btn = null, lastFocus = null, isOpen = false;

  function seg(name, items, label) {
    return `<div class="trs-row"><span class="trs-label" id="trs-l-${name}">${label}</span>
      <div class="trs-seg" role="group" aria-labelledby="trs-l-${name}" data-seg="${name}">
        ${items.map(([val, text, cls]) => `<button type="button" data-val="${val}"${cls ? ` class="${cls}"` : ''}>${text}</button>`).join('')}
      </div></div>`;
  }

  function build() {
    const panels = document.getElementById('panels') || document.body;
    scrim = document.createElement('div');
    scrim.className = 'trs-scrim';
    scrim.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); close(); });

    sheet = document.createElement('section');
    sheet.className = 'trs-sheet';
    sheet.id = 'trs-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'false');
    sheet.setAttribute('aria-labelledby', 'trs-title');
    sheet.tabIndex = -1;
    sheet.innerHTML = `
      <button type="button" class="trs-grab" aria-label="Drag down to close"></button>
      <div class="trs-head"><h2 class="trs-title" id="trs-title">Themes &amp; Settings</h2>
        <button type="button" class="trs-close" aria-label="Close settings">${ICON.x}</button></div>
      <div class="trs-row"><span class="trs-label">Text size <span class="trs-size-val" data-size-val></span></span>
        <div class="trs-size">
          <button type="button" class="sm" data-size="-1" aria-label="Smaller text">A</button>
          <button type="button" class="lg" data-size="1" aria-label="Larger text">A</button>
        </div></div>
      ${seg('mode', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], 'Appearance')}
      <div class="trs-row"><span class="trs-label" id="trs-l-theme">Themes</span>
        <div class="trs-themes" role="group" aria-labelledby="trs-l-theme">
          ${ORDER.map(id => `<button type="button" class="trs-theme" data-theme-id="${id}" aria-label="${THEMES[id].name} theme">
            <span class="glyph"></span><span class="name">${THEMES[id].name}</span></button>`).join('')}
        </div></div>
      <hr class="trs-divider">
      ${seg('script', [['dev', 'देवनागरी', 'dev'], ['iast', 'IAST']], 'Script')}
      ${seg('latin', Object.keys(LATIN).map(k => [k, LATIN[k].name]), 'Latin font')}
      ${seg('line', LINE_NAMES.map((n, i) => [i, n]), 'Line spacing')}
      ${seg('margin', MARGIN_NAMES.map((n, i) => [i, n]), 'Margins')}
      <hr class="trs-divider">
      <label class="trs-toggle" for="trs-commentary"><span>Show commentary<small>Off shows the root verses only</small></span>
        <button type="button" id="trs-commentary" class="trs-switch" role="switch" aria-checked="true"></button></label>`;

    panels.appendChild(scrim);
    panels.appendChild(sheet);

    sheet.querySelector('.trs-close').addEventListener('click', close);
    sheet.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => {
      const next = clamp(s.size + SIZE_STEP * +b.dataset.size, SIZE_MIN, SIZE_MAX);
      if (next !== s.size) update({ size: next });
    }));
    sheet.querySelectorAll('.trs-theme').forEach(b => b.addEventListener('click', () => {
      if (s.theme !== b.dataset.themeId) update({ theme: b.dataset.themeId });
    }));
    sheet.querySelectorAll('.trs-seg').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('button[data-val]');
      if (!b) return;
      const name = g.dataset.seg, val = b.dataset.val;
      if (name === 'script') {
        if (val !== TR.state.script) { TR.emit('script:changed', { script: val }); sync(); }
      } else if (name === 'mode') { if (s.mode !== val) update({ mode: val }); }
      else if (name === 'latin') { if (s.latin !== val) update({ latin: val }, TR.state.script === 'iast'); }
      else if (name === 'line') { if (s.line !== +val) update({ line: +val }); }
      else if (name === 'margin') { if (s.margin !== +val) update({ margin: +val }); }
    }));
    const sw = sheet.querySelector('#trs-commentary');
    sw.addEventListener('click', e => { e.preventDefault(); update({ commentary: !s.commentary }); });

    sheet.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key === 'Tab') trapTab(e);
    });
    /* Keep wheel, key and touch events inside the sheet from turning pages behind it. */
    ['wheel', 'touchstart', 'pointerdown', 'click'].forEach(t => sheet.addEventListener(t, e => e.stopPropagation(), { passive: true }));

    setupDrag(sheet.querySelector('.trs-grab'));
    sync();
  }

  function trapTab(e) {
    const f = [...sheet.querySelectorAll('button:not(:disabled)')].filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* Swipe the bottom sheet down to dismiss it (phones). Works with finger, mouse or Pencil via pointer events. */
  function setupDrag(handle) {
    let startY = 0, dy = 0, dragging = false, t0 = 0;
    handle.addEventListener('click', () => { if (!dragging && dy === 0) close(); });
    handle.addEventListener('pointerdown', e => {
      dragging = true; dy = 0; startY = e.clientY; t0 = performance.now();
      handle.setPointerCapture(e.pointerId); sheet.classList.add('is-dragging');
    });
    handle.addEventListener('pointermove', e => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      sheet.style.setProperty('--trs-drag', dy + 'px');
    });
    const end = () => {
      if (!dragging) return;
      dragging = false; sheet.classList.remove('is-dragging');
      const fast = dy / Math.max(1, performance.now() - t0) > 0.6;
      sheet.style.removeProperty('--trs-drag');
      if (dy > 90 || (fast && dy > 24)) close();
      setTimeout(() => { dy = 0; }, 0);
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function sync() {
    if (!sheet) return;
    const dark = isDark();
    const script = TR.state.script;
    sheet.querySelector('[data-size-val]').textContent = s.size + ' px';
    sheet.querySelector('[data-size="-1"]').disabled = s.size <= SIZE_MIN;
    sheet.querySelector('[data-size="1"]').disabled = s.size >= SIZE_MAX;
    const current = { mode: s.mode, script, latin: s.latin, line: String(s.line), margin: String(s.margin) };
    sheet.querySelectorAll('.trs-seg').forEach(g => {
      g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === current[g.dataset.seg])));
    });
    sheet.querySelectorAll('.trs-theme').forEach(b => {
      const id = b.dataset.themeId, p = palette(id, dark);
      b.style.setProperty('--trs-t-bg', p.bg);
      b.style.setProperty('--trs-t-fg', p.fg);
      b.style.setProperty('--trs-t-rule', p.rule);
      b.style.setProperty('--trs-t-weight', String(THEMES[id].weight || 400));
      b.setAttribute('aria-pressed', String(id === s.theme));
      const g = b.querySelector('.glyph');
      g.textContent = script === 'dev' ? 'अ' : 'Aa';
      g.classList.toggle('dev', script === 'dev');
    });
    sheet.querySelector('#trs-commentary').setAttribute('aria-checked', String(s.commentary));
  }

  function ensureButton() {
    const host = document.getElementById('topbar-right');
    if (!host) return;
    if (btn && host.contains(btn)) return;
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'trs-btn';
      btn.id = 'trs-open';
      btn.title = 'Themes & Settings';
      btn.setAttribute('aria-label', 'Themes and settings');
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-controls', 'trs-sheet');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = ICON.textAa;
      btn.addEventListener('click', e => { e.stopPropagation(); isOpen ? close() : open(); });
    }
    host.appendChild(btn);
  }

  function open() {
    if (!sheet) build();
    sync();
    lastFocus = document.activeElement;
    isOpen = true;
    sheet.classList.add('is-open');
    scrim.classList.add('is-open');
    if (btn) { btn.setAttribute('aria-expanded', 'true'); btn.innerHTML = ICON.textAaFill; }
    const delay = reduceMq && reduceMq.matches ? 0 : 60;
    setTimeout(() => { const f = sheet.querySelector('[aria-pressed="true"]') || sheet; f.focus({ preventScroll: true }); }, delay);
    TR.emit('settings:open', {});
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    sheet.classList.remove('is-open');
    scrim.classList.remove('is-open');
    if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.innerHTML = ICON.textAa; }
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    TR.emit('settings:close', {});
  }

  /* Escape closes from anywhere (captured so page-turn keys behind the sheet do not fire). */
  document.addEventListener('keydown', e => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', ' '].includes(e.key) && !(sheet.contains(e.target))) e.stopPropagation();
  }, true);

  if (mq) {
    const onScheme = () => { if (s.mode === 'auto') { apply(); emitLayout(); } };
    mq.addEventListener ? mq.addEventListener('change', onScheme) : mq.addListener(onScheme);
  }

  TR.on('script:changed', () => setTimeout(sync, 0));
  TR.on('chapter:loaded', ensureButton);
  /* Other modules may rebuild the topbar after us; put the button back if it goes missing. */
  const host = document.getElementById('topbar-right');
  if (host && window.MutationObserver) new MutationObserver(() => { if (btn && !host.contains(btn)) ensureButton(); }).observe(host, { childList: true });

  apply();          // before first paint
  ensureButton();
  document.addEventListener('DOMContentLoaded', ensureButton);

  TR.settings = { open, close, apply, toggle: () => (isOpen ? close() : open()), get: () => Object.assign({}, s) };
})();
