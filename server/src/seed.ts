import db from './db';
import bcrypt from 'bcryptjs';

function seed() {
  console.log('Seeding database...');

  // Check if test users already exist
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('test');
  if (existingUser) {
    console.log('Test data already exists, skipping seed.');
    return;
  }

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, name, role, building, room, phone) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const hashedPassword = bcrypt.hashSync('123456', 10);

  // Create test student
  const studentResult = insertUser.run('test', hashedPassword, '张三', 'student', '1号楼', '301', '13800138001');
  const studentId = studentResult.lastInsertRowid;

  // Create test admin
  insertUser.run('admin', hashedPassword, '李宿管', 'admin', null, null, '13800138000');

  // Create more test students
  const s2 = insertUser.run('student2', hashedPassword, '王五', 'student', '2号楼', '502', '13800138002');
  const s3 = insertUser.run('student3', hashedPassword, '赵六', 'student', '1号楼', '108', '13800138003');

  // Create test repairs
  const insertRepair = db.prepare(`
    INSERT INTO repairs (student_id, building, room, problem_type, description, photos, status, assigned_to, admin_comment, rating, review, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRepair.run(
    studentId, '1号楼', '301', '水电', '宿舍水龙头漏水，拧紧后还是滴水，已经两天了',
    '[]', 'pending', null, null, null, null,
    '2026-06-10 09:30:00', '2026-06-10 09:30:00'
  );

  insertRepair.run(
    s2.lastInsertRowid, '2号楼', '502', '家具', '书桌抽屉坏了关不上，影响日常使用',
    '[]', 'processing', '王师傅', '已安排王师傅上门维修，预计今天下午处理', null, null,
    '2026-06-09 14:20:00', '2026-06-10 10:00:00'
  );

  insertRepair.run(
    s3.lastInsertRowid, '1号楼', '108', '网络', '宿舍网口不通，无法连接有线网络',
    '[]', 'resolved', '张师傅', '已修复网线端口', 5, '师傅很给力，修好了',
    '2026-06-08 16:00:00', '2026-06-09 11:00:00'
  );

  insertRepair.run(
    studentId, '1号楼', '301', '水电', '灯管闪烁，晚上看书很受影响',
    '[]', 'processing', '李师傅', '已派单给李师傅', null, null,
    '2026-06-11 08:00:00', '2026-06-11 09:00:00'
  );

  insertRepair.run(
    s2.lastInsertRowid, '2号楼', '502', '家具', '衣柜门铰链松了，门会自己开',
    '[]', 'resolved', '王师傅', '已更换铰链', 4, '修得不错',
    '2026-06-07 10:30:00', '2026-06-08 15:00:00'
  );

  console.log('Seed data inserted successfully!');
}

seed();
