/* =========================================================================
   AKA — Backend API (Cloudflare Worker)
   -------------------------------------------------------------------------
   Handles the website's two forms with no third-party services:
     POST /apply    -> careers application (+ CV file)  -> R2 + D1
     POST /contact  -> contact message                  -> D1
     GET  /admin    -> password-protected list of submissions
     GET  /file?key=...  -> password-protected CV download from R2

   Bindings (see wrangler.jsonc):
     env.CVS  -> R2 bucket (CV files)
     env.DB   -> D1 database (records)
     env.ADMIN_PASSWORD -> secret (Basic-Auth password for /admin)
   ========================================================================= */

const ALLOWED_ORIGINS = [
  "https://aka1.hadi-alakkadd.workers.dev",
  "https://hadiakkad.github.io",
  // TODO: add the final custom domain here when it is purchased,
  // e.g. "https://aka-group.com" and "https://www.aka-group.com"
  "http://localhost:8000",
  "http://localhost:8123",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

/* ---- Security helpers ---- */

const FORM_LIMIT = { max: 20, windowSeconds: 3600 }; // per IP, /contact
const APPLY_LIMIT = { max: 10, windowSeconds: 3600 }; // per IP, /apply
const LOGIN_LIMIT = { max: 10, windowSeconds: 900 }; // failed logins per IP

const MAX_LENGTH = { name: 200, email: 254, phone: 50, position: 200, message: 10000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sha256(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

// Rate-limit key: a hash of the IP, so no addresses are stored.
async function rateKey(scope, request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const hash = new Uint8Array(await sha256(ip));
  const hex = [...hash].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${scope}:${hex}`;
}

/* Counts one attempt and returns true once the limit is passed. If the table is
   missing or D1 fails this returns false: a limiter problem must never lose a
   real customer's message. */
async function overLimit(env, key, limit) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const expired = now - limit.windowSeconds;
    const row = await env.DB.prepare(
      `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN window_start <= ?3 THEN 1 ELSE count + 1 END,
         window_start = CASE WHEN window_start <= ?3 THEN ?2 ELSE window_start END
       RETURNING count`
    )
      .bind(key, now, expired)
      .first();
    if (Math.random() < 0.02) {
      await env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?")
        .bind(now - 86400)
        .run();
    }
    return Boolean(row) && row.count > limit.max;
  } catch {
    return false;
  }
}

// Read-only check, so a locked-out visitor doesn't keep extending the count.
async function isLocked(env, key, limit) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const row = await env.DB.prepare(
      "SELECT count, window_start FROM rate_limits WHERE key = ?"
    )
      .bind(key)
      .first();
    return Boolean(row) && row.window_start > now - limit.windowSeconds && row.count > limit.max;
  } catch {
    return false;
  }
}

// Admin requests that change data must come from the admin pages themselves.
// Browsers always send Origin on cross-site POSTs, and Basic Auth logins are
// attached automatically, so without this any website could submit these forms.
function isSameOrigin(request, url) {
  const origin = request.headers.get("Origin");
  if (origin) return origin === url.origin;
  const site = request.headers.get("Sec-Fetch-Site");
  return !site || site === "same-origin" || site === "none";
}

// Extra headers added to every response.
function withSecurityHeaders(response, pathname) {
  const res = new Response(response.body, response);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (pathname.startsWith("/admin") || pathname === "/file") {
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Cache-Control", "no-store");
    if (!res.headers.has("Content-Security-Policy")) {
      res.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
    }
  }
  return res;
}

// Checks the real file contents as well as the name, so a renamed file is refused.
// Returns the content type to store, or null if it isn't a PDF or Word file.
async function cvContentType(file) {
  const ext = String(file.name || "").split(".").pop().toLowerCase();
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const starts = (...bytes) => bytes.every((b, i) => head[i] === b);
  if (ext === "pdf" && starts(0x25, 0x50, 0x44, 0x46)) return "application/pdf";
  if (ext === "doc" && starts(0xd0, 0xcf, 0x11, 0xe0)) return "application/msword";
  if (ext === "docx" && starts(0x50, 0x4b, 0x03, 0x04)) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}

// Partner websites become links on the public site: only allow http(s).
function safeWebsite(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    return ["http:", "https:"].includes(new URL(text).protocol) ? text : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    let response;
    try {
      response = await route(request, env);
    } catch (err) {
      response = new Response("Server error.", { status: 500 });
    }
    return withSecurityHeaders(response, pathname);
  },
};

async function route(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin") || "";

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }
  if (
    url.pathname.startsWith("/admin") &&
    !["GET", "HEAD"].includes(request.method) &&
    !isSameOrigin(request, url)
  ) {
    return new Response("Forbidden.", { status: 403 });
  }
  if (url.pathname === "/apply" && request.method === "POST") {
    return handleApply(request, env, origin);
  }
  if (url.pathname === "/contact" && request.method === "POST") {
    return handleContact(request, env, origin);
  }
  if (url.pathname === "/admin") {
    return handleAdmin(request, env);
  }
  if (url.pathname === "/file") {
    return handleFile(request, env);
  }
  // ---- Content library ----
  if (url.pathname === "/content" && request.method === "GET") {
    return handleContentList(request, env, origin);
  }
  if (url.pathname === "/media" && request.method === "GET") {
    return handleMedia(request, env);
  }
  if (url.pathname === "/admin/content" && request.method === "POST") {
    return handleContentCreate(request, env);
  }
  if (url.pathname === "/admin/content/update" && request.method === "POST") {
    return handleContentUpdate(request, env);
  }
  if (url.pathname === "/admin/content/delete" && request.method === "POST") {
    return handleContentDelete(request, env);
  }
  if (url.pathname === "/admin/content") {
    return handleContentAdmin(request, env);
  }
  return new Response("AKA API is running.", { status: 200 });
}

/* Honeypot: the site's forms include a visually hidden "website" field.
   Humans never see it; bots auto-fill it. If it has a value we pretend
   success but store nothing, so the bot learns nothing. */
function isSpam(form) {
  return String(form.get("website") || "").trim() !== "";
}

/* Email notification for new submissions, so nothing sits unseen in D1.
   Enabled by setting two secrets on the Worker (no code change needed):
     wrangler secret put RESEND_API_KEY   (from https://resend.com — free tier)
     wrangler secret put NOTIFY_EMAIL     (where notifications are sent)
   Until both are set, this quietly does nothing. */
async function notify(env, subject, text) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AKA Website <onboarding@resend.dev>", // TODO: switch to no-reply@<domain> once the domain is verified in Resend
        to: [env.NOTIFY_EMAIL],
        subject,
        text,
      }),
    });
  } catch {
    // Never fail the user's submission because the notification failed.
  }
}

async function handleApply(request, env, origin) {
  try {
    if (await overLimit(env, await rateKey("apply", request), APPLY_LIMIT)) {
      return json({ ok: false, error: "Too many requests. Please try again later." }, 429, origin);
    }
    const form = await request.formData();
    if (isSpam(form)) return json({ ok: true }, 200, origin);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const position = String(form.get("position") || "").trim();
    const message = String(form.get("message") || "").trim();
    const file = form.get("attachment");

    if (!name || !email || !phone || !position) {
      return json({ ok: false, error: "Missing required fields." }, 400, origin);
    }
    if (
      name.length > MAX_LENGTH.name ||
      email.length > MAX_LENGTH.email ||
      phone.length > MAX_LENGTH.phone ||
      position.length > MAX_LENGTH.position ||
      message.length > MAX_LENGTH.message
    ) {
      return json({ ok: false, error: "A field is too long." }, 400, origin);
    }
    if (!EMAIL_RE.test(email)) {
      return json({ ok: false, error: "Invalid email address." }, 400, origin);
    }

    let cvKey = null;
    let cvName = null;
    if (file && typeof file === "object" && file.size > 0) {
      if (file.size > 8 * 1024 * 1024) {
        return json({ ok: false, error: "CV too large (max 8 MB)." }, 400, origin);
      }
      const contentType = await cvContentType(file);
      if (!contentType) {
        return json({ ok: false, error: "CV must be a PDF or Word file." }, 400, origin);
      }
      cvName = file.name || "cv";
      const safe = cvName.replace(/[^a-zA-Z0-9._-]/g, "_");
      cvKey = `applications/${Date.now()}-${crypto.randomUUID()}-${safe}`;
      await env.CVS.put(cvKey, file.stream(), { httpMetadata: { contentType } });
    }

    await env.DB.prepare(
      "INSERT INTO applications (created_at, name, email, phone, position, message, cv_key, cv_name) VALUES (?,?,?,?,?,?,?,?)"
    )
      .bind(new Date().toISOString(), name, email, phone, position, message, cvKey, cvName)
      .run();

    await notify(
      env,
      `New job application: ${position} — ${name}`,
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nPosition: ${position}\n\n${message}\n\nCV: ${cvName || "none"} (download from /admin)`
    );

    return json({ ok: true }, 200, origin);
  } catch (err) {
    return json({ ok: false, error: "Server error." }, 500, origin);
  }
}

async function handleContact(request, env, origin) {
  try {
    if (await overLimit(env, await rateKey("contact", request), FORM_LIMIT)) {
      return json({ ok: false, error: "Too many requests. Please try again later." }, 429, origin);
    }
    const form = await request.formData();
    if (isSpam(form)) return json({ ok: true }, 200, origin);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!name || !email || !message) {
      return json({ ok: false, error: "Missing required fields." }, 400, origin);
    }
    if (
      name.length > MAX_LENGTH.name ||
      email.length > MAX_LENGTH.email ||
      message.length > MAX_LENGTH.message
    ) {
      return json({ ok: false, error: "A field is too long." }, 400, origin);
    }
    if (!EMAIL_RE.test(email)) {
      return json({ ok: false, error: "Invalid email address." }, 400, origin);
    }

    await env.DB.prepare(
      "INSERT INTO messages (created_at, name, email, message) VALUES (?,?,?,?)"
    )
      .bind(new Date().toISOString(), name, email, message)
      .run();

    await notify(
      env,
      `New website inquiry from ${name}`,
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );

    return json({ ok: true }, 200, origin);
  } catch (err) {
    return json({ ok: false, error: "Server error." }, 500, origin);
  }
}

