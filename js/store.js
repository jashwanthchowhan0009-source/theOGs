/* Shared shop helpers: storage, prices, the cart, WhatsApp links and payment.
   Loaded on every page after data.js. Exposes window.OG. */
(function () {
  "use strict";

  const RELEASES = window.OG_RELEASES;
  const CONTACT = window.OG_CONTACT;
  const SHOP = window.OG_STORE;
  const PAY = window.OG_PAYMENT || { enabled: false };

  /* Storage that never throws (private windows, blocked storage). */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem("og:" + k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem("og:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem("og:" + k); } catch (e) { /* ignore */ } }
  };

  const savedTheme = store.get("theme", null);
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

  const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const waLink = (text) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
  const product = (id) => RELEASES.find((r) => r.id === id);

  /* ---------- Cart: [{ id, size, qty }] in localStorage ---------- */
  let memory = null; // used when storage is blocked
  function read() {
    const raw = memory || store.get("cart", []);
    return (Array.isArray(raw) ? raw : []).filter((l) => {
      const p = product(l.id);
      return p && !p.soldOut && p.sizes.includes(l.size) && l.qty > 0;
    }).map((l) => ({ id: l.id, size: l.size, qty: Math.min(SHOP.maxQty, Math.floor(l.qty)) }));
  }
  function write(items) {
    memory = items;
    store.set("cart", items);
    document.dispatchEvent(new CustomEvent("og:cart"));
  }

  const cart = {
    items: read,
    add(id, size, qty = 1) {
      const items = read();
      const line = items.find((l) => l.id === id && l.size === size);
      let capped = false;
      if (line) {
        capped = line.qty + qty > SHOP.maxQty;
        line.qty = Math.min(SHOP.maxQty, line.qty + qty);
      } else items.push({ id, size, qty: Math.min(SHOP.maxQty, qty) });
      write(items);
      return { capped };
    },
    setQty(id, size, qty) {
      const items = read();
      const line = items.find((l) => l.id === id && l.size === size);
      if (!line) return;
      line.qty = Math.max(1, Math.min(SHOP.maxQty, qty));
      write(items);
    },
    remove(id, size) { write(read().filter((l) => !(l.id === id && l.size === size))); },
    clear() { write([]); },
    count() { return read().reduce((n, l) => n + l.qty, 0); },
    lines() {
      return read().map((l) => {
        const p = product(l.id);
        return { ...l, product: p, total: p.price * l.qty, mrpTotal: (p.mrp || p.price) * l.qty };
      });
    },
    totals(lines = cart.lines()) {
      const subtotal = lines.reduce((n, l) => n + l.total, 0);
      const mrp = lines.reduce((n, l) => n + l.mrpTotal, 0);
      const shipping = lines.length ? SHOP.shipping : 0;
      const c = lines.length ? coupon.get() : null;
      const discount = c ? Math.min(c.off, subtotal) : 0;
      return {
        count: lines.reduce((n, l) => n + l.qty, 0), subtotal, mrp, savings: mrp - subtotal,
        coupon: c ? c.code : "", discount, shipping, total: subtotal - discount + shipping
      };
    }
  };

  /* ---------- Coupon: one per order, codes and amounts in OG_STORE.coupons ---------- */
  const COUPONS = SHOP.coupons || {};
  const findCoupon = (code) => {
    const key = Object.keys(COUPONS).find((k) => k.toUpperCase() === String(code).trim().toUpperCase());
    return key ? { code: key, off: COUPONS[key] } : null;
  };
  const coupon = {
    enabled: Object.keys(COUPONS).length > 0,
    maxOff: Math.max(0, ...Object.values(COUPONS)),
    get() { const saved = store.get("coupon", null); return saved ? findCoupon(saved) : null; },
    apply(code) {
      const c = findCoupon(code);
      if (c) { store.set("coupon", c.code); document.dispatchEvent(new CustomEvent("og:cart")); }
      return c;
    },
    remove() { store.del("coupon"); document.dispatchEvent(new CustomEvent("og:cart")); }
  };

  // Keep every open tab in step.
  window.addEventListener("storage", (e) => {
    if (e.key === "og:cart") { memory = null; document.dispatchEvent(new CustomEvent("og:cart")); }
  });

  /* ---------- Customer checks ---------- */
  // Accepts 98765 43210, +91 9876543210, 09876543210. Returns the 10 digits or "".
  function cleanMobile(v) {
    let d = String(v).replace(/\D/g, "");
    if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
    if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : "";
  }
  // The South Indian state a pincode belongs to, or null.
  function regionForPin(pin) {
    if (!/^[1-9]\d{5}$/.test(pin)) return null;
    // Longer prefixes first, so Puducherry's 605 wins over Tamil Nadu's 60.
    let best = null;
    SHOP.regions.forEach((r) => r.pins.forEach((p) => {
      if (pin.startsWith(p) && (!best || p.length > best.len)) best = { region: r, len: p.length };
    }));
    return best ? best.region : null;
  }
  const pinMatchesState = (pin, state) => {
    const r = SHOP.regions.find((x) => x.name === state);
    return !!r && r.pins.some((p) => pin.startsWith(p));
  };

  /* ---------- Payment ----------
     startPayment(order) resolves with { paid: true, ref } when the customer pays,
     or { paid: false } when online payment is off. It rejects if they close the window. */
  function loadScript(src) {
    return new Promise((ok, fail) => {
      if (document.querySelector(`script[src="${src}"]`)) return ok();
      const s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = () => fail(new Error("Payment could not load. Check your internet and try again."));
      document.head.appendChild(s);
    });
  }
  async function startPayment(order) {
    if (!PAY.enabled || !PAY.keyId) return { paid: false };
    if (PAY.provider !== "razorpay") throw new Error("Unknown payment provider.");
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    return new Promise((ok, fail) => {
      const rzp = new window.Razorpay({
        key: PAY.keyId,
        amount: order.totals.total * 100, // paise
        currency: "INR",
        name: "theOG's",
        description: `Order ${order.id}`,
        prefill: { name: order.customer.name, contact: "+91" + order.customer.mobile, email: order.customer.email || undefined },
        notes: { order_id: order.id, items: order.lines.map((l) => `${l.name} ${l.size} x${l.qty}`).join(", ").slice(0, 250), pincode: order.address.pincode },
        theme: { color: "#0B5E27" },
        handler: (res) => ok({ paid: true, ref: res.razorpay_payment_id }),
        modal: { ondismiss: () => fail(new Error("Payment was cancelled. Your cart is still saved.")) }
      });
      rzp.on("payment.failed", (r) => fail(new Error(r.error && r.error.description ? r.error.description : "Payment failed. Please try again.")));
      rzp.open();
    });
  }

  /* ---------- Analytics (Google Analytics 4, off until an ID is set) ---------- */
  const GA = (window.OG_ANALYTICS || {}).ga4 || "";
  if (/^G-[A-Z0-9]+$/.test(GA)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA);
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA}`;
    document.head.appendChild(s);
  }
  const gaItem = (id, size, qty) => {
    const p = product(id);
    return { item_id: `${id}-${size}`, item_name: p.name, item_variant: `${p.color} / ${size}`, item_category: "T-shirt", price: p.price, quantity: qty };
  };
  // track("add_to_cart", { lines: [{ id, size, qty }] }) and so on; never pass personal details.
  function track(event, data = {}) {
    if (typeof window.gtag !== "function") return;
    const params = { currency: "INR", ...data };
    if (data.lines) {
      params.items = data.lines.map((l) => gaItem(l.id, l.size, l.qty));
      if (params.value == null) params.value = params.items.reduce((n, i) => n + i.price * i.quantity, 0);
      const c = coupon.get();
      if (c && params.coupon == null) params.coupon = c.code;
      delete params.lines;
    }
    window.gtag("event", event, params);
  }
  // Any WhatsApp link tapped anywhere on the site.
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="https://wa.me/"]');
    if (a) track("whatsapp_click", { link_text: a.textContent.trim().slice(0, 60) });
  });

  window.OG = { track, coupon, store, inr, esc, waLink, product, cart, cleanMobile, regionForPin, pinMatchesState, startPayment, payOnline: !!(PAY.enabled && PAY.keyId) };
})();
