import React, { useMemo, useState, useEffect } from 'react';
import { Product, Sale, Customer, Supplier, Expense, Return } from './types';
import { ApiService } from './components/apiService';
import { 
  AlertTriangle, 
  Database, 
  Download, 
  Upload, 
  ShieldCheck, 
  HardDrive, 
  Activity,
  ChevronRight,
  CheckCircle2,
  Truck,
  RefreshCcw
} from 'lucide-react';

interface SettingsProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  returns: Return[];
  onPurgeSales: () => void;
  onPurgeInventory: () => void;
  onFactoryReset: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  products, sales, customers, suppliers, expenses, returns,
  onPurgeSales, onPurgeInventory, onFactoryReset 
}) => {
  const [storageUsed, setStorageUsed] = useState(0);

  useEffect(() => {
    ApiService.getStorageSize().then(size => setStorageUsed(size));
  }, []);
  
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
    
    // Sanitize filename for Windows compatibility (remove colons)
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

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Database maintenance and backup utility.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-950 text-white px-5 py-2 rounded-full border border-indigo-500/30 shadow-lg">
          <ShieldCheck size={16} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Protocol Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm group">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disk Usage</h4>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{systemData.storageKb} KB</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-10 space-y-8 shadow-sm">
            <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Data Management</h3>
            
            <div className="flex gap-8 items-center group cursor-pointer" onClick={handleExport}>
              <div className="p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <Download size={28} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-white">Encrypted Backup</h4>
                <p className="text-xs text-slate-500 mt-1">Generate a secure snapshot of your business ledger (Includes expenses & returns).</p>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />

            <div className="flex gap-8 items-center group cursor-pointer relative">
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-sm">
                <Upload size={28} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-white">System Restoration</h4>
                <p className="text-xs text-slate-500 mt-1">Merge or overwrite current state with an external file.</p>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-800 transition-colors" />
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" onChange={handleImport} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border border-red-100 dark:border-red-900/10 p-10 space-y-6 shadow-sm">
            <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Danger Zone</h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => { if(confirm("Permanently erase all order records?")) onPurgeSales(); }}
                className="w-full flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl hover:bg-red-50 dark:hover:bg-red-500/5 transition-all text-slate-700 dark:text-slate-300 group border border-transparent hover:border-red-100"
              >
                <div className="text-left">
                  <span className="block font-bold">Clear Order History</span>
                  <span className="text-[10px] uppercase font-black text-slate-400 mt-0.5">Reset ledger to zero</span>
                </div>
                <ChevronRight size={18} className="opacity-20 group-hover:opacity-100 text-red-500" />
              </button>

              <button 
                onClick={() => { if(confirm("Remove all inventory items?")) onPurgeInventory(); }}
                className="w-full flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl hover:bg-red-50 dark:hover:bg-red-500/5 transition-all text-slate-700 dark:text-slate-300 group border border-transparent hover:border-red-100"
              >
                <div className="text-left">
                  <span className="block font-bold">Flush Inventory Catalog</span>
                  <span className="text-[10px] uppercase font-black text-slate-400 mt-0.5">Empty all stock levels</span>
                </div>
                <ChevronRight size={18} className="opacity-20 group-hover:opacity-100 text-red-500" />
              </button>
            </div>

            <div className="pt-6 mt-2">
              <button 
                onClick={() => { if(confirm("FACTORY RESET: This will permanently erase all settings and database entries. This cannot be undone. Proceed?")) onFactoryReset(); }}
                className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-900/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <RefreshCcw size={18} /> Wipe System Ledger
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};