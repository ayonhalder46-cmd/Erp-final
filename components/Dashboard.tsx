
import React, { useState, useMemo } from 'react';
import { Product, Sale, Customer, Supplier, ViewState, Expense, AuditLog, Return } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend } from 'recharts';
import { Users, ShoppingBag, Truck, TrendingUp, TrendingDown, Package, Wallet, Clock, Calendar, Activity, Sparkles, ArrowRight, ArrowUpRight, CheckCircle2, Trophy, AlertCircle, Ban, RotateCcw } from 'lucide-react';

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
}

export const Dashboard: React.FC<DashboardProps> = ({ products, sales, customers, suppliers, expenses, returns, onNavigate, theme, logs = [] }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Financial Calculations - Filtered by Month
  const monthlySales = useMemo(() => sales.filter(s => s.date.startsWith(selectedMonth)), [sales, selectedMonth]);
  
  // Status-based Filtering
  const completedSales = useMemo(() => monthlySales.filter(s => s.status === 'Confirmed' || s.status === 'Delivered'), [monthlySales]);
  const pendingSales = useMemo(() => monthlySales.filter(s => s.status === 'Pending'), [monthlySales]);
  const cancelledSales = useMemo(() => monthlySales.filter(s => s.status === 'Cancelled'), [monthlySales]);
  const returnedSales = useMemo(() => monthlySales.filter(s => s.status === 'Returned'), [monthlySales]);
  
  const monthlyExpenses = useMemo(() => expenses.filter(e => e.date.startsWith(selectedMonth) && e.status === 'Paid'), [expenses, selectedMonth]);
  const monthlyReturns = useMemo(() => returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved'), [returns, selectedMonth]);

  // Strictly separating Product Revenue from Delivery Charges
  const totalDeliveryCollected = completedSales.reduce((acc, s) => acc + (s.deliveryCharge || 0), 0);
  const grossProductRevenue = completedSales.reduce((acc, curr) => acc + (curr.totalAmount - (curr.deliveryCharge || 0)), 0);
  
  const totalRefunds = monthlyReturns.reduce((acc, curr) => acc + curr.refundAmount, 0);
  const netProductRevenue = grossProductRevenue - totalRefunds;

  // Inventory Asset Calculation (Global Snapshot)
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => {
      if (p.hasVariants && p.variants) {
        return acc + p.variants.reduce((sum, v) => sum + (v.stockLevel * v.costPrice), 0);
      }
      return acc + (p.stockLevel * p.costPrice);
    }, 0);
  }, [products]);

  // Top Selling Products Calculation
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string, qty: number, revenue: number, image?: string }> = {};
    completedSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!counts[item.productId]) {
          const product = products.find(p => p.id === item.productId);
          counts[item.productId] = { 
            name: item.productName, 
            qty: 0, 
            revenue: 0,
            image: product?.image 
          };
        }
        counts[item.productId].qty += item.quantity;
        counts[item.productId].revenue += item.total;
      });
    });
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  }, [completedSales, products]);

  // Status Distribution Data
  const statusData = useMemo(() => [
    { name: 'Delivered', value: monthlySales.filter(s => s.status === 'Delivered').length, color: '#10b981' },
    { name: 'Confirmed', value: monthlySales.filter(s => s.status === 'Confirmed').length, color: '#3b82f6' },
    { name: 'Pending', value: pendingSales.length, color: '#f59e0b' },
    { name: 'Returned', value: returnedSales.length, color: '#8b5cf6' },
    { name: 'Cancelled', value: cancelledSales.length, color: '#ef4444' }
  ].filter(d => d.value > 0), [monthlySales, pendingSales, returnedSales, cancelledSales]);

  // Chart Data Preparation (Last 6 Months Trend)
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    return months.map(month => {
      const monthCompletedSales = sales.filter(s => s.date.startsWith(month) && (s.status === 'Confirmed' || s.status === 'Delivered'));
      
      const monthProductRevenue = monthCompletedSales.reduce((sum, s) => sum + (s.totalAmount - (s.deliveryCharge || 0)), 0);
      
      const monthRefunds = returns
        .filter(r => r.date.startsWith(month) && r.status === 'Approved')
        .reduce((sum, r) => sum + r.refundAmount, 0);

      return {
        name: new Date(month + "-01").toLocaleDateString('en-US', { month: 'short' }),
        fullDate: month,
        revenue: monthProductRevenue - monthRefunds
      };
    });
  }, [sales, returns]);

  const recentActivity = logs.slice(0, 5);

  // --- SMART ONBOARDING / EMPTY STATE ---
  if (products.length === 0) {
    // ... (Keep existing onboarding return)
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] text-center space-y-10 animate-in fade-in zoom-in duration-500 pb-20">
         {/* ... (Existing onboarding code) ... */}
         <div className="w-32 h-32 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xl shadow-indigo-500/20 mb-4 animate-bounce-subtle ring-4 ring-white dark:ring-slate-900">
            <Sparkles size={64} />
         </div>
         <div className="max-w-lg space-y-4">
            <h2 className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">System Initialized</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
              Welcome to <strong>TheDécorHub ERP</strong>. Your workspace is ready. Follow the setup sequence to activate your business dashboard.
            </p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4 mt-8">
            <button 
              onClick={() => onNavigate('suppliers')}
              className="group p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl text-left relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                 <Truck size={80} />
               </div>
               <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 font-bold text-lg shadow-sm">1</div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connect Suppliers</h3>
               <p className="text-sm text-slate-500 leading-relaxed">Register your sourcing partners and manufacturers to establish your supply chain.</p>
               <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                 Initialize <ArrowRight size={14} />
               </div>
            </button>

            <button 
              onClick={() => onNavigate('inventory')}
              className="group p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-xl text-left relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                 <Package size={80} />
               </div>
               <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 font-bold text-lg shadow-sm">2</div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Catalog Inventory</h3>
               <p className="text-sm text-slate-500 leading-relaxed">Add products, configure variants (size/color), and set initial stock levels.</p>
               <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                 Create Products <ArrowRight size={14} />
               </div>
            </button>

            <button 
              onClick={() => onNavigate('sales')}
              className="group p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-xl text-left relative overflow-hidden opacity-60 hover:opacity-100"
            >
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                 <ShoppingBag size={80} />
               </div>
               <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 font-bold text-lg shadow-sm">3</div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Launch POS</h3>
               <p className="text-sm text-slate-500 leading-relaxed">Once stock is added, the Point of Sale terminal will be ready to process orders.</p>
               <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                 Start Selling <ArrowRight size={14} />
               </div>
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Executive Overview</h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time performance metrics and business intelligence.</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI Cards */}
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/30 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-indigo-400">
              <Wallet size={20} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Product Revenue (Net)</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg opacity-50 font-serif">৳</span>
              <p className="text-4xl font-serif font-bold tracking-tighter">{netProductRevenue.toLocaleString()}</p>
            </div>
            <div className="mt-4 flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-indigo-300/80">
                 <span>Gross Product Sales:</span> <span>৳{grossProductRevenue.toLocaleString()}</span>
              </div>
              {totalRefunds > 0 && (
                <div className="flex justify-between text-red-400">
                   <span>Returns:</span> <span>-৳{totalRefunds.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/30 transition-colors group">
          <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
            <ShoppingBag size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Completed Orders</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">{completedSales.length}</p>
          <div className="mt-4 text-xs font-medium space-y-1">
             <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-blue-500"/> Confirmed</span>
                <span>{monthlySales.filter(s => s.status === 'Confirmed').length}</span>
             </div>
             <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1"><Truck size={12} className="text-emerald-500"/> Delivered</span>
                <span>{monthlySales.filter(s => s.status === 'Delivered').length}</span>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/30 transition-colors group">
          <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
            <Activity size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Order Action</h3>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">{pendingSales.length}</p>
            <span className="text-xs text-slate-400 font-bold uppercase">Pending</span>
          </div>
          <div className="mt-4 text-xs font-medium space-y-1">
             <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1"><RotateCcw size={12} className="text-purple-500"/> Returned</span>
                <span>{returnedSales.length}</span>
             </div>
             <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1"><Ban size={12} className="text-red-500"/> Cancelled</span>
                <span>{cancelledSales.length}</span>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/30 transition-colors group">
          <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
            <Users size={20} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Active Clients</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">{customers.length}</p>
          <div className="flex items-center gap-[-0.5rem] mt-4">
             {customers.slice(0,4).map((c, i) => (
               <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold overflow-hidden -ml-2 first:ml-0 shadow-sm text-slate-500">
                  {c.name.charAt(0)}
               </div>
             ))}
             {customers.length > 4 && <span className="text-[10px] text-slate-400 font-bold ml-2">+{customers.length - 4} more</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                 <TrendingUp size={20} className="text-indigo-500" /> Revenue Trajectory (Product Sales)
              </h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                 <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 6 Month Trend
              </div>
           </div>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                   <XAxis 
                     dataKey="name" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                     dy={10} 
                   />
                   <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                     tickFormatter={(value) => `৳${(value/1000).toFixed(0)}k`} 
                   />
                   <Tooltip 
                     cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
                     contentStyle={{ 
                       backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                       borderRadius: '1rem', 
                       border: 'none', 
                       boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                     }}
                     formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Product Revenue']}
                   />
                   <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Status Distribution Chart & Movers */}
        <div className="space-y-6">
           {/* Order Status Distribution */}
           <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                 <Package size={20} className="text-blue-500" /> Order Statuses
              </h3>
              <div className="h-[200px] w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                         data={statusData} 
                         dataKey="value" 
                         nameKey="name" 
                         cx="50%" 
                         cy="50%" 
                         innerRadius={50} 
                         outerRadius={70} 
                         paddingAngle={5}
                       >
                         {statusData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                         ))}
                       </Pie>
                       <Tooltip 
                          contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                       />
                       <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    </PieChart>
                 </ResponsiveContainer>
                 {statusData.length === 0 && (
                   <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">No orders this month</div>
                 )}
              </div>
           </div>

           {/* Recent Activity Feed */}
           <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                 <Activity size={20} className="text-indigo-500" /> Live Feed
              </h3>
              <div className="flex-1 space-y-6 overflow-y-auto max-h-[250px] custom-scrollbar pr-2">
                 {recentActivity.map((log) => (
                   <div key={log.id} className="flex gap-4 group relative">
                      <div className="absolute left-[3px] top-4 bottom-[-20px] w-[2px] bg-slate-100 dark:bg-slate-800 group-last:hidden"></div>
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 z-10 ring-4 ring-white dark:ring-slate-900 ${
                         log.type === 'create' ? 'bg-green-500' : 
                         log.type === 'delete' ? 'bg-red-500' : 
                         log.type === 'update' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      <div>
                         <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{log.action}</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{log.details}</p>
                         <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 font-mono">
                           {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </p>
                      </div>
                   </div>
                 ))}
                 {recentActivity.length === 0 && (
                   <div className="text-center text-slate-400 italic text-sm py-10">No recent system activity.</div>
                 )}
              </div>
              <button 
                onClick={() => onNavigate('audit')}
                className="w-full mt-6 py-3 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                View Full Audit Log <ArrowUpRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
