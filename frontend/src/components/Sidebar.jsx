import React from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Панель", icon: LayoutDashboard },
    { id: "calendar", label: "Розклад", icon: Calendar },
    { id: "patients", label: "Пацієнти", icon: Users },
  ];

  // Only Admin (Director) sees Finance
  if (user && user.role === "admin") {
    menuItems.push({ id: "finance", label: "Фінанси", icon: DollarSign });
  }

  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-800 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* App Branding logo */}
      <div className="p-6 border-b border-dark-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-content justify-center shadow-lg shadow-brand-500/20">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Logo<span className="text-brand-400">CRM</span></h1>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Центр розвитку</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/15" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-dark-800/40"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-brand-400"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Session profile / Logout */}
      <div className="p-4 border-t border-dark-800 bg-dark-900/60 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center font-bold text-brand-400 text-sm shadow-inner uppercase">
            {user?.full_name?.substring(0, 2) || "US"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-brand-400 font-medium truncate uppercase tracking-wider text-[9px]">
              {user?.role === "admin" ? "Директор" : "Спеціаліст"}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          Вийти з системи
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
