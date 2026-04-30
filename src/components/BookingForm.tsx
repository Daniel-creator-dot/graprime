import { useState, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MessageSquare, 
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Hash,
  UserCheck
} from 'lucide-react';
import logo from '../gra.png';
import { AppointmentData, FormStep, AppointmentType, PriorityLevel, ContactMethod } from '../types';
import { appointmentsApi, doctorsApi } from '../api/client';
import { useEffect } from 'react';
import StatusModal from './StatusModal';

const INITIAL_DATA: AppointmentData = {
  fullName: '',
  whoIsComing: '',
  phoneNumber: '',
  email: '',
  staffId: '',
  nationwideId: '',
  department: '',
  reason: '',
  preferredDate: '',
  preferredTime: '',
  service: '',
  staffToSee: '',
  appointmentType: 'Consultation',
  priority: 'Medium',
  previousVisit: false,
  notes: '',
  preferredContact: 'SMS',
  appointmentId: '',
  bookingDate: '',
  createdBy: 'System User',
};

export default function BookingForm() {
  const [step, setStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState<AppointmentData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    doctorsApi.getAll().then(res => {
      setDoctors(res.data);
    });
  }, []);

  const validateStep = (currentStep: FormStep) => {
    const newErrors: Partial<Record<keyof AppointmentData, string>> = {};
    
    if (currentStep === 'basic') {
      if (!formData.fullName) newErrors.fullName = 'Full Name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.staffId) newErrors.staffId = 'Staff number is required';
      if (!formData.nationwideId) newErrors.nationwideId = 'Nationwide membership no. is required';
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone Number is required';
    }

    if (currentStep === 'details') {
      if (!formData.preferredDate) newErrors.preferredDate = 'Date is required';
      if (!formData.preferredTime) newErrors.preferredTime = 'Time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      if (step === 'basic') setStep('details');
      else if (step === 'details') setStep('additional');
      else if (step === 'additional') setStep('confirm');
    }
  };

  const prevStep = () => {
    if (step === 'details') setStep('basic');
    else if (step === 'additional') setStep('details');
    else if (step === 'confirm') setStep('additional');
  };

  const handleBooking = async () => {
    try {
      setIsSubmitting(true);
      const response = await appointmentsApi.create(formData);
      const now = new Date();
      setFormData({
        ...formData,
        appointmentId: response.data.appointment_id,
        bookingDate: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
      });
      setStep('success');
    } catch (err) {
      console.error('Booking failed:', err);
      setErrorModal({ isOpen: true, message: 'Failed to book appointment. Please make sure the server is running.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof AppointmentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const progress = useMemo(() => {
    switch (step) {
      case 'basic': return 25;
      case 'details': return 50;
      case 'additional': return 75;
      case 'confirm': return 100;
      case 'success': return 100;
      default: return 0;
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="GRA Logo" className="h-20 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Service Association</h1>
          <p className="mt-2 text-slate-500 font-medium">In partnership with Prime Care</p>
          <p className="mt-1 text-slate-400 text-sm">Pre-Booking Appointment System</p>
        </header>

        {step !== 'success' && (
          <div className="mb-8">
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-bold">Basic Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="Full Name" 
                    icon={<User className="w-4 h-4" />}
                    value={formData.fullName}
                    onChange={(v) => updateField('fullName', v)}
                    error={errors.fullName}
                  />
                  <InputField 
                    label="Who is coming (Optional)" 
                    placeholder="e.g., wife, family, name"
                    icon={<User className="w-4 h-4" />}
                    value={formData.whoIsComing}
                    onChange={(v) => updateField('whoIsComing', v)}
                    error={errors.whoIsComing}
                  />
                  <InputField 
                    label="Staff number" 
                    icon={<Hash className="w-4 h-4" />}
                    value={formData.staffId}
                    onChange={(v) => updateField('staffId', v)}
                    error={errors.staffId}
                  />
                  <InputField 
                    label="Nationwide membership no." 
                    icon={<Hash className="w-4 h-4" />}
                    placeholder="Eg. N1678229315"
                    value={formData.nationwideId}
                    onChange={(v) => updateField('nationwideId', v)}
                    error={errors.nationwideId}
                  />
                  <InputField 
                    label="Email Address" 
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    value={formData.email}
                    onChange={(v) => updateField('email', v)}
                    error={errors.email}
                  />
                  <InputField 
                    label="Phone Number" 
                    icon={<Phone className="w-4 h-4" />}
                    value={formData.phoneNumber}
                    onChange={(v) => updateField('phoneNumber', v)}
                    error={errors.phoneNumber}
                  />
                  <InputField 
                    label="Office" 
                    icon={<Building2 className="w-4 h-4" />}
                    value={formData.department}
                    onChange={(v) => updateField('department', v)}
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Complaint / Reason for Appointment</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-24"
                      placeholder="Briefly describe your concern..."
                      value={formData.reason}
                      onChange={(e) => updateField('reason', e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-bold">Appointment Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="Preferred Date" 
                    icon={<Calendar className="w-4 h-4" />}
                    type="date"
                    value={formData.preferredDate}
                    onChange={(v) => updateField('preferredDate', v)}
                    error={errors.preferredDate}
                  />
                  <InputField 
                    label="Preferred Time" 
                    icon={<Clock className="w-4 h-4" />}
                    type="time"
                    value={formData.preferredTime}
                    onChange={(v) => updateField('preferredTime', v)}
                    error={errors.preferredTime}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="block text-sm font-semibold text-slate-700">
                      Doctor to See <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mb-2 italic">please ignore if this is your first visit</p>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <select 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium"
                        value={formData.staffToSee}
                        onChange={(e) => {
                          const doc = doctors.find(d => d.name === e.target.value);
                          setFormData(prev => ({ 
                            ...prev, 
                            staffToSee: e.target.value,
                            doctor_id: doc?.id 
                          }));
                        }}
                      >
                        <option value="">Select a Doctor</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.name} disabled={!d.is_active}>
                            {d.name} ({d.specialization}) {!d.is_active ? '— (Inactive)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Appointment Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                      value={formData.appointmentType}
                      onChange={(e) => updateField('appointmentType', e.target.value as AppointmentType)}
                    >
                      <option>Consultation</option>
                      <option>Follow-up</option>
                      <option>Emergency</option>
                      <option>General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Service / Specialty</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                      value={formData.service}
                      onChange={(e) => updateField('service', e.target.value)}
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
                </div>
              </motion.div>
            )}

            {step === 'additional' && (
              <motion.div
                key="additional"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-bold">Additional Information</h2>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Priority Level</label>
                      <div className="flex gap-2">
                        {(['Low', 'Medium', 'High'] as PriorityLevel[]).map((p) => (
                          <button
                            key={p}
                            onClick={() => updateField('priority', p)}
                            className={`flex-1 py-3 px-2 rounded-xl border-2 transition-all font-medium ${
                              formData.priority === p 
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-bold">Review & Confirm</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div>
                        <p className="text-slate-400 font-medium">Full Name</p>
                        <p className="font-bold">{formData.fullName}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Who is coming</p>
                        <p className="font-bold">{formData.whoIsComing}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Staff number</p>
                        <p className="font-bold">{formData.staffId}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Nationwide membership no.</p>
                        <p className="font-bold">{formData.nationwideId}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Appointment</p>
                        <p className="font-bold">{formData.preferredDate} at {formData.preferredTime}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">To See</p>
                        <p className="font-bold">{formData.staffToSee || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Service / Specialty</p>
                        <p className="font-bold">{formData.service || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200">
                        <p className="text-slate-400 font-medium">Reason</p>
                        <p className="text-slate-700">{formData.reason || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>By confirming, you agree to show up at least 10 minutes before the scheduled time.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-12 text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Booking Success!</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Your appointment has been successfully pre-booked. Please keep a record of your Appointment ID.
                </p>

                <div className="mb-8 p-6 bg-slate-900 text-white rounded-3xl shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Appointment ID</p>
                    <p className="text-3xl font-mono font-bold tracking-tighter">{formData.appointmentId}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 text-left gap-4">
                    <div>
                      <p className="text-slate-500 text-xs uppercase font-medium">Status</p>
                      <p className="text-green-400 font-bold text-sm">CONFIRMED</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase font-medium">Booking Date</p>
                      <p className="text-slate-300 font-bold text-sm">{formData.bookingDate}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => {
                      setStep('basic');
                      setFormData(INITIAL_DATA);
                    }}
                    className="w-full py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-[0.98]"
                  >
                    Create Another Booking
                  </button>
                  <p className="text-xs text-slate-400 font-medium">
                    For enquiries, call <a href="tel:+233200024081" className="text-indigo-600 font-bold hover:underline">+233200024081</a>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== 'success' && (
            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between gap-4">
              <button
                onClick={prevStep}
                disabled={step === 'basic'}
                className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all ${
                  step === 'basic' 
                    ? 'text-slate-300 pointer-events-none' 
                    : 'text-slate-600 hover:bg-slate-200 active:scale-95'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              
              <button
                onClick={step === 'confirm' ? handleBooking : nextStep}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : step === 'confirm' ? 'Confirm Booking' : 'Next'}
                {!isSubmitting && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <footer className="mt-12 text-center text-slate-400 text-sm space-y-2">
          <p className="font-medium">Need help? Call <a href="tel:+233200024081" className="text-slate-600 font-bold hover:text-indigo-600 transition-colors">+233200024081</a> for more enquiries</p>
          <p>© 2026 Customer Service Association • Staff Appointment Verification</p>
        </footer>
      </div>
      <StatusModal 
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        type="error"
        title="Booking Failed"
        message={errorModal.message}
      />
    </div>
  );
}

function InputField({ 
  label, 
  icon, 
  placeholder, 
  value, 
  onChange, 
  type = 'text', 
  error 
}: { 
  label: string; 
  icon: ReactNode; 
  placeholder?: string; 
  value: string; 
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
            error ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'
          }`}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-semibold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
