import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MedicalAppointment, MedicalExamNote, AppointmentStatus, MedicalSpecialty, Task } from '../types';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Heart, 
  Activity, 
  Sparkles, 
  Stethoscope, 
  Phone, 
  MapPin, 
  ChevronRight, 
  Send, 
  Search, 
  Filter, 
  CalendarDays, 
  Layers, 
  Info,
  RotateCcw,
  CheckSquare,
  ClipboardList,
  Flame,
  X
} from 'lucide-react';

interface MedicalAppointmentsViewProps {
  appointments: MedicalAppointment[];
  examNotes: MedicalExamNote[];
  onAddAppointment: (appointment: Omit<MedicalAppointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateAppointment: (appointment: MedicalAppointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onAddExamNote: (note: Omit<MedicalExamNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateExamNote: (note: MedicalExamNote) => void;
  onDeleteExamNote: (noteId: string) => void;
  onOpenNewTaskModal?: (prefilled?: Partial<Task>) => void;
  onResetMedicalData?: () => void;
}

const SPECIALTY_OPTIONS: { id: MedicalSpecialty; label: string; icon: string; defaultPrep: string }[] = [
  { id: 'odontologia', label: 'Odontología / Dentista', icon: '🦷', defaultPrep: 'Llevar radiografía previa o placa de bruxismo si aplica' },
  { id: 'urologia', label: 'Urología', icon: '🩺', defaultPrep: 'Llevar resultado de examen de PSA y ecografía' },
  { id: 'medicina_interna', label: 'Medicina Interna', icon: '🧬', defaultPrep: 'Llevar últimos exámenes de laboratorio (hemoglobina, perfil lipídico, glucosa)' },
  { id: 'cardiologia', label: 'Cardiología', icon: '❤️', defaultPrep: 'Llevar electrocardiograma previo y registro de presión arterial' },
  { id: 'oftalmologia', label: 'Oftalmología', icon: '👁️', defaultPrep: 'Llevar lentes actuales; evitar conducir si usan gotas dilatadoras' },
  { id: 'dermatologia', label: 'Dermatología', icon: '🧴', defaultPrep: 'No aplicar cremas ni maquillaje en la zona a evaluar' },
  { id: 'gastroenterologia', label: 'Gastroenterología', icon: '🔬', defaultPrep: 'Ayuno según indicación para ecografía o endoscopia' },
  { id: 'nutricion', label: 'Nutrición & Dietética', icon: '🥗', defaultPrep: 'Llevar registro de comidas de los últimos 3 días' },
  { id: 'psicologia', label: 'Psicología / Salud Mental', icon: '🧠', defaultPrep: 'Anotar temas clave y objetivos personales a tratar' },
  { id: 'ginecologia', label: 'Ginecología', icon: '🌸', defaultPrep: 'Llevar última citología o ecografía pélvica' },
  { id: 'traumatologia_ortopedia', label: 'Traumatología & Ortopedia', icon: '🦴', defaultPrep: 'Llevar resonancias o radiografías de la articulación' },
  { id: 'otorrinolaringologia', label: 'Otorrinolaringología', icon: '👂', defaultPrep: 'Llevar audiometría si fue solicitada' },
  { id: 'endocrinologia', label: 'Endocrinología', icon: '⚡', defaultPrep: 'Llevar perfil tiroideo TSH y hemoglobina glicosilada' },
  { id: 'general', label: 'Chequeo General / Preventivo', icon: '📋', defaultPrep: 'Historial de vacunas y síntomas recientes' },
  { id: 'otro', label: 'Otra Especialidad', icon: '🏥', defaultPrep: '' },
];

export const MedicalAppointmentsView: React.FC<MedicalAppointmentsViewProps> = ({
  appointments,
  examNotes,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onAddExamNote,
  onUpdateExamNote,
  onDeleteExamNote,
  onOpenNewTaskModal,
  onResetMedicalData,
}) => {
  const { isDark } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'citas' | 'examenes' | 'directorio'>('citas');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<MedicalAppointment | null>(null);

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<MedicalExamNote | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [activeNoteTarget, setActiveNoteTarget] = useState<{ type: 'appointment' | 'exam'; id: string } | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');

  // Form states for Appointment Modal
  const [formSpecialty, setFormSpecialty] = useState<string>('odontologia');
  const [formSpecialtyLabel, setFormSpecialtyLabel] = useState<string>('Odontología / Dentista');
  const [formDoctorName, setFormDoctorName] = useState<string>('');
  const [formClinic, setFormClinic] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formTime, setFormTime] = useState<string>('09:00');
  const [formStatus, setFormStatus] = useState<AppointmentStatus>('programada');
  const [formReason, setFormReason] = useState<string>('');
  const [formPrep, setFormPrep] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');

  // Form states for Exam Note Modal
  const [examSpecialty, setExamSpecialty] = useState<string>('Medicina Interna');
  const [examDoctorName, setExamDoctorName] = useState<string>('');
  const [examTitle, setExamTitle] = useState<string>('');
  const [examDate, setExamDate] = useState<string>('');
  const [examStatus, setExamStatus] = useState<'pendiente_muestra' | 'esperando_resultados' | 'completado'>('pendiente_muestra');
  const [examInstructions, setExamInstructions] = useState<string>('');
  const [examResults, setExamResults] = useState<string>('');

  // Date Offset Calculator (+1 Month, +4 Months, +6 Months, +1 Year)
  const setQuickDateOffset = (monthsAhead: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setFormDate(`${yyyy}-${mm}-${dd}`);
  };

  const setExamQuickDateOffset = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setExamDate(`${yyyy}-${mm}-${dd}`);
  };

  // Helper for human-readable countdown / timing
  const getTimeDiffDescription = (dateStr: string) => {
    if (!dateStr) return { text: 'Sin fecha', color: 'text-slate-400', isPast: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return { text: `Realizada hace ${absDays} días`, color: 'text-slate-400', isPast: true };
    }
    if (diffDays === 0) {
      return { text: '¡HOY es la cita médica!', color: 'text-amber-300 font-bold', isPast: false };
    }
    if (diffDays === 1) {
      return { text: 'Mañana', color: 'text-amber-400 font-bold', isPast: false };
    }
    if (diffDays <= 7) {
      return { text: `Esta semana (en ${diffDays} días)`, color: 'text-cyan-300 font-bold', isPast: false };
    }
    if (diffDays <= 30) {
      return { text: `En ${diffDays} días`, color: 'text-cyan-400', isPast: false };
    }
    const months = Math.floor(diffDays / 30.4);
    const remDays = Math.floor(diffDays % 30.4);
    if (remDays === 0) {
      return { text: `En exactamente ${months} meses`, color: 'text-purple-300', isPast: false };
    }
    return { text: `En ${months} meses y ${remDays} días`, color: 'text-purple-300', isPast: false };
  };

  // Open Appointment Modal for Create or Edit
  const handleOpenAppointmentModal = (appointment?: MedicalAppointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormSpecialty(appointment.specialty);
      setFormSpecialtyLabel(appointment.specialtyLabel);
      setFormDoctorName(appointment.doctorName || '');
      setFormClinic(appointment.clinicOrLocation || '');
      setFormDate(appointment.appointmentDate);
      setFormTime(appointment.appointmentTime || '09:00');
      setFormStatus(appointment.status);
      setFormReason(appointment.reason || '');
      setFormPrep(appointment.preparationNotes || '');
      setFormPhone(appointment.phone || '');
    } else {
      setEditingAppointment(null);
      setFormSpecialty('odontologia');
      setFormSpecialtyLabel('Odontología / Dentista');
      setFormDoctorName('');
      setFormClinic('');
      // Default to 4 months ahead as a smart starting point
      const d = new Date();
      d.setMonth(d.getMonth() + 4);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setFormDate(`${yyyy}-${mm}-${dd}`);
      setFormTime('09:30');
      setFormStatus('programada');
      setFormReason('');
      setFormPrep('Llevar radiografía previa o registro de revisiones anteriores');
      setFormPhone('');
    }
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formSpecialtyLabel) return;

