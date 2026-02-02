
import React, { useState, useMemo } from 'react';
import { Sale, Product, Customer, MonthlyReport, Expense, PeriodSummary, Return } from '../types';
import { 
  Download, Calendar, Package, ClipboardList, Users, ShoppingBag, 
  Receipt, TrendingUp, TrendingDown, FolderDown, Lock, ArrowRight, 
  Wallet, PieChart, Activity, FileText, ArrowRightCircle, Truck,
  CheckCircle2, Clock, RotateCcw, Ban, AlertTriangle, Printer,
  Landmark, Briefcase, Stamp, BookOpen
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
  const [activeTab, setActiveTab] = useState<'overview' | 'statement' | 'master'>('overview');

  // --- ACCOUNTING ENGINE ---

  const allMonthlySales = useMemo(() => 
    sales.filter(s => s.date.startsWith(selectedMonth)), 
  [sales, selectedMonth]);

  // "Final Ledger" includes Delivered and Partially Returned (Realized Revenue).
  const finalLedgerSales = useMemo(() => 
    allMonthlySales.filter(s => s.status === 'Delivered' || s.status === 'Partially Returned'), 
  [allMonthlySales]);

  const monthlyExpenses = useMemo(() => 
    expenses.filter(e => e.date.startsWith(selectedMonth) && e.status === 'Paid'), 
  [expenses, selectedMonth]);

  const monthlyReturns = useMemo(() => returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved'), [returns, selectedMonth]);

  // Financial Calcs
  const grossSales = finalLedgerSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalRefunds = monthlyReturns.reduce((acc, curr) => acc + curr.refundAmount, 0);
  const netRevenue = grossSales - totalRefunds;

  // COGS Analysis
  const returnedCOGS = monthlyReturns
    .filter(r => r.condition === 'Resellable')
    .reduce((acc, r) => acc + (r.unitCost * r.quantity), 0);
  
  // Original COGS of sales minus Restored Stock
  const cogsSold = finalLedgerSales.reduce((acc, s) => acc + s.totalCost, 0) - returnedCOGS;
  
  const grossProfit = netRevenue - cogsSold; 
  const totalOpEx = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfitFinal = grossProfit - totalOpEx;

  // --- ASSET & METRICS SNAPSHOT ---
  const inventoryMetrics = useMemo(() => {
    let totalCost = 0;
    let totalRetail = 0;
    let stockCount = 0;
    const categoryBreakdown: Record<string, {qty: number, costVal: number, retailVal: number}> = {};

    products.forEach(p => {
        const stock = p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel;
        const cost = (stock || 0) * p.costPrice;
        const retail = (stock || 0) * p.sellingPrice;
        
        totalCost += cost;
        totalRetail += retail;
        stockCount += (stock || 0);

        if(!categoryBreakdown[p.category]) categoryBreakdown[p.category] = { qty: 0, costVal: 0, retailVal: 0 };
        categoryBreakdown[p.category].qty += (stock || 0);
        categoryBreakdown[p.category].costVal += cost;
        categoryBreakdown[p.category].retailVal += retail;
    });

    return { totalCost, totalRetail, stockCount, categoryBreakdown };
  }, [products]);

  const previousMonthStr = useMemo(() => {
    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, [selectedMonth]);

  const prevSummary = periodSummaries.find(s => s.month === previousMonthStr);
  const currentSummary = periodSummaries.find(s => s.month === selectedMonth);
  
  const openingInventory = prevSummary ? prevSummary.closingInventoryValue : 0;
  const closingInventory = currentSummary ? currentSummary.closingInventoryValue : inventoryMetrics.totalCost;
  const openingBalance = prevSummary ? prevSummary.closingBalance : 0;
  const closingBalance = openingBalance + netProfitFinal;

  const handleClosePeriod = () => {
    if (!confirm(`CONFIRM PERIOD CLOSING: ${selectedMonth}\n\nThis action locks the financial snapshot and carries balances forward.\n\nNet Profit: ৳${netProfitFinal.toLocaleString()}\nClosing Stock: ৳${closingInventory.toLocaleString()}\nClosing Cash: ৳${closingBalance.toLocaleString()}\n\nProceed?`)) return;

    const newSummary: PeriodSummary = {
      month: selectedMonth,
      openingInventoryValue: openingInventory,
      closingInventoryValue: closingInventory,
      openingBalance: openingBalance,
      closingBalance: closingBalance,
      totalRevenue: netRevenue,
      totalExpenses: totalOpEx,
      netProfit: netProfitFinal,
      closedAt: new Date().toISOString()
    };

    const updatedSummaries = [...periodSummaries.filter(s => s.month !== selectedMonth), newSummary];
    onUpdateSummaries(updatedSummaries);
    
    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const handlePrintMasterReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // 1. Inventory Rows
    const categoryHtml = Object.entries(inventoryMetrics.categoryBreakdown)
        .map(([cat, data]) => `
            <tr>
                <td>${cat}</td>
                <td style="text-align:center">${data.qty}</td>
                <td style="text-align:right">৳${data.costVal.toLocaleString()}</td>
                <td style="text-align:right">৳${data.retailVal.toLocaleString()}</td>
            </tr>
        `).join('');

    // 2. Final Ledger Rows (Financial)
    const ledgerRowsHtml = finalLedgerSales.map(s => {
        // Calculate realized profit per order after returns
        const orderReturns = monthlyReturns.filter(r => r.orderId === s.id);
        const refunds = orderReturns.reduce((sum, r) => sum + r.refundAmount, 0);
        const returnCost = orderReturns.filter(r => r.condition === 'Resellable').reduce((sum, r) => sum + (r.unitCost * r.quantity), 0);
        
        const actualRev = s.totalAmount - refunds;
        const actualCost = s.totalCost - returnCost;
        const realizedProfit = actualRev - actualCost;

        return `
            <tr>
                <td>${new Date(s.date).toLocaleDateString()}</td>
                <td>#${s.id.slice(-6)}</td>
                <td>${s.customerName}</td>
                <td style="text-align:right">৳${s.totalAmount.toLocaleString()}</td>
                <td style="text-align:right; color: #dc2626;">${refunds > 0 ? `(৳${refunds.toLocaleString()})` : '-'}</td>
                <td style="text-align:right; font-weight:bold;">৳${actualRev.toLocaleString()}</td>
                <td style="text-align:right; color: #16a34a;">৳${realizedProfit.toLocaleString()}</td>
            </tr>
        `;
    }).join('');

    // 3. Order Manager Rows (Operational)
    const orderManagerRowsHtml = allMonthlySales.map(s => `
        <tr>
            <td>${new Date(s.date).toLocaleDateString()}</td>
            <td>#${s.id.slice(-6)}</td>
            <td>${s.customerName}</td>
            <td>${s.items.length} Items</td>
            <td style="text-align:right">৳${s.totalAmount.toLocaleString()}</td>
            <td style="text-align:center"><span class="badge badge-${s.status.toLowerCase().replace(' ', '-')}">${s.status}</span></td>
        </tr>
    `).join('');

    // 4. Expense Rows
    const expenseRowsHtml = monthlyExpenses.map(e => `
        <tr>
            <td>${new Date(e.date).toLocaleDateString()}</td>
            <td>${e.category}</td>
            <td>${e.description}</td>
            <td style="text-align:right">৳${e.amount.toLocaleString()}</td>
        </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Master Business Data - ${selectedMonth}</title>
          <style>
            body { font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 1100px; margin: 0 auto; line-height: 1.3; font-size: 11px; -webkit-print-color-adjust: exact; }
            
            .header-container { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .header-left h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; }
            .header-left p { margin: 2px 0 0; color: #64748b; font-size: 12px; font-weight: 600; }
            .header-right { text-align: right; }
            
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; background: #e2e8f0; padding: 6px 10px; margin-bottom: 8px; border-left: 4px solid #334155; display: flex; justify-content: space-between; align-items: center; }
            
            /* Metric Cards */
            .metrics-grid { display: flex; gap: 15px; margin-bottom: 30px; }
            .metric { flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; text-align: center; background: #fff; }
            .metric span { display: block; font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
            .metric strong { display: block; font-size: 18px; margin-top: 4px; color: #0f172a; }
            
            /* Data Tables */
            table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
            th { text-align: left; background: #f1f5f9; padding: 6px 8px; border: 1px solid #cbd5e1; text-transform: uppercase; color: #475569; font-weight: 700; }
            td { padding: 6px 8px; border: 1px solid #e2e8f0; vertical-align: middle; }
            tr:nth-child(even) { background-color: #f8fafc; }
            
            /* Badges */
            .badge { display: inline-block; padding: 2px 6px; border-radius: 99px; font-size: 8px; font-weight: 700; text-transform: uppercase; }
            .badge-delivered { background: #dcfce7; color: #166534; }
            .badge-pending { background: #fef9c3; color: #854d0e; }
            .badge-cancelled { background: #fee2e2; color: #991b1b; }
            .badge-returned { background: #f3e8ff; color: #6b21a8; }
            
            .summary-row { background-color: #f1f5f9 !important; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
            
            @media print {
                body { padding: 0; }
                .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-left">
                <h1>Master Business Report</h1>
                <p>Period: ${new Date(selectedMonth).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
            </div>
            <div class="header-right">
                <p>Generated: ${new Date().toLocaleString()}</p>
                <p>DécorHub ERP System</p>
            </div>
          </div>

          <!-- EXECUTIVE METRICS -->
          <div class="metrics-grid">
             <div class="metric">
                <span>Net Revenue (Realized)</span>
                <strong>৳${netRevenue.toLocaleString()}</strong>
             </div>
             <div class="metric">
                <span>Net Profit</span>
                <strong style="color: ${netProfitFinal >= 0 ? '#166534' : '#dc2626'}">৳${netProfitFinal.toLocaleString()}</strong>
             </div>
             <div class="metric">
                <span>Inventory Assets</span>
                <strong>৳${inventoryMetrics.totalCost.toLocaleString()}</strong>
             </div>
             <div class="metric">
                <span>Total Expenses</span>
                <strong>৳${totalOpEx.toLocaleString()}</strong>
             </div>
          </div>

          <div style="display: flex; gap: 20px;">
              <!-- 1. FINAL LEDGER -->
              <div class="section" style="flex: 2;">
                 <div class="section-title">
                    <span>Final Sales Ledger</span>
                    <span style="font-size:9px">Delivered & Realized Revenue</span>
                 </div>
                 <table>
                    <thead>
                        <tr>
                            <th width="12%">Date</th>
                            <th width="12%">Ref</th>
                            <th>Customer</th>
                            <th width="12%" style="text-align:right">Gross</th>
                            <th width="12%" style="text-align:right">Refunds</th>
                            <th width="12%" style="text-align:right">Net Rev</th>
                            <th width="12%" style="text-align:right">Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ledgerRowsHtml}
                        ${finalLedgerSales.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:15px; font-style:italic;">No finalized transactions.</td></tr>' : ''}
                        <tr class="summary-row">
                            <td colspan="3" style="text-align:right">PERIOD TOTALS</td>
                            <td style="text-align:right">৳${grossSales.toLocaleString()}</td>
                            <td style="text-align:right; color:#dc2626;">(৳${totalRefunds.toLocaleString()})</td>
                            <td style="text-align:right">৳${netRevenue.toLocaleString()}</td>
                            <td style="text-align:right">৳${grossProfit.toLocaleString()}</td>
                        </tr>
                    </tbody>
                 </table>
              </div>
          </div>

          <div style="display: flex; gap: 20px;">
              <!-- 2. ORDER MANAGER -->
              <div class="section" style="flex: 1;">
                 <div class="section-title">
                    <span>Order Manager</span>
                    <span style="font-size:9px">All Operations Log</span>
                 </div>
                 <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Ref</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th style="text-align:right">Total</th>
                            <th style="text-align:center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderManagerRowsHtml}
                    </tbody>
                 </table>
              </div>

              <!-- 3. INVENTORY -->
              <div class="section" style="flex: 1;">
                 <div class="section-title">
                    <span>Inventory Assets</span>
                    <span style="font-size:9px">Current Stock Snapshot</span>
                 </div>
                 <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th style="text-align:center">Qty</th>
                            <th style="text-align:right">Asset Cost</th>
                            <th style="text-align:right">Retail Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryHtml}
                        <tr class="summary-row">
                            <td>TOTAL ASSETS</td>
                            <td style="text-align:center">${inventoryMetrics.stockCount}</td>
                            <td style="text-align:right">৳${inventoryMetrics.totalCost.toLocaleString()}</td>
                            <td style="text-align:right">৳${inventoryMetrics.totalRetail.toLocaleString()}</td>
                        </tr>
                    </tbody>
                 </table>
              </div>
          </div>

          <!-- 4. EXPENSES -->
          <div class="section">
             <div class="section-title">
                <span>Expense Register</span>
                <span style="font-size:9px">Operational Outflow</span>
             </div>
             <table>
                <thead>
                    <tr>
                        <th width="15%">Date</th>
                        <th width="20%">Category</th>
                        <th>Description</th>
                        <th width="15%" style="text-align:right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                   ${expenseRowsHtml}
                   <tr class="summary-row">
                       <td colspan="3" style="text-align:right">TOTAL EXPENSES</td>
                       <td style="text-align:right">৳${totalOpEx.toLocaleString()}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          <div class="footer">
            <p>End of Master Report • Generated by TheDécorHub ERP</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Financial Reports</h2>
          <p className="text-slate-500 text-sm">Monthly closing and strategic analysis.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex gap-1">
             <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Overview</button>
             <button onClick={() => setActiveTab('master')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'master' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}><Briefcase size={12}/> Master Report</button>
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
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Net Profit</h3>
                            </div>
                            <p className="text-3xl font-serif font-bold tracking-tighter">৳{netProfitFinal.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Realized from Delivered Orders</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                        <ShoppingBag size={20} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Net Revenue</h3>
                    </div>
                    <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">৳{netRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">After Refunds Deducted</p>
                </div>

                <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 text-red-500 mb-1">
                        <TrendingDown size={20} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Op. Expenses</h3>
                    </div>
                    <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">৳{totalOpEx.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Cost of Operations</p>
                </div>

                <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                        <Package size={20} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Closing Stock</h3>
                    </div>
                    <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">৳{inventoryMetrics.totalCost.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Current Asset Value</p>
                </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-inner">
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
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'master' && (
          <div className="flex flex-col items-center justify-center p-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <BookOpen size={48} className="text-slate-300 dark:text-slate-700 mb-6" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Generate Master Business Grid</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md text-center mb-8">
                  Produces a comprehensive document containing:
                  <br/><br/>
                  • <strong>Final Sales Ledger</strong> (Realized revenue & profit)
                  <br/>
                  • <strong>Order Manager Log</strong> (All operational activity)
                  <br/>
                  • <strong>Inventory & Expense</strong> Registers
              </p>
              <button onClick={handlePrintMasterReport} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95">
                  <Printer size={20} /> Print Master Grid
              </button>
          </div>
      )}
    </div>
  );
};
