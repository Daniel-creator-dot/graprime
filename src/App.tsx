import { useState, useEffect } from 'react';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(window.location.pathname.startsWith('/admin'));
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (isAdmin && !user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isAdmin ? (
        <AdminDashboard user={user} onLogout={() => { localStorage.clear(); setUser(null); }} />
      ) : (
        <BookingForm />
      )}
    </div>
  );
}
