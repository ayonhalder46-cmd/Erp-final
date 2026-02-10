
import React, { useState, useMemo } from 'react';
import { Sale, Product, Customer, Expense, Return } from '../types';
import { BookOpen, Printer, TrendingUp, ShoppingBag, Package, Receipt, Info, FileText } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  returns: Return[];
  theme: 'light' | 'dark';
}

export const Reports: React.FC<ReportsProps> = ({ sales, products, customers, expenses, returns }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [activeTab, setActiveTab] = useState<'overview' | 'master'>('overview');

  const stats = useMemo(() => {
    const monthlySales = sales.filter(s => s.date.startsWith(selectedMonth));
    const realizedSales = monthlySales.filter(s => ['Confirmed', 'Delivered', 'Partially Returned'].includes(s.status));
    
    const monthlyReturns = returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved');
    const totalRefunds = monthlyReturns.reduce((acc, r) => acc + r.refundAmount, 0);
    const returnCostRestored = monthlyReturns.filter(r => r.condition === 'Resellable').reduce((acc, r) => acc + (r.unitCost * r.quantity), 0);

    const netRevenue = realizedSales.reduce((acc, s) => acc + s.totalAmount, 0) - totalRefunds;
    const soldItemsCost = realizedSales.reduce((acc, s) => acc + s.totalCost, 0) - returnCostRestored;
    const runningCosts = expenses.filter(e => e.date.startsWith(selectedMonth) && e.category !== 'Procurement' && e.status === 'Paid').reduce((acc, e) => acc + e.amount, 0);
    
    const netProfit = netRevenue - soldItemsCost - runningCosts;

    let inventoryVal = 0;
    products.forEach(p => {
        const stock = p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel;
        inventoryVal += (stock || 0) * p.costPrice;
    });

    return { netRevenue, netProfit, runningCosts, inventoryVal, realizedSales, monthlyReturns, soldItemsCost };
  }, [sales, expenses, returns, products, selectedMonth]);

  const handlePrintMasterReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const dateTitle = new Date(selectedMonth).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    
    const html = `
      <html>
        <head>
          <title>Master Report - ${selectedMonth}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 30px; font-size: 10px; color: #0f172a; line-height: 1.4; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 4px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { font-size: 28px; margin: 0; text-transform: uppercase; letter-spacing: -1px; font-weight: 800; }
            .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .kpi-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; text-align: center; }
            .kpi-card span { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
            .kpi-card h2 { margin: 8px 0 0; font-size: 20px; font-weight: 800; }
            section { margin-bottom: 30px; }
            section h3 { border-left: 5px solid #4f46e5; padding-left: 10px; font-size: 11px; text-transform: uppercase; font-weight: 800; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
            section h3 span { font-size: 9px; color: #64748b; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
            th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; }
            td { border: 1px solid #e2e8f0; padding: 8px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .text-right { text-align: right; }
            .total-row { background: #f1f5f9; font-weight: 800; }
            .footer { margin-top: 50px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
            .profit-pos { color: #10b981; }
            .profit-neg { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1>MASTER BUSINESS REPORT</h1><p style="font-size:12px; font-weight:600; color:#64748b; margin-top:5px;">Period: ${dateTitle}</p></div>
            <div style="text-align:right"><p>DécorHub Cloud System</p><p>${new Date().toLocaleString()}</p></div>
          </div>

          <div class="kpis">
            <div class="kpi-card"><span>Realized Revenue</span><h2>৳${stats.netRevenue.toLocaleString()}</h2></div>
            <div class="kpi-card"><span>Net Profit</span><h2 class="${stats.netProfit >= 0 ? 'profit-pos' : 'profit-neg'}">৳${stats.netProfit.toLocaleString()}</h2></div>
            <div class="kpi-card"><span>Inventory Assets</span><h2>৳${stats.inventoryVal.toLocaleString()}</h2></div>
            <div class="kpi-card"><span>Shop Costs</span><h2>৳${stats.runningCosts.toLocaleString()}</h2></div>
          </div>

          <section>
            <h3>FINAL SALES LEDGER <span>(DELIVERED & REALIZED REVENUE)</span></h3>
            <table>
              <thead>
                <tr>
                  <th style="width:12%">DATE</th><th style="width:12%">REF</th><th style="width:20%">CUSTOMER</th><th class="text-right">GROSS</th><th class="text-right">REFUNDS</th><th class="text-right">NET REV</th><th class="text-right">PROFIT</th>
                </tr>
              </thead>
              <tbody>
                ${stats.realizedSales.map(s => {
                    const rValue = returns.filter(r => r.orderId === s.id && r.status === 'Approved').reduce((a,b)=>a+b.refundAmount,0);
                    return `<tr><td>${s.date}</td><td>#${s.id.slice(-6)}</td><td>${s.customerName}</td><td class="text-right">৳${s.totalAmount.toLocaleString()}</td><td class="text-right">৳${rValue.toLocaleString()}</td><td class="text-right">৳${(s.totalAmount - rValue).toLocaleString()}</td><td class="text-right profit-pos">৳${(s.profit - rValue).toLocaleString()}</td></tr>`;
                }).join('')}
                <tr class="total-row">
                    <td colspan="3">PERIOD TOTALS</td>
                    <td class="text-right">৳${(stats.netRevenue + returns.filter(r => r.date.startsWith(selectedMonth)).reduce((a,b)=>a+b.refundAmount,0)).toLocaleString()}</td>
                    <td class="text-right">৳${returns.filter(r => r.date.startsWith(selectedMonth)).reduce((a,b)=>a+b.refundAmount,0).toLocaleString()}</td>
                    <td class="text-right" style="color:#4f46e5">৳${stats.netRevenue.toLocaleString()}</td>
                    <td class="text-right profit-pos">৳${(stats.netProfit + stats.runningCosts).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <section>
              <h3>EXPENSE REGISTER <span>(OPERATIONAL OUTFLOW)</span></h3>
              <table>
                <thead><tr><th>CATEGORY</th><th>DESCRIPTION</th><th class="text-right">AMOUNT</th></tr></thead>
                <tbody>
                  ${expenses.filter(e => e.date.startsWith(selectedMonth) && e.category !== 'Procurement' && e.status === 'Paid').map(e => `<tr><td>${e.category}</td><td>${e.description}</td><td class="text-right">৳${e.amount.toLocaleString()}</td></tr>`).join('')}
                  <tr class="total-row"><td colspan="2">TOTAL RUNNING COSTS</td><td class="text-right">৳${stats.runningCosts.toLocaleString()}</td></tr>
                </tbody>
              </table>
            </section>
            <section>
              <h3>INVENTORY ASSETS <span>(CURRENT STOCK SNAPSHOT)</span></h3>
              <table>
                <thead><tr><th>CATEGORY</th><th class="text-right">QTY</th><th class="text-right">ASSET COST</th></tr></thead>
                <tbody>
                  ${Array.from(new Set(products.map(p => p.category))).map(cat => {
                      const catProds = products.filter(p => p.category === cat);
                      const qty = catProds.reduce((a,b) => a + (b.hasVariants ? b.variants?.reduce((s,v)=>s+v.stockLevel,0)||0 : b.stockLevel), 0);
                      const cost = catProds.reduce((a,b) => a + (b.hasVariants ? b.variants?.reduce((s,v)=>s+(v.stockLevel*v.costPrice),0)||0 : b.stockLevel * b.costPrice), 0);
                      return `<tr><td>${cat}</td><td class="text-right">${qty}</td><td class="text-right">৳${cost.toLocaleString()}</td></tr>`;
                  }).join('')}
                  <tr class="total-row"><td colspan="2">TOTAL INVESTMENT</td><td class="text-right" style="color:#4f46e5">৳${stats.inventoryVal.toLocaleString()}</td></tr>
                </tbody>
              </table>
              <div style="margin-top:10px; font-size:7px; color:#64748b; background:#f8fafc; padding:8px; border-radius:6px; border:1px solid #e2e8f0;">
                <strong>Accounting Equation:</strong> Net Profit = (Realized Sales - Stock Buying Cost) - Operating Expenses. Stock purchases (Procurement) are treated as Asset Investment (Balance Sheet), not an Expense (P&L).
              </div>
            </section>
          </div>

          <div class="footer">
             <p>End of Master Report • System Authenticated Data • Generated by DécorHub ERP</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Business Health</h2>
          <p className="text-slate-500 text-sm">Real-time insights and professional ledger generation.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex flex-1 md:flex-none">
             <button onClick={() => setActiveTab('overview')} className={`flex-1 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Summary</button>
             <button onClick={() => setActiveTab('master')} className={`flex-1 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'master' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Master Grid</button>
          </div>
          <input type="month" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 font-bold text-xs" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
        </div>
      </div>
      
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in slide-in-from-bottom-2">
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <TrendingUp size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Calculated Profit</span>
                </div>
                <p className="text-3xl font-bold">৳{stats.netProfit.toLocaleString()}</p>
                <p className="text-[10px] opacity-60 mt-2">Sale Earnings - Running Shop Costs</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem]">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <ShoppingBag size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Realized Revenue</span>
                </div>
                <p className="text-3xl font-bold dark:text-white">৳{stats.netRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-2">Cash received from customers</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem]">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                    <Package size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Warehouse Value</span>
                </div>
                <p className="text-3xl font-bold dark:text-white">৳{stats.inventoryVal.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-2">Value of unsold stock on hand</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem]">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                    <Receipt size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Running Costs</span>
                </div>
                <p className="text-3xl font-bold dark:text-white">৳{stats.runningCosts.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-2">OpEx (Rent, Salaries, Bills)</p>
            </div>
        </div>
      )}

      {activeTab === 'master' && (
          <div className="bg-white dark:bg-slate-900 p-10 md:p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <FileText size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3 dark:text-white">Master Business Grid</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-10">Generate a high-density professional document summarizing your sales ledger, investments, and operational expenses.</p>
              <button onClick={handlePrintMasterReport} className="w-full md:w-auto px-12 py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <Printer size={20} /> Print Master Grid
              </button>
          </div>
      )}
    </div>
  );
};
