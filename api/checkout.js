/* Server-side checkout check, run on Vercel (theogs.vercel.app/api/checkout).
   The browser can be edited by anyone, so this is where prices and coupons are
   decided:
   - Prices come from js/data.js as deployed, never from the browser.
   - Coupon codes live only in the Vercel environment variable COUPONS
     ("CODE:100,OTHER:50"), never in this repo or in the page.
   - Every order is emailed to the owner from here, with the total worked out
     here, so the email is the number to trust when checking a UPI payment.

   POST { action: "quote", lines: [{ id, size, qty }], coupon }
     -> { ok, totals, couponError }
   POST { action: "place", order: { id, lines, coupon, customer, address, payment } }
     -> { ok, totals } */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ALLOWED_ORIGINS = [
  "https://jashwanthchowhan0009-source.github.io",
  "https://theogs.vercel.app"
];
const OWNER_EMAIL = process.env.ORDER_EMAIL || "theogs1807@gmail.com";

// Load the shop data the site itself uses.
function loadShop() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "js", "data.js"), "utf8"), sandbox);
  return sandbox.window;
}
const SHOP = loadShop();

function coupons() {
  const out = {};
  String(process.env.COUPONS || "").split(",").forEach((pair) => {
    const [code, off] = pair.split(":").map((s) => (s || "").trim());
    if (code && Number(off) > 0) out[code.toUpperCase()] = Math.floor(Number(off));
  });
  return out;
}

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const clip = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

function price(rawLines, rawCode) {
  if (!Array.isArray(rawLines) || !rawLines.length || rawLines.length > 10) throw new Error("Your cart looks empty.");
  const store = SHOP.OG_STORE;
  const lines = rawLines.map((l) => {
    const p = SHOP.OG_RELEASES.find((r) => r.id === l.id);
    const qty = Number(l.qty);
    if (!p || p.soldOut || !p.sizes.includes(l.size) || !Number.isInteger(qty) || qty < 1 || qty > store.maxQty) {
      throw new Error("Something in your cart is no longer available. Refresh the page and try again.");
    }
    return { id: p.id, name: p.name, color: p.color, size: l.size, qty, price: p.price, total: p.price * qty, mrpTotal: (p.mrp || p.price) * qty };
  });
  const subtotal = lines.reduce((n, l) => n + l.total, 0);
  const mrp = lines.reduce((n, l) => n + l.mrpTotal, 0);
  const code = clip(rawCode, 30).toUpperCase();
  const off = code ? coupons()[code] : 0;
  const discount = off ? Math.min(off, subtotal) : 0;
  const shipping = store.shipping || 0;
  return {
    lines,
    couponError: code && !off ? "That code isn't valid. Check the spelling and try again." : "",
    totals: {
      count: lines.reduce((n, l) => n + l.qty, 0), subtotal, mrp, savings: mrp - subtotal,
      coupon: off ? code : "", discount, shipping, total: subtotal - discount + shipping
    }
  };
}

async function emailOwner(order, priced) {
  const t = priced.totals;
  const c = order.customer || {};
  const a = order.address || {};
  const pay = order.payment || {};
  const res = await fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Referer: "https://theogs.vercel.app/checkout.html", Origin: "https://theogs.vercel.app" },
    body: JSON.stringify({
      _subject: `New order ${clip(order.id, 20)} · ${inr(t.total)}`,
      _template: "box",
      _captcha: "false",
      "Order": clip(order.id, 20),
      "Amount to receive (checked by the server)": inr(t.total),
      "Payment": clip(`${pay.status || ""}${pay.ref ? ` (${pay.ref})` : ""}`, 120),
      "Items": priced.lines.map((l) => `${l.name} (${l.color}) size ${l.size} x${l.qty} = ${inr(l.total)}`).join("; "),
      "Coupon": t.coupon ? `${t.coupon} −${inr(t.discount)}` : "None",
      "Name": clip(c.name, 60),
      "Mobile": "+91 " + clip(c.mobile, 10),
      "Email": clip(c.email, 80),
      "Address": clip(`${a.house}, ${a.area}${a.landmark ? `, near ${a.landmark}` : ""}, ${a.city}, ${a.state} ${a.pincode} (${a.type})`, 400)
    })
  });
  return res.ok;
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== "object") return res.status(400).json({ ok: false, error: "Bad request." });

  try {
    if (body.action === "quote") {
      const priced = price(body.lines, body.coupon);
      // Slow down anyone guessing codes.
      if (priced.couponError) await new Promise((r) => setTimeout(r, 800));
      return res.status(200).json({ ok: true, totals: priced.totals, couponError: priced.couponError });
    }
    if (body.action === "place") {
      const order = body.order || {};
      if (!/^OG-\d{6}-[A-Z0-9]{4}$/.test(String(order.id || ""))) return res.status(400).json({ ok: false, error: "Bad order ID." });
      if (!/^[6-9]\d{9}$/.test(String((order.customer || {}).mobile || ""))) return res.status(400).json({ ok: false, error: "Bad mobile number." });
      const priced = price(order.lines, order.coupon);
      let emailed = false;
      try { emailed = await emailOwner(order, priced); } catch (e) { emailed = false; }
      return res.status(200).json({ ok: true, totals: priced.totals, emailed });
    }
    return res.status(400).json({ ok: false, error: "Unknown action." });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
};
