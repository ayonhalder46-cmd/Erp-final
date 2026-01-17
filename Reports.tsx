
import React, { useState, useMemo } from 'react';
import { Sale, Product, Customer, MonthlyReport, Expense } from '../types';
import { Download, Calendar, Package, ClipboardList, Users, ShoppingBag, Receipt, TrendingUp, TrendingDown } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  theme: 'light' | 'dark';
}

export const Reports: React.FC<ReportsProps> = ({ sales, products, customers, expenses, theme }) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const allMonthlyData = useMemo(() => {
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
  const monthlyNetProfit = (activeReport?.report.profit || 0) - monthlyExpenses;

  const downloadCSV = (type: 'orders' | 'items' | 'inventory' | 'customers' | 'expenses', month: string) => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = "";

    const formatCurrency = (val: number) => val.toFixed(2);

    if (type === 'orders') {
      const monthSales = sales.filter(s => s.date.startsWith(month));
      headers = ["Order ID", "Date", "Customer", "Total Revenue (BDT)", "Delivery Charge (BDT)", "Total Cost (BDT)", "Gross Profit (BDT)", "Status", "Item Count", "Notes"];
      rows = monthSales.map(s => [
        s.id, 
        s.date, 
        s.customerName, 
        formatCurrency(s.totalAmount), 
        formatCurrency(s.deliveryCharge || 0),
        formatCurrency(s.totalCost), 
        formatCurrency(s.profit), 
        s.status,
        s.items.reduce((acc, i) => acc + i.quantity, 0),
        s.notes
      ]);
      filename = `Sales_${month}.csv`;
    } else if (type === 'items') {
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
      headers = ["SKU", "Product Name", "Category", "Stock Level", "Cost Price (BDT)", "Selling Price (BDT)", "Asset Value", "Potential Revenue"];
      rows = products.map(p => {
        const stock = p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel;
        return [
          p.sku, 
          p.name, 
          p.category, 
          stock, 
          formatCurrency(p.costPrice), 
          formatCurrency(p.sellingPrice), 
          formatCurrency((stock || 0) * p.costPrice), 
          formatCurrency((stock || 0) * p.sellingPrice)
        ];
      });
      filename = `Inventory_${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white tracking-tight">Reports</h2>
          <p className="text-slate-500 text-sm">Export financial data and analyze performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <Calendar size={18} className="text-indigo-600 dark:text-indigo-400 ml-2" />
            <input 
              type="month" 
              className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 p-1"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <button 
          onClick={() => downloadCSV('orders', selectedMonth)}
          className="flex flex-col items-center justify-center gap-4 p-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] shadow-xl shadow-indigo-500/20 transition-all active:scale-95 group"
        >
          <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
            <ShoppingBag size={24} />
          </div>
          <span className="block font-bold">Sales Ledger</span>
        </button>

        <button 
          onClick={() => downloadCSV('expenses', selectedMonth)}
          className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-[2.5rem] shadow-sm transition-all active:scale-95 group"
        >
          <div className="p-4 bg-slate-50 dark:bg-slate-800 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
            <Receipt size={24} />
          </div>
          <span className="block font-bold text-slate-800 dark:text-white">Expense Ledger</span>
        </button>

        <button 
          onClick={() => downloadCSV('inventory', selectedMonth)}
          className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-[2.5rem] shadow-sm transition-all active:scale-95 group"
        >
          <div className="p-4 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
            <Package size={24} />
          </div>
          <span className="block font-bold text-slate-800 dark:text-white">Inventory</span>
        </button>

        <button 
          onClick={() => downloadCSV('customers', selectedMonth)}
          className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-[2.5rem] shadow-sm transition-all active:scale-95 group"
        >
          <div className="p-4 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <span className="block font-bold text-slate-800 dark:text-white">Customers</span>
        </button>
      </div>

      {activeReport ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-indigo-500">
                <TrendingUp size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Revenue</p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">৳{activeReport.report.revenue.toLocaleString()}</p>
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
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
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
