import React, { useState, useMemo } from 'react';
import { Product, Sale, Customer, ViewState, Expense, Return } from '../types';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { TrendingUp, Package, ShoppingBag, Calendar, Activity, DollarSign, Receipt, ArrowUpRight, Wallet, TrendingDown } from 'lucide-react';

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

  const math = useMemo(() => {
    const monthlySales = sales.filter(s => s.date.startsWith(selectedMonth));
    const realizedSales = monthlySales.filter(s => ['Delivered', 'Partially Returned'].includes(s.status));
    
    // 1. Operational Expenses ONLY (Exclude Procurement as requested)
    const monthlyExpenses = expenses
      .filter(e => e.date.startsWith(selectedMonth) && e.category !== 'Procurement' && e.status === 'Paid')
      .reduce((acc, e) => acc + e.amount, 0);
    
    const monthlyReturns = returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved');
    const totalRefunds = monthlyReturns.reduce((acc, r) => acc + r.refundAmount, 0);

    // 2. LOGIC: Sales Profit = total Selling price - total Cost Price (Realized minus refunds)
    const grossSalesProfit = realizedSales.reduce((acc, s) => acc + s.profit, 0) - totalRefunds;
    
    // 3. LOGIC: Net Profit = total sales profit - total expenses
    const netProfit = grossSalesProfit - monthlyExpenses;

    // 4. LOGIC: Net Revenue = Total selling price (realized) - total expenses
    const totalSellingPrice = realizedSales.reduce((acc, s) => acc + s.totalAmount, 0) - totalRefunds;
    const netRevenue = totalSellingPrice - monthlyExpenses;

    return { netProfit, netRevenue, monthlyExpenses, grossSalesProfit };
  }, [sales, expenses, returns, selectedMonth]);

  const inventoryValue = useMemo(() => {
    return products.reduce((total, p) => {
        const stock = p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel;
        return total + ((stock || 0) * p.costPrice);
    }, 0);
  }, [products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Business Intelligence</h2>
           <p className="text-slate-500 text-sm">Monthly performance for {businessProfile.name}.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
           <div className="flex items-center bg-white dark:bg-slate-900 h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 md:w-48">
              <Calendar size={18} className="text-indigo-500 mr-2 shrink-0" />
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 text-sm w-full" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
          <div className="flex items-center gap-2 mb-3 text-indigo-400">
            <TrendingUp size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Net Profit</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold">৳{math.netProfit.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2">Sales Profit - Shop Costs</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem]">
          <div className="flex items-center gap-2 mb-3 text-emerald-600">
            <DollarSign size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Net Revenue</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold dark:text-white">৳{math.netRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Revenue Flow - Shop Costs</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem]">
          <div className="flex items-center gap-2 mb-3 text-red-500">
            <Receipt size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400">Shop Expenses</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold dark:text-white">৳{math.monthlyExpenses.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Bills, Rent, and Losses</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem]">
          <div className="flex items-center gap-2 mb-3 text-indigo-600">
            <Package size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Stock Assets</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold dark:text-white">৳{inventoryValue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Current Investment Value</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Activity size={18} className="text-indigo-500" /> Financial Realization
              </h3>
           </div>
           
           <div className="space-y-6">
              <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales Profit</p>
                    <p className="text-[10px] text-slate-400">(Sales - Cost of Goods Sold)</p>
                 </div>
                 <p className="text-xl font-bold text-emerald-600 font-mono">+৳{math.grossSalesProfit.toLocaleString()}</p>
              </div>

              <div className="flex justify-between items-center p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                 <div>
                    <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Total Operational Outflow</p>
                    <p className="text-[10px] text-red-400 italic">Fixed & Variable running costs</p>
                 </div>
                 <p className="text-xl font-bold text-red-600 font-mono">-৳{math.monthlyExpenses.toLocaleString()}</p>
              </div>

              <div className="flex justify-between items-center p-4 sm:p-6 bg-indigo-600 text-white rounded-[2rem] shadow-xl">
                 <p className="font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">Monthly Net Profit</p>
                 <p className="text-2xl sm:text-3xl font-serif font-bold">৳{math.netProfit.toLocaleString()}</p>
              </div>
           </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-[2.5rem] p-8 border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-center">
            <h4 className="text-indigo-900 dark:text-indigo-300 font-bold mb-6 flex items-center gap-2"><Wallet size={18}/> Quick Access</h4>
            <button onClick={() => onNavigate('sales')} className="w-full h-16 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-between px-6 mb-4 group">
                <span>Orders Registry</span>
                <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <button onClick={() => onNavigate('final_ledger')} className="w-full h-16 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-between px-6 group">
                <span>Detailed Profit Ledger</span>
                <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
};