import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../api';

interface Repair {
  id: number;
  student_id: number;
  building: string;
  room: string;
  problem_type: string;
  description: string;
  photos: string[];
  status: string;
  assigned_to: string | null;
  admin_comment: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待受理', color: '#faad14', bg: '#fffbe6' },
  processing: { label: '处理中', color: '#1890ff', bg: '#e6f7ff' },
  resolved: { label: '已修好', color: '#52c41a', bg: '#f6ffed' },
};

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f0f2f5' },
  header: {
    background: '#fff',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  logo: { fontSize: '18px', fontWeight: 700, color: '#1890ff' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  userName: { color: '#333', fontWeight: 500, fontSize: '14px' },
  logoutBtn: {
    background: 'transparent',
    color: '#999',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  content: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px' },
  pageTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '20px',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '24px',
  },
  emptyBox: {
    background: '#fff',
    borderRadius: '12px',
    padding: '60px 20px',
    textAlign: 'center' as const,
    color: '#999',
  },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyText: { fontSize: '16px', marginBottom: '8px' },
  emptySub: { fontSize: '14px', color: '#bbb' },
  card: {
    background: '#fff',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    border: '1px solid #f0f0f0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  cardMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: '#999',
    marginBottom: '8px',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  statusTag: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
    fontSize: '13px',
    color: '#faad14',
  },
};

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const res = await api.get('/repairs');
      setRepairs(res.data.repairs);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = (status: string) => statusMap[status] || statusMap.pending;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>宿舍报修</div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name} ({user?.building}{user?.room ? ` ${user.room}室` : ''})</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
            退出
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <h2 style={styles.pageTitle}>我的报修</h2>
        <Link to="/submit" style={{ textDecoration: 'none' }}>
          <div style={styles.submitBtn}>
            + 提交报修
          </div>
        </Link>

        {loading ? (
          <div style={{ ...styles.emptyBox, color: '#1890ff' }}>加载中...</div>
        ) : repairs.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>🔧</div>
            <div style={styles.emptyText}>暂无报修记录</div>
            <div style={styles.emptySub}>点击上方按钮提交您的第一个报修</div>
          </div>
        ) : (
          repairs.map((repair) => (
            <div
              key={repair.id}
              style={styles.card}
              onClick={() => navigate(`/repair/${repair.id}`)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>{repair.problem_type} - {repair.building} {repair.room}室</span>
                <span
                  style={{
                    ...styles.statusTag,
                    color: statusInfo(repair.status).color,
                    background: statusInfo(repair.status).bg,
                  }}
                >
                  {statusInfo(repair.status).label}
                </span>
              </div>
              <div style={styles.cardMeta}>
                <span>提交时间: {repair.created_at}</span>
                {repair.assigned_to && <span>维修员: {repair.assigned_to}</span>}
              </div>
              <div style={styles.cardDesc}>{repair.description}</div>
              {repair.rating && (
                <div style={styles.ratingRow}>
                  {'★'.repeat(repair.rating)}{'☆'.repeat(5 - repair.rating)}
                  {repair.review && <span style={{ color: '#666', marginLeft: '8px' }}>{repair.review}</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
