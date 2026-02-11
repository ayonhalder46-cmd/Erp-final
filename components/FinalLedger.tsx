import React, { useMemo, useState } from 'react';
import { Sale, Return, Expense } from '../types';
import { Search, Calendar, BookOpenCheck, TrendingUp } from 'lucide-react';

interface FinalLedgerProps {
  sales: Sale[];
  returns: Return[];
  expenses: Expense[];
}

export const FinalLedger: React.FC<FinalLedgerProps> = ({ sales, returns, expenses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));

  const filteredOrders = useMemo(() => {
    return sales
      .filter(s => ['Delivered', 'Partially Returned'].includes(s.status))
      .filter(s => {
        const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.includes(searchTerm);
        const matchesMonth = monthFilter ? s.date.startsWith(monthFilter) : true;
        return matchesSearch && matchesMonth;
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchTerm, monthFilter]);

  const math = useMemo(() => {
    let totalSellingPrice = 0;
    let totalRefunds = 0;
    let salesProfit = 0;

    filteredOrders.forEach(s => {
        const orderReturns = returns.filter(r => r.orderId === s.id && r.status === 'Approved');
        const rAmount = orderReturns.reduce((acc, r) => acc + r.refundAmount, 0);
        
        totalSellingPrice += s.totalAmount;
        totalRefunds += rAmount;
        salesProfit += (s.profit - rAmount);
    });

    const monthlyExpenses = expenses
        .filter(e => e.date.startsWith(monthFilter) && e.category !== 'Procurement' && e.status === 'Paid')
        .reduce((acc, e) => acc + e.amount, 0);

    // FORMULA: Net Revenue = (Gross Sales - Refunds) - Expenses
    const netRevenue = (totalSellingPrice - totalRefunds) - monthlyExpenses;
    
    // FORMULA: Net Profit = Sales Profit - Expenses
    const netProfit = salesProfit - monthlyExpenses;

    return { totalSellingPrice, totalRefunds, netRevenue, salesProfit, monthlyExpenses, netProfit };
  }, [filteredOrders, returns, expenses, monthFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
             <BookOpenCheck size={32} className="text-emerald-600" /> Realized Ledger
          </h2>
          <p className="text-slate-500 text-sm">Monthly profit verification from completed transactions.</p>
        </div>
        <input type="month" className="h-14 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-sm" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Sales Profit</p>
            <p className="text-2xl font-serif font-bold text-slate-900 dark:text-white">৳{math.salesProfit.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400">(Price - Cost)</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm border-red-100 dark:border-red-900/30">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Shop Expenses</p>
            <p className="text-2xl font-serif font-bold text-red-500">৳{math.monthlyExpenses.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400">Total Operational Outflow</p>
         </div>
         <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl text-white">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Net Revenue</p>
            <p className="text-2xl font-serif font-bold">৳{math.netRevenue.toLocaleString()}</p>
            <p className="text-[9px] opacity-70 mt-1">Cash Realized - Expenses</p>
         </div>
         <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingUp size={80}/></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Final Net Profit</p>
            <p className="text-4xl font-serif font-bold">৳{math.netProfit.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500 mt-2">Realized Take Home</p>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 responsive-table-container">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 tracking-widest">
            <tr>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Reference</th>
              <th className="px-8 py-5">Customer</th>
              <th className="px-8 py-5 text-right">Selling Price</th>
              <th className="px-8 py-5 text-right text-red-500">Refunds</th>
              <th className="px-8 py-5 text-right text-emerald-600">Sales Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredOrders.map((s) => {
              const orderReturns = returns.filter(r => r.orderId === s.id && r.status === 'Approved');
              const refundAmount = orderReturns.reduce((acc, r) => acc + r.refundAmount, 0);
              const salesProfitFromSale = s.profit - refundAmount;

              return (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-8 py-5 text-slate-500">{s.date}</td>
                  <td className="px-8 py-5 font-bold font-mono">#{s.id.slice(-6)}</td>
                  <td className="px-8 py-5 font-medium">{s.customerName}</td>
                  <td className="px-8 py-5 text-right text-slate-400">৳{s.totalAmount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right text-red-500 font-mono">{refundAmount > 0 ? `(৳${refundAmount.toLocaleString()})` : '-'}</td>
                  <td className="px-8 py-5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">৳{salesProfitFromSale.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};