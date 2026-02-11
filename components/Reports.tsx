import React, { useState, useMemo } from 'react';
import { Sale, Product, Customer, Expense, Return } from '../types';
import { Printer, TrendingUp, ShoppingBag, Package, Receipt, FileText, Calendar, ClipboardList } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  returns: Return[];
  theme: 'light' | 'dark';
}

export const Reports: React.FC<ReportsProps> = ({ sales, products, customers, expenses, returns, theme }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [activeTab, setActiveTab] = useState<'overview' | 'master'>('overview');

  const stats = useMemo(() => {
    const monthlySales = sales.filter(s => s.date.startsWith(selectedMonth));
    const realizedSales = monthlySales.filter(s => ['Delivered', 'Partially Returned'].includes(s.status));
    
    const monthlyReturns = returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved');
    const totalRefunds = monthlyReturns.reduce((acc, r) => acc + r.refundAmount, 0);

    // FORMULA 2: Sales Profit = total Selling price - total Cost Price
    const realizedSellingPrice = realizedSales.reduce((acc, s) => acc + s.totalAmount, 0) - totalRefunds;
    const realizedSalesProfit = realizedSales.reduce((acc, s) => acc + s.profit, 0) - totalRefunds;
    
    // RULE 1: PROCUREMENT IS NOT AN EXPENSE
    const runningExpenses = expenses
      .filter(e => e.date.startsWith(selectedMonth) && e.category !== 'Procurement' && e.status === 'Paid')
      .reduce((acc, e) => acc + e.amount, 0);
    
    // FORMULA 3: Net Profit = total sales profit - total expenses
    const netProfit = realizedSalesProfit - runningExpenses;
    
    // FORMULA 4: Net Revenue = Total selling price - total expenses
    const netRevenue = realizedSellingPrice - runningExpenses;

    let inventoryVal = 0;
    products.forEach(p => {
        const stock = p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel;
        inventoryVal += (stock || 0) * p.costPrice;
    });

    const itemCounts: Record<string, number> = {};
    realizedSales.forEach(s => {
      s.items.forEach(i => {
        itemCounts[i.productName] = (itemCounts[i.productName] || 0) + i.quantity;
      });
    });

    return { netRevenue, netProfit, runningExpenses, inventoryVal, realizedSales, realizedSellingPrice, realizedSalesProfit, itemCounts };
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
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
            th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; }
            td { border: 1px solid #e2e8f0; padding: 8px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .text-right { text-align: right; }
            .total-row { background: #f1f5f9; font-weight: 800; }
            .footer { margin-top: 50px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1>MASTER BUSINESS REPORT</h1><p style="font-size:12px; font-weight:600; color:#64748b; margin-top:5px;">Period: ${dateTitle}</p></div>
            <div style="text-align:right"><p>Enterprise Management System</p><p>${new Date().toLocaleString()}</p></div>
          </div>

          <div class="kpis">
            <div class="kpi-card"><span>Net Profit</span><h2>৳${stats.netProfit.toLocaleString()}</h2></div>
            <div class="kpi-card"><span>Net Revenue</span><h2>৳${stats.netRevenue.toLocaleString()}</h2></div>
            <div class="kpi-card"><span>Warehouse Assets</span><h2>৳${stats.inventoryVal.toLocaleString()}</h2></div>
            <div class="kpi-card"><span>Shop Expenses</span><h2>৳${stats.runningExpenses.toLocaleString()}</h2></div>
          </div>

          <section>
            <h3>REALIZED SALES REGISTER <span>(DELIVERED ONLY)</span></h3>
            <table>
              <thead>
                <tr>
                  <th style="width:12%">DATE</th><th style="width:12%">REF</th><th style="width:20%">CUSTOMER</th><th class="text-right">PRICE</th><th class="text-right">REFUNDS</th><th class="text-right">SALES PROFIT</th>
                </tr>
              </thead>
              <tbody>
                ${stats.realizedSales.map(s => {
                    const rValue = returns.filter(r => r.orderId === s.id && r.status === 'Approved').reduce((a,b)=>a+b.refundAmount,0);
                    return `<tr><td>${s.date}</td><td>#${s.id.slice(-6)}</td><td>${s.customerName}</td><td class="text-right">৳${s.totalAmount.toLocaleString()}</td><td class="text-right">৳${rValue.toLocaleString()}</td><td class="text-right">৳${(s.profit - rValue).toLocaleString()}</td></tr>`;
                }).join('')}
                <tr class="total-row">
                    <td colspan="3">PERIOD TOTALS</td>
                    <td class="text-right">৳${(stats.realizedSellingPrice + (returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved').reduce((a,b)=>a+b.refundAmount,0))).toLocaleString()}</td>
                    <td class="text-right">৳${(returns.filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved').reduce((a,b)=>a+b.refundAmount,0)).toLocaleString()}</td>
                    <td class="text-right" style="color:#10b981">৳${stats.realizedSalesProfit.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <section>
              <h3>EXPENSE LEDGER <span>(OPERATIONAL)</span></h3>
              <table>
                <thead><tr><th>CATEGORY</th><th class="text-right">AMOUNT</th></tr></thead>
                <tbody>
                  ${expenses.filter(e => e.date.startsWith(selectedMonth) && e.category !== 'Procurement' && e.status === 'Paid').map(e => `<tr><td>${e.category}</td><td class="text-right">৳${e.amount.toLocaleString()}</td></tr>`).join('')}
                  <tr class="total-row"><td>TOTAL OP. COSTS</td><td class="text-right">৳${stats.runningExpenses.toLocaleString()}</td></tr>
                </tbody>
              </table>
            </section>
            <section>
              <h3>INVENTORY VALUATION</h3>
              <table>
                <thead><tr><th>CATEGORY</th><th class="text-right">STOCK</th><th class="text-right">VALUATION</th></tr></thead>
                <tbody>
                  ${Array.from(new Set(products.map(p => p.category))).map(cat => {
                      const catProds = products.filter(p => p.category === cat);
                      const qty = catProds.reduce((a,b) => a + (b.hasVariants ? b.variants?.reduce((s,v)=>s+v.stockLevel,0)||0 : b.stockLevel), 0);
                      const cost = catProds.reduce((a,b) => a + (b.hasVariants ? b.variants?.reduce((s,v)=>s+(v.stockLevel*v.costPrice),0)||0 : b.stockLevel * b.costPrice), 0);
                      return `<tr><td>${cat}</td><td class="text-right">${qty}</td><td class="text-right">৳${cost.toLocaleString()}</td></tr>`;
                  }).join('')}
                  <tr class="total-row"><td colspan="2">TOTAL ASSETS</td><td class="text-right">৳${stats.inventoryVal.toLocaleString()}</td></tr>
                </tbody>
              </table>
            </section>
          </div>

          <div class="footer">
             <p>Certified Performance Statement • Logic: Net Profit = (Sales Profit - OpEx); Net Revenue = (Gross Revenue - OpEx). Procurement costs are treated as Balance Sheet Assets, not Expenses.</p>
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
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Business Intelligence</h2>
          <p className="text-slate-500 text-sm">Strategic analytics and document generation.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex flex-1 md:flex-none">
             <button onClick={() => setActiveTab('overview')} className={`flex-1 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-400'}`}>Overview</button>
             <button onClick={() => setActiveTab('master')} className={`flex-1 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'master' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-400'}`}>Master Grid</button>
          </div>
          <input type="month" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 font-bold text-xs" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
        </div>
      </div>
      
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-2">
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <TrendingUp size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Net Profit</span>
                </div>
                <p className="text-3xl font-bold">৳{stats.netProfit.toLocaleString()}</p>
                <p className="text-[10px] opacity-60 mt-2">Sales Profit - Shop Costs</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem]">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <ShoppingBag size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Net Revenue</span>
                </div>
                <p className="text-3xl font-bold dark:text-white">৳{stats.netRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-2">Revenue - Shop Costs</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem]">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                    <Package size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Warehouse Value</span>
                </div>
                <p className="text-3xl font-bold dark:text-white">৳{stats.inventoryVal.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-2">Assets in stock</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem]">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                    <Receipt size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Op. Expenses</span>
                </div>
                <p className="text-3xl font-bold dark:text-white">৳{stats.runningExpenses.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-2">Monthly running outflow</p>
            </div>
        </div>
      )}

      {activeTab === 'overview' && stats.realizedSales.length > 0 && (
          <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-sm mt-8">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <ClipboardList size={20} className="text-indigo-600 dark:text-indigo-400" /> Realized Performance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Product</th>
                    <th className="px-8 py-5 text-center">Qty Sold</th>
                    <th className="px-8 py-5 text-right">Revenue (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(stats.itemCounts).map(([name, qty]) => (
                    <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300">{name}</td>
                      <td className="px-8 py-5 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">{qty}</td>
                      <td className="px-8 py-5 text-right font-bold text-slate-900 dark:text-white">
                        ৳{(sales.filter(s => s.date.startsWith(selectedMonth) && ['Delivered', 'Partially Returned'].includes(s.status))
                          .reduce((sum, s) => sum + s.items.filter(i => i.productName === name)
                          .reduce((iSum, i) => iSum + i.total, 0), 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {activeTab === 'master' && (
          <div className="bg-white dark:bg-slate-900 p-16 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <FileText size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3 dark:text-white">Professional Master Grid</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-10">Export a comprehensive financial summary including realized sales profit, operational costs, and warehouse valuation.</p>
              <button onClick={handlePrintMasterReport} className="w-full md:w-auto px-12 py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <Printer size={20} /> Generate Master Grid
              </button>
          </div>
      )}
    </div>
  );
};