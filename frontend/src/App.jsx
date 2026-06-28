import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Builder from './components/Builder';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';

// Auth Context
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // الحيلة: نقرأ اليوزر كحالة أولية من الـ localStorage فوراً لمنع الـ null المؤقت أثناء الـ Refresh
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_info');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // إذا لم يكن هناك توكن مخزن أصلاً، لا داعي لطلب الباك إند
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // طلب التحقق من المستخدم عبر التوكن مع كتابة الرابط والبورت بشكل مباشر وصحيح
      const res = await fetch('http://127.0.0.1:8000/api/auth/user/', {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔥 إرسال التوكن ليتعرف دجانغو على الحساب
        }
      });

      if (res.ok) {
        const data = await res.json();
        // تجميع البيانات الأساسية وتحديث الـ localStorage والـ State
        const userInfo = {
          username: data.username,
          is_staff: data.is_staff || false
        };
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        setUser(userInfo);
      } else {
        // إذا انتهت صلاحية التوكن أو حدث خطأ، نقوم بتنظيف الذاكرة
        logout();
      }
    } catch (err) {
      console.error('Error checking user session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = (userData) => {
    // استخراج بيانات المستخدم سواء كانت مباشرة أو بداخل كائن user
    const userInfo = {
      username: userData.username || userData.user?.username,
      is_staff: userData.is_staff || userData.user?.is_staff || false
    };
    
    // حفظ الكائن في المتصفح لإنقاذه عند الـ Refresh
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/auth/logout/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Error logging out:', err);
    }
    // تنظيف كل البيانات والتوكنز عند الخروج
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected Route wrappers
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>Loading user session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>Loading admin session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/" replace />; // حماية الأدمن من اليوزر العادي
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/builder/:siteId" 
            element={
              <ProtectedRoute>
                <Builder />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;