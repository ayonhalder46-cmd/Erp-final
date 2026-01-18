
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sale, Product, Customer, SaleItem, ProductVariant } from './types';
import { 
  Plus, Trash2, X, Undo2, Redo2, 
  Search, ShoppingCart, Package, ArrowRight, Layers, 
  Minus, ShoppingBag, Tag, AlertTriangle, Hash, User,
  Filter, Eye, CheckCircle2, Clock, Ban, ChevronLeft, ChevronRight, Truck, Calendar, Printer, RefreshCw, MapPin, ChevronDown, Award, Wallet, RotateCcw, Edit
} from 'lucide-react';

interface SalesProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  onAddSale: (sale: Sale) => void;
  onUpdateSale: (sale: Sale) => void;
  onDeleteSale: (id: string) => void;
  onAddCustomer: (customer: Customer) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCommit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  companyProfile: { name: string; address: string; phone: string; email: string };
}

const CATEGORIES = [
  'All', 'Furniture', 'Lighting', 'Textiles', 'Showpiece', 
  'Wall Decor', 'Kitchenware', 'Garden', 'Accessories'
];

// Aligned strictly with Google Sheets "STATUS_OPTIONS"
const ORDER_STATUSES = ['All', 'Pending', 'Confirmed', 'Delivered', 'Returned', 'Cancelled'];

