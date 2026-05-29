import React, { useState } from "react";
import { 
  Lock, 
  Mail, 
  Sparkles, 
  AlertCircle,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || "Невірна пошта або пароль");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative">
      
      {/* Background glow designs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 items-center justify-center shadow-lg shadow-brand-500/20 mb-2">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Вхід в Logo<span className="text-brand-400">CRM</span></h2>
          <p className="text-slate-400 text-sm">Введіть свої облікові дані для доступу до центру.</p>
        </div>

        {/* Login form card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-dark-800/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Електронна пошта</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@logocrm.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-650 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Пароль</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-sm font-medium text-slate-200 placeholder-slate-650 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-650 text-white shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Вхід..." : "Увійти в систему"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo select area */}
          <div className="mt-8 pt-6 border-t border-dark-800 space-y-3">
            <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider text-center">
              Демонстраційні облікові записи:
            </span>
            
            <div className="space-y-2">
              {[
                { label: "Директор (Іван Коваленко)", email: "director@logocrm.com", pass: "admin123", role: "admin" },
                { label: "Логопед (Ольга Мельник)", email: "olga@logocrm.com", pass: "password123", role: "therapist" },
                { label: "Нейропсихолог (Марія Шевченко)", email: "maria@logocrm.com", pass: "password123", role: "therapist" },
              ].map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickSelect(demo.email, demo.pass)}
                  className="w-full p-2.5 rounded-xl bg-dark-900 border border-dark-850 hover:bg-dark-800 hover:border-brand-500/35 flex items-center justify-between text-left text-xs font-semibold text-slate-300 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-brand-400 group-hover:scale-110 transition-transform" />
                    <span>{demo.label}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/15">
                    {demo.role === "admin" ? "Керівник" : "Логопед"}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default Login;
