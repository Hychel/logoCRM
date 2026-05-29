import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  Award, 
  FileText, 
  Plus, 
  Target, 
  Clipboard, 
  MessageSquare,
  Home,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export const PatientCard = ({ patient, onBack }) => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sound progress tracker state (mocked or persistent in localStorage to make it interactive and delightful)
  const defaultSounds = {
    "Р": "in-progress",
    "Л": "automated",
    "Ш": "not-started",
    "Ж": "not-started",
    "С": "automated",
    "З": "in-progress",
    "Ц": "not-started",
    "Ч": "not-started"
  };

  const [sounds, setSounds] = useState(() => {
    const saved = localStorage.getItem(`logo_sounds_pat_${patient.id}`);
    return saved ? JSON.parse(saved) : defaultSounds;
  });

  const updateSoundStatus = (sound, status) => {
    const updated = { ...sounds, [sound]: status };
    setSounds(updated);
    localStorage.setItem(`logo_sounds_pat_${patient.id}`, JSON.stringify(updated));
  };

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        // Fetch historical lessons for this patient
        const data = await api.get(`/api/lessons?patient_id=${patient.id}`);
        // Filter lessons that have clinical notes or conducted
        setLessons(data);
      } catch (err) {
        console.error("Не вдалося завантажити історію занять", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [patient.id]);

  const soundStatusLabels = {
    "not-started": { label: "Не розпочато", class: "bg-dark-800 text-slate-400 border-dark-700" },
    "in-progress": { label: "В роботі", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    "automated": { label: "Автоматизовано ✨", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
  };

  return (
    <div className="space-y-8">
      {/* Back button and profile header summary */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-dark-900 border border-dark-800 text-slate-400 hover:text-white hover:border-brand-500/40 hover:bg-dark-800/40 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-extrabold uppercase text-brand-400 tracking-widest">Картка розвитку пацієнта</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">{patient.full_name}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: General Profile Summary card */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-dark-800 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-400" />
              Особисті дані
            </h3>
            
            <div className="space-y-4 text-sm">
              {/* Дата народження */}
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Дата народження</span>
                <p className="text-white font-medium mt-1">{patient.birth_date}</p>
              </div>

              {/* Батьки */}
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Контактна особа (Батьки)</span>
                <p className="text-white font-medium mt-1">{patient.parent_name || "—"}</p>
              </div>

              {/* Телефон */}
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Номер телефону</span>
                <p className="text-white font-medium mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-400" />
                  {patient.parent_phone || "—"}
                </p>
              </div>

              {/* Первинний діагноз */}
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Первинний запит / Діагноз</span>
                <p className="text-white font-medium mt-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-2 rounded-xl text-xs leading-relaxed">
                  {patient.diagnosis || "Не вказано"}
                </p>
              </div>

              {/* Призначений логопед */}
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Закріплений спеціаліст</span>
                <p className="text-indigo-300 font-semibold mt-1">
                  {patient.therapist ? patient.therapist.full_name : "Вільно розподілений"}
                </p>
              </div>

              {/* Абонементний рахунок */}
              <div className="pt-4 border-t border-dark-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Баланс занять</span>
                  <p className="text-xl font-extrabold text-white mt-0.5">{patient.remaining_lessons} занять</p>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${
                  patient.remaining_lessons > 0 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {patient.remaining_lessons > 0 ? "Сплачено" : "Немає оплат"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Sound Progress Tracker Board */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-400" />
              Екран звуковимови
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">Клацніть статус біля звуку, щоб змінити динаміку автоматизації звуковимови в дитини.</p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              {Object.entries(sounds).map(([sound, status]) => (
                <div key={sound} className="p-3 rounded-xl bg-dark-900 border border-dark-800 flex flex-col justify-between gap-2 shadow-inner">
                  <span className="text-md font-extrabold text-white">{sound}</span>
                  
                  <select
                    value={status}
                    onChange={(e) => updateSoundStatus(sound, e.target.value)}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-dark-950 border border-dark-700 text-slate-200 outline-none cursor-pointer focus:border-brand-500 transition-colors"
                  >
                    <option value="not-started">Не розпочато</option>
                    <option value="in-progress">В роботі</option>
                    <option value="automated">Автоматизовано</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Timeline of visits, logopedic clinical notes, homeworks */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel rounded-2xl p-6 flex flex-col h-full min-h-[500px]">
            <h3 className="text-lg font-bold text-white border-b border-dark-800 pb-4 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-brand-400" />
              Журнал занять та динаміка розвитку
            </h3>
            
            <div className="flex-1 space-y-6 mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                </div>
              ) : lessons.filter(l => l.status === "conducted" || l.notes).length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-400 py-24">
                  <FileText className="w-12 h-12 text-dark-700 stroke-[1.5] mb-2" />
                  <p className="text-sm">Журнал порожній. Проведені логопедичні заняття з нотатками з'являться тут.</p>
                </div>
              ) : (
                <div className="relative border-l border-dark-800 ml-4 space-y-8">
                  {lessons
                    .filter(l => l.status === "conducted" || l.notes)
                    .map((lesson) => {
                      const lessonDate = new Date(lesson.start_time).toLocaleDateString('uk-UA', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                      
                      return (
                        <div key={lesson.id} className="relative pl-8 group">
                          {/* Dot indicator */}
                          <div className="w-4 h-4 rounded-full bg-brand-500 border-4 border-dark-950 absolute -left-[9px] top-1.5 group-hover:scale-125 transition-transform duration-200 shadow-md shadow-brand-500/25"></div>
                          
                          <div className="p-5 rounded-xl bg-dark-900 border border-dark-800/80 shadow-md hover:border-brand-500/20 transition-all space-y-3">
                            {/* Date, Status and Speech Therapist Name */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-850 pb-2">
                              <div>
                                <span className="text-xs font-bold text-slate-400">{lessonDate}</span>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Логопед: {lesson.therapist.full_name}</p>
                              </div>
                              
                              <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                Проведено
                              </span>
                            </div>

                            {/* Clinical logs/notes */}
                            {lesson.notes && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-extrabold uppercase text-brand-400 tracking-wider flex items-center gap-1.5">
                                  <MessageSquare className="w-3 h-3" />
                                  Результати заняття
                                </span>
                                <p className="text-sm text-slate-200 font-medium leading-relaxed">{lesson.notes}</p>
                              </div>
                            )}

                            {/* Sound targets */}
                            {lesson.target_sounds && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                                <Sparkles className="w-3 h-3 text-blue-400" />
                                Опрацьовані звуки: {lesson.target_sounds}
                              </div>
                            )}

                            {/* Homework */}
                            {lesson.homework && (
                              <div className="space-y-1 bg-dark-950/50 p-3 rounded-xl border border-dark-850">
                                <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                                  <Home className="w-3 h-3" />
                                  Домашнє завдання
                                </span>
                                <p className="text-xs text-slate-300 italic leading-relaxed">{lesson.homework}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default PatientCard;
