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
js/store.js         cart, price helpers, mobile and pincode checks, payment hook
js/app.js           drop panels, slideshows, cart drawer, scroll effects
js/checkout.js      checkout steps, validation, order message
assets/             logo, favicon, flags photo
```

## Making it yours

**Tees, prices and mockups.** Everything about the drop lives in `OG_RELEASES` in `js/data.js`: name, colour, fit, fabric, print, sizes, `price`, `mrp` (shown struck off) and the `mockups` list (first image is the cover). Put mockup images in `assets/drop/`.

## Orders and payment

The site has no server, so an order reaches you on WhatsApp. When a customer places an order, WhatsApp opens with a message that has the order ID, items, total, name, mobile and full address, ready to send to the number in `OG_CONTACT`. The confirmation screen has a "Send order on WhatsApp" button in case the chat didn't open.

**Delivery area.** `OG_STORE.regions` lists the states and the pincode prefixes that belong to them. Checkout rejects any pincode outside these and auto-fills the state. Change `OG_STORE.shipping` to charge for delivery (0 shows "Free").

**Switching on online payment (Razorpay).** In `OG_PAYMENT` in `js/data.js`, set `keyId` to your Razorpay **Key ID** and `enabled: true`. The payment step then shows "Pay online" and opens Razorpay Checkout (UPI, cards, net banking). The order goes through only after the payment succeeds, and the payment ID is added to the WhatsApp message and to Razorpay's payment notes. Never put the Key Secret in this repo. To verify payments on a server (recommended once volume grows), add a small backend that creates Razorpay orders and checks the payment signature.

**Background photo.** The sign-up band uses `assets/gallery/og-flags.jpg`; swap the file to change it.

**Brand colours and fonts.** Change the tokens at the top of `css/styles.css` (`--accent`, `--bg`, `--f-display` and so on).

**Contact details.** The WhatsApp number, email and Instagram handle live in `OG_CONTACT` in `js/data.js`; the visible text is in `index.html`.

**Contact form.** The form opens the visitor's email app with the message filled in, addressed to the email in `OG_CONTACT`.

## Deploy

**Cloudflare (no Git needed).** In the Cloudflare dashboard, upload a zip of `index.html`, `css/`, `js/` and `assets/`. To update, upload a new zip as a new deployment.

**GitHub Pages (set up already).** `.github/workflows/pages.yml` publishes the site on every push to `main`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**. The site appears at `https://<username>.github.io/<repo>/`.

**Vercel or Netlify.** Import the repo, choose "Other" / no framework, leave the build command empty and set the output directory to the repo root.
