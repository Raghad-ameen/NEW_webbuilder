import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Shield, ToggleLeft, ToggleRight, LogOut, LayoutGrid, AlertTriangle } from 'lucide-react';

function AdminDashboard() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

const fetchSites = async () => {
    try {
      const token = localStorage.getItem('access_token'); 
      
      const res = await fetch('http://127.0.0.1:8000/api/admin/sites/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSites(data);
      } else {
        setError('Failed to fetch platform websites. Ensure you are logged in as admin.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchSites();
  }, []);

const handleToggleStatus = async (siteId) => {
    try {
      const token = localStorage.getItem('access_token');

      const res = await fetch('http://127.0.0.1:8000/api/admin/toggle-site-status/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ site_id: siteId })
      });

      if (res.ok) {
        const updated = await res.json();
        setSites(sites.map(s => s.id === siteId ? { ...s, is_active: updated.is_active } : s));
      } else {
        alert('Failed to toggle site status');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend');
    }
  };
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <header className="glass" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 40px',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield style={{ color: 'var(--primary)', width: '28px', height: '28px' }} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Platform Admin Panel</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>System Administrator Workspace</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Logged in as: <strong style={{ color: '#fff' }}>{user?.username}</strong>
          </span>
          <button 
            onClick={() => navigate('/')} 
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <LayoutGrid size={15} /> User Workspace
          </button>
          <button 
            onClick={handleLogout} 
            className="btn-danger"
            style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Websites Listing</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            List of all websites currently built on this platform. Admin can suspend (deactivate) or activate sites. Content layouts are hidden to maintain creator privacy.
          </p>
        </div>

        {error && (
          <div className="glass" style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            borderColor: 'var(--danger)',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--danger)',
            marginBottom: '30px'
          }}>
            <AlertTriangle size={24} />
            <div>
              <h4 style={{ fontWeight: 'bold' }}>Access Error</h4>
              <p style={{ fontSize: '14px', marginTop: '3px' }}>{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            Loading platform websites list...
          </div>
        ) : (
          <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {sites.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No websites have been created on this platform yet.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Site Name</th>
                    <th>Subdomain</th>
                    <th>Owner Username</th>
                    <th>Created On</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id}>
                      <td style={{ fontWeight: 'bold' }}>{site.name}</td>
                      <td>
                        <a 
                          href={`/live/${site.subdomain}/`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)', textDecoration: 'none' }}
                        >
                          {site.subdomain}.localhost:8001
                        </a>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          background: 'rgba(255,255,255,0.05)', 
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}>
                          @{site.owner_username}
                        </span>
                      </td>
                      <td>{new Date(site.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${site.is_active ? 'badge-active' : 'badge-inactive'}`}>
                          {site.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleStatus(site.id)}
                          className={site.is_active ? 'btn-danger' : 'btn-primary'}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            minWidth: '120px',
                            justifyContent: 'center'
                          }}
                        >
                          {site.is_active ? (
                            <>
                              <ToggleLeft size={16} /> Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleRight size={16} /> Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
