import { Router, json } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';

const router = Router();
router.use(json());

/** POST /api/auth/login — verify against real users table (bcrypt, safe demo-hash handling). */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new HttpError(400, 'Email and password are required');

    const rows = await query<any[]>(
      `SELECT u.user_id, u.full_name, u.email, u.password_hash, u.status, u.phone,
              r.role_name AS role
       FROM users u JOIN roles r ON r.role_id = u.role_id
       WHERE u.email = ? LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    if (rows.length === 0) throw new HttpError(401, 'Invalid email or password');
    const user = rows[0];
    if (user.status !== 'ACTIVE') throw new HttpError(403, 'Account is inactive. Contact the administrator.');

    // Demo-hash placeholders from the SQL dump are never treated as real credentials.
    // The seed script upgrades them to bcrypt; this branch covers unseeded databases.
    const isRealHash = typeof user.password_hash === 'string' && user.password_hash.startsWith('$2');
    const isDemoPlaceholder = typeof user.password_hash === 'string' && /^demo_hash_\d+$/.test(user.password_hash);

    let valid = false;
    if (isRealHash) {
      valid = await bcrypt.compare(String(password), user.password_hash);
    } else if (isDemoPlaceholder) {
      // Transparently accept the demo password ONLY for the dump's placeholder accounts,
      // then upgrade the hash in place so subsequent logins use real bcrypt.
      valid = password === config.demoPassword;
      if (valid) {
        const upgraded = await bcrypt.hash(config.demoPassword, 10);
        await query('UPDATE users SET password_hash = ? WHERE user_id = ?', [upgraded, user.user_id]);
      }
    } else {
      valid = await bcrypt.compare(String(password), user.password_hash).catch(() => false);
    }

    if (!valid) throw new HttpError(401, 'Invalid email or password');

    // Role-specific related info
    let doctor: { doctor_id: number; specialization: string; department_id: number; department: string } | null = null;
    let patient: { patient_id: number; date_of_birth: string | null; gender: string | null } | null = null;

    if (user.role === 'DOCTOR') {
      const d = await query<any[]>(
        `SELECT d.doctor_id, d.specialization, d.department_id, dep.department_name AS department
         FROM doctors d JOIN departments dep ON dep.department_id = d.department_id
         WHERE d.user_id = ? LIMIT 1`, [user.user_id]);
      if (d.length) doctor = d[0];
    } else if (user.role === 'PATIENT') {
      const p = await query<any[]>(
        `SELECT patient_id, date_of_birth, gender FROM patients WHERE user_id = ? LIMIT 1`,
        [user.user_id]);
      if (p.length) patient = p[0];
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, full_name: user.full_name, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        doctor,
        patient,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/auth/me — current user from token (includes doctor/patient info). */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const rows = await query<any[]>(
      `SELECT u.user_id, u.full_name, u.email, u.phone, u.status, r.role_name AS role
       FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.user_id = ? LIMIT 1`,
      [req.user!.user_id]
    );
    if (!rows.length) throw new HttpError(404, 'User not found');
    const user = rows[0];

    if (user.role === 'DOCTOR') {
      const d = await query<any[]>(
        `SELECT d.doctor_id, d.specialization, d.department_id, dep.department_name AS department
         FROM doctors d JOIN departments dep ON dep.department_id = d.department_id
         WHERE d.user_id = ? LIMIT 1`, [user.user_id]);
      if (d.length) user.doctor = d[0];
    } else if (user.role === 'PATIENT') {
      const p = await query<any[]>(
        `SELECT patient_id, date_of_birth, gender FROM patients WHERE user_id = ? LIMIT 1`,
        [user.user_id]);
      if (p.length) user.patient = p[0];
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
