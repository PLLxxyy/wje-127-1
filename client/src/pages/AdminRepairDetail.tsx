import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

interface StudentInfo {
  name: string;
  username: string;
  phone: string | null;
  building: string;
  room: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待受理', color: '#faad14', bg: '#fffbe6' },
  processing: { label: '处理中', color: '#1890ff', bg: '#e6f7ff' },
  resolved: { label: '已修好', color: '#52c41a', bg: '#f6ffed' },
};

const repairmen = ['王师傅', '张师傅', '李师傅', '赵师傅', '刘师傅'];

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
  content: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px' },
  breadcrumb: { marginBottom: '16px', fontSize: '14px', color: '#999' },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  infoItem: { fontSize: '14px' },
  infoLabel: { color: '#999', marginBottom: '4px', fontSize: '13px' },
  infoValue: { color: '#333', fontWeight: 500 },
  description: {
    marginTop: '16px',
    padding: '16px',
    background: '#fafafa',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#333',
    whiteSpace: 'pre-wrap' as const,
  },
  photoGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '12px',
  },
  photo: {
    width: '120px',
    height: '120px',
    objectFit: 'cover' as const,
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid #f0f0f0',
  },
  statusBig: {
    display: 'inline-block',
    padding: '4px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: 600,
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    alignItems: 'flex-end',
  },
  formGroup: { flex: 1 },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 500,
    color: '#333',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    background: '#fff',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    marginBottom: '16px',
  },
  btnRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  btn: {
    padding: '10px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
  btnPrimary: { background: '#1890ff', color: '#fff' },
  btnSuccess: { background: '#52c41a', color: '#fff' },
  btnWarning: { background: '#faad14', color: '#fff' },
  error: {
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '16px',
    color: '#ff4d4f',
    fontSize: '14px',
  },
  success: {
    background: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '16px',
    color: '#52c41a',
    fontSize: '14px',
  },
  commentBox: {
    background: '#e6f7ff',
    border: '1px solid #91d5ff',
    borderRadius: '8px',
    padding: '14px',
    marginTop: '12px',
    fontSize: '14px',
  },
  photoModal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    cursor: 'pointer',
  },
  modalImg: {
    maxWidth: '90%',
    maxHeight: '90vh',
    objectFit: 'contain' as const,
    borderRadius: '8px',
  },
};

export default function AdminRepairDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignedTo, setAssignedTo] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalPhoto, setModalPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchRepair();
  }, [id]);

  const fetchRepair = async () => {
    try {
      const res = await api.get(`/repairs/${id}`);
      setRepair(res.data.repair);
      setStudentInfo(res.data.student);
      setAssignedTo(res.data.repair.assigned_to || '');
      setAdminComment(res.data.repair.admin_comment || '');
      setNewStatus(res.data.repair.status);
    } catch {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setError('');
    setSuccess('');
    try {
      const payload: Record<string, string> = {};
      if (newStatus !== repair!.status) payload.status = newStatus;
      if (assignedTo !== (repair!.assigned_to || '')) payload.assigned_to = assignedTo;
      if (adminComment !== (repair!.admin_comment || '')) payload.admin_comment = adminComment;

      if (Object.keys(payload).length === 0) {
        setError('没有需要更新的内容');
        return;
      }

      const res = await api.put(`/admin/repairs/${id}`, payload);
      setRepair(res.data.repair);
      setSuccess('更新成功');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || '更新失败');
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

  if (!repair) return null;

  const statusInfo = statusMap[repair.status] || statusMap.pending;

  return (
    <div style={styles.container}>
      {modalPhoto && (
        <div style={styles.photoModal} onClick={() => setModalPhoto(null)}>
          <img src={modalPhoto} alt="放大查看" style={styles.modalImg} />
        </div>
      )}

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
        <div style={styles.breadcrumb}>
          <Link to="/admin" style={{ color: '#1890ff' }}>报修管理</Link> / 报修详情 #{repair.id}
        </div>

        {/* Repair info */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>
              {repair.problem_type}报修 #{repair.id}
            </span>
            <span style={{ ...styles.statusBig, color: statusInfo.color, background: statusInfo.bg }}>
              {statusInfo.label}
            </span>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>报修人</div>
              <div style={styles.infoValue}>{studentInfo?.name || '-'}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>联系电话</div>
              <div style={styles.infoValue}>{studentInfo?.phone || '-'}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>宿舍楼</div>
              <div style={styles.infoValue}>{repair.building}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>房间号</div>
              <div style={styles.infoValue}>{repair.room}室</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>问题类型</div>
              <div style={styles.infoValue}>{repair.problem_type}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>提交时间</div>
              <div style={styles.infoValue}>{repair.created_at}</div>
            </div>
          </div>

          <div style={styles.description}>{repair.description}</div>

          {repair.photos && repair.photos.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={styles.infoLabel}>现场照片</div>
              <div style={styles.photoGrid}>
                {repair.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`照片${index + 1}`}
                    style={styles.photo}
                    onClick={() => setModalPhoto(photo)}
                  />
                ))}
              </div>
            </div>
          )}

          {repair.rating && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#fffbe6', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>学生评价</div>
              <span style={{ color: '#faad14', fontSize: '16px' }}>
                {'★'.repeat(repair.rating)}{'☆'.repeat(5 - repair.rating)}
              </span>
              {repair.review && (
                <span style={{ marginLeft: '8px', color: '#333', fontSize: '14px' }}>{repair.review}</span>
              )}
            </div>
          )}
        </div>

        {/* Action card */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>处理操作</div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>处理状态</label>
              <select
                style={styles.select}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="pending">待受理</option>
                <option value="processing">处理中</option>
                <option value="resolved">已修好</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>指派维修员</label>
              <select
                style={styles.select}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">未指派</option>
                {repairmen.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>处理意见</label>
            <textarea
              style={styles.textarea}
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="输入处理意见或备注（学生可见）"
            />
          </div>

          <div style={styles.btnRow}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleUpdate}
            >
              保存更新
            </button>
            {repair.status === 'pending' && (
              <button
                style={{ ...styles.btn, ...styles.btnSuccess }}
                onClick={() => {
                  setNewStatus('processing');
                  setTimeout(() => handleUpdate(), 0);
                }}
              >
                开始处理
              </button>
            )}
            {repair.status === 'processing' && (
              <button
                style={{ ...styles.btn, ...styles.btnWarning }}
                onClick={() => {
                  setNewStatus('resolved');
                  setTimeout(() => handleUpdate(), 0);
                }}
              >
                标记已修好
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
