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

    const insertStmt = db.prepare(
      'INSERT INTO repairs (student_id, building, room, problem_type, description, photos) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const logStmt = db.prepare(
      'INSERT INTO repair_status_logs (repair_id, status, operator_id, operator_name, operator_role, remark) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      const result = insertStmt.run(req.userId!, building, room, problem_type, description, JSON.stringify(photos || []));
      const repairId = result.lastInsertRowid as number;

      const user = db.prepare('SELECT name, role FROM users WHERE id = ?').get(req.userId!) as { name: string; role: string } | undefined;
      logStmt.run(repairId, 'pending', req.userId!, user?.name || '', user?.role || 'student', '提交报修申请');

      return repairId;
    });

    const repairId = transaction();

    const repair = db.prepare('SELECT * FROM repairs WHERE id = ?').get(repairId) as Record<string, unknown>;
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

    // Ensure historical repairs have initial log (auto backfill)
    const existingLogs = db.prepare(
      'SELECT COUNT(*) as cnt FROM repair_status_logs WHERE repair_id = ?'
    ).get(req.params.id) as { cnt: number };

    if (existingLogs.cnt === 0) {
      const backfillStmt = db.prepare(
        'INSERT INTO repair_status_logs (repair_id, status, operator_id, operator_name, operator_role, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      const studentUser = db.prepare('SELECT name, role FROM users WHERE id = ?').get(repair.student_id as number) as { name: string; role: string } | undefined;

      const transaction = db.transaction(() => {
        backfillStmt.run(
          req.params.id, 'pending',
          repair.student_id as number,
          studentUser?.name || '',
          studentUser?.role || 'student',
          '提交报修申请',
          repair.created_at as string
        );

        if (repair.status === 'processing' || repair.status === 'resolved') {
          backfillStmt.run(
            req.params.id, 'processing',
            null, '系统', 'admin',
            '状态变更为：处理中',
            repair.updated_at as string
          );
        }
        if (repair.status === 'resolved') {
          backfillStmt.run(
            req.params.id, 'resolved',
            null, '系统', 'admin',
            '状态变更为：已修好',
            repair.updated_at as string
          );
        }
      });
      transaction();
    }

    // Get status logs
    const logs = db.prepare(
      'SELECT * FROM repair_status_logs WHERE repair_id = ? ORDER BY created_at ASC, id ASC'
    ).all(req.params.id) as Record<string, unknown>[];

    res.json({ repair, student, logs });
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

    const updateStmt = db.prepare(
      'UPDATE repairs SET rating = ?, review = ?, updated_at = ? WHERE id = ?'
    );
    const logStmt = db.prepare(
      'INSERT INTO repair_status_logs (repair_id, status, operator_id, operator_name, operator_role, remark) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      updateStmt.run(rating, review || null, now, req.params.id);

      const user = db.prepare('SELECT name, role FROM users WHERE id = ?').get(req.userId!) as { name: string; role: string } | undefined;
      const remark = review
        ? `完成评价：${rating}星，评价：${review}`
        : `完成评价：${rating}星`;
      logStmt.run(req.params.id, 'resolved', req.userId!, user?.name || '', user?.role || 'student', remark);
    });

    transaction();

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
