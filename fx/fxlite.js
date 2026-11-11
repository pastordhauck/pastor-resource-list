// Light motion for the live site (Daniel, 11 Nov 2026; see fxlite.css). Looks only; it changes no data.
// Runs on the main page and inside the Serve and Speakers pages.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const R = document.documentElement; R.classList.add("fxl");

  // cards lean toward the mouse (CSS turns --rx/--ry into a small angle)
  const TILT = ".card,.grp,.info,.rqinfo,.wkday,.tool"; let cur = null;
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    addEventListener("pointermove", e => {
      const el = e.target.closest ? e.target.closest(TILT) : null;
      if (el !== cur) { if (cur) cur.classList.remove("fxt"); cur = el; if (el) el.classList.add("fxt"); }
      if (!el) return;
      const r = el.getBoundingClientRect(), k = Math.min(1, 320 / r.width);   // wide cards lean less
      el.style.setProperty("--ry", (((e.clientX - r.left) / r.width - .5) * 8 * k).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((.5 - (e.clientY - r.top) / r.height) * 6 * k).toFixed(2) + "deg");
    }, {passive: true});
    addEventListener("pointerleave", () => { if (cur) cur.classList.remove("fxt"); cur = null; });
  }

  // carousels: each card learns how far it is from the middle (--d); the CSS bends the row by that
  const TRACKS = ".track,.rqtrack";
  function flow(t) {
    if (!t.clientWidth) return;
    const mid = t.scrollLeft + t.clientWidth / 2, base = t.firstElementChild ? t.firstElementChild.offsetLeft - (parseFloat(getComputedStyle(t).paddingLeft) || 0) : 0;
    for (const c of t.children) { let d = (c.offsetLeft - base + c.offsetWidth / 2 - mid) / (c.offsetWidth + 14); d = Math.max(-2.4, Math.min(2.4, d));
      c.style.setProperty("--d", d.toFixed(2)); c.style.setProperty("--a", Math.abs(d).toFixed(2)); }
  }
  const pend = new Set(); let fr = 0;
  const later = t => { pend.add(t); if (!fr) fr = requestAnimationFrame(() => { fr = 0; pend.forEach(flow); pend.clear(); }); };
  document.addEventListener("scroll", e => { const t = e.target; if (t.matches && t.matches(TRACKS)) later(t); }, true);

  // parts below the screen wait, then rise when you reach them (never hides what is already on screen)
  const REV = ".lineup,.ghead,#groups .grp,.rpager,main section.wrap,main .section,.rqwrap";
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("fx-in"); io.unobserve(en.target); } }), {rootMargin: "0px 0px -6% 0px"}) : null;
  function scan() {
    document.querySelectorAll(TRACKS).forEach(later);
    if (!io) return;
    document.querySelectorAll(REV).forEach(el => { if (el.__fxl) return; el.__fxl = 1;
      if (el.getBoundingClientRect().top > innerHeight * .92) { el.classList.add("fx-rev"); io.observe(el); } });
  }
  let st = 0; new MutationObserver(() => { clearTimeout(st); st = setTimeout(scan, 120); }).observe(document.body, {childList: true, subtree: true});
  addEventListener("resize", () => document.querySelectorAll(TRACKS).forEach(later)); scan(); setTimeout(scan, 1500);
})();