/* ---- Admin (Basic Auth) ---- */

function unauthorized() {
  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AKA admin"' },
  });
}

async function checkAuth(request, env) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ") || !env.ADMIN_PASSWORD) return false;
  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const pass = decoded.slice(decoded.indexOf(":") + 1);
  // Compare hashes in constant time so response timing reveals nothing.
  const [a, b] = await Promise.all([sha256(pass), sha256(env.ADMIN_PASSWORD)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

/* Returns a response to send if the visitor may not continue, or null if they
   are logged in. Too many wrong passwords from one IP locks that IP out for a
   while, even with the right password, so guessing gets nowhere. */
async function requireAdmin(request, env) {
  const key = await rateKey("login", request);
  if (await isLocked(env, key, LOGIN_LIMIT)) {
    return new Response("Too many failed logins. Try again in 15 minutes.", { status: 429 });
  }
  if (await checkAuth(request, env)) return null;
  // The browser's first request has no password yet: that isn't a failed login.
  if (request.headers.has("Authorization")) await overLimit(env, key, LOGIN_LIMIT);
  return unauthorized();
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function handleAdmin(request, env) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const apps = await env.DB.prepare(
    "SELECT * FROM applications ORDER BY id DESC LIMIT 300"
  ).all();
  const msgs = await env.DB.prepare(
    "SELECT * FROM messages ORDER BY id DESC LIMIT 300"
  ).all();

  const appRows = (apps.results || [])
    .map(
      (a) => `<tr>
      <td>${esc(a.created_at)}</td>
      <td>${esc(a.name)}</td>
      <td>${esc(a.email)}</td>
      <td>${esc(a.phone)}</td>
      <td>${esc(a.position)}</td>
      <td>${esc(a.message)}</td>
      <td>${a.cv_key ? `<a href="/file?key=${encodeURIComponent(a.cv_key)}">${esc(a.cv_name || "download")}</a>` : "—"}</td>
    </tr>`
    )
    .join("");

  const msgRows = (msgs.results || [])
    .map(
      (m) => `<tr>
      <td>${esc(m.created_at)}</td>
      <td>${esc(m.name)}</td>
      <td>${esc(m.email)}</td>
      <td>${esc(m.message)}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AKA — Submissions</title>
  <style>
    body{font-family:system-ui,Arial,sans-serif;margin:2rem;color:#111}
    h1{font-size:1.4rem}h2{margin-top:2.5rem}
    table{border-collapse:collapse;width:100%;font-size:14px}
    th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
    th{background:#f2f6f2}
    tr:nth-child(even){background:#fafafa}
  </style></head><body>
  <h1>AKA — Submissions</h1>
  <h2>Job applications (${(apps.results || []).length})</h2>
  <table><thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Position</th><th>Message</th><th>CV</th></tr></thead>
  <tbody>${appRows || '<tr><td colspan="7">None yet.</td></tr>'}</tbody></table>
  <h2>Contact messages (${(msgs.results || []).length})</h2>
  <table><thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Message</th></tr></thead>
  <tbody>${msgRows || '<tr><td colspan="4">None yet.</td></tr>'}</tbody></table>
  </body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function handleFile(request, env) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return new Response("Missing key.", { status: 400 });

  const object = await env.CVS.get(key);
  if (!object) return new Response("Not found.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  const filename = key.split("/").pop();
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  return new Response(object.body, { headers });
}

/* =========================================================================
   CONTENT LIBRARY
   -------------------------------------------------------------------------
   Public:
     GET /content?type=lectures|documents|products  -> JSON the pages render
     GET /media?key=content/...                      -> serve an uploaded file
   Admin (Basic Auth, same ADMIN_PASSWORD as /admin):
     GET  /admin/content         -> upload panel + list of existing posts
     POST /admin/content         -> create a post (uploads files to R2)
     POST /admin/content/delete  -> delete a post (and its R2 files)

   Uploaded files live in the same R2 bucket as CVs but under the "content/"
   prefix. /media only serves keys under that prefix, so CVs (applications/*)
   are never exposed publicly.
   ========================================================================= */

// Store an uploaded file in R2 under content/<prefix>/ and return its key.
async function putContent(env, file, prefix) {
  if (!file || typeof file !== "object" || !file.size) return null;
  const safe = String(file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `content/${prefix}/${Date.now()}-${crypto.randomUUID()}-${safe}`;
  await env.CVS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  return key;
}

async function handleContentList(request, env, origin) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  // R2-hosted files (content/...) are served via /media; anything else is a
  // site-relative path (e.g. images/partners/edan.png) returned unchanged so
  // the page resolves it against its own origin.
  const media = (key) =>
    key
      ? key.startsWith("content/")
        ? `${url.origin}/media?key=${encodeURIComponent(key)}`
        : key
      : null;

  try {
    if (type === "lectures") {
      const rows =
        (await env.DB.prepare(
          "SELECT * FROM lectures ORDER BY featured DESC, created_at DESC"
        ).all()).results || [];
      return json(
        rows.map((r) => ({
          title: r.title,
          category: r.category,
          speaker: r.speaker || undefined,
          date: r.date_label || undefined,
          duration: r.duration || undefined,
          src: r.src_kind === "file" ? media(r.src_value) : r.src_value,
          thumb: r.thumb_key ? media(r.thumb_key) : undefined,
          featured: r.featured ? true : undefined,
        })),
        200,
        origin
      );
    }
    if (type === "documents") {
      const rows =
        (await env.DB.prepare(
          "SELECT * FROM documents ORDER BY created_at DESC"
        ).all()).results || [];
      return json(
        rows.map((r) => ({
          title: r.title,
          category: r.category,
          desc: r.description || undefined,
          size: r.size_label || undefined,
          lang: r.lang || undefined,
          file: media(r.file_key),
        })),
        200,
        origin
      );
    }
    if (type === "products") {
      const rows =
        (await env.DB.prepare(
          "SELECT * FROM products ORDER BY created_at DESC"
        ).all()).results || [];
      return json(
        rows.map((r) => ({
          name: r.name,
          brand: r.brand,
          category: r.category,
          image: media(r.image_key),
        })),
        200,
        origin
      );
    }
    if (type === "categories") {
      const rows =
        (await env.DB.prepare(
          "SELECT * FROM categories ORDER BY created_at ASC"
        ).all()).results || [];
      return json(
        rows.map((r) => ({
          slug: r.slug,
          label: r.label,
          label_ar: r.label_ar || undefined,
        })),
        200,
        origin
      );
    }
    if (type === "projects") {
      const rows =
        (await env.DB.prepare(
          "SELECT * FROM projects ORDER BY year DESC, created_at DESC"
        ).all()).results || [];
      return json(
        rows.map((r) => ({
          name: r.name,
          name_ar: r.name_ar || undefined,
          year: r.year,
          location: r.location || undefined,
          location_ar: r.location_ar || undefined,
          beds: r.beds || undefined,
          departments: r.departments || undefined,
          departments_ar: r.departments_ar || undefined,
          equipment: r.equipment || undefined,
          equipment_ar: r.equipment_ar || undefined,
        })),
        200,
        origin
      );
    }
    if (type === "partners") {
      const rows =
        (await env.DB.prepare(
          "SELECT * FROM partners ORDER BY created_at ASC"
        ).all()).results || [];
      return json(
        rows.map((r) => ({
          kind: r.kind,
          name: r.name,
          desc: r.description || undefined,
          desc_ar: r.description_ar || undefined,
          website: r.website || undefined,
          logo: media(r.logo_key),
        })),
        200,
        origin
      );
    }
    return json({ error: "Unknown content type." }, 400, origin);
  } catch (err) {
    // Fail soft: the pages fall back to their built-in content if this errors.
    return json([], 200, origin);
  }
}

async function handleMedia(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  // Only content/* is public — CV files (applications/*) stay private.
  if (!key || !key.startsWith("content/")) {
    return new Response("Not found.", { status: 404 });
  }
  const object = await env.CVS.get(key);
  if (!object) return new Response("Not found.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=3600");
  headers.set("Access-Control-Allow-Origin", "*");
  // Only show known-safe file types in the browser. Anything else (HTML, SVG...)
  // is downloaded and sandboxed, so it can't run scripts on this domain.
  const type = (object.httpMetadata && object.httpMetadata.contentType) || "";
  if (!/^(image\/(png|jpeg|gif|webp|avif)|video\/|audio\/|application\/pdf$)/.test(type)) {
    headers.set("Content-Disposition", "attachment");
    headers.set("Content-Security-Policy", "sandbox; default-src 'none'");
  }
  return new Response(object.body, { headers });
}

// 303 redirect back to the admin panel after a create/delete.
function backToAdmin(request) {
  const url = new URL(request.url);
  return new Response(null, {
    status: 303,
    headers: { Location: `${url.origin}/admin/content` },
  });
}

async function handleContentCreate(request, env) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const type = String(form.get("type") || "");
    const now = new Date().toISOString();

    if (type === "lectures") {
      const title = String(form.get("title") || "").trim();
      const category = String(form.get("category") || "").trim();
      if (!title || !category)
        return new Response("Missing title/category.", { status: 400 });

      const kind = String(form.get("video_kind") || "youtube");
      let srcKind, srcValue;
      if (kind === "file") {
        const key = await putContent(env, form.get("video_file"), "lectures");
        if (!key) return new Response("No video file uploaded.", { status: 400 });
        srcKind = "file";
        srcValue = key;
      } else {
        srcValue = String(form.get("youtube_url") || "").trim();
        if (!srcValue) return new Response("No YouTube link given.", { status: 400 });
        srcKind = "youtube";
      }
      const thumbKey = await putContent(env, form.get("thumb_file"), "lectures");

      await env.DB.prepare(
        "INSERT INTO lectures (created_at, title, category, speaker, date_label, duration, src_kind, src_value, thumb_key, featured) VALUES (?,?,?,?,?,?,?,?,?,?)"
      )
        .bind(
          now,
          title,
          category,
          String(form.get("speaker") || "").trim() || null,
          String(form.get("date_label") || "").trim() || null,
          String(form.get("duration") || "").trim() || null,
          srcKind,
          srcValue,
          thumbKey,
          form.get("featured") ? 1 : 0
        )
        .run();
      return backToAdmin(request);
    }

    if (type === "documents") {
      const title = String(form.get("title") || "").trim();
      const category = String(form.get("category") || "").trim();
      if (!title || !category)
        return new Response("Missing title/category.", { status: 400 });
      const file = form.get("file");
      const key = await putContent(env, file, "documents");
      if (!key) return new Response("No PDF uploaded.", { status: 400 });

      await env.DB.prepare(
        "INSERT INTO documents (created_at, title, category, description, lang, size_label, file_key, file_name) VALUES (?,?,?,?,?,?,?,?)"
      )
        .bind(
          now,
          title,
          category,
          String(form.get("description") || "").trim() || null,
          String(form.get("lang") || "").trim() || null,
          String(form.get("size_label") || "").trim() || null,
          key,
          (file && file.name) || null
        )
        .run();
      return backToAdmin(request);
    }

    if (type === "products") {
      const name = String(form.get("name") || "").trim();
      const brand = String(form.get("brand") || "").trim();
      const category = String(form.get("category") || "").trim();
      if (!name || !brand || !category)
        return new Response("Missing name/brand/category.", { status: 400 });
      const key = await putContent(env, form.get("image"), "products");
      if (!key) return new Response("No image uploaded.", { status: 400 });

      await env.DB.prepare(
        "INSERT INTO products (created_at, name, brand, category, image_key) VALUES (?,?,?,?,?)"
      )
        .bind(now, name, brand, category, key)
        .run();
      return backToAdmin(request);
    }

    if (type === "projects") {
      const name = String(form.get("name") || "").trim();
      const year = String(form.get("year") || "").trim();
      if (!name || !year)
        return new Response("Missing name/year.", { status: 400 });
      await env.DB.prepare(
        "INSERT INTO projects (created_at, name, name_ar, year, location, location_ar, beds, departments, departments_ar, equipment, equipment_ar) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
      )
        .bind(
          now,
          name,
          String(form.get("name_ar") || "").trim() || null,
          year,
          String(form.get("location") || "").trim() || null,
          String(form.get("location_ar") || "").trim() || null,
          String(form.get("beds") || "").trim() || null,
          String(form.get("departments") || "").trim() || null,
          String(form.get("departments_ar") || "").trim() || null,
          String(form.get("equipment") || "").trim() || null,
          String(form.get("equipment_ar") || "").trim() || null
        )
        .run();
      return backToAdmin(request);
    }

    if (type === "partners") {
      const name = String(form.get("name") || "").trim();
      const kind = String(form.get("kind") || "").trim();
      if (!name || !["manufacturer", "ngo"].includes(kind))
        return new Response("Missing name/kind.", { status: 400 });
      const logoKey = await putContent(env, form.get("logo"), "partners");
      await env.DB.prepare(
        "INSERT INTO partners (created_at, kind, name, description, description_ar, website, logo_key) VALUES (?,?,?,?,?,?,?)"
      )
        .bind(
          now,
          kind,
          name,
          String(form.get("description") || "").trim() || null,
          String(form.get("description_ar") || "").trim() || null,
          safeWebsite(form.get("website")),
          logoKey
        )
        .run();
      return backToAdmin(request);
    }

    if (type === "categories") {
      const slug = String(form.get("slug") || "").trim().toLowerCase();
      const label = String(form.get("label") || "").trim();
      if (!slug || !label)
        return new Response("Missing slug/label.", { status: 400 });
      if (!/^[a-z0-9-]+$/.test(slug))
        return new Response(
          "Slug may only contain lowercase letters, numbers, and dashes (e.g. dental-care).",
          { status: 400 }
        );
      const dupe = await env.DB.prepare("SELECT id FROM categories WHERE slug = ?")
        .bind(slug)
        .first();
      if (dupe)
        return new Response(`A category with slug "${slug}" already exists.`, { status: 400 });
      await env.DB.prepare(
        "INSERT INTO categories (created_at, slug, label, label_ar) VALUES (?,?,?,?)"
      )
        .bind(now, slug, label, String(form.get("label_ar") || "").trim() || null)
        .run();
      return backToAdmin(request);
    }

    return new Response("Unknown content type.", { status: 400 });
  } catch (err) {
    return new Response("Server error: " + err.message, { status: 500 });
  }
}

/* ---- Update (edit) an existing post ----------------------------------------
   Same forms as create, plus a hidden id. File fields are OPTIONAL on update:
   left empty -> the existing file is kept; a new file replaces the old one
   (the old R2 object is deleted, unless it is a site path like images/...). */

async function deleteIfR2(env, key) {
  if (key && key.startsWith("content/")) await env.CVS.delete(key);
}

async function handleContentUpdate(request, env) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const type = String(form.get("type") || "");
    const id = Number(form.get("id"));
    if (!id) return new Response("Missing id.", { status: 400 });
    const val = (k) => String(form.get(k) || "").trim() || null;

    if (type === "lectures") {
      const row = await env.DB.prepare("SELECT * FROM lectures WHERE id = ?").bind(id).first();
      if (!row) return new Response("Not found.", { status: 404 });

      let srcKind = row.src_kind;
      let srcValue = row.src_value;
      const kind = String(form.get("video_kind") || "youtube");
      if (kind === "file") {
        const key = await putContent(env, form.get("video_file"), "lectures");
        if (key) {
          await deleteIfR2(env, row.src_kind === "file" ? row.src_value : null);
          srcKind = "file";
          srcValue = key;
        }
        // no new file chosen: keep whatever was there before
      } else {
        const yt = val("youtube_url");
        if (yt) {
          await deleteIfR2(env, row.src_kind === "file" ? row.src_value : null);
          srcKind = "youtube";
          srcValue = yt;
        }
      }

      let thumbKey = row.thumb_key;
      const newThumb = await putContent(env, form.get("thumb_file"), "lectures");
      if (newThumb) {
        await deleteIfR2(env, row.thumb_key);
        thumbKey = newThumb;
      }

      await env.DB.prepare(
        "UPDATE lectures SET title=?, category=?, speaker=?, date_label=?, duration=?, src_kind=?, src_value=?, thumb_key=?, featured=? WHERE id=?"
      )
        .bind(
          val("title") || row.title,
          val("category") || row.category,
          val("speaker"),
          val("date_label"),
          val("duration"),
          srcKind,
          srcValue,
          thumbKey,
          form.get("featured") ? 1 : 0,
          id
        )
        .run();
      return backToAdmin(request);
    }

    if (type === "documents") {
      const row = await env.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(id).first();
      if (!row) return new Response("Not found.", { status: 404 });

      let fileKey = row.file_key;
      let fileName = row.file_name;
      const file = form.get("file");
      const newKey = await putContent(env, file, "documents");
      if (newKey) {
        await deleteIfR2(env, row.file_key);
        fileKey = newKey;
        fileName = (file && file.name) || null;
      }

      await env.DB.prepare(
        "UPDATE documents SET title=?, category=?, description=?, lang=?, size_label=?, file_key=?, file_name=? WHERE id=?"
      )
        .bind(
          val("title") || row.title,
          val("category") || row.category,
          val("description"),
          val("lang"),
          val("size_label"),
          fileKey,
          fileName,
          id
        )
        .run();
      return backToAdmin(request);
    }

    if (type === "products") {
      const row = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
      if (!row) return new Response("Not found.", { status: 404 });

      let imageKey = row.image_key;
      const newKey = await putContent(env, form.get("image"), "products");
      if (newKey) {
        await deleteIfR2(env, row.image_key);
        imageKey = newKey;
      }

      await env.DB.prepare(
        "UPDATE products SET name=?, brand=?, category=?, image_key=? WHERE id=?"
      )
        .bind(
          val("name") || row.name,
          val("brand") || row.brand,
          val("category") || row.category,
          imageKey,
          id
        )
        .run();
      return backToAdmin(request);
    }

    if (type === "projects") {
      const row = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();
      if (!row) return new Response("Not found.", { status: 404 });
      await env.DB.prepare(
        "UPDATE projects SET name=?, name_ar=?, year=?, location=?, location_ar=?, beds=?, departments=?, departments_ar=?, equipment=?, equipment_ar=? WHERE id=?"
      )
        .bind(
          val("name") || row.name,
          val("name_ar"),
          val("year") || row.year,
          val("location"),
          val("location_ar"),
          val("beds"),
          val("departments"),
          val("departments_ar"),
          val("equipment"),
          val("equipment_ar"),
          id
        )
        .run();
      return backToAdmin(request);
    }

    if (type === "partners") {
      const row = await env.DB.prepare("SELECT * FROM partners WHERE id = ?").bind(id).first();
      if (!row) return new Response("Not found.", { status: 404 });

      let logoKey = row.logo_key;
      const newKey = await putContent(env, form.get("logo"), "partners");
      if (newKey) {
        await deleteIfR2(env, row.logo_key);
        logoKey = newKey;
      }

      await env.DB.prepare(
        "UPDATE partners SET kind=?, name=?, description=?, description_ar=?, website=?, logo_key=? WHERE id=?"
      )
        .bind(
          val("kind") || row.kind,
          val("name") || row.name,
          val("description"),
          val("description_ar"),
          safeWebsite(form.get("website")),
          logoKey,
          id
        )
        .run();
      return backToAdmin(request);
    }

    if (type === "categories") {
      const row = await env.DB.prepare("SELECT * FROM categories WHERE id = ?").bind(id).first();
      if (!row) return new Response("Not found.", { status: 404 });
      // The slug is intentionally NOT editable: published devices reference it.
      await env.DB.prepare(
        "UPDATE categories SET label=?, label_ar=? WHERE id=?"
      )
        .bind(val("label") || row.label, val("label_ar"), id)
        .run();
      return backToAdmin(request);
    }

    return new Response("Unknown content type.", { status: 400 });
  } catch (err) {
    return new Response("Server error: " + err.message, { status: 500 });
  }
}

async function handleContentDelete(request, env) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const table = String(form.get("table") || "");
    const id = Number(form.get("id"));
    const ALLOWED = new Set(["lectures", "documents", "products", "projects", "partners", "categories"]);
    if (!ALLOWED.has(table) || !id)
      return new Response("Bad request.", { status: 400 });

    const row = await env.DB.prepare(
      `SELECT * FROM ${table} WHERE id = ?`
    ).bind(id).first();

    // A category can only be deleted once no device uses it.
    if (row && table === "categories") {
      const used = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM products WHERE category = ?"
      ).bind(row.slug).first();
      if (used && used.n > 0) {
        return new Response(
          `Cannot delete "${row.slug}" — ${used.n} device(s) still use it. ` +
            `Edit or delete those devices first (Devices tab), then try again.`,
          { status: 400 }
        );
      }
    }

    if (row) {
      // Remove any R2 files this row owns.
      const keys = [];
      if (table === "lectures") {
        if (row.src_kind === "file") keys.push(row.src_value);
        if (row.thumb_key) keys.push(row.thumb_key);
      } else if (table === "documents") {
        keys.push(row.file_key);
      } else if (table === "products") {
        keys.push(row.image_key);
      } else if (table === "partners") {
        keys.push(row.logo_key);
      } // projects own no files
      for (const k of keys) {
        await deleteIfR2(env, k); // only removes R2 objects (content/*), never site files
      }
      await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    }
    return backToAdmin(request);
  } catch (err) {
    return new Response("Server error: " + err.message, { status: 500 });
  }
}

/* ---- Admin content panel (create + EDIT + delete, 5 content types) ---- */

const LECTURE_CATS = ["presentation", "tutorial", "webinar"];
const DOC_CATS = ["profile", "certification", "manual", "catalog"];
const PRODUCT_CATS = [
  "diagnostic", "imaging", "endoscopy", "surgical", "orthopedics",
  "monitoring", "cardiology", "neurology", "lab", "sterilization", "hospital",
];
const PARTNER_KINDS = ["manufacturer", "ngo"];

// Base URL of the public site, used only to preview seeded images that are
// stored as site paths (images/...) rather than R2 keys.
const SITE_BASE = "https://aka1.hadi-alakkadd.workers.dev";

function optionList(values) {
  return values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
}

// Small preview <img> for a stored key: R2 keys go through /media, site
// paths are resolved against the public site.
function thumbHtml(key) {
  if (!key) return "—";
  const src = key.startsWith("content/")
    ? `/media?key=${encodeURIComponent(key)}`
    : `${SITE_BASE}/${key}`;
  return `<img class="mini" src="${esc(src)}" alt="" loading="lazy">`;
}

// The row's full data, JSON-encoded into a data attribute for the Edit button.
function dataAttr(obj) {
  // esc() handles & < > but NOT quotes; the JSON is full of double quotes and
  // lives inside a double-quoted HTML attribute, so escape them too (and single
  // quotes for safety). The browser decodes these back before JSON.parse.
  return esc(JSON.stringify(obj))
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function handleContentAdmin(request, env) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const q = async (sql) => ((await env.DB.prepare(sql).all()).results || []);
  const lectures = await q("SELECT * FROM lectures ORDER BY created_at DESC");
  const documents = await q("SELECT * FROM documents ORDER BY created_at DESC");
  const products = await q("SELECT * FROM products ORDER BY created_at DESC");
  const projects = await q("SELECT * FROM projects ORDER BY year DESC, created_at DESC");
  const partners = await q("SELECT * FROM partners ORDER BY kind, created_at ASC");
  const categories = await q("SELECT * FROM categories ORDER BY created_at ASC");

  // Device-category dropdown comes from the categories table (falls back to
  // the built-in list only if the table is somehow empty).
  const productCatOptions = categories.length
    ? categories
        .map((c) => `<option value="${esc(c.slug)}">${esc(c.label)} (${esc(c.slug)})</option>`)
        .join("")
    : optionList(PRODUCT_CATS);

  const actions = (type, row) => `
    <div class="row-actions">
      <button type="button" class="edit" data-type="${type}" data-item="${dataAttr(row)}">Edit</button>
      <form method="post" action="/admin/content/delete" class="del" onsubmit="return confirm('Delete this item?')">
        <input type="hidden" name="table" value="${type}">
        <input type="hidden" name="id" value="${row.id}">
        <button type="submit">Delete</button>
      </form>
    </div>`;

  const lectureRows = lectures.map((l) => `<tr>
      <td>${esc(l.title)}${l.featured ? ' <span class="badge">featured</span>' : ""}</td>
      <td>${esc(l.category)}</td>
      <td>${l.src_kind === "youtube" ? "YouTube" : "File"}</td>
      <td>${esc(l.speaker || "")}</td>
      <td>${actions("lectures", l)}</td>
    </tr>`).join("");

  const docRows = documents.map((d) => `<tr>
      <td>${esc(d.title)}</td>
      <td>${esc(d.category)}</td>
      <td>${esc(d.file_name || "")}</td>
      <td>${actions("documents", d)}</td>
    </tr>`).join("");

  const productRows = products.map((p) => `<tr>
      <td>${thumbHtml(p.image_key)}</td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.brand)}</td>
      <td>${esc(p.category)}</td>
      <td>${actions("products", p)}</td>
    </tr>`).join("");

  const projectRows = projects.map((p) => `<tr>
      <td>${esc(p.year)}</td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.location || "")}</td>
      <td>${esc(p.beds || "")}</td>
      <td>${actions("projects", p)}</td>
    </tr>`).join("");

  const partnerRows = partners.map((p) => `<tr>
      <td>${thumbHtml(p.logo_key)}</td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.kind)}</td>
      <td>${p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener">link</a>` : "—"}</td>
      <td>${actions("partners", p)}</td>
    </tr>`).join("");

  const usedBySlug = {};
  for (const p of products) usedBySlug[p.category] = (usedBySlug[p.category] || 0) + 1;
  const categoryRows = categories.map((c) => `<tr>
      <td><code>${esc(c.slug)}</code></td>
      <td>${esc(c.label)}</td>
      <td dir="rtl">${esc(c.label_ar || "")}</td>
      <td>${usedBySlug[c.slug] || 0}</td>
      <td>${actions("categories", c)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AKA — Content manager</title>
  <style>
    :root{--ink:#1d2b36;--line:#dce3e6;--accent:#2f7d6b;--warn:#b26a00}
    *{box-sizing:border-box}
    body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:0;color:var(--ink);background:#f5f7f8}
    header{background:var(--ink);color:#fff;padding:1rem 1.5rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem}
    header h1{margin:0;font-size:1.15rem}
    header a{color:#bfe3d8;font-size:.85rem}
    main{max-width:1020px;margin:0 auto;padding:1.5rem}
    .tabs{display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap}
    .tab{border:1px solid var(--line);background:#fff;padding:.5rem 1rem;border-radius:8px;cursor:pointer;font-size:.9rem}
    .tab.active{background:var(--accent);color:#fff;border-color:var(--accent)}
    .panel{display:none;background:#fff;border:1px solid var(--line);border-radius:12px;padding:1.25rem;margin-bottom:1.5rem}
    .panel.active{display:block}
    .editing-note{display:none;background:#fff7e8;border:1px solid #f0d9a8;color:var(--warn);padding:.6rem .9rem;border-radius:8px;margin-bottom:.75rem;font-size:.85rem}
    .editing-note button{margin-left:.75rem;border:1px solid var(--warn);background:#fff;color:var(--warn);border-radius:6px;padding:.2rem .6rem;cursor:pointer;font-size:.8rem}
    label{display:block;font-size:.8rem;font-weight:600;margin:.75rem 0 .25rem}
    input,select,textarea{width:100%;padding:.55rem .65rem;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff}
    textarea{min-height:70px;resize:vertical}
    .row{display:flex;gap:1rem;flex-wrap:wrap}
    .row>div{flex:1;min-width:180px}
    .check{display:flex;align-items:center;gap:.5rem;margin-top:1rem}
    .check input{width:auto}
    .check label{margin:0}
    button.primary{margin-top:1.25rem;background:var(--accent);color:#fff;border:none;padding:.7rem 1.4rem;border-radius:8px;font-size:.95rem;cursor:pointer}
    h2{font-size:1rem;margin:1.5rem 0 .5rem}
    table{border-collapse:collapse;width:100%;font-size:.85rem;background:#fff}
    th,td{border:1px solid var(--line);padding:.5rem;text-align:left;vertical-align:middle}
    th{background:#eef3f2}
    .badge{background:#e0f0ea;color:var(--accent);font-size:.7rem;padding:.1rem .4rem;border-radius:4px}
    .mini{width:52px;height:40px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:6px;display:block}
    .row-actions{display:flex;gap:.4rem;align-items:center}
    .row-actions .edit{background:#fff;border:1px solid var(--accent);color:var(--accent);padding:.3rem .6rem;border-radius:6px;cursor:pointer;font-size:.8rem}
    .del{margin:0}
    .del button{background:#fff;border:1px solid #d9534f;color:#d9534f;padding:.3rem .6rem;border-radius:6px;cursor:pointer;font-size:.8rem}
    .hint{font-size:.75rem;color:#667;margin-top:.25rem}
    .current-file{font-size:.75rem;color:#2f7d6b;margin-top:.25rem;display:none}
  </style></head><body>
  <header><h1>AKA — Content manager</h1><a href="/admin">form submissions →</a></header>
  <main>
    <div class="tabs">
      <button class="tab active" data-tab="lectures" type="button">Lectures (${lectures.length})</button>
      <button class="tab" data-tab="documents" type="button">Documents (${documents.length})</button>
      <button class="tab" data-tab="products" type="button">Devices (${products.length})</button>
      <button class="tab" data-tab="projects" type="button">Projects (${projects.length})</button>
      <button class="tab" data-tab="partners" type="button">Partners (${partners.length})</button>
      <button class="tab" data-tab="categories" type="button">Categories (${categories.length})</button>
    </div>

    <!-- LECTURES -->
    <section class="panel active" id="p-lectures">
      <div class="editing-note" id="note-lectures">Editing an existing lecture — file fields are optional (leave empty to keep the current file).<button type="button" onclick="cancelEdit('lectures')">Cancel</button></div>
      <form id="form-lectures" method="post" action="/admin/content" enctype="multipart/form-data">
        <input type="hidden" name="type" value="lectures">
        <input type="hidden" name="id" value="" disabled>
        <label>Title</label><input name="title" required>
        <div class="row">
          <div><label>Category</label><select name="category">${optionList(LECTURE_CATS)}</select></div>
          <div><label>Speaker (optional)</label><input name="speaker"></div>
        </div>
        <div class="row">
          <div><label>Date label (optional)</label><input name="date_label" placeholder="March 2026"></div>
          <div><label>Duration (optional)</label><input name="duration" placeholder="12:45"></div>
        </div>
        <label>Video source</label>
        <select name="video_kind" onchange="syncVideoKind(this)">
          <option value="youtube">YouTube link</option>
          <option value="file">Upload video file</option>
        </select>
        <div id="yt-field">
          <label>YouTube URL</label><input name="youtube_url" placeholder="https://youtube.com/watch?v=...">
        </div>
        <div id="file-field" style="display:none">
          <label>Video file (mp4)</label><input type="file" name="video_file" accept="video/*">
          <p class="hint">Large files may fail to upload — for long videos, prefer a YouTube link.</p>
          <p class="current-file" data-current="video">A video file is already uploaded — choose a new one only to replace it.</p>
        </div>
        <label>Cover image (optional — recommended for uploaded files)</label>
        <input type="file" name="thumb_file" accept="image/*">
        <p class="current-file" data-current="thumb">A cover image is already uploaded — choose a new one only to replace it.</p>
        <div class="check"><input type="checkbox" name="featured" id="feat"><label for="feat">Feature this at the top of the page</label></div>
        <button class="primary" type="submit" data-create="Publish lecture" data-edit="Save changes">Publish lecture</button>
      </form>
      <h2>Published lectures</h2>
      <table><thead><tr><th>Title</th><th>Category</th><th>Source</th><th>Speaker</th><th></th></tr></thead>
      <tbody>${lectureRows || '<tr><td colspan="5">None yet.</td></tr>'}</tbody></table>
    </section>

    <!-- DOCUMENTS -->
    <section class="panel" id="p-documents">
      <div class="editing-note" id="note-documents">Editing an existing document — leave the PDF empty to keep the current file.<button type="button" onclick="cancelEdit('documents')">Cancel</button></div>
      <form id="form-documents" method="post" action="/admin/content" enctype="multipart/form-data">
        <input type="hidden" name="type" value="documents">
        <input type="hidden" name="id" value="" disabled>
        <label>Title</label><input name="title" required>
        <div class="row">
          <div><label>Category</label><select name="category">${optionList(DOC_CATS)}</select></div>
          <div><label>Language (optional)</label><input name="lang" placeholder="EN / AR"></div>
        </div>
        <label>Description (optional)</label><textarea name="description"></textarea>
        <div class="row">
          <div><label>PDF file</label><input type="file" name="file" accept="application/pdf" required>
            <p class="current-file" data-current="file">A PDF is already uploaded — choose a new one only to replace it.</p></div>
          <div><label>Size label (optional)</label><input name="size_label" placeholder="2.4 MB"></div>
        </div>
        <button class="primary" type="submit" data-create="Publish document" data-edit="Save changes">Publish document</button>
      </form>
      <h2>Published documents</h2>
      <table><thead><tr><th>Title</th><th>Category</th><th>File</th><th></th></tr></thead>
      <tbody>${docRows || '<tr><td colspan="4">None yet.</td></tr>'}</tbody></table>
    </section>

    <!-- DEVICES -->
    <section class="panel" id="p-products">
      <div class="editing-note" id="note-products">Editing an existing device — leave the image empty to keep the current photo.<button type="button" onclick="cancelEdit('products')">Cancel</button></div>
      <form id="form-products" method="post" action="/admin/content" enctype="multipart/form-data">
        <input type="hidden" name="type" value="products">
        <input type="hidden" name="id" value="" disabled>
        <div class="row">
          <div><label>Model name</label><input name="name" required></div>
          <div><label>Brand / manufacturer</label><input name="brand" required></div>
        </div>
        <div class="row">
          <div><label>Category</label><select name="category">${productCatOptions}</select>
            <p class="hint">Manage the list in the Categories tab.</p></div>
          <div><label>Product image</label><input type="file" name="image" accept="image/*" required>
            <p class="current-file" data-current="image">An image is already uploaded — choose a new one only to replace it.</p></div>
        </div>
        <button class="primary" type="submit" data-create="Publish device" data-edit="Save changes">Publish device</button>
      </form>
      <h2>Published devices</h2>
      <table><thead><tr><th></th><th>Name</th><th>Brand</th><th>Category</th><th></th></tr></thead>
      <tbody>${productRows || '<tr><td colspan="5">None yet.</td></tr>'}</tbody></table>
    </section>

    <!-- PROJECTS -->
    <section class="panel" id="p-projects">
      <div class="editing-note" id="note-projects">Editing an existing project.<button type="button" onclick="cancelEdit('projects')">Cancel</button></div>
      <form id="form-projects" method="post" action="/admin/content" enctype="multipart/form-data">
        <input type="hidden" name="type" value="projects">
        <input type="hidden" name="id" value="" disabled>
        <div class="row">
          <div><label>Name (English)</label><input name="name" required placeholder="Al Noor Hospital — Tartous"></div>
          <div><label>Name (Arabic, optional)</label><input name="name_ar" dir="rtl"></div>
        </div>
        <div class="row">
          <div><label>Year</label><input name="year" required placeholder="2024"></div>
          <div><label>Beds (optional)</label><input name="beds" placeholder="150"></div>
        </div>
        <div class="row">
          <div><label>Location (English)</label><input name="location" placeholder="Tartous"></div>
          <div><label>Location (Arabic)</label><input name="location_ar" dir="rtl"></div>
        </div>
        <label>Departments (English)</label><input name="departments" placeholder="Emergency, Surgery, ICU, Radiology">
        <label>Departments (Arabic)</label><input name="departments_ar" dir="rtl">
        <label>Key equipment (English)</label><input name="equipment" placeholder="CT Scanner, Ultrasound, Digital X-ray">
        <label>Key equipment (Arabic)</label><input name="equipment_ar" dir="rtl">
        <button class="primary" type="submit" data-create="Publish project" data-edit="Save changes">Publish project</button>
      </form>
      <h2>Published projects</h2>
      <table><thead><tr><th>Year</th><th>Name</th><th>Location</th><th>Beds</th><th></th></tr></thead>
      <tbody>${projectRows || '<tr><td colspan="5">None yet.</td></tr>'}</tbody></table>
    </section>

    <!-- PARTNERS -->
    <section class="panel" id="p-partners">
      <div class="editing-note" id="note-partners">Editing an existing partner — leave the logo empty to keep the current one.<button type="button" onclick="cancelEdit('partners')">Cancel</button></div>
      <form id="form-partners" method="post" action="/admin/content" enctype="multipart/form-data">
        <input type="hidden" name="type" value="partners">
        <input type="hidden" name="id" value="" disabled>
        <div class="row">
          <div><label>Name</label><input name="name" required placeholder="EDAN"></div>
          <div><label>Type</label><select name="kind">${optionList(PARTNER_KINDS)}</select>
            <p class="hint">manufacturer = "Our partners" grid · ngo = the NGO slideshow</p></div>
        </div>
        <label>Description (English)</label><textarea name="description"></textarea>
        <label>Description (Arabic)</label><textarea name="description_ar" dir="rtl"></textarea>
        <div class="row">
          <div><label>Website (optional)</label><input name="website" placeholder="https://..."></div>
          <div><label>Logo</label><input type="file" name="logo" accept="image/*">
            <p class="current-file" data-current="logo">A logo is already set — choose a new one only to replace it.</p></div>
        </div>
        <button class="primary" type="submit" data-create="Publish partner" data-edit="Save changes">Publish partner</button>
      </form>
      <h2>Published partners</h2>
      <table><thead><tr><th></th><th>Name</th><th>Type</th><th>Website</th><th></th></tr></thead>
      <tbody>${partnerRows || '<tr><td colspan="5">None yet.</td></tr>'}</tbody></table>
    </section>

    <!-- CATEGORIES -->
    <section class="panel" id="p-categories">
      <div class="editing-note" id="note-categories">Editing a category — the slug can't change (devices reference it), only the display names.<button type="button" onclick="cancelEdit('categories')">Cancel</button></div>
      <form id="form-categories" method="post" action="/admin/content" enctype="multipart/form-data">
        <input type="hidden" name="type" value="categories">
        <input type="hidden" name="id" value="" disabled>
        <div class="row">
          <div><label>Slug (machine name)</label><input name="slug" required placeholder="dental" pattern="[a-z0-9-]+">
            <p class="hint">Lowercase letters, numbers, dashes. Used internally — can't be changed later.</p></div>
          <div><label>Display name (English)</label><input name="label" required placeholder="Dental Equipment"></div>
        </div>
        <label>Display name (Arabic)</label><input name="label_ar" dir="rtl" placeholder="معدات طب الأسنان">
        <button class="primary" type="submit" data-create="Add category" data-edit="Save changes">Add category</button>
      </form>
      <h2>Categories</h2>
      <p class="hint">Filter buttons on the site only appear for categories that have published devices. A category can be deleted only when no device uses it.</p>
      <table><thead><tr><th>Slug</th><th>English</th><th>Arabic</th><th>Devices using it</th><th></th></tr></thead>
      <tbody>${categoryRows || '<tr><td colspan="5">None yet.</td></tr>'}</tbody></table>
    </section>
  </main>
  <script>
    // ---- tabs ----
    var tabs = document.querySelectorAll('.tab');
    tabs.forEach(function(t){
      t.addEventListener('click', function(){ showTab(t.dataset.tab); });
    });
    function showTab(name){
      tabs.forEach(function(x){ x.classList.toggle('active', x.dataset.tab === name); });
      document.querySelectorAll('.panel').forEach(function(x){ x.classList.remove('active'); });
      document.getElementById('p-' + name).classList.add('active');
    }

    // ---- lecture video-kind toggle ----
    function syncVideoKind(sel){
      document.getElementById('yt-field').style.display = sel.value === 'youtube' ? 'block' : 'none';
      document.getElementById('file-field').style.display = sel.value === 'file' ? 'block' : 'none';
    }

    // ---- edit mode ----
    // Clicking Edit prefills the tab's form from the row's JSON, switches the
    // form action to /update, relaxes required file inputs, and shows a note.
    document.addEventListener('click', function(e){
      var btn = e.target.closest('.row-actions .edit');
      if (!btn) return;
      var type = btn.dataset.type;
      var data = JSON.parse(btn.dataset.item);
      var form = document.getElementById('form-' + type);

      cancelEdit(type); // reset first so stale state never leaks between edits
      showTab(type);

      form.action = '/admin/content/update';
      var idInput = form.querySelector('input[name=id]');
      idInput.value = data.id;
      idInput.disabled = false;

      // Generic prefill: every non-file input/select/textarea whose name
      // matches a data key.
      form.querySelectorAll('input,select,textarea').forEach(function(el){
        if (!el.name || el.type === 'file' || el.type === 'hidden') return;
        if (el.type === 'checkbox') { el.checked = !!data[el.name]; return; }
        if (data[el.name] != null) el.value = data[el.name];
      });

      // File inputs are optional while editing.
      form.querySelectorAll('input[type=file]').forEach(function(el){ el.required = false; });

      // Type-specific touches.
      if (type === 'lectures') {
        var kindSel = form.querySelector('select[name=video_kind]');
        kindSel.value = data.src_kind === 'file' ? 'file' : 'youtube';
        syncVideoKind(kindSel);
        form.querySelector('input[name=youtube_url]').value =
          data.src_kind === 'youtube' ? (data.src_value || '') : '';
        toggleCurrent(form, 'video', data.src_kind === 'file');
        toggleCurrent(form, 'thumb', !!data.thumb_key);
      }
      if (type === 'documents') toggleCurrent(form, 'file', !!data.file_key);
      if (type === 'products') toggleCurrent(form, 'image', !!data.image_key);
      if (type === 'partners') toggleCurrent(form, 'logo', !!data.logo_key);
      if (type === 'categories') form.querySelector('input[name=slug]').readOnly = true;

      document.getElementById('note-' + type).style.display = 'block';
      var submit = form.querySelector('button[type=submit]');
      submit.textContent = submit.dataset.edit;
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function toggleCurrent(form, which, show){
      var el = form.querySelector('.current-file[data-current=' + which + ']');
      if (el) el.style.display = show ? 'block' : 'none';
    }

    function cancelEdit(type){
      var form = document.getElementById('form-' + type);
      form.reset();
      form.action = '/admin/content';
      var idInput = form.querySelector('input[name=id]');
      idInput.value = '';
      idInput.disabled = true;
      // Restore create-mode required flags.
      if (type === 'documents') form.querySelector('input[name=file]').required = true;
      if (type === 'products') form.querySelector('input[name=image]').required = true;
      if (type === 'categories') form.querySelector('input[name=slug]').readOnly = false;
      form.querySelectorAll('.current-file').forEach(function(el){ el.style.display = 'none'; });
      if (type === 'lectures') syncVideoKind(form.querySelector('select[name=video_kind]'));
      document.getElementById('note-' + type).style.display = 'none';
      var submit = form.querySelector('button[type=submit]');
      submit.textContent = submit.dataset.create;
    }
  </script>
  </body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
