
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Sales } from './Sales';
import { Customers } from './components/Customers';
import { Suppliers } from './components/Suppliers';
import { Expenses } from './components/Expenses';
import { Returns } from './components/Returns';
import { WorkflowTester } from './components/WorkflowTester';
import { PriceCalculator } from './components/PriceCalculator';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { AuditTrail } from './components/AuditTrail';
import { Advisor } from './components/Advisor';
import { SpreadsheetView } from './components/SpreadsheetView';
import { PurchaseOrders } from './components/PurchaseOrders';
import { ViewState, Product, Sale, Customer, AuditLog, Supplier, Expense, Return, SyncStatus, PurchaseOrder, PeriodSummary } from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, INITIAL_EXPENSES } from './constants';
import { ApiService } from './components/apiService';
import { Lock, Unlock, Menu, Moon, Sun, Home } from 'lucide-react';
import { ToastContainer, ToastMessage } from './components/Toast';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    (localStorage.getItem('hub_theme') as 'light' | 'dark') || 'light'
  );
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [periodSummaries, setPeriodSummaries] = useState<PeriodSummary[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  // System State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Refs for State Access
  const productsRef = useRef(products);
  const salesRef = useRef(sales);
  const customersRef = useRef(customers);
  const returnsRef = useRef(returns);
  const purchaseOrdersRef = useRef(purchaseOrders);

  // Security & Profile State
  const [pin, setPin] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [lockError, setLockError] = useState(false);
  
  // Extended Business Profile for Real-World Compliance
  const [businessProfile, setBusinessProfile] = useState({
    name: 'TheDécorHub',
    address: 'Dhaka, Bangladesh',
    phone: '+880',
    email: 'admin@decorhub.com',
    footerMessage: 'Thank you for your business.',
    terms: 'Goods sold are subject to return policy within 7 days.'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const logAction = useCallback((action: string, entity: string, details: string, type: AuditLog['type'] = 'update') => {
    if (isResetting) return;
    const newLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      entity,
      details,
      type
    };
    setLogs(prev => {
        const updatedLogs = [newLog, ...prev].slice(0, 100);
        ApiService.pushUpdate('logs', updatedLogs);
        return updatedLogs;
    });
  }, [isResetting]);

  useEffect(() => {
    productsRef.current = products;
    salesRef.current = sales;
    customersRef.current = customers;
    returnsRef.current = returns;
    purchaseOrdersRef.current = purchaseOrders;
  }, [products, sales, customers, returns, purchaseOrders]);

  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    const storedPin = localStorage.getItem('hub_pin') || '1234';
    setPin(storedPin);
    
    const storedProfile = localStorage.getItem('hub_profile');
    if (storedProfile) {
      setBusinessProfile(JSON.parse(storedProfile));
    }

    const loadData = async () => {
      try {
        setSyncStatus('syncing');
        
        const [fetchedProducts, fetchedSales, fetchedCustomers, fetchedSuppliers, fetchedExpenses, fetchedReturns, fetchedPOs, fetchedSummaries, fetchedLogs] = await Promise.all([
          ApiService.fetchLatest('products'),
          ApiService.fetchLatest('sales'),
          ApiService.fetchLatest('customers'),
          ApiService.fetchLatest('suppliers'),
          ApiService.fetchLatest('expenses'),
          ApiService.fetchLatest('returns'),
          ApiService.fetchLatest('purchaseOrders'),
          ApiService.fetchLatest('period_summaries'),
          ApiService.fetchLatest('logs')
        ]);

        setProducts(fetchedProducts || INITIAL_PRODUCTS);
        setSales(fetchedSales || []);
        setCustomers(fetchedCustomers || INITIAL_CUSTOMERS);
        setSuppliers(fetchedSuppliers || INITIAL_SUPPLIERS);
        setExpenses(fetchedExpenses || INITIAL_EXPENSES);
        setReturns(fetchedReturns || []);
        setPurchaseOrders(fetchedPOs || []);
        setPeriodSummaries(fetchedSummaries || []);
        setLogs(fetchedLogs || []);

        setIsInitialized(true);
        setSyncStatus('synced');
      } catch (error) {
        console.error("Failed to load data", error);
        setSyncStatus('error');
        showToast('Failed to load system data', 'error');
      }
    };

    loadData();

    ApiService.onSync((entity, data) => {
      if (entity === 'products') setProducts(data);
      if (entity === 'sales') setSales(data);
      if (entity === 'customers') setCustomers(data);
      if (entity === 'suppliers') setSuppliers(data);
      if (entity === 'expenses') setExpenses(data);
      if (entity === 'returns') setReturns(data);
      if (entity === 'purchaseOrders') setPurchaseOrders(data);
      if (entity === 'period_summaries') setPeriodSummaries(data);
      if (entity === 'logs') setLogs(data);
    });

  }, []);

  const handleUpdateProfile = (newProfile: typeof businessProfile) => {
    setBusinessProfile(newProfile);
    localStorage.setItem('hub_profile', JSON.stringify(newProfile));
    logAction('Update Profile', 'System', 'Updated business contact details');
    showToast('Business profile updated', 'success');
  };

  const handleUpdatePin = (newPin: string) => {
    setPin(newPin);
    localStorage.setItem('hub_pin', newPin);
    logAction('Update PIN', 'Security', 'Changed access PIN');
    showToast('Security PIN changed', 'success');
  };

  const handleFactoryReset = async () => {
    setIsResetting(true);
    await ApiService.clearAll();
    localStorage.clear();
    window.location.reload();
  };

  const handleUpdatePeriodSummaries = (summaries: PeriodSummary[]) => {
    setPeriodSummaries(summaries);
    ApiService.pushUpdate('period_summaries', summaries);
    logAction('Close Period', 'Finance', 'Updated Monthly Financial Snapshots');
    showToast('Financial period closed successfully', 'success');
  };

  // --- LOGIC ENGINE ---

  const calculateTier = (totalSpent: number): Customer['tier'] => {
    if (totalSpent >= 100000) return 'Gold';
    if (totalSpent >= 50000) return 'Silver';
    return 'Bronze';
  };

  const adjustStock = (items: any[], direction: 'deduct' | 'restore') => {
    setProducts(prev => {
        const updatedProducts = [...prev];
        items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex > -1) {
            const product = { ...updatedProducts[productIndex] };
            const modifier = direction === 'deduct' ? -1 : 1;
            
            if (product.hasVariants && item.variantId) {
               const variantIndex = product.variants?.findIndex(v => v.id === item.variantId);
               if (variantIndex !== undefined && variantIndex > -1 && product.variants) {
                 const variants = [...product.variants];
                 variants[variantIndex] = { ...variants[variantIndex], stockLevel: variants[variantIndex].stockLevel + (item.quantity * modifier) };
                 product.variants = variants;
               }
            } else {
               product.stockLevel += (item.quantity * modifier);
            }
            updatedProducts[productIndex] = product;
          }
        });
        ApiService.pushUpdate('products', updatedProducts);
        return updatedProducts;
    });
  };

  // ... (Keep existing CRUD handlers) ...
  // [CRUD handlers included in previous version, keeping concise for this update block]
  const handleAddProduct = (product: Product) => {
    setProducts(prev => {
        const updated = [...prev, product];
        ApiService.pushUpdate('products', updated);
        return updated;
    });
    logAction('Create Product', 'Inventory', `Added SKU: ${product.sku}`, 'create');
    showToast(`Product ${product.name} created`, 'success');
  };

  const handleUpdateProduct = (product: Product) => {
    setProducts(prev => {
        const updated = prev.map(p => p.id === product.id ? product : p);
        ApiService.pushUpdate('products', updated);
        return updated;
    });
    logAction('Update Product', 'Inventory', `Updated SKU: ${product.sku}`);
    showToast('Inventory updated', 'success');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => {
        const p = prev.find(i => i.id === id);
        const updated = prev.filter(p => p.id !== id);
        ApiService.pushUpdate('products', updated);
        if(p) logAction('Delete Product', 'Inventory', `Removed SKU: ${p.sku}`, 'delete');
        return updated;
    });
    showToast('Product deleted', 'info');
  };

  const handleAddSale = (sale: Sale) => {
    setSales(prev => {
        const updatedSales = [sale, ...prev];
        ApiService.pushUpdate('sales', updatedSales);
        return updatedSales;
    });
    
    if (sale.status === 'Confirmed' || sale.status === 'Delivered') {
        adjustStock(sale.items, 'deduct');
    }

    if (sale.status !== 'Cancelled' && sale.status !== 'Returned') {
      setCustomers(prev => {
          const updatedCustomers = prev.map(c => {
            if (c.id === sale.customerId) {
              const newTotal = c.totalSpent + sale.totalAmount;
              return { 
                ...c, 
                totalSpent: newTotal,
                lastPurchaseDate: sale.date,
                tier: calculateTier(newTotal)
              };
            }
            return c;
          });
          ApiService.pushUpdate('customers', updatedCustomers);
          return updatedCustomers;
      });
    }
    
    logAction('Create Order', 'Sales', `Processed Order #${sale.id.slice(-6)}`, 'create');
    showToast('Order processed successfully', 'success');
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    const oldSale = salesRef.current.find(s => s.id === updatedSale.id);
    if (!oldSale) return;

    const oldStatus = oldSale.status;
    const newStatus = updatedSale.status;
    
    const isOldConsumed = oldStatus === 'Confirmed' || oldStatus === 'Delivered';
    const isNewConsumed = newStatus === 'Confirmed' || newStatus === 'Delivered';

    if (isOldConsumed) {
        adjustStock(oldSale.items, 'restore');
    }

    setSales(prev => {
        const updatedSales = prev.map(s => s.id === updatedSale.id ? updatedSale : s);
        ApiService.pushUpdate('sales', updatedSales);
        return updatedSales;
    });

    if (isNewConsumed) {
        adjustStock(updatedSale.items, 'deduct');
    }

    const oldContribution = (oldStatus !== 'Cancelled' && oldStatus !== 'Returned') ? oldSale.totalAmount : 0;
    const newContribution = (newStatus !== 'Cancelled' && newStatus !== 'Returned') ? updatedSale.totalAmount : 0;
    
    const ltvAdjustment = newContribution - oldContribution;

    if (ltvAdjustment !== 0) {
        setCustomers(prev => {
            const updatedCustomers = prev.map(c => {
                if (c.id === updatedSale.customerId) {
                    const newTotal = c.totalSpent + ltvAdjustment;
                    return { 
                        ...c, 
                        totalSpent: newTotal,
                        tier: calculateTier(newTotal)
                    };
                }
                return c;
            });
            ApiService.pushUpdate('customers', updatedCustomers);
            return updatedCustomers;
        });
    }

    logAction('Update Order', 'Sales', `Updated Order #${updatedSale.id.slice(-6)}: ${oldStatus} -> ${newStatus}`);
    showToast(`Order status updated: ${newStatus}`, 'info');
  };

  const handleDeleteSale = (id: string) => {
    const sale = salesRef.current.find(s => s.id === id);
    if (!sale) return;

    if (sale.status === 'Confirmed' || sale.status === 'Delivered') {
        adjustStock(sale.items, 'restore');
    }

    setSales(prev => {
        const updatedSales = prev.filter(s => s.id !== id);
        ApiService.pushUpdate('sales', updatedSales);
        return updatedSales;
    });
    
    if (sale.status !== 'Cancelled' && sale.status !== 'Returned') {
      setCustomers(prev => {
          const updatedCustomers = prev.map(c => {
            if (c.id === sale.customerId) {
              const newTotal = c.totalSpent - sale.totalAmount;
              return { 
                  ...c, 
                  totalSpent: newTotal,
                  tier: calculateTier(newTotal)
              };
            }
            return c;
          });
          ApiService.pushUpdate('customers', updatedCustomers);
          return updatedCustomers;
      });
    }

    logAction('Delete Order', 'Sales', `Voided Order #${sale.id.slice(-6)}`, 'delete');
    showToast('Order voided and stock restored', 'info');
  };

  const handleAddCustomer = (customer: Customer) => {
    setCustomers(prev => {
        const updated = [customer, ...prev];
        ApiService.pushUpdate('customers', updated);
        return updated;
    });
    logAction('Add Client', 'CRM', `Registered ${customer.name}`, 'create');
    showToast(`Client ${customer.name} registered`, 'success');
  };

  const handleUpdateCustomer = (customer: Customer) => {
    setCustomers(prev => {
        const updated = prev.map(c => c.id === customer.id ? customer : c);
        ApiService.pushUpdate('customers', updated);
        return updated;
    });
    logAction('Update Client', 'CRM', `Modified profile: ${customer.name}`);
    showToast('Client profile updated', 'success');
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => {
        const c = prev.find(x => x.id === id);
        const updated = prev.filter(cust => cust.id !== id);
        ApiService.pushUpdate('customers', updated);
        if(c) logAction('Delete Client', 'CRM', `Removed profile: ${c.name}`, 'delete');
        return updated;
    });
    showToast('Client profile removed', 'info');
  };

  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers(prev => {
        const updated = [supplier, ...prev];
        ApiService.pushUpdate('suppliers', updated);
        return updated;
    });
    logAction('Add Supplier', 'SCM', `Registered ${supplier.name}`, 'create');
    showToast('Supplier registered', 'success');
  };

  const handleUpdateSupplier = (supplier: Supplier) => {
    setSuppliers(prev => {
        const updated = prev.map(s => s.id === supplier.id ? supplier : s);
        ApiService.pushUpdate('suppliers', updated);
        return updated;
    });
    logAction('Update Supplier', 'SCM', `Modified: ${supplier.name}`);
    showToast('Supplier updated', 'success');
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(prev => {
        const s = prev.find(x => x.id === id);
        const updated = prev.filter(sup => sup.id !== id);
        ApiService.pushUpdate('suppliers', updated);
        if(s) logAction('Delete Supplier', 'SCM', `Removed: ${s.name}`, 'delete');
        return updated;
    });
    showToast('Supplier removed', 'info');
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => {
        const updated = [expense, ...prev];
        ApiService.pushUpdate('expenses', updated);
        return updated;
    });
    logAction('Add Expense', 'Finance', `Logged ${expense.category}: ৳${expense.amount}`, 'create');
    showToast('Expense recorded', 'success');
  };

  const handleUpdateExpense = (expense: Expense) => {
    setExpenses(prev => {
        const updated = prev.map(e => e.id === expense.id ? expense : e);
        ApiService.pushUpdate('expenses', updated);
        return updated;
    });
    showToast('Expense updated', 'success');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => {
        const updated = prev.filter(e => e.id !== id);
        ApiService.pushUpdate('expenses', updated);
        return updated;
    });
    logAction('Delete Expense', 'Finance', `Removed record ID: ${id.slice(-4)}`, 'delete');
    showToast('Expense removed', 'info');
  };

  const handleAddReturn = (rma: Return) => {
    setReturns(prev => {
        const updatedReturns = [rma, ...prev];
        ApiService.pushUpdate('returns', updatedReturns);
        return updatedReturns;
    });
    logAction('Create Return', 'RMA', `Opened Ticket for Order #${rma.orderId.slice(-6)}`, 'create');
    showToast('RMA Ticket created', 'success');
  };

  const handleUpdateReturnStatus = (rma: Return, status: Return['status']) => {
    if (status === 'Approved' && rma.status !== 'Approved') {
       if (rma.condition === 'Resellable') {
         adjustStock([{ productId: rma.productId, variantId: rma.variantId, quantity: rma.quantity }], 'restore');
       }
       
       setCustomers(prev => {
           const updatedCustomers = prev.map(c => {
             if (c.name === rma.customerName) { 
               const newTotal = c.totalSpent - rma.refundAmount;
               return { 
                   ...c, 
                   totalSpent: newTotal,
                   tier: calculateTier(newTotal)
               };
             }
             return c;
           });
           ApiService.pushUpdate('customers', updatedCustomers);
           return updatedCustomers;
       });

       setSales(prev => {
           const saleIndex = prev.findIndex(s => s.id === rma.orderId);
           if (saleIndex > -1) {
              const updatedSale = { ...prev[saleIndex] };
              updatedSale.notes = updatedSale.notes 
                ? `${updatedSale.notes} | RMA Approved: ${rma.id.slice(-4)}` 
                : `RMA Approved: ${rma.id.slice(-4)}`;
              
              const newSales = [...prev];
              newSales[saleIndex] = updatedSale;
              ApiService.pushUpdate('sales', newSales);
              return newSales;
           }
           return prev;
       });
    }

    setReturns(prev => {
        const rmaIndex = prev.findIndex(r => r.id === rma.id);
        if (rmaIndex === -1) return prev;
        const updatedReturns = [...prev];
        updatedReturns[rmaIndex] = { ...updatedReturns[rmaIndex], status };
        ApiService.pushUpdate('returns', updatedReturns);
        return updatedReturns;
    });
    
    logAction('Update Return', 'RMA', `Set Ticket #${rma.id.slice(-6)} to ${status}`);
    showToast(`RMA status updated to ${status}`, 'info');
  };

  const handleCreatePO = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => {
      const updated = [po, ...prev];
      ApiService.pushUpdate('purchaseOrders', updated);
      return updated;
    });
    logAction('Create PO', 'Procurement', `PO #${po.id.slice(-6)} to ${po.supplierName}`, 'create');
    showToast(`Purchase Order created for ${po.supplierName}`, 'success');
  };

  const handleReceivePO = (po: PurchaseOrder) => {
    setProducts(prev => {
      const updatedProducts = [...prev];
      po.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex > -1) {
          const product = { ...updatedProducts[productIndex] };
          
          if (product.hasVariants && item.variantId) {
             const vIndex = product.variants?.findIndex(v => v.id === item.variantId);
             if (vIndex !== undefined && vIndex > -1 && product.variants) {
               const variants = [...product.variants];
               const currentStock = variants[vIndex].stockLevel;
               const currentCost = variants[vIndex].costPrice;
               const incomingQty = item.quantity;
               const incomingCost = item.unitCost;
               
               const newAvgCost = ((currentStock * currentCost) + (incomingQty * incomingCost)) / (currentStock + incomingQty);

               variants[vIndex] = { 
                   ...variants[vIndex], 
                   stockLevel: currentStock + incomingQty,
                   costPrice: parseFloat(newAvgCost.toFixed(2))
               };
               product.variants = variants;
             }
          } else {
             const currentStock = product.stockLevel;
             const currentCost = product.costPrice;
             const incomingQty = item.quantity;
             const incomingCost = item.unitCost;

             const newAvgCost = ((currentStock * currentCost) + (incomingQty * incomingCost)) / (currentStock + incomingQty);

             product.stockLevel += incomingQty;
             product.costPrice = parseFloat(newAvgCost.toFixed(2));
          }
          updatedProducts[productIndex] = product;
        }
      });
      ApiService.pushUpdate('products', updatedProducts);
      return updatedProducts;
    });

    const expense: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      category: 'Procurement',
      description: `Stock Restock: PO #${po.id.slice(-6)}`,
      amount: po.totalAmount,
      paymentMethod: 'Bank Transfer', 
      status: 'Paid',
      referenceId: po.id
    };
    handleAddExpense(expense);

    setPurchaseOrders(prev => {
      const idx = prev.findIndex(p => p.id === po.id);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], status: 'Received' };
      ApiService.pushUpdate('purchaseOrders', updated);
      return updated;
    });

    logAction('Receive PO', 'Procurement', `Received goods for PO #${po.id.slice(-6)} & Updated Weighted Avg Costs`);
    showToast('Stock received and inventory updated', 'success');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('hub_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
             <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Booting System</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xs animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-4">
              <Lock size={40} />
           </div>
           <div className="text-center space-y-2">
             <h2 className="text-2xl font-serif font-bold">System Locked</h2>
             <p className="text-indigo-300 text-sm">Enter security PIN to access terminal.</p>
           </div>
           
           <div className="w-full space-y-4">
             <div className="flex justify-center gap-4 mb-4">
               {[0,1,2,3].map(i => (
                 <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < enteredPin.length ? 'bg-indigo-500 scale-110' : 'bg-slate-700'}`} />
               ))}
             </div>
             
             <div className={`grid grid-cols-3 gap-4 ${lockError ? 'animate-shake' : ''}`}>
               {[1,2,3,4,5,6,7,8,9].map(num => (
                 <button 
                   key={num} 
                   onClick={() => {
                     const newVal = enteredPin + num;
                     setEnteredPin(newVal);
                     if (newVal.length === 4) {
                       if (newVal === pin) { setIsLocked(false); setEnteredPin(''); }
                       else { setLockError(true); setTimeout(() => {setLockError(false); setEnteredPin('')}, 500); }
                     }
                   }}
                   className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-indigo-600 transition-colors font-bold text-xl shadow-lg active:scale-95"
                 >
                   {num}
                 </button>
               ))}
               <button onClick={() => setEnteredPin(enteredPin.slice(0,-1))} className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-red-900/50 text-red-400 transition-colors font-bold flex items-center justify-center col-start-2 col-end-3 translate-x-[4.5rem]">
                  <Unlock size={20} />
               </button>
               <button 
                  onClick={() => {
                     const val = enteredPin + '0';
                     setEnteredPin(val);
                     if (val === pin) { setIsLocked(false); setEnteredPin(''); }
                     else if (val.length === 4) { setLockError(true); setTimeout(() => {setLockError(false); setEnteredPin('')}, 500); }
                  }} 
                  className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-indigo-600 transition-colors font-bold text-xl shadow-lg active:scale-95 col-start-2"
               >
                 0
               </button>
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden selection:bg-indigo-500/30 relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 flex items-center justify-between px-4 shadow-sm">
         <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-lg flex items-center justify-center text-white shadow-md">
                  <Home size={16} strokeWidth={3} />
               </div>
               <span className="font-serif font-bold text-lg text-slate-900 dark:text-white tracking-tight">DécorHub</span>
            </div>
         </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="w-[280px] shrink-0 hidden md:block h-full shadow-xl z-20">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          theme={theme}
          onToggleTheme={toggleTheme}
          syncStatus={isOnline ? syncStatus : 'offline'}
          onLock={() => setIsLocked(true)}
          businessName={businessProfile.name}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 animate-in slide-in-from-left duration-300 shadow-2xl flex flex-col">
             <Sidebar 
               currentView={currentView} 
               onViewChange={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }}
               theme={theme}
               onToggleTheme={toggleTheme}
               syncStatus={isOnline ? syncStatus : 'offline'}
               onLock={() => setIsLocked(true)}
               onClose={() => setIsMobileMenuOpen(false)}
               businessName={businessProfile.name}
             />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth pt-16 md:pt-0">
        <div className="min-h-full p-4 md:p-8 lg:p-12 pb-32">
          {currentView === 'dashboard' && <Dashboard products={products} sales={sales} customers={customers} suppliers={suppliers} expenses={expenses} returns={returns} logs={logs} onNavigate={setCurrentView} theme={theme} />}
          {currentView === 'spreadsheet' && <SpreadsheetView products={products} sales={sales} customers={customers} suppliers={suppliers} expenses={expenses} onUpdateProduct={handleUpdateProduct} />}
          {currentView === 'inventory' && <Inventory products={products} suppliers={suppliers} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} canUndo={false} canRedo={false} onUndo={() => {}} onRedo={() => {}} notify={showToast} />}
          {currentView === 'procurement' && <PurchaseOrders purchaseOrders={purchaseOrders} products={products} suppliers={suppliers} onCreatePO={handleCreatePO} onReceivePO={handleReceivePO} companyProfile={businessProfile} />}
          {currentView === 'sales' && <Sales sales={sales} products={products} customers={customers} onAddSale={handleAddSale} onUpdateSale={handleUpdateSale} onDeleteSale={handleDeleteSale} onAddCustomer={handleAddCustomer} onUndo={() => {}} onRedo={() => {}} onCommit={() => {}} canUndo={false} canRedo={false} isDirty={false} companyProfile={businessProfile} notify={showToast} />}
          {currentView === 'customers' && <Customers customers={customers} sales={sales} onAdd={handleAddCustomer} onUpdate={handleUpdateCustomer} onDelete={handleDeleteCustomer} canUndo={false} canRedo={false} onUndo={() => {}} onRedo={() => {}} />}
          {currentView === 'suppliers' && <Suppliers suppliers={suppliers} products={products} onAdd={handleAddSupplier} onUpdate={handleUpdateSupplier} onDelete={handleDeleteSupplier} canUndo={false} canRedo={false} onUndo={() => {}} onRedo={() => {}} />}
          {currentView === 'expenses' && <Expenses expenses={expenses} onAdd={handleAddExpense} onUpdate={handleUpdateExpense} onDelete={handleDeleteExpense} />}
          {currentView === 'returns' && <Returns returns={returns} sales={sales} onAdd={handleAddReturn} onUpdateStatus={handleUpdateReturnStatus} onAddExpense={handleAddExpense} />}
          {currentView === 'reports' && <Reports sales={sales} products={products} customers={customers} expenses={expenses} returns={returns} periodSummaries={periodSummaries} onUpdateSummaries={handleUpdatePeriodSummaries} theme={theme} />}
          {currentView === 'calculator' && <PriceCalculator />}
          {currentView === 'tester' && <WorkflowTester onAddProduct={handleAddProduct} onAddSale={handleAddSale} onAddReturn={handleAddReturn} onUpdateReturnStatus={handleUpdateReturnStatus} onAddCustomer={handleAddCustomer} onAddSupplier={handleAddSupplier} onAddExpense={handleAddExpense} onUpdateSale={handleUpdateSale} onCreatePO={handleCreatePO} onReceivePO={handleReceivePO} onDeleteProduct={handleDeleteProduct} onDeleteSale={handleDeleteSale} onDeleteCustomer={handleDeleteCustomer} onDeleteSupplier={handleDeleteSupplier} onDeleteExpense={handleDeleteExpense} />}
          {currentView === 'advisor' && <Advisor products={products} sales={sales} />}
          {currentView === 'audit' && <AuditTrail logs={logs} />}
          {currentView === 'settings' && <Settings products={products} sales={sales} customers={customers} suppliers={suppliers} expenses={expenses} returns={returns} onFactoryReset={handleFactoryReset} businessProfile={businessProfile} onUpdateProfile={handleUpdateProfile} onUpdatePin={handleUpdatePin} />}
        </div>
      </main>
    </div>
  );
}

export default App;
