import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);


    try {
const res = await fetch('http://127.0.0.1:8000/api/auth/login/', { // الرابط المباشر
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    body: JSON.stringify({ 
        username: username.trim(), 
        password: password
    })
});

     const data = await res.json();

      if (!res.ok) {
          setError(data.detail || 'Login failed');
          setLoading(false);
          return;
      }

      // 🌟 أضيفي هذين السطرين هنا لحفظ التوكنز في ذاكرة المتصفح فوراً:
      if (data.access) {
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
      }

      login(data); 
      
      if (data.is_staff || data.user?.is_staff) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };  
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at bottom, #1e293b 0%, #0f172a 100%)',
      padding: '20px'
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '48px' }}>🛠️</span>
          <h2 style={{ fontSize: '28px', marginTop: '10px', color: '#fff' }}>Web Builder</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '5px' }}>
            Build stunning sites visually
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label>Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or user"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '25px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
            Sign Up
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;