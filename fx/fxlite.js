// Light motion for the live site (Daniel, 11 Nov 2026; see fxlite.css). Looks only; it changes no data.
// Runs on the main page and inside the Serve and Speakers pages.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const R = document.documentElement; R.classList.add("fxl");

  // (box hover is CSS only now: gold outline + tiny raise, Daniel 11 Nov; the lean toward the mouse is gone)

  // carousels: each card learns how far it is from the middle (--d); the CSS bends the row by that
  const TRACKS = ".track,.rqtrack,.track2";
  function flow(t) {
    if (!t.clientWidth) return;
    const mid = t.scrollLeft + t.clientWidth / 2, base = t.firstElementChild ? t.firstElementChild.offsetLeft - (parseFloat(getComputedStyle(t).paddingLeft) || 0) : 0;
    for (const c of t.children) { let d = (c.offsetLeft - base + c.offsetWidth / 2 - mid) / (c.offsetWidth + 14); d = Math.max(-2.4, Math.min(2.4, d));
      c.style.setProperty("--d", d.toFixed(2)); c.style.setProperty("--a", Math.abs(d).toFixed(2)); }
  }
  const pend = new Set(); let fr = 0;
  const later = t => { pend.add(t); if (!fr) fr = requestAnimationFrame(() => { fr = 0; pend.forEach(flow); pend.clear(); }); };
  document.addEventListener("scroll", e => { const t = e.target; if (t.matches && t.matches(TRACKS)) later(t); }, true);

  // carousel arrows (Find resources, Map room): glide that starts moving the moment you click and settles softly.
  // The browser's own smooth scroll starts slowly, which read as lag (Daniel, 11 Nov).
  function glide(tr, x) {
    cancelAnimationFrame(tr._fxr); const from = tr.scrollLeft, dx = x - from, t0 = performance.now(), dur = 650;
    tr.style.scrollSnapType = "none";
    const step = now => { const p = Math.min(1, (now - t0) / dur); tr.scrollLeft = from + dx * (1 - Math.pow(1 - p, 3));
      if (p < 1) tr._fxr = requestAnimationFrame(step); else { tr._fxi = null; tr.style.scrollSnapType = ""; } };
    tr._fxr = requestAnimationFrame(step);
  }
  document.addEventListener("click", e => {
    const b = e.target.closest ? e.target.closest(".carbtn[data-car]") : null, tr = b && b.parentElement.querySelector(".track");
    if (!tr) return;
    const tiles = [...tr.children], h = tr._fxi ?? tiles.findIndex(t => t.classList.contains("hot")), i = Math.max(0, Math.min(tiles.length - 1, (h < 0 ? 0 : h) + +b.dataset.d)), t = tiles[i];
    if (!t) return;
    e.stopPropagation(); tr._fxi = i;   // replaces the page's own arrow handler (same target card)
    if (i !== h) { tiles[h]?.classList.remove("hot"); t.classList.add("hot"); }   // the next card starts rising at the click, not halfway (the page's own picker catches up)
    glide(tr, t.offsetLeft - (tr.clientWidth - t.offsetWidth) / 2);
  }, true);

  // parts below the screen wait, then rise when you reach them (never hides what is already on screen)
  const REV = ".lineup,.ghead,.rpager,main section.wrap:not(#recipes),main .section,.rqwrap";   // not .grp (leans on hover); not Serve's kit/church plan section (Daniel)
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("fx-in"); io.unobserve(en.target); } }), {rootMargin: "0px 0px -6% 0px"}) : null;
  function scan() {
    document.querySelectorAll(TRACKS).forEach(later);
    if (!io) return;
    document.querySelectorAll(REV).forEach(el => { if (el.__fxl) return; el.__fxl = 1;
      if (el.getBoundingClientRect().top > innerHeight * .92) { el.classList.add("fx-rev"); io.observe(el); } });
  }
  // a refilled carousel (Map room) gets its bend at once, so it never jumps into shape
  let st = 0; new MutationObserver(() => { document.querySelectorAll(TRACKS).forEach(later); clearTimeout(st); st = setTimeout(scan, 120); }).observe(document.body, {childList: true, subtree: true});
  addEventListener("resize", () => document.querySelectorAll(TRACKS).forEach(later)); scan(); setTimeout(scan, 1500);
})();
