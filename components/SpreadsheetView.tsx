
import React, { useState } from 'react';
import { Product, Sale, Customer, Supplier, Expense } from '../types';
import { FileSpreadsheet, Download, Filter, Search, Table, Package, Users, ShoppingCart, Truck, Save, Edit2 } from 'lucide-react';

interface SpreadsheetViewProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  onUpdateProduct: (p: Product) => void;
}

type Tab = 'inventory' | 'sales' | 'customers' | 'suppliers' | 'expenses';

const Cell = ({ children, align = 'left', className = '' }: { children?: React.ReactNode, align?: 'left' | 'right' | 'center', className?: string }) => (
  <td className={`px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 truncate max-w-[200px] text-${align} ${className}`}>
    {children}
  </td>
);

const EditableCell = ({ value, onSave, type = 'text', prefix = '' }: { value: string | number, onSave: (val: any) => void, type?: 'text' | 'number', prefix?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentVal !== value) {
      onSave(type === 'number' ? Number(currentVal) : currentVal);
    }
  };

  if (isEditing) {
    return (
      <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-700 w-24">
        <input 
          autoFocus
          type={type}
          className="w-full h-full px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 outline-none"
          value={currentVal}
          onChange={(e) => setCurrentVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if(e.key === 'Enter') handleBlur();
          }}
        />
      </td>
    );
  }

  return (
    <td 
      onClick={() => setIsEditing(true)} 
      className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 group transition-colors text-right relative"
    >
      {prefix}{Number(value).toLocaleString()}
      <Edit2 size={10} className="absolute right-1 top-1 text-indigo-400 opacity-0 group-hover:opacity-100" />
    </td>
  );
};

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  products, sales, customers, suppliers, expenses, onUpdateProduct
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [searchTerm, setSearchTerm] = useState('');

  const downloadCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `${activeTab}_sheet_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === 'inventory') {
      headers = ["ID", "SKU", "Name", "Category", "Supplier", "Stock", "Cost (BDT)", "Price (BDT)", "Total Asset Value"];
      rows = products.map(p => {
        const stock = p.hasVariants ? p.variants?.reduce((a,b) => a + b.stockLevel, 0) : p.stockLevel;
        return [
          p.id, p.sku, p.name, p.category, 
          suppliers.find(s => s.id === p.supplierId)?.name || 'N/A',
          stock, p.costPrice, p.sellingPrice, (stock || 0) * p.costPrice
        ];
      });
    } else if (activeTab === 'sales') {
      headers = ["Order ID", "Date", "Customer", "Items", "Total (BDT)", "Cost (BDT)", "Profit (BDT)", "Status"];
      rows = sales.map(s => [
        s.id, s.date, s.customerName, 
        s.items.map(i => `${i.productName} (x${i.quantity})`).join('; '),
        s.totalAmount, s.totalCost, s.profit, s.status
      ]);
    } else if (activeTab === 'customers') {
      headers = ["ID", "Name", "Phone", "Tier", "Total Spent (BDT)", "Last Purchase"];
      rows = customers.map(c => [c.id, c.name, c.phone, c.tier, c.totalSpent, c.lastPurchaseDate]);
    } else if (activeTab === 'suppliers') {
      headers = ["ID", "Name", "Contact", "Email", "Phone", "Category", "Status"];
      rows = suppliers.map(s => [s.id, s.name, s.contactPerson, s.email, s.phone, s.category, s.status]);
    } else if (activeTab === 'expenses') {
      headers = ["ID", "Date", "Category", "Description", "Amount (BDT)", "Status"];
      rows = expenses.map(e => [e.id, e.date, e.category, e.description, e.amount, e.status]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = () => {
    let headers: string[] = [];
    let rows: React.ReactNode[] = [];

    if (activeTab === 'inventory') {
      headers = ["SKU", "Product Name", "Category", "Stock (Edit)", "Cost (৳)", "Price (Edit ৳)", "Asset Value (৳)"];
      const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      rows = filtered.map(p => {
        const stock = p.hasVariants ? p.variants?.reduce((a,b) => a + b.stockLevel, 0) : p.stockLevel;
        return (
          <tr key={p.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 transition-colors">
            <Cell className="font-mono">{p.sku}</Cell>
            <Cell className="font-bold">{p.name}</Cell>
            <Cell>{p.category}</Cell>
            
            {p.hasVariants ? (
               <Cell align="center">
                 <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-500">VARIANTS</span>
               </Cell>
            ) : (
               <EditableCell 
                 value={p.stockLevel} 
                 type="number" 
                 onSave={(val) => onUpdateProduct({...p, stockLevel: val})} 
               />
            )}

            <Cell align="right">{p.costPrice.toLocaleString()}</Cell>
            
            <EditableCell 
              value={p.sellingPrice} 
              type="number" 
              prefix="৳"
              onSave={(val) => onUpdateProduct({...p, sellingPrice: val})} 
            />
            
            <Cell align="right" className="font-mono text-slate-400">{((stock || 0) * p.costPrice).toLocaleString()}</Cell>
          </tr>
        );
      });
    } else if (activeTab === 'sales') {
      headers = ["Order Ref", "Date", "Customer", "Items", "Total (৳)", "Status"];
      const filtered = sales.filter(s => s.id.includes(searchTerm) || s.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
      rows = filtered.map(s => (
        <tr key={s.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <Cell>#{s.id.slice(-6)}</Cell>
          <Cell>{s.date}</Cell>
          <Cell>{s.customerName}</Cell>
          <Cell>{s.items.length} items</Cell>
          <Cell align="right">{s.totalAmount.toLocaleString()}</Cell>
          <Cell><span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${s.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{s.status}</span></Cell>
        </tr>
      ));
    } else if (activeTab === 'customers') {
      headers = ["Name", "Phone", "Tier", "Total Spent (৳)", "Last Purchase"];
      const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
      rows = filtered.map(c => (
        <tr key={c.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <Cell>{c.name}</Cell>
          <Cell>{c.phone}</Cell>
          <Cell>{c.tier}</Cell>
          <Cell align="right">{c.totalSpent.toLocaleString()}</Cell>
          <Cell>{c.lastPurchaseDate}</Cell>
        </tr>
      ));
    } else if (activeTab === 'suppliers') {
      headers = ["Name", "Contact", "Email", "Category", "Status"];
      const filtered = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
      rows = filtered.map(s => (
        <tr key={s.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <Cell>{s.name}</Cell>
          <Cell>{s.contactPerson}</Cell>
          <Cell>{s.email}</Cell>
          <Cell>{s.category}</Cell>
          <Cell>{s.status}</Cell>
        </tr>
      ));
    } else if (activeTab === 'expenses') {
      headers = ["Date", "Category", "Description", "Amount (৳)", "Status"];
      const filtered = expenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase()));
      rows = filtered.map(e => (
        <tr key={e.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <Cell>{e.date}</Cell>
          <Cell>{e.category}</Cell>
          <Cell>{e.description}</Cell>
          <Cell align="right">{e.amount.toLocaleString()}</Cell>
          <Cell>{e.status}</Cell>
        </tr>
      ));
    }

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-widest border-r border-slate-200 dark:border-slate-700 last:border-0 whitespace-nowrap bg-slate-100 dark:bg-slate-800/80">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 font-mono text-xs">
              {rows}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
        activeTab === id 
        ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' 
        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <FileSpreadsheet className="text-indigo-600" size={32} />
            Master Data Grid
          </h2>
          <p className="text-slate-500 text-sm">Centralized spreadsheet view. Click cells to edit Inventory.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               placeholder="Filter grid data..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <TabButton id="inventory" label="Inventory Stock" icon={Package} />
        <TabButton id="sales" label="Sales Ledger" icon={ShoppingCart} />
        <TabButton id="customers" label="Customer CRM" icon={Users} />
        <TabButton id="suppliers" label="Supply Chain" icon={Truck} />
        <TabButton id="expenses" label="Expenses" icon={FileSpreadsheet} />
      </div>

      <div className="flex-1 overflow-auto min-h-0 rounded-lg shadow-inner bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
        {activeTab === 'inventory' && (
          <div className="absolute top-2 right-4 z-10 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200 opacity-80 pointer-events-none">
            Editable Mode Active
          </div>
        )}
        {renderTable()}
      </div>
      
      <div className="shrink-0 text-right">
        <p className="text-[10px] text-slate-400 font-mono">
           Viewing {activeTab} data • {new Date().toLocaleDateString()} • {activeTab === 'inventory' ? 'Interactive Mode' : 'Read-Only Mode'}
        </p>
      </div>
    </div>
  );
};
