
import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Product, Customer, MonthlyReport, Expense, PeriodSummary, Return } from '../types';
import { ApiService } from './apiService';
import { Download, Calendar, Package, ClipboardList, Users, ShoppingBag, Receipt, TrendingUp, TrendingDown, FolderDown, Lock, ArrowRight, Wallet, History, RotateCcw } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  returns: Return[];
  theme: 'light' | 'dark';
}

export const Reports: React.FC<ReportsProps> = ({ sales, products, customers, expenses, returns, theme }) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [periodSummaries, setPeriodSummaries] = useState<PeriodSummary[]>([]);

  // Load period summaries on mount
  useEffect(() => {
    ApiService.fetchLatest('period_summaries').then(data => {
      if (data) setPeriodSummaries(data);
    });
  }, []);

  // Aggregation Logic
  const allMonthlyData = useMemo(() => {
    // 1. Process Sales
    const data = sales.reduce((acc, sale) => {
      const monthKey = sale.date.substring(0, 7);
      if (!acc[monthKey]) {
        acc[monthKey] = {
          report: { month: monthKey, revenue: 0, orders: 0, profit: 0, topProduct: 'None' },
          itemCounts: {} as Record<string, number>,
          customers: new Set<string>()
        };
      }
      
      acc[monthKey].report.revenue += sale.totalAmount;
      acc[monthKey].report.profit += sale.profit;
      acc[monthKey].report.orders += 1;
      acc[monthKey].customers.add(sale.customerName);

      sale.items.forEach(item => {
        acc[monthKey].itemCounts[item.productName] = (acc[monthKey].itemCounts[item.productName] || 0) + item.quantity;
      });

      return acc;
    }, {} as Record<string, { report: MonthlyReport, itemCounts: Record<string, number>, customers: Set<string> }>);

    // 2. Determine Top Products
    Object.keys(data).forEach(m => {
      let topProd = 'None';
      let maxQty = 0;
      Object.entries(data[m].itemCounts).forEach(([name, qty]) => {
        const numericQty = qty as number;
        if (numericQty > maxQty) {
          maxQty = numericQty;
          topProd = name;
        }
      });
      data[m].report.topProduct = topProd;
    });

    return data;
  }, [sales]);

  const activeReport = allMonthlyData[selectedMonth];
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(selectedMonth) && e.status === 'Paid').reduce((acc, e) => acc + e.amount, 0);
  
  // Calculate Refunds for this month (Approved returns)
  const monthlyRefunds = returns
    .filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved')
    .reduce((acc, r) => acc + r.refundAmount, 0);

  // Calculate Asset Recovery (Recovered Cost for Resellable Returns)
  const monthlyRecoveredCost = returns
    .filter(r => r.date.startsWith(selectedMonth) && r.status === 'Approved' && r.condition === 'Resellable')
    .reduce((acc, r) => acc + ((r.unitCost || 0) * r.quantity), 0);

  // Net Profit = (Sales Profit) - Expenses - Refunds + Recovered Inventory Value
  // We add back the cost price of resellable items because we regained the asset.
  const monthlyNetProfit = (activeReport?.report.profit || 0) - monthlyExpenses - monthlyRefunds + monthlyRecoveredCost;
  
  // Net Revenue = Gross Sales - Refunds
  const monthlyNetRevenue = (activeReport?.report.revenue || 0) - monthlyRefunds;

  // Inventory Valuation (Current Snapshot)
  const currentInventoryValue = products.reduce((acc, p) => {
    if (p.hasVariants && p.variants) {
      return acc + p.variants.reduce((vAcc, v) => vAcc + (v.stockLevel * v.costPrice), 0);
    }
    return acc + (p.stockLevel * p.costPrice);
  }, 0);

  // Period Logic
  const previousMonthStr = useMemo(() => {
    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, [selectedMonth]);

  const prevSummary = periodSummaries.find(s => s.month === previousMonthStr);
  const currentSummary = periodSummaries.find(s => s.month === selectedMonth);

  // Opening Inventory is either the previous month's closing OR 0 if no history
  const openingInventory = prevSummary ? prevSummary.closingInventoryValue : 0;
  
  // Closing Inventory is the stored snapshot if closed, otherwise the live calculated value
  const closingInventory = currentSummary ? currentSummary.closingInventoryValue : currentInventoryValue;

  // Handle Month-End Closing
  const handleClosePeriod = async () => {
    if (!confirm(`Are you sure you want to CLOSE the month of ${selectedMonth}? \n\n1. This creates a permanent financial snapshot.\n2. Current Inventory Value (৳${currentInventoryValue.toLocaleString()}) becomes Opening Inventory for next month.\n3. Net Profit (৳${monthlyNetProfit.toLocaleString()}) is finalized.`)) return;

    const openingBal = prevSummary ? prevSummary.closingBalance : 0;
    const closingBal = openingBal + monthlyNetProfit;

    const newSummary: PeriodSummary = {
      month: selectedMonth,
      openingInventoryValue: openingInventory,
      closingInventoryValue: currentInventoryValue, // Snapshot current stock value
      openingBalance: openingBal,
      closingBalance: closingBal,
      totalRevenue: monthlyNetRevenue,
      totalExpenses: monthlyExpenses,
      netProfit: monthlyNetProfit,
      closedAt: new Date().toISOString()
    };

    const updatedSummaries = [...periodSummaries.filter(s => s.month !== selectedMonth), newSummary];
    
    setPeriodSummaries(updatedSummaries);
    await ApiService.pushUpdate('period_summaries', updatedSummaries);
    handleDownloadAll();

    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const downloadCSV = (type: 'orders' | 'items' | 'inventory' | 'customers' | 'expenses' | 'returns', month: string) => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = "";

    const formatCurrency = (val: number) => val.toFixed(2);

    if (type === 'orders') {
      const monthSales = sales.filter(s => s.date.startsWith(month));
      headers = ["Order ID", "Date", "Customer", "Total Revenue (BDT)", "Delivery Charge (BDT)", "Total Cost (BDT)", "Gross Profit (BDT)", "Status", "Item Count", "Notes"];
      rows = monthSales.map(s => [
        s.id, s.date, s.customerName, formatCurrency(s.totalAmount), formatCurrency(s.deliveryCharge || 0),
        formatCurrency(s.totalCost), formatCurrency(s.profit), s.status, s.items.reduce((acc, i) => acc + i.quantity, 0), s.notes
      ]);
      filename = `Sales_${month}.csv`;
    } else if (type === 'returns') {
      const monthReturns = returns.filter(r => r.date.startsWith(month));
      headers = ["RMA ID", "Order Ref", "Date", "Customer", "Product", "Refund Amount (BDT)", "Reason", "Condition", "Status"];
      rows = monthReturns.map(r => [
        r.id, r.orderId, r.date, r.customerName, r.productName, formatCurrency(r.refundAmount), r.reason, r.condition, r.status
      ]);
      filename = `Returns_${month}.csv`;
    } else if (type === 'items') {
      // ... existing items logic ...
      const monthSales = sales.filter(s => s.date.startsWith(month));
      const itemAgg: Record<string, { qty: number, rev: number, profit: number }> = {};
      monthSales.forEach(s => s.items.forEach(i => {
        if (!itemAgg[i.productName]) itemAgg[i.productName] = { qty: 0, rev: 0, profit: 0 };
        itemAgg[i.productName].qty += i.quantity;
        itemAgg[i.productName].rev += i.total;
        itemAgg[i.productName].profit += (i.total - (i.unitCost * i.quantity));
      }));
      headers = ["Product Name", "Quantity Sold", "Gross Revenue (BDT)", "Estimated Profit (BDT)"];
      rows = Object.entries(itemAgg).map(([name, data]) => [name, data.qty, formatCurrency(data.rev), formatCurrency(data.profit)]);
      filename = `Items_${month}.csv`;
    } else if (type === 'inventory') {
      headers = ["SKU", "Product Name", "Category", "Stock Level", "Unit Cost (BDT)", "Total Asset Value (BDT)", "Report Period"];
      rows = products.map(p => {
        const stock = p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel;
        return [p.sku, p.name, p.category, stock, formatCurrency(p.costPrice), formatCurrency((stock || 0) * p.costPrice), month];
      });
      filename = `Inventory_Closing_${month}.csv`;
    } else if (type === 'customers') {
      headers = ["ID", "Name", "Phone", "Address", "Tier", "Total Spent", "Last Purchase"];
      rows = customers.map(c => [c.id, c.name, c.phone, c.address, c.tier, formatCurrency(c.totalSpent), c.lastPurchaseDate]);
      filename = `Customers_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'expenses') {
      const monthExpenses = expenses.filter(e => e.date.startsWith(month));
      headers = ["ID", "Date", "Category", "Description", "Amount (BDT)", "Payment Method", "Status"];
      rows = monthExpenses.map(e => [e.id, e.date, e.category, e.description, formatCurrency(e.amount), e.paymentMethod, e.status]);
      filename = `Expenses_${month}.csv`;
    }

    const formatField = (field: any) => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map(formatField).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    downloadCSV('orders', selectedMonth);
    setTimeout(() => downloadCSV('returns', selectedMonth), 300);
    setTimeout(() => downloadCSV('expenses', selectedMonth), 600);
    setTimeout(() => downloadCSV('inventory', selectedMonth), 900);
    setTimeout(() => downloadCSV('customers', selectedMonth), 1200);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white tracking-tight">Reports & Closing</h2>
          <p className="text-slate-500 text-sm">Financial statements and period reconciliation.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <Calendar size={18} className="text-indigo-600 dark:text-indigo-400 ml-2" />
          <input 
            type="month" 
            className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 p-1 cursor-pointer"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl border border-slate-800">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-8">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-300">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Month-End Reconciliation</h3>
                    <p className="text-xs text-slate-400">Inventory Valuation Roll-forward System</p>
                  </div>
               </div>

               <div className="flex gap-12">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Opening Inventory</p>
                     <p className="text-2xl font-mono font-bold text-slate-300">৳{openingInventory.toLocaleString()}</p>
                     <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                       <History size={10} /> Carried from {previousMonthStr}
                     </p>
                  </div>
                  <div className="relative">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Closing Inventory</p>
                     <p className="text-2xl font-mono font-bold text-white">৳{closingInventory.toLocaleString()}</p>
                     <p className="text-[10px] text-slate-500 mt-1">
                       {currentSummary ? 'Locked & Finalized' : 'Current Estimate'}
                     </p>
                     {!currentSummary && (
                       <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live Value"></div>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-3">
               {currentSummary ? (
                 <div className="px-6 py-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3">
                    <Lock size={18} className="text-green-500" />
                    <div>
                      <span className="font-bold text-green-400 text-sm block">Period Closed</span>
                      <span className="text-[10px] text-green-500/70">{new Date(currentSummary.closedAt).toLocaleDateString()}</span>
                    </div>
                 </div>
               ) : (
                 <button 
                   onClick={handleClosePeriod}
                   className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg active:scale-95"
                 >
                   <Lock size={18} /> Close Month & Next <ArrowRight size={18} />
                 </button>
               )}
               <button 
                  onClick={handleDownloadAll}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-200 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border border-white/5 hover:border-white/20"
               >
                  <FolderDown size={18} /> Download Bundle
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <button onClick={() => downloadCSV('orders', selectedMonth)} className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-[2.5rem] shadow-sm transition-all active:scale-95 group">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingBag size={24} /></div>
          <span className="block font-bold dark:text-white">Sales Ledger</span>
        </button>

        <button onClick={() => downloadCSV('expenses', selectedMonth)} className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-[2.5rem] shadow-sm transition-all active:scale-95 group">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl group-hover:scale-110 transition-transform"><Receipt size={24} /></div>
          <span className="block font-bold text-slate-800 dark:text-white">Expense Ledger</span>
        </button>

        <button onClick={() => downloadCSV('inventory', selectedMonth)} className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-[2.5rem] shadow-sm transition-all active:scale-95 group">
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform"><Package size={24} /></div>
          <span className="block font-bold text-slate-800 dark:text-white">Inventory</span>
        </button>

        <button onClick={() => downloadCSV('returns', selectedMonth)} className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-[2.5rem] shadow-sm transition-all active:scale-95 group">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl group-hover:scale-110 transition-transform"><RotateCcw size={24} /></div>
          <span className="block font-bold text-slate-800 dark:text-white">Returns Data</span>
        </button>
      </div>

      {activeReport ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-indigo-500">
                <TrendingUp size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Net Revenue</p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">৳{monthlyNetRevenue.toLocaleString()}</p>
              {monthlyRefunds > 0 && (
                <p className="text-[10px] text-red-500 mt-1 font-medium">After deducting ৳{monthlyRefunds.toLocaleString()} refunds</p>
              )}
            </div>
            
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-2 mb-2 text-red-500">
                <TrendingDown size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Expenses</p>
              </div>
              <p className="text-3xl font-bold text-red-500 tracking-tight">৳{monthlyExpenses.toLocaleString()}</p>
            </div>

            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-2 mb-2 text-emerald-500">
                <ShoppingBag size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Net Profit</p>
              </div>
              <p className={`text-3xl font-bold tracking-tight ${monthlyNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>৳{monthlyNetProfit.toLocaleString()}</p>
              {monthlyRecoveredCost > 0 && (
                <p className="text-[10px] text-emerald-500 mt-1 font-medium">+৳{monthlyRecoveredCost.toLocaleString()} recovered asset value</p>
              )}
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white border border-slate-800">
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Top Performer</p>
              <p className="text-lg font-bold truncate leading-tight">{activeReport.report.topProduct}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-sm">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <ClipboardList size={20} className="text-indigo-600 dark:text-indigo-400" /> Monthly Breakdown
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
                  {Object.entries(activeReport.itemCounts).map(([name, qty]) => (
                    <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300">{name}</td>
                      <td className="px-8 py-5 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">{qty}</td>
                      <td className="px-8 py-5 text-right font-bold text-slate-900 dark:text-white">
                        ৳{(sales.filter(s => s.date.startsWith(selectedMonth))
                          .reduce((sum, s) => sum + s.items.filter(i => i.productName === name)
                          .reduce((iSum, i) => iSum + i.total, 0), 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <p className="font-medium">No activity recorded for this month.</p>
        </div>
      )}
    </div>
  );
};
