
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Sales } from './components/Sales';
import { Customers } from './components/Customers';
import { Suppliers } from './components/Suppliers';
import { Expenses } from './components/Expenses';
import { Returns } from './components/Returns';
import { WorkflowTester } from './components/WorkflowTester';
import { PriceCalculator } from './components/PriceCalculator';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Advisor } from './components/Advisor';
import { PurchaseOrders } from './components/PurchaseOrders';
import { FinalLedger } from './components/FinalLedger';
import { SpreadsheetView } from './components/SpreadsheetView';
import { AuditTrail } from './components/AuditTrail';
import { TutorialGuide } from './components/TutorialGuide';
import { ViewState, Product, Sale, Customer, AuditLog, Supplier, Expense, Return, SyncStatus, PurchaseOrder, PeriodSummary } from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, INITIAL_EXPENSES } from './constants';
import { ApiService } from './components/apiService';
import { Lock, Menu } from 'lucide-react';
import { ToastContainer, ToastMessage } from './components/Toast';

const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    (localStorage.getItem('hub_theme') as 'light' | 'dark') || 'light'
  );
  
  const [preSelectedOrderId, setPreSelectedOrderId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [periodSummaries, setPeriodSummaries] = useState<PeriodSummary[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  const stateRef = useRef({
    products, sales, customers, suppliers, expenses, returns, purchaseOrders
  });

  useEffect(() => {
    stateRef.current = { products, sales, customers, suppliers, expenses, returns, purchaseOrders };
  }, [products, sales, customers, suppliers, expenses, returns, purchaseOrders]);
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pin, setPin] = useState('1234');

  const [businessProfile, setBusinessProfile] = useState({
    name: 'TheDécorHub',
    address: 'Dhaka, Bangladesh',
    phone: '+880',
    email: 'admin@decorhub.com',
    logo: '', 
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
    const loadData = async () => {
      try {
        setSyncStatus('syncing');
        const [p, s, c, sup, e, r, po, sum, l] = await Promise.all([
          ApiService.fetchLatest('products'), ApiService.fetchLatest('sales'),
          ApiService.fetchLatest('customers'), ApiService.fetchLatest('suppliers'),
          ApiService.fetchLatest('expenses'), ApiService.fetchLatest('returns'),
          ApiService.fetchLatest('purchaseOrders'), ApiService.fetchLatest('period_summaries'),
          ApiService.fetchLatest('logs')
        ]);

        setProducts(p || INITIAL_PRODUCTS);
        setSales(s || []);
        setCustomers(c || INITIAL_CUSTOMERS);
        setSuppliers(sup || INITIAL_SUPPLIERS);
        setExpenses(e || INITIAL_EXPENSES);
        setReturns(r || []);
        setPurchaseOrders(po || []);
        setPeriodSummaries(sum || []);
        setLogs(l || []);

        setIsInitialized(true);
        setSyncStatus('synced');
      } catch (error) {
        setSyncStatus('error');
        showToast('System synchronization error', 'error');
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

  const adjustStock = (items: any[], direction: 'deduct' | 'restore') => {
    setProducts(prev => {
        const updatedProducts = [...prev];
        items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex > -1) {
            const product = { ...updatedProducts[productIndex] };
            const modifier = direction === 'deduct' ? -1 : 1;
            if (product.hasVariants && item.variantId) {
               const vIdx = product.variants?.findIndex(v => v.id === item.variantId);
               if (vIdx !== undefined && vIdx > -1 && product.variants) {
                 const variants = [...product.variants];
                 variants[vIdx] = { ...variants[vIdx], stockLevel: Math.max(0, variants[vIdx].stockLevel + (item.quantity * modifier)) };
                 product.variants = variants;
               }
            } else {
               product.stockLevel = Math.max(0, product.stockLevel + (item.quantity * modifier));
            }
            updatedProducts[productIndex] = product;
          }
        });
        ApiService.pushUpdate('products', updatedProducts);
        return updatedProducts;
    });
  };

  const handleAddReturn = (rma: Return) => {
    setReturns(prev => {
        const updated = [rma, ...prev];
        ApiService.pushUpdate('returns', updated);
        return updated;
    });
    logAction('New RMA', 'RMA', `Return logged for #${rma.orderId.slice(-6)}`, 'create');
  };

  const handleUpdateReturnStatus = (rma: Return, status: Return['status']) => {
    const { sales: curSales, products: curProducts } = stateRef.current;
    if (status === 'Approved' && rma.status !== 'Approved') {
        const sale = curSales.find(s => s.id === rma.orderId);
        if (sale) {
            // STOCK RESTORATION LOGIC
            if (rma.condition === 'Resellable') {
                adjustStock([{ productId: rma.productId, variantId: rma.variantId, quantity: rma.quantity }], 'restore');
            } else if (rma.condition === 'Damaged') {
                // DAMAGED ITEMS = EXPENSE (The investment is lost)
                const lossExp: Expense = {
                    id: `LOSS-${Date.now()}`, date: new Date().toISOString().split('T')[0], category: 'Inventory Loss',
                    description: `Damaged Return: ${rma.productName}`, amount: roundMoney(rma.unitCost * rma.quantity),
                    paymentMethod: 'Write-off', status: 'Paid', referenceId: rma.id
                };
                handleAddExpense(lossExp);
            }

            // DELIVERY LOSS LOGIC
            if (rma.isDeliveryRefused && (rma.deliveryLossAmount || 0) > 0) {
                const courierExp: Expense = {
                    id: `COURIER-${Date.now()}`, date: new Date().toISOString().split('T')[0], category: 'Logistics',
                    description: `Courier Loss on Refusal #${sale.id.slice(-6)}`, amount: rma.deliveryLossAmount || 0,
                    paymentMethod: 'System', status: 'Paid', referenceId: sale.id
                };
                handleAddExpense(courierExp);
            }

            // Update Sale Status based on qty
            const totalReturned = [...returns.filter(r => r.orderId === sale.id && r.status === 'Approved'), rma].reduce((a,b)=>a+b.quantity, 0);
            const totalItems = sale.items.reduce((a,b)=>a+b.quantity, 0);
            // Explicitly cast newSaleStatus to Sale['status'] to avoid string widening errors in setSales
            const newSaleStatus: Sale['status'] = totalReturned >= totalItems ? 'Returned' : 'Partially Returned';
            
            setSales(prev => {
                const updated = prev.map(s => s.id === sale.id ? { ...s, status: newSaleStatus } : s);
                ApiService.pushUpdate('sales', updated);
                return updated;
            });
        }
    }
    setReturns(prev => {
        const updated = prev.map(r => r.id === rma.id ? { ...r, status } : r);
        ApiService.pushUpdate('returns', updated);
        return updated;
    });
    showToast('RMA Processed', 'success');
  };

  const handleAddSale = (sale: Sale) => {
    setSales(prev => {
        const updated = [sale, ...prev];
        ApiService.pushUpdate('sales', updated);
        return updated;
    });
    if (sale.status === 'Delivered') {
        adjustStock(sale.items, 'deduct');
    }
    logAction('Create Order', 'Sales', `Order #${sale.id.slice(-6)}`, 'create');
    showToast('Order created', 'success');
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    const oldSale = stateRef.current.sales.find(s => s.id === updatedSale.id);
    if (!oldSale) return;
    
    if (updatedSale.status === 'Delivered' && oldSale.status !== 'Delivered') {
        adjustStock(updatedSale.items, 'deduct');
    } else if (oldSale.status === 'Delivered' && updatedSale.status === 'Cancelled') {
        adjustStock(oldSale.items, 'restore');
    }

    setSales(prev => {
        const updated = prev.map(s => s.id === updatedSale.id ? updatedSale : s);
        ApiService.pushUpdate('sales', updated);
        return updated;
    });
    showToast(`Order status: ${updatedSale.status}`, 'info');
  };

  const handleAddExpense = (exp: Expense) => {
    setExpenses(prev => {
        const updated = [exp, ...prev];
        ApiService.pushUpdate('expenses', updated);
        return updated;
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('hub_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!isInitialized) return <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-indigo-400 font-bold">Initializing ERP...</div>;

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 flex-col overflow-hidden">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {showTutorial && <TutorialGuide view={currentView} onClose={() => setShowTutorial(false)} />}
      
      {/* Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 flex items-center justify-between px-4 shadow-sm md:hidden">
         <button onClick={() => setIsSidebarOpen(true)} className="p-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg active:scale-95 transition-all">
            <Menu size={24} />
         </button>
         <span className="font-serif font-bold text-lg text-slate-900 dark:text-white">DécorHub</span>
         <div className="w-10"></div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 animate-in slide-in-from-left duration-300 shadow-2xl overflow-y-auto">
             <Sidebar 
               currentView={currentView} 
               onViewChange={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} 
               theme={theme} 
               onToggleTheme={toggleTheme} 
               syncStatus={syncStatus} 
               onLock={() => setIsLocked(true)} 
               onClose={() => setIsSidebarOpen(false)}
               onToggleTutorial={() => setShowTutorial(true)}
             />
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Persistent) */}
      <div className="hidden md:flex h-full fixed left-0 top-0 w-64 z-20">
         <Sidebar 
           currentView={currentView} 
           onViewChange={setCurrentView} 
           theme={theme} 
           onToggleTheme={toggleTheme} 
           syncStatus={syncStatus} 
           onLock={() => setIsLocked(true)} 
           onToggleTutorial={() => setShowTutorial(true)}
         />
      </div>

      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 md:pl-64 custom-scrollbar">
        <div className="p-4 md:p-8 pb-32 max-w-full mx-auto">
          {currentView === 'dashboard' && <Dashboard products={products} sales={sales} customers={customers} expenses={expenses} returns={returns} onNavigate={setCurrentView} theme={theme} businessProfile={businessProfile} />}
          {currentView === 'inventory' && <Inventory products={products} suppliers={suppliers} onAddProduct={(p)=> { setProducts([...products, p]); ApiService.pushUpdate('products', [...products, p]); }} onUpdateProduct={(p)=>{ const u = products.map(x=>x.id===p.id?p:x); setProducts(u); ApiService.pushUpdate('products', u); }} onDeleteProduct={(id)=> { const u = products.filter(x=>x.id!==id); setProducts(u); ApiService.pushUpdate('products', u); }} notify={showToast} />}
          {currentView === 'procurement' && <PurchaseOrders purchaseOrders={purchaseOrders} products={products} suppliers={suppliers} onCreatePO={(po)=>{ const u = [po, ...purchaseOrders]; setPurchaseOrders(u); ApiService.pushUpdate('purchaseOrders', u); }} onReceivePO={(po)=>{
             setProducts(prev => {
                const updated = [...prev];
                po.items.forEach(item => {
                    const idx = updated.findIndex(x => x.id === item.productId);
                    if(idx > -1) {
                        const p = {...updated[idx]};
                        p.stockLevel += item.quantity;
                        p.costPrice = roundMoney(((updated[idx].stockLevel * updated[idx].costPrice) + (item.quantity * item.unitCost)) / (updated[idx].stockLevel + item.quantity));
                        updated[idx] = p;
                    }
                });
                ApiService.pushUpdate('products', updated);
                return updated;
             });
             setPurchaseOrders(prev => {
                const u = prev.map(x => x.id === po.id ? ({...x, status: 'Received'} as PurchaseOrder) : x);
                ApiService.pushUpdate('purchaseOrders', u);
                return u;
             });
             showToast('Stock received into inventory', 'success');
          }} companyProfile={businessProfile} />}
          {currentView === 'sales' && <Sales sales={sales} products={products} customers={customers} onAddSale={handleAddSale} onUpdateSale={handleUpdateSale} onDeleteSale={(id)=>{ setSales(sales.filter(x=>x.id!==id)); ApiService.pushUpdate('sales', sales.filter(x=>x.id!==id)); }} onAddCustomer={(c)=>{ setCustomers([...customers, c]); ApiService.pushUpdate('customers', [...customers, c]); }} companyProfile={businessProfile} notify={showToast} onRequestReturn={setPreSelectedOrderId as any} returns={returns} />}
          {currentView === 'final_ledger' && <FinalLedger sales={sales} returns={returns} expenses={expenses} />}
          {currentView === 'spreadsheet' && <SpreadsheetView products={products} sales={sales} customers={customers} suppliers={suppliers} expenses={expenses} returns={returns} onUpdateProduct={(p)=>{ const u = products.map(x=>x.id===p.id?p:x); setProducts(u); ApiService.pushUpdate('products', u); }} />}
          {currentView === 'customers' && <Customers customers={customers} sales={sales} onAdd={(c)=>{ setCustomers([...customers, c]); ApiService.pushUpdate('customers', [...customers, c]); }} onUpdate={(c)=>{ const u = customers.map(x=>x.id===c.id?c:x); setCustomers(u); ApiService.pushUpdate('customers', u); }} onDelete={(id)=>{ setCustomers(customers.filter(x=>x.id!==id)); ApiService.pushUpdate('customers', customers.filter(x=>x.id!==id)); }} />}
          {currentView === 'suppliers' && <Suppliers suppliers={suppliers} products={products} onAdd={(s)=>{ setSuppliers([...suppliers, s]); ApiService.pushUpdate('suppliers', [...suppliers, s]); }} onUpdate={(s)=>{ const u = suppliers.map(x=>x.id===s.id?s:x); setSuppliers(u); ApiService.pushUpdate('suppliers', u); }} onDelete={(id)=>{ setSuppliers(suppliers.filter(x=>x.id!==id)); ApiService.pushUpdate('suppliers', suppliers.filter(x=>x.id!==id)); }} />}
          {currentView === 'expenses' && <Expenses expenses={expenses} onAdd={handleAddExpense} onUpdate={(e)=>{ const u = expenses.map(x=>x.id===e.id?e:x); setExpenses(u); ApiService.pushUpdate('expenses', u); }} onDelete={(id)=>{ const u = expenses.filter(x=>x.id!==id); setExpenses(u); ApiService.pushUpdate('expenses', u); }} />}
          {currentView === 'returns' && <Returns returns={returns} sales={sales} onAdd={handleAddReturn} onUpdateStatus={handleUpdateReturnStatus} onAddExpense={handleAddExpense} preSelectedOrderId={preSelectedOrderId} />}
          {currentView === 'reports' && <Reports sales={sales} products={products} customers={customers} expenses={expenses} returns={returns} theme={theme} />}
          {currentView === 'calculator' && <PriceCalculator products={products} onUpdateProduct={(p)=>{ const u = products.map(x=>x.id===p.id?p:x); setProducts(u); ApiService.pushUpdate('products', u); }} />}
          {currentView === 'advisor' && <Advisor products={products} sales={sales} />}
          {currentView === 'tester' && <WorkflowTester 
            onAddProduct={(p)=> { setProducts(prev => { const u = [p, ...prev]; ApiService.pushUpdate('products', u); return u; }); }} 
            onAddSale={handleAddSale} 
            onUpdateSale={handleUpdateSale} 
            onAddReturn={handleAddReturn} 
            onUpdateReturnStatus={handleUpdateReturnStatus}
            onAddCustomer={(c)=> { setCustomers(prev => { const u = [c, ...prev]; ApiService.pushUpdate('customers', u); return u; }); }}
            onAddSupplier={(s)=> { setSuppliers(prev => { const u = [s, ...prev]; ApiService.pushUpdate('suppliers', u); return u; }); }}
            onAddExpense={handleAddExpense}
            onCreatePO={(po)=> { setPurchaseOrders(prev => { const u = [po, ...prev]; ApiService.pushUpdate('purchaseOrders', u); return u; }); }}
            onReceivePO={(po)=> { 
               setProducts(prev => {
                  const updated = [...prev];
                  po.items.forEach(item => {
                      const idx = updated.findIndex(x => x.id === item.productId);
                      if(idx > -1) {
                          const p = {...updated[idx]};
                          p.stockLevel += item.quantity;
                          p.costPrice = roundMoney(((updated[idx].stockLevel * updated[idx].costPrice) + (item.quantity * item.unitCost)) / (updated[idx].stockLevel + item.quantity));
                          updated[idx] = p;
                      }
                  });
                  ApiService.pushUpdate('products', updated);
                  return updated;
               });
               setPurchaseOrders(prev => {
                  const u = prev.map(x => x.id === po.id ? ({...x, status: 'Received'} as PurchaseOrder) : x);
                  ApiService.pushUpdate('purchaseOrders', u);
                  return u;
               });
            }}
            onDeleteProduct={(id)=> { setProducts(prev => { const u = prev.filter(x=>x.id!==id); ApiService.pushUpdate('products', u); return u; }); }}
            onDeleteSale={(id)=> { setSales(prev => { const u = prev.filter(x=>x.id!==id); ApiService.pushUpdate('sales', u); return u; }); }}
            onDeleteCustomer={(id)=> { setCustomers(prev => { const u = prev.filter(x=>x.id!==id); ApiService.pushUpdate('customers', u); return u; }); }}
            onDeleteSupplier={(id)=> { setSuppliers(prev => { const u = prev.filter(x=>x.id!==id); ApiService.pushUpdate('suppliers', u); return u; }); }}
            onDeleteExpense={(id)=> { setExpenses(prev => { const u = prev.filter(x=>x.id!==id); ApiService.pushUpdate('expenses', u); return u; }); }}
            onDeleteReturn={(id)=> { setReturns(prev => { const u = prev.filter(x=>x.id!==id); ApiService.pushUpdate('returns', u); return u; }); }}
            onDeletePO={(id)=> { setPurchaseOrders(prev => { const u = prev.filter(x=>x.id!==id); ApiService.pushUpdate('purchaseOrders', u); return u; }); }}
          />}
          {currentView === 'audit' && <AuditTrail logs={logs} />}
          {currentView === 'settings' && <Settings products={products} sales={sales} customers={customers} suppliers={suppliers} expenses={expenses} returns={returns} onFactoryReset={()=>{ ApiService.clearAll(); localStorage.clear(); window.location.reload(); }} onPurgeSales={()=>{ setSales([]); ApiService.pushUpdate('sales', []); }} onPurgeInventory={()=>{ setProducts([]); ApiService.pushUpdate('products', []); }} businessProfile={businessProfile} onUpdateProfile={(p)=>{ setBusinessProfile(p); localStorage.setItem('hub_profile', JSON.stringify(p)); }} onUpdatePin={(p)=>setPin(p)} />}
        </div>
      </main>
    </div>
  );
}

export default App;
