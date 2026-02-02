
import React, { useState, useMemo } from 'react';
import { Product, Sale, Customer, Supplier, Expense, ProductVariant, Return } from '../types';
import { FileSpreadsheet, Download, Search, Edit2, ChevronLeft, ChevronRight, Filter, Package, ShoppingCart, Users, Truck, CornerDownRight, Layers, RotateCcw, BookOpenCheck } from 'lucide-react';

interface SpreadsheetViewProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  returns: Return[];
  onUpdateProduct: (p: Product) => void;
}

type Tab = 'inventory' | 'sales' | 'financials' | 'customers' | 'suppliers' | 'expenses' | 'returns';

const Cell = ({ children, align = 'left', className = '' }: { children?: React.ReactNode, align?: 'left' | 'right' | 'center', className?: string }) => (
  <td className={`px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 truncate max-w-[200px] text-${align} ${className}`}>
    {children}
  </td>
);

const EditableCell = ({ value, onSave, type = 'text', prefix = '' }: { value: string | number, onSave: (val: any) => void, type?: 'text' | 'number', prefix?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value);

  // Sync state if prop changes from outside
  React.useEffect(() => {
    setCurrentVal(value);
  }, [value]);

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
      {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
      <Edit2 size={10} className="absolute right-1 top-1 text-indigo-400 opacity-0 group-hover:opacity-100" />
    </td>
  );
};

