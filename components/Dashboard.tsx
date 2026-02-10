
import React, { useState, useMemo } from 'react';
import { Product, Sale, Customer, ViewState, Expense, Return } from '../types';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { TrendingUp, Package, ShoppingBag, Calendar, Activity, Plus, DollarSign, Receipt, ArrowUpRight, Wallet, AlertCircle } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  returns: Return[];
  onNavigate: (view: ViewState) => void;
  theme: 'light' | 'dark';
  businessProfile: { name: string };
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  products, sales, customers, expenses, returns, onNavigate, theme, businessProfile
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const monthlyData = useMemo(() => {
    const monthlySales = sales.filter(s => s.date.startsWith(selectedMonth));
    const realizedSales = monthlySales.filter(s => ['Confirmed', 'Delivered', 'Partially Returned'].includes(s.status));
    
    const monthlyReturns = returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved');
    const totalRefunds = monthlyReturns.reduce((acc, r) => acc + r.refundAmount, 0);

    // PROFIT: Money earned from sales minus the cost of those specific items minus running costs
    const grossProfitFromSales = realizedSales.reduce((acc, s) => acc + s.profit, 0) - totalRefunds;
    const runningCosts = expenses.filter(e => e.date.startsWith(selectedMonth) && e.category !== 'Procurement' && e.status === 'Paid').reduce((acc, e) => acc + e.amount, 0);
    
    const netProfit = grossProfitFromSales - runningCosts;
    const realizedRevenue = realizedSales.reduce((acc, s) => acc + s.totalAmount, 0) - totalRefunds;

    return { netProfit, realizedRevenue, runningCosts };
  }, [sales, expenses, returns, selectedMonth]);

  const inventoryInvestment = useMemo(() => {
    return products.reduce((total, p) => {
        const stock = p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel;
        return total + ((stock || 0) * p.costPrice);
    }, 0);
  }, [products]);

  const lowStockItems = products.filter(p => (p.hasVariants ? p.variants?.some(v => v.stockLevel < 5) : p.stockLevel < 5)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">Control Panel</h2>
           <p className="text-slate-500 text-sm">Overview for {businessProfile.name}.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
           <button onClick={() => onNavigate('sales')} className="flex-1 md:flex-none h-12 px-6 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all">
              + POS Sale
           </button>
           <div className="flex items-center bg-white dark:bg-slate-900 h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 md:w-48">
              <Calendar size={18} className="text-indigo-500 mr-2 shrink-0" />
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 text-sm w-full" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-indigo-400">
            <TrendingUp size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Net Cash Profit</h3>
          </div>
          <p className="text-3xl font-serif font-bold">৳{monthlyData.netProfit.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2">Revenue - Stock Cost - Shop Costs</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem]">
          <div className="flex items-center gap-2 mb-3 text-emerald-600">
            <DollarSign size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Realized Revenue</h3>
          </div>
          <p className="text-3xl font-serif font-bold dark:text-white">৳{monthlyData.realizedRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Cash received from delivered sales</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem]">
          <div className="flex items-center gap-2 mb-3 text-indigo-600">
            <Package size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Warehouse Assets</h3>
          </div>
          <p className="text-3xl font-serif font-bold dark:text-white">৳{inventoryInvestment.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Current stock investment value</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem]">
          <div className="flex items-center gap-2 mb-3 text-red-500">
            <Receipt size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Shop Running Costs</h3>
          </div>
          <p className="text-3xl font-serif font-bold dark:text-white">৳{monthlyData.runningCosts.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Rent, Staff, and Utilities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Activity size={18} className="text-indigo-500" /> Sales Activity
              </h3>
              <div className="flex gap-4">
                 {lowStockItems > 0 && (
                    <div onClick={() => onNavigate('inventory')} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                        <AlertCircle size={14} className="text-red-500" />
                        <span className="text-[10px] text-red-500 font-bold uppercase">{lowStockItems} Stock Alerts</span>
                    </div>
                 )}
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[10px] text-slate-400 font-bold uppercase">Revenue</span></div>
              </div>
           </div>
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sales.slice(-7).map(s => ({ name: s.date.slice(5), revenue: s.totalAmount }))}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                   <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                   <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-[2rem] p-6 border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-center">
            <h4 className="text-indigo-900 dark:text-indigo-300 font-bold mb-4 flex items-center gap-2"><Wallet size={18}/> Quick Operations</h4>
            <button onClick={() => onNavigate('procurement')} className="w-full h-14 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-between px-5 mb-3 group">
                <span>Buy New Stock (PO)</span>
                <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <button onClick={() => onNavigate('reports')} className="w-full h-14 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-between px-5 group">
                <span>Monthly Master Grid</span>
                <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
};
