
import React, { useMemo, useState, useEffect } from 'react';
import { Product, Sale, Customer, Supplier, Expense, Return } from '../types';
import { ApiService } from './apiService';
import { 
  AlertTriangle, 
  Database, 
  ShieldCheck, 
  HardDrive, 
  Activity,
  CheckCircle2,
  Truck,
  RefreshCcw,
  Loader2,
  Download,
  Building,
  KeyRound,
  Save,
  Smartphone,
  Monitor,
  Upload,
  Receipt,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface SettingsProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  returns: Return[];
  onFactoryReset: () => void;
  businessProfile: { name: string; address: string; phone: string; email: string; logo?: string; footerMessage?: string; terms?: string };
  onUpdateProfile: (p: any) => void;
  onUpdatePin: (pin: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  products, sales, customers, suppliers, expenses, returns,
  onFactoryReset, businessProfile, onUpdateProfile, onUpdatePin
}) => {
  const [storageUsed, setStorageUsed] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [profileForm, setProfileForm] = useState(businessProfile);
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    ApiService.getStorageSize().then(size => setStorageUsed(size));

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  const systemData = useMemo(() => {
    const lowStock = products.filter((item) => 
      item.hasVariants 
        ? item.variants?.some((v) => v.stockLevel < 5) 
        : item.stockLevel < 5
    ).length;

    return {
      productCount: products.length,
      salesCount: sales.length,
      customerCount: customers.length,
      supplierCount: suppliers.length,
      expenseCount: expenses.length,
      storageKb: (storageUsed / 1024).toFixed(2),
      lowStockCount: lowStock
    };
  }, [products, sales, customers, suppliers, expenses, storageUsed]);

  const handleExport = () => {
    const data = { products, sales, customers, suppliers, expenses, returns, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `DecorHub_Backup_${timestamp}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Caution: This will overwrite current data. Proceed?")) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.products) await ApiService.pushUpdate('products', data.products);
        if (data.sales) await ApiService.pushUpdate('sales', data.sales);
        if (data.customers) await ApiService.pushUpdate('customers', data.customers);
        if (data.suppliers) await ApiService.pushUpdate('suppliers', data.suppliers);
        if (data.expenses) await ApiService.pushUpdate('expenses', data.expenses);
        if (data.returns) await ApiService.pushUpdate('returns', data.returns);
        window.location.reload();
      } catch (err) {
        alert("Import failed. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Logo file too large. Max 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFactoryReset = async () => {
    if (confirm("CRITICAL WARNING: This will permanently DELETE ALL DATA (Inventory, Sales, Customers) and reset the app to an empty state. This cannot be undone. Are you sure?")) {
      setIsResetting(true);
      await onFactoryReset();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Configuration, Branding, and Security.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-950 text-white px-5 py-2 rounded-full border border-indigo-500/30 shadow-lg">
          <ShieldCheck size={16} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Protocol Active</span>
        </div>
      </header>

      {/* System Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm group relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <HardDrive size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disk Usage</h4>
          </div>
          <div className="flex items-end justify-between relative z-10">
             <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{systemData.storageKb} KB</p>
             <button onClick={handleExport} className="p-2 text-slate-300 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-all" title="Download Backup">
                <Download size={16} />
             </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm group">
          <div className="flex items-center gap-3 mb-4">
            <Database size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry</h4>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{systemData.salesCount + systemData.productCount}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Core Entries</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{systemData.customerCount} Clients</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{systemData.expenseCount} Expenses</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm group">
          <div className="flex items-center gap-3 mb-4">
            <Truck size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sourcing</h4>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{systemData.supplierCount}</p>
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Active Partners</p>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <Activity size={18} className="text-indigo-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Environment</h4>
            </div>
            {systemData.lowStockCount > 0 ? (
              <div className="flex items-start gap-3 text-amber-400">
                <AlertTriangle size={20} className="shrink-0" />
                <p className="text-xs font-bold leading-relaxed uppercase tracking-wide">{systemData.lowStockCount} SKUs below threshold</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle2 size={20} />
                <p className="text-xs font-bold uppercase tracking-widest">All modules optimal</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Install App Section - ONLY visible if install prompt is captured */}
        {deferredPrompt && (
          <div className="lg:col-span-2 bg-indigo-600 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                   <Monitor size={24} className="opacity-80" />
                   <Smartphone size={24} className="opacity-80" />
                </div>
                <h3 className="text-2xl font-serif font-bold">Install Native App</h3>
                <p className="text-indigo-200 text-sm mt-2 max-w-lg">Get the full desktop/mobile experience. Adds an icon to your home screen, removes browser bars, and runs offline.</p>
             </div>
             <button 
               onClick={handleInstallClick}
               className="relative z-10 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-lg hover:bg-indigo-50 transition-all active:scale-95 whitespace-nowrap"
             >
               Install Now
             </button>
          </div>
        )}

        {/* Business Identity Section */}
        <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-10 space-y-6 shadow-sm">
           <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                 <Building size={24} />
              </div>
              <div>
                 <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Business Profile</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-xs">Identity and Invoice Configuration.</p>
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center gap-6">
                 <div className="relative group w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                    {profileForm.logo ? (
                       <img src={profileForm.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                       <div className="text-center p-2">
                          <ImageIcon size={20} className="mx-auto text-slate-400 mb-1" />
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Add Logo</span>
                       </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} />
                 </div>
                 <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Company Name</label>
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold text-sm transition-all" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Phone</label>
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold text-sm transition-all" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Email</label>
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold text-sm transition-all" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Address</label>
                 <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold text-sm transition-all" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Invoice Footer</label>
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold text-sm transition-all" value={profileForm.footerMessage || ''} onChange={e => setProfileForm({...profileForm, footerMessage: e.target.value})} placeholder="Thank you message" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">T&C Summary</label>
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold text-sm transition-all" value={profileForm.terms || ''} onChange={e => setProfileForm({...profileForm, terms: e.target.value})} placeholder="Return policy short text" />
                 </div>
              </div>
              <button 
                onClick={() => onUpdateProfile(profileForm)} 
                className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-lg active:scale-95"
              >
                 <Save size={16} /> Save Business Settings
              </button>
           </div>
        </div>

        {/* Security & Data Section */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-10 space-y-6 shadow-sm">
             <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400">
                   <KeyRound size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Security Access</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-xs">Manage system lock PIN code.</p>
                </div>
             </div>
             
             <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">New 4-Digit PIN</label>
                   <input 
                     type="password" 
                     maxLength={4}
                     className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold text-sm tracking-widest transition-all" 
                     value={newPin} 
                     onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                     placeholder="****"
                   />
                </div>
                <button 
                  onClick={() => { if(newPin.length === 4) { onUpdatePin(newPin); setNewPin(''); alert('Security PIN Updated'); } }}
                  disabled={newPin.length !== 4}
                  className="w-full py-4 bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg"
                >
                   Update Security PIN
                </button>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-10 space-y-6 shadow-sm">
             <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400">
                   <Upload size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Restore Data</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-xs">Overwrite current state from backup file.</p>
                </div>
             </div>
             <div className="relative group cursor-pointer bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all p-8 text-center">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Click to Select Backup File</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">JSON Format Only</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" onChange={handleImport} />
             </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 rounded-[3rem] border border-red-100 dark:border-red-900/20 p-10 space-y-6 shadow-sm text-center">
             <div className="flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-red-100 dark:bg-red-500/20 rounded-full text-red-600 dark:text-red-400">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-red-700 dark:text-red-400">
                    Factory Reset
                </h3>
             </div>
             <p className="text-sm text-red-600/80 dark:text-red-400/80 leading-relaxed font-medium mx-auto max-w-md">
                This action will wipe <strong>all application data</strong>, including inventory, sales history, customers, and settings. The application will be reset to an empty state.
             </p>
             <button 
                onClick={handleFactoryReset}
                disabled={isResetting}
                className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
              >
                {isResetting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Wiping Data...
                  </>
                ) : (
                  <>
                    <RefreshCcw size={18} /> Wipe All Data & Reset
                  </>
                )}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
