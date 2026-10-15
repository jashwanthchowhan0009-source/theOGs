/* Checkout: details → review → payment → done. Steps live in the URL hash so the phone's back button works. */
(function () {
  "use strict";

  const { store, inr, esc, waLink, cart, coupon, cleanMobile, regionForPin, pinMatchesState, startPayment, payOnline, track } = window.OG;
  const SHOP = window.OG_STORE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const form = $("#stepDetails");
  const steps = { details: form, review: $("#stepReview"), pay: $("#stepPay"), done: $("#stepDone"), empty: $("#stepEmpty") };
  let details = null; // set once step 1 passes

  // Pay by UPI QR (manual check by the owner). See OG_PAYMENT.upi in js/data.js.
  const UPI = (window.OG_PAYMENT || {}).upi || {};
  const upiOn = /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(UPI.id || "");
  let method = payOnline ? "online" : upiOn ? "upi" : "whatsapp";
  let utr = "";

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3600);
  }
  $$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa); });

  /* ---------- Order summary (right column, collapsible on phones) ---------- */
  function renderSummary(lines = cart.lines()) {
    const t = cart.totals(lines);
    $("#sumItems").innerHTML = lines.map((l) => `
      <li class="cline">
        <span class="line__thumb"><img src="${l.product.mockups[0]}" alt="" width="56" height="75"><b>${l.qty}</b></span>
        <div class="line__info">
          <p class="line__name">${esc(l.product.name)}</p>
          <p class="line__meta mono">${esc(l.product.color)} · Size ${l.size}</p>
        </div>
        <p class="line__price">${inr(l.total)}</p>
      </li>`).join("");
    $("#sumTotals").innerHTML = `
      ${t.savings ? `<div><dt>Original price</dt><dd>${inr(t.mrp)}</dd></div>
      <div class="sum__save"><dt>Dussehra savings</dt><dd>−${inr(t.savings)}</dd></div>` : ""}
      <div><dt>Subtotal</dt><dd>${inr(t.subtotal)}</dd></div>
      ${t.discount ? `<div class="sum__save"><dt>Coupon ${esc(t.coupon)}</dt><dd>−${inr(t.discount)}</dd></div>` : ""}
      <div><dt>Delivery</dt><dd>${t.shipping ? inr(t.shipping) : "Free"}</dd></div>
      <div class="sum__total"><dt>Total</dt><dd>${inr(t.total)}</dd></div>`;
    $("#sumTotalMini").textContent = inr(t.total);
    $("#couponForm").hidden = !coupon.enabled || !!t.discount;
    $("#couponOn").hidden = !t.discount;
    if (t.discount) $("#couponOn").innerHTML = `<span><b>${esc(t.coupon)}</b> applied · ${inr(t.discount)} off</span><button class="link" type="button" id="couponRemove">Remove</button>`;
  }

  /* ---------- Coupon ---------- */
  $("#couponForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#fCoupon");
    if (!input.value.trim()) { $("#couponErr").textContent = "Enter your coupon code."; return input.focus(); }
    const c = coupon.apply(input.value);
    if (!c) { $("#couponErr").textContent = "That code isn't valid. Check the spelling and try again."; return input.focus(); }
    $("#couponErr").textContent = "";
    input.value = "";
    toast(`${c.code} applied: ${inr(c.off)} off`);
  });
  $("#couponOn").addEventListener("click", (e) => { if (e.target.closest("#couponRemove")) coupon.remove(); });
  $("#sumToggle").addEventListener("click", (e) => {
    const open = e.currentTarget.getAttribute("aria-expanded") !== "true";
    e.currentTarget.setAttribute("aria-expanded", String(open));
    $("#summary").classList.toggle("open", open);
  });

  /* ---------- Step 1: details ---------- */
  const f = (name) => form.elements[name];
  $("#fState").insertAdjacentHTML("beforeend", SHOP.regions.map((r) => `<option>${r.name}</option>`).join(""));

  const saved = store.get("customer", null);
  if (saved) Object.entries(saved).forEach(([k, v]) => {
    const el = f(k);
    if (!el || v == null) return;
    if (el instanceof RadioNodeList) $$(`input[name="${k}"]`, form).forEach((r) => { r.checked = r.value === v; });
    else el.value = v;
  });

  function setErr(el, msg) {
    const field = el.closest(".field");
    field.classList.toggle("invalid", !!msg);
    el.setAttribute("aria-invalid", String(!!msg));
    $(".err", field).textContent = msg || "";
    return !msg;
  }

  // Mobile: digits only, shown as 98765 43210.
  f("mobile").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/[^\d+\s]/g, ""); });
  f("mobile").addEventListener("blur", (e) => {
    const m = cleanMobile(e.target.value);
    if (m) { e.target.value = m.slice(0, 5) + " " + m.slice(5); setErr(e.target, ""); }
  });

  // Pincode: fill the state from the number, and the town from India Post when it answers.
  const PIN_OUTSIDE = "Sorry, we only deliver in South India for now (AP, Telangana, Karnataka, Tamil Nadu, Kerala, Puducherry).";
  let pinLookup = 0;
  f("pincode").addEventListener("input", (e) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    e.target.value = pin;
    if (pin.length < 6) return setErr(e.target, "");
    const region = regionForPin(pin);
    if (!region) return setErr(e.target, PIN_OUTSIDE);
    setErr(e.target, "");
    if (!pinMatchesState(pin, f("state").value)) { f("state").value = region.name; setErr(f("state"), ""); }
    lookupPin(pin);
  });
  async function lookupPin(pin) {
    const ticket = ++pinLookup;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: ctrl.signal });
      clearTimeout(timer);
      const data = await res.json();
      if (ticket !== pinLookup || !data || !data[0] || data[0].Status !== "Success") return;
      const po = data[0].PostOffice[0];
      const city = (po.Block && po.Block !== "NA" ? po.Block : po.District) || "";
      if (city && !f("city").value.trim()) { f("city").value = city; setErr(f("city"), ""); }
    } catch (e) { /* the lookup is a convenience; typing the town works without it */ }
  }

  const rules = [
    ["name", (v) => (v.trim().replace(/[^A-Za-zऀ-෿]/g, "").length >= 2 ? "" : "Enter your full name.")],
    ["mobile", (v) => (cleanMobile(v) ? "" : "Enter a 10-digit Indian mobile number, like 98765 43210.")],
    ["email", (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter an email like name@example.com, or leave it empty.")],
    ["pincode", (v) => (!/^[1-9]\d{5}$/.test(v) ? "Enter your 6-digit pincode." : regionForPin(v) ? "" : PIN_OUTSIDE)],
    ["state", (v) => (!v ? "Choose your state." : regionForPin(f("pincode").value) && !pinMatchesState(f("pincode").value, v) ? `This pincode isn't in ${v}. Check the pincode or state.` : "")],
    ["house", (v) => (v.trim().length >= 2 ? "" : "Enter your flat or house number and building.")],
    ["area", (v) => (v.trim().length >= 3 ? "" : "Enter your area, street or locality.")],
    ["city", (v) => (v.trim().length >= 2 ? "" : "Enter your town or city.")]
  ];
  rules.forEach(([name, test]) => {
    f(name).addEventListener("blur", () => { if (f(name).getAttribute("aria-invalid") === "true" || f(name).value) setErr(f(name), test(f(name).value)); });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let firstBad = null;
    rules.forEach(([name, test]) => {
      const ok = setErr(f(name), test(f(name).value));
      if (!ok && !firstBad) firstBad = f(name);
    });
    if (firstBad) { firstBad.focus(); return; }
    const mobile = cleanMobile(f("mobile").value);
    details = {
      customer: { name: f("name").value.trim(), mobile, email: f("email").value.trim() },
      address: {
        house: f("house").value.trim(), area: f("area").value.trim(), landmark: f("landmark").value.trim(),
        city: f("city").value.trim(), state: f("state").value, pincode: f("pincode").value, type: f("type").value
      }
    };
    if ($("#fRemember").checked) store.set("customer", { ...details.customer, ...details.address });
    else store.del("customer");
    track("add_shipping_info", { lines: cart.items(), shipping_tier: details.address.state });
    go("review");
  });

  /* ---------- Step 2: review ---------- */
  function renderReview() {
    const { customer: c, address: a } = details;
    $("#reviewAddress").innerHTML = `
      <p><b>${esc(c.name)}</b> <span class="tag mono">${esc(a.type)}</span></p>
      <p>${esc(a.house)}, ${esc(a.area)}${a.landmark ? `<br>Landmark: ${esc(a.landmark)}` : ""}</p>
      <p>${esc(a.city)}, ${esc(a.state)} ${esc(a.pincode)}</p>
      <p class="mono">+91 ${c.mobile.slice(0, 5)} ${c.mobile.slice(5)}${c.email ? ` · ${esc(c.email)}` : ""}</p>`;
    $("#reviewItems").innerHTML = cart.lines().map((l) => `
      <li class="cline">
        <img src="${l.product.mockups[0]}" alt="" width="64" height="85">
        <div class="line__info">
          <p class="line__name">${esc(l.product.name)}</p>
          <p class="line__meta mono">${esc(l.product.color)} · ${esc(l.product.fit)} · Size ${l.size} · Qty ${l.qty}</p>
        </div>
        <div class="line__end"><p class="line__price">${inr(l.total)}</p>${l.mrpTotal > l.total ? `<s class="line__was">${inr(l.mrpTotal)}</s>` : ""}</div>
      </li>`).join("");
  }

  /* ---------- Step 3: payment ---------- */
  // The order ID is fixed once the customer reaches payment, so it can go in the UPI note.
  const orderId = () => {
    let id = store.get("pendingId", "");
    if (!/^OG-\d{6}-[A-Z0-9]{4}$/.test(id)) { id = newId(); store.set("pendingId", id); }
    return id;
  };
  const upiLink = (amount, id) =>
    `upi://pay?pa=${UPI.id}&pn=${encodeURIComponent(UPI.name || "theOG's").replace(/'/g, "%27")}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Order " + id)}`;
  function qrSvg(text) {
    if (typeof window.qrcode !== "function") return "";
    const qr = window.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  function renderPay() {
    const t = cart.totals();
    $("#payErr").textContent = "";
    const opt = (key, title, sub) => `
      <label class="payopt${method === key ? " is-on" : ""}"><input type="radio" name="pay" value="${key}" ${method === key ? "checked" : ""}>
        <span><b>${title}</b><small>${sub}</small></span></label>`;
    let html = "";
    if (payOnline) html += opt("online", "Pay online", "UPI, cards, net banking and wallets, secured by Razorpay");
    else html += `
      <div class="payopt payopt--soon" aria-disabled="true">
        <span><b>Pay online</b><small>Cards and net banking</small></span><em class="mono">Coming soon</em>
      </div>`;
    if (upiOn) html += opt("upi", "Pay by UPI", "Scan the QR or tap to pay with PhonePe, Google Pay, Paytm or any UPI app");
    if (!payOnline && !upiOn) html += opt("whatsapp", "Confirm on WhatsApp, then pay by UPI", `Place your order now. We'll message you on WhatsApp to confirm it and share UPI details for ${inr(t.total)}.`);
    if (method === "upi") {
      const id = orderId();
      const link = upiLink(t.total, id);
      html += `
      <div class="upi" id="upiBox">
        <div class="upi__top">
          <div class="upi__qr" role="img" aria-label="UPI QR code to pay ${inr(t.total)}">${qrSvg(link)}</div>
          <div class="upi__info">
            <p class="upi__amt">Pay <b>${inr(t.total)}</b></p>
            <p class="upi__to mono">to ${esc(UPI.name || "theOG's")}<br>Note: Order ${esc(id)}</p>
            <a class="btn btn--solid btn--block upi__app" href="${link}">Pay with UPI app</a>
            <p class="upi__id mono">UPI ID <b>${esc(UPI.id)}</b> <button type="button" class="link" id="upiCopy">Copy</button></p>
          </div>
        </div>
        <ol class="upi__steps">
          <li>Scan the QR with any UPI app, or tap <b>Pay with UPI app</b> on your phone.</li>
          <li>Pay exactly <b>${inr(t.total)}</b>.</li>
          <li>Copy the UTR (12-digit transaction ID) from the payment receipt and enter it below.</li>
        </ol>
        <div class="field">
          <label for="fUtr">UTR / UPI transaction ID</label>
          <input id="fUtr" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="12 digits" value="${esc(utr)}">
          <small class="err" id="utrErr"></small>
          <small class="hintline">PhonePe: History, then the payment, then UTR. Google Pay: the payment, then UPI transaction ID.</small>
        </div>
      </div>`;
    }
    $("#payBox").innerHTML = html;
    $("#confirmBtn").textContent = method === "online" ? `Pay ${inr(t.total)} and place order`
      : method === "upi" ? `I've paid · Place order` : `Place order · ${inr(t.total)}`;
    $$('input[name="pay"]', $("#payBox")).forEach((r) => r.addEventListener("change", () => { method = r.value; renderPay(); }));
    const u = $("#fUtr");
    if (u) u.addEventListener("input", () => { u.value = u.value.replace(/\D/g, "").slice(0, 12); utr = u.value; $("#utrErr").textContent = ""; u.removeAttribute("aria-invalid"); });
    const c = $("#upiCopy");
    if (c) c.addEventListener("click", () => {
      const done = () => toast("UPI ID copied");
      if (navigator.clipboard) navigator.clipboard.writeText(UPI.id).then(done, () => toast(UPI.id));
      else toast(UPI.id);
    });
  }

  // Email a copy of the order to the owner (FormSubmit). Best effort: never blocks the order.
  function emailOrder(o) {
    const to = window.OG_ORDER_EMAIL;
    if (!to || !window.fetch) return;
    const a = o.address;
    fetch(`https://formsubmit.co/ajax/${to}`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `New order ${o.id} · ${inr(o.totals.total)}`,
        _template: "box",
        _captcha: "false",
        Order: o.id,
        Total: inr(o.totals.total),
        Payment: `${o.payment.status}${o.payment.ref ? ` (${o.payment.ref})` : ""}`,
        Items: o.lines.map((l) => `${l.name} (${l.color}) size ${l.size} x${l.qty} = ${inr(l.total)}`).join("; "),
        Coupon: o.totals.coupon ? `${o.totals.coupon} −${inr(o.totals.discount)}` : "None",
        Name: o.customer.name,
        Mobile: "+91 " + o.customer.mobile,
        Email: o.customer.email || "",
        Address: `${a.house}, ${a.area}${a.landmark ? `, near ${a.landmark}` : ""}, ${a.city}, ${a.state} ${a.pincode} (${a.type})`
      })
    }).catch(() => {});
  }

  const newId = () => {
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let tail = "";
    const rnd = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(4)) : [0, 0, 0, 0].map(() => Math.random() * 256);
    rnd.forEach((n) => { tail += abc[n % abc.length]; });
    return `OG-${ymd}-${tail}`;
  };

  function orderMessage(o) {
    const L = [`*New order ${o.id}*`, ""];
    o.lines.forEach((l, i) => L.push(`${i + 1}. ${l.name} (${l.color}), size ${l.size} × ${l.qty} = ${inr(l.total)}`));
    L.push("", ...(o.totals.savings ? [`Original price: ${inr(o.totals.mrp)}`, `Dussehra savings: −${inr(o.totals.savings)}`] : []),
      `Subtotal: ${inr(o.totals.subtotal)}`, ...(o.totals.discount ? [`Coupon ${o.totals.coupon}: −${inr(o.totals.discount)}`] : []),
      `Delivery: ${o.totals.shipping ? inr(o.totals.shipping) : "Free"}`, `*Total: ${inr(o.totals.total)}*`,
      `Payment: ${o.payment.status}${o.payment.ref ? ` (${o.payment.ref})` : ""}`, "", "*Deliver to*", o.customer.name, `+91 ${o.customer.mobile}`);
    if (o.customer.email) L.push(o.customer.email);
    L.push(`${o.address.house}, ${o.address.area}`);
    if (o.address.landmark) L.push(`Landmark: ${o.address.landmark}`);
    L.push(`${o.address.city}, ${o.address.state} ${o.address.pincode} (${o.address.type})`);
    return L.join("\n");
  }

  const confirmBtn = $("#confirmBtn");
  confirmBtn.addEventListener("click", async () => {
    const lines = cart.lines();
    if (!lines.length || !details) return go("details");
    if (method === "upi") {
      const u = $("#fUtr");
      if (!/^\d{12}$/.test(utr)) {
        $("#utrErr").textContent = utr ? "The UTR has 12 digits. Check your payment receipt." : "Pay first, then enter the 12-digit UTR from your payment receipt.";
        u.setAttribute("aria-invalid", "true");
        u.focus();
        return;
      }
    }
    const order = {
      id: method === "upi" ? orderId() : newId(),
      placedAt: new Date().toISOString(),
      lines: lines.map((l) => ({ id: l.id, name: l.product.name, color: l.product.color, size: l.size, qty: l.qty, price: l.product.price, total: l.total })),
      totals: cart.totals(lines),
      customer: details.customer,
      address: details.address,
      payment: { status: "Pending: send UPI details on WhatsApp" }
    };
    if (method === "upi") order.payment = { method: "UPI", status: "UPI paid, please verify", ref: "UTR " + utr };
    if (method === "online") {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Opening payment…";
      try {
        const res = await startPayment(order);
        order.payment = { status: "Paid online", ref: res.ref };
      } catch (err) {
        $("#payErr").textContent = err.message;
        confirmBtn.disabled = false;
        renderPay();
        return;
      }
    }
    emailOrder(order);
    if (method !== "online") {
      // Inside the click, so phones don't block it. The next screen has a button too.
      window.open(waLink(orderMessage(order)), "_blank", "noopener");
    }
    const orders = store.get("orders", []);
    orders.unshift(order);
    store.set("orders", orders.slice(0, 10));
    store.set("lastOrder", order);
    track("purchase", {
      transaction_id: order.id, value: order.totals.total, shipping: order.totals.shipping, coupon: order.totals.coupon || undefined,
      payment_type: method === "online" ? "online" : method === "upi" ? "upi_qr" : "whatsapp_upi", lines: lines.map((l) => ({ id: l.id, size: l.size, qty: l.qty }))
    });
    go("done");
    store.del("pendingId");
    utr = "";
    store.del("coupon");
    cart.clear();
  });

  /* ---------- Done ---------- */
  function renderDone() {
    const o = store.get("lastOrder", null);
    if (!o) return false;
    const paid = /^Paid/.test(o.payment.status);
    const upi = o.payment.method === "UPI";
    steps.done.innerHTML = `
      <div class="done__badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
      <p class="mono eyebrow">Order ${esc(o.id)}</p>
      <h1 id="doneTitle">${paid || upi ? "Order placed" : "Order placed. One last step"}</h1>
      <p class="done__lede">${paid
        ? `Payment received. We'll pack your tee${o.totals.count > 1 ? "s" : ""} and share tracking on WhatsApp at +91 ${o.customer.mobile}.`
        : upi
        ? `Thanks! We'll check your UPI payment of <b>${inr(o.totals.total)}</b> (${esc(o.payment.ref)}) and confirm your order on WhatsApp at +91 ${o.customer.mobile}. Send us the order on WhatsApp too, so we have it right away.`
        : `Send us your order on WhatsApp so we can confirm it and share UPI details for <b>${inr(o.totals.total)}</b>. A WhatsApp chat may have opened in a new tab. If it didn't, use the button below.`}</p>
      <a class="btn btn--solid btn--block btn--wa" href="${waLink(orderMessage(o))}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z"/></svg>
        ${paid ? "Message us on WhatsApp" : "Send order on WhatsApp"}
      </a>
      <div class="co__box done__box">
        <ul class="lines lines--mini">${o.lines.map((l) => `<li class="cline"><div class="line__info"><p class="line__name">${esc(l.name)} × ${l.qty}</p><p class="line__meta mono">${esc(l.color)} · Size ${l.size}</p></div><p class="line__price">${inr(l.total)}</p></li>`).join("")}</ul>
        <dl class="sum">${o.totals.discount ? `<div class="sum__save"><dt>Coupon ${esc(o.totals.coupon)}</dt><dd>−${inr(o.totals.discount)}</dd></div>` : ""}<div class="sum__total"><dt>Total</dt><dd>${inr(o.totals.total)}</dd></div></dl>
        <p class="done__addr"><b>Delivering to</b><br>${esc(o.customer.name)}, ${esc(o.address.house)}, ${esc(o.address.area)}, ${esc(o.address.city)}, ${esc(o.address.state)} ${esc(o.address.pincode)}</p>
      </div>
      <a class="link" href="index.html">Back to theOG's</a>`;
    return true;
  }

  /* ---------- Step routing ---------- */
  function show(name) {
    Object.entries(steps).forEach(([k, el]) => { el.hidden = k !== name; });
    const order = ["details", "review", "pay"];
    $$(".steps li").forEach((li) => {
      const i = order.indexOf(li.dataset.step), at = order.indexOf(name);
      li.classList.toggle("done", name === "done" || (at > -1 && i < at));
      if (li.dataset.step === name) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    $(".steps").hidden = name === "done" || name === "empty";
    $("#summary").hidden = name === "done" || name === "empty";
    document.body.classList.toggle("co-finished", name === "done" || name === "empty");
    window.scrollTo({ top: 0 });
  }
  function route() {
    const want = location.hash.slice(1) || "details";
    if (want === "done" && renderDone()) return show("done");
    const lines = cart.lines();
    if (!lines.length) return show("empty");
    renderSummary(lines);
    if ((want === "review" || want === "pay") && !details) { history.replaceState(null, "", "#details"); return show("details"); }
    if (want === "review") renderReview();
    if (want === "pay") { renderPay(); track("add_payment_info", { lines: cart.items() }); }
    if (want === "details" && !route.began) { route.began = true; track("begin_checkout", { lines: cart.items() }); }
    show(["details", "review", "pay"].includes(want) ? want : "details");
    const first = steps[want] && $("h2, input", steps[want]);
    if (want !== "details" && first) { first.setAttribute("tabindex", "-1"); first.focus({ preventScroll: true }); }
  }
  function go(name) {
    if (location.hash.slice(1) === name) route();
    else if (name === "done") { location.replace("#done"); }
    else location.hash = name;
  }
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => go(b.dataset.goto)));
  window.addEventListener("hashchange", route);
  // Cart or coupon changed: refresh in place, without jumping back to the top.
  document.addEventListener("og:cart", () => {
    const at = location.hash.slice(1) || "details";
    if (at === "done") return;
    const lines = cart.lines();
    if (!lines.length) return route();
    renderSummary(lines);
    if (at === "review" && details) renderReview();
    if (at === "pay" && details) renderPay();
  });
  route();
})();
