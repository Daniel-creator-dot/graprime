import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Register from './components/Register';
import PatientDashboard from './components/PatientDashboard';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isCleanMode, setIsCleanMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'app') {
      setIsCleanMode(true);
    }
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/');
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${isCleanMode ? 'bg-white' : 'bg-slate-50'}`}>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/" /> : <Register onRegister={handleLogin} onBackToLogin={() => navigate('/login')} />
        } />
        <Route path="/" element={
          user ? (
            user.role === 'patient' ? (
              <PatientDashboard user={user} onLogout={handleLogout} />
            ) : (
              <AdminDashboard user={user} onLogout={handleLogout} />
            )
          ) : (
            <div className="relative">
              {!isCleanMode && (
                <div className="absolute top-4 right-4 z-50">
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all"
                  >
                    Login / Register
                  </button>
                </div>
              )}
              <BookingForm />
            </div>
          )
        } />
      </Routes>
    </div>
  );
}
