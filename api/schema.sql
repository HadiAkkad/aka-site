CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  message TEXT,
  cv_key TEXT,
  cv_name TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL
);

/* =========================================================================
   Content library — the "posts" managed from /admin/content.
   Each row is one item shown on lectures.html / documentation.html /
   devices.html. Uploaded files (videos, PDFs, images, thumbnails) live in
   R2 under the "content/" prefix; these tables store the metadata + the R2
   key (or, for videos, an external YouTube URL).
   ========================================================================= */

CREATE TABLE IF NOT EXISTS lectures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,        -- presentation | tutorial | webinar
  speaker TEXT,
  date_label TEXT,              -- free text, e.g. "March 2026"
  duration TEXT,               -- e.g. "12:45"
  src_kind TEXT NOT NULL,       -- 'youtube' | 'file'
  src_value TEXT NOT NULL,      -- YouTube URL, or R2 key for an uploaded file
  thumb_key TEXT,              -- optional R2 key for a cover image
  featured INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,        -- profile | certification | manual | catalog
  description TEXT,
  lang TEXT,                   -- e.g. "EN", "AR", "EN/AR"
  size_label TEXT,             -- e.g. "2.4 MB"
  file_key TEXT NOT NULL,       -- R2 key of the PDF
  file_name TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,        -- diagnostic | imaging | endoscopy | ...
  image_key TEXT NOT NULL       -- R2 key of the product photo
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,           -- hospital / project name (English)
  name_ar TEXT,                -- Arabic name (optional)
  year TEXT NOT NULL,           -- timeline marker, e.g. "2024"
  location TEXT,
  location_ar TEXT,
  beds TEXT,                   -- e.g. "150"
  departments TEXT,
  departments_ar TEXT,
  equipment TEXT,
  equipment_ar TEXT
);

CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL,           -- 'manufacturer' (partners grid) | 'ngo' (slideshow)
  name TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  website TEXT,
  logo_key TEXT                -- R2 key (content/...) OR a site path (images/...)
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,    -- machine name, e.g. "dental" (lowercase, dashes)
  label TEXT NOT NULL,          -- English display name, e.g. "Dental Equipment"
  label_ar TEXT                -- Arabic display name
);

/* Rate limiting for the public forms and the admin login. Keys hold a hash of
   the visitor's IP address, never the address itself. Old rows are cleaned up
   automatically by the Worker. */
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL, -- unix seconds
  count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lectures_created ON lectures (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_created ON products (created_at DESC);
