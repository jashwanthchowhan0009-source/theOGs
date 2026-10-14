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
  const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
  $(".stage__item--a", stage).innerHTML = `<img src="${RELEASES[0].mockups[0]}" alt="">`;
  $(".stage__item--b", stage).innerHTML = `<img src="${RELEASES[1].mockups[0]}" alt="">`;
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

  /* ---------- The drop ---------- */
  const chosen = {};
  const orderText = (r, size) =>
    `Hi theOG's! I'd like to order the ${r.name} tee (${r.color}, ${r.fit}), size ${size}, at the ${r.offer || ""} price of ${inr(r.price)}.`.replace("the  price", "the price");

  $("#releases").innerHTML = RELEASES.map((r) => {
    const save = r.mrp && r.mrp > r.price ? r.mrp - r.price : 0;
    return `<article class="release" id="${r.id}" aria-labelledby="${r.id}-name">
      <div class="release__stage" data-gallery="${r.id}">
        ${r.offer ? `<span class="release__badge mono">${r.offer}${save ? ` · Save ${inr(save)}` : ""}</span>` : ""}
        <div class="release__slides">
          ${r.mockups.map((src, i) => `<img src="${src}" alt="${r.name} tee, view ${i + 1} of ${r.mockups.length}" ${i ? 'loading="lazy"' : ""} class="${i ? "" : "is-on"}">`).join("")}
        </div>
        <button class="release__arrow release__arrow--prev" data-step="-1" aria-label="Previous view of ${r.name}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>
        <button class="release__arrow release__arrow--next" data-step="1" aria-label="Next view of ${r.name}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>
        <div class="release__thumbs" role="group" aria-label="Views of ${r.name}">
          ${r.mockups.map((src, i) => `<button class="thumb" data-view="${i}" aria-label="Show view ${i + 1}" aria-pressed="${i === 0}"><img src="${src}" alt="" loading="lazy"></button>`).join("")}
        </div>
      </div>
      <div class="release__info">
        <div>
          <p class="mono release__eyebrow">Doomsday drop · Tee ${r.number} of 02</p>
          <h3 id="${r.id}-name">${r.name}</h3>
          <p class="release__line">${r.line}</p>
        </div>
        <div class="price">
          <span class="price__now">${inr(r.price)}</span>
          ${r.mrp ? `<s class="price__was" aria-label="Was ${inr(r.mrp)}">${inr(r.mrp)}</s>` : ""}
          ${save ? `<span class="price__off mono">${Math.round((save / r.mrp) * 100)}% off</span>` : ""}
        </div>
        <dl class="specs mono">
          <div><dt>Colour</dt><dd>${r.color}</dd></div>
          <div><dt>Fit</dt><dd>${r.fit}</dd></div>
          <div><dt>Fabric</dt><dd>${r.fabric}</dd></div>
          <div><dt>Print</dt><dd>${r.print}</dd></div>
        </dl>
        <div class="sizepick">
          <p class="sizepick__label">Size: <b data-size-label>pick one</b></p>
          <div class="sizes" role="radiogroup" aria-label="Size for ${r.name}">
            ${r.sizes.map((sz) => `<button class="size" role="radio" aria-checked="false" data-size="${sz}">${sz}</button>`).join("")}
          </div>
          <p class="sizepick__hint" role="status"></p>
        </div>
        <a class="btn btn--solid btn--order" data-order="${r.id}" href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z"/></svg>
          Order on WhatsApp · ${inr(r.price)}
        </a>
      </div>
    </article>`;
  }).join("");

  // Mockup slideshow per tee: arrows, thumbnails, swipe.
  $$(".release__stage").forEach((el) => {
    const slides = $$(".release__slides img", el);
    const thumbs = $$(".thumb", el);
    let at = 0;
    const show = (i) => {
      at = (i + slides.length) % slides.length;
      slides.forEach((img, j) => img.classList.toggle("is-on", j === at));
      thumbs.forEach((t, j) => t.setAttribute("aria-pressed", String(j === at)));
    };
    el.addEventListener("click", (e) => {
      const step = e.target.closest("[data-step]");
      const view = e.target.closest("[data-view]");
      if (step) show(at + +step.dataset.step);
      if (view) show(+view.dataset.view);
    });
    let x0 = null;
    el.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  });

  // Size picker and the WhatsApp order message.
  $$(".release").forEach((card) => {
    const r = RELEASES.find((x) => x.id === card.id);
    const order = $(".btn--order", card);
    const hint = $(".sizepick__hint", card);
    $(".sizes", card).addEventListener("click", (e) => {
      const b = e.target.closest(".size");
      if (!b) return;
      chosen[r.id] = b.dataset.size;
      $$(".size", card).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      $("[data-size-label]", card).textContent = b.dataset.size;
      hint.textContent = "";
      order.href = waLink(orderText(r, b.dataset.size));
    });
    order.addEventListener("click", (e) => {
      if (chosen[r.id]) return;
      e.preventDefault();
      hint.textContent = "Pick a size first.";
      const s = $(".sizes", card); s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake");
    });
  });

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
