
import React, { useMemo, useState } from 'react';
import { Sale, Return } from '../types';
import { Search, Calendar, BookOpenCheck, Filter, Download } from 'lucide-react';

interface FinalLedgerProps {
  sales: Sale[];
  returns: Return[];
}

export const FinalLedger: React.FC<FinalLedgerProps> = ({ sales, returns }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const finalOrders = useMemo(() => {
    return sales
      .filter(s => s.status === 'Delivered' || s.status === 'Partially Returned')
      .filter(s => {
        const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.includes(searchTerm);
        const matchesMonth = monthFilter ? s.date.startsWith(monthFilter) : true;
        return matchesSearch && matchesMonth;
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchTerm, monthFilter]);

  const totals = useMemo(() => {
    let gross = 0;
    let refund = 0;
    let net = 0;
    let profit = 0;

    finalOrders.forEach(s => {
        const orderReturns = returns.filter(r => r.orderId === s.id && r.status === 'Approved');
        const rAmount = orderReturns.reduce((acc, r) => acc + r.refundAmount, 0);
        const rCost = orderReturns.filter(r => r.condition === 'Resellable').reduce((acc, r) => acc + (r.unitCost * r.quantity), 0);
        
        const netRev = s.totalAmount - rAmount;
        const netCost = s.totalCost - rCost;
        const netProf = netRev - netCost;

        gross += s.totalAmount;
        refund += rAmount;
        net += netRev;
        profit += netProf;
    });

    return { gross, refund, net, profit };
  }, [finalOrders, returns]);

  const downloadCSV = () => {
    const headers = ["Date", "Order Ref", "Customer", "Gross (BDT)", "Refunds (BDT)", "Net Revenue (BDT)", "Profit (BDT)", "Status"];
    const rows = finalOrders.map(s => {
        const orderReturns = returns.filter(r => r.orderId === s.id && r.status === 'Approved');
        const refundAmount = orderReturns.reduce((acc, r) => acc + r.refundAmount, 0);
        const rCost = orderReturns.filter(r => r.condition === 'Resellable').reduce((acc, r) => acc + (r.unitCost * r.quantity), 0);
        const netRev = s.totalAmount - refundAmount;
        const netProfit = netRev - (s.totalCost - rCost);
        return [s.date, s.id, s.customerName, s.totalAmount, refundAmount, netRev, netProfit, s.status];
    });

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map(f => `"${String(f).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Final_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
             <BookOpenCheck size={32} className="text-emerald-600" /> Final Ledger
          </h2>
          <p className="text-slate-500 text-sm">Realized earnings from completed orders.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={downloadCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity">
                <Download size={16} /> Export CSV
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gross Sales</p>
            <p className="text-2xl font-serif font-bold text-slate-900 dark:text-white">৳{totals.gross.toLocaleString()}</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Refunds/Returns</p>
            <p className="text-2xl font-serif font-bold text-red-500">৳{totals.refund.toLocaleString()}</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm bg-indigo-50/50 dark:bg-indigo-900/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Net Revenue</p>
            <p className="text-2xl font-serif font-bold text-indigo-600 dark:text-indigo-400">৳{totals.net.toLocaleString()}</p>
         </div>
         <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Net Profit</p>
            <p className="text-2xl font-serif font-bold">৳{totals.profit.toLocaleString()}</p>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" placeholder="Filter by customer or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
         <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="month" className="pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 responsive-table-container">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 tracking-widest">
            <tr>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Order Ref</th>
              <th className="px-8 py-5">Customer</th>
              <th className="px-8 py-5 text-right">Gross</th>
              <th className="px-8 py-5 text-right text-red-500">Refunds</th>
              <th className="px-8 py-5 text-right text-indigo-600">Net Rev</th>
              <th className="px-8 py-5 text-right text-emerald-600">Profit</th>
              <th className="px-8 py-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {finalOrders.map((s) => {
              const orderReturns = returns.filter(r => r.orderId === s.id && r.status === 'Approved');
              const refundAmount = orderReturns.reduce((acc, r) => acc + r.refundAmount, 0);
              const rCost = orderReturns.filter(r => r.condition === 'Resellable').reduce((acc, r) => acc + (r.unitCost * r.quantity), 0);
              const netRev = s.totalAmount - refundAmount;
              const netProfit = netRev - (s.totalCost - rCost);

              return (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-8 py-5 text-slate-500">{s.date}</td>
                  <td className="px-8 py-5 font-bold font-mono">#{s.id.slice(-6)}</td>
                  <td className="px-8 py-5 font-medium">{s.customerName}</td>
                  <td className="px-8 py-5 text-right text-slate-400">৳{s.totalAmount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right text-red-500 font-mono">{refundAmount > 0 ? `(৳${refundAmount.toLocaleString()})` : '-'}</td>
                  <td className="px-8 py-5 text-right font-bold text-indigo-600 dark:text-indigo-400 font-mono">৳{netRev.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">৳{netProfit.toLocaleString()}</td>
                  <td className="px-8 py-5 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border ${s.status === 'Delivered' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'}`}>{s.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
