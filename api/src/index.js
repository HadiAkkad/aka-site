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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
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
    if (url.pathname === "/admin/content/delete" && request.method === "POST") {
      return handleContentDelete(request, env);
    }
    if (url.pathname === "/admin/content") {
      return handleContentAdmin(request, env);
    }
    return new Response("AKA API is running.", { status: 200 });
  },
};

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

    let cvKey = null;
    let cvName = null;
    if (file && typeof file === "object" && file.size > 0) {
      if (file.size > 8 * 1024 * 1024) {
        return json({ ok: false, error: "CV too large (max 8 MB)." }, 400, origin);
      }
      cvName = file.name || "cv";
      const safe = cvName.replace(/[^a-zA-Z0-9._-]/g, "_");
      cvKey = `applications/${Date.now()}-${crypto.randomUUID()}-${safe}`;
      await env.CVS.put(cvKey, file.stream(), {
        httpMetadata: { contentType: file.type || "application/octet-stream" },
      });
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
    const form = await request.formData();
    if (isSpam(form)) return json({ ok: true }, 200, origin);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!name || !email || !message) {
      return json({ ok: false, error: "Missing required fields." }, 400, origin);
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

function checkAuth(request, env) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const pass = decoded.slice(decoded.indexOf(":") + 1);
  return Boolean(env.ADMIN_PASSWORD) && pass === env.ADMIN_PASSWORD;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function handleAdmin(request, env) {
  if (!checkAuth(request, env)) return unauthorized();

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
  if (!checkAuth(request, env)) return unauthorized();
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
  const media = (key) =>
    key ? `${url.origin}/media?key=${encodeURIComponent(key)}` : null;

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
  if (!checkAuth(request, env)) return unauthorized();
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

    return new Response("Unknown content type.", { status: 400 });
  } catch (err) {
    return new Response("Server error: " + err.message, { status: 500 });
  }
}

async function handleContentDelete(request, env) {
  if (!checkAuth(request, env)) return unauthorized();
  try {
    const form = await request.formData();
    const table = String(form.get("table") || "");
    const id = Number(form.get("id"));
    const ALLOWED = { lectures: 1, documents: 1, products: 1 };
    if (!ALLOWED[table] || !id)
      return new Response("Bad request.", { status: 400 });

    const row = await env.DB.prepare(
      `SELECT * FROM ${table} WHERE id = ?`
    ).bind(id).first();

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
      }
      for (const k of keys) {
        if (k) await env.CVS.delete(k);
      }
      await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    }
    return backToAdmin(request);
  } catch (err) {
    return new Response("Server error: " + err.message, { status: 500 });
  }
}

/* ---- Admin content panel (upload UI + existing-post lists) ---- */

const LECTURE_CATS = ["presentation", "tutorial", "webinar"];
const DOC_CATS = ["profile", "certification", "manual", "catalog"];
const PRODUCT_CATS = [
  "diagnostic", "imaging", "endoscopy", "surgical", "orthopedics",
  "monitoring", "cardiology", "neurology", "lab", "sterilization", "hospital",
];

function optionList(values, selected) {
  return values
    .map(
      (v) =>
        `<option value="${esc(v)}"${v === selected ? " selected" : ""}>${esc(v)}</option>`
    )
    .join("");
}

