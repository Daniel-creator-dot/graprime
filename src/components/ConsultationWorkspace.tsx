import React, { useState, useEffect } from 'react';
import { XCircle, Heart, Thermometer, Activity, Weight, Ruler, Wind, FlaskConical, ScanLine, Pill, Clock, Save, CheckCircle2, AlertTriangle, Video } from 'lucide-react';
import { consultationsApi, labsApi, scansApi, prescriptionsApi } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';

type WorkspaceTab = 'vitals' | 'consultation' | 'labs' | 'scans' | 'prescription' | 'history';

export default function ConsultationWorkspace({ appointment, user, onClose, onComplete }: any) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('vitals');
  const [consultation, setConsultation] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const [vitals, setVitals] = useState({
    vitals_bp: '', vitals_temp: '', vitals_pulse: '',
    vitals_weight: '', vitals_height: '', vitals_spo2: ''
  });
  const [clinicalData, setClinicalData] = useState({
    chief_complaint: '', symptoms: '', diagnosis: '',
    clinical_notes: '', follow_up_date: ''
  });
  const [labForm, setLabForm] = useState({ test_name: '', test_type: 'blood', urgency: 'routine' });
  const [scanForm, setScanForm] = useState({ scan_type: 'x-ray', body_part: '', clinical_indication: '', urgency: 'routine' });
  const [rxForm, setRxForm] = useState({ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
  const [showLabModal, setShowLabModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [appointment]);

  const loadData = async () => {
    try {
      const [consRes, labRes, scanRes, rxRes] = await Promise.all([
        consultationsApi.getByAppointment(appointment.id),
        labsApi.getAll({ patient_id: appointment.patient_id }),
        scansApi.getAll({ patient_id: appointment.patient_id }),
        prescriptionsApi.getAll()
      ]);
      const existingConsultation = consRes.data?.[0];
      if (existingConsultation) {
        setConsultation(existingConsultation);
        setVitals({
          vitals_bp: existingConsultation.vitals_bp || '',
          vitals_temp: existingConsultation.vitals_temp || '',
          vitals_pulse: existingConsultation.vitals_pulse || '',
          vitals_weight: existingConsultation.vitals_weight || '',
          vitals_height: existingConsultation.vitals_height || '',
          vitals_spo2: existingConsultation.vitals_spo2 || ''
        });
        setClinicalData({
          chief_complaint: existingConsultation.chief_complaint || '',
          symptoms: existingConsultation.symptoms || '',
          diagnosis: existingConsultation.diagnosis || '',
          clinical_notes: existingConsultation.clinical_notes || '',
          follow_up_date: existingConsultation.follow_up_date ? new Date(existingConsultation.follow_up_date).toISOString().split('T')[0] : ''
        });
      }
      setLabs(labRes.data || []);
      setScans(scanRes.data || []);
      const aptRx = (rxRes.data || []).filter((r: any) => r.appointment_id === appointment.id);
      setPrescriptions(aptRx);
    } catch (err) { console.error(err); }
  };

  const saveConsultation = async (status = 'in_progress') => {
    setSaving(true);
    try {
      const payload = { appointment_id: appointment.id, patient_id: appointment.patient_id, ...vitals, ...clinicalData, status };
      if (consultation) {
        const res = await consultationsApi.update(consultation.id, payload);
        setConsultation(res.data);
      } else {
        const res = await consultationsApi.create(payload);
        setConsultation(res.data);
      }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const addLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await labsApi.create({ ...labForm, appointment_id: appointment.id, patient_id: appointment.patient_id, consultation_id: consultation?.id });
      setLabForm({ test_name: '', test_type: 'blood', urgency: 'routine' });
      setShowLabModal(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const addScan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scansApi.create({ ...scanForm, appointment_id: appointment.id, patient_id: appointment.patient_id, consultation_id: consultation?.id });
      setScanForm({ scan_type: 'x-ray', body_part: '', clinical_indication: '', urgency: 'routine' });
      setShowScanModal(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const addRx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await prescriptionsApi.create({ ...rxForm, appointment_id: appointment.id, patient_id: appointment.patient_id, consultation_id: consultation?.id });
      setRxForm({ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
      setShowRxModal(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const completeConsultation = async () => {
    await saveConsultation('completed');
    onComplete?.();
  };

  const tabs: { key: WorkspaceTab; label: string; icon: any }[] = [
    { key: 'vitals', label: 'Vitals', icon: <Heart className="w-4 h-4" /> },
    { key: 'consultation', label: 'Consultation', icon: <Activity className="w-4 h-4" /> },
    { key: 'labs', label: 'Labs', icon: <FlaskConical className="w-4 h-4" /> },
    { key: 'scans', label: 'Scans', icon: <ScanLine className="w-4 h-4" /> },
    { key: 'prescription', label: 'Rx', icon: <Pill className="w-4 h-4" /> },
  ];

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm";
  const labelClass = "block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex">
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
        className="ml-auto w-full max-w-3xl bg-white h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase tracking-wider">Consultation Workspace</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><XCircle className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">
              {appointment.full_name?.[0] || '?'}
            </div>
            <div>
              <p className="font-bold text-lg">{appointment.full_name}</p>
              <p className="text-indigo-200 text-xs font-medium">
                {appointment.staff_id && `Staff #${appointment.staff_id} · `}
                {appointment.preferred_time} · {new Date(appointment.preferred_date).toLocaleDateString()}
              </p>
            </div>
            {appointment.is_telemedicine && appointment.meeting_link && (
              <a 
                href={appointment.meeting_link}
                target="_blank"
                rel="noreferrer"
                className="ml-4 px-4 py-2 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-lg"
              >
                <Video className="w-4 h-4" />
                JOIN VIDEO CALL
              </a>
            )}
            {consultation && (
              <span className={`ml-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${consultation.status === 'completed' ? 'bg-green-400/20 text-green-100' : 'bg-yellow-400/20 text-yellow-100'}`}>
                {consultation.status}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              {t.icon} {t.label}
              {t.key === 'labs' && labs.length > 0 && <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] flex items-center justify-center">{labs.length}</span>}
              {t.key === 'scans' && scans.length > 0 && <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] flex items-center justify-center">{scans.length}</span>}
              {t.key === 'prescription' && prescriptions.length > 0 && <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] flex items-center justify-center">{prescriptions.length}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Patient Vitals</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'vitals_bp', label: 'Blood Pressure', icon: <Heart className="w-5 h-5 text-red-500" />, placeholder: '120/80 mmHg', suffix: 'mmHg' },
                  { key: 'vitals_temp', label: 'Temperature', icon: <Thermometer className="w-5 h-5 text-orange-500" />, placeholder: '36.5', suffix: '°C' },
                  { key: 'vitals_pulse', label: 'Pulse Rate', icon: <Activity className="w-5 h-5 text-pink-500" />, placeholder: '72', suffix: 'bpm' },
                  { key: 'vitals_weight', label: 'Weight', icon: <Weight className="w-5 h-5 text-blue-500" />, placeholder: '70', suffix: 'kg' },
                  { key: 'vitals_height', label: 'Height', icon: <Ruler className="w-5 h-5 text-green-500" />, placeholder: '170', suffix: 'cm' },
                  { key: 'vitals_spo2', label: 'SpO₂', icon: <Wind className="w-5 h-5 text-cyan-500" />, placeholder: '98', suffix: '%' },
                ].map(v => (
                  <div key={v.key} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">{v.icon}<span className={labelClass + ' mb-0'}>{v.label}</span></div>
                    <div className="flex items-center gap-2">
                      <input className={inputClass} placeholder={v.placeholder}
                        value={(vitals as any)[v.key]} onChange={e => setVitals({ ...vitals, [v.key]: e.target.value })} />
                      <span className="text-xs text-slate-400 font-bold whitespace-nowrap">{v.suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => { saveConsultation(); setActiveTab('consultation'); }}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                {saving ? 'SAVING...' : 'SAVE VITALS & CONTINUE →'}
              </button>
            </div>
          )}

          {activeTab === 'consultation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Clinical Assessment</h3>
              <div><label className={labelClass}>Chief Complaint</label>
                <input className={inputClass} placeholder="Patient presents with..." value={clinicalData.chief_complaint}
                  onChange={e => setClinicalData({ ...clinicalData, chief_complaint: e.target.value })} /></div>
              <div><label className={labelClass}>Symptoms</label>
                <textarea className={inputClass + ' h-20 resize-none'} placeholder="Fever, headache, cough..."
                  value={clinicalData.symptoms} onChange={e => setClinicalData({ ...clinicalData, symptoms: e.target.value })} /></div>
              <div><label className={labelClass}>Diagnosis</label>
                <input className={inputClass} placeholder="e.g. Acute upper respiratory tract infection"
                  value={clinicalData.diagnosis} onChange={e => setClinicalData({ ...clinicalData, diagnosis: e.target.value })} /></div>
              <div><label className={labelClass}>Clinical Notes</label>
                <textarea className={inputClass + ' h-32 resize-none'} placeholder="Detailed clinical observations..."
                  value={clinicalData.clinical_notes} onChange={e => setClinicalData({ ...clinicalData, clinical_notes: e.target.value })} /></div>
              <div><label className={labelClass}>Follow-up Date</label>
                <input type="date" className={inputClass} value={clinicalData.follow_up_date}
                  onChange={e => setClinicalData({ ...clinicalData, follow_up_date: e.target.value })} /></div>
              <button onClick={() => saveConsultation()} disabled={saving}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50">
                {saving ? 'SAVING...' : 'SAVE CONSULTATION'}
              </button>
            </div>
          )}

          {activeTab === 'labs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Lab Orders</h3>
                <button onClick={() => setShowLabModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100">+ Order Lab Test</button>
              </div>
              {labs.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="font-medium">No lab orders yet</p></div>
              ) : (
                <div className="space-y-3">
                  {labs.map((lab: any) => (
                    <div key={lab.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{lab.test_name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{lab.test_type} · {lab.urgency} · Ordered by {lab.requested_by}</p>
                        {lab.results && <p className="text-xs text-green-600 mt-1 font-medium">Results: {lab.results}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        lab.status === 'completed' ? 'bg-green-50 text-green-600' :
                        lab.status === 'processing' ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'}`}>{lab.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'scans' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Scan / Imaging Requests</h3>
                <button onClick={() => setShowScanModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100">+ Request Scan</button>
              </div>
              {scans.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><ScanLine className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="font-medium">No scan requests yet</p></div>
              ) : (
                <div className="space-y-3">
                  {scans.map((scan: any) => (
                    <div key={scan.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{scan.scan_type.toUpperCase()} — {scan.body_part}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{scan.urgency} · {scan.clinical_indication}</p>
                        {scan.results && <p className="text-xs text-green-600 mt-1 font-medium">Findings: {scan.results}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        scan.status === 'completed' ? 'bg-green-50 text-green-600' :
                        scan.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'}`}>{scan.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'prescription' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Prescriptions</h3>
                <button onClick={() => setShowRxModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100">+ Add Medication</button>
              </div>
              {prescriptions.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><Pill className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="font-medium">No prescriptions yet</p></div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx: any) => (
                    <div key={rx.id} className="bg-white p-4 rounded-2xl border border-slate-200">
                      <p className="font-bold text-sm">{rx.medication_name}</p>
                      <p className="text-xs text-slate-500">{rx.dosage} · {rx.frequency} · {rx.duration}</p>
                      {rx.instructions && <p className="text-xs text-indigo-600 mt-1">{rx.instructions}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex gap-3">
          <button onClick={() => saveConsultation()} disabled={saving}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={completeConsultation}
            className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-green-100">
            <CheckCircle2 className="w-4 h-4" /> Complete Consultation
          </button>
        </div>
      </motion.div>

      {/* Lab Order Modal */}
      <AnimatePresence>
        {showLabModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[210] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">Order Lab Test</h3>
                <button onClick={() => setShowLabModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><XCircle className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={addLab} className="space-y-4">
                <div><label className={labelClass}>Test Name</label><input required className={inputClass} placeholder="e.g. Full Blood Count" value={labForm.test_name} onChange={e => setLabForm({ ...labForm, test_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelClass}>Type</label>
                    <select className={inputClass} value={labForm.test_type} onChange={e => setLabForm({ ...labForm, test_type: e.target.value })}>
                      <option value="blood">Blood</option><option value="urine">Urine</option><option value="stool">Stool</option><option value="other">Other</option>
                    </select></div>
                  <div><label className={labelClass}>Urgency</label>
                    <select className={inputClass} value={labForm.urgency} onChange={e => setLabForm({ ...labForm, urgency: e.target.value })}>
                      <option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option>
                    </select></div>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase">Submit Lab Order</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scan Request Modal */}
      <AnimatePresence>
        {showScanModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[210] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">Request Scan</h3>
                <button onClick={() => setShowScanModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><XCircle className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={addScan} className="space-y-4">
                <div><label className={labelClass}>Scan Type</label>
                  <select className={inputClass} value={scanForm.scan_type} onChange={e => setScanForm({ ...scanForm, scan_type: e.target.value })}>
                    <option value="x-ray">X-Ray</option><option value="mri">MRI</option><option value="ct">CT Scan</option>
                    <option value="ultrasound">Ultrasound</option><option value="ecg">ECG</option><option value="other">Other</option>
                  </select></div>
                <div><label className={labelClass}>Body Part / Region</label><input required className={inputClass} placeholder="e.g. Chest, Left Knee" value={scanForm.body_part} onChange={e => setScanForm({ ...scanForm, body_part: e.target.value })} /></div>
                <div><label className={labelClass}>Clinical Indication</label><textarea className={inputClass + ' h-20 resize-none'} placeholder="Why is this scan needed?" value={scanForm.clinical_indication} onChange={e => setScanForm({ ...scanForm, clinical_indication: e.target.value })} /></div>
                <div><label className={labelClass}>Urgency</label>
                  <select className={inputClass} value={scanForm.urgency} onChange={e => setScanForm({ ...scanForm, urgency: e.target.value })}>
                    <option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option>
                  </select></div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase">Submit Scan Request</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prescription Modal */}
      <AnimatePresence>
        {showRxModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[210] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">Add Prescription</h3>
                <button onClick={() => setShowRxModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><XCircle className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={addRx} className="space-y-4">
                <div><label className={labelClass}>Medication</label><input required className={inputClass} placeholder="e.g. Paracetamol" value={rxForm.medication_name} onChange={e => setRxForm({ ...rxForm, medication_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelClass}>Dosage</label><input required className={inputClass} placeholder="500mg" value={rxForm.dosage} onChange={e => setRxForm({ ...rxForm, dosage: e.target.value })} /></div>
                  <div><label className={labelClass}>Frequency</label><input required className={inputClass} placeholder="3x Daily" value={rxForm.frequency} onChange={e => setRxForm({ ...rxForm, frequency: e.target.value })} /></div>
                </div>
                <div><label className={labelClass}>Duration</label><input required className={inputClass} placeholder="7 Days" value={rxForm.duration} onChange={e => setRxForm({ ...rxForm, duration: e.target.value })} /></div>
                <div><label className={labelClass}>Instructions</label><textarea className={inputClass + ' h-20 resize-none'} placeholder="Take after meals" value={rxForm.instructions} onChange={e => setRxForm({ ...rxForm, instructions: e.target.value })} /></div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase">Save Prescription</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
