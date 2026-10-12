(function () {
  "use strict";

  const RELEASES = window.OG_RELEASES;
  const GALLERY = window.OG_GALLERY;
  const CONTACT = window.OG_CONTACT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  /* Storage that never throws (private windows, blocked storage). */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem("og:" + k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem("og:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  const waLink = (text) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
  function wireWhatsApp(scope) {
    $$("[data-wa]", scope).forEach((a) => { a.href = waLink(a.dataset.wa); });
  }

  /* ---------- Theme ---------- */
  const savedTheme = store.get("theme", null);
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  $("#themeToggle").addEventListener("click", () => {
    const current = root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store.set("theme", next);
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  /* ---------- Nav + the scrolling OG colour ---------- */
  const nav = $(".nav");
  const burger = $("#burger");
  const links = $("#navLinks");
  let lastY = window.scrollY;
  let ticking = false;

  // "OG" in the wordmark shifts from blue to red over the first stretch of scrolling.
  function paintOG() {
    const y = window.scrollY;
    const span = Math.max(600, window.innerHeight * 1.1);
    const p = Math.min(1, Math.max(0, y / span));
    const eased = p * p * (3 - 2 * p);
    root.style.setProperty("--og-p", (eased * 100).toFixed(1) + "%");
  }

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 8);
    nav.classList.toggle("hide", y > lastY && y > 500 && !links.classList.contains("open"));
    lastY = y;
    paintOG();
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", paintOG);

  function setMenu(open) {
    if (open) links.style.top = nav.getBoundingClientRect().bottom + "px";
    links.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("locked", open);
  }
  burger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 860) { setMenu(false); links.style.top = ""; } });

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) $$(".nav__links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["drop", "gallery", "about", "contact"].forEach((id) => spy.observe(document.getElementById(id)));
  }

  /* ---------- Hero stage ---------- */
  const stage = $("#heroStage");
  const teeArt = (r) => window.garmentSVG("tee", r.teeColor, { print: r.print, label: r.name });
  $(".stage__item--a", stage).innerHTML = teeArt(RELEASES[0]);
  $(".stage__item--b", stage).innerHTML = teeArt(RELEASES[1]);
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      $$(".stage__item", stage).forEach((el) => {
        const d = +el.dataset.depth;
        el.style.transform = `translate(${x * d}px, ${y * d}px) rotate(${x * d * 0.12}deg)`;
      });
    });
    hero.addEventListener("pointerleave", () => $$(".stage__item", stage).forEach((el) => (el.style.transform = "")));
  }

  /* ---------- Drop 01 ---------- */
  $("#releases").innerHTML = RELEASES.map((r) => {
    const media = r.mockup
      ? `<img src="${r.mockup}" alt="${r.name} mockup" loading="lazy">`
      : teeArt(r);
    return `<article class="release release--${r.theme}" aria-labelledby="${r.id}-name">
      <div class="release__stage">
        <span class="release__num" aria-hidden="true">${r.number}</span>
        <span class="release__corner release__corner--tl" aria-hidden="true"></span>
        <span class="release__corner release__corner--br" aria-hidden="true"></span>
        <figure class="release__fig${r.mockup ? " has-mockup" : ""}">${media}</figure>
        ${r.mockup ? "" : `<span class="release__chip mono">Mockup coming soon</span>`}
      </div>
      <div class="release__info">
        <div>
          <p class="mono release__eyebrow">Drop 01 · Piece ${r.number} of 02</p>
          <h3 id="${r.id}-name">${r.name}</h3>
          <p class="release__line">${r.line}</p>
        </div>
        <div class="release__meta">
          <span class="status"><i aria-hidden="true"></i>${r.status}</span>
          <span class="release__price">${r.price || "Price soon"}</span>
        </div>
        <a class="btn btn--solid" data-wa="Hi theOG's! Please notify me when ${r.name} drops." href="#" target="_blank" rel="noopener">Notify me about ${r.name}</a>
      </div>
    </article>`;
  }).join("");

  // Spotlight and a slight tilt that follow the pointer.
  if (!reduceMotion) {
    $$(".release__stage").forEach((el) => {
      const fig = $(".release__fig", el);
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        fig.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 8}deg) translateY(-6px)`;
      });
      el.addEventListener("pointerleave", () => { fig.style.transform = ""; });
    });
  }

  /* ---------- Gallery ---------- */
  const frames = $("#frames");
  frames.innerHTML = GALLERY.map((g, i) => `
    <figure class="frame" style="--ar:${g.w} / ${g.h}">
      <button class="frame__btn" data-photo="${i}" aria-label="Open photo: ${g.caption}">
        <img src="${g.src}" alt="${g.caption}" width="${g.w}" height="${g.h}" loading="lazy">
      </button>
      <figcaption><span class="mono">${String(i + 1).padStart(2, "0")} / ${String(GALLERY.length).padStart(2, "0")}</span>${g.caption}</figcaption>
    </figure>`).join("") + `
    <figure class="frame frame--more">
      <a class="frame__btn" href="https://instagram.com/${CONTACT.instagram}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6"/></svg>
        <strong>More on Instagram</strong>
        <span>@${CONTACT.instagram}</span>
      </a>
      <figcaption><span class="mono">++</span>New shoots go up there first</figcaption>
    </figure>`;

  const viewer = $("#viewer");
  let current = 0;
  let viewerFocus;
  function showPhoto(i) {
    current = (i + GALLERY.length) % GALLERY.length;
    const g = GALLERY[current];
    $("#viewerImg").src = g.src;
    $("#viewerImg").alt = g.caption;
    $("#viewerCap").textContent = `${String(current + 1).padStart(2, "0")} / ${String(GALLERY.length).padStart(2, "0")} · ${g.caption}`;
    const many = GALLERY.length > 1;
    $("#viewerPrev").hidden = !many;
    $("#viewerNext").hidden = !many;
  }
  function openViewer(i) {
    viewerFocus = document.activeElement;
    showPhoto(i);
    viewer.hidden = false;
    document.body.classList.add("locked");
    requestAnimationFrame(() => { viewer.classList.add("open"); $(".viewer__close", viewer).focus(); });
  }
  function closeViewer() {
    viewer.classList.remove("open");
    document.body.classList.remove("locked");
    setTimeout(() => { viewer.hidden = true; }, reduceMotion ? 0 : 300);
    if (viewerFocus && viewerFocus.focus) viewerFocus.focus();
  }
  frames.addEventListener("click", (e) => { const b = e.target.closest("[data-photo]"); if (b) openViewer(+b.dataset.photo); });
  viewer.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeViewer(); });
  $("#viewerPrev").addEventListener("click", () => showPhoto(current - 1));
  $("#viewerNext").addEventListener("click", () => showPhoto(current + 1));

  // Swipe between photos on touch screens.
  let touchX = null;
  viewer.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  document.addEventListener("keydown", (e) => {
    if (!viewer.hidden) {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") showPhoto(current + 1);
      if (e.key === "ArrowLeft") showPhoto(current - 1);
      if (e.key === "Tab") {
        const f = $$("button:not([hidden])", viewer);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.key === "Escape" && links.classList.contains("open")) setMenu(false);
  });

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealEls = $$(".section__head, .release, .frame, .about__copy, .about__mark, .process li, .contact__grid > *, .join");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.remove("pre");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el, i) => {
      el.classList.add("reveal");
      // Only hide what starts below the fold, so the first frame is complete.
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("pre");
        if (el.matches(".process li, .release, .frame")) el.style.transitionDelay = (i % 3) * 90 + "ms";
      }
      io.observe(el);
    });
  }

  /* ---------- Contact form: opens the visitor's email app ---------- */
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  $("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const checks = [
      ["cName", (v) => v.trim().length >= 2, "Enter your name."],
      ["cEmail", emailOk, "Enter an email like name@example.com."],
      ["cMsg", (v) => v.trim().length >= 10, "Write at least 10 characters so we can help."]
    ];
    let firstBad = null;
    checks.forEach(([id, test, msg]) => {
      const input = document.getElementById(id);
      const ok = test(input.value);
      input.closest(".field").classList.toggle("invalid", !ok);
      input.setAttribute("aria-invalid", String(!ok));
      document.getElementById(id + "Err").textContent = ok ? "" : msg;
      if (!ok && !firstBad) firstBad = input;
    });
    if (firstBad) { firstBad.focus(); return; }

    const name = $("#cName").value.trim();
    const subject = `${$("#cTopic").value}: message from ${name}`;
    const body = `${$("#cMsg").value.trim()}\n\n${name}\n${$("#cEmail").value.trim()}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const ok = $("#contactOk");
    ok.hidden = false;
    ok.textContent = `Your email app should open with the message ready to send. If it doesn't, write to us at ${CONTACT.email}.`;
  });

  $("#year").textContent = new Date().getFullYear();
  wireWhatsApp(document);
  paintOG();
})();
