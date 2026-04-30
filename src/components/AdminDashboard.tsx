import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  Clock, 
  BarChart3, 
  Bell, 
  Search, 
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  CalendarDays,
  UserPlus,
  Settings,
  LogOut,
  ChevronRight,
  Pencil
} from 'lucide-react';
import { appointmentsApi, analyticsApi, doctorsApi, notificationsApi, usersApi, settingsApi } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import graLogo from '../gra.png';
import graaLogo from '../graa.png';
import StatusModal from './StatusModal';

type Tab = 'overview' | 'appointments' | 'doctors' | 'queue' | 'reports' | 'settings' | 'users';
type ViewMode = 'list' | 'calendar';

export default function AdminDashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>({ 
    stats: { total: 0, today: 0, pending: 0, completed: 0 },
    trends: [],
    workload: [],
    noShow: { missed_total: 0, repeated_offenders: 0 }
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [settings, setSettings] = useState<any>({
    clinic_name: 'Customs Services Association',
    sms_base_url: 'https://www.inteksms.top/api/v1',
    sms_sender_id: 'Primecare',
    sms_api_key: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAppointmentEditModalOpen, setIsAppointmentEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [statusModal, setStatusModal] = useState<any>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: undefined
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, appointmentsRes, doctorsRes, notifRes, usersRes, settingsRes] = await Promise.all([
        analyticsApi.getDashboardStats(),
        appointmentsApi.getAll(),
        doctorsApi.getAll(),
        notificationsApi.getAll(),
        user?.role === 'admin' ? usersApi.getAll() : Promise.resolve({ data: [] }),
        settingsApi.getAll()
      ]);
      setStats(statsRes.data);
      setAppointments(appointmentsRes.data);
      setDoctors(doctorsRes.data);
      setNotifications(notifRes.data);
      setUsers(usersRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await appointmentsApi.updateStatus(id, status);
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <aside className={`w-72 bg-slate-900 text-white flex flex-col fixed h-full z-[70] transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5 overflow-hidden">
                 <img src={graaLogo} alt="GRAA Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5 overflow-hidden">
                 <img src={graLogo} alt="GRA Logo" className="w-full h-full object-contain p-1" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-white">CSA</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <NavItem 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <NavItem 
            active={activeTab === 'appointments'} 
            onClick={() => setActiveTab('appointments')}
            icon={<CalendarDays className="w-5 h-5" />}
            label="Appointments"
            badge={stats.stats.pending > 0 ? stats.stats.pending : undefined}
          />
          <NavItem 
            active={activeTab === 'doctors'} 
            onClick={() => setActiveTab('doctors')}
            icon={<UserPlus className="w-5 h-5" />}
            label="Doctors & Schedules"
          />
          <NavItem 
            active={activeTab === 'queue'} 
            onClick={() => setActiveTab('queue')}
            icon={<Clock className="w-5 h-5" />}
            label="Queue Management"
          />
          {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'front_desk') && (
            <NavItem 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')}
              icon={<BarChart3 className="w-5 h-5" />}
              label="Reports & Analytics"
            />
          )}
          {user?.role === 'admin' && (
            <NavItem 
              active={activeTab === 'users'} 
              onClick={() => setActiveTab('users')}
              icon={<Users className="w-5 h-5" />}
              label="Staff Management"
            />
          )}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-2">
          <NavItem 
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="w-5 h-5" />} 
            label="Settings" 
          />
          <NavItem 
            onClick={onLogout}
            icon={<LogOut className="w-5 h-5" />} 
            label="Logout" 
            className="text-red-400 hover:bg-red-500/10 hover:text-red-400" 
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 py-6 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <MoreVertical className="w-6 h-6 rotate-90" />
            </button>
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 uppercase truncate max-w-[150px] md:max-w-none">
               {activeTab === 'overview' ? 'Dashboard' : activeTab.replace('_', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden lg:flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-xl w-64 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-full font-medium"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); notificationsApi.markAllRead(); }}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                      <p className="font-bold text-sm">Notifications</p>
                      <button onClick={() => setIsNotifOpen(false)} className="text-[10px] font-bold text-indigo-600 uppercase">Close</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-8 text-center text-xs text-slate-400">No notifications</p>
                      ) : notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-indigo-50/30' : ''}`}>
                          <p className="text-xs font-medium text-slate-700">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                {user?.name?.[0] || 'U'}
              </div>
            </div>
            <div className="sm:hidden w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {user?.role === 'doctor' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${doctors.find(d => d.user_id === user.id)?.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <CalendarCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Your Scheduling Status</h3>
                        <p className="text-sm text-slate-500">
                          Currently {doctors.find(d => d.user_id === user.id)?.is_active ? 'accepting' : 'not accepting'} new appointments
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 ${doctors.find(d => d.user_id == user.id)?.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                        {doctors.find(d => d.user_id == user.id)?.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button 
                        onClick={async () => {
                          console.log('Toggle clicked. User ID:', user?.id);
                          const doc = doctors.find(d => d.user_id == user.id);
                          console.log('Found doctor profile:', doc);
                          if (doc) {
                            try {
                              console.log('Sending update for doctor ID:', doc.id);
                              await doctorsApi.updateStatus(doc.id, !doc.is_active);
                              console.log('Update success, refreshing data...');
                              await fetchData();
                            } catch (e) {
                              console.error('Update failed:', e);
                            }
                          } else {
                            console.warn('No doctor profile found for user ID:', user.id);
                            console.log('Available doctors:', doctors);
                          }
                        }}
                        className={`w-14 h-7 rounded-full transition-all relative ${doctors.find(d => d.user_id == user.id)?.is_active ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${doctors.find(d => d.user_id == user.id)?.is_active ? 'left-8' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Today's Appointments" value={stats?.stats?.today || 0} icon={<CalendarCheck />} color="blue" />
                  <StatCard label="Pending Approval" value={stats?.stats?.pending || 0} icon={<Clock />} color="amber" />
                  <StatCard label="Completed" value={stats?.stats?.completed || 0} icon={<CheckCircle2 />} color="green" />
                  <StatCard label="Total Bookings" value={stats?.stats?.total || 0} icon={<Users />} color="indigo" />
                </div>

                {/* Main Dashboard Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Live View */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">Live Appointment View</h2>
                      <div className="flex gap-2">
                        <button className="p-2 border border-slate-200 rounded-lg hover:bg-white transition-colors">
                          <Filter className="w-4 h-4" />
                        </button>
                        <button className="text-sm font-bold text-indigo-600 hover:underline">View All</button>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient / IDs</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loading ? (
                             <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading data...</td></tr>
                          ) : appointments.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No appointments found</td></tr>
                          ) : appointments.slice(0, 5).map((apt) => (
                            <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-sm">{apt.full_name}</p>
                                {apt.who_is_coming && <p className="text-xs text-indigo-600 font-bold">For: {apt.who_is_coming}</p>}
                                <p className="text-xs text-slate-500">Staff No: {apt.staff_id}</p>
                                {apt.nationwide_id && <p className="text-[10px] text-slate-400">Nationwide: {apt.nationwide_id}</p>}
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-semibold">{apt.preferred_time}</p>
                                <p className="text-xs text-slate-500">{new Date(apt.preferred_date).toLocaleDateString()}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium">{apt.doctor_name || 'Unassigned'}</p>
                                {apt.service && <p className="text-[10px] text-slate-500 font-bold uppercase">{apt.service}</p>}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyles(apt.status)}`}>
                                  {apt.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {apt.status === 'pending' && (
                                    <button 
                                      onClick={() => updateStatus(apt.id, 'approved')}
                                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sidebar Stats */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Doctor Workload (Today)</h2>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
                      {stats.workload.length === 0 ? (
                        <p className="text-xs text-slate-400">No data available</p>
                      ) : stats.workload.map((w: any) => (
                        <WorkloadItem 
                          key={w.name}
                          name={w.name} 
                          count={parseInt(w.count)} 
                          percentage={Math.min(100, (parseInt(w.count) / 20) * 100)} 
                          color="bg-indigo-500" 
                        />
                      ))}
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-indigo-200 text-sm font-bold mb-1">Peak Hours Today</p>
                        <h3 className="text-2xl font-bold">{stats?.peakHours || '09:00 - 11:30'}</h3>
                        <p className="text-indigo-100/60 text-xs mt-4">Based on current bookings</p>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <Clock className="w-24 h-24" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Patient Satisfaction</h3>
                    <div className="flex items-center justify-center h-48">
                      <div className="relative w-40 h-40">
                        <div className="absolute inset-0 rounded-full border-[12px] border-slate-100"></div>
                        <div className="absolute inset-0 rounded-full border-[12px] border-green-500 border-t-transparent border-r-transparent -rotate-45" style={{ clipPath: 'polygon(50% 50%, -50% -50%, 150% -50%, 150% 150%, 50% 150%)' }}></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-3xl font-black text-slate-900">{stats?.satisfaction || '4.8'}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Avg Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Wait Time Distribution</h3>
                    <div className="space-y-4">
                      {(stats?.waitDistribution || [
                        { label: 'Under 15m', val: 70, color: 'bg-green-500' },
                        { label: '15 - 30m', val: 20, color: 'bg-amber-500' },
                        { label: 'Over 30m', val: 10, color: 'bg-red-500' }
                      ]).map((item: any) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                            <span className="text-slate-500">{item.label}</span>
                            <span>{item.val}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appointments' && (
              <motion.div
                key="appointments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Appointment Management</h2>
                  <div className="flex gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        List
                      </button>
                      <button 
                        onClick={() => setViewMode('calendar')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Calendar
                      </button>
                    </div>
                  </div>
                </div>
                
                {viewMode === 'calendar' ? (
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-3xl min-h-[500px] flex flex-col">
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2 flex-1">
                      {Array.from({ length: 31 }).map((_, i) => (
                        <div key={i} className="min-h-[80px] bg-slate-50 rounded-2xl p-2 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all cursor-pointer group">
                          <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">{i + 1}</span>
                          <div className="mt-2 space-y-1">
                            {appointments.filter(a => new Date(a.preferred_date).getDate() === i + 1).slice(0, 2).map(a => (
                              <div key={a.id} className="text-[9px] px-1.5 py-0.5 bg-indigo-600 text-white rounded font-bold truncate">
                                {a.preferred_time} {a.full_name.split(' ')[0]}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-left min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Service</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {appointments.map((apt) => (
                          <tr key={apt.id}>
                            <td className="px-6 py-4">
                              <p className="font-bold text-sm">{apt.full_name}</p>
                              {apt.who_is_coming && <p className="text-xs text-indigo-600 font-bold">For: {apt.who_is_coming}</p>}
                              <p className="text-xs text-slate-500">{apt.email}</p>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {new Date(apt.preferred_date).toLocaleDateString()} at {apt.preferred_time}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {apt.doctor_name || 'Not Assigned'}
                              {apt.service && <p className="text-[10px] text-slate-500 font-bold uppercase block mt-1">{apt.service}</p>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold ${apt.priority === 'High' ? 'text-red-500' : apt.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`}>
                                {apt.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyles(apt.status)}`}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => updateStatus(apt.id, 'cancelled')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => updateStatus(apt.id, 'completed')} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                {(user?.role === 'admin' || user?.role === 'front_desk') && (
                                  <button 
                                    onClick={() => { setEditingAppointment(apt); setIsAppointmentEditModalOpen(true); }} 
                                    className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'doctors' && (
              <motion.div
                key="doctors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Doctor Profiles & Schedules</h2>
                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => { setEditingDoctor(null); setIsDoctorModalOpen(true); }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100"
                    >
                      + Add Doctor
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {doctors.map(doctor => (
                    <div key={doctor.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                          {doctor.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold">{doctor.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{doctor.specialization}</p>
                        </div>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 font-medium">Slot Duration</span>
                          <span className="font-bold">{doctor.slot_duration} mins</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 font-medium">Working Hours</span>
                          <span className="font-bold">{doctor.start_time.slice(0,5)} - {doctor.end_time.slice(0,5)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 font-medium">Status</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${doctor.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {doctor.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      {(user?.role === 'admin' || (user?.role === 'doctor' && doctor.user_id === user.id)) && (
                        <button 
                          onClick={() => { setEditingDoctor(doctor); setIsDoctorModalOpen(true); }}
                          className="w-full mt-6 py-2.5 text-indigo-600 font-bold text-sm bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'queue' && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Queue & Check-In Management</h2>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                      <Users className="w-4 h-4" /> {appointments.filter(a => ['approved', 'arrived', 'waiting'].includes(a.status)).length} Waiting
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Queue #</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Appointment Time</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status</th>
                        {user?.role !== 'doctor' && (
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Next Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appointments.filter(a => ['approved', 'arrived', 'waiting', 'consulting'].includes(a.status)).map((apt, idx) => (
                        <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-lg font-bold text-sm">
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm">{apt.full_name}</p>
                            {apt.who_is_coming && <p className="text-xs text-indigo-600 font-bold">For: {apt.who_is_coming}</p>}
                            <p className="text-xs text-slate-500">Staff No: {apt.staff_id}</p>
                            {apt.nationwide_id && <p className="text-[10px] text-slate-400">Nationwide: {apt.nationwide_id}</p>}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {apt.preferred_time}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyles(apt.status)}`}>
                              {apt.status}
                            </span>
                          </td>
                          {user?.role !== 'doctor' && (
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {apt.status === 'approved' && (user?.role === 'admin' || user?.role === 'front_desk') && (
                                  <button onClick={() => updateStatus(apt.id, 'arrived')} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm">
                                    Mark Arrived
                                  </button>
                                )}
                                {apt.status === 'arrived' && (
                                  <button onClick={() => updateStatus(apt.id, 'consulting')} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm">
                                    In Consultation
                                  </button>
                                )}
                                {apt.status === 'consulting' && (
                                  <button onClick={() => updateStatus(apt.id, 'completed')} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm">
                                    Complete
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
            )}

            {activeTab === 'users' && user?.role === 'admin' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Staff & User Accounts</h2>
                  <button 
                    onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100"
                  >
                    + Add New Staff
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username / ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 font-bold text-sm">{u.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{u.username}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-full border border-slate-200">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                                className="text-indigo-500 hover:text-indigo-700 font-bold text-xs"
                              >
                                EDIT
                              </button>
                              <button 
                                onClick={() => setStatusModal({
                                  isOpen: true,
                                  type: 'confirm',
                                  title: 'Delete User?',
                                  message: `Are you sure you want to delete ${u.name}? This action cannot be undone.`,
                                  onConfirm: async () => {
                                    await usersApi.delete(u.id);
                                    fetchData();
                                  }
                                })}
                                className="text-red-500 hover:text-red-700 font-bold text-xs"
                              >
                                DELETE
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl space-y-8"
              >
                <h2 className="text-xl font-bold">System Settings</h2>
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                   <div className="p-8 border-b border-slate-100">
                      <h3 className="font-bold mb-1">Clinic Profile</h3>
                      <p className="text-sm text-slate-500">Update your clinic details and public information.</p>
                   </div>
                   <div className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="col-span-2">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Clinic Name</label>
                            <input 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                              value={settings.clinic_name} 
                              onChange={(e) => setSettings({ ...settings, clinic_name: e.target.value })}
                            />
                         </div>
                         <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Opening Time</label>
                            <input type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" defaultValue="08:00" />
                         </div>
                         <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Closing Time</label>
                            <input type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" defaultValue="17:00" />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                   <div className="p-8 border-b border-slate-100">
                      <h3 className="font-bold mb-1">SMS Gateway Configuration</h3>
                      <p className="text-sm text-slate-500">Configure your SMS provider details for automated alerts.</p>
                   </div>
                   <div className="p-8 space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">SMS Base URL</label>
                          <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono text-xs" 
                            value={settings.sms_base_url} 
                            onChange={(e) => setSettings({ ...settings, sms_base_url: e.target.value })}
                            placeholder="https://www.inteksms.top/api/v1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sender ID</label>
                            <input 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                              value={settings.sms_sender_id} 
                              onChange={(e) => setSettings({ ...settings, sms_sender_id: e.target.value })}
                              placeholder="Primecare"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">API Key</label>
                            <input 
                              type="password"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                              value={settings.sms_api_key} 
                              onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
                              placeholder="••••••••••••"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                            <p className="font-bold text-sm">Booking Confirmations</p>
                            <p className="text-xs text-slate-500">Send SMS to client when booking is received</p>
                          </div>
                          <div className="w-10 h-5 bg-indigo-600 rounded-full p-1 flex justify-end items-center"><div className="w-3 h-3 bg-white rounded-full"></div></div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                            <p className="font-bold text-sm">Status Alerts</p>
                            <p className="text-xs text-slate-500">Send SMS when appointment is approved/cancelled</p>
                          </div>
                          <div className="w-10 h-5 bg-indigo-600 rounded-full p-1 flex justify-end items-center"><div className="w-3 h-3 bg-white rounded-full"></div></div>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                   <div className="p-8 border-b border-slate-100">
                      <h3 className="font-bold mb-1">User Permissions</h3>
                      <p className="text-sm text-slate-500">Configure what each role can access and perform.</p>
                   </div>
                   <div className="p-8">
                      <div className="space-y-4">
                         <PermissionItem role="Admin" desc="Full system access and configurations" />
                         <PermissionItem role="Front Desk" desc="Manage appointments and check-ins" />
                         <PermissionItem role="Doctor" desc="View clinical queue and patient reports" />
                      </div>
                   </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button 
                    disabled={isSaving}
                    onClick={async () => {
                      try {
                        setIsSaving(true);
                        await settingsApi.update(settings);
                        setStatusModal({
                          isOpen: true,
                          type: 'success',
                          title: 'Settings Saved',
                          message: 'System configurations have been updated successfully.'
                        });
                      } catch (err) {
                        console.error(err);
                        setStatusModal({
                          isOpen: true,
                          type: 'error',
                          title: 'Save Failed',
                          message: 'There was an error updating settings. Please check your connection.'
                        });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </motion.div>
            )}
            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Reports & Analytics</h2>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white">Export PDF</button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100">Export Excel</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Appointment Trends (Last 7 Days)</h3>
                    <div className="h-64 flex items-end gap-4 px-2">
                       {stats.trends.length === 0 ? (
                         <p className="text-xs text-slate-400 w-full text-center pb-24">No data available yet</p>
                       ) : stats.trends.map((t: any, i: number) => (
                         <div key={i} className="flex-1 group relative">
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                             {t.count}
                           </div>
                           <div 
                             className={`w-full rounded-t-lg bg-indigo-500/20 group-hover:bg-indigo-600 transition-all duration-500`}
                             style={{ height: `${Math.max(10, (parseInt(t.count) / Math.max(...stats.trends.map((tr:any) => parseInt(tr.count)))) * 100)}%` }}
                           ></div>
                           <div className="mt-3 text-[10px] font-bold text-slate-400 text-center uppercase">
                             {t.day}
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Patient Attendance Rate</h3>
                    <div className="flex items-center justify-center h-64">
                       <div className="relative w-48 h-48 rounded-full border-[16px] border-slate-100 flex items-center justify-center">
                          {(() => {
                            const total = parseInt(stats?.stats?.total) || 0;
                            const completed = parseInt(stats?.stats?.completed) || 0;
                            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                            return (
                              <>
                                <div 
                                  className="absolute inset-0 rounded-full border-[16px] border-indigo-600 border-t-transparent border-r-transparent -rotate-45 transition-all duration-1000"
                                  style={{ clipPath: `polygon(50% 50%, -50% -50%, ${rate > 50 ? '150% -50%' : '50% -50%'}, ${rate > 75 ? '150% 150%' : '50% 150%'}, ${rate > 25 ? '-50% 150%' : '50% 150%'})` }}
                                ></div>
                                <div className="text-center">
                                  <p className="text-4xl font-black">{rate}%</p>
                                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Attendance</p>
                                </div>
                              </>
                            );
                          })()}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">No-Show Analysis</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-bold">
                        {(() => {
                          const total = parseInt(stats?.stats?.total) || 0;
                          const missed = parseInt(stats?.noShow?.missed_total) || 0;
                          return total > 0 ? Math.round((missed / total) * 100) : 0;
                        })()}%
                      </div>
                      <div>
                        <p className="font-bold text-sm">Overall No-Show Rate</p>
                        <p className="text-xs text-slate-500 font-medium">Calculated from total database appointments</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Missed Appointments</p>
                          <p className="text-xl font-bold">{stats?.noShow?.missed_total || 0}</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Repeated Offenders</p>
                          <p className="text-xl font-bold text-red-500">{stats?.noShow?.repeated_offenders || 0}</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Restricted Bookings</p>
                          <p className="text-xl font-bold">0</p>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Doctor Modal */}
        <DoctorModal 
          isOpen={isDoctorModalOpen} 
          onClose={() => setIsDoctorModalOpen(false)} 
          doctor={editingDoctor}
          onSuccess={fetchData}
        />
        {/* User Modal */}
        <UserModal 
          isOpen={isUserModalOpen} 
          onClose={() => setIsUserModalOpen(false)} 
          user={editingUser}
          onSuccess={fetchData}
        />
        <StatusModal 
          isOpen={statusModal.isOpen}
          onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onConfirm={statusModal.onConfirm}
        />
        <AppointmentEditModal 
          isOpen={isAppointmentEditModalOpen}
          onClose={() => setIsAppointmentEditModalOpen(false)}
          appointment={editingAppointment}
          onSuccess={fetchData}
          doctors={doctors}
        />
      </main>
    </div>
  );
}

function AppointmentEditModal({ isOpen, onClose, appointment, onSuccess, doctors }: any) {
  const [formData, setFormData] = useState({
    preferred_date: '',
    preferred_time: '',
    notes: '',
    doctor_id: '',
    priority: '',
    status: '',
    who_is_coming: '',
    service: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment) {
      setFormData({
        preferred_date: appointment.preferred_date ? new Date(appointment.preferred_date).toISOString().split('T')[0] : '',
        preferred_time: appointment.preferred_time,
        notes: appointment.notes || '',
        doctor_id: appointment.doctor_id || '',
        priority: appointment.priority,
        status: appointment.status,
        who_is_coming: appointment.who_is_coming || '',
        service: appointment.service || ''
      });
    }
  }, [appointment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await appointmentsApi.update(appointment.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Edit Appointment</h2>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><XCircle className="w-5 h-5 text-slate-400" /></button>
          </div>
          
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Patient Name</p>
             <p className="font-bold text-slate-900">{appointment?.full_name}</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Time</label>
                <input 
                  type="time"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Who is coming (Optional)</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.who_is_coming}
                onChange={(e) => setFormData({...formData, who_is_coming: e.target.value})}
                placeholder="e.g. wife, family, name"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Service / Specialty</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.service}
                onChange={(e) => setFormData({...formData, service: e.target.value})}
              >
                <option value="">Select a Service</option>
                <option value="Physio">Physio - Monday and Friday</option>
                <option value="Dietician">Dietician - Tuesday</option>
                <option value="Surgical">Surgical - Tuesday</option>
                <option value="Psychiatry">Psychiatry - Tuesday and Thursday</option>
                <option value="Urology">Urology - 2nd Wednesday of every month</option>
                <option value="Physician specialties">Physician specialties - 2nd Wednesday of every month</option>
                <option value="Dental">Dental - Wednesday</option>
                <option value="Ent">Ent - Friday</option>
                <option value="Eye">Eye - Saturday</option>
                <option value="Pediatric">Pediatric - Thursday</option>
                <option value="ANC/Gynae">ANC/Gynae - Thursday</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Assigned Doctor (Optional)</label>
              <p className="text-[10px] text-slate-400 mb-2 italic ml-1">please ignore if this is your first visit</p>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.doctor_id}
                onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
              >
                <option value="">Not Assigned</option>
                {doctors.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Priority Service</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Status</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="arrived">Arrived</option>
                  <option value="waiting">Waiting</option>
                  <option value="consulting">Consulting</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional instructions..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors">CANCEL</button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DoctorModal({ isOpen, onClose, doctor, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    slot_duration: 15,
    start_time: '08:00',
    end_time: '17:00',
    is_active: true,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name,
        specialization: doctor.specialization,
        slot_duration: doctor.slot_duration,
        start_time: doctor.start_time.slice(0,5),
        end_time: doctor.end_time.slice(0,5),
        is_active: doctor.is_active,
        working_days: doctor.working_days || []
      });
    } else {
      setFormData({
        name: '',
        specialization: '',
        slot_duration: 15,
        start_time: '08:00',
        end_time: '17:00',
        is_active: true,
        working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      });
    }
  }, [doctor, isOpen]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (doctor) {
        await doctorsApi.update(doctor.id, formData);
      } else {
        await doctorsApi.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving doctor:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold">{doctor ? 'Edit Doctor Profile' : 'Add New Doctor'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><XCircle className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Name</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Specialization</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Start Time</label>
              <input 
                type="time"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">End Time</label>
              <input 
                type="time"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Slot Duration (Min)</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none"
                value={formData.slot_duration}
                onChange={(e) => setFormData({...formData, slot_duration: parseInt(e.target.value)})}
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
             <div>
                <p className="font-bold text-sm">Active for Scheduling</p>
                <p className="text-xs text-slate-500">Toggle visibility in booking form</p>
             </div>
             <button 
                type="button"
                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-indigo-600' : 'bg-slate-300'}`}
             >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'left-7' : 'left-1'}`} />
             </button>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            {doctor ? 'Save Changes' : 'Create Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {badge && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {!active && !badge && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
    </button>
  );
}

function UserModal({ isOpen, onClose, onSuccess, user }: any) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'front_desk',
    phone_number: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        password: '',
        role: user.role || 'front_desk',
        phone_number: user.phone_number || ''
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: 'staff123',
        role: 'front_desk',
        phone_number: ''
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user) {
        await usersApi.update(user.id, formData);
      } else {
        await usersApi.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-2xl font-bold">{user ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
          <div className="space-y-4">
             <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             </div>
             <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username / ID</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
             </div>
             <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{user ? 'New Password (Optional)' : 'Default Password'}</label>
                <input 
                  readOnly={!user} 
                  type={user ? 'password' : 'text'}
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 ${!user ? 'bg-slate-100 cursor-not-allowed' : ''}`} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder={user ? "Leave blank to keep unchanged" : ""}
                />
             </div>
             <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number (for recovery)</label>
                <input required type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-4" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="e.g. 0500000000" />
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assigned Role</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                   <option value="admin">Admin</option>
                   <option value="front_desk">Front Desk</option>
                   <option value="doctor">Doctor</option>
                </select>
             </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors">CANCEL</button>
            <button type="submit" className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100">{user ? 'SAVE CHANGES' : 'CREATE ACCOUNT'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function PermissionItem({ role, desc }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-lg shadow-indigo-100">
        {role[0]}
      </div>
      <div>
        <p className="font-bold text-sm">{role}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-500 shadow-blue-200 text-blue-600 bg-blue-50',
    amber: 'bg-amber-500 shadow-amber-200 text-amber-600 bg-amber-50',
    green: 'bg-green-500 shadow-green-200 text-green-600 bg-green-50',
    indigo: 'bg-indigo-500 shadow-indigo-200 text-indigo-600 bg-indigo-50',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors[color].split(' ')[3]} ${colors[color].split(' ')[2]}`}>
          {icon}
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-2 flex items-center text-xs font-semibold text-green-500">
        <span className="mr-1">↑ 12%</span>
        <span className="text-slate-400">vs yesterday</span>
      </div>
    </div>
  );
}

function WorkloadItem({ name, count, percentage, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-bold">{name}</span>
        <span className="text-slate-500 font-semibold">{count} Patients</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'approved': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
    case 'arrived': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'completed': return 'bg-green-50 text-green-600 border border-green-100';
    case 'cancelled': return 'bg-red-50 text-red-600 border border-red-100';
    default: return 'bg-slate-50 text-slate-600 border border-slate-100';
  }
}
