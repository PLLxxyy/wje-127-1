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

const statusSteps = [
  { key: 'pending', label: '已提交' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已修好' },
];

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
  content: { maxWidth: '700px', margin: '0 auto', padding: '24px 16px' },
  breadcrumb: { marginBottom: '16px', fontSize: '14px', color: '#999' },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '16px',
  },
  statusBig: {
    display: 'inline-block',
    padding: '4px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: 600,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '16px',
  },
  infoItem: { fontSize: '14px' },
  infoLabel: { color: '#999', marginBottom: '4px' },
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
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px',
  },
  timeline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 0',
  },
  step: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  stepDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
  },
  stepLabel: { fontSize: '12px', color: '#999' },
  stepLine: {
    flex: 1,
    height: '2px',
    margin: '0 -10px',
    marginBottom: '20px',
  },
  commentBox: {
    background: '#e6f7ff',
    border: '1px solid #91d5ff',
    borderRadius: '8px',
    padding: '14px',
    marginTop: '12px',
    fontSize: '14px',
    color: '#333',
  },
  commentLabel: {
    fontWeight: 600,
    color: '#1890ff',
    marginBottom: '6px',
    fontSize: '13px',
  },
  ratingSection: { marginTop: '8px' },
  starRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  star: {
    fontSize: '28px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
    background: 'none',
    border: 'none',
    padding: '4px',
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
    marginBottom: '12px',
  },
  submitBtn: {
    padding: '10px 28px',
    background: '#52c41a',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  ratingDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#faad14',
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

export default function RepairDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalPhoto, setModalPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchRepair();
  }, [id]);

  const fetchRepair = async () => {
    try {
      const res = await api.get(`/repairs/${id}`);
      setRepair(res.data.repair);
      setStudentInfo(res.data.student);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/repairs/${id}/rate`, { rating, review });
      setRepair(res.data.repair);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr.response?.data?.error || '评价失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>宿舍报修</div>
        </div>
        <div style={{ ...styles.content, textAlign: 'center', color: '#999', paddingTop: '60px' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!repair) return null;

  const statusInfo = statusMap[repair.status] || statusMap.pending;
  const currentStepIndex = statusSteps.findIndex((s) => s.key === repair.status);

  return (
    <div style={styles.container}>
      {modalPhoto && (
        <div style={styles.photoModal} onClick={() => setModalPhoto(null)}>
          <img src={modalPhoto} alt="放大查看" style={styles.modalImg} />
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.logo}>宿舍报修</div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name}</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>退出</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.breadcrumb}>
          <Link to="/" style={{ color: '#1890ff' }}>我的报修</Link> / 报修详情 #{repair.id}
        </div>

        {/* Status timeline */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
              {repair.problem_type}报修
            </span>
            <span style={{ ...styles.statusBig, color: statusInfo.color, background: statusInfo.bg }}>
              {statusInfo.label}
            </span>
          </div>

          <div style={styles.timeline}>
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={styles.step}>
                    <div
                      style={{
                        ...styles.stepDot,
                        background: isActive ? (isCurrent ? statusInfo.color : '#52c41a') : '#e8e8e8',
                      }}
                    >
                      {index < currentStepIndex ? '✓' : index + 1}
                    </div>
                    <span style={{ ...styles.stepLabel, color: isActive ? '#333' : '#bbb', fontWeight: isCurrent ? 600 : 400 }}>
                      {step.label}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      style={{
                        ...styles.stepLine,
                        background: index < currentStepIndex ? '#52c41a' : '#e8e8e8',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Repair info */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>报修信息</div>
          <div style={styles.infoGrid}>
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
            {repair.assigned_to && (
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>维修员</div>
                <div style={styles.infoValue}>{repair.assigned_to}</div>
              </div>
            )}
            {studentInfo?.phone && (
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>联系电话</div>
                <div style={styles.infoValue}>{studentInfo.phone}</div>
              </div>
            )}
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
        </div>

        {/* Admin comment */}
        {repair.admin_comment && (
          <div style={styles.card}>
            <div style={styles.commentBox}>
              <div style={styles.commentLabel}>处理意见</div>
              {repair.admin_comment}
            </div>
          </div>
        )}

        {/* Rating section */}
        {repair.status === 'resolved' && (
          <div style={styles.card}>
            <div style={styles.sectionTitle}>服务评价</div>
            {repair.rating ? (
              <div>
                <div style={styles.ratingDisplay}>
                  {'★'.repeat(repair.rating)}{'☆'.repeat(5 - repair.rating)}
                  <span style={{ color: '#333', marginLeft: '8px' }}>{repair.rating} 分</span>
                </div>
                {repair.review && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>{repair.review}</div>
                )}
              </div>
            ) : (
              <div style={styles.ratingSection}>
                <div style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      style={{
                        ...styles.star,
                        transform: star <= (hoverRating || rating) ? 'scale(1.2)' : 'scale(1)',
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      {star <= (hoverRating || rating) ? '★' : '☆'}
                    </button>
                  ))}
                </div>
                <textarea
                  style={styles.textarea}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="写一句评价吧（可选）"
                />
                <button
                  style={{ ...styles.submitBtn, opacity: !rating || submitting ? 0.6 : 1 }}
                  disabled={!rating || submitting}
                  onClick={handleRate}
                >
                  {submitting ? '提交中...' : '提交评价'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
