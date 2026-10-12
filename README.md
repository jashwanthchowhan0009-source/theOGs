# theOG's

Website for **theOG's**, a streetwear label from Navi Mumbai. Plain HTML, CSS and JavaScript: no build step, no dependencies.

## What's on the site

- **Hero** with the red velvet logo and the two Drop 01 tees floating over it
- **Drop 01** showcase: two large panels, one per t-shirt, with a pointer spotlight, a "Mockup coming soon" slot and a WhatsApp "Notify me" button
- **Gallery** of brand stills with a full-screen viewer (swipe, arrow keys) and an Instagram tile
- **About**, **process** and **contact** sections
- The "OG" in the header wordmark shifts from blue to red velvet as you scroll
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
js/data.js          Drop 01 tees, gallery photos, contact details
js/garments.js      placeholder tee illustrations (SVG)
js/app.js           drop panels, gallery viewer, scroll effects, forms
assets/             logo, favicon, gallery photos
```

## Making it yours

**Drop 01 mockups.** Put the images in `assets/drop/` and set `mockup: "assets/drop/tee-01.jpg"` on each tee in `js/data.js`. You can also set `name`, `line` and `price` there. Until a mockup is set, an illustrated tee is shown.

**Gallery photos.** Put photos in `assets/gallery/` and add a line for each to `OG_GALLERY` in `js/data.js` (`src`, `w`, `h`, `caption`). Resize large photos to about 1600 px on the long side first.

**Brand colours and fonts.** Change the tokens at the top of `css/styles.css` (`--accent`, `--bg`, `--f-display` and so on).

**Contact details.** The WhatsApp number, email and Instagram handle live in `OG_CONTACT` in `js/data.js`; the visible text is in `index.html`.

**Contact form.** The form opens the visitor's email app with the message filled in, addressed to the email in `OG_CONTACT`.

## Deploy

**Cloudflare (no Git needed).** In the Cloudflare dashboard, upload a zip of `index.html`, `css/`, `js/` and `assets/`. To update, upload a new zip as a new deployment.

**GitHub Pages (set up already).** `.github/workflows/pages.yml` publishes the site on every push to `main`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**. The site appears at `https://<username>.github.io/<repo>/`.

**Vercel or Netlify.** Import the repo, choose "Other" / no framework, leave the build command empty and set the output directory to the repo root.
