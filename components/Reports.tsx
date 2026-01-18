
import React, { useState, useMemo } from 'react';
import { Sale, Product, Customer, MonthlyReport, Expense, PeriodSummary, Return } from '../types';
import { 
  Download, Calendar, Package, ClipboardList, Users, ShoppingBag, 
  Receipt, TrendingUp, TrendingDown, FolderDown, Lock, ArrowRight, 
  Wallet, PieChart, Activity, FileText, ArrowRightCircle
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

  // 1. Sales Data (Confirmed & Delivered Orders Only) - Matching Sheet Logic
  const monthlySales = useMemo(() => 
    sales.filter(s => s.date.startsWith(selectedMonth) && (s.status === 'Confirmed' || s.status === 'Delivered')), 
  [sales, selectedMonth]);

  // 2. Returns Data (Approved Only - Financial Impact)
  const monthlyReturns = useMemo(() => 
    returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved'), 
  [returns, selectedMonth]);

  // 3. Operational Expenses (Paid Only)
  const monthlyExpenses = useMemo(() => 
    expenses.filter(e => e.date.startsWith(selectedMonth) && e.status === 'Paid'), 
  [expenses, selectedMonth]);

  // --- P&L CALCULATIONS ---

  // Revenue
  const grossSales = monthlySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const salesReturns = monthlyReturns.reduce((acc, r) => acc + r.refundAmount, 0);
  const netSales = grossSales - salesReturns;

  // Cost of Goods Sold (COGS)
  // Calculate COGS from sales
  const cogsSold = monthlySales.reduce((acc, s) => acc + s.totalCost, 0);
  // Calculate value of returned goods (if resellable, we recoup the asset value)
  const cogsReturned = monthlyReturns
    .filter(r => r.condition === 'Resellable')
    .reduce((acc, r) => acc + ((r.unitCost || 0) * r.quantity), 0);
  
  const netCOGS = cogsSold - cogsReturned;

  // Gross Profit
  const grossProfit = netSales - netCOGS;
  const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

  // Operating Expenses (OpEx)
  const totalOpEx = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Net Profit
  const netOperatingProfit = grossProfit - totalOpEx;
  const netProfitMargin = netSales > 0 ? (netOperatingProfit / netSales) * 100 : 0;

  // Inventory Snapshot (Current State)
  // Note: For historical months, this is ideally snapshot in periodSummaries.
  // If not closed, we use current real-time inventory as best approximation.
  const currentCalculatedInventoryValue = products.reduce((acc, p) => {
    const stock = p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel;
    return acc + ((stock || 0) * p.costPrice);
  }, 0);

  // --- CARRY OVER LOGIC ---
  const previousMonthStr = useMemo(() => {
    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, [selectedMonth]);

  const prevSummary = periodSummaries.find(s => s.month === previousMonthStr);
  const currentSummary = periodSummaries.find(s => s.month === selectedMonth);
  
  // Logic: Opening Inventory of THIS month = Closing Inventory of LAST month
  const openingInventory = prevSummary ? prevSummary.closingInventoryValue : 0;
  
  // Logic: Closing Inventory of THIS month = Snapshot if closed, else Current Inventory
  const closingInventory = currentSummary ? currentSummary.closingInventoryValue : currentCalculatedInventoryValue;

  // Logic: Opening Cash Balance of THIS month = Closing Balance of LAST month
  const openingBalance = prevSummary ? prevSummary.closingBalance : 0;
  
  // Logic: Closing Balance = Opening Balance + Net Profit (for this period)
  const closingBalance = openingBalance + netOperatingProfit;

  // Data for Expense Chart
  const expenseCategories = useMemo(() => {
    const cats: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [monthlyExpenses]);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  const handleClosePeriod = () => {
    if (!confirm(`CONFIRM PERIOD CLOSING: ${selectedMonth}\n\nThis action locks the financial snapshot and carries balances forward.\n\nNet Profit: ৳${netOperatingProfit.toLocaleString()}\nClosing Stock: ৳${closingInventory.toLocaleString()}\nClosing Cash: ৳${closingBalance.toLocaleString()}\n\nProceed?`)) return;

    const newSummary: PeriodSummary = {
      month: selectedMonth,
      openingInventoryValue: openingInventory,
      closingInventoryValue: closingInventory,
      openingBalance: openingBalance,
      closingBalance: closingBalance,
      totalRevenue: netSales,
      totalExpenses: totalOpEx,
      netProfit: netOperatingProfit,
      closedAt: new Date().toISOString()
    };

    const updatedSummaries = [...periodSummaries.filter(s => s.month !== selectedMonth), newSummary];
    onUpdateSummaries(updatedSummaries);
    
    // Auto-advance month to see the new "Opening" accounts
    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const downloadCSV = (type: string) => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `${type}_${selectedMonth}.csv`;

    const fmt = (n: number) => n.toFixed(2);

    if (type === 'P&L_Statement') {
        headers = ["Line Item", "Amount (BDT)", "Note"];
        rows = [
            ["Gross Sales Revenue", fmt(grossSales), "Total value of completed orders"],
            ["Less: Returns & Refunds", fmt(-salesReturns), "Approved returns"],
            ["NET SALES", fmt(netSales), ""],
            ["", "", ""],
            ["Cost of Goods Sold (COGS)", fmt(netCOGS), "Product cost of net sales"],
            ["GROSS PROFIT", fmt(grossProfit), "Net Sales - COGS"],
            ["", "", ""],
            ["Operating Expenses", fmt(totalOpEx), "See expense ledger for breakdown"],
            ["NET OPERATING PROFIT", fmt(netOperatingProfit), "Gross Profit - OpEx"],
            ["", "", ""],
            ["Opening Cash Balance", fmt(openingBalance), `Carried from ${previousMonthStr}`],
            ["Closing Cash Balance", fmt(closingBalance), "Opening + Net Profit"]
        ];
    } else if (type === 'Ledger') {
        headers = ["Date", "Type", "Ref ID", "Description", "Inflow (BDT)", "Outflow (BDT)"];
        // Combine Sales and Expenses into one chronological ledger
        const ledgerItems = [
            ...monthlySales.map(s => ({ date: s.date, type: 'Sale', id: s.id, desc: s.customerName, in: s.totalAmount, out: 0 })),
            ...monthlyExpenses.map(e => ({ date: e.date, type: 'Expense', id: e.id, desc: `${e.category} - ${e.description}`, in: 0, out: e.amount })),
            ...monthlyReturns.map(r => ({ date: r.date, type: 'Refund', id: r.id, desc: `RMA for ${r.customerName}`, in: 0, out: r.refundAmount }))
        ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        rows = ledgerItems.map(i => [i.date, i.type, i.id, i.desc, fmt(i.in), fmt(i.out)]);
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
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Financial Control</h2>
          <p className="text-slate-500 text-sm">Professional Accounting & Business Intelligence.</p>
        </div>
        
        <div className="flex items-center gap-4">
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
            {/* Top Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 mb-1">
                                <Wallet size={20} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Net Operating Profit</h3>
                            </div>
                            <p className="text-4xl font-serif font-bold tracking-tighter">৳{netOperatingProfit.toLocaleString()}</p>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg mt-3 text-[10px] font-bold ${netOperatingProfit >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                {netProfitMargin.toFixed(1)}% Net Margin
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                            <span>Gross Margin: {grossMarginPercent.toFixed(1)}%</span>
                            <span>OpEx Ratio: {netSales > 0 ? ((totalOpEx/netSales)*100).toFixed(1) : 0}%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-6">
                        <Activity size={20} className="text-indigo-500" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Revenue Waterfall</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Gross Sales</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">৳{grossSales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500">
                            <span className="text-sm font-medium">Returns</span>
                            <span className="font-mono font-bold">-৳{salesReturns.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Net Sales</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">৳{netSales.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative">
                    <div className="flex items-center gap-2 text-slate-500 mb-4">
                        <PieChart size={20} className="text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Expense Breakdown</h3>
                    </div>
                    <div className="h-[140px] flex items-center gap-4">
                        <div className="flex-1 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie data={expenseCategories} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                                        {expenseCategories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number) => `৳${value.toLocaleString()}`}
                                        contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-32 space-y-2">
                            {expenseCategories.slice(0, 3).map((entry, index) => (
                                <div key={index} className="flex items-center gap-2 text-[10px]">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="truncate text-slate-500 dark:text-slate-400">{entry.name}</span>
                                </div>
                            ))}
                            {expenseCategories.length > 3 && <div className="text-[10px] text-slate-400 pl-4">+ {expenseCategories.length - 3} more</div>}
                        </div>
                    </div>
                    <div className="mt-2 text-right">
                        <span className="text-xs text-slate-400">Total OpEx: </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">৳{totalOpEx.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Reconciliation Flow - Shows Carry Over */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-inner">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
                    <ArrowRightCircle size={18} className="text-indigo-500" /> Account Reconciliation Flow
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Opening Column */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Opening (Carried Fwd)</p>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500 block mb-1">Cash Balance</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-white">৳{openingBalance.toLocaleString()}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500 block mb-1">Inventory Value</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-white">৳{openingInventory.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Arrow / Current Activity */}
                    <div className="flex flex-col items-center justify-center space-y-2 py-4 md:py-0">
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase">Net Profit</span>
                            <p className={`font-mono font-bold text-lg ${netOperatingProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {netOperatingProfit >= 0 ? '+' : ''}৳{netOperatingProfit.toLocaleString()}
                            </p>
                        </div>
                        <ArrowRight size={24} className="text-slate-300 hidden md:block" />
                        <div className="md:hidden w-px h-8 bg-slate-300"></div>
                    </div>

                    {/* Closing Column */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Closing (To Next Month)</p>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 block mb-1 font-bold">Closing Balance</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">৳{closingBalance.toLocaleString()}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500 block mb-1">Closing Inventory</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-white">৳{closingInventory.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
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
                        <button onClick={() => downloadCSV('P&L_Statement')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-indigo-600 transition-colors">
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
                    {/* Revenue Section */}
                    <div className="flex justify-between py-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Gross Sales Revenue</span>
                        <span>৳{grossSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between py-2 text-slate-500">
                        <span>Less: Returns & Allowances</span>
                        <span>(৳{salesReturns.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                    </div>
                    <div className="flex justify-between py-3 border-t border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-900 dark:text-white">
                        <span>NET SALES</span>
                        <span>৳{netSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>

                    <div className="h-6"></div>

                    {/* COGS Section */}
                    <div className="flex justify-between py-2 text-slate-500">
                        <span>Cost of Goods Sold (COGS)</span>
                        <span>(৳{netCOGS.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                    </div>
                    <div className="flex justify-between py-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                        <span>GROSS PROFIT</span>
                        <span>৳{grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>

                    <div className="h-6"></div>

                    {/* OpEx Section */}
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Operating Expenses</div>
                    {expenseCategories.map((cat, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-slate-500 pl-4 text-xs">
                            <span>{cat.name}</span>
                            <span>(৳{cat.value.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold text-slate-600 dark:text-slate-400 border-t border-dashed border-slate-200 dark:border-slate-700 mt-2">
                        <span>Total Operating Expenses</span>
                        <span>(৳{totalOpEx.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                    </div>

                    <div className="h-8"></div>

                    {/* Net Profit Section */}
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
                            {/* Combined Sales, Returns, and Expenses sorted by date */}
                            {[
                                ...monthlySales.map(s => ({ date: s.date, type: 'Sales', desc: `Order #${s.id.slice(-6)} - ${s.customerName}`, credit: s.totalAmount, debit: 0 })),
                                ...monthlyReturns.map(r => ({ date: r.date, type: 'Refund', desc: `RMA #${r.id.slice(-6)} - ${r.customerName}`, credit: 0, debit: r.refundAmount })),
                                ...monthlyExpenses.map(e => ({ date: e.date, type: 'Expense', desc: `${e.category} - ${e.description}`, credit: 0, debit: e.amount }))
                            ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-3 text-slate-500">{new Date(row.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                            row.type === 'Sales' ? 'bg-green-100 text-green-700' : 
                                            row.type === 'Refund' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                        }`}>{row.type}</span>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">{row.desc}</td>
                                    <td className="px-6 py-3 text-right text-green-600 dark:text-green-400 font-bold">{row.credit > 0 ? `৳${row.credit.toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-3 text-right text-red-500 font-bold">{row.debit > 0 ? `৳${row.debit.toLocaleString()}` : '-'}</td>
                                </tr>
                            ))}
                            {monthlySales.length === 0 && monthlyExpenses.length === 0 && (
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
