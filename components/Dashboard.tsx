
import React, { useState, useMemo } from 'react';
import { Product, Sale, Customer, Supplier, ViewState, Expense, AuditLog, Return } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend } from 'recharts';
import { Users, ShoppingBag, Truck, TrendingUp, TrendingDown, Package, Wallet, Clock, Calendar, Activity, Sparkles, ArrowRight, ArrowUpRight, CheckCircle2, Trophy, AlertCircle, Ban, RotateCcw, ShieldCheck, UserCog, ListChecks, Check, MoreHorizontal, Plus } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  returns: Return[];
  onNavigate: (view: ViewState) => void;
  theme: 'light' | 'dark';
  logs?: AuditLog[];
  businessProfile: { name: string; email: string };
  isSecurityConfigured: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  products, sales, customers, suppliers, expenses, returns, onNavigate, theme, logs = [],
  businessProfile, isSecurityConfigured
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Financial Calculations
  const monthlySales = useMemo(() => sales.filter(s => s.date.startsWith(selectedMonth)), [sales, selectedMonth]);
  
  // Include 'Returned' and 'Partially Returned' in gross revenue because the refund is subtracted separately
  const completedSales = useMemo(() => monthlySales.filter(s => s.status === 'Confirmed' || s.status === 'Delivered' || s.status === 'Returned' || s.status === 'Partially Returned'), [monthlySales]);
  const pendingSales = useMemo(() => monthlySales.filter(s => s.status === 'Pending'), [monthlySales]);
  
  const grossProductRevenue = completedSales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const monthlyReturns = useMemo(() => returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved'), [returns, selectedMonth]);
  const totalRefunds = monthlyReturns.reduce((acc, curr) => acc + curr.refundAmount, 0);
  const netProductRevenue = grossProductRevenue - totalRefunds;

  // Top Products Logic
  const topProducts = useMemo(() => {
    const counts: Record<string, { qty: number, rev: number, image?: string }> = {};
    monthlySales.forEach(s => {
      s.items.forEach(i => {
        if (!counts[i.productName]) counts[i.productName] = { qty: 0, rev: 0, image: products.find(p => p.id === i.productId)?.image };
        counts[i.productName].qty += i.quantity;
        counts[i.productName].rev += i.total;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].rev - a[1].rev)
      .slice(0, 5);
  }, [monthlySales, products]);

  // Chart Data
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7)); 
    }
    return months.map(month => {
      // Consistent with main dashboard logic: include returned/partial orders in gross revenue
      const monthCompletedSales = sales.filter(s => s.date.startsWith(month) && (s.status === 'Confirmed' || s.status === 'Delivered' || s.status === 'Returned' || s.status === 'Partially Returned'));
      const rev = monthCompletedSales.reduce((sum, s) => sum + s.totalAmount, 0);
      return {
        name: new Date(month + "-01").toLocaleDateString('en-US', { month: 'short' }),
        revenue: rev
      };
    });
  }, [sales]);

  const readiness = useMemo(() => {
    return [
      { id: 'inventory', label: 'Add Inventory', isReady: products.length > 0, action: () => onNavigate('inventory') },
      { id: 'suppliers', label: 'Connect Suppliers', isReady: suppliers.length > 0, action: () => onNavigate('suppliers') },
      { id: 'security', label: 'Set PIN', isReady: isSecurityConfigured, action: () => onNavigate('settings') }
    ];
  }, [products, suppliers, isSecurityConfigured]);

  const readinessScore = (readiness.filter(r => r.isReady).length / readiness.length) * 100;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Executive Overview</h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time performance metrics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           {/* Quick Actions */}
           <button onClick={() => onNavigate('sales')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95">
              <Plus size={16} /> New Order
           </button>
           <button onClick={() => onNavigate('inventory')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <Package size={16} /> Add Product
           </button>
           <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
           <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Calendar size={18} className="text-indigo-600 dark:text-indigo-400 ml-2" />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 p-1 cursor-pointer text-sm"
              />
           </div>
        </div>
      </div>

      {readinessScore < 100 && (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden animate-in slide-in-from-top-4 border border-slate-800">
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                 <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><ListChecks size={20} className="text-indigo-400"/> Setup Progress</h3>
                 <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                    <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${readinessScore}%` }}></div>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {readiness.map(item => (
                       <button 
                         key={item.id} 
                         onClick={item.action}
                         disabled={item.isReady}
                         className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold flex items-center gap-2 transition-all ${item.isReady ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-indigo-500 text-indigo-300 hover:bg-indigo-500/20'}`}
                       >
                          {item.isReady ? <CheckCircle2 size={12}/> : <ArrowRight size={12}/>} {item.label}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
            <Wallet size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Net Revenue</h3>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-lg opacity-50 font-serif">৳</span>
            <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">{netProductRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
            <ShoppingBag size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Orders</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter relative z-10">{completedSales.length}</p>
          <p className="text-xs text-slate-400 mt-2">{monthlySales.filter(s=>s.status === 'Confirmed').length} Confirmed</p>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group" onClick={() => onNavigate('sales')} style={{cursor: 'pointer'}}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
            <Activity size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Pending</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">{pendingSales.length}</p>
          <p className="text-xs text-slate-400 mt-2">Needs Action</p>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
            <Users size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Clients</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter relative z-10">{customers.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                 <TrendingUp size={20} className="text-indigo-500" /> Revenue Trend
              </h3>
           </div>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `৳${(value/1000).toFixed(0)}k`} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                     formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                   />
                   <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm h-full">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                 <Trophy size={20} className="text-amber-500" /> Top Sellers
              </h3>
              <div className="space-y-4">
                 {topProducts.map(([name, data], i) => (
                    <div key={name} className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                          {data.image ? <img src={data.image} className="w-full h-full object-cover"/> : i + 1}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{name}</p>
                          <p className="text-xs text-slate-500">{data.qty} sold</p>
                       </div>
                       <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">৳{data.rev.toLocaleString()}</p>
                    </div>
                 ))}
                 {topProducts.length === 0 && <p className="text-slate-400 text-sm italic">No sales data this month.</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
