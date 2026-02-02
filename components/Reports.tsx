
import React, { useState, useMemo } from 'react';
import { Sale, Product, Customer, MonthlyReport, Expense, PeriodSummary, Return } from '../types';
import { 
  Download, Calendar, Package, ClipboardList, Users, ShoppingBag, 
  Receipt, TrendingUp, TrendingDown, FolderDown, Lock, ArrowRight, 
  Wallet, PieChart, Activity, FileText, ArrowRightCircle, Truck,
  CheckCircle2, Clock, RotateCcw, Ban, AlertTriangle, Printer
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  returns: Return[];
  periodSummaries: PeriodSummary[];
  onUpdateSummaries: (summaries: PeriodSummary[]) => void;
  theme: 'light' | 'dark';
}

export const Reports: React.FC<ReportsProps> = ({ sales, products, customers, expenses, returns, periodSummaries, onUpdateSummaries, theme }) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [activeTab, setActiveTab] = useState<'overview' | 'statement' | 'ledger'>('overview');

  // --- ACCOUNTING ENGINE ---

  const allMonthlySales = useMemo(() => 
    sales.filter(s => s.date.startsWith(selectedMonth)), 
  [sales, selectedMonth]);

  const revenueSales = useMemo(() => 
    allMonthlySales.filter(s => s.status === 'Confirmed' || s.status === 'Delivered' || s.status === 'Returned' || s.status === 'Partially Returned'), 
  [allMonthlySales]);

  const monthlyExpenses = useMemo(() => 
    expenses.filter(e => e.date.startsWith(selectedMonth) && e.status === 'Paid'), 
  [expenses, selectedMonth]);

  const monthlyReturns = useMemo(() => returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved'), [returns, selectedMonth]);

  const grossSales = revenueSales.reduce((acc, s) => acc + s.totalAmount, 0);
  
  const totalRefunds = monthlyReturns.reduce((acc, curr) => acc + curr.refundAmount, 0);
  const netRevenue = grossSales - totalRefunds;

  const cogsSold = revenueSales.reduce((acc, s) => acc + s.totalCost, 0);
  const grossProfit = netRevenue - cogsSold; 

  const totalOpEx = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

  const netOperatingProfit = netRevenue - totalOpEx;
  
  const grossMarginPercent = netRevenue > 0 ? ((netRevenue - cogsSold) / netRevenue) * 100 : 0;

  const currentCalculatedInventoryValue = products.reduce((acc, p) => {
    const stock = p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel;
    return acc + ((stock || 0) * p.costPrice);
  }, 0);

  const previousMonthStr = useMemo(() => {
    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, [selectedMonth]);

  const prevSummary = periodSummaries.find(s => s.month === previousMonthStr);
  const currentSummary = periodSummaries.find(s => s.month === selectedMonth);
  
  const openingInventory = prevSummary ? prevSummary.closingInventoryValue : 0;
  const closingInventory = currentSummary ? currentSummary.closingInventoryValue : currentCalculatedInventoryValue;
  const openingBalance = prevSummary ? prevSummary.closingBalance : 0;
  const closingBalance = openingBalance + netOperatingProfit;

  const expenseCategories = useMemo(() => {
    const cats: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [monthlyExpenses]);

  const handleClosePeriod = () => {
    if (!confirm(`CONFIRM PERIOD CLOSING: ${selectedMonth}\n\nThis action locks the financial snapshot and carries balances forward.\n\nNet Profit: ৳${netOperatingProfit.toLocaleString()}\nClosing Stock: ৳${closingInventory.toLocaleString()}\nClosing Cash: ৳${closingBalance.toLocaleString()}\n\nProceed?`)) return;

    const newSummary: PeriodSummary = {
      month: selectedMonth,
      openingInventoryValue: openingInventory,
      closingInventoryValue: closingInventory,
      openingBalance: openingBalance,
      closingBalance: closingBalance,
      totalRevenue: netRevenue,
      totalExpenses: totalOpEx,
      netProfit: netOperatingProfit,
      closedAt: new Date().toISOString()
    };

    const updatedSummaries = [...periodSummaries.filter(s => s.month !== selectedMonth), newSummary];
    onUpdateSummaries(updatedSummaries);
    
    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const handlePrintEOD = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = sales.filter(s => s.date.startsWith(today) && (s.status === 'Confirmed' || s.status === 'Delivered'));
    const totalRevenue = todaysSales.reduce((a,s) => a + s.totalAmount, 0);
    const cashSales = todaysSales.filter(s => s.paymentMethod === 'Cash').reduce((a,s) => a + s.totalAmount, 0);
    const otherSales = totalRevenue - cashSales;
    const todaysExpenses = expenses.filter(e => e.date.startsWith(today) && e.status === 'Paid').reduce((a,e) => a + e.amount, 0);
    const netCash = cashSales - todaysExpenses;

    const html = `
      <html>
        <head>
          <title>Daily Closing Report - ${today}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { border-top: 1px dashed #000; padding-top: 5px; margin-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>DAILY CLOSING (Z-REPORT)</h3>
            <p>${today}</p>
          </div>
          <div class="row"><span>Total Sales Count:</span><span>${todaysSales.length}</span></div>
          <div class="row"><span>Gross Revenue:</span><span>৳${totalRevenue.toLocaleString()}</span></div>
          <br/>
          <div class="row"><span>Cash Sales:</span><span>৳${cashSales.toLocaleString()}</span></div>
          <div class="row"><span>Card/Digi Sales:</span><span>৳${otherSales.toLocaleString()}</span></div>
          <br/>
          <div class="row"><span>Total Expenses:</span><span>-৳${todaysExpenses.toLocaleString()}</span></div>
          <div class="row total"><span>NET CASH IN HAND:</span><span>৳${netCash.toLocaleString()}</span></div>
          <div class="footer">
            <p>Generated by DécorHub ERP</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.document.close();
  };

  const downloadCSV = (type: string) => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `${type}_${selectedMonth}.csv`;

    const fmt = (n: number) => n.toFixed(2);

    if (type === 'P&L_Statement') {
        headers = ["Line Item", "Amount (BDT)", "Note"];
        rows = [
            ["Gross Sales", fmt(grossSales), "Includes Confirmed, Delivered & Returned Orders"],
            ["Less: Customer Refunds", fmt(-totalRefunds), "Returned items value"],
            ["NET SALES REVENUE", fmt(netRevenue), ""],
            ["", "", ""],
            ["Less: Operating Expenses", fmt(-totalOpEx), "Includes Logistics/Courier Losses"],
            ["", "", ""],
            ["NET OPERATING PROFIT", fmt(netOperatingProfit), "Cash Flow Basis"],
            ["", "", ""],
            ["Opening Cash Balance", fmt(openingBalance), `Carried from ${previousMonthStr}`],
            ["Closing Cash Balance", fmt(closingBalance), "Opening + Net Profit"]
        ];
    } else if (type === 'Ledger') {
        headers = ["Date", "Type", "Ref ID", "Description", "Inflow (BDT)", "Outflow (BDT)"];
        const ledgerItems = [
            ...revenueSales.map(s => ({ date: s.date, type: 'Sale', id: s.id, desc: s.customerName, in: s.totalAmount, out: 0 })),
            ...monthlyExpenses.map(e => ({ date: e.date, type: 'Expense', id: e.id, desc: `${e.category} - ${e.description}`, in: 0, out: e.amount })),
            ...monthlyReturns.map(r => ({ date: r.date, type: 'Refund', id: r.id, desc: `Refund - ${r.customerName}`, in: 0, out: r.refundAmount }))
        ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        rows = ledgerItems.map(i => [i.date, i.type, i.id, i.desc, fmt(i.in), fmt(i.out)]);
    } else if (type === 'orders') {
        const monthSales = sales.filter(s => s.date.startsWith(selectedMonth));
        headers = ["Order ID", "Date", "Customer", "Total Revenue (BDT)", "Refunded (BDT)", "Net Revenue (BDT)", "Delivery Charge (BDT)", "Total Cost (BDT)", "Gross Profit (BDT)", "Status", "Item Count", "Notes"];
        
        rows = monthSales.map(s => {
            const refundedAmount = returns.filter(r => r.orderId === s.id && r.status === 'Approved').reduce((acc, r) => acc + r.refundAmount, 0);
            return [
                s.id, 
                s.date, 
                s.customerName, 
                fmt(s.totalAmount), 
                fmt(refundedAmount),
                fmt(s.totalAmount - refundedAmount),
                fmt(s.deliveryCharge || 0),
                fmt(s.totalCost), 
                fmt(s.profit), 
                s.status,
                s.items.reduce((acc, i) => acc + i.quantity, 0),
                s.notes
            ];
        });
        filename = `Sales_${selectedMonth}.csv`;
    }

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map(f => `"${String(f).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Financial Control</h2>
          <p className="text-slate-500 text-sm">Professional Accounting & Business Intelligence.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrintEOD}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-800"
          >
            <Printer size={16} /> Daily Closing (Z-Report)
          </button>
          
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex gap-1">
             <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Dashboard</button>
             <button onClick={() => setActiveTab('statement')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'statement' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}>P&L Statement</button>
             <button onClick={() => setActiveTab('ledger')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'ledger' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Ledger</button>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <Calendar size={18} className="text-indigo-600 dark:text-indigo-400 ml-2" />
            <input 
              type="month" 
              className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 p-1 cursor-pointer text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/30 transition-colors"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 mb-1">
                                <Wallet size={20} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Net Operating Profit</h3>
                            </div>
                            <p className="text-3xl font-serif font-bold tracking-tighter">৳{netOperatingProfit.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Cash In Hand (After Refunds & Exp)</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                            <span>Margin: {grossMarginPercent.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-6">
                        <Activity size={20} className="text-indigo-500" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Revenue</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <span className="text-2xl font-serif font-bold text-slate-900 dark:text-white">৳{grossSales.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Gross Sales</p>
                        {totalRefunds > 0 && (
                            <div className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                -৳{totalRefunds.toLocaleString()} Refunds
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-2 text-slate-500 mb-4">
                        <ClipboardList size={20} className="text-indigo-500" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Status Volume</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {[
                            { label: 'Confirmed', count: allMonthlySales.filter(s => s.status === 'Confirmed').length, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { label: 'Delivered', count: allMonthlySales.filter(s => s.status === 'Delivered').length, icon: Truck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                            { label: 'Pending', count: allMonthlySales.filter(s => s.status === 'Pending').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                            { label: 'Returned', count: allMonthlySales.filter(s => s.status === 'Returned' || s.status === 'Partially Returned').length, icon: RotateCcw, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                            { label: 'Cancelled', count: allMonthlySales.filter(s => s.status === 'Cancelled').length, icon: Ban, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
                        ].map((stat) => (
                            <div key={stat.label} className={`flex flex-col items-center justify-center p-3 rounded-2xl ${stat.bg}`}>
                                <stat.icon size={16} className={`${stat.color} mb-1`} />
                                <span className={`text-xl font-bold ${stat.color}`}>{stat.count}</span>
                                <span className="text-[9px] font-bold uppercase text-slate-500">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-inner">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
                    <ArrowRightCircle size={18} className="text-indigo-500" /> Account Reconciliation Flow
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Opening (Carried Fwd)</p>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500 block mb-1">Cash Balance</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-white">৳{openingBalance.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-2 py-4 md:py-0">
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase">Net Operating Profit</span>
                            <p className={`font-mono font-bold text-lg ${netOperatingProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {netOperatingProfit >= 0 ? '+' : ''}৳{netOperatingProfit.toLocaleString()}
                            </p>
                        </div>
                        <ArrowRight size={24} className="text-slate-300 hidden md:block" />
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Closing (To Next Month)</p>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 block mb-1 font-bold">Closing Balance</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">৳{closingBalance.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        {currentSummary ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl border border-green-500/20">
                                <Lock size={14} />
                                <span className="text-xs font-bold uppercase tracking-wide">Period Closed</span>
                            </div>
                        ) : (
                            <button onClick={handleClosePeriod} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">
                                <Lock size={14} /> Close Period & Carry Forward
                            </button>
                        )}
                        <button onClick={() => downloadCSV('orders')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-indigo-600 transition-colors" title="Export Sales Ledger">
                            <FolderDown size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'statement' && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-none md:rounded-lg overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-950 p-8 border-b border-slate-200 dark:border-slate-800 text-center">
                    <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-widest">Income Statement</h2>
                    <p className="text-xs text-slate-500 mt-2 font-mono uppercase">Period: {new Date(selectedMonth).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
                </div>
                
                <div className="p-8 space-y-1 font-mono text-sm">
                    <div className="flex justify-between py-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Gross Sales</span>
                        <span>৳{grossSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between py-2 text-red-500">
                        <span>Less: Returns & Refunds</span>
                        <span>(৳{totalRefunds.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                    </div>
                    <div className="flex justify-between py-3 border-t border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-900 dark:text-white">
                        <span>NET SALES</span>
                        <span>৳{netRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>

                    <div className="h-6"></div>

                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">Operational Expenses</div>
                    {expenseCategories.map((cat, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-slate-500 pl-4 text-xs">
                            <span>{cat.name}</span>
                            <span>(৳{cat.value.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold text-slate-600 dark:text-slate-400 border-t border-dashed border-slate-200 dark:border-slate-700 mt-2">
                        <span>Total Expenses</span>
                        <span>(৳{totalOpEx.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                    </div>

                    <div className="h-8"></div>

                    <div className="flex justify-between py-4 border-t-2 border-slate-900 dark:border-white font-black text-xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 -mx-8 px-8">
                        <span>NET OPERATING PROFIT</span>
                        <span className={netOperatingProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}>
                            ৳{netOperatingProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                    <button onClick={() => downloadCSV('P&L_Statement')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline">
                        <Download size={14} /> Export Statement PDF / CSV
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText size={20} className="text-indigo-500" /> General Ledger
                    </h3>
                    <button onClick={() => downloadCSV('Ledger')} className="text-xs font-bold text-indigo-600 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors">
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Transaction Type</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right text-green-600">Credit (In)</th>
                                <th className="px-6 py-4 text-right text-red-600">Debit (Out)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                            {[
                                ...revenueSales.map(s => ({ date: s.date, type: 'Sale', id: s.id, desc: `Order #${s.id.slice(-6)} - ${s.customerName}`, credit: s.totalAmount, debit: 0 })),
                                ...monthlyExpenses.map(e => ({ date: e.date, type: 'Expense', id: e.id, desc: `${e.category} - ${e.description}`, credit: 0, debit: e.amount })),
                                ...monthlyReturns.map(r => ({ date: r.date, type: 'Refund', id: r.id, desc: `Refund - ${r.customerName} - ${r.productName}`, credit: 0, debit: r.refundAmount }))
                            ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-3 text-slate-500">{new Date(row.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                            row.type === 'Sale' ? 'bg-green-100 text-green-700' : 
                                            row.type === 'Expense' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }`}>{row.type}</span>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">{row.desc}</td>
                                    <td className="px-6 py-3 text-right text-green-600 dark:text-green-400 font-bold">{row.credit > 0 ? `৳${row.credit.toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-3 text-right text-red-500 font-bold">{row.debit > 0 ? `৳${row.debit.toLocaleString()}` : '-'}</td>
                                </tr>
                            ))}
                            {revenueSales.length === 0 && monthlyExpenses.length === 0 && monthlyReturns.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No transactions recorded for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
