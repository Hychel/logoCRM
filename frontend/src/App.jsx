import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PatientTable from "./components/PatientTable";
import PatientCard from "./components/PatientCard";
import ScheduleCalendar from "./components/ScheduleCalendar";
import FinanceManager from "./components/FinanceManager";
import Login from "./components/Login";

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activePatient, setActivePatient] = useState(null); // When set, we show PatientCard details view
  
  // Shared triggers to open modals between tabs
  const [patientTableTrigger, setPatientTableTrigger] = useState("");
  const [calendarTrigger, setCalendarTrigger] = useState("");
  const [financeTrigger, setFinanceTrigger] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
          <span className="text-sm font-semibold text-slate-455">Ініціалізація LogoCRM...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Quick Action Handler from Dashboard
  const handleQuickAction = (action) => {
    if (action === "create-patient") {
      setActiveTab("patients");
      setActivePatient(null);
      setPatientTableTrigger("create-patient");
    } else if (action === "schedule-lesson") {
      setActiveTab("calendar");
      setCalendarTrigger("schedule-lesson");
    } else if (action === "sell-subscription") {
      setActiveTab("finance");
      setFinanceTrigger("sell-subscription");
    }
  };

  const handleViewPatientCard = (patient) => {
    setActivePatient(patient);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex">
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        setActivePatient(null); // Clear patient card when navigating to other screens
      }} />

      {/* Main panel */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          {activePatient ? (
            <PatientCard 
              patient={activePatient} 
              onBack={() => setActivePatient(null)} 
            />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <Dashboard 
                  setActiveTab={setActiveTab} 
                  onQuickAction={handleQuickAction} 
                />
              )}
              
              {activeTab === "patients" && (
                <PatientTable 
                  onViewCard={handleViewPatientCard}
                  triggerModal={patientTableTrigger}
                  setTriggerModal={setPatientTableTrigger}
                />
              )}
              
              {activeTab === "calendar" && (
                <ScheduleCalendar 
                  triggerModal={calendarTrigger}
                  setTriggerModal={setCalendarTrigger}
                />
              )}
              
              {activeTab === "finance" && (
                <FinanceManager 
                  triggerModal={financeTrigger}
                  setTriggerModal={setFinanceTrigger}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
