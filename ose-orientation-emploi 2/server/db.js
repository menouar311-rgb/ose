import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

sqlite3.verbose();
export const db = new sqlite3.Database('./ose_orientation.db');

export function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS youths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      age INTEGER,
      phone TEXT,
      email TEXT,
      city TEXT,
      transport TEXT,
      mobility TEXT,
      availability TEXT,
      main_sector TEXT,
      secondary_sectors TEXT,
      desired_job TEXT,
      experience TEXT,
      diploma TEXT,
      contract_type TEXT,
      working_time TEXT,
      accepted_hours TEXT,
      cv_updated TEXT,
      interview_done TEXT,
      can_pitch TEXT,
      knows_job TEXT,
      available_fast TEXT,
      interview_outfit TEXT,
      punctuality INTEGER,
      motivation INTEGER,
      autonomy INTEGER,
      communication INTEGER,
      blockers TEXT,
      cv_filename TEXT,
      readiness_status TEXT,
      readiness_score INTEGER,
      assigned_referent TEXT,
      assigned_email TEXT,
      ai_summary TEXT,
      strengths TEXT,
      improvements TEXT,
      recommended_companies TEXT,
      youth_advice TEXT,
      cre_advice TEXT,
      priority_actions TEXT,
      internal_comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migration douce si une ancienne base SQLite existe déjà
    ['youth_advice TEXT','cre_advice TEXT','priority_actions TEXT'].forEach(col => {
      db.run(`ALTER TABLE youths ADD COLUMN ${col}`, () => {});
    });

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ose.fr';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.run(`INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, 'admin')`, [adminEmail, hash]);
  });
}

export const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve({ id: this.lastID, changes: this.changes });
  });
});

export const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

export const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
