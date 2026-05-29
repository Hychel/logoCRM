import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertCircle, 
  Check, 
  X,
  UserCheck
} from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export const PatientTable = ({ onViewCard, triggerModal, setTriggerModal }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("true"); // Default to Active

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null); // null for create, object for edit
  const [formData, setFormData] = useState({
    full_name: "",
    birth_date: "",
    parent_name: "",
    parent_phone: "",
    diagnosis: "",
    therapist_id: "",
    is_active: true
  });
  const [formError, setFormError] = useState("");

  const fetchPatients = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (selectedTherapist) queryParams.push(`therapist_id=${selectedTherapist}`);
      if (selectedStatus) queryParams.push(`is_active=${selectedStatus}`);
      
      const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";
      const data = await api.get(`/api/patients${queryString}`);
      setPatients(data);
    } catch (err) {
      console.error("Помилка завантаження пацієнтів", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, selectedTherapist, selectedStatus]);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const data = await api.get("/api/auth/therapists");
        setTherapists(data);
      } catch (err) {
        console.error("Не вдалося завантажити логопедів", err);
      }
    };
    fetchTherapists();
  }, []);

  // Listen to outer quick actions
  useEffect(() => {
    if (triggerModal === "create-patient") {
      openCreateModal();
      setTriggerModal("");
    }
  }, [triggerModal]);

  const openCreateModal = () => {
    setCurrentPatient(null);
    setFormData({
      full_name: "",
      birth_date: "",
      parent_name: "",
      parent_phone: "",
      diagnosis: "",
      therapist_id: therapists[0]?.id ? String(therapists[0].id) : "",
      is_active: true
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (patient) => {
    setCurrentPatient(patient);
    setFormData({
      full_name: patient.full_name,
      birth_date: patient.birth_date,
      parent_name: patient.parent_name || "",
      parent_phone: patient.parent_phone || "",
      diagnosis: patient.diagnosis || "",
      therapist_id: patient.therapist_id ? String(patient.therapist_id) : "",
      is_active: patient.is_active
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    
    if (!formData.full_name.trim()) {
      setFormError("ПІБ пацієнта є обов'язковим");
      return;
    }
    if (!formData.birth_date) {
      setFormError("Дата народження є обов'язковою");
      return;
    }

    try {
      const payload = {
        ...formData,
        therapist_id: formData.therapist_id ? Number(formData.therapist_id) : null
      };

      if (currentPatient) {
        // Update patient
        await api.put(`/api/patients/${currentPatient.id}`, payload);
      } else {
        // Create patient
        await api.post("/api/patients", payload);
      }
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      setFormError(err.message || "Не вдалося зберегти дані пацієнта");
    }
  };

  const handleDeletePatient = async (id) => {
    if (window.confirm("Ви дійсно хочете видалити цього пацієнта з бази даних? Ця дія незворотна!")) {
      try {
        await api.delete(`/api/patients/${id}`);
        fetchPatients();
      } catch (err) {
        alert(err.message || "Помилка при видаленні пацієнта");
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Пацієнти</h2>
          <p className="text-slate-400 mt-1">Керування профілями пацієнтів та перегляд їхніх карток розвитку.</p>
        </div>
        
        {/* Create Patient trigger */}
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-650 to-indigo-650 text-white shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 text-sm font-semibold transition-all hover:brightness-110 md:self-end"
        >
          <Plus className="w-5 h-5" />
          Додати пацієнта
        </button>
      </div>

      {/* Grid Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-dark-900 border border-dark-800/80 shadow-md">
        
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-5 h-5 text-slate-450 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Пошук за ПІБ дитини..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Therapist filter */}
        {user?.role === "admin" && (
          <div className="relative">
            <select
              value={selectedTherapist}
              onChange={(e) => setSelectedTherapist(e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="">Всі спеціалісти</option>
              {therapists.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Active/Inactive status */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="true">Активні пацієнти</option>
            <option value="false">Архів пацієнтів</option>
            <option value="">Усі записи</option>
          </select>
          <Filter className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Main Grid Table container */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 py-16">
            <AlertCircle className="w-12 h-12 text-dark-700 stroke-[1.5] mb-2" />
            <p className="text-sm">Пацієнтів не знайдено за вказаними фільтрами.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-dark-800 bg-dark-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">ПІБ Дитини</th>
                  <th className="py-4 px-6">Вік / ДН</th>
                  <th className="py-4 px-6">Батьки / Контакти</th>
                  <th className="py-4 px-6">Діагноз / Запит</th>
                  <th className="py-4 px-6">Логопед</th>
                  <th className="py-4 px-6 text-center">Абонемент</th>
                  <th className="py-4 px-6 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60 bg-dark-900/10">
                {patients.map((patient) => {
                  // Calculate age
                  const birthYear = new Date(patient.birth_date).getFullYear();
                  const currentYear = new Date().getFullYear();
                  const age = currentYear - birthYear;
                  
                  return (
                    <tr key={patient.id} className="hover:bg-dark-800/10 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            patient.is_active 
                              ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" 
                              : "bg-dark-800 text-slate-500 border border-dark-700"
                          }`}>
                            {patient.full_name?.substring(0, 2) || "П"}
                          </div>
                          <div>
                            <span className={`font-semibold text-sm ${patient.is_active ? "text-white" : "text-slate-500 line-through"}`}>
                              {patient.full_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 text-sm">
                        {age} років <span className="text-xs text-slate-500">({patient.birth_date})</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs">
                          <p className="font-semibold text-slate-200">{patient.parent_name || "—"}</p>
                          <p className="text-slate-400 mt-0.5">{patient.parent_phone || "—"}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm max-w-[200px] truncate" title={patient.diagnosis}>
                        <span className="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 max-w-[180px] block truncate font-medium">
                          {patient.diagnosis || "Не вказано"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-300 text-sm">
                        {patient.therapist ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                            {patient.therapist.full_name?.split(" ").slice(0, 2).join(" ")}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Не призначено</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full inline-block ${
                          patient.remaining_lessons > 2 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : patient.remaining_lessons > 0 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {patient.remaining_lessons} занять
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewCard(patient)}
                            className="p-2 rounded-lg bg-dark-800 text-slate-300 hover:text-white hover:bg-brand-600 transition-all"
                            title="Переглянути картку розвитку"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => openEditModal(patient)}
                            className="p-2 rounded-lg bg-dark-800 text-slate-350 hover:text-white hover:bg-slate-700 transition-all"
                            title="Редагувати профіль"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          {user?.role === "admin" && (
                            <button
                              onClick={() => handleDeletePatient(patient.id)}
                              className="p-2 rounded-lg bg-dark-800 text-red-400 hover:text-white hover:bg-red-655 transition-all"
                              title="Видалити пацієнта"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Elegant modal popup to Create or Edit Patient */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-dark-800 flex items-center justify-between bg-dark-900/60">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {currentPatient ? "Редагувати профіль пацієнта" : "Додати нового пацієнта"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-450 hover:bg-dark-850 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-550/20 text-xs font-semibold text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {formError}
                </div>
              )}

              {/* ПІБ */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ПІБ Дитини *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Ковальчук Максим Дмитрович"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Дата народження */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Дата народження *</label>
                <input
                  type="date"
                  required
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Батьки */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ім'я одного з батьків</label>
                  <input
                    type="text"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
                    placeholder="Ковальчук Дмитро"
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Телефон *</label>
                  <input
                    type="text"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                    placeholder="+380671234567"
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Діагноз */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Діагноз / Запит логопеду</label>
                <textarea
                  rows={2}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  placeholder="Дислалія, ЗРМ, алалія..."
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              {/* Логопед */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Призначений Логопед</label>
                <select
                  value={formData.therapist_id}
                  onChange={(e) => setFormData({...formData, therapist_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
                >
                  <option value="">Не призначено (вільний розподіл)</option>
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.specialty})</option>
                  ))}
                </select>
              </div>

              {/* Статус */}
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="is_active_checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 rounded border-dark-800 text-brand-500 bg-dark-950 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is_active_checkbox" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Активний пацієнт (якщо зняти, буде збережено в Архів)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-dark-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 text-sm font-semibold transition-all hover:brightness-110"
                >
                  <Check className="w-4 h-4" />
                  {currentPatient ? "Зберегти зміни" : "Створити картку"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default PatientTable;
