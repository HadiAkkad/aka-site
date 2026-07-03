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
11b. [The content manager (upload lectures, documents & devices)](#11b-the-content-manager--upload-lectures-documents--devices)
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
│   ├── devices.html           Product catalog (search + category filters, #catalog)
│   ├── partners.html          NGOs + "Our partners" manufacturer section
│   ├── support.html           "Services" page (file name kept as support.html)
│   ├── careers.html           Careers — application form + CV upload
│   ├── lectures.html          Video library (posts from the content manager)
│   ├── documentation.html     PDF library (posts from the content manager)
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
   content page).
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

## 7. Product categories

There are **no per-category pages** any more (they were deleted — you didn't want to
navigate to them). The catalog on `devices.html` is a single, searchable grid, and the
**category filter buttons above it are generated automatically** from whatever devices
are published in the content manager. Publish a device in a category and its filter
button appears; remove the last device in a category and the button disappears.

- **The list of allowed category slugs** lives in two places, kept in sync:
  `PRODUCT_CATS` in `api/src/index.js` (the dropdown in the admin panel) and
  `QUOTE_CATEGORIES` in `js/components.js` (the quote modal).
- **Category display names / translations** are the `cat.<slug>` keys in `js/i18n.js`
  (EN + AR).
- **To add a brand-new category slug:** add it to `PRODUCT_CATS` (redeploy the Worker),
  to `QUOTE_CATEGORIES`, and add a `cat.<slug>` label to `i18n.js` — then it's selectable
  when publishing a device.
- Deep link to a filtered catalog with `devices.html?cat=<slug>#catalog`.

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
| `GET  /admin/content` | Password-protected **content manager** — upload lectures, documents & devices |
| `GET  /content?type=…` | Public JSON feed the pages read (`lectures` / `documents` / `products`) |
| `GET  /media?key=content/…` | Public serving of an uploaded file (video/PDF/image) |

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

## 11b. The content manager — upload lectures, documents & devices

This is the system for publishing content that appears as **posts** on the site.
Everything the company uploads here shows up instantly on the matching page — **no
code editing, no redeploy.**

- **Lectures** → appear on `lectures.html`
- **Documents (PDFs)** → appear on `documentation.html`
- **Devices** → appear on `devices.html` (the product catalog + home card stack)
- **Projects** → the hospitals timeline on `projects.html` (English + Arabic fields)
- **Partners** → `partners.html` — type `manufacturer` fills the "Our partners"
  grid, type `ngo` fills the NGO slideshow (English + Arabic descriptions)

Every published item has an **Edit** button (prefills the form — change anything,
file fields are optional and only replace the old file if you pick a new one) and
a **Delete** button.

### How it works (in plain terms)
You log into one password-protected page and fill in a short form (title, category, etc.)
and either paste a link or upload a file. The file is stored in Cloudflare **R2** (storage),
the info is saved in **D1** (database), and the public pages read it automatically.
It's built to handle **hundreds** of items.

### Step-by-step: open the content manager
1. Open **https://aka-api.hadi-alakkadd.workers.dev/admin/content**
2. The browser asks for a username and password:
   - **Username:** anything (e.g. `admin`)
   - **Password:** the admin password (see *Credentials*, section 12 — same one as `/admin`)
3. You'll see three tabs: **Lectures**, **Documents**, **Devices**. Click a tab to switch.

### Tutorial 1 — upload a lecture video
1. Click the **Lectures** tab.
2. Fill in **Title** (required) and pick a **Category** (Presentation / Tutorial / Webinar).
3. Optionally add **Speaker**, **Date** (e.g. "March 2026"), and **Duration** (e.g. "12:45").
4. Choose the **Video source**:
   - **YouTube link** *(recommended for long videos)* — upload the video to the company's
     YouTube channel first (it can be *Unlisted* if you don't want it public on YouTube),
     then paste the link (e.g. `https://youtube.com/watch?v=...`). The thumbnail is
     pulled in automatically.
   - **Upload video file** — pick an `.mp4` from your computer. Best for short clips;
     for long lectures use a YouTube link (files over ~100 MB can fail to upload).
     Add a **Cover image** so the card looks good.
5. Tick **"Feature this at the top of the page"** if you want it highlighted (optional).
6. Click **Publish lecture**. Open `lectures.html` — it's there.

### Tutorial 2 — upload a document (PDF)
1. Click the **Documents** tab.
2. Fill in **Title** and pick a **Category** (Profile / Certification / Manual / Catalog).
3. Optionally add **Language** (e.g. "EN / AR"), a **Description**, and a **Size label**.
4. Click **Choose file** next to **PDF file** and select the PDF.
5. Click **Publish document**. It appears on `documentation.html` with **View** and
   **Download** buttons.

### Tutorial 3 — add a device to the catalog
1. Click the **Devices** tab.
2. Fill in **Model name**, **Brand / manufacturer**, and pick a **Category**.
3. Click **Choose file** next to **Product image** and select the photo.
4. Click **Publish device**. It appears in the catalog on `devices.html`.

### Tutorial 4 — add a project (hospital) or partner
- **Projects tab:** name + year are required; location, beds, departments, and key
  equipment are optional. Each text field has an **Arabic twin** — fill it so the
  Arabic site shows proper Arabic (if left empty, the English text is shown).
- **Partners tab:** pick the type (`manufacturer` → partners grid, `ngo` → NGO
  slideshow), add the description in both languages, the website, and upload a logo.

### Editing & deleting
Every tab lists what's published. **Edit** prefills the form with the item's data —
change what you need and press *Save changes*. While editing, file fields are
optional: leave them empty to keep the current file, or pick a new one to replace it
(the old file is cleaned up automatically). **Delete** removes the item and its
uploaded files.

### Tips
- **Uploads are live immediately.** No `git push`, no waiting.
- **Videos:** prefer YouTube links for anything long — faster for viewers and no upload limit.
- **Privacy:** uploaded files are served from `/media?key=content/…` and are publicly
  viewable (that's the point — the site shows them). Don't upload anything confidential.
  CVs from the careers form are kept in a separate, private area and are **never** exposed here.

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
| Add a device / category | Publish it in the **/admin/content** Devices tab (new slugs: see section 7) |
| Swap the logo | Replace `images/aka-logo.svg`, bump `?v=` |
| Read job applications / CVs | Open the **/admin** page (section 11) |
| Upload a lecture / PDF / device | Open the **/admin/content** page (section 11b) |
| Add / edit a project or partner | **/admin/content** → Projects / Partners tab (section 11b) |
| Edit form behaviour | `js/forms.js` (frontend) / `api/src/index.js` (backend) |
| Deploy the site | `git push origin master` (or manual Wrangler) |
| Deploy the backend | `cd api && npx wrangler@3 deploy` |
| Change admin password | `wrangler@3 secret put ADMIN_PASSWORD` (section 10) |

---

Built as a plain, dependency-light site so it stays easy to edit and cheap to run.

## When the custom domain is purchased (checklist)

1. **Site URLs** — search-and-replace `https://aka1.hadi-alakkadd.workers.dev` with the new domain in:
   - every `*.html` file (canonical + `og:url` + `og:image` + `twitter:image` + JSON-LD in `index.html`)
   - `sitemap.xml` and `robots.txt`
2. **API CORS** — add `https://<domain>` and `https://www.<domain>` to `ALLOWED_ORIGINS` in `api/src/index.js`, then redeploy the Worker.
3. **Professional email** — set up `info@<domain>` (Cloudflare Email Routing is free) and replace `hadi.alakkadd@gmail.com` in the footer (`js/components.js`), `about.html`, `careers.html`, and the JSON-LD in `index.html`.
4. **Form notifications** — create a free https://resend.com account, verify the domain, then:
   ```
   cd api
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put NOTIFY_EMAIL
   ```
   Also change the `from:` address in `api/src/index.js` from `onboarding@resend.dev` to `no-reply@<domain>`.
5. **Search Console** — add the domain to Google Search Console and submit `sitemap.xml`.
6. **Analytics** — add Plausible or GA4 snippet to every page (or inject it from `js/components.js`).

## Still to do (needs real content)

- **Lectures & documents** — publish the real videos and PDFs via **/admin/content**.
- **Certifications page** — collect CE/ISO certificates and manufacturer authorization letters (can be published as Documents → `certification`).
- **Testimonials & case studies** — get quotes and photos from delivered hospital projects.
- **Team section** — names, roles, and photos of key people for the About page.
- **Verify project data** — confirm the bed counts / departments / equipment in the Projects tab of /admin/content are accurate (edit them there).
