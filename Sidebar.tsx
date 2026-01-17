
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
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  syncStatus: SyncStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, theme, onToggleTheme, syncStatus }) => {
  const menuItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
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
    <div className="h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <span className="font-serif font-bold text-xl">D</span>
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl text-slate-900 dark:text-white tracking-tight">DécorHub</h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Enterprise ERP</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                currentView === item.id
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {currentView === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
              )}
              <span className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System Status</span>
             <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
           </div>
           <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{syncStatus}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onToggleTheme}
            className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
