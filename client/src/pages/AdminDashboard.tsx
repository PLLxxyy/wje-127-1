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
  student_name: string;
  student_phone: string | null;
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
  nav: { display: 'flex', gap: '8px' },
  navLink: {
    padding: '6px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    background: 'transparent',
    color: '#666',
    border: 'none',
  },
  navLinkActive: {
    background: '#e6f7ff',
    color: '#1890ff',
  },
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
  content: { maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' },
  pageTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '20px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  filterBtn: {
    padding: '8px 20px',
    borderRadius: '20px',
    border: '1px solid #d9d9d9',
    background: '#fff',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    background: '#1890ff',
    color: '#fff',
    border: '1px solid #1890ff',
  },
  select: {
    padding: '8px 14px',
    borderRadius: '20px',
    border: '1px solid #d9d9d9',
    background: '#fff',
    color: '#333',
    fontSize: '14px',
    outline: 'none',
  },
  emptyBox: {
    background: '#fff',
    borderRadius: '12px',
    padding: '60px 20px',
    textAlign: 'center' as const,
    color: '#999',
  },
  card: {
    background: '#fff',
    borderRadius: '10px',
    padding: '18px 20px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    border: '1px solid #f0f0f0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
  },
  cardMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#999',
    marginBottom: '6px',
    flexWrap: 'wrap' as const,
  },
  cardDesc: {
    fontSize: '13px',
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
    whiteSpace: 'nowrap' as const,
  },
  cardBadges: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  badge: {
    fontSize: '11px',
    padding: '1px 8px',
    borderRadius: '10px',
    background: '#f5f5f5',
    color: '#666',
  },
};

const buildings = ['全部楼栋', '1号楼', '2号楼', '3号楼', '4号楼', '5号楼'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');

  useEffect(() => {
    fetchRepairs();
  }, [statusFilter, buildingFilter]);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (buildingFilter !== 'all') params.building = buildingFilter;
      const res = await api.get('/admin/repairs', { params });
      setRepairs(res.data.repairs);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = (status: string) => statusMap[status] || statusMap.pending;

  const counts = {
    all: repairs.length,
    pending: repairs.filter((r) => r.status === 'pending').length,
    processing: repairs.filter((r) => r.status === 'processing').length,
    resolved: repairs.filter((r) => r.status === 'resolved').length,
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>宿舍报修 - 管理后台</div>
        <div style={styles.nav}>
          <Link to="/admin" style={{ textDecoration: 'none' }}>
            <button style={{ ...styles.navLink, ...styles.navLinkActive }}>报修管理</button>
          </Link>
          <Link to="/admin/stats" style={{ textDecoration: 'none' }}>
            <button style={styles.navLink}>数据统计</button>
          </Link>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name}</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>退出</button>
        </div>
      </div>

      <div style={styles.content}>
        <h2 style={styles.pageTitle}>报修管理</h2>

        <div style={styles.filters}>
          {(['all', 'pending', 'processing', 'resolved'] as const).map((s) => {
            const label = s === 'all' ? '全部' : statusMap[s].label;
            return (
              <button
                key={s}
                style={{
                  ...styles.filterBtn,
                  ...(statusFilter === s ? styles.filterBtnActive : {}),
                }}
                onClick={() => setStatusFilter(s)}
              >
                {label} {s !== 'all' ? `(${repairs.filter((r) => r.status === s).length})` : ''}
              </button>
            );
          })}
          <select
            style={styles.select}
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            {buildings.map((b) => (
              <option key={b} value={b === '全部楼栋' ? 'all' : b}>{b}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ ...styles.emptyBox, color: '#1890ff' }}>加载中...</div>
        ) : repairs.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
            <div>暂无报修记录</div>
          </div>
        ) : (
          repairs.map((repair) => (
            <div
              key={repair.id}
              style={styles.card}
              onClick={() => navigate(`/admin/repair/${repair.id}`)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.cardTitle}>
                    {repair.problem_type} - {repair.building} {repair.room}室
                  </span>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    报修人：{repair.student_name}
                  </div>
                </div>
                <div style={styles.cardBadges}>
                  {repair.photos && repair.photos.length > 0 && (
                    <span style={styles.badge}>有照片</span>
                  )}
                  {repair.rating && (
                    <span style={{ ...styles.badge, color: '#faad14' }}>
                      {'★'.repeat(repair.rating)}
                    </span>
                  )}
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
              </div>
              <div style={styles.cardMeta}>
                <span>提交：{repair.created_at}</span>
                {repair.assigned_to && <span>维修员：{repair.assigned_to}</span>}
                {repair.student_phone && <span>电话：{repair.student_phone}</span>}
              </div>
              <div style={styles.cardDesc}>{repair.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
