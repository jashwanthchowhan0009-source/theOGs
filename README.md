# theOG's

Website for **theOG's**, a streetwear label from Navi Mumbai. Plain HTML, CSS and JavaScript: no build step, no dependencies.

## What's on the site

- **Hero** with the green theOG's logo and the two Doomsday tees
- **The Doomsday drop**: one panel per tee with a mockup slideshow (arrows, thumbnails, swipe), offer price with the MRP struck off, specs, a size picker and an "Order on WhatsApp" button that sends the tee, colour, size and price
- **About**, **process** and **contact** sections, and a sign-up band over the hand-painted OG flags photo
- The "OG" in the header wordmark shifts from blue to green as you scroll
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
js/app.js           drop panels, slideshows, WhatsApp orders, scroll effects
assets/             logo, favicon, flags photo
```

## Making it yours

**Tees, prices and mockups.** Everything about the drop lives in `OG_RELEASES` in `js/data.js`: name, colour, fit, fabric, print, sizes, `price`, `mrp` (shown struck off) and the `mockups` list (first image is the cover). Put mockup images in `assets/drop/`.

**Background photo.** The sign-up band uses `assets/gallery/og-flags.jpg`; swap the file to change it.

**Brand colours and fonts.** Change the tokens at the top of `css/styles.css` (`--accent`, `--bg`, `--f-display` and so on).

**Contact details.** The WhatsApp number, email and Instagram handle live in `OG_CONTACT` in `js/data.js`; the visible text is in `index.html`.

**Contact form.** The form opens the visitor's email app with the message filled in, addressed to the email in `OG_CONTACT`.

## Deploy

**Cloudflare (no Git needed).** In the Cloudflare dashboard, upload a zip of `index.html`, `css/`, `js/` and `assets/`. To update, upload a new zip as a new deployment.

**GitHub Pages (set up already).** `.github/workflows/pages.yml` publishes the site on every push to `main`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**. The site appears at `https://<username>.github.io/<repo>/`.

**Vercel or Netlify.** Import the repo, choose "Other" / no framework, leave the build command empty and set the output directory to the repo root.
