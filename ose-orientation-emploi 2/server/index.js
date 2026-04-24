import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { initDb, run, all, get } from './db.js';
import { analyzeYouth } from './analysis.js';
import { sendReferentMail } from './mailer.js';

dotenv.config();
initDb();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch {
    return res.status(401).json({ error: 'Session invalide' });
  }
}

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Identifiants incorrects' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
  res.json({ token, user: { email: user.email, role: user.role } });
});

app.post('/api/youths', upload.single('cv'), async (req, res) => {
  try {
    const b = req.body;
    const analysis = analyzeYouth(b, req.file);
    const secondary = b.secondary_sectors || '[]';
    const blockers = b.blockers || '[]';

    const result = await run(`INSERT INTO youths (
      first_name, last_name, age, phone, email, city, transport, mobility, availability,
      main_sector, secondary_sectors, desired_job, experience, diploma, contract_type, working_time, accepted_hours,
      cv_updated, interview_done, can_pitch, knows_job, available_fast, interview_outfit,
      punctuality, motivation, autonomy, communication, blockers, cv_filename,
      readiness_status, readiness_score, assigned_referent, assigned_email, ai_summary, strengths, improvements,
      recommended_companies, youth_advice, cre_advice, priority_actions
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      b.first_name, b.last_name, b.age, b.phone, b.email, b.city, b.transport, b.mobility, b.availability,
      b.main_sector, secondary, b.desired_job, b.experience, b.diploma, b.contract_type, b.working_time, b.accepted_hours,
      b.cv_updated, b.interview_done, b.can_pitch, b.knows_job, b.available_fast, b.interview_outfit,
      b.punctuality, b.motivation, b.autonomy, b.communication, blockers, req.file?.filename || '',
      analysis.readiness_status, analysis.readiness_score, analysis.assigned_referent, analysis.assigned_email,
      analysis.ai_summary, analysis.strengths, analysis.improvements, analysis.recommended_companies,
      analysis.youth_advice, analysis.cre_advice, analysis.priority_actions
    ]);

    const youth = { ...b, id: result.id };
    const cvPath = req.file ? path.join(__dirname, 'uploads', req.file.filename) : null;
    await sendReferentMail(youth, analysis, cvPath);

    res.status(201).json({ id: result.id, analysis });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la création du dossier jeune' });
  }
});

app.get('/api/youths', auth, async (req, res) => {
  const { sector, referent, status, search } = req.query;
  const filters = [];
  const params = [];
  if (sector) { filters.push('main_sector = ?'); params.push(sector); }
  if (referent) { filters.push('assigned_referent LIKE ?'); params.push(`%${referent}%`); }
  if (status) { filters.push('readiness_status = ?'); params.push(status); }
  if (search) { filters.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const rows = await all(`SELECT * FROM youths ${where} ORDER BY created_at DESC`, params);
  res.json(rows);
});

app.get('/api/stats', auth, async (_, res) => {
  const total = await get('SELECT COUNT(*) as count FROM youths');
  const bySector = await all('SELECT main_sector as label, COUNT(*) as count FROM youths GROUP BY main_sector');
  const byReferent = await all('SELECT assigned_referent as label, COUNT(*) as count FROM youths GROUP BY assigned_referent');
  const byStatus = await all('SELECT readiness_status as label, COUNT(*) as count FROM youths GROUP BY readiness_status');
  const latest = await all('SELECT id, first_name, last_name, main_sector, readiness_status, assigned_referent, readiness_score, created_at FROM youths ORDER BY created_at DESC LIMIT 8');
  res.json({ total: total.count, bySector, byReferent, byStatus, latest });
});

app.patch('/api/youths/:id', auth, async (req, res) => {
  const { internal_comment, readiness_status } = req.body;
  await run('UPDATE youths SET internal_comment = COALESCE(?, internal_comment), readiness_status = COALESCE(?, readiness_status) WHERE id = ?', [internal_comment, readiness_status, req.params.id]);
  res.json({ ok: true });
});

app.get('/api/export.csv', auth, async (_, res) => {
  const rows = await all('SELECT * FROM youths ORDER BY created_at DESC');
  const headers = ['id','first_name','last_name','phone','email','city','main_sector','readiness_status','readiness_score','assigned_referent','created_at'];
  const csv = [headers.join(';'), ...rows.map(r => headers.map(h => String(r[h] ?? '').replaceAll(';', ',')).join(';'))].join('\n');
  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.attachment('jeunes_ose_orientation.csv');
  res.send('\ufeff' + csv);
});

if (fs.existsSync(path.join(__dirname, '../client/dist'))) {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

app.listen(PORT, () => console.log(`API lancée sur http://localhost:${PORT}`));
