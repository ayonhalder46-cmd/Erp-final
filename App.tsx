
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
import { ViewState, Product, Sale, Customer, AuditLog, Supplier, Expense, Return, SyncStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, INITIAL_EXPENSES } from './constants';
import { ApiService } from './components/apiService';
import { Lock, Unlock } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
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
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  // System State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Refs for State Access in Async Closures (Fixes Stale Closure Issues)
  const productsRef = useRef(products);
  const salesRef = useRef(sales);
  const customersRef = useRef(customers);
  const returnsRef = useRef(returns);

  // Security & Profile State
  const [pin, setPin] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [lockError, setLockError] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    name: 'TheDécorHub',
    address: 'Dhaka, Bangladesh',
    phone: '+880',
    email: 'admin@decorhub.com'
  });

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
    // Keep refs synced with state
    productsRef.current = products;
    salesRef.current = sales;
    customersRef.current = customers;
    returnsRef.current = returns;
  }, [products, sales, customers, returns]);

  useEffect(() => {
    // Network listeners
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // Load Security & Profile Settings from LocalStorage (Sync)
    const storedPin = localStorage.getItem('hub_pin') || '1234';
    setPin(storedPin);
    
    const storedProfile = localStorage.getItem('hub_profile');
    if (storedProfile) {
      setBusinessProfile(JSON.parse(storedProfile));
    }

    const loadData = async () => {
      try {
        setSyncStatus('syncing');
        
        const [
          fetchedProducts,
          fetchedSales,
          fetchedCustomers,
          fetchedSuppliers,
          fetchedExpenses,
          fetchedReturns,
          fetchedLogs
        ] = await Promise.all([
          ApiService.fetchLatest('products'),
          ApiService.fetchLatest('sales'),
          ApiService.fetchLatest('customers'),
          ApiService.fetchLatest('suppliers'),
          ApiService.fetchLatest('expenses'),
          ApiService.fetchLatest('returns'),
          ApiService.fetchLatest('logs')
        ]);

        if (fetchedProducts) setProducts(fetchedProducts);
        else setProducts(INITIAL_PRODUCTS);

        if (fetchedSales) setSales(fetchedSales);
        
        if (fetchedCustomers) setCustomers(fetchedCustomers);
        else setCustomers(INITIAL_CUSTOMERS);

        if (fetchedSuppliers) setSuppliers(fetchedSuppliers);
        else setSuppliers(INITIAL_SUPPLIERS);

        if (fetchedExpenses) setExpenses(fetchedExpenses);
        else setExpenses(INITIAL_EXPENSES);

        if (fetchedReturns) setReturns(fetchedReturns);
        
        if (fetchedLogs) setLogs(fetchedLogs);

        setIsInitialized(true);
        setSyncStatus('synced');
      } catch (error) {
        console.error("Failed to load data", error);
        setSyncStatus('error');
      }
    };

    loadData();

    // Setup broadcast listener for multi-tab sync
    ApiService.onSync((entity, data) => {
      if (entity === 'products') setProducts(data);
      if (entity === 'sales') setSales(data);
      if (entity === 'customers') setCustomers(data);
      if (entity === 'suppliers') setSuppliers(data);
      if (entity === 'expenses') setExpenses(data);
      if (entity === 'returns') setReturns(data);
      if (entity === 'logs') setLogs(data);
    });

  }, []);

  const handleUpdateProfile = (newProfile: typeof businessProfile) => {
    setBusinessProfile(newProfile);
    localStorage.setItem('hub_profile', JSON.stringify(newProfile));
    logAction('Update Profile', 'System', 'Updated business contact details');
  };

  const handleUpdatePin = (newPin: string) => {
    setPin(newPin);
    localStorage.setItem('hub_pin', newPin);
    logAction('Update PIN', 'Security', 'Changed access PIN');
  };

  const handleFactoryReset = async () => {
    setIsResetting(true);
    await ApiService.clearAll();
    localStorage.clear();
    window.location.reload();
  };

  // --- Handlers with Functional State Updates to Prevent Stale Closures ---

  const handleAddProduct = (product: Product) => {
    setProducts(prev => {
        const updated = [...prev, product];
        ApiService.pushUpdate('products', updated);
        return updated;
    });
    logAction('Create Product', 'Inventory', `Added SKU: ${product.sku}`, 'create');
  };

  const handleUpdateProduct = (product: Product) => {
    setProducts(prev => {
        const updated = prev.map(p => p.id === product.id ? product : p);
        ApiService.pushUpdate('products', updated);
        return updated;
    });
    logAction('Update Product', 'Inventory', `Updated SKU: ${product.sku}`);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => {
        const p = prev.find(i => i.id === id);
        const updated = prev.filter(p => p.id !== id);
        ApiService.pushUpdate('products', updated);
        if(p) logAction('Delete Product', 'Inventory', `Removed SKU: ${p.sku}`, 'delete');
        return updated;
    });
  };

  const handleAddSale = (sale: Sale) => {
    setSales(prev => {
        const updatedSales = [sale, ...prev];
        ApiService.pushUpdate('sales', updatedSales);
        return updatedSales;
    });
    
    setProducts(prev => {
        const updatedProducts = [...prev];
        sale.items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex > -1) {
            const product = { ...updatedProducts[productIndex] };
            if (product.hasVariants && item.variantId) {
               const variantIndex = product.variants?.findIndex(v => v.id === item.variantId);
               if (variantIndex !== undefined && variantIndex > -1 && product.variants) {
                 const variants = [...product.variants];
                 variants[variantIndex] = { ...variants[variantIndex], stockLevel: variants[variantIndex].stockLevel - item.quantity };
                 product.variants = variants;
               }
            } else {
               product.stockLevel -= item.quantity;
            }
            updatedProducts[productIndex] = product;
          }
        });
        ApiService.pushUpdate('products', updatedProducts);
        return updatedProducts;
    });

    setCustomers(prev => {
        const updatedCustomers = prev.map(c => {
          if (c.id === sale.customerId) {
            return { 
              ...c, 
              totalSpent: c.totalSpent + sale.totalAmount,
              lastPurchaseDate: sale.date 
            };
          }
          return c;
        });
        ApiService.pushUpdate('customers', updatedCustomers);
        return updatedCustomers;
    });
    
    logAction('Create Order', 'Sales', `Processed Order #${sale.id.slice(-6)}`, 'create');
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    setSales(prev => {
        const updatedSales = prev.map(s => s.id === updatedSale.id ? updatedSale : s);
        ApiService.pushUpdate('sales', updatedSales);
        return updatedSales;
    });
    logAction('Update Order', 'Sales', `Updated Status #${updatedSale.id.slice(-6)} to ${updatedSale.status}`);
  };

  const handleDeleteSale = (id: string) => {
    // Access latest sales from ref to avoid stale closure if multiple ops happen quickly
    const sale = salesRef.current.find(s => s.id === id);
    if (!sale) return;

    setProducts(prev => {
        const updatedProducts = [...prev];
        if (sale.status !== 'Cancelled') {
          sale.items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex > -1) {
              const product = { ...updatedProducts[productIndex] };
              if (product.hasVariants && item.variantId) {
                 const variantIndex = product.variants?.findIndex(v => v.id === item.variantId);
                 if (variantIndex !== undefined && variantIndex > -1 && product.variants) {
                   const variants = [...product.variants];
                   variants[variantIndex] = { ...variants[variantIndex], stockLevel: variants[variantIndex].stockLevel + item.quantity };
                   product.variants = variants;
                 }
              } else {
                 product.stockLevel += item.quantity;
              }
              updatedProducts[productIndex] = product;
            }
          });
        }
        ApiService.pushUpdate('products', updatedProducts);
        return updatedProducts;
    });

    setSales(prev => {
        const updatedSales = prev.filter(s => s.id !== id);
        ApiService.pushUpdate('sales', updatedSales);
        return updatedSales;
    });
    
    setCustomers(prev => {
        const updatedCustomers = prev.map(c => {
          if (c.id === sale.customerId) {
            return { ...c, totalSpent: c.totalSpent - sale.totalAmount };
          }
          return c;
        });
        ApiService.pushUpdate('customers', updatedCustomers);
        return updatedCustomers;
    });

    logAction('Delete Order', 'Sales', `Voided Order #${sale.id.slice(-6)}`, 'delete');
  };

  const handleAddCustomer = (customer: Customer) => {
    setCustomers(prev => {
        const updated = [customer, ...prev];
        ApiService.pushUpdate('customers', updated);
        return updated;
    });
    logAction('Add Client', 'CRM', `Registered ${customer.name}`, 'create');
  };

  const handleUpdateCustomer = (customer: Customer) => {
    setCustomers(prev => {
        const updated = prev.map(c => c.id === customer.id ? customer : c);
        ApiService.pushUpdate('customers', updated);
        return updated;
    });
    logAction('Update Client', 'CRM', `Modified profile: ${customer.name}`);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => {
        const c = prev.find(x => x.id === id);
        const updated = prev.filter(cust => cust.id !== id);
        ApiService.pushUpdate('customers', updated);
        if(c) logAction('Delete Client', 'CRM', `Removed profile: ${c.name}`, 'delete');
        return updated;
    });
  };

  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers(prev => {
        const updated = [supplier, ...prev];
        ApiService.pushUpdate('suppliers', updated);
        return updated;
    });
    logAction('Add Supplier', 'SCM', `Registered ${supplier.name}`, 'create');
  };

  const handleUpdateSupplier = (supplier: Supplier) => {
    setSuppliers(prev => {
        const updated = prev.map(s => s.id === supplier.id ? supplier : s);
        ApiService.pushUpdate('suppliers', updated);
        return updated;
    });
    logAction('Update Supplier', 'SCM', `Modified: ${supplier.name}`);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(prev => {
        const s = prev.find(x => x.id === id);
        const updated = prev.filter(sup => sup.id !== id);
        ApiService.pushUpdate('suppliers', updated);
        if(s) logAction('Delete Supplier', 'SCM', `Removed: ${s.name}`, 'delete');
        return updated;
    });
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => {
        const updated = [expense, ...prev];
        ApiService.pushUpdate('expenses', updated);
        return updated;
    });
    logAction('Add Expense', 'Finance', `Logged ${expense.category}: ৳${expense.amount}`, 'create');
  };

  const handleUpdateExpense = (expense: Expense) => {
    setExpenses(prev => {
        const updated = prev.map(e => e.id === expense.id ? expense : e);
        ApiService.pushUpdate('expenses', updated);
        return updated;
    });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => {
        const updated = prev.filter(e => e.id !== id);
        ApiService.pushUpdate('expenses', updated);
        return updated;
    });
    logAction('Delete Expense', 'Finance', `Removed record ID: ${id.slice(-4)}`, 'delete');
  };

  const handleAddReturn = (rma: Return) => {
    setReturns(prev => {
        const updatedReturns = [rma, ...prev];
        ApiService.pushUpdate('returns', updatedReturns);
        return updatedReturns;
    });
    logAction('Create Return', 'RMA', `Opened Ticket for Order #${rma.orderId.slice(-6)}`, 'create');
  };

  const handleUpdateReturnStatus = (id: string, status: Return['status']) => {
    // CRITICAL FIX: Use returnsRef to access the latest state inside the closure.
    // This prevents the "stale closure" bug where the function execution sees an old version of 'returns'.
    const rma = returnsRef.current.find(r => r.id === id);
    
    if (!rma) {
        console.error("Critical: RMA not found in current state context", id);
        return;
    }

    if (status === 'Approved' && rma.status !== 'Approved') {
       if (rma.condition === 'Resellable') {
         setProducts(prev => {
             const updatedProducts = [...prev];
             const productIndex = updatedProducts.findIndex(p => p.id === rma.productId);
             if (productIndex > -1) {
               const product = { ...updatedProducts[productIndex] };
               if (product.hasVariants && rma.variantId) {
                  const vIndex = product.variants?.findIndex(v => v.id === rma.variantId);
                  if (vIndex !== undefined && vIndex > -1 && product.variants) {
                     const variants = [...product.variants];
                     variants[vIndex] = { ...variants[vIndex], stockLevel: variants[vIndex].stockLevel + rma.quantity };
                     product.variants = variants;
                  }
               } else {
                  product.stockLevel += rma.quantity;
               }
               updatedProducts[productIndex] = product;
             }
             ApiService.pushUpdate('products', updatedProducts);
             return updatedProducts;
         });
       }
       
       setCustomers(prev => {
           const updatedCustomers = prev.map(c => {
             // Using name match as fallback if ID mismatch, but strictly ID is better if consistent
             // The logic was checking name in previous iteration, let's keep it but ideally use ID
             if (c.name === rma.customerName) { 
               return { ...c, totalSpent: c.totalSpent - rma.refundAmount };
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
                ? `${updatedSale.notes} | Return Approved (RMA: ${rma.id.slice(-4)})` 
                : `Return Approved (RMA: ${rma.id.slice(-4)})`;
              
              const newSales = [...prev];
              newSales[saleIndex] = updatedSale;
              ApiService.pushUpdate('sales', newSales);
              return newSales;
           }
           return prev;
       });
    }

    setReturns(prev => {
        const rmaIndex = prev.findIndex(r => r.id === id);
        if (rmaIndex === -1) return prev;
        const updatedReturns = [...prev];
        updatedReturns[rmaIndex] = { ...updatedReturns[rmaIndex], status };
        ApiService.pushUpdate('returns', updatedReturns);
        return updatedReturns;
    });
    
    logAction('Update Return', 'RMA', `Set Ticket #${id.slice(-6)} to ${status}`);
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
                       // Checking immediately state won't update fast enough in strict mode, but logic here for UX
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
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden selection:bg-indigo-500/30">
      <div className="w-[280px] shrink-0 hidden md:block">
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

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
        <div className="min-h-full p-4 md:p-8 lg:p-12 pb-24">
          {currentView === 'dashboard' && <Dashboard products={products} sales={sales} customers={customers} suppliers={suppliers} expenses={expenses} returns={returns} logs={logs} onNavigate={setCurrentView} theme={theme} />}
          {currentView === 'spreadsheet' && <SpreadsheetView products={products} sales={sales} customers={customers} suppliers={suppliers} expenses={expenses} onUpdateProduct={handleUpdateProduct} />}
          {currentView === 'inventory' && <Inventory products={products} suppliers={suppliers} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} canUndo={false} canRedo={false} onUndo={() => {}} onRedo={() => {}} />}
          {currentView === 'sales' && <Sales sales={sales} products={products} customers={customers} onAddSale={handleAddSale} onUpdateSale={handleUpdateSale} onDeleteSale={handleDeleteSale} onAddCustomer={handleAddCustomer} onUndo={() => {}} onRedo={() => {}} onCommit={() => {}} canUndo={false} canRedo={false} isDirty={false} companyProfile={businessProfile} />}
          {currentView === 'customers' && <Customers customers={customers} sales={sales} onAdd={handleAddCustomer} onUpdate={handleUpdateCustomer} onDelete={handleDeleteCustomer} canUndo={false} canRedo={false} onUndo={() => {}} onRedo={() => {}} />}
          {currentView === 'suppliers' && <Suppliers suppliers={suppliers} products={products} onAdd={handleAddSupplier} onUpdate={handleUpdateSupplier} onDelete={handleDeleteSupplier} canUndo={false} canRedo={false} onUndo={() => {}} onRedo={() => {}} />}
          {currentView === 'expenses' && <Expenses expenses={expenses} onAdd={handleAddExpense} onUpdate={handleUpdateExpense} onDelete={handleDeleteExpense} />}
          {currentView === 'returns' && <Returns returns={returns} sales={sales} onAdd={handleAddReturn} onUpdateStatus={handleUpdateReturnStatus} />}
          {currentView === 'reports' && <Reports sales={sales} products={products} customers={customers} expenses={expenses} returns={returns} theme={theme} />}
          {currentView === 'calculator' && <PriceCalculator />}
          {currentView === 'tester' && <WorkflowTester onAddProduct={handleAddProduct} onAddSale={handleAddSale} onAddReturn={handleAddReturn} onUpdateReturnStatus={handleUpdateReturnStatus} onAddCustomer={handleAddCustomer} onAddSupplier={handleAddSupplier} onAddExpense={handleAddExpense} onDeleteProduct={handleDeleteProduct} onDeleteSale={handleDeleteSale} onDeleteCustomer={handleDeleteCustomer} onDeleteSupplier={handleDeleteSupplier} onDeleteExpense={handleDeleteExpense} />}
          {currentView === 'advisor' && <Advisor products={products} sales={sales} />}
          {currentView === 'audit' && <AuditTrail logs={logs} />}
          {currentView === 'settings' && <Settings products={products} sales={sales} customers={customers} suppliers={suppliers} expenses={expenses} returns={returns} onFactoryReset={handleFactoryReset} businessProfile={businessProfile} onUpdateProfile={handleUpdateProfile} onUpdatePin={handleUpdatePin} />}
        </div>
      </main>
    </div>
  );
}

export default App;
