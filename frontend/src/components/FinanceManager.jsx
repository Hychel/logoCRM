import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Ticket, 
  Users, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  History,
  Calendar
} from "lucide-react";
import { api } from "../utils/api";

export const FinanceManager = ({ triggerModal, setTriggerModal }) => {
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_revenue: 0,
    monthly_revenue: 0,
    active_subscriptions: 0,
    lessons_conducted: 0,
    lessons_planned: 0,
    active_patients: 0
  });

  // Modal selling state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellError, setSellError] = useState("");
  const [sellForm, setSellForm] = useState({
    patient_id: "",
    total_lessons: 10,
    price_paid: 4500
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const payList = await api.get("/api/finance/payments");
      setPayments(payList);

      const statsData = await api.get("/api/finance/stats");
      setStats(statsData);

      const pats = await api.get("/api/patients?is_active=true");
      setPatients(pats);
      
      if (pats.length > 0) {
        setSellForm(prev => ({
          ...prev,
          patient_id: String(pats[0].id)
        }));
      }
    } catch (err) {
      console.error("Не вдалося завантажити фінансові дані", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to outer quick actions
  useEffect(() => {
    if (triggerModal === "sell-subscription") {
      openSellModal();
      setTriggerModal("");
    }
  }, [triggerModal]);

  const openSellModal = () => {
    setSellError("");
    setSellForm({
      patient_id: patients[0]?.id ? String(patients[0].id) : "",
      total_lessons: 10,
      price_paid: 4500
    });
    setIsSellModalOpen(true);
  };

  const handlePackageChange = (lessons) => {
    let price = 4500;
    if (lessons === 8) price = 3600;
    if (lessons === 12) price = 5200;
    if (lessons === 20) price = 8000;
    
    setSellForm({
      ...sellForm,
      total_lessons: lessons,
      price_paid: price
    });
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setSellError("");
    
    if (!sellForm.patient_id) {
      setSellError("Оберіть пацієнта для продажу абонементу");
      return;
    }

    try {
      const payload = {
        patient_id: Number(sellForm.patient_id),
        total_lessons: Number(sellForm.total_lessons),
        price_paid: Number(sellForm.price_paid)
      };

      await api.post("/api/finance/subscriptions", payload);
      setIsSellModalOpen(false);
      fetchData();
    } catch (err) {
      setSellError(err.message || "Не вдалося оформити абонемент");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8">
      
      {/* Header action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Фінанси та Абонементи</h2>
          <p className="text-slate-400 mt-1">Звітність щодо доходів центру, продаж пакетів занять та баланси пацієнтів.</p>
        </div>
        
        <button
          onClick={openSellModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-650 to-indigo-650 text-white shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 text-sm font-semibold transition-all hover:brightness-110 sm:self-end"
        >
          <Plus className="w-5 h-5" />
          Продати абонемент
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total Revenue */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Каса центру (загалом)</span>
            <p className="text-3xl font-extrabold text-white">{formatCurrency(stats.total_revenue)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* 30 Days Revenue */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Оборот за 30 днів</span>
            <p className="text-3xl font-extrabold text-white">{formatCurrency(stats.monthly_revenue)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Active subscriptions */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Діючі абонементи</span>
            <p className="text-3xl font-extrabold text-white">{stats.active_subscriptions}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Billing history table grid */}
      <div className="glass-panel rounded-2xl p-6 space-y-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-brand-400" />
          Хронологія платежів
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 py-16">
            <AlertCircle className="w-12 h-12 text-dark-700 stroke-[1.5] mb-2" />
            <p className="text-sm">Платежів у базі даних не знайдено.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-dark-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-dark-900/20">
                  <th className="py-4 px-6">ID транзакції</th>
                  <th className="py-4 px-6">Пацієнт</th>
                  <th className="py-4 px-6">Тип оплати</th>
                  <th className="py-4 px-6">Сума оплати</th>
                  <th className="py-4 px-6">Дата платежу</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/50">
                {payments.map((payment) => {
                  const paymentDate = new Date(payment.payment_date).toLocaleString('uk-UA', { 
                    day: 'numeric', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  
                  return (
                    <tr key={payment.id} className="hover:bg-dark-800/10 transition-colors text-sm text-slate-300">
                      <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                        #TX-{1000 + payment.id}
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {payment.patient_name}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${
                          payment.payment_type === "subscription"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {payment.payment_type === "subscription" ? "Абонемент" : "Разове заняття"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-emerald-450 text-md">
                        +{formatCurrency(payment.amount)}
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-550" />
                          {paymentDate}
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

      {/* Modal Selling package */}
      {isSellModalOpen && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-dark-800 flex items-center justify-between bg-dark-900/60">
              <h3 className="text-lg font-bold text-white tracking-tight">Продати абонемент</h3>
              <button 
                onClick={() => setIsSellModalOpen(false)}
                className="p-1 rounded-lg text-slate-450 hover:bg-dark-850 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSellSubmit} className="p-6 space-y-4">
              {sellError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-550/20 text-xs font-semibold text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {sellError}
                </div>
              )}

              {/* Patient */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Оберіть пацієнта *</label>
                <select
                  required
                  value={sellForm.patient_id}
                  onChange={(e) => setSellForm({...sellForm, patient_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                >
                  {patients.length === 0 ? (
                    <option value="">Немає активних пацієнтів</option>
                  ) : (
                    patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} (Залишок: {p.remaining_lessons} занять)</option>
                    ))
                  )}
                </select>
              </div>

              {/* Package size selectors */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Пакет занять (Кількість)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[8, 10, 12, 20].map((lessons) => (
                    <button
                      key={lessons}
                      type="button"
                      onClick={() => handlePackageChange(lessons)}
                      className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                        sellForm.total_lessons === lessons
                          ? "bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-500/10"
                          : "bg-dark-950 border-dark-800 text-slate-450 hover:text-slate-200 hover:border-dark-700"
                      }`}
                    >
                      {lessons} зан.
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Paid */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Сума до сплати (грн)</label>
                <input
                  type="number"
                  required
                  value={sellForm.price_paid}
                  onChange={(e) => setSellForm({...sellForm, price_paid: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Purchase button summary info */}
              <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/10 text-xs text-brand-300 leading-relaxed">
                Продаж пакету зарахує <strong>{sellForm.total_lessons} занять</strong> на баланс пацієнта та додасть транзакцію сумою <strong>{formatCurrency(sellForm.price_paid)}</strong> у звітність.
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-dark-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-350 hover:text-white text-sm font-medium transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 text-sm font-semibold transition-all hover:brightness-110"
                >
                  <Check className="w-4 h-4" />
                  Продати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default FinanceManager;
