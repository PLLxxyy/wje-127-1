import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/repairs - Submit a new repair request
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { building, room, problem_type, description, photos } = req.body;

    if (!building || !room || !problem_type || !description) {
      res.status(400).json({ error: '请填写完整的报修信息' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO repairs (student_id, building, room, problem_type, description, photos) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.userId!, building, room, problem_type, description, JSON.stringify(photos || []));

    const repair = db.prepare('SELECT * FROM repairs WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
    if (repair && typeof repair.photos === 'string') {
      repair.photos = JSON.parse(repair.photos as string);
    }

    res.json({ repair });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '提交报修失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/repairs - Get current student's repair list
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const repairs = db.prepare(
      'SELECT * FROM repairs WHERE student_id = ? ORDER BY created_at DESC'
    ).all(req.userId!) as Record<string, unknown>[];

    const parsed = repairs.map((r) => ({
      ...r,
      photos: typeof r.photos === 'string' ? JSON.parse(r.photos as string) : r.photos,
    }));

    res.json({ repairs: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取报修列表失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/repairs/:id - Get repair detail
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const repair = db.prepare('SELECT * FROM repairs WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
    if (!repair) {
      res.status(404).json({ error: '报修单不存在' });
      return;
    }

    // Students can only view their own repairs
    if (req.userRole === 'student' && repair.student_id !== req.userId) {
      res.status(403).json({ error: '无权查看该报修单' });
      return;
    }

    if (typeof repair.photos === 'string') {
      repair.photos = JSON.parse(repair.photos as string);
    }

    // Get student info
    const student = db.prepare('SELECT name, username, phone, building, room FROM users WHERE id = ?').get(repair.student_id as number) as Record<string, unknown> | undefined;

    res.json({ repair, student });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取报修详情失败';
    res.status(500).json({ error: message });
  }
});

// PUT /api/repairs/:id/rate - Rate a resolved repair
router.put('/:id/rate', (req: AuthRequest, res: Response) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: '请给出1-5的评分' });
      return;
    }

    const repair = db.prepare('SELECT * FROM repairs WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
    if (!repair) {
      res.status(404).json({ error: '报修单不存在' });
      return;
    }

    if (repair.student_id !== req.userId) {
      res.status(403).json({ error: '只能评价自己的报修单' });
      return;
    }

    if (repair.status !== 'resolved') {
      res.status(400).json({ error: '只能评价已修好的报修单' });
      return;
    }

    if (repair.rating) {
      res.status(400).json({ error: '已经评价过了' });
      return;
    }

    const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ');
    db.prepare(
      'UPDATE repairs SET rating = ?, review = ?, updated_at = ? WHERE id = ?'
    ).run(rating, review || null, now, req.params.id);

    const updated = db.prepare('SELECT * FROM repairs WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    if (typeof updated.photos === 'string') {
      updated.photos = JSON.parse(updated.photos as string);
    }

    res.json({ repair: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '评价失败';
    res.status(500).json({ error: message });
  }
});

export default router;