async function handleContentAdmin(request, env) {
  if (!checkAuth(request, env)) return unauthorized();

  const lectures =
    (await env.DB.prepare("SELECT * FROM lectures ORDER BY created_at DESC").all())
      .results || [];
  const documents =
    (await env.DB.prepare("SELECT * FROM documents ORDER BY created_at DESC").all())
      .results || [];
  const products =
    (await env.DB.prepare("SELECT * FROM products ORDER BY created_at DESC").all())
      .results || [];

  const delBtn = (table, id) =>
    `<form method="post" action="/admin/content/delete" class="del" onsubmit="return confirm('Delete this item?')">
       <input type="hidden" name="table" value="${table}">
       <input type="hidden" name="id" value="${id}">
       <button type="submit">Delete</button>
     </form>`;

  const lectureRows = lectures
    .map(
      (l) => `<tr>
      <td>${esc(l.title)}${l.featured ? ' <span class="badge">featured</span>' : ""}</td>
      <td>${esc(l.category)}</td>
      <td>${l.src_kind === "youtube" ? "YouTube" : "File"}</td>
      <td>${esc(l.speaker || "")}</td>
      <td>${delBtn("lectures", l.id)}</td>
    </tr>`
    )
    .join("");

  const docRows = documents
    .map(
      (d) => `<tr>
      <td>${esc(d.title)}</td>
      <td>${esc(d.category)}</td>
      <td>${esc(d.file_name || "")}</td>
      <td>${delBtn("documents", d.id)}</td>
    </tr>`
    )
    .join("");

  const productRows = products
    .map(
      (p) => `<tr>
      <td>${esc(p.name)}</td>
      <td>${esc(p.brand)}</td>
      <td>${esc(p.category)}</td>
      <td>${delBtn("products", p.id)}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AKA — Content manager</title>
  <style>
    :root{--ink:#1d2b36;--line:#dce3e6;--accent:#2f7d6b}
    *{box-sizing:border-box}
    body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:0;color:var(--ink);background:#f5f7f8}
    header{background:var(--ink);color:#fff;padding:1rem 1.5rem}
    header h1{margin:0;font-size:1.15rem}
    header a{color:#bfe3d8;font-size:.85rem;margin-left:1rem}
    main{max-width:960px;margin:0 auto;padding:1.5rem}
    .tabs{display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap}
    .tab{border:1px solid var(--line);background:#fff;padding:.5rem 1rem;border-radius:8px;cursor:pointer;font-size:.9rem}
    .tab.active{background:var(--accent);color:#fff;border-color:var(--accent)}
    .panel{display:none;background:#fff;border:1px solid var(--line);border-radius:12px;padding:1.25rem;margin-bottom:1.5rem}
    .panel.active{display:block}
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
    .del{margin:0}
    .del button{background:#fff;border:1px solid #d9534f;color:#d9534f;padding:.3rem .6rem;border-radius:6px;cursor:pointer;font-size:.8rem}
    .hint{font-size:.75rem;color:#667;margin-top:.25rem}
  </style></head><body>
  <header><h1>AKA — Content manager</h1><a href="/admin">form submissions →</a></header>
  <main>
    <div class="tabs">
      <button class="tab active" data-tab="lectures" type="button">Lectures (${lectures.length})</button>
      <button class="tab" data-tab="documents" type="button">Documents (${documents.length})</button>
      <button class="tab" data-tab="products" type="button">Devices (${products.length})</button>
    </div>

    <!-- LECTURES -->
    <section class="panel active" id="p-lectures">
      <form method="post" action="/admin/content" enctype="multipart/form-data">
        <input type="hidden" name="type" value="lectures">
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
        <select name="video_kind" onchange="document.getElementById('yt-field').style.display=this.value==='youtube'?'block':'none';document.getElementById('file-field').style.display=this.value==='file'?'block':'none'">
          <option value="youtube">YouTube link</option>
          <option value="file">Upload video file</option>
        </select>
        <div id="yt-field">
          <label>YouTube URL</label><input name="youtube_url" placeholder="https://youtube.com/watch?v=...">
        </div>
        <div id="file-field" style="display:none">
          <label>Video file (mp4)</label><input type="file" name="video_file" accept="video/*">
          <p class="hint">Large files may fail to upload — for long videos, prefer a YouTube link.</p>
        </div>
        <label>Cover image (optional — recommended for uploaded files)</label>
        <input type="file" name="thumb_file" accept="image/*">
        <div class="check"><input type="checkbox" name="featured" id="feat"><label for="feat">Feature this at the top of the page</label></div>
        <button class="primary" type="submit">Publish lecture</button>
      </form>
      <h2>Published lectures</h2>
      <table><thead><tr><th>Title</th><th>Category</th><th>Source</th><th>Speaker</th><th></th></tr></thead>
      <tbody>${lectureRows || '<tr><td colspan="5">None yet.</td></tr>'}</tbody></table>
    </section>

    <!-- DOCUMENTS -->
    <section class="panel" id="p-documents">
      <form method="post" action="/admin/content" enctype="multipart/form-data">
        <input type="hidden" name="type" value="documents">
        <label>Title</label><input name="title" required>
        <div class="row">
          <div><label>Category</label><select name="category">${optionList(DOC_CATS)}</select></div>
          <div><label>Language (optional)</label><input name="lang" placeholder="EN / AR"></div>
        </div>
        <label>Description (optional)</label><textarea name="description"></textarea>
        <div class="row">
          <div><label>PDF file</label><input type="file" name="file" accept="application/pdf" required></div>
          <div><label>Size label (optional)</label><input name="size_label" placeholder="2.4 MB"></div>
        </div>
        <button class="primary" type="submit">Publish document</button>
      </form>
      <h2>Published documents</h2>
      <table><thead><tr><th>Title</th><th>Category</th><th>File</th><th></th></tr></thead>
      <tbody>${docRows || '<tr><td colspan="4">None yet.</td></tr>'}</tbody></table>
    </section>

    <!-- PRODUCTS -->
    <section class="panel" id="p-products">
      <form method="post" action="/admin/content" enctype="multipart/form-data">
        <input type="hidden" name="type" value="products">
        <div class="row">
          <div><label>Model name</label><input name="name" required></div>
          <div><label>Brand / manufacturer</label><input name="brand" required></div>
        </div>
        <div class="row">
          <div><label>Category</label><select name="category">${optionList(PRODUCT_CATS)}</select></div>
          <div><label>Product image</label><input type="file" name="image" accept="image/*" required></div>
        </div>
        <button class="primary" type="submit">Publish device</button>
      </form>
      <h2>Published devices</h2>
      <table><thead><tr><th>Name</th><th>Brand</th><th>Category</th><th></th></tr></thead>
      <tbody>${productRows || '<tr><td colspan="4">None yet.</td></tr>'}</tbody></table>
    </section>
  </main>
  <script>
    document.querySelectorAll('.tab').forEach(function(t){
      t.addEventListener('click',function(){
        document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active')});
        document.querySelectorAll('.panel').forEach(function(x){x.classList.remove('active')});
        t.classList.add('active');
        document.getElementById('p-'+t.dataset.tab).classList.add('active');
      });
    });
  </script>
  </body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
