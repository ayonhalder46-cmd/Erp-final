
import React from 'react';
import { ViewState, SyncStatus } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Calculator, 
  Settings as SettingsIcon, 
  BarChart3,
  Truck,
  Wallet,
  RotateCcw,
  FlaskConical,
  Sun,
  Moon,
  LogOut,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  Home,
  Container,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  syncStatus: SyncStatus;
  onLock: () => void;
  onClose?: () => void;
  businessName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, theme, onToggleTheme, syncStatus, onLock, onClose, businessName }) => {
  const menuItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'spreadsheet', label: 'Master Sheets', icon: <FileSpreadsheet size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
    { id: 'procurement', label: 'Procurement', icon: <Container size={20} /> },
    { id: 'sales', label: 'Orders', icon: <ShoppingCart size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck size={20} /> },
    { id: 'expenses', label: 'Expenses', icon: <Wallet size={20} /> },
    { id: 'returns', label: 'Returns', icon: <RotateCcw size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { id: 'calculator', label: 'Pricing Lab', icon: <Calculator size={20} /> },
    { id: 'tester', label: 'Diagnostics', icon: <FlaskConical size={20} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="h-full bg-white dark:bg-slate-900 border-r border-indigo-100 dark:border-slate-800 flex flex-col justify-between transition-colors duration-300 shadow-sm relative z-20">
      <div className="p-6">
        {/* Updated Logo Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-tl-3xl rounded-br-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none shrink-0 border border-indigo-400/20">
              <Home size={20} strokeWidth={2.5} />
              <div className="absolute font-serif font-black text-amber-100 text-[8px] mt-1.5 ml-0.5">D</div>
            </div>
            <div className="min-w-0">
              <h1 className="font-serif font-bold text-lg text-slate-900 dark:text-white tracking-tight truncate leading-tight">
                <span className="text-slate-800 dark:text-slate-200">THE</span> DECOR <span className="text-indigo-600">HUB</span>
              </h1>
              <p className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400">Luxury ERP</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar pr-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onViewChange(item.id); if(onClose) onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                currentView === item.id
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold shadow-sm ring-1 ring-indigo-100 dark:ring-transparent'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {currentView === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
              )}
              <span className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110 text-indigo-600 dark:text-indigo-400' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="text-xs font-bold tracking-wide uppercase">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6 space-y-4 bg-white dark:bg-slate-900 z-10">
        <div className={`bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border ${syncStatus === 'offline' ? 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
           <div className="flex justify-between items-center mb-2">
             <span className={`text-[10px] font-black uppercase tracking-widest ${syncStatus === 'offline' ? 'text-red-500' : 'text-slate-400'}`}>System Status</span>
             {syncStatus === 'offline' ? (
                <WifiOff size={14} className="text-red-500" />
             ) : (
                <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
             )}
           </div>
           <p className={`text-xs font-bold capitalize ${syncStatus === 'offline' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
             {syncStatus === 'offline' ? 'Working Offline' : syncStatus}
           </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onToggleTheme}
            className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-all"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button 
            onClick={onLock}
            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
            title="Lock System"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
