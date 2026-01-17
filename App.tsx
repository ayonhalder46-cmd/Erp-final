
import React, { useState, useEffect, useCallback } from 'react';
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

const MAX_HISTORY = 50;

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
  const [history, setHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs in memory
    ApiService.pushUpdate('logs', [newLog, ...logs].slice(0, 100));
  }, [logs, isResetting]);

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

  // Generic Update Handler
  const updateData = async <T,>(
    setter: React.Dispatch<React.SetStateAction<T[]>>, 
    entity: string, 
    newData: T[]
  ) => {
    setter(newData);
    await ApiService.pushUpdate(entity, newData);
    setSyncStatus('synced');
  };

  // --- Handlers ---

  const handleAddProduct = (product: Product) => {
    const updated = [...products, product];
    updateData(setProducts, 'products', updated);
    logAction('Create Product', 'Inventory', `Added SKU: ${product.sku}`, 'create');
  };

  const handleUpdateProduct = (product: Product) => {
    const updated = products.map(p => p.id === product.id ? product : p);
    updateData(setProducts, 'products', updated);
    logAction('Update Product', 'Inventory', `Updated SKU: ${product.sku}`);
  };

  const handleDeleteProduct = (id: string) => {
    const p = products.find(i => i.id === id);
    const updated = products.filter(p => p.id !== id);
    updateData(setProducts, 'products', updated);
    logAction('Delete Product', 'Inventory', `Removed SKU: ${p?.sku}`, 'delete');
  };

  const handleAddSale = (sale: Sale) => {
    const updatedSales = [sale, ...sales];
    updateData(setSales, 'sales', updatedSales);
    
    // Update inventory
    const updatedProducts = [...products];
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
    updateData(setProducts, 'products', updatedProducts);

    // Update Customer LTV
    const updatedCustomers = customers.map(c => {
      if (c.id === sale.customerId) {
        return { 
          ...c, 
          totalSpent: c.totalSpent + sale.totalAmount,
          lastPurchaseDate: sale.date 
        };
      }
      return c;
    });
    updateData(setCustomers, 'customers', updatedCustomers);
    
    logAction('Create Order', 'Sales', `Processed Order #${sale.id.slice(-6)}`, 'create');
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    // Note: This logic assumes simple status update, not changing items
    // Reverting stock logic is complex and usually requires a void/return flow
    const updatedSales = sales.map(s => s.id === updatedSale.id ? updatedSale : s);
    updateData(setSales, 'sales', updatedSales);
    logAction('Update Order', 'Sales', `Updated Status #${updatedSale.id.slice(-6)} to ${updatedSale.status}`);
  };

  const handleDeleteSale = (id: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;

    // Restore Inventory
    const updatedProducts = [...products];
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
      updateData(setProducts, 'products', updatedProducts);
    }

    const updatedSales = sales.filter(s => s.id !== id);
    updateData(setSales, 'sales', updatedSales);
    
    // Revert Customer LTV
    const updatedCustomers = customers.map(c => {
      if (c.id === sale.customerId) {
        return { ...c, totalSpent: c.totalSpent - sale.totalAmount };
      }
      return c;
    });
    updateData(setCustomers, 'customers', updatedCustomers);

    logAction('Delete Order', 'Sales', `Voided Order #${sale.id.slice(-6)}`, 'delete');
  };

  const handleAddCustomer = (customer: Customer) => {
    const updated = [customer, ...customers];
    updateData(setCustomers, 'customers', updated);
    logAction('Add Client', 'CRM', `Registered ${customer.name}`, 'create');
  };

  const handleUpdateCustomer = (customer: Customer) => {
    const updated = customers.map(c => c.id === customer.id ? customer : c);
    updateData(setCustomers, 'customers', updated);
    logAction('Update Client', 'CRM', `Modified profile: ${customer.name}`);
  };

  const handleDeleteCustomer = (id: string) => {
    const c = customers.find(x => x.id === id);
    const updated = customers.filter(c => c.id !== id);
    updateData(setCustomers, 'customers', updated);
    logAction('Delete Client', 'CRM', `Removed profile: ${c?.name}`, 'delete');
  };

  const handleAddSupplier = (supplier: Supplier) => {
    const updated = [supplier, ...suppliers];
    updateData(setSuppliers, 'suppliers', updated);
    logAction('Add Supplier', 'SCM', `Registered ${supplier.name}`, 'create');
  };

  const handleUpdateSupplier = (supplier: Supplier) => {
    const updated = suppliers.map(s => s.id === supplier.id ? supplier : s);
    updateData(setSuppliers, 'suppliers', updated);
    logAction('Update Supplier', 'SCM', `Modified: ${supplier.name}`);
  };

  const handleDeleteSupplier = (id: string) => {
    const s = suppliers.find(x => x.id === id);
    const updated = suppliers.filter(s => s.id !== id);
    updateData(setSuppliers, 'suppliers', updated);
    logAction('Delete Supplier', 'SCM', `Removed: ${s?.name}`, 'delete');
  };

  const handleAddExpense = (expense: Expense) => {
    const updated = [expense, ...expenses];
    updateData(setExpenses, 'expenses', updated);
    logAction('Add Expense', 'Finance', `Logged ${expense.category}: ৳${expense.amount}`, 'create');
  };

  const handleUpdateExpense = (expense: Expense) => {
    const updated = expenses.map(e => e.id === expense.id ? expense : e);
    updateData(setExpenses, 'expenses', updated);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    updateData(setExpenses, 'expenses', updated);
    logAction('Delete Expense', 'Finance', `Removed record ID: ${id.slice(-4)}`, 'delete');
  };

  const handleAddReturn = (rma: Return) => {
    const updatedReturns = [rma, ...returns];
    updateData(setReturns, 'returns', updatedReturns);
    logAction('Create Return', 'RMA', `Opened Ticket for Order #${rma.orderId.slice(-6)}`, 'create');
  };

  const handleUpdateReturnStatus = (id: string, status: Return['status']) => {
    const rmaIndex = returns.findIndex(r => r.id === id);
    if (rmaIndex === -1) return;
    const rma = returns[rmaIndex];

    // Restock logic if approved
    if (status === 'Approved' && rma.status !== 'Approved') {
       // Only restock physical inventory if resellable
       if (rma.condition === 'Resellable') {
         const updatedProducts = [...products];
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
           updateData(setProducts, 'products', updatedProducts);
         }
       }
       
       // Deduct LTV from Customer Profile
       const updatedCustomers = customers.map(c => {
         if (c.name === rma.customerName) { // Simplified matching
           return { ...c, totalSpent: c.totalSpent - rma.refundAmount };
         }
         return c;
       });
       updateData(setCustomers, 'customers', updatedCustomers);

       // Annotate Original Sales Entry
       const saleIndex = sales.findIndex(s => s.id === rma.orderId);
       if (saleIndex > -1) {
          const updatedSale = { ...sales[saleIndex] };
          updatedSale.notes = updatedSale.notes 
            ? `${updatedSale.notes} | Return Approved (RMA: ${rma.id.slice(-4)})` 
            : `Return Approved (RMA: ${rma.id.slice(-4)})`;
          
          const newSales = [...sales];
          newSales[saleIndex] = updatedSale;
          updateData(setSales, 'sales', newSales);
       }
    }

    const updatedReturns = [...returns];
    updatedReturns[rmaIndex] = { ...rma, status };
    updateData(setReturns, 'returns', updatedReturns);
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
