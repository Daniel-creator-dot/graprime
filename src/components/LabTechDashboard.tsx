import React, { useState, useEffect } from 'react';
import { FlaskConical, ScanLine, LogOut, CheckCircle2, Clock, XCircle, AlertTriangle, Search } from 'lucide-react';
import { labsApi, scansApi } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'labs' | 'scans';

export default function LabTechDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('labs');
  const [labs, setLabs] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [resultForm, setResultForm] = useState({ results: '', result_notes: '', status: 'completed' });
  const [filter, setFilter] = useState('pending');

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [labRes, scanRes] = await Promise.all([labsApi.getAll(), scansApi.getAll()]);
      setLabs(labRes.data || []);
      setScans(scanRes.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const submitResults = async () => {
    if (!selectedItem) return;
    try {
      if (activeTab === 'labs') {
        await labsApi.update(selectedItem.id, resultForm);
      } else {
        await scansApi.update(selectedItem.id, resultForm);
      }
      setSelectedItem(null);
      setResultForm({ results: '', result_notes: '', status: 'completed' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filteredLabs = labs.filter(l => filter === 'all' || l.status === filter);
  const filteredScans = scans.filter(s => filter === 'all' || s.status === filter);
  const pendingLabs = labs.filter(l => l.status === 'pending').length;
  const pendingScans = scans.filter(s => s.status === 'pending').length;

  const statusColors: any = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    sample_collected: 'bg-blue-50 text-blue-600 border-blue-100',
    processing: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    scheduled: 'bg-blue-50 text-blue-600 border-blue-100',
    completed: 'bg-green-50 text-green-600 border-green-100',
    cancelled: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <div className="mb-10">
          <h1 className="text-xl font-black uppercase tracking-wider">Lab Portal</h1>
          <p className="text-slate-400 text-xs mt-1">Diagnostic Services</p>
        </div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('labs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'labs' ? 'bg-indigo-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <FlaskConical className="w-5 h-5" /> Lab Requests
            {pendingLabs > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingLabs}</span>}
          </button>
          <button onClick={() => setActiveTab('scans')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'scans' ? 'bg-indigo-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <ScanLine className="w-5 h-5" /> Scan Requests
            {pendingScans > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingScans}</span>}
          </button>
        </nav>
        <div className="pt-6 border-t border-slate-700">
          <p className="text-sm font-bold">{user?.name}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-4">{user?.role?.replace('_', ' ')}</p>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-bold">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black">{activeTab === 'labs' ? 'Laboratory Requests' : 'Scan / Imaging Requests'}</h2>
            <p className="text-slate-500 text-sm">Review and enter diagnostic results</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {['pending', 'processing', 'completed', 'all'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-xs text-slate-400 font-bold uppercase">Pending</p>
            <p className="text-2xl font-black text-amber-600">{activeTab === 'labs' ? pendingLabs : pendingScans}</p></div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-xs text-slate-400 font-bold uppercase">Processing</p>
            <p className="text-2xl font-black text-blue-600">{(activeTab === 'labs' ? labs : scans).filter(i => i.status === 'processing' || i.status === 'scheduled').length}</p></div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-xs text-slate-400 font-bold uppercase">Completed</p>
            <p className="text-2xl font-black text-green-600">{(activeTab === 'labs' ? labs : scans).filter(i => i.status === 'completed').length}</p></div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-xs text-slate-400 font-bold uppercase">Total</p>
            <p className="text-2xl font-black">{activeTab === 'labs' ? labs.length : scans.length}</p></div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{activeTab === 'labs' ? 'Test' : 'Scan'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Urgency</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Doctor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : (activeTab === 'labs' ? filteredLabs : filteredScans).length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No {filter} requests found</td></tr>
              ) : (activeTab === 'labs' ? filteredLabs : filteredScans).map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4"><p className="font-bold text-sm">{item.patient_name || 'Walk-in'}</p><p className="text-[10px] text-slate-400">{item.apt_code}</p></td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{activeTab === 'labs' ? item.test_name : `${item.scan_type?.toUpperCase()} — ${item.body_part}`}</p>
                    <p className="text-[10px] text-slate-500">{activeTab === 'labs' ? item.test_type : item.clinical_indication}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.urgency === 'stat' ? 'bg-red-50 text-red-600' : item.urgency === 'urgent' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      {item.urgency === 'stat' && <AlertTriangle className="w-3 h-3 inline mr-1" />}{item.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.requested_by || item.doctor_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[item.status] || statusColors.pending}`}>{item.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    {item.status !== 'completed' && item.status !== 'cancelled' ? (
                      <button onClick={() => { setSelectedItem(item); setResultForm({ results: item.results || '', result_notes: item.result_notes || '', status: 'completed' }); }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm">Enter Results</button>
                    ) : item.results ? (
                      <button onClick={() => setSelectedItem(item)} className="text-indigo-600 text-xs font-bold hover:underline">View Results</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Results Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">{selectedItem.status === 'completed' ? 'View Results' : 'Enter Results'}</h3>
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 rounded-xl"><XCircle className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</p>
                <p className="font-bold">{selectedItem.patient_name || 'Walk-in'}</p>
                <p className="text-xs text-slate-500 mt-1">{activeTab === 'labs' ? selectedItem.test_name : `${selectedItem.scan_type?.toUpperCase()} — ${selectedItem.body_part}`}</p>
              </div>

              {selectedItem.status === 'completed' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Results</p>
                    <p className="text-sm font-medium">{selectedItem.results || 'No results recorded'}</p>
                  </div>
                  {selectedItem.result_notes && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                      <p className="text-sm">{selectedItem.result_notes}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">Completed by {selectedItem.completed_by} on {selectedItem.completed_at ? new Date(selectedItem.completed_at).toLocaleString() : 'N/A'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Update</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={resultForm.status}
                      onChange={e => setResultForm({ ...resultForm, status: e.target.value })}>
                      <option value="sample_collected">Sample Collected</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Results / Findings</label>
                    <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-32 resize-none text-sm" placeholder="Enter diagnostic results..."
                      value={resultForm.results} onChange={e => setResultForm({ ...resultForm, results: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Additional Notes</label>
                    <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-20 resize-none text-sm" placeholder="Any additional observations..."
                      value={resultForm.result_notes} onChange={e => setResultForm({ ...resultForm, result_notes: e.target.value })} />
                  </div>
                  <button onClick={submitResults} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl shadow-indigo-100">
                    Submit Results
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
