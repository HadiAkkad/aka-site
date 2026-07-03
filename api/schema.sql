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

CREATE INDEX IF NOT EXISTS idx_lectures_created ON lectures (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_created ON products (created_at DESC);
