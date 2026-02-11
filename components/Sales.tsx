
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sale, Product, Customer, SaleItem, ProductVariant, Return } from '../types';
import { 
  Plus, Trash2, X, ShoppingCart, Package, Minus, ShoppingBag, 
  Hash, User, Filter, CheckCircle2, Clock, Ban, ChevronLeft, 
  ChevronRight, Truck, Calendar, Printer, MapPin, ChevronDown, 
  Award, RotateCcw, Edit, CreditCard, DollarSign, Phone, Check, 
  Download, Search, AlertTriangle, Save
} from 'lucide-react';

interface SalesProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  onAddSale: (sale: Sale) => void;
  onUpdateSale: (sale: Sale) => void;
  onDeleteSale: (id: string) => void;
  onAddCustomer: (customer: Customer) => void;
  companyProfile: { name: string; address: string; phone: string; email: string; footerMessage?: string; terms?: string };
  notify?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRequestReturn?: (saleId: string) => void;
  returns?: Return[];
}

const CATEGORIES = [
  'All', 'Furniture', 'Lighting', 'Textiles', 'Showpiece', 
  'Wall Decor', 'Kitchenware', 'Garden', 'Accessories'
];

const EDITABLE_STATUSES = ['Pending', 'Confirmed', 'Delivered', 'Cancelled', 'Returned', 'Partially Returned'];
const FILTER_STATUSES = ['All', 'Pending', 'Confirmed', 'Delivered', 'Returned', 'Partially Returned', 'Cancelled'];

const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

interface PosProductCardProps {
  product: Product;
  onAdd: (product: Product, variant?: ProductVariant, qty?: number) => void;
  cartItems: SaleItem[];
}

