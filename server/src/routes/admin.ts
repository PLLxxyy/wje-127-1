import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/repairs - Get all repairs with filters
router.get('/repairs', (req: AuthRequest, res: Response) => {
  try {
    const { status, building } = req.query;
    let sql = 'SELECT r.*, u.name as student_name, u.phone as student_phone FROM repairs r JOIN users u ON r.student_id = u.id WHERE 1=1';
    const params: unknown[] = [];

    if (status && status !== 'all') {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (building && building !== 'all') {
      sql += ' AND r.building = ?';
      params.push(building);
    }

    sql += ' ORDER BY r.created_at DESC';

    const repairs = db.prepare(sql).all(...params) as Record<string, unknown>[];
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

// PUT /api/admin/repairs/:id - Update repair (assign, status, comment)
router.put('/repairs/:id', (req: AuthRequest, res: Response) => {
  try {
    const { status, assigned_to, admin_comment } = req.body;
    const repair = db.prepare('SELECT * FROM repairs WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;

    if (!repair) {
      res.status(404).json({ error: '报修单不存在' });
      return;
    }

    const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ');

    // Build update fields dynamically
    const updates: string[] = ['updated_at = ?'];
    const values: unknown[] = [now];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }
    if (admin_comment !== undefined) {
      updates.push('admin_comment = ?');
      values.push(admin_comment);
    }

    values.push(req.params.id);
    db.prepare(`UPDATE repairs SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM repairs WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    if (typeof updated.photos === 'string') {
      updated.photos = JSON.parse(updated.photos as string);
    }

    res.json({ repair: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '更新报修失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/admin/stats - Get statistics
router.get('/stats', (_req: AuthRequest, res: Response) => {
  try {
    // Status distribution
    const statusStats = db.prepare(
      "SELECT status, COUNT(*) as count FROM repairs GROUP BY status"
    ).all() as { status: string; count: number }[];

    // Per building stats
    const buildingStats = db.prepare(
      "SELECT building, COUNT(*) as total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status='processing' THEN 1 ELSE 0 END) as processing, SUM(CASE WHEN status='resolved' THEN 1 ELSE 0 END) as resolved FROM repairs GROUP BY building ORDER BY building"
    ).all() as { building: string; total: number; pending: number; processing: number; resolved: number }[];

    // Rating stats per building
    const ratingStats = db.prepare(
      "SELECT building, COUNT(rating) as rated_count, ROUND(AVG(rating), 1) as avg_rating FROM repairs WHERE rating IS NOT NULL GROUP BY building"
    ).all() as { building: string; rated_count: number; avg_rating: number }[];

    // Overall stats
    const totalRepairs = (db.prepare('SELECT COUNT(*) as count FROM repairs').get() as { count: number }).count;
    const resolvedCount = (db.prepare("SELECT COUNT(*) as count FROM repairs WHERE status = 'resolved'").get() as { count: number }).count;
    const avgRating = (db.prepare('SELECT ROUND(AVG(rating), 1) as avg FROM repairs WHERE rating IS NOT NULL').get() as { avg: number | null }).avg;
    const todayCount = (db.prepare("SELECT COUNT(*) as count FROM repairs WHERE date(created_at) = date('now', 'localtime')").get() as { count: number }).count;

    // Problem type distribution
    const typeStats = db.prepare(
      "SELECT problem_type, COUNT(*) as count FROM repairs GROUP BY problem_type ORDER BY count DESC"
    ).all() as { problem_type: string; count: number }[];

    res.json({
      totalRepairs,
      resolvedCount,
      avgRating: avgRating || 0,
      todayCount,
      statusStats,
      buildingStats,
      ratingStats,
      typeStats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取统计数据失败';
    res.status(500).json({ error: message });
  }
});

export default router;
