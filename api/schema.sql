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
