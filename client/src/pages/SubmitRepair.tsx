import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../api';

const problemTypes = ['水电', '家具', '网络', '门窗', '空调', '其他'];

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
  content: { maxWidth: '600px', margin: '0 auto', padding: '24px 16px' },
  breadcrumb: { marginBottom: '16px', fontSize: '14px', color: '#999' },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '24px',
  },
  formGroup: { marginBottom: '20px' },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: '#333',
    fontSize: '14px',
  },
  required: { color: '#ff4d4f', marginLeft: '2px' },
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
    minHeight: '120px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  row: { display: 'flex', gap: '12px' },
  photoArea: {
    border: '2px dashed #d9d9d9',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    color: '#999',
    fontSize: '14px',
  },
  photoGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '12px',
  },
  photoItem: {
    position: 'relative' as const,
    width: '80px',
    height: '80px',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  photoRemove: {
    position: 'absolute' as const,
    top: '2px',
    right: '2px',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '16px',
    color: '#ff4d4f',
    fontSize: '14px',
  },
};

export default function SubmitRepair() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    building: user?.building || '',
    room: user?.room || '',
    problem_type: '',
    description: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.problem_type) {
      setError('请选择问题类型');
      return;
    }

    setLoading(true);
    try {
      await api.post('/repairs', {
        ...form,
        photos,
      });
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>宿舍报修</div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name}</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>退出</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.breadcrumb}>
          <Link to="/" style={{ color: '#1890ff' }}>我的报修</Link> / 提交报修
        </div>

        <div style={styles.card}>
          <h2 style={styles.pageTitle}>提交报修</h2>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  宿舍楼<span style={styles.required}>*</span>
                </label>
                <input
                  style={styles.input}
                  type="text"
                  value={form.building}
                  onChange={(e) => handleChange('building', e.target.value)}
                  placeholder="如：1号楼"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  房间号<span style={styles.required}>*</span>
                </label>
                <input
                  style={styles.input}
                  type="text"
                  value={form.room}
                  onChange={(e) => handleChange('room', e.target.value)}
                  placeholder="如：301"
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                问题类型<span style={styles.required}>*</span>
              </label>
              <select
                style={styles.select}
                value={form.problem_type}
                onChange={(e) => handleChange('problem_type', e.target.value)}
                required
              >
                <option value="">请选择问题类型</option>
                {problemTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                问题描述<span style={styles.required}>*</span>
              </label>
              <textarea
                style={styles.textarea}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="请详细描述问题，方便维修师傅判断..."
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>拍照上传（可选）</label>
              <label
                style={styles.photoArea}
                htmlFor="photo-upload"
                onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = '#1890ff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = '#d9d9d9'; }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <div>点击上传照片（最多5张，单张5MB）</div>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              {photos.length > 0 && (
                <div style={styles.photoGrid}>
                  {photos.map((photo, index) => (
                    <div key={index} style={styles.photoItem}>
                      <img src={photo} alt={`照片${index + 1}`} style={styles.photoImg} />
                      <button
                        type="button"
                        style={styles.photoRemove}
                        onClick={() => removePhoto(index)}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? '提交中...' : '提交报修'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
