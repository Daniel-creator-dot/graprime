import { useState, useEffect } from 'react';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Register from './components/Register';
import PatientDashboard from './components/PatientDashboard';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(window.location.pathname.startsWith('/admin'));
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'booking' | 'login' | 'register'>('booking');
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
    
    if (window.location.pathname === '/login') setView('login');
    if (window.location.pathname === '/register') setView('register');
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setView('booking');
  };

  if (!user) {
    if (view === 'login') return <Login onLogin={setUser} />;
    if (view === 'register') return <Register onRegister={setUser} onBackToLogin={() => setView('login')} />;
  }

  return (
    <div className={`min-h-screen ${isCleanMode ? 'bg-white' : 'bg-slate-50'}`}>
      {user ? (
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
                onClick={() => setView('login')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all"
              >
                Login / Register
              </button>
            </div>
          )}
          <BookingForm />
        </div>
      )}
    </div>
  );
}
