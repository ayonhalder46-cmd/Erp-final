
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sale, Product, Customer, SaleItem, ProductVariant } from './types';
import html2pdf from 'html2pdf.js';
import { 
  Plus, Trash2, X, Undo2, Redo2, 
  Search, ShoppingCart, Package, ArrowRight, Layers, 
  Minus, ShoppingBag, Tag, AlertTriangle, Hash, User,
  Filter, Eye, CheckCircle2, Clock, Ban, ChevronLeft, ChevronRight, Truck, Calendar, Printer, RefreshCw, MapPin, ChevronDown, Award, Wallet, RotateCcw, Edit, CreditCard, DollarSign, Phone, Check, Download
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
  companyProfile: { name: string; address: string; phone: string; email: string; footerMessage?: string; terms?: string };
  notify?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRequestReturn?: (saleId: string) => void;
}

const CATEGORIES = [
  'All', 'Furniture', 'Lighting', 'Textiles', 'Showpiece', 
  'Wall Decor', 'Kitchenware', 'Garden', 'Accessories'
];

const EDITABLE_STATUSES = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];
const FILTER_STATUSES = ['All', 'Pending', 'Confirmed', 'Delivered', 'Returned', 'Cancelled'];
const PAYMENT_METHODS = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Other'];

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
             className="w-full py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-indigo-50 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
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
  onUndo, onRedo, canUndo, canRedo, companyProfile, notify, onRequestReturn
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  // View Details Modal State
  const [viewingOrder, setViewingOrder] = useState<Sale | null>(null);

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
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  
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
    status: 'Pending',
    paymentMethod: 'Cash'
  });

  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  const [quickCustomer, setQuickCustomer] = useState<Partial<Customer>>({
    name: '', address: '', phone: '', tier: 'Bronze', totalSpent: 0, lastPurchaseDate: 'N/A'
  });

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === newSale.customerId), 
    [customers, newSale.customerId]
  );

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
    if (!quickCustomer.name || !quickCustomer.phone) {
        if(notify) notify("Name and Phone are required", "error");
        return;
    }
    
    const newId = Date.now().toString();
    const newCustomer: Customer = {
        id: newId,
        name: quickCustomer.name,
        phone: quickCustomer.phone,
        address: quickCustomer.address || 'N/A',
        tier: quickCustomer.tier || 'Bronze',
        totalSpent: 0,
        lastPurchaseDate: 'N/A',
        updatedAt: new Date().toISOString()
    };

    onAddCustomer(newCustomer);
    setNewSale({ ...newSale, customerId: newId });
    setCustomerSearch(quickCustomer.name);
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

    const currentStock = variant ? variant.stockLevel : product.stockLevel;
    const itemInCart = items.find(i => i.productId === product.id && (variant ? i.variantId === variant.id : !i.variantId));
    const currentQtyInCart = itemInCart?.quantity || 0;
    
    if (qty > 0 && currentQtyInCart + qty > currentStock && !editingSaleId) {
      if (notify) notify(`Max stock reached: ${currentStock}`, 'error');
      else alert(`Cannot add more items. Max stock available: ${currentStock}`);
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

  // Helper to validate stock before changing status to Delivered
  const validateStockForDelivery = (items: SaleItem[]) => {
    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;
        
        const available = product.hasVariants && item.variantId 
            ? (product.variants?.find(v => v.id === item.variantId)?.stockLevel || 0)
            : product.stockLevel;
            
        if (available < item.quantity) {
            return { valid: false, message: `Insufficient stock for ${item.productName}. Need ${item.quantity}, have ${available}.` };
        }
    }
    return { valid: true };
  };

  const handleSubmit = () => {
    if (!newSale.customerId || !newSale.items?.length) return;

    if (!editingSaleId && (newSale.status === 'Delivered')) {
        const check = validateStockForDelivery(newSale.items);
        if (!check.valid) {
            if (notify) notify(check.message!, 'error');
            else alert(check.message);
            return;
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
      status: editingSaleId ? (newSale.status as any) : 'Pending',
      paymentMethod: newSale.paymentMethod || 'Cash'
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
    setNewSale({ date: getLocalDate(), customerId: '', items: [], discountAmount: 0, deliveryCharge: 0, notes: '', status: 'Pending', paymentMethod: 'Cash' });
    setCustomerSearch('');
    setEditingSaleId(null);
    setMobileTab('catalog');
  };

  const handleEditOrder = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setNewSale({
      ...sale,
      items: [...sale.items]
    });
    setCustomerSearch(sale.customerName);
    setSelectedOrder(null);
    setViewingOrder(null); // Close detail view if open
    setIsModalOpen(true);
  };

  const handleStatusChange = (sale: Sale, newStatus: Sale['status']) => {
    if (newStatus === 'Cancelled') {
      if(confirm('Are you sure you want to Cancel and Remove this order? Stock will be restored if it was delivered.')) {
        onDeleteSale(sale.id);
      }
      return;
    }

    // Safety Check: If moving from Pending to Delivered, verify stock exists
    if (sale.status === 'Pending' && newStatus === 'Delivered') {
        const check = validateStockForDelivery(sale.items);
        if (!check.valid) {
            if (notify) notify(`Cannot Deliver: ${check.message}`, 'error');
            else alert(`Cannot Deliver: ${check.message}`);
            return;
        }
    }

    if (sale.status !== newStatus) {
        const updatedSale = { ...sale, status: newStatus };
        onUpdateSale(updatedSale);
        if (selectedOrder && selectedOrder.id === sale.id) {
            setSelectedOrder(updatedSale);
        }
        if (viewingOrder && viewingOrder.id === sale.id) {
            setViewingOrder(updatedSale);
        }
    }
  };

  const generateInvoiceHTML = (order: Sale) => {
    const customer = customers.find(c => c.id === order.customerId);
    return `
      <html>
        <head>
          <title>Invoice #${order.id.slice(-6)}</title>
          <style>
            .invoice-box { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.5; background: white; }
            .invoice-box .header-container { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 40px; }
            .invoice-box .company-info h1 { margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; color: #000; }
            .invoice-box .company-info p { margin: 2px 0; font-size: 12px; color: #666; }
            .invoice-box .invoice-details { text-align: right; }
            .invoice-box .invoice-details h2 { margin: 0 0 5px; font-size: 16px; text-transform: uppercase; color: #666; }
            .invoice-box .invoice-details p { margin: 0; font-weight: bold; font-size: 14px; }
            .invoice-box .bill-to { margin-bottom: 30px; }
            .invoice-box .bill-to h3 { font-size: 12px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 5px; }
            .invoice-box .bill-to p { margin: 0; font-weight: bold; font-size: 16px; }
            .invoice-box .bill-to .address { font-weight: normal; font-size: 14px; color: #555; margin-top: 4px; max-width: 300px; }
            .invoice-box table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            .invoice-box thead th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #eee; text-transform: uppercase; font-size: 11px; color: #666; }
            .invoice-box tbody td { padding: 12px 8px; border-bottom: 1px solid #eee; }
            .invoice-box .text-right { text-align: right; }
            .invoice-box .totals { display: flex; justify-content: flex-end; }
            .invoice-box .totals-box { width: 250px; }
            .invoice-box .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .invoice-box .grand-total { border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 18px; }
            .invoice-box .payment-info { margin-top: 20px; font-size: 12px; color: #666; border-top: 1px dashed #eee; padding-top: 10px; }
            .invoice-box .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
            .invoice-box .terms { font-size: 10px; color: #888; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
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
                 <div class="payment-info">
                   Paid via: <strong>${order.paymentMethod || 'Cash'}</strong>
                 </div>
               </div>
            </div>
            <div class="footer">
              <p>${companyProfile.footerMessage || 'Thank you for your business.'}</p>
              ${companyProfile.terms ? `<p class="terms">${companyProfile.terms}</p>` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintInvoice = (order: Sale) => {
    const html = generateInvoiceHTML(order);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.write('<script>window.onload = function() { window.print(); }</script>');
    printWindow.document.close();
  };

  const handleDownloadInvoice = (order: Sale) => {
    const element = generateInvoiceHTML(order);
    const opt = {
      margin: 10,
      filename: `Invoice_${order.id.slice(-6)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().from(element).set(opt).save().then(() => {
        if(notify) notify('Invoice saved as PDF', 'success');
    }).catch(err => {
        console.error(err);
        if(notify) notify('Failed to generate PDF', 'error');
    });
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

  // Helper to draw status timeline
  const StatusTimeline = ({ status }: { status: Sale['status'] }) => {
    const steps = ['Pending', 'Confirmed', 'Delivered'];
    const currentIdx = steps.indexOf(status);
    const isCancelled = status === 'Cancelled';
    const isReturned = status === 'Returned';

    if (isCancelled || isReturned) return null; // Don't show timeline for abnormal states

    return (
      <div className="flex items-center w-full max-w-sm mx-auto mb-6">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIdx;
          const isLast = idx === steps.length - 1;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-all ${isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                </div>
                <span className={`absolute top-10 text-[9px] font-bold uppercase tracking-wider ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                  {step}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-1 mx-2 rounded-full ${idx < currentIdx ? 'bg-green-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    );
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
        
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
           {/* Status Filter */}
           <div className="relative min-w-[140px]">
             <select 
               className="w-full pl-4 pr-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white font-bold text-xs appearance-none cursor-pointer"
               value={selectedStatusFilter}
               onChange={(e) => setSelectedStatusFilter(e.target.value)}
             >
               {FILTER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
           </div>

           {/* Date Filter */}
           <div className="relative min-w-[140px]">
             <input 
               type="date"
               className="w-full pl-4 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white font-bold text-xs"
               value={selectedDateFilter}
               onChange={(e) => setSelectedDateFilter(e.target.value)}
             />
           </div>
        </div>
      </div>

      {/* Sales List / Ledger Table */}
      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-visible backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest">Order Ref</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest">Customer</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest">Items</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Total (৳)</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Profit (৳)</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedSales.map((sale) => (
                <tr 
                  key={sale.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => setViewingOrder(sale)}
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="font-bold text-slate-800 dark:text-white">#{sale.id.slice(-6)}</span>
                       <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{formatDate(sale.date)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="font-bold text-slate-700 dark:text-slate-200">{sale.customerName}</span>
                       <span className="text-[10px] text-slate-400">{getOrderCustomer(sale.id, sale.customerId)?.phone || 'No Contact Info'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex flex-col gap-1">
                      {sale.items.slice(0, 2).map((item, idx) => (
                         <span key={idx} className="truncate max-w-[150px]">• {item.quantity}x {item.productName}</span>
                      ))}
                      {sale.items.length > 2 && <span className="text-[9px] text-slate-400 italic">+{sale.items.length - 2} more...</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">৳{sale.totalAmount.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={`font-bold font-mono ${sale.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {sale.profit < 0 ? '-' : ''}৳{Math.abs(sale.profit).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="relative group/status inline-block" onClick={(e) => e.stopPropagation()}>
                       <button className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 w-full justify-center transition-all ${getStatusStyle(sale.status)}`}>
                         {getStatusIcon(sale.status)}
                         {sale.status}
                         {(sale.status === 'Pending' || sale.status === 'Delivered' || sale.status === 'Confirmed') && (
                           <ChevronDown size={10} className="ml-1 opacity-50" />
                         )}
                       </button>
                       
                       {/* Enhanced Dropdown for Status Change */}
                       {(sale.status === 'Pending' || sale.status === 'Delivered' || sale.status === 'Confirmed') && (
                         <div className="absolute left-0 top-full mt-2 bg-white dark:bg-slate-900 shadow-2xl rounded-xl border border-slate-100 dark:border-slate-800 p-1.5 z-50 hidden group-hover/status:block w-40 animate-in slide-in-from-top-2">
                           <div className="text-[9px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider mb-1">Update Status</div>
                           {EDITABLE_STATUSES.filter(s => s !== sale.status).map(status => (
                             <button 
                               key={status}
                               onClick={() => handleStatusChange(sale, status as Sale['status'])}
                               className={`w-full text-left px-3 py-2.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 mb-1 last:mb-0 ${
                                 status === 'Cancelled' 
                                   ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                   : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                               }`}
                             >
                               {getStatusIcon(status)}
                               Set {status}
                             </button>
                           ))}
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {sale.status === 'Delivered' && (
                        <button 
                          onClick={() => onRequestReturn && onRequestReturn(sale.id)} 
                          className="p-2 text-indigo-500 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors" 
                          title="Process Return"
                        >
                           <RotateCcw size={16} />
                        </button>
                      )}
                      <button onClick={() => handlePrintInvoice(sale)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Print Invoice">
                         <Printer size={16} />
                      </button>
                      <button onClick={() => handleEditOrder(sale)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Edit Order">
                         <Edit size={16} />
                      </button>
                      <button onClick={() => { if(confirm('Cancel and Delete Order?')) onDeleteSale(sale.id); }} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Void Order">
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-slate-400 italic">No orders found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
             <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 disabled:opacity-50"><ChevronRight size={16} /></button>
             </div>
          </div>
        )}
      </div>

      {/* VIEW ORDER DETAIL MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
              
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                       <Hash size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Order #{viewingOrder.id.slice(-6)}
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusStyle(viewingOrder.status)}`}>
                             {getStatusIcon(viewingOrder.status)} {viewingOrder.status}
                          </span>
                       </h3>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <Calendar size={12} /> {new Date(viewingOrder.date).toLocaleString()}
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setViewingOrder(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 {/* VISUAL TIMELINE */}
                 <StatusTimeline status={viewingOrder.status} />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Customer Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50">
                       <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><User size={14}/> Customer Details</h4>
                       <div className="space-y-3">
                          <div className="flex justify-between">
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{viewingOrder.customerName}</span>
                             {getOrderCustomer(viewingOrder.id, viewingOrder.customerId)?.tier && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">{getOrderCustomer(viewingOrder.id, viewingOrder.customerId)?.tier}</span>
                             )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                             <Phone size={12} /> {getOrderCustomer(viewingOrder.id, viewingOrder.customerId)?.phone || 'N/A'}
                          </div>
                          <div className="flex items-start gap-2 text-xs text-slate-500">
                             <MapPin size={12} className="mt-0.5" /> {getOrderCustomer(viewingOrder.id, viewingOrder.customerId)?.address || 'No Address'}
                          </div>
                          {getOrderCustomer(viewingOrder.id, viewingOrder.customerId) && (
                             <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                                <span className="text-slate-400">Lifetime Value</span>
                                <span className="font-mono font-bold text-indigo-500">৳{getOrderCustomer(viewingOrder.id, viewingOrder.customerId)?.totalSpent.toLocaleString()}</span>
                             </div>
                          )}
                       </div>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50">
                       <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><CreditCard size={14}/> Financials</h4>
                       <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-slate-500">
                             <span>Subtotal</span>
                             <span className="font-mono">৳{(viewingOrder.items.reduce((a,b) => a+b.total, 0)).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                             <span>Discount</span>
                             <span className="font-mono text-red-400">-৳{viewingOrder.discountAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                             <span>Delivery</span>
                             <span className="font-mono">৳{viewingOrder.deliveryCharge.toLocaleString()}</span>
                          </div>
                          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                             <span className="font-bold text-slate-800 dark:text-white">Grand Total</span>
                             <div className="text-right">
                                <span className="font-mono font-bold text-xl text-slate-900 dark:text-white block">৳{viewingOrder.totalAmount.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{viewingOrder.paymentMethod || 'Cash'}</span>
                             </div>
                          </div>
                          {/* Admin Only Profit View */}
                          <div className="mt-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                             <span className="font-bold text-slate-400 flex items-center gap-1"><DollarSign size={12}/> Net Profit</span>
                             <span className={`font-mono font-bold ${viewingOrder.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {viewingOrder.profit >= 0 ? '+' : ''}৳{viewingOrder.profit.toLocaleString()}
                             </span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Line Items Table */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden mb-6">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <tr>
                             <th className="px-6 py-4">Item</th>
                             <th className="px-6 py-4 text-center">Qty</th>
                             <th className="px-6 py-4 text-right">Unit Price</th>
                             <th className="px-6 py-4 text-right">Total</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {viewingOrder.items.map((item, idx) => (
                             <tr key={idx}>
                                <td className="px-6 py-4">
                                   <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                                   {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                                </td>
                                <td className="px-6 py-4 text-center font-mono">{item.quantity}</td>
                                <td className="px-6 py-4 text-right font-mono text-slate-500">৳{item.unitPrice.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold">৳{item.total.toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 {viewingOrder.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 text-sm text-yellow-800 dark:text-yellow-200">
                       <span className="font-bold uppercase text-[10px] tracking-widest block mb-1">Notes</span>
                       {viewingOrder.notes}
                    </div>
                 )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center gap-4 shrink-0">
                 <div className="flex gap-2">
                    {/* Quick Status Toggles */}
                    {['Confirmed', 'Delivered'].map(status => (
                        status !== viewingOrder.status && (
                            <button 
                                key={status}
                                onClick={() => handleStatusChange(viewingOrder, status as Sale['status'])}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Mark {status}
                            </button>
                        )
                    ))}
                 </div>
                 
                 <div className="flex gap-2">
                    <button 
                        onClick={() => handleDownloadInvoice(viewingOrder)} 
                        className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        title="Save PDF Invoice"
                    >
                        <Download size={16} /> Save PDF
                    </button>
                    <button 
                        onClick={() => handlePrintInvoice(viewingOrder)} 
                        className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <Printer size={16} /> Print
                    </button>
                    {viewingOrder.status === 'Delivered' && onRequestReturn && (
                        <button 
                            onClick={() => { setViewingOrder(null); onRequestReturn(viewingOrder.id); }} 
                            className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            <RotateCcw size={16} /> Return
                        </button>
                    )}
                    <button 
                        onClick={() => handleEditOrder(viewingOrder)} 
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md active:scale-95"
                    >
                        <Edit size={16} /> Edit Order
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* POS Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-slate-100 dark:bg-slate-900 w-full h-full max-w-[1600px] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
            
            {/* Mobile Tab Switcher - Visible only on mobile */}
            <div className="md:hidden flex p-4 pb-0 gap-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <button 
                onClick={() => setMobileTab('catalog')} 
                className={`flex-1 py-3 text-xs font-bold rounded-t-xl transition-colors ${mobileTab === 'catalog' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Catalog
              </button>
              <button 
                onClick={() => setMobileTab('cart')} 
                className={`flex-1 py-3 text-xs font-bold rounded-t-xl transition-colors flex items-center justify-center gap-2 ${mobileTab === 'cart' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Cart
                {newSale.items && newSale.items.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                    {newSale.items.reduce((a,b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
              {/* Left: Product Catalog */}
              <div className={`w-full md:w-2/3 flex flex-col h-full bg-white dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800 ${mobileTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Catalog</h3>
                        <p className="text-slate-500 text-xs">Select items to add to cart.</p>
                      </div>
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            className="pl-9 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm w-full md:w-64 outline-none border border-transparent focus:border-indigo-500 transition-all" 
                            placeholder="Search products..."
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                          />
                      </div>
                    </div>
                    
                    {/* Category Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {CATEGORIES.map(c => (
                        <button
                          key={c}
                          onClick={() => setSelectedCategory(c)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            selectedCategory === c 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950">
                    {filteredProducts.map(product => (
                      <PosProductCard 
                        key={product.id} 
                        product={product} 
                        onAdd={addItemToSale} 
                        cartItems={newSale.items || []}
                      />
                    ))}
                </div>
              </div>

              {/* Right: Cart & Checkout */}
              <div className={`w-full md:w-1/3 flex flex-col h-full bg-white dark:bg-slate-900 shadow-xl relative z-10 ${mobileTab === 'catalog' ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingCart size={20} /> Current Order</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setNewSale({...newSale, items: []})} 
                        className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
                        disabled={!newSale.items?.length}
                      >
                        Clear
                      </button>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20}/></button>
                    </div>
                </div>
                
                {/* Customer Selection */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                    <div className="relative" ref={customerDropdownRef}>
                      <div 
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors"
                        onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      >
                          <User size={18} className="text-slate-400" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                              {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
                            </p>
                            {selectedCustomer && <p className="text-[10px] text-slate-500">{selectedCustomer.phone}</p>}
                          </div>
                          <ChevronDown size={16} className="text-slate-400" />
                      </div>
                      
                      {isCustomerDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-64 overflow-y-auto">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                              <input 
                                className="w-full p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs outline-none"
                                placeholder="Filter customers..."
                                value={customerSearch}
                                onChange={e => setCustomerSearch(e.target.value)}
                                autoFocus
                              />
                            </div>
                            <button 
                              onClick={() => { setIsQuickAddOpen(true); setIsCustomerDropdownOpen(false); }}
                              className="w-full p-3 text-left text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2"
                            >
                              <Plus size={14} /> Quick Add New Customer
                            </button>
                            {filteredCustomers.map(c => (
                              <div 
                                key={c.id} 
                                onClick={() => { setNewSale({...newSale, customerId: c.id}); setIsCustomerDropdownOpen(false); }}
                                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                              >
                                <p className="font-bold">{c.name}</p>
                                <p className="text-xs text-slate-500">{c.phone}</p>
                              </div>
                            ))}
                          </div>
                      )}
                    </div>
                    
                    {vipStats && (
                      <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg">
                          <ShoppingBag size={12} />
                          <span className="font-bold">{vipStats.count} Previous Orders</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                          <Award size={12} />
                          <span className="font-bold">Total LTV: ৳{vipStats.total.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {newSale.items?.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4">
                        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <ShoppingCart size={48} />
                        </div>
                        <p className="font-medium text-sm">Cart is empty</p>
                        <p className="text-xs max-w-[200px] text-center">Select items from the catalog to begin.</p>
                      </div>
                  ) : (
                      newSale.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-right-4 group">
                          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                            {products.find(p => p.id === item.productId)?.image ? (
                              <img src={products.find(p => p.id === item.productId)?.image} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={18} className="text-slate-400"/>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{item.productName}</p>
                              {item.variantName && <p className="text-[10px] text-slate-500">{item.variantName}</p>}
                              <p className="text-xs font-mono text-indigo-600 mt-1">৳{item.unitPrice.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 border border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors">
                              <button onClick={() => removeItemFromSale(item.productId, item.variantId)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm transition-all active:scale-90"><Minus size={12}/></button>
                              <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => {
                                  const p = products.find(prod => prod.id === item.productId);
                                  const v = p?.variants?.find(v => v.id === item.variantId);
                                  if (p) addItemToSale(p, v, 1);
                                }} 
                                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm transition-all active:scale-90"
                              >
                                <Plus size={12}/>
                              </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Totals & Checkout */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span>৳{currentSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Discount</span>
                        <input 
                          type="number" 
                          className="w-24 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-colors"
                          value={newSale.discountAmount}
                          onChange={e => setNewSale({...newSale, discountAmount: Number(e.target.value)})}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Delivery</span>
                        <input 
                          type="number" 
                          className="w-24 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-colors"
                          value={newSale.deliveryCharge}
                          onChange={e => setNewSale({...newSale, deliveryCharge: Number(e.target.value)})}
                        />
                      </div>
                      
                      {/* Payment Method Selector */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Paid Via</span>
                        <select 
                          className="w-32 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-500 font-bold"
                          value={newSale.paymentMethod}
                          onChange={e => setNewSale({...newSale, paymentMethod: e.target.value as any})}
                        >
                          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>

                      <div className="flex justify-between font-black text-2xl text-slate-900 dark:text-white pt-4 border-t border-slate-200 dark:border-slate-800">
                        <span>Total</span>
                        <span>৳{currentTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <button 
                        onClick={handleSubmit}
                        disabled={!newSale.customerId || !newSale.items?.length}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                      >
                        {editingSaleId ? 'Update Order' : 'Confirm Order'}
                      </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 p-4">
           <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
              <h3 className="text-xl font-bold mb-4">Quick Add Customer</h3>
              <form onSubmit={handleQuickAddCustomer} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                   <input required className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-slate-200 dark:border-slate-700" value={quickCustomer.name} onChange={e => setQuickCustomer({...quickCustomer, name: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                   <input required className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-slate-200 dark:border-slate-700" value={quickCustomer.phone} onChange={e => setQuickCustomer({...quickCustomer, phone: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                   <textarea required className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-slate-200 dark:border-slate-700" value={quickCustomer.address} onChange={e => setQuickCustomer({...quickCustomer, address: e.target.value})} />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsQuickAddOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Save & Select</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
