(function () {
  "use strict";

  const RELEASES = window.OG_RELEASES;
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

  // The flags photo behind the sign-up band drifts slightly slower than the page.
  const joinEl = $(".join");
  function parallaxJoin() {
    if (reduceMotion || !joinEl) return;
    const r = joinEl.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const k = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
    joinEl.style.setProperty("--join-shift", (k * -40).toFixed(1) + "px");
  }

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 8);
    nav.classList.toggle("hide", y > lastY && y > 500 && !links.classList.contains("open"));
    lastY = y;
    paintOG();
    parallaxJoin();
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
    ["drop", "about", "contact"].forEach((id) => spy.observe(document.getElementById(id)));
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) setMenu(false);
  });

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealEls = $$(".section__head, .release, .about__copy, .about__mark, .process li, .contact__grid > *, .join");
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
        if (el.matches(".process li, .release")) el.style.transitionDelay = (i % 3) * 90 + "ms";
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
