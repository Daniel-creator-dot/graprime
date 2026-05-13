import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  CreditCard, 
  LogOut, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { appointmentsApi } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import graLogo from '../gra.png';
import graaLogo from '../graa.png';
import StatusModal from './StatusModal';

export default function PatientDashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<any>({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentsApi.getMyAppointments();
      setAppointments(res.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (aptId: number) => {
    try {
      setStatusModal({
        isOpen: true,
        type: 'info',
        title: 'Initializing Payment',
        message: 'Redirecting you to our secure payment gateway...'
      });
      
      const res = await appointmentsApi.initializePayment(aptId);
      
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Payment Successful!',
        message: 'Your telemedicine session is now confirmed. You can join using the link provided.'
      });
      
      fetchAppointments();
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Payment Failed',
        message: 'Could not process payment. Please try again later.'
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src={graaLogo} alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="font-black text-sm tracking-tight">CSA HEALTH</h1>
              <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">Patient Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm">
            <Calendar className="w-5 h-5" />
            My Bookings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all">
            <User className="w-5 h-5" />
            Profile Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <img src={graaLogo} alt="Logo" className="w-8 h-8 object-contain" />
          <button onClick={onLogout} className="p-2 text-red-500"><LogOut className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Welcome, {user.name}</h2>
              <p className="text-slate-500 font-medium">Manage your health and telemedicine sessions.</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                {user.name?.[0] || 'P'}
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Account Type</p>
                <p className="text-sm font-bold text-indigo-600">Verified Patient</p>
              </div>
            </div>
          </header>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                Your Appointments
                <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                  {appointments.length}
                </span>
              </h3>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100 animate-pulse"></div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">No Appointments Found</h4>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">You haven't booked any medical sessions yet. Start by booking a consultation.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {appointments.map((apt) => (
                  <motion.div 
                    layout
                    key={apt.id} 
                    className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden group"
                  >
                    <div className="flex flex-col h-full gap-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              apt.is_telemedicine ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                              {apt.is_telemedicine ? 'Telemedicine' : 'In-Person'}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              apt.status === 'approved' || apt.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <h4 className="text-xl font-bold mt-2">Consultation with {apt.doctor_name || 'General Physician'}</h4>
                          <p className="text-sm font-medium text-slate-400">{apt.service || 'Medical Checkup'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">{apt.preferred_time}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(apt.preferred_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          Starts soon
                        </div>
                        {apt.is_telemedicine && (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <CreditCard className="w-4 h-4 text-indigo-500" />
                            {apt.payment_status === 'paid' ? 'Payment Verified' : 'Payment Required'}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-4">
                        {apt.is_telemedicine ? (
                          apt.payment_status === 'paid' ? (
                            <a 
                              href={apt.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-100"
                            >
                              JOIN SESSION NOW
                              <Video className="w-5 h-5" />
                            </a>
                          ) : (
                            <button 
                              onClick={() => handlePayment(apt.id)}
                              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-100"
                            >
                              PAY & UNLOCK SESSION
                              <CreditCard className="w-5 h-5" />
                            </button>
                          )
                        ) : (
                          <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm flex items-center justify-center gap-3 italic">
                            PHYSICAL VISIT SCHEDULED
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Abstract design element */}
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                      <Video className="w-32 h-32" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Health Tip Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                <AlertCircle className="w-6 h-6 text-indigo-200" />
              </div>
              <h3 className="text-2xl font-black">Preparing for your Telemedicine Session</h3>
              <p className="text-indigo-100 font-medium max-w-xl">Ensure you have a stable internet connection, a quiet environment, and any relevant medical records ready for your consultation.</p>
              <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-50 transition-colors flex items-center gap-2">
                VIEW GUIDELINES
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          </div>
        </div>
      </main>

      <StatusModal 
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}
