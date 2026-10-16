# theOG's

Website for **theOG's**, a streetwear label from Navi Mumbai. Plain HTML, CSS and JavaScript: no build step, no dependencies.

## What's on the site

- **Hero** with the green theOG's logo and the two Doomsday tees
- **The Doomsday drop**: one panel per tee with a mockup slideshow (arrows, thumbnails, swipe), offer price with the MRP struck off, specs, a size picker, **Add to cart** and **Buy now** (plus an "Or order on WhatsApp" link)
- **Cart**: a slide-in drawer with quantities, Dussehra savings and the total. It's saved in the visitor's browser.
- **Checkout** (`checkout.html`): contact details, a South-India-only delivery address, review, payment, then an order confirmation
- **About**, **process** and **contact** sections, and a sign-up band over the hand-painted OG flags photo
- The "OG" in the wordmark is always red, the brand's signature colour
- Light and dark themes (follows the system, with a toggle), mobile menu, reduced-motion support

## Run it locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Opening `index.html` directly also works.

## Project layout

```
index.html          page markup
css/styles.css      all styles; colour and font tokens at the top
js/data.js          the drop's tees and prices, contact details
checkout.html       checkout page
js/data.js          also: OG_STORE (delivery states, pincodes, shipping) and OG_PAYMENT
js/vendor/qrcode.js QR code drawing for the UPI payment step
js/store.js         cart, price helpers, mobile and pincode checks, payment hook
js/app.js           drop panels, slideshows, cart drawer, scroll effects
js/checkout.js      checkout steps, validation, order message
assets/             logo, favicon, flags photo
```

## Making it yours

**Tees, prices and mockups.** Everything about the drop lives in `OG_RELEASES` in `js/data.js`: name, colour, fit, fabric, print, sizes, `price`, `mrp` (shown struck off) and the `mockups` list (first image is the cover). Put mockup images in `assets/drop/`.

## Orders and payment

The site has no server, so an order reaches you on WhatsApp. When a customer places an order, WhatsApp opens with a message that has the order ID, items, total, name, mobile and full address, ready to send to the number in `OG_CONTACT`. The confirmation screen has a "Send order on WhatsApp" button in case the chat didn't open.

**Coupons.** `OG_STORE.coupons` maps each code to the rupees it takes off the whole order (`{ "OG100": 100 }`). Codes aren't case-sensitive, and each order can use one. The product cards say "Have a coupon? Get ₹100 more off at checkout" without showing the code, and the checkout summary has the box to enter it. The coupon line is included in the WhatsApp order message. Set `coupons: {}` to hide all of it.

**Delivery area.** `OG_STORE.regions` lists the states and the pincode prefixes that belong to them. Checkout rejects any pincode outside these and auto-fills the state. Change `OG_STORE.shipping` to charge for delivery (0 shows "Free").

**Pay by UPI QR (on now).** `OG_PAYMENT.upi.id` in `js/data.js` holds the UPI ID. The payment step draws a QR (and, on phones, a "Pay with UPI app" button) for the exact total, with the order ID in the payment note. The customer pays, types the 12-digit UTR, and places the order; the WhatsApp message and the email copy say "UPI paid, please verify (UTR …)". Check that UTR in your UPI app before shipping. Clear `id` to hide the option. The QR is drawn by `js/vendor/qrcode.js` (MIT, Kazuhiko Arase).

**Server checks (security).** `api/checkout.js` runs on Vercel at `theogs.vercel.app/api/checkout`; the GitHub Pages copy calls it there. It works out every price from `js/data.js`, checks coupon codes, and emails each order to the owner (FormSubmit, from the server) with the total it worked out. The payment step's QR amount comes from it too, so editing the page or browser storage cannot lower the price.
- Coupon codes live only in the Vercel environment variable `COUPONS`, as `CODE:100` (several: `CODE:100,OTHER:50`). Never put a code in this repo: it is public. Change codes in Vercel, then redeploy.
- `ORDER_EMAIL` (optional) changes where order emails go; default theogs1807@gmail.com. The first email needs a one-time "Activate form" click.
- Orders need a Google Maps location (GPS button or a pasted Maps link); it goes in the email, the WhatsApp message and the review step.
- Order to the owner's WhatsApp automatically: get a free CallMeBot API key (from your WhatsApp, message the number on callmebot.com with "I allow callmebot to send me messages"), then set Vercel env vars `CALLMEBOT_APIKEY` and, if not 918897004533, `WHATSAPP_PHONE` (with 91). Redeploy. CallMeBot sees the order text.
- Still check by hand: a UTR can be made up, so ship only when PhonePe shows that UTR with the same amount as the order email.

**Switching on online payment (Razorpay).** In `OG_PAYMENT` in `js/data.js`, set `keyId` to your Razorpay **Key ID** and `enabled: true`. The payment step then shows "Pay online" and opens Razorpay Checkout (UPI, cards, net banking). The order goes through only after the payment succeeds, and the payment ID is added to the WhatsApp message and to Razorpay's payment notes. Never put the Key Secret in this repo. To verify payments on a server (recommended once volume grows), add a small backend that creates Razorpay orders and checks the payment signature.

## Visitor and sales tracking

The site sends visits and shop events to **Google Analytics 4** once a Measurement ID is set. To switch it on:
1. Go to analytics.google.com and create a property for theOG's.
2. Add a **Web** data stream for the site's address.
3. Copy the Measurement ID, which looks like `G-XXXXXXXXXX`.
4. Paste it into `OG_ANALYTICS.ga4` in `js/data.js`.

These events are tracked:
- add_to_cart, view_cart and remove_from_cart
- begin_checkout
- add_shipping_info, sent with the state only
- add_payment_info
- purchase, sent with the order ID, value and items
- whatsapp_click

Names, phone numbers and addresses are never sent. Purchases show up under Reports → Monetization.

**Background photo.** The sign-up band uses `assets/gallery/og-flags.jpg`; swap the file to change it.

**Brand colours and fonts.** Change the tokens at the top of `css/styles.css` (`--accent`, `--bg`, `--f-display` and so on).

**Contact details.** The WhatsApp number, email and Instagram handle live in `OG_CONTACT` in `js/data.js`; the visible text is in `index.html`.

**Contact form.** The form opens the visitor's email app with the message filled in, addressed to the email in `OG_CONTACT`.

## Deploy

**Cloudflare (no Git needed).** In the Cloudflare dashboard, upload a zip of `index.html`, `css/`, `js/` and `assets/`. To update, upload a new zip as a new deployment.

**GitHub Pages (set up already).** `.github/workflows/pages.yml` publishes the site on every push to `main`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**. The site appears at `https://<username>.github.io/<repo>/`.

**Vercel (set up already).** The project imports this repo; `vercel.json` runs `scripts/stamp.sh` and serves the repo root. Every push to `main` redeploys.