// Helper for local date
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
    if (stock <= 0) return { label: 'Out of Stock', color: 'text-red-500 bg-red-50 dark:bg-red-500/10' };
    if (stock <= minStock) return { label: 'Low Stock', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' };
    return { label: `${stock} In Stock`, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
  };

  const getItemCount = (variantId?: string) => {
    const item = cartItems.find(i => i.productId === product.id && i.variantId === variantId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group flex flex-col h-full shadow-sm hover:shadow-lg">
      <div className="flex justify-between items-start mb-3">
         <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
           {product.image ? (
             <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
           ) : (
             <Package size={20} className="text-slate-400" />
           )}
         </div>
         <div className="text-right">
            <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
               ৳{product.hasVariants 
                 ? Math.min(...(product.variants?.map(v => v.sellingPrice) || [0])).toLocaleString() 
                 : product.sellingPrice.toLocaleString()}
            </p>
         </div>
      </div>
      
      <div className="flex-1 mb-4">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight line-clamp-2" title={product.name}>{product.name}</h4>
        <p className="text-[10px] text-slate-400 font-mono mt-1">{product.sku}</p>
      </div>

      {!product.hasVariants ? (
        <div className="space-y-3 mt-auto">
           <div className={`text-[10px] font-bold px-2 py-1 rounded w-fit ${getStockStatus(product.stockLevel, product.minStockLevel || 5).color}`}>
             {getStockStatus(product.stockLevel, product.minStockLevel || 5).label}
           </div>
           <button 
             onClick={() => onAdd(product)}
             disabled={product.stockLevel <= 0}
             className="w-full py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
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
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Variants</p>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
            {product.variants?.map(v => (
              <div key={v.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                 <div className="min-w-0 flex-1 mr-2">
                   <p className="font-bold truncate" title={v.name}>{v.name}</p>
                   <p className="text-[9px] text-slate-500">Stock: {v.stockLevel}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   {getItemCount(v.id) > 0 && (
                     <span className="text-[9px] font-bold text-indigo-500">{getItemCount(v.id)} in cart</span>
                   )}
                   <button 
                     onClick={() => onAdd(product, v)}
                     disabled={v.stockLevel <= 0}
                     className="p-1.5 bg-white dark:bg-slate-700 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors disabled:opacity-30"
                   >
                     <Plus size={12}/>
                   </button>
                 </div>
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
  onUndo, onRedo, canUndo, canRedo, companyProfile
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [saleToDeleteId, setSaleToDeleteId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [newSale, setNewSale] = useState<Partial<Sale>>({
    date: getLocalDate(),
    customerId: '',
    items: [],
    discountAmount: 0,
    deliveryCharge: 0,
    notes: '',
    status: 'Confirmed'
  });

  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  const [quickCustomer, setQuickCustomer] = useState<Partial<Customer>>({
    name: '', address: '', phone: '', tier: 'Bronze', totalSpent: 0, lastPurchaseDate: 'N/A'
  });

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === newSale.customerId), 
    [customers, newSale.customerId]
  );

  // Derive VIP Stats like in the GAS "New_Order" Sheet logic
  const vipStats = useMemo(() => {
    if (!selectedCustomer) return null;
    const orderCount = sales.filter(s => s.customerId === selectedCustomer.id && s.status !== 'Cancelled').length;
    return { count: orderCount, total: selectedCustomer.totalSpent };
  }, [selectedCustomer, sales]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'All' ? true : p.category === selectedCategory;
      const matchSearch = productSearch ? 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
        p.sku?.toLowerCase().includes(productSearch.toLowerCase()) : true;
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, productSearch]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchStatus = selectedStatusFilter === 'All' ? true : s.status === selectedStatusFilter;
      const matchDate = selectedDateFilter ? s.date.startsWith(selectedDateFilter) : true;
      const matchSearch = ledgerSearch ? 
        s.customerName.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
        s.id.toLowerCase().includes(ledgerSearch.toLowerCase()) : true;
      return matchStatus && matchDate && matchSearch;
    });
  }, [sales, selectedStatusFilter, selectedDateFilter, ledgerSearch]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomer.name || !quickCustomer.phone) return;
    const newId = Date.now().toString();
    onAddCustomer({ ...quickCustomer as Customer, id: newId });
    setNewSale({ ...newSale, customerId: newId });
    setCustomerSearch(quickCustomer.name!);
    setIsQuickAddOpen(false);
    setQuickCustomer({ name: '', address: '', phone: '', tier: 'Bronze', totalSpent: 0, lastPurchaseDate: 'N/A' });
  };

  const removeItemFromSale = (productId: string, variantId?: string) => {
    const items = (newSale.items || []).filter(i => 
      !(i.productId === productId && (variantId ? i.variantId === variantId : !i.variantId))
    );
    setNewSale({ ...newSale, items });
  };

  const addItemToSale = (product: Product, variant?: ProductVariant, qty: number = 1) => {
    const items = [...(newSale.items || [])] as SaleItem[];
    const existingIndex = items.findIndex(i => i.productId === product.id && (variant ? i.variantId === variant.id : !i.variantId));

    // Calculate maximum available stock
    const currentStock = variant ? variant.stockLevel : product.stockLevel;
    const itemInCart = items.find(i => i.productId === product.id && (variant ? i.variantId === variant.id : !i.variantId));
    const currentQtyInCart = itemInCart?.quantity || 0;
    
    // Only verify stock limit when adding items (qty > 0)
    // Note: When editing an existing order, the logic handles restoration, so we allow "re-adding" own items implicitly.
    if (qty > 0 && currentQtyInCart + qty > currentStock && !editingSaleId) {
      alert(`Cannot add more items. Max stock available: ${currentStock}`);
      return;
    }

    if (existingIndex > -1) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + qty;
      if (newQty <= 0) {
        items.splice(existingIndex, 1);
      } else {
        items[existingIndex] = { ...existing, quantity: newQty, total: existing.unitPrice * newQty };
      }
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

    // Strict Stock Check before submission if status is Confirmed/Delivered
    if (!editingSaleId && (newSale.status === 'Confirmed' || newSale.status === 'Delivered')) {
      for (const item of newSale.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          let currentStock = product.stockLevel;
          if (product.hasVariants && item.variantId) {
             const v = product.variants?.find(v => v.id === item.variantId);
             currentStock = v ? v.stockLevel : 0;
          }
          if (currentStock < item.quantity) {
             alert(`Validation Failed: Insufficient stock for ${item.productName}. \nAvailable: ${currentStock}, Requested: ${item.quantity}`);
             return; 
          }
        }
      }
    }

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
      status: (newSale.status as any) || 'Confirmed' // Default to Confirmed for POS (deducts stock)
    };

    if (editingSaleId) {
      onUpdateSale(finalSaleData);
    } else {
      onAddSale(finalSaleData);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewSale({ date: getLocalDate(), customerId: '', items: [], discountAmount: 0, deliveryCharge: 0, notes: '', status: 'Confirmed' });
    setCustomerSearch('');
    setEditingSaleId(null);
  };

  const handleEditOrder = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setNewSale({
      ...sale,
      items: [...sale.items] // Clone items
    });
    setCustomerSearch(sale.customerName);
    setSelectedOrder(null); // Close details modal
    setIsModalOpen(true); // Open POS modal
  };

  const handleStatusChange = (sale: Sale, newStatus: Sale['status']) => {
    if (sale.status !== newStatus) {
        const updatedSale = { ...sale, status: newStatus };
        onUpdateSale(updatedSale);
        if (selectedOrder && selectedOrder.id === sale.id) {
            setSelectedOrder(updatedSale);
        }
    }
  };

  const handlePrintInvoice = (order: Sale) => {
    const customer = customers.find(c => c.id === order.customerId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Invoice #${order.id.slice(-6)}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.5; }
            .header-container { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 40px; }
            .company-info h1 { margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; color: #000; }
            .company-info p { margin: 2px 0; font-size: 12px; color: #666; }
            .invoice-details { text-align: right; }
            .invoice-details h2 { margin: 0 0 5px; font-size: 16px; text-transform: uppercase; color: #666; }
            .invoice-details p { margin: 0; font-weight: bold; font-size: 14px; }
            
            .bill-to { margin-bottom: 30px; }
            .bill-to h3 { font-size: 12px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 5px; }
            .bill-to p { margin: 0; font-weight: bold; font-size: 16px; }
            .bill-to .address { font-weight: normal; font-size: 14px; color: #555; margin-top: 4px; max-width: 300px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            thead th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #eee; text-transform: uppercase; font-size: 11px; color: #666; }
            tbody td { padding: 12px 8px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
            
            .totals { display: flex; justify-content: flex-end; }
            .totals-box { width: 250px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .grand-total { border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 18px; }
            
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="company-info">
              <h1>${companyProfile.name}</h1>
              <p>${companyProfile.address}</p>
              <p>${companyProfile.phone} | ${companyProfile.email}</p>
            </div>
            <div class="invoice-details">
              <h2>Invoice / Receipt</h2>
              <p>#${order.id.slice(-6)}</p>
              <p style="font-weight: normal; font-size: 12px; margin-top: 4px;">${new Date(order.date).toLocaleDateString()}</p>
              <p style="font-weight: normal; font-size: 12px; margin-top: 2px; text-transform: uppercase;">Status: ${order.status}</p>
            </div>
          </div>

          <div class="bill-to">
            <h3>Billed To</h3>
            <p>${order.customerName}</p>
            ${customer ? `<div class="address">${customer.address || ''}<br>${customer.phone || ''}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th width="50%">Item Description</th>
                <th width="10%">Qty</th>
                <th width="20%" class="text-right">Unit Price</th>
                <th width="20%" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    <strong>${item.productName}</strong>
                    ${item.variantName ? `<br><span style="font-size: 11px; color: #888;">${item.variantName}</span>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td class="text-right">৳${item.unitPrice.toLocaleString()}</td>
                  <td class="text-right">৳${item.total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
             <div class="totals-box">
               <div class="row">
                 <span style="color: #666;">Subtotal</span>
                 <span>৳${(order.items.reduce((a,b)=>a+b.total,0)).toLocaleString()}</span>
               </div>
               ${order.discountAmount > 0 ? `
               <div class="row" style="color: #ef4444;">
                 <span>Discount</span>
                 <span>-৳${order.discountAmount.toLocaleString()}</span>
               </div>` : ''}
               ${order.deliveryCharge > 0 ? `
               <div class="row">
                 <span style="color: #666;">Delivery</span>
                 <span>+৳${order.deliveryCharge.toLocaleString()}</span>
               </div>` : ''}
               <div class="row grand-total">
                 <span>Total</span>
                 <span>৳${order.totalAmount.toLocaleString()}</span>
               </div>
             </div>
          </div>

          <div class="footer">
            <p>Thank you for your business.</p>
            <p>Goods sold are subject to return policy. Please keep this receipt.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const currentSubtotal = newSale.items?.reduce((a, b) => a + b.total, 0) || 0;
  const currentTotal = Math.max(0, currentSubtotal - (newSale.discountAmount || 0) + (newSale.deliveryCharge || 0));

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'Returned': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Confirmed': return <CheckCircle2 size={10} />;
      case 'Delivered': return <Truck size={10} />;
      case 'Pending': return <Clock size={10} />;
      case 'Returned': return <RotateCcw size={10} />;
      case 'Cancelled': return <Ban size={10} />;
      default: return null;
    }
  };

  const getOrderCustomer = (orderId: string, customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  return (
    <div className="space-y-6">
      {/* Ledger Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Orders</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Full transaction history and POS terminal.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button onClick={onUndo} disabled={!canUndo} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><Undo2 size={18}/></button>
            <div className="w-[1px] bg-slate-100 dark:bg-slate-800 mx-1" />
            <button onClick={onRedo} disabled={!canRedo} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><Redo2 size={18}/></button>
          </div>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl font-bold active:scale-95">
            <Plus size={18} /> POS Terminal
          </button>
        </div>
      </div>

      {/* Ledger Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white font-medium transition-all text-sm shadow-sm"
            placeholder="Search orders by client name or ID..."
            value={ledgerSearch}
            onChange={(e) => setLedgerSearch(e.target.value)}
          />
        </div>
        
        {/* Date Filter */}
        <div className="relative group">
          <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="date"
            className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white font-medium transition-all text-sm shadow-sm cursor-pointer"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
          />
          {selectedDateFilter && (
            <button onClick={() => setSelectedDateFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500">
               <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          {ORDER_STATUSES.map(status => (
            <button 
              key={status} 
              onClick={() => setSelectedStatusFilter(status)}
              className={`px-6 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${selectedStatusFilter === status ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400'}`}
            >
              {status === 'All' ? <Filter size={12} /> : getStatusIcon(status)}
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">ID</th>
                <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Date</th>
                <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Client</th>
                <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">Total</th>
                <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedSales.map((sale) => (
                <tr 
                  key={sale.id} 
                  onClick={() => setSelectedOrder(sale)} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6 font-mono text-slate-400 text-xs">#{sale.id.slice(-6)}</td>
                  <td className="px-8 py-6 text-slate-600 dark:text-slate-300 font-bold">{formatDate(sale.date)}</td>
                  <td className="px-8 py-6 font-bold text-slate-900 dark:text-white">{sale.customerName}</td>
                  <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                    <div className="relative group/status inline-block">
                        <select
                            value={sale.status}
                            onChange={(e) => handleStatusChange(sale, e.target.value as any)}
                            disabled={sale.status === 'Returned' || sale.status === 'Cancelled'}
                            className={`appearance-none pl-8 pr-8 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border outline-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all ${getStatusStyle(sale.status)} ${(sale.status === 'Returned' || sale.status === 'Cancelled') ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Returned">Returned</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {getStatusIcon(sale.status)}
                        </div>
                        {!(sale.status === 'Returned' || sale.status === 'Cancelled') && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                <ChevronDown size={10} />
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-mono font-bold text-slate-900 dark:text-white tracking-tighter">৳{sale.totalAmount.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedOrder(sale)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl"><Eye size={18} /></button>
                      <button onClick={() => setSaleToDeleteId(sale.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">No orders found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border rounded-xl disabled:opacity-20"><ChevronLeft size={16}/></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border rounded-xl disabled:opacity-20"><ChevronRight size={16}/></button>
            </div>
          </div>
        )}
      </div>

      {/* POS TERMINAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 overflow-hidden animate-in fade-in duration-300">
          <div className="w-full h-full md:max-w-[1580px] bg-white dark:bg-slate-900 md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10">
            
            {/* Catalog Side (Left) */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-slate-950/20 relative">
              
              {/* Header Controls */}
              <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-4">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">POS Terminal</h3>
                        {editingSaleId && <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Editing Order #{editingSaleId.slice(-6)}</p>}
                      </div>
                   </div>
                   <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-full transition-all"><X size={18}/></button>
                </div>

                {/* Client Selection */}
                <div className="w-full max-w-lg">
                   {selectedCustomer ? (
                     <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/20 animate-in slide-in-from-left-4">
                            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                            {selectedCustomer.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white text-[11px] truncate uppercase">{selectedCustomer.name}</h4>
                            <p className="text-[8px] font-black uppercase text-indigo-500">{selectedCustomer.tier} Partner</p>
                            </div>
                            <button onClick={() => { setNewSale({...newSale, customerId: ''}); setCustomerSearch(''); }} className="text-slate-400 hover:text-red-500 p-1.5 transition-colors"><X size={14}/></button>
                        </div>
                     </div>
                   ) : (
                     <div className="p-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-between opacity-80">
                        <div className="flex items-center gap-2">
                           <User size={14} className="text-slate-400" />
                           <p className="text-[9px] font-black uppercase text-slate-400">Select Client</p>
                        </div>
                        <button onClick={() => setIsQuickAddOpen(true)} className="text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest hover:underline">New Account</button>
                     </div>
                   )}
                </div>

                {/* Search / Filters Row */}
                <div className="flex flex-col md:flex-row gap-3">
                   <div className="flex-1 relative" ref={customerDropdownRef}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white font-bold transition-all text-xs"
                        placeholder="Search Client..."
                        value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); }}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                      />
                      {isCustomerDropdownOpen && filteredCustomers.length > 0 && (
                        <div className="absolute top-[110%] left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[150] overflow-hidden max-h-60 overflow-y-auto">
                          {filteredCustomers.map(c => (
                            <button key={c.id} className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors flex justify-between items-center" onClick={() => { setNewSale({...newSale, customerId: c.id}); setCustomerSearch(c.name); setIsCustomerDropdownOpen(false); }}>
                               <div className="min-w-0">
                                 <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{c.name}</p>
                                 <p className="text-[10px] text-slate-400">{c.phone}</p>
                               </div>
                               <span className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase bg-slate-100 text-slate-500">{c.tier}</span>
                            </button>
                          ))}
                        </div>
                      )}
                   </div>
                   <div className="flex-1 relative group">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        className="w-full pl-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white font-bold transition-all text-xs"
                        placeholder="Filter Products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                   </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)} 
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase border transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-indigo-400'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50/20 dark:bg-slate-950/10">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 pb-10">
                   {filteredProducts.map(p => (
                     <PosProductCard key={p.id} product={p} onAdd={addItemToSale} cartItems={newSale.items || []} />
                   ))}
                 </div>
              </div>
            </div>

            {/* Bag Sidebar */}
            <div className="w-full md:w-[460px] shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col relative z-30 shadow-2xl">
              
              {/* Header */}
              <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-2">
                    <ShoppingBag size={18} className="text-indigo-600" />
                    <h4 className="text-lg font-serif font-bold text-slate-900 dark:text-white">Bag Items</h4>
                 </div>
                 <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[9px] font-black uppercase text-slate-600 dark:text-slate-400">
                    {newSale.items?.reduce((a, b) => a + b.quantity, 0) || 0} Units
                 </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
                 {newSale.items?.map((item, idx) => (
                   <div key={`${item.productId}-${item.variantId}-${idx}`} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-200 group relative">
                     <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                       {item.quantity}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h5 className="font-bold text-slate-900 dark:text-white text-[10px] truncate uppercase leading-tight">{item.productName}</h5>
                       {item.variantName && <p className="text-[7px] font-black text-indigo-500 uppercase mt-0.5">{item.variantName}</p>}
                       <p className="text-[9px] font-bold text-slate-400 mt-1 font-mono">৳{item.unitPrice.toLocaleString()}</p>
                     </div>
                     <div className="text-right flex flex-col items-end gap-2 shrink-0">
                       <p className="font-mono font-black text-slate-900 dark:text-white text-xs tracking-tighter">৳{item.total.toLocaleString()}</p>
                       <div className="flex items-center gap-1">
                          <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors">
                             <button onClick={() => addItemToSale(products.find(p => p.id === item.productId)!, item.variantId ? {id: item.variantId} as any : undefined, -1)} className="p-0.5 text-slate-500 hover:text-indigo-600"><Minus size={10}/></button>
                             <div className="w-[1px] h-2 bg-slate-200 dark:bg-slate-600 mx-0.5" />
                             <button onClick={() => addItemToSale(products.find(p => p.id === item.productId)!, item.variantId ? {id: item.variantId} as any : undefined, 1)} className="p-0.5 text-slate-500 hover:text-indigo-600"><Plus size={10}/></button>
                          </div>
                          <button onClick={() => removeItemFromSale(item.productId, item.variantId)} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg transition-all border border-red-100 dark:border-red-900/20"><Trash2 size={12}/></button>
                       </div>
                     </div>
                   </div>
                 ))}
                 {(!newSale.items || newSale.items.length === 0) && (
                   <div className="h-full flex flex-col items-center justify-center opacity-10 py-16 pointer-events-none text-center">
                     <ShoppingBag size={56} />
                     <p className="font-serif italic text-lg mt-2">No Items</p>
                   </div>
                 )}
              </div>

              {/* Calculations */}
              <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4 shrink-0">
                <div className="space-y-2">
                   <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                     <span>Subtotal</span>
                     <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">৳{currentSubtotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-1.5 text-red-500">
                       <Tag size={12}/>
                       <span className="text-[9px] font-black uppercase">Discount</span>
                     </div>
                     <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-red-500 opacity-60">৳</span>
                        <input 
                          type="number" 
                          className="w-24 pl-5 pr-2 py-1 bg-red-50/50 dark:bg-red-500/5 text-red-600 font-mono font-bold text-xs text-right rounded-lg outline-none border border-red-100 dark:border-red-900/10 transition-all focus:border-red-300"
                          value={newSale.discountAmount || ''}
                          onChange={e => setNewSale({...newSale, discountAmount: Number(e.target.value)})}
                          placeholder="0"
                        />
                     </div>
                   </div>
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                       <Truck size={12}/>
                       <span className="text-[9px] font-black uppercase">Delivery</span>
                     </div>
                     <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 opacity-60">৳</span>
                        <input 
                          type="number" 
                          className="w-24 pl-5 pr-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs text-right rounded-lg outline-none border border-slate-200 dark:border-slate-700 transition-all focus:border-indigo-300"
                          value={newSale.deliveryCharge || ''}
                          onChange={e => setNewSale({...newSale, deliveryCharge: Number(e.target.value)})}
                          placeholder="0"
                        />
                     </div>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black uppercase text-slate-400">Initial Status</span>
                     <select 
                       className="bg-transparent border-none text-[10px] font-black uppercase text-indigo-600 outline-none cursor-pointer"
                       value={newSale.status}
                       onChange={e => setNewSale({...newSale, status: e.target.value as any})}
                     >
                       <option value="Confirmed">Confirmed</option>
                       <option value="Pending">Pending</option>
                       <option value="Delivered">Delivered</option>
                     </select>
                   </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                   <div className="flex-1 min-w-0">
                     <p className="text-[9px] font-black uppercase text-indigo-500 mb-0.5">Total Amount</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-sm font-serif font-bold text-slate-900 dark:text-white opacity-30">৳</span>
                        <h2 className="text-3xl font-serif font-black text-slate-900 dark:text-white tracking-tighter truncate leading-none">
                          {currentTotal.toLocaleString()}
                        </h2>
                     </div>
                   </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={!newSale.customerId || !newSale.items?.length}
                  className="w-full mt-2 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {editingSaleId ? 'Update Order Record' : (selectedCustomer ? 'Confirm Order' : 'Assign Client')} 
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[140] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 border border-white/5">
             <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
               <div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Order Details</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-1">Ref: #{selectedOrder.id.slice(-8)}</p>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => handleEditOrder(selectedOrder)} className="p-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg transition-all active:scale-95" title="Edit Order">
                   <Edit size={20} />
                 </button>
                 <button onClick={() => handlePrintInvoice(selectedOrder)} className="p-3 text-slate-500 hover:text-indigo-600 bg-white dark:bg-slate-800 rounded-full shadow-sm transition-colors border border-slate-100 dark:border-slate-700 hover:border-indigo-200" title="Print Invoice">
                   <Printer size={20} />
                 </button>
                 <button onClick={() => setSelectedOrder(null)} className="p-3 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-full shadow-sm"><X size={24}/></button>
               </div>
             </div>
             
             <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                
                {/* Customer Profile Card */}
                {(() => {
                  const customer = getOrderCustomer(selectedOrder.id, selectedOrder.customerId);
                  return customer ? (
                    <div className="bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/10">
                       <div className="flex items-start justify-between mb-4">
                          <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wide flex items-center gap-2">
                             <User size={14}/> Client Profile
                          </h4>
                          <span className="px-3 py-1 bg-white dark:bg-indigo-900/50 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
                             {customer.tier} Member
                          </span>
                       </div>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Name</p>
                             <p className="font-bold text-slate-800 dark:text-white">{customer.name}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Phone</p>
                             <p className="font-mono text-slate-700 dark:text-slate-300">{customer.phone}</p>
                          </div>
                          <div className="col-span-2">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Billing / Delivery Address</p>
                             <p className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{customer.address}</p>
                          </div>
                          <div className="col-span-2 border-t border-indigo-100 dark:border-indigo-500/20 pt-3 mt-1 flex justify-between items-center">
                             <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <Wallet size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Lifetime Value</span>
                             </div>
                             <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">৳{customer.totalSpent.toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-slate-400 text-sm italic">
                       Customer profile not found in database.
                    </div>
                  );
                })()}

                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Order Status</p>
                    <div className="flex justify-end gap-2 flex-wrap max-w-md">
                            {['Pending', 'Confirmed', 'Delivered', 'Returned', 'Cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(selectedOrder, status as any)}
                                    disabled={selectedOrder.status === status}
                                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 transition-all ${
                                        selectedOrder.status === status 
                                        ? getStatusStyle(status) 
                                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                    } ${selectedOrder.status === status ? 'opacity-100 ring-2 ring-offset-1 ring-indigo-500/20' : 'opacity-70 hover:opacity-100'}`}
                                >
                                    {status === selectedOrder.status && getStatusIcon(status)}
                                    {status}
                                </button>
                            ))}
                    </div>
                    </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Line Items</p>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold text-xs text-slate-500">
                             {item.quantity}x
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 dark:text-white text-sm">{item.productName}</p>
                             {item.variantName && <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide">{item.variantName}</p>}
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-mono font-bold text-slate-900 dark:text-white">৳{item.total.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">@ ৳{item.unitPrice.toLocaleString()}</p>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-3">
                   <div className="flex justify-between text-xs text-slate-500">
                      <span>Subtotal</span>
                      <span>৳{(selectedOrder.totalAmount + selectedOrder.discountAmount - (selectedOrder.deliveryCharge || 0)).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-xs text-red-500">
                      <span>Discount</span>
                      <span>-৳{selectedOrder.discountAmount.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Delivery</span>
                      <span>+৳{(selectedOrder.deliveryCharge || 0).toLocaleString()}</span>
                   </div>
                   <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grand Total</span>
                      <span className="text-3xl font-serif font-black text-indigo-600 dark:text-indigo-400">৳{selectedOrder.totalAmount.toLocaleString()}</span>
                   </div>
                </div>

                {selectedOrder.notes && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-900/10 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1 flex items-center gap-1">
                      <AlertTriangle size={10} /> Remarks
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed italic">"{selectedOrder.notes}"</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* VOID CONFIRMATION */}
      {saleToDeleteId && (
        <div className="fixed inset-0 z-[160] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center space-y-8 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-full mx-auto flex items-center justify-center animate-bounce shadow-inner"><AlertTriangle size={32}/></div>
             <div>
               <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Void Order?</h3>
               <p className="text-slate-500 text-sm mt-2 leading-relaxed">This permanently deletes the record and restores inventory stock.</p>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setSaleToDeleteId(null)} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Go Back</button>
                <button onClick={() => { onDeleteSale(saleToDeleteId); setSaleToDeleteId(null); }} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg active:scale-95">Void Record</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