const PosProductCard: React.FC<PosProductCardProps> = ({ product, onAdd, cartItems }) => {
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) return { label: 'Sold Out', color: 'text-red-500 bg-red-50 dark:bg-red-500/10' };
    if (stock <= minStock) return { label: 'Low', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' };
    return { label: `${stock} Stock`, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
  };

  const getItemCount = (variantId?: string) => {
    const item = cartItems.find(i => i.productId === product.id && i.variantId === variantId);
    return item ? item.quantity : 0;
  };

  const displayPrice = product.hasVariants && product.variants?.length 
    ? Math.min(...product.variants.map(v => v.sellingPrice)) 
    : product.sellingPrice;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col h-full shadow-sm group hover:border-indigo-500/50">
      <div className="flex justify-between items-start mb-3">
         <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
           {product.image ? (
             <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
           ) : (
             <Package size={20} className="text-slate-400" />
           )}
         </div>
         <div className="text-right">
            <p className="font-bold text-indigo-600 dark:text-indigo-400">৳{displayPrice.toLocaleString()}</p>
         </div>
      </div>
      
      <div className="flex-1 mb-4">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight line-clamp-2" title={product.name}>{product.name}</h4>
        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">{product.sku}</p>
      </div>

      {!product.hasVariants ? (
        <div className="space-y-3 mt-auto">
           <div className={`text-[9px] font-black uppercase px-2 py-1 rounded w-fit ${getStockStatus(product.stockLevel, product.minStockLevel || 5).color}`}>
             {getStockStatus(product.stockLevel, product.minStockLevel || 5).label}
           </div>
           <button 
             onClick={() => onAdd(product)}
             disabled={product.stockLevel <= 0}
             className="w-full py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-xs active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-500"
           >
             {getItemCount() > 0 ? (
               <><div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[9px]">{getItemCount()}</div> Add More</>
             ) : (
               <><Plus size={14}/> Add to Bag</>
             )}
           </button>
        </div>
      ) : (
        <div className="space-y-2 mt-auto">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Options</p>
          <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
            {product.variants?.map(v => (
              <div key={v.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                 <div className="min-w-0 flex-1">
                   <p className="font-bold truncate">{v.name}</p>
                   <p className="text-[9px] text-slate-500">{v.stockLevel} In Shop</p>
                 </div>
                 <button 
                   onClick={() => onAdd(product, v)}
                   disabled={v.stockLevel <= 0}
                   className="p-2 bg-white dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-lg border border-slate-200 dark:border-slate-600 transition-colors disabled:opacity-30"
                 >
                   <Plus size={14}/>
                 </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Sales: React.FC<SalesProps> = ({ 
  sales, products, customers, onAddSale, onUpdateSale, onDeleteSale, onAddCustomer,
  companyProfile, notify, returns
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  
  const [newSale, setNewSale] = useState<Partial<Sale>>({
    date: getLocalDate(), customerId: '', items: [], discountAmount: 0, deliveryCharge: 0, notes: '', status: 'Pending', paymentMethod: 'Cash'
  });

  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === newSale.customerId), 
    [customers, newSale.customerId]
  );

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchStatus = selectedStatusFilter === 'All' ? true : s.status === selectedStatusFilter;
      const matchDate = selectedDateFilter ? s.date.startsWith(selectedDateFilter) : true;
      const matchSearch = ledgerSearch ? 
        s.customerName.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
        s.id.toLowerCase().includes(ledgerSearch.toLowerCase()) : true;
      return matchStatus && matchDate && matchSearch;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, selectedStatusFilter, selectedDateFilter, ledgerSearch]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'All' ? true : p.category === selectedCategory;
      const matchSearch = productSearch ? 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
        p.sku?.toLowerCase().includes(productSearch.toLowerCase()) : true;
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, productSearch]);

  const currentSubtotal = newSale.items?.reduce((a, b) => a + b.total, 0) || 0;
  const currentTotal = Math.max(0, currentSubtotal - (newSale.discountAmount || 0) + (newSale.deliveryCharge || 0));

  const addItemToSale = (product: Product, variant?: ProductVariant, qty: number = 1) => {
    const items = [...(newSale.items || [])] as SaleItem[];
    const existingIndex = items.findIndex(i => i.productId === product.id && (variant ? i.variantId === variant.id : !i.variantId));

    const currentStock = variant ? variant.stockLevel : product.stockLevel;
    const itemInCart = items.find(i => i.productId === product.id && (variant ? i.variantId === variant.id : !i.variantId));
    const currentQtyInCart = itemInCart?.quantity || 0;
    
    // Warn if stock exceeded but don't block adding (allows overrides/pre-orders)
    if (qty > 0 && currentQtyInCart + qty > currentStock && !editingSaleId) {
      if (notify) notify(`Warning: Shop stock limit (${currentStock}) exceeded.`, 'info');
    }

    if (existingIndex > -1) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + qty;
      if (newQty <= 0) items.splice(existingIndex, 1);
      else items[existingIndex] = { ...existing, quantity: newQty, total: existing.unitPrice * newQty };
    } else if (qty > 0) {
      const price = variant ? variant.sellingPrice : product.sellingPrice;
      const cost = variant ? variant.costPrice : product.costPrice;
      items.push({
        productId: product.id, productName: product.name, variantId: variant?.id,
        variantName: variant?.name, quantity: qty, unitPrice: price, unitCost: cost, total: price * qty
      });
    }
    setNewSale({ ...newSale, items });
  };

  const handleSubmit = () => {
    if (!newSale.customerId || !newSale.items?.length) return;
    
    const saleItems = newSale.items as SaleItem[];
    const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
    const total = Math.max(0, subtotal - (newSale.discountAmount || 0) + (newSale.deliveryCharge || 0));
    const cost = saleItems.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
    
    const finalSaleData: Sale = {
      id: editingSaleId || Date.now().toString(), 
      date: newSale.date || getLocalDate(),
      customerId: newSale.customerId!, 
      customerName: selectedCustomer?.name || 'Unknown',
      items: saleItems, 
      discountAmount: newSale.discountAmount || 0,
      deliveryCharge: newSale.deliveryCharge || 0,
      totalAmount: total, 
      totalCost: cost, 
      profit: total - cost,
      notes: newSale.notes || '', 
      status: (newSale.status as any),
      paymentMethod: newSale.paymentMethod || 'Cash'
    };

    if (editingSaleId) {
        onUpdateSale(finalSaleData);
        if(notify) notify('Order updated successfully', 'success');
    } else {
        onAddSale(finalSaleData);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setNewSale({
      date: sale.date,
      customerId: sale.customerId,
      items: JSON.parse(JSON.stringify(sale.items)),
      discountAmount: sale.discountAmount,
      deliveryCharge: sale.deliveryCharge,
      notes: sale.notes || '',
      status: sale.status,
      paymentMethod: sale.paymentMethod
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setNewSale({ date: getLocalDate(), customerId: '', items: [], discountAmount: 0, deliveryCharge: 0, notes: '', status: 'Pending', paymentMethod: 'Cash' });
    setEditingSaleId(null);
    setMobileTab('catalog');
  };

  const handlePrintInvoice = (order: Sale) => {
    const html = `<html><head><title>Invoice</title><style>body { font-family: sans-serif; padding: 20px; font-size: 12px; } table { width: 100%; border-collapse: collapse; } th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; } .total { text-align: right; font-weight: bold; padding-top: 10px; font-size: 14px; }</style></head><body><h2>${companyProfile.name}</h2><p>Invoice #${order.id.slice(-6)} - ${new Date(order.date).toLocaleDateString()}</p><p>Customer: ${order.customerName}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>${order.items.map(i=>`<tr><td>${i.productName}</td><td>${i.quantity}</td><td>৳${i.total}</td></tr>`).join('')}</tbody></table><div class="total">Grand Total: ৳${order.totalAmount}</div><p style="text-align:center; margin-top:30px;">${companyProfile.footerMessage}</p><script>window.onload=function(){window.print()}</script></body></html>`;
    const printWin = window.open('', '_blank');
    if(printWin) { printWin.document.write(html); printWin.document.close(); }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Orders</h2>
          <p className="text-slate-500 text-sm">Sale registry and POS terminal.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full md:w-auto h-12 px-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 shadow-xl font-bold active:scale-95 transition-all hover:bg-indigo-700">
          <Plus size={18} /> New POS Sale
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="w-full pl-12 pr-4 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm font-medium" placeholder="Search orders..." value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} />
        </div>
        <select className="h-14 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-xs font-bold" value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)}>
          {FILTER_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 responsive-table-container">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-center">Status (Quick Edit)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group" onClick={() => handleEditSale(sale)}>
                <td className="px-6 py-4">
                    <p className="font-bold">#{sale.id.slice(-6)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{sale.date}</p>
                </td>
                <td className="px-6 py-4"><p className="font-bold">{sale.customerName}</p></td>
                <td className="px-6 py-4 text-right font-bold font-mono">৳{sale.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <select 
                        value={sale.status}
                        onChange={(e) => onUpdateSale({...sale, status: e.target.value as any})}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer appearance-none text-center hover:opacity-80 transition-all ${getStatusStyle(sale.status)}`}
                    >
                        {EDITABLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => { e.stopPropagation(); handleEditSale(sale); }} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg" title="Edit Order"><Edit size={16}/></button>
                     <button onClick={(e) => { e.stopPropagation(); handlePrintInvoice(sale); }} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg" title="Print Invoice"><Printer size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-2 md:p-4">
          <div className="bg-slate-100 dark:bg-slate-900 w-full h-full max-w-[1400px] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="md:hidden flex p-4 pb-0 gap-2 shrink-0">
              <button onClick={() => setMobileTab('catalog')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-t-2xl transition-all ${mobileTab === 'catalog' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Items</button>
              <button onClick={() => setMobileTab('cart')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-t-2xl transition-all flex justify-center gap-2 ${mobileTab === 'cart' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Checkout ({newSale.items?.length})</button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
              <div className={`w-full md:w-2/3 flex flex-col h-full bg-white dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800 ${mobileTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">Catalog</h3>
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input className="pl-9 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs w-48 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Search..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === c ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{c}</button>
                      ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(p => <PosProductCard key={p.id} product={p} onAdd={addItemToSale} cartItems={newSale.items || []} />)}
                </div>
              </div>

              <div className={`w-full md:w-1/3 flex flex-col h-full bg-white dark:bg-slate-900 shadow-xl ${mobileTab === 'catalog' ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold">{editingSaleId ? 'Edit Order' : 'New Order'}</h3>
                        {editingSaleId && <p className="text-[10px] text-slate-400 font-mono">#{editingSaleId.slice(-6)}</p>}
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={24}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="space-y-4">
                      {/* Order Config Section */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 block mb-1">Date</label>
                              <input type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold" value={newSale.date} onChange={e => setNewSale({...newSale, date: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 block mb-1">Status</label>
                              <select 
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none" 
                                value={newSale.status} 
                                onChange={e => setNewSale({...newSale, status: e.target.value as any})}
                              >
                                {EDITABLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Selection</label>
                          <select className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none appearance-none" value={newSale.customerId} onChange={e => setNewSale({...newSale, customerId: e.target.value})}>
                            <option value="">-- Choose Customer --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="space-y-3 pt-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cart Summary</label>
                      {newSale.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex-1">
                            <p className="font-bold text-xs truncate">{item.productName}</p>
                            <p className="text-[10px] text-indigo-500 font-bold uppercase">{item.variantName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <button onClick={() => addItemToSale(products.find(p=>p.id===item.productId)!, item.variantId ? products.find(p=>p.id===item.productId)!.variants?.find(v=>v.id===item.variantId) : undefined, -1)} className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600"><Minus size={12}/></button>
                             <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                             <button onClick={() => addItemToSale(products.find(p=>p.id===item.productId)!, item.variantId ? products.find(p=>p.id===item.productId)!.variants?.find(v=>v.id===item.variantId) : undefined, 1)} className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600"><Plus size={12}/></button>
                          </div>
                        </div>
                      ))}
                      {newSale.items?.length === 0 && <p className="text-center text-slate-400 py-10 text-xs italic">No items in cart.</p>}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-slate-500 text-xs"><span>Order Total</span><span className="font-bold">৳{currentSubtotal.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center text-xs font-black uppercase text-indigo-600 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <span>Final Amount</span>
                            <span className="text-2xl font-serif">৳{currentTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <button onClick={handleSubmit} disabled={!newSale.customerId || !newSale.items?.length} className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all disabled:opacity-30 hover:bg-indigo-700 flex items-center justify-center gap-3">
                        <Save size={18} />
                        {editingSaleId ? 'Update Order' : 'Confirm Sale'}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