const EditableSelectCell = ({ value, options, onSave }: { value: string, options: {id: string, label: string}[], onSave: (val: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-700 w-32">
        <select 
          autoFocus
          className="w-full h-full px-2 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 outline-none appearance-none"
          value={value}
          onChange={(e) => { onSave(e.target.value); setIsEditing(false); }}
          onBlur={() => setIsEditing(false)}
        >
          <option value="">-- None --</option>
          {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
        </select>
      </td>
    );
  }

  const label = options.find(o => o.id === value)?.label || 'N/A';

  return (
    <td 
      onClick={() => setIsEditing(true)} 
      className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 group transition-colors relative"
    >
      {label}
      <Edit2 size={10} className="absolute right-1 top-1 text-indigo-400 opacity-0 group-hover:opacity-100" />
    </td>
  );
};

// Interface for the Flattened Inventory Row
interface InventoryRow {
    type: 'product' | 'variant';
    id: string; // Product ID or Variant ID
    parentId?: string; // Only for variants
    parentName?: string;
    
    sku: string;
    name: string;
    category: string;
    supplierId?: string;
    
    stockLevel: number;
    minStockLevel: number;
    costPrice: number;
    sellingPrice: number;
    
    // Reference to original object for updates
    originalProduct: Product;
    originalVariant?: ProductVariant;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  products, sales, customers, suppliers, expenses, returns, onUpdateProduct
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Flatten Inventory Data: Convert Product w/ Variants into multiple rows
  const flattenedInventory = useMemo(() => {
    const rows: InventoryRow[] = [];
    
    products.forEach(p => {
        if (p.hasVariants && p.variants) {
            // Push variants directly as rows (more useful for editing)
            // Optional: You could push a header row for the product if you wanted grouping
            p.variants.forEach(v => {
                rows.push({
                    type: 'variant',
                    id: v.id,
                    parentId: p.id,
                    parentName: p.name,
                    sku: v.sku,
                    name: v.name, // Variant name (e.g. "Red")
                    category: p.category,
                    supplierId: p.supplierId,
                    stockLevel: v.stockLevel,
                    minStockLevel: v.minStockLevel || 5,
                    costPrice: v.costPrice,
                    sellingPrice: v.sellingPrice,
                    originalProduct: p,
                    originalVariant: v
                });
            });
        } else {
            rows.push({
                type: 'product',
                id: p.id,
                sku: p.sku,
                name: p.name,
                category: p.category,
                supplierId: p.supplierId,
                stockLevel: p.stockLevel,
                minStockLevel: p.minStockLevel || 5,
                costPrice: p.costPrice,
                sellingPrice: p.sellingPrice,
                originalProduct: p
            });
        }
    });
    
    return rows.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.parentName && r.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const handleUpdateInventoryRow = (row: InventoryRow, field: keyof InventoryRow, value: any) => {
      const product = { ...row.originalProduct }; // Clone parent
      
      if (row.type === 'variant' && product.variants) {
          const vIndex = product.variants.findIndex(v => v.id === row.id);
          if (vIndex > -1) {
              const updatedVariant = { ...product.variants[vIndex], [field]: value };
              product.variants = [...product.variants]; // Clone variants array
              product.variants[vIndex] = updatedVariant;
              
              // If updating category or supplier on a variant row, update the PARENT product
              if (field === 'category') product.category = value;
              if (field === 'supplierId') product.supplierId = value;
          }
      } else {
          // Standard product update
          (product as any)[field] = value;
      }
      
      onUpdateProduct(product);
  };

  const downloadCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `${activeTab}_sheet_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === 'inventory') {
      headers = ["SKU", "Product", "Variant", "Category", "Supplier", "Stock", "Min Stock", "Cost (BDT)", "Price (BDT)", "Total Asset Value"];
      rows = flattenedInventory.map(r => [
          r.sku,
          r.parentName || r.name,
          r.type === 'variant' ? r.name : '',
          r.category,
          suppliers.find(s => s.id === r.supplierId)?.name || 'N/A',
          r.stockLevel,
          r.minStockLevel,
          r.costPrice,
          r.sellingPrice,
          r.stockLevel * r.costPrice
      ]);
    } else if (activeTab === 'sales') {
      headers = ["Order ID", "Date", "Customer", "Items", "Total (BDT)", "Cost (BDT)", "Profit (BDT)", "Status"];
      rows = sales.map(s => [
        s.id, s.date, s.customerName, 
        s.items.map(i => `${i.productName} (x${i.quantity})`).join('; '),
        s.totalAmount, s.totalCost, s.profit, s.status
      ]);
    } else if (activeTab === 'financials') {
      headers = ["Date", "Order Ref", "Customer", "Gross Total (BDT)", "Returned Value (BDT)", "Net Revenue (BDT)", "Realized Profit (BDT)", "Status"];
      const finalOrders = sales.filter(s => s.status === 'Delivered' || s.status === 'Partially Returned');
      rows = finalOrders.map(s => {
        const orderReturns = returns.filter(r => r.orderId === s.id && r.status === 'Approved');
        const refundAmount = orderReturns.reduce((acc, r) => acc + r.refundAmount, 0);
        const returnCostRestored = orderReturns.filter(r => r.condition === 'Resellable').reduce((acc, r) => acc + (r.unitCost * r.quantity), 0);
        const netRev = s.totalAmount - refundAmount;
        const netCost = s.totalCost - returnCostRestored;
        const netProfit = netRev - netCost;
        return [s.date, s.id, s.customerName, s.totalAmount, refundAmount, netRev, netProfit, s.status];
      });
    } else if (activeTab === 'customers') {
      headers = ["ID", "Name", "Phone", "Tier", "Total Spent (BDT)", "Last Purchase"];
      rows = customers.map(c => [c.id, c.name, c.phone, c.tier, c.totalSpent, c.lastPurchaseDate]);
    } else if (activeTab === 'suppliers') {
      headers = ["ID", "Name", "Contact", "Email", "Phone", "Category", "Status"];
      rows = suppliers.map(s => [s.id, s.name, s.contactPerson, s.email, s.phone, s.category, s.status]);
    } else if (activeTab === 'expenses') {
      headers = ["ID", "Date", "Category", "Description", "Amount (BDT)", "Status"];
      rows = expenses.map(e => [e.id, e.date, e.category, e.description, e.amount, e.status]);
    } else if (activeTab === 'returns') {
      headers = ["RMA ID", "Date", "Order Ref", "Customer", "Product", "Reason", "Condition", "Status", "Refund Amount (BDT)"];
      rows = returns.map(r => [r.id, r.date, r.orderId, r.customerName, r.productName, r.reason, r.condition, r.status, r.refundAmount]);
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

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'Returned': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'Partially Returned': return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const renderTable = () => {
    let headers: string[] = [];
    let allData: any[] = [];
    let rows: React.ReactNode[] = [];

    if (activeTab === 'inventory') {
      headers = ["SKU", "Product/Variant", "Category (Edit)", "Supplier (Edit)", "Stock (Edit)", "Min Stock (Edit)", "Cost (Edit ৳)", "Price (Edit ৳)", "Asset Value (৳)"];
      allData = flattenedInventory;
    } else if (activeTab === 'sales') {
      headers = ["Order Ref", "Date", "Customer", "Items", "Total (৳)", "Status"];
      let filteredSales = sales.filter(s => s.id.includes(searchTerm) || s.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
      if (statusFilter !== 'All') filteredSales = filteredSales.filter(s => s.status === statusFilter);
      allData = filteredSales;
    } else if (activeTab === 'financials') {
      headers = ["Order Ref", "Date", "Customer", "Gross (৳)", "Refunds (৳)", "Net Revenue (৳)", "Realized Profit (৳)"];
      // Filter for realized orders
      const finalOrders = sales.filter(s => s.status === 'Delivered' || s.status === 'Partially Returned');
      allData = finalOrders.filter(s => s.id.includes(searchTerm) || s.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    } else if (activeTab === 'customers') {
      headers = ["Name", "Phone", "Tier", "Total Spent (৳)", "Last Purchase"];
      allData = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    } else if (activeTab === 'suppliers') {
      headers = ["Name", "Contact", "Email", "Category", "Status"];
      allData = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    } else if (activeTab === 'expenses') {
      headers = ["Date", "Category", "Description", "Amount (৳)", "Status"];
      allData = expenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase()));
    } else if (activeTab === 'returns') {
      headers = ["RMA ID", "Date", "Order Ref", "Product", "Reason", "Refund (৳)", "Status"];
      allData = returns.filter(r => r.orderId.includes(searchTerm) || r.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    const totalPages = Math.ceil(allData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = allData.slice(startIndex, startIndex + itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);

    if (activeTab === 'inventory') {
      const supplierOptions = suppliers.map(s => ({ id: s.id, label: s.name }));
      
      rows = (paginatedData as InventoryRow[]).map((row) => (
          <tr key={row.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 transition-colors">
            <Cell className="font-mono text-[10px]">{row.sku}</Cell>
            <Cell>
                <div className="flex items-center gap-2">
                    {row.type === 'variant' ? (
                        <>
                            <CornerDownRight size={12} className="text-slate-400 ml-2" />
                            <span className="text-slate-500 dark:text-slate-400">{row.parentName} - <span className="font-bold text-slate-800 dark:text-white">{row.name}</span></span>
                        </>
                    ) : (
                        <span className="font-bold text-slate-800 dark:text-white">{row.name}</span>
                    )}
                </div>
            </Cell>
            <EditableCell 
                 value={row.category} 
                 type="text" 
                 onSave={(val) => handleUpdateInventoryRow(row, 'category', val)} 
            />
            <EditableSelectCell 
                value={row.supplierId || ''} 
                options={supplierOptions}
                onSave={(val) => handleUpdateInventoryRow(row, 'supplierId', val)}
            />
            <EditableCell 
                value={row.stockLevel} 
                type="number" 
                onSave={(val) => handleUpdateInventoryRow(row, 'stockLevel', val)} 
            />
            <EditableCell 
                value={row.minStockLevel} 
                type="number" 
                onSave={(val) => handleUpdateInventoryRow(row, 'minStockLevel', val)} 
            />
            <EditableCell 
                value={row.costPrice} 
                type="number" 
                prefix="৳"
                onSave={(val) => handleUpdateInventoryRow(row, 'costPrice', val)} 
            />
            <EditableCell 
                value={row.sellingPrice} 
                type="number" 
                prefix="৳"
                onSave={(val) => handleUpdateInventoryRow(row, 'sellingPrice', val)} 
            />
            <Cell align="right" className="font-mono text-slate-400">{(row.stockLevel * row.costPrice).toLocaleString()}</Cell>
          </tr>
      ));
    } else if (activeTab === 'sales') {
      rows = paginatedData.map((s: Sale) => (
        <tr key={s.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <Cell>#{s.id.slice(-6)}</Cell>
          <Cell>{s.date}</Cell>
          <Cell>{s.customerName}</Cell>
          <Cell>{s.items.length} items</Cell>
          <Cell align="right">{s.totalAmount.toLocaleString()}</Cell>
          <Cell><span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border ${getStatusBadge(s.status)}`}>{s.status}</span></Cell>
        </tr>
      ));
    } else if (activeTab === 'financials') {
      rows = paginatedData.map((s: Sale) => {
        const orderReturns = returns.filter(r => r.orderId === s.id && r.status === 'Approved');
        const refundAmount = orderReturns.reduce((acc, r) => acc + r.refundAmount, 0);
        const returnCostRestored = orderReturns.filter(r => r.condition === 'Resellable').reduce((acc, r) => acc + (r.unitCost * r.quantity), 0);
        
        const netRev = s.totalAmount - refundAmount;
        const netCost = s.totalCost - returnCostRestored;
        const netProfit = netRev - netCost;

        return (
          <tr key={s.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 bg-emerald-50/10 dark:bg-emerald-900/5">
            <Cell className="font-mono text-indigo-500">#{s.id.slice(-6)}</Cell>
            <Cell>{s.date}</Cell>
            <Cell>{s.customerName}</Cell>
            <Cell align="right" className="text-slate-400">{s.totalAmount.toLocaleString()}</Cell>
            <Cell align="right" className="text-red-500">{refundAmount > 0 ? `(${refundAmount.toLocaleString()})` : '-'}</Cell>
            <Cell align="right" className="font-bold text-indigo-600 dark:text-indigo-400">{netRev.toLocaleString()}</Cell>
            <Cell align="right" className="font-bold text-emerald-600 dark:text-emerald-400">{netProfit.toLocaleString()}</Cell>
          </tr>
        );
      });
    } else if (activeTab === 'customers') {
      rows = paginatedData.map((c: Customer) => (
        <tr key={c.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <Cell>{c.name}</Cell>
          <Cell>{c.phone}</Cell>
          <Cell>{c.tier}</Cell>
          <Cell align="right">{c.totalSpent.toLocaleString()}</Cell>
          <Cell>{c.lastPurchaseDate}</Cell>
        </tr>
      ));
    } else if (activeTab === 'suppliers') {
      rows = paginatedData.map((s: Supplier) => (
        <tr key={s.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <Cell>{s.name}</Cell>
          <Cell>{s.contactPerson}</Cell>
          <Cell>{s.email}</Cell>
          <Cell>{s.category}</Cell>
          <Cell>{s.status}</Cell>
        </tr>
      ));
    } else if (activeTab === 'expenses') {
      rows = paginatedData.map((e: Expense) => (
        <tr key={e.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <Cell>{e.date}</Cell>
          <Cell>{e.category}</Cell>
          <Cell>{e.description}</Cell>
          <Cell align="right">{e.amount.toLocaleString()}</Cell>
          <Cell>{e.status}</Cell>
        </tr>
      ));
    } else if (activeTab === 'returns') {
      rows = paginatedData.map((r: Return) => (
        <tr key={r.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <Cell>#{r.id.slice(-6)}</Cell>
          <Cell>{r.date}</Cell>
          <Cell>#{r.orderId.slice(-6)}</Cell>
          <Cell>{r.productName}</Cell>
          <Cell>{r.reason}</Cell>
          <Cell align="right">{r.refundAmount.toLocaleString()}</Cell>
          <Cell><span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border ${getStatusBadge(r.status)}`}>{r.status}</span></Cell>
        </tr>
      ));
    }

    return (
      <div className="flex flex-col h-full">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex-1 overflow-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="border-b border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 shadow-sm">
                  {/* Excel-like letter headers */}
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    {headers.map((_, i) => (
                      <th key={`col-${i}`} className="px-4 py-1 text-[9px] font-mono text-center text-slate-400 border-r border-slate-200 dark:border-slate-700">
                        {String.fromCharCode(65 + i)}
                      </th>
                    ))}
                  </tr>
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
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
           <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
             Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, allData.length)} of {allData.length} records
           </span>
           <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600 dark:text-slate-300" />
              </button>
              <span className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Page {currentPage} of {Math.max(1, totalPages)}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600 dark:text-slate-300" />
              </button>
           </div>
        </div>
      </div>
    );
  };

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button 
      onClick={() => { setActiveTab(id); setCurrentPage(1); }}
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
          {activeTab === 'sales' && (
            <div className="relative min-w-[140px]">
              <select 
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {['All', 'Pending', 'Confirmed', 'Delivered', 'Returned', 'Partially Returned', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          )}
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               placeholder="Filter grid data..."
               value={searchTerm}
               onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
             />
          </div>
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Download size={16} /> Export Master Sheet
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto">
        <TabButton id="inventory" label="Inventory Stock" icon={Package} />
        <TabButton id="sales" label="Sales Orders" icon={ShoppingCart} />
        <TabButton id="financials" label="Financials" icon={BookOpenCheck} />
        <TabButton id="customers" label="Customer CRM" icon={Users} />
        <TabButton id="suppliers" label="Supply Chain" icon={Truck} />
        <TabButton id="expenses" label="Expenses" icon={FileSpreadsheet} />
        <TabButton id="returns" label="Returns (RMA)" icon={RotateCcw} />
      </div>

      <div className="flex-1 overflow-hidden min-h-0 rounded-lg shadow-inner bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
        {activeTab === 'inventory' && (
          <div className="absolute top-2 right-4 z-20 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200 opacity-80 pointer-events-none font-bold">
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
