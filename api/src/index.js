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
  "http://localhost:8000",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    return new Response("AKA API is running.", { status: 200 });
  },
};

async function handleApply(request, env, origin) {
  try {
    const form = await request.formData();
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

    return json({ ok: true }, 200, origin);
  } catch (err) {
    return json({ ok: false, error: "Server error." }, 500, origin);
  }
}

async function handleContact(request, env, origin) {
  try {
    const form = await request.formData();
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
