(function () {
  "use strict";

  const PRODUCTS = window.OG_PRODUCTS;
  const CATS = window.OG_CATEGORIES;
  const LOOKS = window.OG_LOOKS;
  const FREE_SHIP = window.OG_FREE_SHIPPING;
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const inr = (n) => "₹" + n.toLocaleString("en-IN");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Storage that never throws (private windows, blocked storage). */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem("og:" + k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem("og:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  const art = (p, colorIndex, extra) => {
    const c = p.colors[colorIndex] || p.colors[0];
    if (p.image) return `<img src="${p.image}" alt="${p.name} in ${c.name}" loading="lazy">`;
    return window.garmentSVG(p.type, c.hex, Object.assign({ print: p.print, label: `${p.name} in ${c.name}` }, extra));
  };

  /* ---------- Theme ---------- */
  const root = document.documentElement;
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
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- Nav ---------- */
  const nav = $(".nav");
  const burger = $("#burger");
  const links = $("#navLinks");
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 8);
    nav.classList.toggle("hide", y > lastY && y > 400 && !links.classList.contains("open"));
    lastY = y;
  }, { passive: true });

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

  // Highlight the section in view.
  const sections = ["shop", "lookbook", "about", "contact"].map((id) => document.getElementById(id));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) $$(".nav__links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Hero stage ---------- */
  const stage = $("#heroStage");
  const heroItems = [
    ["loopback-hoodie", 2, ".stage__item--a"],
    ["utility-cargo", 1, ".stage__item--b"],
    ["cap", 1, ".stage__item--c"]
  ];
  heroItems.forEach(([id, ci, sel]) => { $(sel, stage).innerHTML = art(byId[id], ci); });
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

  /* ---------- Shop ---------- */
  const state = {
    cat: store.get("cat", "all"),
    sort: "featured",
    q: "",
    wish: new Set(store.get("wish", [])),
    cart: store.get("cart", []),
    wishOnly: false
  };
  if (!CATS.some((c) => c.id === state.cat)) state.cat = "all";

  function renderChips() {
    $("#chips").innerHTML = CATS.map((c) => {
      const n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length;
      return `<button class="chip" data-cat="${c.id}" aria-pressed="${!state.wishOnly && state.cat === c.id}">${c.label} <small>${n}</small></button>`;
    }).join("") + `<button class="chip" data-cat="wish" aria-pressed="${state.wishOnly}">Saved <small>${state.wish.size}</small></button>`;
  }

  function visibleProducts() {
    const q = state.q.trim().toLowerCase();
    let list = PRODUCTS.filter((p) =>
      (state.wishOnly ? state.wish.has(p.id) : state.cat === "all" || p.category === state.cat) &&
      (!q || [p.name, p.category, p.type, p.sku, ...p.colors.map((c) => c.name)].join(" ").toLowerCase().includes(q))
    );
    const sorters = {
      featured: (a, b) => a.order - b.order,
      new: (a, b) => b.added - a.added,
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price
    };
    return list.sort(sorters[state.sort]);
  }

  const heart = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>`;

  function renderGrid() {
    const list = visibleProducts();
    $("#grid").innerHTML = list.map((p, i) => {
      const alt = p.colors.length > 1;
      const badgeKey = p.badge ? p.badge.split(" ")[0] : "";
      return `<article class="card" style="animation-delay:${Math.min(i, 8) * 45}ms">
        ${p.badge ? `<span class="badge badge--${badgeKey}">${p.badge}</span>` : ""}
        <button class="wish" data-wish="${p.id}" aria-pressed="${state.wish.has(p.id)}" aria-label="Save ${p.name}">${heart}</button>
        <div class="card__media${alt ? "" : " single"}" data-open="${p.id}">
          <div class="art art--main">${art(p, 0)}</div>
          ${alt ? `<div class="art art--alt">${art(p, 1)}</div>` : ""}
          <button class="quick" data-open="${p.id}">Quick view</button>
        </div>
        <div class="card__info">
          <h3 class="card__name"><button data-open="${p.id}">${p.name}</button></h3>
          <span class="card__price">${inr(p.price)}</span>
          <div class="card__sub">
            <span>${p.colors.length} colour${p.colors.length > 1 ? "s" : ""}</span>
            <span class="dots" aria-hidden="true">${p.colors.map((c) => `<span style="background:${c.hex}"></span>`).join("")}</span>
          </div>
        </div>
      </article>`;
    }).join("");
    $("#empty").hidden = list.length > 0;
    $("#empty p").textContent = state.wishOnly ? "You haven't saved anything yet. Tap the heart on any piece." : "Nothing matches that search.";
    $("#resultCount").textContent = `${list.length} piece${list.length === 1 ? "" : "s"}`;
  }

  function refreshShop() { renderChips(); renderGrid(); }

  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    if (b.dataset.cat === "wish") { state.wishOnly = !state.wishOnly; }
    else { state.wishOnly = false; state.cat = b.dataset.cat; store.set("cat", state.cat); }
    refreshShop();
  });
  let searchTimer;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = e.target.value; renderGrid(); }, 120);
  });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
  $("#clearFilters").addEventListener("click", () => {
    state.q = ""; state.cat = "all"; state.wishOnly = false; $("#search").value = ""; refreshShop();
  });

  function toggleWish(id, btn) {
    const p = byId[id];
    if (state.wish.has(id)) { state.wish.delete(id); toast(`Removed ${p.name} from saved`); }
    else { state.wish.add(id); toast(`Saved ${p.name}`); }
    store.set("wish", Array.from(state.wish));
    if (btn) { btn.setAttribute("aria-pressed", String(state.wish.has(id))); btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop"); }
    updateWishCount();
    renderChips();
    if (state.wishOnly) renderGrid();
  }
  function updateWishCount() {
    const c = $("#wishCount");
    c.hidden = state.wish.size === 0;
    c.textContent = state.wish.size;
  }
  $("#wishBtn").addEventListener("click", () => {
    state.wishOnly = true; refreshShop();
    document.getElementById("shop").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  $("#grid").addEventListener("click", (e) => {
    const w = e.target.closest("[data-wish]");
    if (w) { toggleWish(w.dataset.wish, w); return; }
    const o = e.target.closest("[data-open]");
    if (o) openQuickView(o.dataset.open);
  });

  /* ---------- Quick view ---------- */
  const modal = $("#modal");
  const qv = { p: null, color: 0, size: null, qty: 1, lastFocus: null };

  function guideFor(p) {
    const g = window.OG_SIZE_GUIDE;
    if (p.category === "accessories") return null;
    if (p.category === "bottoms") return /^\d+$/.test(p.sizes[0]) ? g.bottoms : g.easyBottoms;
    return g.tops;
  }

  function openQuickView(id, colorIndex) {
    const p = byId[id];
    if (!p) return;
    qv.p = p; qv.color = colorIndex || 0; qv.qty = 1;
    qv.size = p.sizes.length === 1 ? p.sizes[0] : null;
    qv.lastFocus = document.activeElement;

    $("#qvSku").textContent = p.sku;
    $("#qvTitle").textContent = p.name;
    $("#qvPrice").textContent = inr(p.price);
    $("#qvDesc").textContent = p.desc;
    $("#qvMeta").innerHTML = `<li>Fabric · <b>${p.fabric}</b></li><li>Fit · <b>${p.fit}</b></li><li>Ships in · <b>2–4 working days</b></li>`;
    $("#qvColors").innerHTML = p.colors.map((c, i) =>
      `<button class="swatch" role="radio" aria-checked="${i === qv.color}" aria-label="${c.name}" data-color="${i}" style="background:${c.hex}"></button>`).join("");
    $("#qvSizes").innerHTML = p.sizes.map((s) => {
      const out = p.soldOut.includes(s);
      return `<button class="size" role="radio" aria-checked="${qv.size === s}" data-size="${s}" ${out ? "disabled aria-disabled=\"true\" title=\"Sold out\"" : ""}>${s}</button>`;
    }).join("");

    const guide = guideFor(p);
    $("#sizeGuideBtn").hidden = !guide;
    $("#sizeGuide").hidden = true;
    $("#sizeGuideBtn").setAttribute("aria-expanded", "false");
    $("#sizeGuide").innerHTML = guide ? `<table><caption>Measured flat, in cm</caption><thead><tr>${guide.head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${guide.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "";

    updateQv();
    modal.hidden = false;
    document.body.classList.add("locked");
    requestAnimationFrame(() => { modal.classList.add("open"); $(".modal__close", modal).focus(); });
  }

  function updateQv() {
    const p = qv.p;
    $("#qvMedia").innerHTML = `<div class="art">${art(p, qv.color)}</div>`;
    $("#qvColorName").textContent = p.colors[qv.color].name;
    $("#qvSizeName").textContent = qv.size || "Pick one";
    $("#qvQty").textContent = qv.qty;
    $("#qvHint").textContent = "";
    $$("#qvColors .swatch").forEach((b) => b.setAttribute("aria-checked", String(+b.dataset.color === qv.color)));
    $$("#qvSizes .size").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.size === qv.size)));
  }

  function closeModal() {
    modal.classList.remove("open");
    document.body.classList.remove("locked");
    setTimeout(() => { modal.hidden = true; }, reduceMotion ? 0 : 350);
    if (qv.lastFocus && qv.lastFocus.focus) qv.lastFocus.focus();
  }

  $("#qvColors").addEventListener("click", (e) => { const b = e.target.closest(".swatch"); if (b) { qv.color = +b.dataset.color; updateQv(); } });
  $("#qvSizes").addEventListener("click", (e) => { const b = e.target.closest(".size"); if (b && !b.disabled) { qv.size = b.dataset.size; updateQv(); } });
  $("#qvMinus").addEventListener("click", () => { qv.qty = Math.max(1, qv.qty - 1); $("#qvQty").textContent = qv.qty; });
  $("#qvPlus").addEventListener("click", () => { qv.qty = Math.min(10, qv.qty + 1); $("#qvQty").textContent = qv.qty; });
  $("#sizeGuideBtn").addEventListener("click", (e) => {
    const g = $("#sizeGuide");
    g.hidden = !g.hidden;
    e.currentTarget.setAttribute("aria-expanded", String(!g.hidden));
  });
  $("#qvAdd").addEventListener("click", () => {
    if (!qv.size) {
      $("#qvHint").textContent = "Pick a size first.";
      const s = $("#qvSizes"); s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake");
      return;
    }
    addToCart(qv.p.id, qv.color, qv.size, qv.qty);
    closeModal();
    setTimeout(openDrawer, reduceMotion ? 0 : 250);
  });
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });

  /* ---------- Cart ---------- */
  const drawer = $("#drawer");
  const key = (l) => `${l.id}|${l.color}|${l.size}`;

  function addToCart(id, color, size, qty) {
    const existing = state.cart.find((l) => key(l) === `${id}|${color}|${size}`);
    if (existing) existing.qty = Math.min(10, existing.qty + qty);
    else state.cart.push({ id, color, size, qty });
    saveCart();
    renderCart();
    const p = byId[id];
    toast(`Added ${p.name} (${size}) to your bag`);
    const c = $("#cartCount"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  }
  function saveCart() { store.set("cart", state.cart); }

  function renderCart() {
    state.cart = state.cart.filter((l) => byId[l.id]);
    const count = state.cart.reduce((s, l) => s + l.qty, 0);
    const subtotal = state.cart.reduce((s, l) => s + l.qty * byId[l.id].price, 0);
    const cc = $("#cartCount");
    cc.hidden = count === 0;
    cc.textContent = count;
    $("#cartBtn").setAttribute("aria-label", `Open bag, ${count} item${count === 1 ? "" : "s"}`);

    $("#cartItems").innerHTML = state.cart.map((l, i) => {
      const p = byId[l.id];
      return `<li class="line-item">
        <div class="line-item__img">${art(p, l.color)}</div>
        <div>
          <h4>${p.name}</h4>
          <p>${p.colors[l.color].name} · ${l.size}</p>
          <div class="stepper" aria-label="Quantity for ${p.name}">
            <button type="button" data-dec="${i}" aria-label="Decrease">−</button>
            <output>${l.qty}</output>
            <button type="button" data-inc="${i}" aria-label="Increase">+</button>
          </div>
        </div>
        <div class="line-item__right">
          <span>${inr(p.price * l.qty)}</span>
          <button class="link" data-remove="${i}">Remove</button>
        </div>
      </li>`;
    }).join("");

    const empty = state.cart.length === 0;
    $("#cartEmpty").hidden = !empty;
    $("#cartItems").hidden = empty;
    $("#cartFoot").hidden = empty;
    $("#cartSubtotal").textContent = inr(subtotal);
    const left = FREE_SHIP - subtotal;
    $("#shipMsg").innerHTML = left > 0 ? `Add <b>${inr(left)}</b> more for free shipping` : `<b>You've unlocked free shipping.</b>`;
    $("#shipBar").style.width = Math.min(100, (subtotal / FREE_SHIP) * 100) + "%";
    $("#cartShipping").textContent = subtotal === 0 ? "" : left > 0 ? inr(99) : "Free";
  }

  $("#cartItems").addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.inc) state.cart[+t.dataset.inc].qty = Math.min(10, state.cart[+t.dataset.inc].qty + 1);
    if (t.dataset.dec) { const l = state.cart[+t.dataset.dec]; l.qty -= 1; if (l.qty < 1) state.cart.splice(+t.dataset.dec, 1); }
    if (t.dataset.remove) { const l = state.cart.splice(+t.dataset.remove, 1)[0]; toast(`Removed ${byId[l.id].name}`); }
    saveCart(); renderCart();
  });

  let drawerFocus;
  function openDrawer() {
    drawerFocus = document.activeElement;
    drawer.hidden = false;
    document.body.classList.add("locked");
    requestAnimationFrame(() => { drawer.classList.add("open"); $(".drawer__head .icon-btn").focus(); });
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    document.body.classList.remove("locked");
    setTimeout(() => { drawer.hidden = true; }, reduceMotion ? 0 : 450);
    if (drawerFocus && drawerFocus.focus) drawerFocus.focus();
  }
  $("#cartBtn").addEventListener("click", openDrawer);
  drawer.addEventListener("click", (e) => { if (e.target.closest("[data-close-drawer]")) closeDrawer(); });
  $("#checkoutBtn").addEventListener("click", () => toast("Checkout isn't connected yet. Hook up Shopify or Razorpay to take orders."));

  // Escape closes overlays; Tab stays inside the open one.
  document.addEventListener("keydown", (e) => {
    const openEl = !modal.hidden ? modal : !drawer.hidden ? drawer : null;
    if (e.key === "Escape") {
      if (!modal.hidden) closeModal();
      else if (!drawer.hidden) closeDrawer();
      else if (links.classList.contains("open")) setMenu(false);
    }
    if (e.key === "Tab" && openEl) {
      const f = $$("button:not([disabled]):not([hidden]), a[href], input, select, textarea", openEl).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Lookbook ---------- */
  const rail = $("#lookRail");
  const layouts = [
    [{ w: 62, l: 6, t: 14, r: -4 }, { w: 48, l: 46, t: 40, r: 5 }, { w: 30, l: 60, t: 6, r: 8 }],
    [{ w: 58, l: 24, t: 10, r: 3 }, { w: 48, l: 4, t: 42, r: -6 }, { w: 30, l: 62, t: 58, r: 10 }]
  ];
  rail.innerHTML = LOOKS.map((look, i) => {
    const lay = layouts[i % 2];
    const ink = ["#1B1B1F", "#5A1E25"].includes(look.bg) ? "#F2F1EC" : "#141418";
    const figs = look.items.map(([id, ci], j) => {
      const s = lay[j];
      return `<div class="look__fig" style="width:${s.w}%;left:${s.l}%;top:${s.t}%;--r:${s.r}deg;transform:rotate(${s.r}deg);z-index:${3 - j}">${art(byId[id], ci)}</div>`;
    }).join("");
    return `<article class="look">
      <div class="look__frame" style="background:${look.bg};color:${ink}">
        <span class="look__num" aria-hidden="true">${look.id}</span>${figs}
      </div>
      <div class="look__cap">
        <div><h3>Look ${look.id}: ${look.title}</h3><p>${look.note}</p></div>
        <button class="btn btn--ghost" data-look="${i}">Shop look</button>
      </div>
    </article>`;
  }).join("");

  rail.addEventListener("click", (e) => {
    const b = e.target.closest("[data-look]");
    if (!b) return;
    const [id, ci] = LOOKS[+b.dataset.look].items[0];
    openQuickView(id, ci);
  });

  const step = () => (rail.querySelector(".look") || {}).offsetWidth + 16 || 300;
  $("#lookPrev").addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" }));
  $("#lookNext").addEventListener("click", () => rail.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" }));
  rail.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); rail.scrollBy({ left: step() }); }
    if (e.key === "ArrowLeft") { e.preventDefault(); rail.scrollBy({ left: -step() }); }
  });
  function updateLookBar() {
    const max = rail.scrollWidth - rail.clientWidth;
    const frac = rail.clientWidth / rail.scrollWidth;
    const pos = max > 0 ? rail.scrollLeft / max : 0;
    const bar = $("#lookBar");
    bar.style.width = (frac * 100) + "%";
    bar.style.transform = `translateX(${pos * ((1 - frac) / frac) * 100}%)`;
  }
  rail.addEventListener("scroll", updateLookBar, { passive: true });
  window.addEventListener("resize", updateLookBar);

  // Drag to scroll with a mouse.
  let drag = null;
  rail.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.target.closest("button")) return;
    drag = { x: e.clientX, left: rail.scrollLeft, moved: false };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) { drag.moved = true; rail.classList.add("dragging"); }
    rail.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!drag) return;
    drag = null;
    rail.classList.remove("dragging");
  });

  /* ---------- Stats count-up & reveal ---------- */
  function countUp(el) {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion || end === 0) { el.textContent = end.toLocaleString("en-IN") + suffix; return; }
    const t0 = performance.now();
    const dur = 1400;
    (function tick(t) {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * eased).toLocaleString("en-IN") + suffix;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealEls = $$(".section__head, .about__copy, .stats, .process li, .contact__grid > *, .join");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.remove("pre");
        if (en.target.classList.contains("stats")) $$("[data-count]", en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el, i) => {
      el.classList.add("reveal");
      // Only hide what is below the fold, so the first frame is complete.
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("pre");
        if (el.matches(".process li")) el.style.transitionDelay = (i % 4) * 80 + "ms";
      }
      io.observe(el);
    });
  }

  /* ---------- Forms ---------- */
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
    const name = $("#cName").value.trim().split(" ")[0];
    const ok = $("#contactOk");
    ok.hidden = false;
    ok.textContent = `Thanks ${name}, your message is ready. Connect a form service (see README) to deliver it to your inbox.`;
    e.target.reset();
  });

  $("#joinForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#joinEmail");
    const msg = $("#joinMsg");
    if (!emailOk(input.value)) {
      msg.className = "join__msg bad";
      msg.textContent = "That email doesn't look right. Try name@example.com.";
      input.focus();
      return;
    }
    msg.className = "join__msg ok";
    msg.textContent = "You're on the list for Drop 08.";
    input.value = "";
  });

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Init ---------- */
  refreshShop();
  updateWishCount();
  renderCart();
  updateLookBar();
})();
