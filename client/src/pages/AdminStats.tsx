import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../api';

interface StatsData {
  totalRepairs: number;
  resolvedCount: number;
  avgRating: number;
  todayCount: number;
  statusStats: { status: string; count: number }[];
  buildingStats: { building: string; total: number; pending: number; processing: number; resolved: number }[];
  ratingStats: { building: string; rated_count: number; avg_rating: number }[];
  typeStats: { problem_type: string; count: number }[];
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待受理', color: '#faad14' },
  processing: { label: '处理中', color: '#1890ff' },
  resolved: { label: '已修好', color: '#52c41a' },
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
  navLinkActive: { background: '#e6f7ff', color: '#1890ff' },
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
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  overviewCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    textAlign: 'center' as const,
  },
  overviewValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '4px',
  },
  overviewLabel: {
    fontSize: '14px',
    color: '#999',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '20px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: '2px solid #f0f0f0',
    color: '#666',
    fontWeight: 600,
    fontSize: '13px',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f5f5f5',
    color: '#333',
  },
  bar: {
    height: '20px',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
    minWidth: '2px',
  },
  barContainer: {
    width: '100%',
    height: '20px',
    background: '#f5f5f5',
    borderRadius: '10px',
    overflow: 'hidden' as const,
  },
  typeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  typeName: {
    width: '60px',
    fontSize: '13px',
    color: '#333',
    fontWeight: 500,
    textAlign: 'right' as const,
  },
  typeBarOuter: {
    flex: 1,
    height: '24px',
    background: '#f5f5f5',
    borderRadius: '12px',
    overflow: 'hidden' as const,
  },
  typeBarInner: {
    height: '100%',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '10px',
    fontSize: '12px',
    color: '#fff',
    fontWeight: 600,
    transition: 'width 0.3s ease',
  },
};

const typeColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

export default function AdminStats() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>宿舍报修 - 管理后台</div>
        </div>
        <div style={{ ...styles.content, textAlign: 'center', color: '#999', paddingTop: '60px' }}>加载中...</div>
      </div>
    );
  }

  if (!stats) return null;

  const maxTotal = Math.max(...stats.buildingStats.map((b) => b.total), 1);
  const maxTypeCount = Math.max(...stats.typeStats.map((t) => t.count), 1);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>宿舍报修 - 管理后台</div>
        <div style={styles.nav}>
          <Link to="/admin" style={{ textDecoration: 'none' }}>
            <button style={styles.navLink}>报修管理</button>
          </Link>
          <Link to="/admin/stats" style={{ textDecoration: 'none' }}>
            <button style={{ ...styles.navLink, ...styles.navLinkActive }}>数据统计</button>
          </Link>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name}</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>退出</button>
        </div>
      </div>

      <div style={styles.content}>
        <h2 style={styles.pageTitle}>数据统计</h2>

        {/* Overview cards */}
        <div style={styles.overviewGrid}>
          <div style={styles.overviewCard}>
            <div style={{ ...styles.overviewValue, color: '#1890ff' }}>{stats.totalRepairs}</div>
            <div style={styles.overviewLabel}>总报修数</div>
          </div>
          <div style={styles.overviewCard}>
            <div style={{ ...styles.overviewValue, color: '#52c41a' }}>{stats.resolvedCount}</div>
            <div style={styles.overviewLabel}>已解决</div>
          </div>
          <div style={styles.overviewCard}>
            <div style={{ ...styles.overviewValue, color: '#faad14' }}>
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}
            </div>
            <div style={styles.overviewLabel}>平均评分</div>
          </div>
          <div style={styles.overviewCard}>
            <div style={{ ...styles.overviewValue, color: '#722ed1' }}>{stats.todayCount}</div>
            <div style={styles.overviewLabel}>今日报修</div>
          </div>
        </div>

        <div style={styles.grid2}>
          {/* Building stats table */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}>各楼栋报修统计</div>
            {stats.buildingStats.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>暂无数据</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>楼栋</th>
                    <th style={styles.th}>总数</th>
                    <th style={styles.th}>待受理</th>
                    <th style={styles.th}>处理中</th>
                    <th style={styles.th}>已修好</th>
                    <th style={styles.th}>趋势</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.buildingStats.map((b) => (
                    <tr key={b.building}>
                      <td style={styles.td}>{b.building}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{b.total}</td>
                      <td style={{ ...styles.td, color: '#faad14' }}>{b.pending}</td>
                      <td style={{ ...styles.td, color: '#1890ff' }}>{b.processing}</td>
                      <td style={{ ...styles.td, color: '#52c41a' }}>{b.resolved}</td>
                      <td style={styles.td}>
                        <div style={styles.barContainer}>
                          <div
                            style={{
                              ...styles.bar,
                              width: `${(b.total / maxTotal) * 100}%`,
                              background: 'linear-gradient(90deg, #1890ff, #52c41a)',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Rating stats */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}>各楼栋评分统计</div>
            {stats.ratingStats.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>暂无评分数据</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>楼栋</th>
                    <th style={styles.th}>评价数</th>
                    <th style={styles.th}>平均评分</th>
                    <th style={styles.th}>评分展示</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.ratingStats.map((r) => (
                    <tr key={r.building}>
                      <td style={styles.td}>{r.building}</td>
                      <td style={styles.td}>{r.rated_count}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: '#faad14' }}>
                        {typeof r.avg_rating === 'number' ? r.avg_rating.toFixed(1) : '-'}
                      </td>
                      <td style={{ ...styles.td, color: '#faad14' }}>
                        {typeof r.avg_rating === 'number'
                          ? '★'.repeat(Math.round(r.avg_rating)) + '☆'.repeat(5 - Math.round(r.avg_rating))
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Problem type distribution */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>问题类型分布</div>
          {stats.typeStats.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>暂无数据</div>
          ) : (
            <div>
              {stats.typeStats.map((t, index) => (
                <div key={t.problem_type} style={styles.typeRow}>
                  <span style={styles.typeName}>{t.problem_type}</span>
                  <div style={styles.typeBarOuter}>
                    <div
                      style={{
                        ...styles.typeBarInner,
                        width: `${(t.count / maxTypeCount) * 100}%`,
                        background: typeColors[index % typeColors.length],
                      }}
                    >
                      {t.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
