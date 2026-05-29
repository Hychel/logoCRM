import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  BookOpen, 
  Users, 
  Home, 
  Bookmark 
} from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export const ScheduleCalendar = ({ triggerModal, setTriggerModal }) => {
  const { user } = useAuth();
  const calendarRef = useRef(null);
  const [lessons, setLessons] = useState([]);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit / Details form state
  const [editFormData, setEditFormData] = useState({
    status: "",
    notes: "",
    target_sounds: "",
    homework: ""
  });

  // Add form state
  const [addFormData, setAddFormData] = useState({
    patient_id: "",
    therapist_id: "",
    cabinet: "Кабінет 1 (Звуковий)",
    start_time: "",
    end_time: "",
    status: "planned"
  });

  const fetchLessons = async () => {
    try {
      const data = await api.get("/api/lessons");
      setLessons(data);
    } catch (err) {
      console.error("Не вдалося завантажити розклад занять", err);
    }
  };

  const fetchPatientsAndTherapists = async () => {
    try {
      const pats = await api.get("/api/patients?is_active=true");
      setPatients(pats);
      
      const thers = await api.get("/api/auth/therapists");
      setTherapists(thers);

      // Prepopulate AddForm ids
      if (pats.length > 0 && thers.length > 0) {
        setAddFormData(prev => ({
          ...prev,
          patient_id: String(pats[0].id),
          therapist_id: String(thers[0].id)
        }));
      }
    } catch (err) {
      console.error("Помилка завантаження списків", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLessons(), fetchPatientsAndTherapists()]);
      setLoading(false);
    };
    init();
  }, []);

  // Listen to outer quick actions
  useEffect(() => {
    if (triggerModal === "schedule-lesson") {
      openAddModal();
      setTriggerModal("");
    }
  }, [triggerModal]);

  const openAddModal = (info = null) => {
    setErrorMsg("");
    let startStr = "";
    let endStr = "";
    
    if (info) {
      // If clicked slot on calendar, pre-fill times
      startStr = info.startStr.substring(0, 16);
      endStr = info.endStr.substring(0, 16);
    } else {
      // Default to today at 10:00
      const now = new Date();
      now.setHours(10, 0, 0, 0);
      startStr = now.toISOString().substring(0, 16);
      now.setHours(10, 45, 0, 0);
      endStr = now.toISOString().substring(0, 16);
    }

    setAddFormData({
      patient_id: patients[0]?.id ? String(patients[0].id) : "",
      therapist_id: therapists[0]?.id ? String(therapists[0].id) : "",
      cabinet: "Кабінет 1 (Звуковий)",
      start_time: startStr,
      end_time: endStr,
      status: "planned"
    });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!addFormData.patient_id || !addFormData.therapist_id) {
      setErrorMsg("Будь ласка, оберіть пацієнта та логопеда");
      return;
    }

    try {
      const payload = {
        patient_id: Number(addFormData.patient_id),
        therapist_id: Number(addFormData.therapist_id),
        cabinet: addFormData.cabinet,
        start_time: new Date(addFormData.start_time).toISOString(),
        end_time: new Date(addFormData.end_time).toISOString(),
        status: addFormData.status
      };

      await api.post("/api/lessons", payload);
      setIsAddModalOpen(false);
      fetchLessons();
    } catch (err) {
      setErrorMsg(err.message || "Не вдалося зберегти заняття. Можливо, кабінет або логопед зайняті!");
    }
  };

  const handleEventClick = (info) => {
    const lessonId = info.event.id;
    const lesson = lessons.find(l => String(l.id) === String(lessonId));
    if (lesson) {
      setSelectedLesson(lesson);
      setEditFormData({
        status: lesson.status,
        notes: lesson.notes || "",
        target_sounds: lesson.target_sounds || "",
        homework: lesson.homework || ""
      });
      setErrorMsg("");
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    try {
      await api.put(`/api/lessons/${selectedLesson.id}`, editFormData);
      setIsEditModalOpen(false);
      fetchLessons();
    } catch (err) {
      setErrorMsg(err.message || "Не вдалося оновити заняття");
    }
  };

  const handleDeleteLesson = async () => {
    if (window.confirm("Ви дійсно хочете видалити це заняття з розкладу?")) {
      try {
        await api.delete(`/api/lessons/${selectedLesson.id}`);
        setIsEditModalOpen(false);
        fetchLessons();
      } catch (err) {
        setErrorMsg(err.message || "Помилка при видаленні заняття");
      }
    }
  };

  // Convert DB lessons to FullCalendar events format
  const getEvents = () => {
    return lessons.map(lesson => {
      // Color-coding based on status
      let color = "#3b82f6"; // Planned (blue)
      if (lesson.status === "conducted") color = "#10b981"; // Conducted (green)
      if (lesson.status === "cancelled") color = "#ef4444"; // Cancelled (red)
      if (lesson.status === "rescheduled") color = "#f59e0b"; // Rescheduled (amber)

      return {
        id: String(lesson.id),
        title: `${lesson.patient.full_name} (${lesson.cabinet || "Каб"})`,
        start: lesson.start_time,
        end: lesson.end_time,
        backgroundColor: color,
        borderColor: color,
        textColor: "#ffffff",
      };
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Розклад</h2>
          <p className="text-slate-400 mt-1">Переглядайте робочий календар кабінетів та плануйте логопедичні сесії.</p>
        </div>
        
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-650 to-indigo-650 text-white shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 text-sm font-semibold transition-all hover:brightness-110 sm:self-end"
        >
          <Plus className="w-5 h-5" />
          Записати заняття
        </button>
      </div>

      {/* FullCalendar board panel container */}
      <div className="glass-panel rounded-2xl p-6 shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <div className="fc-theme-dark">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
              }}
              locale="uk"
              buttonText={{
                today: "Сьогодні",
                month: "Місяць",
                week: "Тиждень",
                day: "День"
              }}
              firstDay={1} // Monday
              slotMinTime="08:00:00"
              slotMaxTime="19:00:00"
              allDaySlot={false}
              slotDuration="00:15:00"
              slotLabelInterval="01:00"
              expandRows={true}
              height="auto"
              selectable={true}
              selectMirror={true}
              select={openAddModal}
              events={getEvents()}
              eventClick={handleEventClick}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
            />
          </div>
        )}
      </div>

      {/* 1. Modal: Schedule appointment */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-dark-800 flex items-center justify-between bg-dark-900/60">
              <h3 className="text-lg font-bold text-white tracking-tight">Записати на заняття</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-450 hover:bg-dark-850 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-550/20 text-xs font-semibold text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Patient selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Оберіть пацієнта *</label>
                <select
                  required
                  value={addFormData.patient_id}
                  onChange={(e) => setAddFormData({...addFormData, patient_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                >
                  {patients.length === 0 ? (
                    <option value="">Немає активних пацієнтів</option>
                  ) : (
                    patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.remaining_lessons} занять)</option>
                    ))
                  )}
                </select>
              </div>

              {/* Specialist selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Оберіть логопеда *</label>
                <select
                  required
                  value={addFormData.therapist_id}
                  onChange={(e) => setAddFormData({...addFormData, therapist_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                >
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.specialty})</option>
                  ))}
                </select>
              </div>

              {/* Cabinet Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Кабінет *</label>
                <select
                  value={addFormData.cabinet}
                  onChange={(e) => setAddFormData({...addFormData, cabinet: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="Кабінет 1 (Звуковий)">Кабінет 1 (Звуковий)</option>
                  <option value="Кабінет 2 (Ігровий)">Кабінет 2 (Ігровий)</option>
                  <option value="Кабінет 3 (Сенсорний)">Кабінет 3 (Сенсорний)</option>
                  <option value="Кабінет 4">Кабінет 4</option>
                  <option value="Кабінет 5">Кабінет 5</option>
                </select>
              </div>

              {/* Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Час початку *</label>
                  <input
                    type="datetime-local"
                    required
                    value={addFormData.start_time}
                    onChange={(e) => setAddFormData({...addFormData, start_time: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Час завершення *</label>
                  <input
                    type="datetime-local"
                    required
                    value={addFormData.end_time}
                    onChange={(e) => setAddFormData({...addFormData, end_time: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-dark-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 text-sm font-semibold transition-all hover:brightness-110"
                >
                  <Check className="w-4 h-4" />
                  Запланувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Clinical log/lesson details & Update status */}
      {isEditModalOpen && selectedLesson && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-dark-800 flex items-center justify-between bg-dark-900/60">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-brand-400" />
                Логопедичний запис: {selectedLesson.patient.full_name}
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-450 hover:bg-dark-850 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-550/20 text-xs font-semibold text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Lesson Details Card Summary */}
              <div className="p-4 rounded-xl bg-dark-950 border border-dark-850 space-y-2 text-xs">
                <p className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  <span>Час: <strong className="text-slate-200">
                    {new Date(selectedLesson.start_time).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </strong></span>
                </p>
                <p className="flex items-center gap-2 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-brand-400" />
                  <span>Логопед: <strong className="text-slate-200">{selectedLesson.therapist.full_name}</strong></span>
                </p>
                <p className="flex items-center gap-2 text-slate-400">
                  <Bookmark className="w-3.5 h-3.5 text-brand-400" />
                  <span>Кабінет: <strong className="text-slate-200">{selectedLesson.cabinet || "Не призначено"}</strong></span>
                </p>
              </div>

              {/* Status select */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Статус заняття</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="planned">Заплановано</option>
                  <option value="conducted">Проведено (автоматично спише баланс занять)</option>
                  <option value="cancelled">Скасовано клієнтом</option>
                  <option value="rescheduled">Перенесено</option>
                </select>
              </div>

              {/* Only allow editing clinical notes / speech training logs if role/conditions match */}
              {/* Target sounds */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Опрацьовані звуки
                </label>
                <input
                  type="text"
                  value={editFormData.target_sounds}
                  onChange={(e) => setEditFormData({...editFormData, target_sounds: e.target.value})}
                  placeholder="наприклад: Р, Л, або Дихання"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-650 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-brand-400" />
                  Результати занять (Clinical Notes)
                </label>
                <textarea
                  rows={3}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                  placeholder="Як пройшло заняття, який прогрес в постановці звуку..."
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-650 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              {/* Homework */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  Домашнє завдання для батьків
                </label>
                <textarea
                  rows={2}
                  value={editFormData.homework}
                  onChange={(e) => setEditFormData({...editFormData, homework: e.target.value})}
                  placeholder="Які вправи артикуляційної гімнастики повторювати вдома..."
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-650 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between border-t border-dark-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleDeleteLesson}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-colors"
                >
                  Видалити заняття
                </button>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-350 hover:text-white text-sm font-medium transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-650 to-indigo-650 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 text-sm font-semibold transition-all hover:brightness-110"
                  >
                    <Check className="w-4 h-4" />
                    Зберегти
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default ScheduleCalendar;
