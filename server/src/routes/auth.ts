import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: AuthRequest, res: Response) => {
  try {
    const { username, password, name, building, room, phone } = req.body;

    if (!username || !password || !name) {
      res.status(400).json({ error: '用户名、密码和姓名不能为空' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: '密码长度不能少于6位' });
      return;
    }

    // Check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password, name, role, building, room, phone) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(username, hashedPassword, name, 'student', building || null, room || null, phone || null);

    const token = generateToken(Number(result.lastInsertRowid), 'student');
    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        name,
        role: 'student',
        building,
        room,
        phone,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '注册失败';
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/login
router.post('/login', (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as Record<string, unknown> | undefined;
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password as string);
    if (!valid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken(user.id as number, user.role as string);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        building: user.building,
        room: user.room,
        phone: user.phone,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登录失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/auth/me
router.get('/me', (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, name, role, building, room, phone FROM users WHERE id = ?').get(req.userId!) as Record<string, unknown> | undefined;
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取用户信息失败';
    res.status(500).json({ error: message });
  }
});

export default router;