    if (editingAppointment) {
      onUpdateAppointment({
        ...editingAppointment,
        specialty: formSpecialty,
        specialtyLabel: formSpecialtyLabel,
        doctorName: formDoctorName,
        clinicOrLocation: formClinic,
        appointmentDate: formDate,
        appointmentTime: formTime,
        status: formStatus,
        reason: formReason,
        preparationNotes: formPrep,
        phone: formPhone,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddAppointment({
        specialty: formSpecialty,
        specialtyLabel: formSpecialtyLabel,
        doctorName: formDoctorName,
        clinicOrLocation: formClinic,
        appointmentDate: formDate,
        appointmentTime: formTime,
        status: formStatus,
        reason: formReason,
        preparationNotes: formPrep,
        phone: formPhone,
        notesHistory: [
          { id: `nh-${Date.now()}`, date: new Date().toISOString().split('T')[0], text: 'Cita programada en el sistema LifeBlocks.' }
        ],
      });
    }
    setIsAppointmentModalOpen(false);
  };

  // Open Exam Modal for Create or Edit
  const handleOpenExamModal = (exam?: MedicalExamNote) => {
    if (exam) {
      setEditingExam(exam);
      setExamSpecialty(exam.specialty);
      setExamDoctorName(exam.doctorName || '');
      setExamTitle(exam.title);
      setExamDate(exam.date);
      setExamStatus(exam.status);
      setExamInstructions(exam.instructions || '');
      setExamResults(exam.resultsSummary || '');
    } else {
      setEditingExam(null);
      setExamSpecialty('Medicina Interna');
      setExamDoctorName('');
      setExamTitle('Examen de sangre - Hemoglobina y Perfil Lipídico');
      const today = new Date().toISOString().split('T')[0];
      setExamDate(today);
      setExamStatus('pendiente_muestra');
      setExamInstructions('El internista mandó a hacer examen de sangre para revisar la hemoglobina y glucosa.');
      setExamResults('');
    }
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle || !examDate) return;

    if (editingExam) {
      onUpdateExamNote({
        ...editingExam,
        specialty: examSpecialty,
        doctorName: examDoctorName,
        title: examTitle,
        date: examDate,
        status: examStatus,
        instructions: examInstructions,
        resultsSummary: examResults,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddExamNote({
        specialty: examSpecialty,
        doctorName: examDoctorName,
        title: examTitle,
        date: examDate,
        status: examStatus,
        instructions: examInstructions,
        resultsSummary: examResults,
        notesHistory: [
          { id: `nh-${Date.now()}`, date: new Date().toISOString().split('T')[0], text: 'Orden médica registrada.' }
        ],
      });
    }
    setIsExamModalOpen(false);
  };

  // Add a quick note to an appointment or exam
  const handleAddQuickNote = (type: 'appointment' | 'exam', id: string) => {
    if (!quickNoteText.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    const newEntry = { id: `entry-${Date.now()}`, date: today, text: quickNoteText.trim() };

    if (type === 'appointment') {
      const app = appointments.find(a => a.id === id);
      if (app) {
        const updated = {
          ...app,
          notesHistory: [...(app.notesHistory || []), newEntry],
          updatedAt: new Date().toISOString(),
        };
        onUpdateAppointment(updated);
      }
    } else {
      const ex = examNotes.find(e => e.id === id);
      if (ex) {
        const updated = {
          ...ex,
          notesHistory: [...(ex.notesHistory || []), newEntry],
          updatedAt: new Date().toISOString(),
        };
        onUpdateExamNote(updated);
      }
    }
    setQuickNoteText('');
  };

  // Filtered Appointments
  const sortedAppointments = [...appointments].sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
  const filteredAppointments = sortedAppointments.filter(app => {
    const matchesSpec = filterSpecialty === 'all' || app.specialty === filterSpecialty;
    const matchesSearch = searchTerm === '' || 
      app.specialtyLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.doctorName && app.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.reason && app.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.clinicOrLocation && app.clinicOrLocation.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSpec && matchesSearch;
  });

  // Upcoming nearest appointment
  const upcomingAppointments = sortedAppointments.filter(a => a.status !== 'cancelada' && a.status !== 'completada');
  const nextAppointment = upcomingAppointments[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Hero Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 shadow-xl border transition-all ${
        isDark
          ? 'bg-gradient-to-br from-[#121c38] via-[#0d162a] to-[#0a1020] border-[#24345c]'
          : 'bg-gradient-to-br from-cyan-50 via-purple-50 to-slate-50 border-cyan-200 shadow-cyan-950/5'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 p-0.5 shadow-lg shadow-purple-500/20 shrink-0">
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                isDark ? 'bg-[#0d162a] text-cyan-300' : 'bg-white text-cyan-600'
              }`}>
                <Stethoscope className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isDark
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                }`}>
                  BIENESTAR & MENTE
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isDark
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-purple-100 text-purple-800 border-purple-300'
                }`}>
                  AGENDA CLÍNICA & NOTAS
                </span>
              </div>
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight mt-1 font-mono ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Citas Médicas & Historial de Exámenes
              </h2>
              <p className={`text-xs max-w-2xl mt-1 leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Programa citas con odontólogos, urólogos e internistas a 4, 6 o más meses en adelante. Conserva el histórico de órdenes médicas, indicaciones y notas de exámenes de sangre como la hemoglobina.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenExamModal()}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm border ${
                isDark
                  ? 'bg-[#172547] hover:bg-[#1f315e] border-cyan-500/30 hover:border-cyan-400 text-cyan-200'
                  : 'bg-white hover:bg-cyan-50 border-cyan-300 text-cyan-800'
              }`}
            >
              <FileText className="w-4 h-4 text-cyan-500" />
              <span>+ Nueva Nota de Examen</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAppointmentModal()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] hover:brightness-110 text-[#00363a] text-xs font-mono font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Programar Cita Médica</span>
            </button>
          </div>
        </div>

        {/* Highlight Banner / Next Appointment Callout */}
        {nextAppointment ? (
          <div className={`mt-5 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark
              ? 'bg-gradient-to-r from-purple-950/40 via-[#151f3b] to-cyan-950/40 border-purple-500/30'
              : 'bg-gradient-to-r from-purple-50 via-white to-cyan-50 border-purple-200 shadow-sm'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${
                isDark
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-purple-100 border-purple-300 text-purple-700'
              }`}>
                {SPECIALTY_OPTIONS.find(s => s.id === nextAppointment.specialty)?.icon || '🩺'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>Próxima Consulta: {nextAppointment.specialtyLabel}</span>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold border ${
                    isDark
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                  }`}>
                    {nextAppointment.appointmentDate} • {nextAppointment.appointmentTime || '09:00'}
                  </span>
                </div>
                <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {nextAppointment.doctorName ? `Dr(a). ${nextAppointment.doctorName} • ` : ''}
                  {nextAppointment.clinicOrLocation || 'Consultorio médico'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-right">
              <div className="text-right">
                <div className={`text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tiempo restante</div>
                <div className={`text-xs font-mono font-bold ${getTimeDiffDescription(nextAppointment.appointmentDate).color}`}>
                  {getTimeDiffDescription(nextAppointment.appointmentDate).text}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAppointmentModal(nextAppointment)}
                className={`p-2 rounded-xl text-xs font-mono transition-colors cursor-pointer border ${
                  isDark
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-500/30'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300'
                }`}
                title="Ver o editar cita"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className={`mt-5 p-3 rounded-2xl border text-xs font-mono flex items-center justify-between ${
            isDark ? 'bg-[#111b33] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <span>No tienes citas médicas próximas programadas. Programa tus revisiones a 4 o 6 meses.</span>
            <button
              onClick={() => handleOpenAppointmentModal()}
              className="text-cyan-500 hover:text-cyan-600 font-bold underline cursor-pointer text-xs"
            >
              Programar ahora →
            </button>
          </div>
        )}

        {/* Sub-Tabs: Citas vs Exámenes vs Directorio */}
        <div className={`relative z-10 mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('citas')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'citas'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-lg shadow-cyan-500/25'
                  : isDark
                    ? 'text-slate-300 hover:text-white bg-[#121c33]/70 hover:bg-[#182645]'
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda de Citas ({appointments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('examenes')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'examenes'
                  ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-[#0b1326] shadow-lg font-black'
                  : isDark
                    ? 'text-slate-300 hover:text-white bg-[#121c33]/70 hover:bg-[#182645]'
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Histórico de Exámenes & Laboratorios ({examNotes.length})</span>
            </button>
          </div>

          {onResetMedicalData && (
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#121c33]/80 hover:bg-red-500/10 border border-slate-700/60 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Borrar todas las citas y notas médicas para empezar de cero"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
              <span>Limpiar Citas Médicas</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: AGENDA DE CITAS MÉDICAS */}
      {activeSubTab === 'citas' && (
        <div className="space-y-4">
          
          {/* Filter & Search Bar */}
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border rounded-2xl ${
            isDark ? 'bg-[#11192e] border-[#213054]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className={`border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-400 ${
                  isDark ? 'bg-[#0b1326] border-[#2d3b61] text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">Todas las especialidades</option>
                {SPECIALTY_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder="Buscar doctor, clínica o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400 ${
                  isDark 
                    ? 'bg-[#0b1326] border-[#2d3b61] text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Appointments Grid */}
          {filteredAppointments.length === 0 ? (
            <div className={`p-12 text-center border border-dashed rounded-3xl space-y-3 ${
              isDark ? 'bg-[#0d162a]/60 border-slate-800' : 'bg-slate-50 border-slate-300'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 flex items-center justify-center mx-auto text-xl">
                🩺
              </div>
              <h3 className={`font-mono font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>No hay citas médicas registradas</h3>
              <p className={`text-xs max-w-md mx-auto font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Agenda tus citas con el odontólogo, urólogo o chequeos a 4 y 6 meses para que nunca se te pasen las fechas preventivas.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAppointmentModal()}
                className={`px-4 py-2 border rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40' 
                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                }`}
              >
                + Programar mi primera cita
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredAppointments.map((app) => {
                const specConfig = SPECIALTY_OPTIONS.find(s => s.id === app.specialty);
                const timeDiff = getTimeDiffDescription(app.appointmentDate);
                const isCompleted = app.status === 'completada';
                const isConfirmed = app.status === 'confirmada';

                // Find linked exam notes
                const linkedExams = examNotes.filter(e => app.linkedExamNotes?.includes(e.id) || e.appointmentId === app.id);

                return (
                  <div
                    key={app.id}
                    className={`relative rounded-2xl sm:rounded-3xl p-3 sm:p-5 border transition-all duration-200 flex flex-col justify-between space-y-3 sm:space-y-4 ${
                      isCompleted 
                        ? isDark ? 'bg-[#0a1122]/60 border-slate-800/80 opacity-75' : 'bg-slate-50/80 border-slate-200 opacity-75'
                        : isConfirmed
                        ? isDark 
                          ? 'bg-gradient-to-b from-[#121f3f] to-[#0c152b] border-cyan-500/40 shadow-lg shadow-cyan-950/20' 
                          : 'bg-gradient-to-b from-cyan-50/60 to-white border-cyan-300 shadow-md'
                        : isDark
                        ? 'bg-[#101a33] border-[#223359] hover:border-cyan-500/30'
                        : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'
                    }`}
                  >
                    {/* Header with Specialty & Icon */}
                    <div>
                      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <span className={`text-lg sm:text-2xl p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border shadow-sm shrink-0 ${
                            isDark ? 'bg-[#162345] border-[#2b3e6c]' : 'bg-cyan-50 border-cyan-200'
                          }`}>
                            {specConfig?.icon || '🩺'}
                          </span>
                          <div className="min-w-0">
                            <span className={`text-[11px] sm:text-xs font-mono font-bold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {app.specialtyLabel}
                            </span>
                            <span className={`text-[9px] sm:text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full border inline-block mt-0.5 ${
                              app.status === 'confirmada' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' :
                              app.status === 'completada' ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700' :
                              app.status === 'cancelada' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' :
                              'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/30'
                            }`}>
                              ● {app.status.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Top Timing Badge */}
                        <div className="text-right shrink-0">
                          <div className={`text-[10px] sm:text-[11px] font-mono font-bold ${timeDiff.color}`}>
                            {timeDiff.text}
                          </div>
                          <div className={`text-[9px] sm:text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {app.appointmentDate}
                          </div>
                        </div>
                      </div>

                      {/* Doctor & Location info */}
                      <div className={`mt-2.5 sm:mt-3.5 space-y-1 text-[11px] sm:text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {app.doctorName && (
                          <div className={`flex items-center space-x-1.5 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>Dr:</span>
                            <span className="truncate">{app.doctorName}</span>
                          </div>
                        )}
                        {app.clinicOrLocation && (
                          <div className={`flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            <MapPin className={`w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            <span className="truncate">{app.clinicOrLocation}</span>
                          </div>
                        )}
                        {app.phone && (
                          <div className={`flex items-center space-x-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{app.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Reason / Motivo */}
                      {app.reason && (
                        <div className={`mt-2 sm:mt-3 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs ${
                          isDark ? 'bg-[#0b1326] border-[#1f2e52] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}>
                          <span className={`text-[9px] sm:text-[10px] font-mono block font-bold mb-0.5 ${
                            isDark ? 'text-cyan-300' : 'text-cyan-800'
                          }`}>Motivo / Chequeo:</span>
                          <p className="line-clamp-2 leading-relaxed">{app.reason}</p>
                        </div>
                      )}

                      {/* Preparation Notes / Exam note requirement */}
                      {app.preparationNotes && (
                        <div className={`mt-1.5 sm:mt-2 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs ${
                          isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-200/90' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          <span className={`text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-1 mb-0.5 ${
                            isDark ? 'text-amber-300' : 'text-amber-800'
                          }`}>
                            <AlertCircle className="w-3 h-3" /> Indicación previa:
                          </span>
                          <p className="line-clamp-2 leading-relaxed">{app.preparationNotes}</p>
                        </div>
                      )}

                      {/* Linked Lab Exams count */}
                      {linkedExams.length > 0 && (
                        <div className={`mt-2 flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-mono p-1.5 sm:p-2 rounded-xl border ${
                          isDark ? 'text-purple-300 bg-purple-500/10 border-purple-500/20' : 'text-purple-800 bg-purple-50 border-purple-200'
                        }`}>
                          <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-purple-500" />
                          <span className="truncate">{linkedExams.length} orden(es) examen</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className={`pt-2.5 sm:pt-3 border-t flex items-center justify-between gap-1 ${
                      isDark ? 'border-slate-800/80' : 'border-slate-200'
                    }`}>
                      {/* Mark Status Quick buttons */}
                      <div className="flex items-center space-x-1">
                        {app.status !== 'completada' ? (
                          <button
                            type="button"
                            onClick={() => onUpdateAppointment({ ...app, status: 'completada', updatedAt: new Date().toISOString() })}
                            className={`p-1 sm:p-1.5 rounded-lg border text-[10px] sm:text-xs font-mono flex items-center space-x-1 cursor-pointer ${
                              isDark ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                            title="Marcar cita como realizada / asistida"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="hidden sm:inline text-[10px]">Realizada</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUpdateAppointment({ ...app, status: 'programada', updatedAt: new Date().toISOString() })}
                            className={`p-1 sm:p-1.5 rounded-lg border text-[10px] sm:text-xs font-mono flex items-center space-x-1 cursor-pointer ${
                              isDark ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                            }`}
                            title="Reabrir / reprogramar cita"
                          >
                            <RotateCcw className="w-3 h-3 text-cyan-500" />
                            <span className="text-[10px]">Reabrir</span>
                          </button>
                        )}

                        {onOpenNewTaskModal && (
                          <button
                            type="button"
                            onClick={() => onOpenNewTaskModal({
                              title: `Cita Médica: ${app.specialtyLabel} - ${app.doctorName || 'Control'}`,
                              category: 'bienestar_mente',
                              dueDate: app.appointmentDate,
                              assignedDate: app.appointmentDate,
                              timeSlot: app.appointmentTime ? `${app.appointmentTime} - 1 hora` : undefined,
                              description: `${app.reason || 'Revisión médica'}. Lugar: ${app.clinicOrLocation || 'Consultorio'}. Indicaciones: ${app.preparationNotes || 'Ninguna'}`,
                              priority: 'alta',
                              finalGoal: `Asistir a la cita de ${app.specialtyLabel} y dar seguimiento a los resultados`,
                            })}
                            className={`p-1 sm:p-1.5 rounded-lg border text-[10px] sm:text-xs font-mono flex items-center space-x-1 cursor-pointer ${
                              isDark ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300'
                            }`}
                            title="Agendar en el Calendario / Metas de LifeBlocks"
                          >
                            <CalendarDays className="w-3.5 h-3.5 text-purple-500" />
                            <span className="hidden sm:inline text-[10px]">Al Calendario</span>
                          </button>
                        )}
                      </div>

                      {/* Edit / Delete / Notes */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenAppointmentModal(app)}
                          className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Editar cita médica"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar la cita médica de ${app.specialtyLabel}?`)) {
                              onDeleteAppointment(app.id);
                            }
                          }}
                          className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600'
                          }`}
                          title="Eliminar cita médica"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: HISTÓRICO DE EXÁMENES & NOTAS DE LABORATORIO */}
      {activeSubTab === 'examenes' && (
        <div className="space-y-4">
          
          {/* Header Action Strip */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-[#11192e] border-[#213054]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <h3 className={`text-sm font-bold font-mono flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Histórico de Exámenes, Órdenes & Notas de Laboratorio</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Bitácora de órdenes médicas, laboratorios (ej: examen de sangre para hemoglobina, ecografías, radiografías) y notas clínicas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenExamModal()}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 text-white text-xs font-mono font-bold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Registrar Examen</span>
            </button>
          </div>

          {/* Exam Notes List */}
          {examNotes.length === 0 ? (
            <div className={`p-12 text-center border border-dashed rounded-3xl space-y-3 ${
              isDark ? 'bg-[#0d162a]/60 border-slate-800' : 'bg-slate-50 border-slate-300'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto text-xl">
                🧬
              </div>
              <h3 className={`font-mono font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>No hay notas de exámenes registradas</h3>
              <p className={`text-xs max-w-md mx-auto font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Registra órdenes de exámenes de sangre, perfiles de hemoglobina, ecografías y las indicaciones que te dio el internista u otros médicos.
              </p>
              <button
                type="button"
                onClick={() => handleOpenExamModal()}
                className={`px-4 py-2 border rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40' 
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300'
                }`}
              >
                + Registrar primera nota de examen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {examNotes.map((exam) => {
                const isExpanded = activeNoteTarget?.type === 'exam' && activeNoteTarget.id === exam.id;

                return (
                  <div
                    key={exam.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3 ${
                      isDark ? 'bg-[#101a33] border-[#223359] hover:border-purple-500/30' : 'bg-white border-slate-200 hover:border-purple-300 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-lg shrink-0 mt-0.5 ${
                          isDark ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'
                        }`}>
                          🧬
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-300'
                            }`}>
                              {exam.specialty}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              exam.status === 'completado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' :
                              exam.status === 'esperando_resultados' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/30' :
                              'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
                            }`}>
                              {exam.status === 'completado' ? '● RESULTADOS LISTOS' :
                               exam.status === 'esperando_resultados' ? '● EN ESPERA' :
                               '● PENDIENTE POR TOMAR'}
                            </span>
                          </div>
                          <h4 className={`text-sm font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {exam.title}
                          </h4>
                          {exam.doctorName && (
                            <p className={`text-xs font-sans mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              Solicitado por: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{exam.doctorName}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`text-xs font-mono px-2.5 py-1 rounded-xl border ${
                          isDark ? 'text-slate-400 bg-[#0b1326] border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200'
                        }`}>
                          📅 {exam.date}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenExamModal(exam)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Editar examen"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar la nota de examen "${exam.title}"?`)) {
                              onDeleteExamNote(exam.id);
                            }
                          }}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            isDark ? 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600'
                          }`}
                          title="Eliminar examen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Instructions & Notes Details */}
                    {exam.instructions && (
                      <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                        isDark ? 'bg-[#0b1326] border-[#1d2a4a] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <span className={`text-[10px] font-mono font-bold block ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                          📝 Indicaciones Médicas / Motivo de la orden:
                        </span>
                        <p className="leading-relaxed">{exam.instructions}</p>
                      </div>
                    )}

                    {exam.resultsSummary && (
                      <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                        isDark ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}>
                        <span className={`text-[10px] font-mono font-bold block ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                          🔬 Resultados Obtenidos / Conclusión:
                        </span>
                        <p className="leading-relaxed">{exam.resultsSummary}</p>
                      </div>
                    )}

                    {/* Mini Notes History */}
                    {exam.notesHistory && exam.notesHistory.length > 0 && (
                      <div className={`pt-2 border-t space-y-1.5 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                        <span className={`text-[10px] font-mono uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Bitácora de seguimiento:
                        </span>
                        <div className="space-y-1">
                          {exam.notesHistory.map((note) => (
                            <div key={note.id} className={`text-xs flex items-start space-x-2 p-2 rounded-xl border ${
                              isDark ? 'text-slate-300 bg-[#0c1426] border-slate-800' : 'text-slate-700 bg-slate-50 border-slate-200'
                            }`}>
                              <span className="text-[10px] font-mono text-purple-500 shrink-0 font-bold">{note.date}</span>
                              <span className="font-sans leading-relaxed">{note.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Add Note Input */}
                    <div className="pt-2 flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Agregar nota rápida a este examen (ej: Ya tomé la muestra en el laboratorio)..."
                        value={isExpanded ? quickNoteText : ''}
                        onFocus={() => setActiveNoteTarget({ type: 'exam', id: exam.id })}
                        onChange={(e) => {
                          setActiveNoteTarget({ type: 'exam', id: exam.id });
                          setQuickNoteText(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddQuickNote('exam', exam.id);
                          }
                        }}
                        className={`flex-1 border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-400 ${
                          isDark ? 'bg-[#091020] border-[#213054] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddQuickNote('exam', exam.id)}
                        disabled={!quickNoteText.trim() || activeNoteTarget?.id !== exam.id}
                        className={`px-3 py-1.5 border rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1 ${
                          isDark ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30' : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span>Anotar</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: PROGRAMAR / EDITAR CITA MÉDICA                       */}
      {/* ------------------------------------------------------------- */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin border ${
              isDark ? 'bg-[#0d162a] border-[#24345c]' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#24345c]' : 'border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-lg ${
                  isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                }`}>
                  🩺
                </div>
                <div>
                  <h3 className={`font-mono font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {editingAppointment ? 'Editar Cita Médica' : 'Programar Nueva Cita Médica'}
                  </h3>
                  <p className={`text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Define la especialidad, doctor y programa a 4 o 6 meses en adelante.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAppointmentModalOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4 text-xs font-sans">
              
              {/* Especialidad selector */}
              <div>
                <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Especialidad Médica *
                </label>
                <select
                  value={formSpecialty}
                  onChange={(e) => {
                    const sel = e.target.value;
                    setFormSpecialty(sel);
                    const opt = SPECIALTY_OPTIONS.find(o => o.id === sel);
                    if (opt) {
                      setFormSpecialtyLabel(opt.label);
                      if (!formPrep && opt.defaultPrep) {
                        setFormPrep(opt.defaultPrep);
                      }
                    }
                  }}
                  className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-cyan-400 ${
                    isDark ? 'bg-[#111c36] border-[#213054] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {SPECIALTY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Name & Clinic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Doctor(a) / Especialista
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Dr. Gómez, Dra. Morales"
                    value={formDoctorName}
                    onChange={(e) => setFormDoctorName(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 ${
                      isDark ? 'bg-[#111c36] border-[#213054] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Clínica / Consultorio / Ciudad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Clínica Medellín Cons. 402"
                    value={formClinic}
                    onChange={(e) => setFormClinic(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 ${
                      isDark ? 'bg-[#111c36] border-[#213054] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Date Selection + FAR DATE PRESETS */}
              <div className={`p-3.5 border rounded-2xl space-y-2.5 ${
                isDark ? 'bg-[#091020] border-[#24345c]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <label className={`font-mono font-bold text-xs flex items-center space-x-1.5 ${
                    isDark ? 'text-cyan-300' : 'text-cyan-800'
                  }`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Fecha y Hora de la Cita *</span>
                  </label>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formDate ? getTimeDiffDescription(formDate).text : ''}
                  </span>
                </div>

                {/* Quick Presets for 4 and 6 months */}
                <div>
                  <span className={`text-[10px] font-mono block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    ⚡ Programar a fecha lejana (1-Clic):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickDateOffset(1)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                        isDark ? 'bg-[#142244] hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                      }`}
                    >
                      +1 Mes
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDateOffset(3)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                        isDark ? 'bg-[#142244] hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                      }`}
                    >
                      +3 Meses
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDateOffset(4)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-black border cursor-pointer shadow-sm ${
                        isDark 
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-cyan-200 border-cyan-400/50' 
                          : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border-cyan-400'
                      }`}
                    >
                      🦷 +4 Meses (Odontología)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDateOffset(6)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-black border cursor-pointer shadow-sm ${
                        isDark 
                          ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-purple-200 border-purple-400/50' 
                          : 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-400'
                      }`}
                    >
                      🩺 +6 Meses (Urología/Control)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDateOffset(12)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                        isDark ? 'bg-[#142244] hover:bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300'
                      }`}
                    >
                      +1 Año
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-cyan-400 ${
                        isDark ? 'bg-[#111c36] border-[#213054] text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-cyan-400 ${
                        isDark ? 'bg-[#111c36] border-[#213054] text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Status & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Estado de la Cita
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AppointmentStatus)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-cyan-400 ${
                      isDark ? 'bg-[#111c36] border-[#213054] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="programada">📅 Programada / Pendiente</option>
                    <option value="confirmada">✅ Confirmada</option>
                    <option value="completada">🎉 Completada / Realizada</option>
                    <option value="cancelada">❌ Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Teléfono / WhatsApp de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: +57 300 123 4567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 ${
                      isDark ? 'bg-[#111c36] border-[#213054] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Reason / Motivo */}
              <div>
                <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Motivo de la Consulta / Procedimiento
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Control semestral de odontología, profilaxis y limpieza; o revisión de antígeno prostático y ecografía..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-cyan-400 resize-none ${
                    isDark ? 'bg-[#111c36] border-[#213054] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Preparation / Exam notes required */}
              <div>
                <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                  Indicación / Nota del Último Examen Previo
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Llevar resultado de examen de sangre para que el internista revise la hemoglobina; o ayuno de 10 horas..."
                  value={formPrep}
                  onChange={(e) => setFormPrep(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-amber-400 resize-none ${
                    isDark ? 'bg-[#111c36] border-amber-500/30 text-white placeholder-slate-500' : 'bg-amber-50 border-amber-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Submit Buttons */}
              <div className={`flex items-center justify-end space-x-2 pt-2 border-t ${
                isDark ? 'border-[#24345c]' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className={`px-4 py-2 font-mono font-bold rounded-xl cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-mono font-black rounded-xl shadow-lg shadow-cyan-500/30 hover:brightness-110 cursor-pointer"
                >
                  {editingAppointment ? 'Guardar Cambios' : 'Agendar Cita Médica'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: REGISTRAR / EDITAR NOTA DE EXAMEN DE LABORATORIO     */}
      {/* ------------------------------------------------------------- */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin border ${
              isDark ? 'bg-[#0d162a] border-[#24345c]' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#24345c]' : 'border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-lg ${
                  isDark ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'
                }`}>
                  🧬
                </div>
                <div>
                  <h3 className={`font-mono font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {editingExam ? 'Editar Nota de Examen' : 'Registrar Examen o Laboratorio'}
                  </h3>
                  <p className={`text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Anota órdenes de hemoglobina, exámenes de sangre, indicaciones y resultados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExamModalOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs font-sans">
              
              {/* Título del Examen */}
              <div>
                <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nombre del Examen / Estudio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Examen de sangre - Hemoglobina, Ferritina y Glucosa"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 ${
                    isDark ? 'bg-[#111c36] border-[#213054] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Especialidad & Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Especialidad Médica
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Medicina Interna, Odontología, Urología"
                    value={examSpecialty}
                    onChange={(e) => setExamSpecialty(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 ${
                      isDark ? 'bg-[#111c36] border-[#213054] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Médico Solicitante
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Dr. Alejandro Restrepo"
                    value={examDoctorName}
                    onChange={(e) => setExamDoctorName(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 ${
                      isDark ? 'bg-[#111c36] border-[#213054] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Fecha de la Orden / Muestra *
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-purple-400 ${
                      isDark ? 'bg-[#111c36] border-[#213054] text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Estado del Examen
                  </label>
                  <select
                    value={examStatus}
                    onChange={(e) => setExamStatus(e.target.value as any)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-purple-400 ${
                      isDark ? 'bg-[#111c36] border-[#213054] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="pendiente_muestra">🟡 Pendiente por tomar muestra</option>
                    <option value="esperando_resultados">🔵 Esperando resultados de lab</option>
                    <option value="completado">🟢 Resultados listos / Analizado</option>
                  </select>
                </div>
              </div>

              {/* Instructions / Indicaciones médicas */}
              <div>
                <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                  Indicaciones del Médico / Ayuno / Motivo
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: El internista mandó a hacer examen de sangre para revisar la hemoglobina, ferritina y glucosa en ayunas de 10 horas..."
                  value={examInstructions}
                  onChange={(e) => setExamInstructions(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-cyan-400 resize-none ${
                    isDark ? 'bg-[#111c36] border-cyan-500/30 text-white placeholder-slate-500' : 'bg-cyan-50 border-cyan-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Results / Resultados */}
              <div>
                <label className={`block font-mono font-bold mb-1 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  Resultados / Conclusión del Laboratorio
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Hemoglobina en 14.5 g/dL (normal), glucosa 88 mg/dL. El internista indicó continuar con la dieta y repetir en 1 año..."
                  value={examResults}
                  onChange={(e) => setExamResults(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-emerald-400 resize-none ${
                    isDark ? 'bg-[#111c36] border-emerald-500/30 text-white placeholder-slate-500' : 'bg-emerald-50 border-emerald-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Submit Buttons */}
              <div className={`flex items-center justify-end space-x-2 pt-2 border-t ${
                isDark ? 'border-[#24345c]' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className={`px-4 py-2 font-mono font-bold rounded-xl cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-mono font-black rounded-xl shadow-lg shadow-purple-500/30 hover:brightness-110 cursor-pointer"
                >
                  {editingExam ? 'Guardar Cambios' : 'Registrar Examen'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FRESH START CONFIRMATION MODAL                                */}
      {/* ------------------------------------------------------------- */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0d162a] border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-mono font-black text-white text-base">¿Limpiar Citas Médicas?</h3>
                <p className="text-xs text-slate-400 font-sans">Fresh Start de Agenda & Notas de Exámenes</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Esta acción eliminará todas las citas médicas agendadas y el historial de órdenes de exámenes de laboratorio para que puedas empezar desde cero.
            </p>

            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-[11px] text-red-300 font-mono">
              ⚠️ Esta acción no se puede deshacer.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  if (onResetMedicalData) {
                    onResetMedicalData();
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-black rounded-xl shadow-lg shadow-red-500/30 cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Limpiar Citas</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
