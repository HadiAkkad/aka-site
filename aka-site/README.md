# AKA — Standalone Website

This is your AKA site rebuilt as plain HTML, CSS, and a little JavaScript.
No WordPress, no plugins, no monthly fees, no CSS sanitizer stripping things out.
You can open every file in VS Code and edit it freely.

---

## 1. Open it

Double-click `index.html` to view the site in your browser. That's it — no server
or build step needed. To edit, open the whole `aka-site` folder in VS Code
(**File → Open Folder**).

> Tip: install the **Live Server** extension in VS Code, then right-click
> `index.html` → "Open with Live Server" to auto-refresh as you edit.

---

## 2. What's in the folder

```
aka-site/
├── index.html              Home
├── devices.html            Devices
├── categories.html         Category grid (12 cards)
├── diagnostic-devices.html A category page — also the TEMPLATE for new ones
├── supplements.html        Supplements
├── agencies.html           Agencies
├── support.html            Support
├── css/
│   └── style.css           ALL styling (colors, fonts, layout)
├── js/
│   └── components.js       The shared header + footer + menu
├── images/                 Put your own image files here
└── README.md               This file
```

---

## 3. How to make common edits

**Change colors or fonts** — open `css/style.css`, edit the values at the very top
under `:root` (e.g. `--color-accent: #228bc0;`). They update the whole site.

**Change the menu** — open `js/components.js` and edit the `NAV_LINKS` list.
The header and footer live here so you only edit them once for every page.

**Edit page text** — open the relevant `.html` file and change the words between
the tags. The text is plain; you don't need to touch the structure.

**Add a new category page** — copy `diagnostic-devices.html`, rename it
(e.g. `patient-monitoring.html`), edit the heading, intro, image, and lists.
Then in `categories.html` change that card's `href="#"` to your new file name.

---

## 4. Use your own images (recommended)

Right now the pages load images from your old WordPress address so the site looks
complete immediately. Those links will break if the WordPress site is ever deleted,
so it's best to localise them:

1. Save your image files into the `images/` folder.
2. In each `.html` file, replace the long
   `https://hadialakkadd-etapm.wordpress.com/...` image link with
   `images/your-file-name.jpg`.

You only have a handful of real device photos, so several category cards currently
reuse the same images. Drop unique photos into `images/` and update the links when
you have them.

---

## 5. Making the contact form actually send

A static site can't email a form by itself. Free options that work with plain HTML:

- **Formspree** (formspree.io) — sign up, create a form, paste your form's URL into
  the `action="..."` attribute of the `<form>` in `index.html`.
- **Web3Forms** (web3forms.com) — similar, free, no backend needed.

Both take a few minutes and require no server.

---

## 6. Publish it online for free

Pick any one:

- **Netlify** (netlify.com): drag the `aka-site` folder onto the Netlify dashboard.
  Done — you get a live URL in seconds. You can connect your own domain later.
- **Vercel** (vercel.com): import the folder/repo, deploy.
- **GitHub Pages**: push the folder to a GitHub repo, enable Pages in settings.

All three are free for a site like this and let you add a custom domain.

---

## 7. Notes on the rebuild

- The **Supplements**, **Agencies**, and **Support** pages use sensible placeholder
  copy written to match your brand. Replace the text marked *(in italics)* with your
  real product ranges, partners, and service details.
- The **sticky header** and **scrolling partner strip** work here — the WordPress
  free-plan limitation that blocked them no longer applies.
- Everything is responsive (works on phones) and keyboard-accessible.
