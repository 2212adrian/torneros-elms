
import React, { useState } from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Key, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  GraduationCap,
  MoreHorizontal,
  ChevronRight,
  UserCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, onLogout }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainNavItems = [
    { id: 'masterlist', label: 'Masterlist', icon: Users },
    { id: 'grading', label: 'Grading', icon: FileSpreadsheet },
    { id: 'tokens', label: 'Create Token', icon: Key },
  ];

  const moreItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const toggleMore = () => setIsMoreOpen(!isMoreOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-none">Torneros ELMS</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Instructor Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-900">Dr. Torneros</span>
            <span className="text-[10px] text-emerald-500 font-bold">Online</span>
          </div>
          <UserCircle className="w-8 h-8 text-slate-300" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Right "More" Sidebar */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMoreOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-fade-in flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">System Menu</h3>
              <button onClick={() => setIsMoreOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              {moreItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id as ViewState);
                    setIsMoreOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-bold">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${currentView === item.id ? 'text-white' : 'text-slate-300'}`} />
                </button>
              ))}
            </nav>

            <div className="p-6 border-t border-slate-100">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-95"
              >
                <LogOut className="w-5 h-5" />
                Logout Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-4 py-3 flex items-center justify-around shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all relative ${currentView === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <item.icon className={`w-6 h-6 transition-transform ${currentView === item.id ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label.split(' ')[0]}</span>
            {currentView === item.id && (
              <span className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
        <button
          onClick={toggleMore}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${isMoreOpen ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <MoreHorizontal className={`w-6 h-6 transition-transform ${isMoreOpen ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider">More</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
