/* boot.js: start the app and wire chapter navigation. */
(async function () {
  const TR = window.TR;
  TR.state.toc = await (await fetch('data/toc.json')).json();
  document.body.dataset.script = TR.state.script;
  TR.on('nav:goto', d => TR.openChapter(d.chapter, { page: d.page || 0, atEnd: d.atEnd }));
  TR.on('script:changed', d => { TR.state.script = d.script; TR.store.set('script', d.script); document.body.dataset.script = d.script; TR.openChapter(TR.state.chapter, { page: 0 }); });
  // paginator emits 'chapter:end' / 'chapter:start' when the reader turns past the edge
  TR.on('chapter:end', () => { const i = TR.chapterIndex(TR.state.chapter); if (i < TR.state.toc.length - 1) TR.openChapter(TR.state.toc[i + 1].id, { page: 0 }); });
  TR.on('chapter:start', () => { const i = TR.chapterIndex(TR.state.chapter); if (i > 0) TR.openChapter(TR.state.toc[i - 1].id, { atEnd: true }); });
  await TR.openChapter(TR.state.chapter, { page: TR.store.get('page:' + TR.state.chapter, 0) });
})();
