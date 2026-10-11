# theOG's

Storefront website for **theOG's**, a streetwear label. Plain HTML, CSS and JavaScript: no build step, no dependencies.

## What's on the site

- **Hero** with expanded display type and a parallax garment stage
- **Shop** with category filters, search, sorting and a "Saved" (wishlist) view
- **Quick view** with colour swatches, size picker (sold-out sizes disabled), size guide in cm and quantity
- **Bag drawer** with quantity steppers, subtotal and a free-shipping progress bar (₹1,999 threshold)
- **Lookbook** rail you can drag, swipe, arrow-key or button through
- **About**, **process** and **contact** sections, plus a newsletter sign-up with validation
- Light and dark themes (follows the system, with a toggle), mobile menu, reduced-motion support
- Bag, saved items and theme are remembered in the browser (`localStorage`)

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
js/data.js          products, lookbook, size guide, free-shipping threshold
js/garments.js      placeholder garment illustrations (SVG)
js/app.js           shop, quick view, bag, lookbook, forms
assets/favicon.svg
```

## Making it yours

**Products.** Edit `js/data.js`. Each product has a name, SKU, price (INR), colours, sizes and `soldOut` sizes.

**Real photos.** Product images are placeholder illustrations. Drop photos into `assets/products/` and add `image: "assets/products/box-tee.jpg"` to a product; the photo then replaces the illustration everywhere.

**Brand colours and fonts.** Change the tokens at the top of `css/styles.css` (`--accent`, `--bg`, `--f-display` and so on).

**Contact details.** The email, WhatsApp number, address and Instagram handle in `index.html` are placeholders.

**Forms.** The contact and newsletter forms validate in the browser but don't send anywhere yet. Point them at a form service such as Formspree, Web3Forms or Mailchimp.

**Checkout.** The Checkout button shows a notice. To take real orders, connect Shopify (Buy Button), Razorpay or Snipcart.

## Deploy

**GitHub Pages (set up already).** `.github/workflows/pages.yml` publishes the site on every push to `main`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**. The site appears at `https://<username>.github.io/<repo>/`.

**Vercel or Netlify.** Import the repo, choose "Other" / no framework, leave the build command empty and set the output directory to the repo root.
