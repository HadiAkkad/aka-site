# AKA — Al-Akkad Group · Website + Backend

Bilingual (English / Arabic) static website for **AKA (Al-Akkad) Group**, a medical-
equipment agency in Damascus, Syria, plus a small Cloudflare backend that powers the
contact and careers forms.

- **Live site:** https://aka1.hadi-alakkadd.workers.dev
- **Backend API:** https://aka-api.hadi-alakkadd.workers.dev
- **GitHub repo:** https://github.com/HadiAkkad/aka-site

---

## ⚠️ SECURITY — READ FIRST

This repository is **PUBLIC** on GitHub. Anything written in these files (including the
admin password below) is visible to anyone on the internet.

**Before relying on this in production, do ONE of these:**
1. Make the GitHub repo **private** (GitHub → repo → Settings → General → Change visibility), **or**
2. Remove the credentials from this README and keep them somewhere private.

If the admin password is ever exposed, change it (see *Backend → Change the admin password*).

---

## Table of contents
1. [Project structure](#1-project-structure)
2. [Run it locally](#2-run-it-locally)
3. [Editing text (bilingual EN/AR)](#3-editing-text-bilingual-enar)
4. [Editing colors, fonts, layout](#4-editing-colors-fonts-layout)
5. [The shared header, footer & menu](#5-the-shared-header-footer--menu)
6. [Adding a new page](#6-adding-a-new-page)
7. [Adding / editing a product category](#7-adding--editing-a-product-category)
8. [Images & the logo](#8-images--the-logo)
9. [Partner brands (Partners page)](#9-partner-brands-partners-page)
10. [The backend (Cloudflare)](#10-the-backend-cloudflare)
11. [The admin page (view applications & CVs)](#11-the-admin-page)
12. [Credentials & resource IDs](#12-credentials--resource-ids)
13. [Deployment](#13-deployment)
14. [Cache busting (`?v=`)](#14-cache-busting-v)
15. [Common tasks cheat-sheet](#15-common-tasks-cheat-sheet)

---

## 1. Project structure

```
aka-site/                      ← repo root (GitHub: HadiAkkad/aka-site)
├── aka-site/                  ← THE WEBSITE (served by the "aka1" Worker)
│   ├── index.html             Home (full-bleed hero)
│   ├── about.html             About (story, specialties, location, contact)
│   ├── devices.html           Devices overview
│   ├── partners.html          NGOs + "Our partners" manufacturer section
│   ├── support.html           "Services" page (file name kept as support.html)
│   ├── careers.html           Careers — application form + CV upload
│   ├── categories.html        Category grid
│   ├── diagnostic-devices.html  A category page (also the TEMPLATE)
│   ├── patient-monitoring.html  ┐
│   ├── cardiology.html          │ one page per category
│   ├── medical-imaging.html     │ (Imaging & Ultrasound)
│   ├── surgical-equipment.html  │
│   ├── laboratory-equipment.html│
│   ├── endoscopy.html           │
│   ├── sterilization.html       │
│   ├── hospital-equipment.html  ┘
│   ├── css/style.css          ALL styling (one file, sectioned & commented)
│   ├── js/
│   │   ├── i18n.js            ALL text in English + Arabic (the dictionary)
│   │   ├── components.js      Shared header + footer + nav + partner strip
│   │   └── forms.js           Sends the contact/careers forms to the backend
│   └── images/
│       ├── aka-logo.svg       The AKA logo (header + favicon)
│       └── partners/          Partner brand logos
│
├── api/                       ← THE BACKEND (the "aka-api" Worker)
│   ├── src/index.js           Worker code (handles forms + admin)
│   ├── schema.sql             Database tables
│   └── wrangler.jsonc         Worker config + R2/D1 bindings
│
└── README.md                  This file
```

> The website lives in the **`aka-site/` subfolder**, not the repo root.

---

## 2. Run it locally

The site is plain HTML/CSS/JS — no build step.

- **Quickest:** double-click `aka-site/index.html`.
- **With a local server** (recommended, needed for the forms to talk to the backend):
  ```bash
  cd aka-site
  npx serve -l 8000 .
  ```
  Then open http://localhost:8000 . (`http://localhost:8000` is already allow-listed
  by the backend, so the forms work locally.)

---

## 3. Editing text (bilingual EN/AR)

**All visible text lives in `aka-site/js/i18n.js`** as a dictionary with an English
(`en`) and Arabic (`ar`) version of every string, keyed by a short name.

In the HTML, an element shows translated text via `data-i18n="some.key"`:
```html
<h1 data-i18n="home.hero.h1">AKA — Your Medical Technology Partner</h1>
```
The text between the tags is just a fallback; the real text comes from `i18n.js`.

**To change wording:** open `js/i18n.js`, find the key, and edit BOTH the English and
the Arabic value. Example:
```js
en: { "home.hero.cta": "Browse our devices", ... }
ar: { "home.hero.cta": "تصفّح أجهزتنا", ... }
```

**To add a new piece of translatable text:**
1. Add `data-i18n="my.key"` to the HTML element.
2. Add `"my.key": "English text",` to the `en` block **and**
   `"my.key": "النص العربي",` to the `ar` block.

> Rule: every key must exist in **both** `en` and `ar`. The language toggle (top-right,
> "العربية / EN") flips the whole site and remembers the choice. Arabic also switches
> the page to right-to-left automatically.

---

## 4. Editing colors, fonts, layout

Open `aka-site/css/style.css`. It is one file, split into numbered, commented
sections. The most useful is **section 1 (Design tokens)** at the top:

```css
:root {
  --color-accent: #228bc0;   /* AKA blue — change once, updates everywhere */
  --color-ink:    #0f1111;    /* main text */
  --font-display: "Fjalla One", ...;  /* headings */
  --font-body:    "Roboto", ...;      /* body text */
}
```

Other sections to know: 6 = Hero, 5 = Header, 9 = Footer, 11 = Animations,
13 = Arabic/RTL, 14 = Background mosaic pattern, 15 = Home hero.

---

## 5. The shared header, footer & menu

The header and footer are injected on every page by `aka-site/js/components.js`
(so you edit them once).

- **Menu items** — edit the `NAV_LINKS` array:
  ```js
  const NAV_LINKS = [
    { key: "nav.devices",   href: "devices.html" },
    { key: "nav.partners",  href: "partners.html" },
    { key: "nav.about",     href: "about.html" },
    { key: "nav.support",   href: "support.html" },   // labelled "Services"
    { key: "nav.careers",   href: "careers.html" },
  ];
  ```
  Each `key` points to a label in `i18n.js`. To add a menu item, add a line here and
  add `nav.<name>` to both languages in `i18n.js`.
- **Footer scrolling brand strip** — edit the `PARTNERS` array (just brand names).
- **Footer links / contact** — edit the `buildFooter()` function.

---

## 6. Adding a new page

1. **Copy an existing page** that's closest to what you want (e.g. `about.html` for a
   content page, or `diagnostic-devices.html` for a category page).
2. Rename it, e.g. `news.html`.
3. Set `data-page="news.html"` on the `<body>` (used to highlight the nav).
4. Replace the content; use `data-i18n` keys for any text and add those keys to
   `i18n.js` (both languages).
5. Keep the three script tags at the bottom:
   ```html
   <script src="js/i18n.js?v=2"></script>
   <script src="js/components.js?v=4"></script>
   ```
   (Add `js/forms.js?v=1` too **only** if the page has a form.)
6. Keep the favicon line in `<head>`:
   ```html
   <link rel="icon" href="images/aka-logo.svg?v=4" type="image/svg+xml" />
   ```
7. If it should appear in the menu, add it to `NAV_LINKS` (step 5 above).

---

## 7. Adding / editing a product category

Categories are listed on `categories.html` (a grid of image cards), and each has its
own page. `diagnostic-devices.html` is the **template**.

**To edit a category's text:** change its keys in `i18n.js` (e.g. `mon.lead`,
`card.cardiology`, etc.).

**To add a new category:**
1. Copy `diagnostic-devices.html` → `my-category.html`.
2. Change the hero image, the `data-i18n` keys, and the "What we offer" items.
3. Add the new keys to `i18n.js` (EN + AR).
4. In `categories.html`, add a card:
   ```html
   <a class="card" href="my-category.html">
     <img src="images/..." alt="My Category" />
     <span class="card__label" data-i18n="cat.mycategory">My Category</span>
   </a>
   ```
5. Add `cat.mycategory` to `i18n.js` (EN + AR).

---

## 8. Images & the logo

- Put image files in `aka-site/images/`.
- **Logo:** `images/aka-logo.svg` is used for both the header and the favicon. It is
  rendered white on the dark header via CSS (`.site-logo`). If you replace it, bump the
  `?v=` number on the logo references (see *Cache busting*).
- Many photos currently load from Unsplash URLs (free for commercial use). To make the
  site fully self-hosted, download them into `images/` and update the `src` links.

---

## 9. Partner brands (Partners page)

The "Our partners" section is on `partners.html`, below the NGO slideshow. Each partner is a card with a
logo/photo, a description (`data-i18n="partner.<name>.desc"`), and a "Visit website"
link.

- Partner **logos** live in `images/partners/` (e.g. `edan.png`, `merivaara.jpg`).
- A logo shown on a white tile uses `class="partner__logo"` on the `<img>`.
- The footer **scrolling strip** brand names are the `PARTNERS` array in `components.js`.

Confirmed partners: EDAN, NEUROWERK, CUSTO MED, EMS, MERIVAARA, NEUSOFT, HERMANN
Medizintechnik, EMOS technology, IMO.

---

## 10. The backend (Cloudflare)

The contact and careers forms are handled by a Cloudflare **Worker** named **`aka-api`**.
It stores data in **D1** (a database) and uploaded CVs in **R2** (file storage). No
third-party form service is used.

**Endpoints** (base: `https://aka-api.hadi-alakkadd.workers.dev`):

| Method & path | Purpose |
|---|---|
| `POST /contact` | Save a contact message (name, email, message) |
| `POST /apply`   | Save a job application + upload the CV to R2 |
| `GET  /admin`   | Password-protected list of all submissions |
| `GET  /file?key=…` | Password-protected CV download |

The website forms talk to it through `aka-site/js/forms.js`, which posts the form and
shows an inline "Sending… / Thank you / error" message.

**Where the code is:** `api/src/index.js`. Config + bindings: `api/wrangler.jsonc`.
Database tables: `api/schema.sql`.

### Deploy a backend change
```bash
cd api
CLOUDFLARE_ACCOUNT_ID=<account-id> CLOUDFLARE_API_TOKEN=<token> npx wrangler@3 deploy
```
(Wrangler 3 because the local Node is v20; Wrangler 4 needs Node 22.)

### Change the admin password
Set the `ADMIN_PASSWORD` secret on the Worker:
```bash
cd api
echo "your-new-password" | CLOUDFLARE_ACCOUNT_ID=<id> CLOUDFLARE_API_TOKEN=<token> npx wrangler@3 secret put ADMIN_PASSWORD
```

### Allow the forms from a new (custom) domain
Edit `ALLOWED_ORIGINS` at the top of `api/src/index.js`, add your domain, then redeploy.
```js
const ALLOWED_ORIGINS = [
  "https://aka1.hadi-alakkadd.workers.dev",
  "https://yourdomain.com",   // ← add this
  "http://localhost:8000",
];
```

### Email notifications (not enabled)
The backend currently **stores** submissions (view them via /admin); it does **not**
email you. Sending email needs a custom domain + an email provider (e.g. Resend) or
Cloudflare Email Routing. Ask to add this once a domain is set up.

---

## 11. The admin page

To read job applications and contact messages, and to download CVs:

1. Open **https://aka-api.hadi-alakkadd.workers.dev/admin**
2. The browser asks for a username and password (HTTP Basic Auth):
   - **Username:** anything (e.g. `admin`)
   - **Password:** see *Credentials* below
3. You'll see two tables: **Job applications** (with a CV download link per row) and
   **Contact messages**. Newest first.

---

## 12. Credentials & resource IDs

> ⚠️ **These are secrets. See the SECURITY note at the top — do not leave them in a
> public repo.**

**Admin page login**
- URL: `https://aka-api.hadi-alakkadd.workers.dev/admin`
- Username: `admin` (any value works)
- Password: `z2B6PpdXAkysaUKCwNWb`

**Cloudflare resources**
- Account ID: `fea3dbe17d7ac6b85c8981160fccf01c`
- Site Worker: `aka1` → https://aka1.hadi-alakkadd.workers.dev
- API Worker: `aka-api` → https://aka-api.hadi-alakkadd.workers.dev
- R2 bucket (CVs): `aka-cvs`
- D1 database: `aka-db` (id `86f09d1c-1984-4cf2-9e41-98e26a57abcf`)

**API token**
- Not stored here. Create a scoped one in the Cloudflare dashboard
  (My Profile → API Tokens) with **Workers Scripts: Edit**, **Workers R2 Storage: Edit**,
  **D1: Edit** when you need to deploy/manage the backend. Roll/delete it when done.

---

## 13. Deployment

The site auto-deploys from GitHub: **push to `master` → Cloudflare rebuilds the `aka1`
Worker** (build command `npx wrangler deploy`, production branch `master`).

```bash
git add -A
git commit -m "your message"
git push origin master
```

**If an auto-build fails with "build token … deleted or rolled":** the build token was
invalidated (this happens if you roll the Cloudflare API token). Fix it in the dashboard:
Workers & Pages → `aka1` → Settings → Build → **API token** → edit/regenerate → then
**Retry build**.

**Manual deploy of the site** (bypasses the GitHub build — handy if auto-build is down):
```bash
# from the repo root, with a temporary config pointing at the site folder:
#   { "name": "aka1", "compatibility_date": "2025-01-01", "assets": { "directory": "./aka-site" } }
CLOUDFLARE_ACCOUNT_ID=<id> CLOUDFLARE_API_TOKEN=<token> npx wrangler@3 deploy --config <that-file>
```

---

## 14. Cache busting (`?v=`)

Browsers cache `.js`, `.css`, and images hard. When you change a shared file, bump the
version number in its references so visitors get the new version:

- `js/components.js?v=4` → change to `?v=5` (in every HTML file)
- `images/aka-logo.svg?v=4` → bump when you change the logo
- `js/forms.js?v=1`, `js/i18n.js?v=2` → same idea

(Search-and-replace the old `?v=N` across all `.html` files.)

---

## 15. Common tasks cheat-sheet

| I want to… | Do this |
|---|---|
| Change any text | Edit the key in `js/i18n.js` (English **and** Arabic) |
| Change brand color/font | `css/style.css` → `:root` at the top |
| Change the menu | `js/components.js` → `NAV_LINKS` |
| Change footer brand strip | `js/components.js` → `PARTNERS` |
| Add a page | Copy a page, rename, add nav link + i18n keys |
| Add a category | Copy `diagnostic-devices.html`, add a card in `categories.html` |
| Swap the logo | Replace `images/aka-logo.svg`, bump `?v=` |
| Read job applications / CVs | Open the **/admin** page (section 11) |
| Edit form behaviour | `js/forms.js` (frontend) / `api/src/index.js` (backend) |
| Deploy the site | `git push origin master` (or manual Wrangler) |
| Deploy the backend | `cd api && npx wrangler@3 deploy` |
| Change admin password | `wrangler@3 secret put ADMIN_PASSWORD` (section 10) |

---

Built as a plain, dependency-light site so it stays easy to edit and cheap to run.
