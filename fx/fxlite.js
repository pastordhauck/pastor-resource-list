// Light motion for the live site (Daniel, 11 Nov 2026; see fxlite.css). Looks only; it changes no data.
// Runs on the main page and inside the Serve and Speakers pages.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const R = document.documentElement; R.classList.add("fxl");

  // Boxes: the Resources box style (gold outline + tiny raise) is the default for every box on the site (Daniel, 11 Nov).
  // The CSS lists the known boxes; this also finds any other box under the mouse (a bordered, rounded panel) and marks it .fxb.
  const SKIP = "input,select,textarea,button,a,label,summary,.chip,.pill,.sbar,.track,.rqtrack,.track2,.track > *,.rqtrack > *,.track2 > *,svg,img,header,nav,dialog,.frame";   // .frame = the resource picture (stays still, Daniel)
  function boxy(el) {
    if (el.__fxb !== undefined) return el.__fxb;
    let ok = false;
    if (!el.matches(SKIP) && !el.closest(".track,.rqtrack,.track2,nav,header,.stickybar")) {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect(), rad = parseFloat(cs.borderTopLeftRadius) || 0;
      ok = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none" && rad >= 8 && rad < r.height / 2 - 1 && r.width >= 120 && r.height >= 44
        && r.width < innerWidth * .96 && !/fixed|sticky/.test(cs.position) && !el.querySelector(".track,.rqtrack,.track2,.sbar,#wStates");
    }
    return (el.__fxb = ok);
  }
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    addEventListener("pointerover", e => {
      for (let el = e.target, n = 0; el && el !== document.body && n < 8; el = el.parentElement, n++) {
        if (el.nodeType !== 1) continue;
        if (boxy(el)) { el.classList.add("fxb"); break; }   // innermost box only
      }
    }, {passive: true});
  }

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
  document.addEventListener("scroll", e => { const t = e.target; if (!(t.matches && t.matches(TRACKS))) return; later(t);
    if (t._fxHold) e.stopPropagation();   // while gliding, the page's own picker waits (it already ran once at the click)
  }, true);

  // carousel arrows (Find resources, Map room): glide that starts moving the moment you click and settles softly.
  // The browser's own smooth scroll starts slowly, which read as lag (Daniel, 11 Nov).
  function glide(tr, x) {
    cancelAnimationFrame(tr._fxr); const from = tr.scrollLeft, dx = x - from, dur = 650; let t0 = 0;
    tr.style.scrollSnapType = "none";
    const step = now => { if (!t0) t0 = now; const p = Math.min(1, (now - t0) / dur); tr.scrollLeft = from + dx * (1 - Math.pow(1 - p, 3));
      if (p < 1) tr._fxr = requestAnimationFrame(step); else { tr._fxi = null; tr.style.scrollSnapType = "";
        if (tr._fxHold) { tr._fxHold = false; tr.dispatchEvent(new Event("scroll")); } } };   // picker catches up (no change unless clicks came fast)
    if (tr.matches(".track") && !tr._fxHold) {
      // Find resources and Map room: let the page do its heavy update (info box, map) ONCE, now, for the target card,
      // then glide with that work paused, so the motion never stutters halfway (Daniel: Map room felt laggy).
      tr.scrollLeft = x; tr.dispatchEvent(new Event("scroll"));   // the page's picker runs in the next frame at the target
      tr._fxHold = true;
      tr._fxr = requestAnimationFrame(() => { tr.scrollLeft = from; tr._fxr = requestAnimationFrame(step); });   // same frame, before paint: no jump
    } else tr._fxr = requestAnimationFrame(step);
  }
  // every carousel's arrows use it: Find resources and Map room (.carbtn), Serve and Speakers rows (.rqbtn), Speakers small rows (.arr)
  document.addEventListener("click", e => {
    const b = e.target.closest ? e.target.closest(".carbtn[data-car],.rqbtn,.arr") : null;
    if (!b) return;
    const tr = b.parentElement.querySelector(".track,.rqtrack,.track2") || (b.closest(".rqwrap") || b.parentElement).querySelector(".rqtrack,.track,.track2");
    if (!tr) return;
    const dir = b.dataset.d ? +b.dataset.d : b.classList.contains("l") ? -1 : 1;
    const tiles = [...tr.children], h = tr._fxi ?? tiles.findIndex(t => t.classList.contains("hot")), i = Math.max(0, Math.min(tiles.length - 1, (h < 0 ? 0 : h) + dir)), t = tiles[i];
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
  // Only reacts to real page changes: the Map room redraws its pin (SVG) every frame while the map moves, and re-measuring every carousel then made it lag.
  let st = 0; new MutationObserver(recs => {
    let page = false;
    for (const r of recs) { const t = r.target; if (t.closest && t.closest("svg")) continue; page = true; if (t.matches && t.matches(TRACKS)) later(t); }
    if (page) { clearTimeout(st); st = setTimeout(scan, 120); }
  }).observe(document.body, {childList: true, subtree: true});
  addEventListener("resize", () => document.querySelectorAll(TRACKS).forEach(later)); scan(); setTimeout(scan, 1500);
})();
