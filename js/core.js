/* core.js: shared state, events and storage. Every module talks only through window.TR. */
(function () {
  const listeners = {};
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem('tr:' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem('tr:' + key, JSON.stringify(value)); } catch (e) {} },
  };
  const TR = {
    store,
    state: {
      script: store.get('script', 'dev'),      // 'dev' | 'iast'
      chapter: store.get('chapter', '01'),     // '00-front-matter' | '01'..'36'
      page: 0,                                 // page index inside the chapter (paginator sets it)
      pageCount: 1,
      toc: [],                                 // [{id, dev, iast}] from data/toc.json
    },
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    emit(evt, detail) { (listeners[evt] || []).forEach(fn => { try { fn(detail); } catch (e) { console.error('[TR]', evt, e); } }); },
    /* Load one chapter's HTML fragment into #page-content, then emit 'chapter:loaded'. */
    async openChapter(id, opts = {}) {
      const s = TR.state;
      const res = await fetch(`data/${s.script}/${id}.html`);
      const html = await res.text();
      s.chapter = id; store.set('chapter', id);
      document.getElementById('page-content').innerHTML = html;
      TR.emit('chapter:loaded', { id, page: opts.page ?? 0, atEnd: !!opts.atEnd });
    },
    chapterIndex(id) { return TR.state.toc.findIndex(c => c.id === id); },
    titleOf(id) { const c = TR.state.toc.find(c => c.id === id); return c ? c[TR.state.script] : id; },
  };
  window.TR = TR;
})();
/*
EVENT CONTRACT (all modules must follow it):
  'chapter:loaded'  {id, page, atEnd}  -> paginator lays out pages, goes to `page` (or last page if atEnd), then emits 'page:changed'
  'page:changed'    {chapter, page, pageCount} -> nav updates progress; highlights re-paints if needed
  'layout:changed'  {}   -> settings changed font size/spacing/margins/theme: paginator re-paginates keeping the reading position
  'script:changed'  {script} -> boot reloads current chapter in the other script (dev|iast)
  'nav:goto'        {chapter, page?} -> boot opens chapter
  'ui:toggle-chrome' {} -> tap in middle of page shows/hides top/bottom bars (body.chrome-hidden)
API exposed by modules:
  TR.paginator.next(), TR.paginator.prev(), TR.paginator.goTo(page), TR.paginator.relayout()
  TR.settings.open(), TR.nav.openToc(), TR.nav.openSearch(), TR.highlights.openList()
Text anchoring for highlights: use the chapter id + script + a character-offset range over #page-content's textContent
(start, end), stored in TR.store under 'hl:<script>:<chapter>'.
CSS custom properties (set by settings.js on :root): --tr-bg, --tr-fg, --tr-muted, --tr-accent, --tr-rule,
  --tr-font-size (px), --tr-line-height, --tr-margin (px), --tr-font-dev, --tr-font-latin
*/
