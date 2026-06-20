import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { TEMPLATES } from '../utils/TemplateData';
import { 
  Plus, ExternalLink, Edit, Trash2, Mail, LayoutGrid, LogOut, ShieldAlert,
  Globe, Clock, Layers, Eye, HelpCircle, CheckCircle, FileText
} from 'lucide-react';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sites');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('saas');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('all');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [siteToDelete, setSiteToDelete] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);

  useEffect(() => {
    // التحقق مما إذا كان المستخدم قد تم طرده وتحويله من البيلدر بسبب الحظر
    if (location.state?.showSuspendedModal) {
      setIsSuspendedModalOpen(true);
      
      // تنظيف الـ state الخاصة بالـ router حتى لا تظهر المودال مجدداً إذا عمل المستخدم Refresh للداشبورد
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const fetchSites = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/sites/', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const baseUrl = selectedSiteFilter === 'all' 
        ? 'http://127.0.0.1:8000/api/submissions/' 
        : `http://127.0.0.1:8000/api/submissions/?site_id=${selectedSiteFilter}`;
        
      const res = await fetch(baseUrl, {
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissions();
    }
  }, [activeTab, selectedSiteFilter]);

  const handleCreateSite = async (e) => {
    e.preventDefault();
    setCreateError('');
    
    if (!newSiteName.trim()) {
      setCreateError('Site Name is required');
      return;
    }

    setCreating(true);
    try {
      const templateObj = TEMPLATES.find(t => t.id === selectedTemplate);
      const theme = templateObj ? templateObj.theme : {};
      
      const payload = {
        name: newSiteName,
        subdomain: newSubdomain.trim() || undefined,
        theme: theme,
        is_published: false
      };

      const res = await fetch('http://127.0.0.1:8000/api/sites/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const siteData = await res.json();
        
        if (templateObj && siteData.pages && siteData.pages.length > 0) {
          const homePage = siteData.pages[0];
          const templateHome = templateObj.pages.find(p => p.slug === 'home');
          if (templateHome) {
            await fetch(`http://127.0.0.1:8000/api/pages/${homePage.id}/`, {
              method: 'PATCH',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                layout: templateHome.layout
              })
            });
          }
        }
        
        setNewSiteName('');
        setNewSubdomain('');
        setShowCreateModal(false);
        
        fetchSites();
        navigate(`/builder/${siteData.id}`);
      } else {
        const errData = await res.json();
        setCreateError(errData.subdomain ? 'This subdomain is already taken.' : 'Failed to create site.');
      }
    } catch (err) {
      console.error(err);
      setCreateError('Network error occurred.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSite = (site) => {
    setSiteToDelete(site);
    setShowDeleteModal(true);
  };

  // دالة 2: يتم استدعاؤها فقط عند الضغط على زر "حذف نهائي" داخل المودال
  const handleConfirmDelete = async () => {
    if (!siteToDelete) return;
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/sites/${siteToDelete.id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        setSites(sites.filter(s => s.id !== siteToDelete.id));
        setShowDeleteModal(false);
        setSiteToDelete(null);
      } else {
        alert('Failed to delete site.');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🛠️</span>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', tracking: '-0.025em' }}>Antigravity Web</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Welcome, @{user?.username}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            className={`btn ${activeTab === 'sites' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('sites')}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}
          >
            <LayoutGrid size={16} /> My Websites
          </button>
          <button 
            className={`btn ${activeTab === 'submissions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('submissions')}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}
          >
            <Mail size={16} /> Submissions
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user?.is_staff && (
            <button 
              onClick={() => navigate('/admin')} 
              className="btn-secondary"
              style={{
                borderColor: 'var(--warning)', 
                color: 'var(--warning)',
                padding: '8px 14px', 
                fontSize: '13px'
              }}
            >
              <ShieldAlert size={15} /> Platform Admin
            </button>
          )}
          <button 
            onClick={handleLogout} 
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </header>

      <main style={{ padding: '40px 60px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {activeTab === 'sites' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '35px'
            }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: '800' }}>My Design Projects</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  Create and manage your collection of responsive visual websites.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ padding: '12px 20px', fontWeight: 'bold' }}>
                <Plus size={18} /> New Website
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
                Loading your design templates...
              </div>
            ) : sites.length === 0 ? (
              <div className="glass" style={{
                textAlign: 'center',
                padding: '80px 40px',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border)'
              }}>
                <Globe size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No Websites Yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 25px' }}>
                  You don't have any websites in your workspace. Start with a pre-built template or custom layout!
                </p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  <Plus size={16} /> Create First Site
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '30px'
              }}>
                {sites.map((site) => (
                  <div key={site.id} className="glass glass-hover" style={{
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '160px',
                      background: site.theme?.backgroundColor || 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <div style={{ fontSize: '64px' }}>
                        {site.subdomain?.includes('saas') ? '🚀' : site.subdomain?.includes('portfolio') ? '🎨' : site.subdomain?.includes('rest') ? '🍔' : '🌐'}
                      </div>
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        display: 'flex',
                        gap: '6px'
                      }}>
                        <span className={`badge ${site.is_published ? 'badge-active' : 'badge-inactive'}`} style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                          {site.is_published ? 'Published' : 'Draft'}
                        </span>
                        {!site.is_active && (
                          <span className="badge badge-inactive" style={{ background: '#f43f5e', color: '#fff' }}>
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{site.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', flexGrow: 1, marginBottom: '20px' }}>
                        {site.description || 'No description provided. Click edit to build your visual canvas layout.'}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '15px',
                        marginBottom: '15px'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={13} /> {site.subdomain}.localhost:8000
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {new Date(site.updated_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => navigate(`/builder/${site.id}`)}
                          className="btn-primary"
                          style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }}
                        >
                          <Edit size={14} /> Open Builder
                        </button>
                        
                        {site.is_published && site.is_active && (
                          <a 
                            href={`/live/${site.subdomain}/`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '8px 12px', fontSize: '13px', textDecoration: 'none' }}
                          >
                            <ExternalLink size={14} /> Live
                          </a>
                        )}

                        <button 
                          onClick={() => handleDeleteSite(site)}
                          className="btn-secondary"
                          style={{ padding: '8px', color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '35px'
            }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: '800' }}>Contact Form Submissions</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  Manage leads and inquiries captured from your published sites.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Filter by site:</span>
                <select
                  value={selectedSiteFilter}
                  onChange={(e) => setSelectedSiteFilter(e.target.value)}
                  style={{ width: '200px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)' }}
                >
                  <option value="all">All Websites</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {submissionsLoading ? (
              <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
                Loading submission logs...
              </div>
            ) : submissions.length === 0 ? (
              <div className="glass" style={{
                textAlign: 'center',
                padding: '80px 40px',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border)'
              }}>
                <Mail size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No Submissions Yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                  Publish a website containing a contact form element, submit a request on the live site, and responses will appear here.
                </p>
              </div>
            ) : (
              <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Sender Name</th>
                      <th>Email Address</th>
                      <th>Message</th>
                      <th>Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 'bold' }}>{sub.name}</td>
                        <td>
                          <a href={`mailto:${sub.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                            {sub.email}
                          </a>
                        </td>
                        <td style={{ whiteSpace: 'pre-line', maxWidth: '400px', lineHeight: '1.4' }}>{sub.message}</td>
                        <td>{new Date(sub.submitted_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

{/* ⬇️ Delete Confirmation Modal ⬇️ */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          {/* Backdrop click to close */}
          <div 
            style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }} 
            onClick={() => { setShowDeleteModal(false); setSiteToDelete(null); }}
          ></div>

          {/* Modal Content */}
          <div className="glass" style={{
            width: '100%',
            maxWidth: '450px',
            padding: '35px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(244, 63, 94, 0.2)', // Subtle red border
            textAlign: 'center',
            backgroundColor: '#1e293b',
            direction: 'ltr', // English layout direction
            fontFamily: 'Inter, system-ui, sans-serif' // Standard English UI font
          }}>
            
            {/* Warning Icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                color: '#f43f5e',
                marginBottom: '15px'
              }}>
                <Trash2 size={28} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#f43f5e' }}>
                Delete Site Permanently
              </h3>
            </div>

            {/* Confirmation Text */}
            <div style={{ marginBottom: '25px' }}>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
                Are you sure you want to delete <strong style={{ color: '#fff' }}>"{siteToDelete?.name}"</strong>?
                <br />
                <span style={{ fontSize: '12px', color: '#f43f5e', display: 'block', marginTop: '8px' }}>
                  ⚠️ Warning: This action is final. All databases, files, and configurations will be permanently removed.
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#fff',
                  background: 'linear-gradient(to right, #f43f5e, #e11d48)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.2)'
                }}
                onClick={handleConfirmDelete}
              >
                Delete Site
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
                onClick={() => { setShowDeleteModal(false); setSiteToDelete(null); }}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* مودال الحظر المعدل بالـ Inline Styles المتوافقة مع الـ Dashboard */}
      {isSuspendedModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropBlur: '4px'
        }}>
          {/* Backdrop click to close */}
          <div 
            style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }} 
            onClick={() => setIsSuspendedModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="glass" style={{
            width: '100%',
            maxWidth: '450px',
            padding: '35px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(244, 63, 94, 0.3)', // Rose border highlight
            textAlign: 'center',
            backgroundColor: '#1e293b'
          }}>
            
            {/* Header & Warning Icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                color: '#f43f5e',
                marginBottom: '15px'
              }}>
                <svg style={{ width: '32px', height: '32px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fb7185', fontFamily: 'Cairo, sans-serif' }}>
                Notice: Platform Suspended
              </h3>
            </div>

            {/* Modal Body */}
            <div style={{ marginBottom: '25px' }}>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', fontFamily: 'Cairo, sans-serif' }}>
                Sorry, this website has been temporarily frozen and suspended by the platform administration. 
                You cannot access the builder or modify any components. If you believe this is a mistake, please contact support.
              </p>
            </div>

            {/* Action Button */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
              <button
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#fff',
                  background: 'linear-gradient(to right, #f43f5e, #e11d48)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif',
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.2)'
                }}
                type="button"
                onClick={() => setIsSuspendedModalOpen(false)}
              >
                I Understand
              </button>
            </div>

          </div>
        </div>
      )}

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass" style={{
            width: '100%',
            maxWidth: '650px',
            padding: '35px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Create New Website</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '25px' }}>
              Set up your site parameters and choose a design template.
            </p>

            {createError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--danger)',
                border: '1px solid var(--danger)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSite}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div>
                  <label>Website Name</label>
                  <input
                    type="text"
                    required
                    value={newSiteName}
                    onChange={(e) => {
                      setNewSiteName(e.target.value);
                      if (!newSubdomain) {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                        setNewSubdomain(slug);
                      }
                    }}
                    placeholder="My Startup Site"
                    autoFocus
                  />
                </div>
                <div>
                  <label>Subdomain Slug</label>
                  <input
                    type="text"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="mystartupsite"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Will be served at: <code>{newSubdomain || 'slug'}.localhost:8000</code>
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ marginBottom: '10px', fontWeight: 'bold' }}>Choose a Starting Template</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '15px'
                }}>
                  {TEMPLATES.map((tmpl) => (
                    <div 
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      style={{
                        padding: '15px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'var(--transition)',
                        border: selectedTemplate === tmpl.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: selectedTemplate === tmpl.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{tmpl.thumbnail}</span>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>{tmpl.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                        {tmpl.id === 'saas' ? 'Business landing' : tmpl.id === 'portfolio' ? 'Creative showcase' : 'Restaurant menu'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating Workspace...' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
     
    </div>
  );
}

export default Dashboard;