import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../api';

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    textAlign: 'center' as const,
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center' as const,
    color: '#666',
    marginBottom: '30px',
    fontSize: '14px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  formGroup: {
    marginBottom: '16px',
    flex: 1,
  },
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
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
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
  footer: {
    textAlign: 'center' as const,
    marginTop: '20px',
    fontSize: '14px',
    color: '#666',
  },
  link: {
    color: '#1890ff',
    marginLeft: '4px',
  },
};

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    building: '',
    room: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (form.password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username: form.username,
        password: form.password,
        name: form.name,
        building: form.building,
        room: form.room,
        phone: form.phone,
      });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>注册新账号</h1>
        <p style={styles.subtitle}>学生注册后即可提交报修</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>用户名 *</label>
            <input
              style={styles.input}
              type="text"
              value={form.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="设置登录用户名"
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>真实姓名 *</label>
            <input
              style={styles.input}
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="输入真实姓名"
              required
            />
          </div>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>密码 *</label>
              <input
                style={styles.input}
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="至少6位"
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>确认密码 *</label>
              <input
                style={styles.input}
                type="password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="再次输入密码"
                required
              />
            </div>
          </div>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>宿舍楼</label>
              <input
                style={styles.input}
                type="text"
                value={form.building}
                onChange={(e) => handleChange('building', e.target.value)}
                placeholder="如：1号楼"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>房间号</label>
              <input
                style={styles.input}
                type="text"
                value={form.room}
                onChange={(e) => handleChange('room', e.target.value)}
                placeholder="如：301"
              />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>手机号</label>
            <input
              style={styles.input}
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="方便维修师傅联系"
            />
          </div>
          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={styles.footer}>
          已有账号？
          <Link to="/login" style={styles.link}>立即登录</Link>
        </div>
      </div>
    </div>
  );
}
