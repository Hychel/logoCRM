import React, { useState, useEffect } from "react";
import { 
  Users, 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  PlusCircle, 
  UserPlus, 
  Ticket,
  ArrowRight
} from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export const Dashboard = ({ setActiveTab, onQuickAction }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_revenue: 0,
    monthly_revenue: 0,
    active_subscriptions: 0,
    lessons_conducted: 0,
    lessons_planned: 0,
    active_patients: 0
  });
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsData = await api.get("/api/finance/stats");
        setStats(statsData);

        // Fetch upcoming lessons for today/this week
        const today = new Date().toISOString().split('T')[0];
        const lessonsData = await api.get(`/api/lessons?start=${today}T00:00:00`);
        // Limit to 5 upcoming
        setUpcomingLessons(lessonsData.slice(0, 5));
      } catch (err) {
        console.error("Помилка завантаження статистики", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header welcome block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Вітаємо, {user?.full_name?.split(" ")[1] || user?.full_name}!</h2>
          <p className="text-slate-400 mt-1">Ось огляд діяльності логопедичного центру на сьогодні.</p>
        </div>
        
        {/* Quick Shortcuts */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => onQuickAction("create-patient")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-900 border border-dark-800 text-slate-200 hover:text-white hover:border-brand-500/50 hover:bg-dark-800/40 text-sm font-medium transition-all"
          >
            <UserPlus className="w-4 h-4 text-brand-400" />
            Додати пацієнта
          </button>
          
          <button 
            onClick={() => onQuickAction("schedule-lesson")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-900 border border-dark-800 text-slate-200 hover:text-white hover:border-brand-500/50 hover:bg-dark-800/40 text-sm font-medium transition-all"
          >
            <PlusCircle className="w-4 h-4 text-brand-400" />
            Записати на заняття
          </button>
          
          {user?.role === "admin" && (
            <button 
              onClick={() => onQuickAction("sell-subscription")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-650 to-indigo-650 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 text-sm font-semibold transition-all hover:brightness-110"
            >
              <Ticket className="w-4 h-4" />
              Продати абонемент
            </button>
          )}
        </div>
      </div>

      {/* Numerical Stats Dashboard widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Active Patients */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Активні пацієнти</span>
            <p className="text-3xl font-extrabold text-white">{stats.active_patients}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Conducted lessons */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Проведено занять</span>
            <p className="text-3xl font-extrabold text-white">{stats.lessons_conducted}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Upcoming lessons */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Заплановані заняття</span>
            <p className="text-3xl font-extrabold text-white">{stats.lessons_planned}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Monthly revenue */}
        <div className="glass-card p-6 flex items-center justify-between">
          {user?.role === "admin" ? (
            <>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Дохід за 30 днів</span>
                <p className="text-3xl font-extrabold text-white">{formatCurrency(stats.monthly_revenue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Активні абонементи</span>
                <p className="text-3xl font-extrabold text-white">{stats.active_subscriptions}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Ticket className="w-6 h-6" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Complex details split: Upcoming schedule & diagnostics ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upcoming Lessons List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col space-y-6">
          <div className="flex items-center justify-between border-b border-dark-800 pb-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              Найближчі заняття на сьогодні
            </h3>
            <button 
              onClick={() => setActiveTab("calendar")}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 group"
            >
              Весь розклад
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            {upcomingLessons.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                <Calendar className="w-12 h-12 text-dark-700 stroke-[1.5] mb-2" />
                <p className="text-sm text-slate-400">На сьогодні запланованих занять більше немає.</p>
              </div>
            ) : (
              upcomingLessons.map((lesson) => {
                const startTime = new Date(lesson.start_time).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(lesson.end_time).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={lesson.id} className="p-4 rounded-xl bg-dark-900/60 border border-dark-800/80 flex items-center justify-between gap-4 hover:border-brand-500/25 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-500/10 text-brand-400 border border-brand-500/20 px-3 py-2 rounded-xl text-center min-w-[70px]">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Час</span>
                        <p className="text-sm font-extrabold">{startTime}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white hover:text-brand-400 cursor-pointer">{lesson.patient.full_name}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                          <span>Кабінет: <strong className="text-slate-300">{lesson.cabinet || "Не вказано"}</strong></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                          <span>Логопед: <strong className="text-slate-300">{lesson.therapist.full_name}</strong></span>
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${
                        lesson.status === "conducted" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : lesson.status === "cancelled"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {lesson.status === "conducted" ? "Проведено" : lesson.status === "cancelled" ? "Скасовано" : "Заплановано"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Diagnostic Ratios (Tailwind-built beautiful chart mockup) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-6">
          <div className="border-b border-dark-800 pb-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              Діагностичний розподіл
            </h3>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4 py-2">
            {[
              { label: "Дислалія", percent: 45, color: "bg-blue-500", count: 9 },
              { label: "Затримка розвитку (ЗРМ/ЗПР)", percent: 25, color: "bg-purple-500", count: 5 },
              { label: "Алалія (моторна/сенсорна)", percent: 15, color: "bg-rose-500", count: 3 },
              { label: "Інші порушення (РАС, СДУГ)", percent: 15, color: "bg-amber-500", count: 3 },
            ].map((diag) => (
              <div key={diag.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-350">{diag.label}</span>
                  <span className="text-slate-200">{diag.count} діт. ({diag.percent}%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-dark-800 overflow-hidden">
                  <div className={`h-full ${diag.color} rounded-full transition-all duration-1000`} style={{ width: `${diag.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
export default Dashboard;
