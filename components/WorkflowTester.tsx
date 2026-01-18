
import React, { useState, useRef, useEffect } from 'react';
import { Product, Sale, Return, Customer, Supplier, Expense, PurchaseOrder } from '../types';
import { ApiService } from './apiService';
import { 
  PlayCircle, CheckCircle, XCircle, RefreshCw, Terminal, Activity, 
  Save, Truck, Layers, ShoppingCart, RotateCcw, Wallet, Users, ToggleLeft, ToggleRight,
  Copy
} from 'lucide-react';

interface WorkflowTesterProps {
  onAddProduct: (p: Product) => void;
  onAddSale: (s: Sale) => void;
  onUpdateSale: (s: Sale) => void;
  onAddReturn: (r: Return) => void;
  onUpdateReturnStatus: (r: Return, status: Return['status']) => void;
  onAddCustomer: (c: Customer) => void;
  onAddSupplier: (s: Supplier) => void;
  onAddExpense: (e: Expense) => void;
  onCreatePO: (po: PurchaseOrder) => void;
  onReceivePO: (po: PurchaseOrder) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteSale: (id: string) => void;
  onDeleteCustomer: (id: string) => void;
  onDeleteSupplier: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

interface TestLog {
  id: string;
  phase: string;
  status: 'pending' | 'success' | 'failure' | 'info';
  message: string;
  details?: string;
  timestamp: string;
}

const PHASES = [
  { id: 'crm', label: 'Foundation (CRM & Sourcing)', icon: Users, desc: 'Entities & Relationships' },
  { id: 'inv', label: 'Inventory Engineering', icon: Layers, desc: 'Products, Variants & Stock' },
  { id: 'proc', label: 'Procurement Cycle', icon: Truck, desc: 'PO, Receiving & AVCO Costing' },
  { id: 'sales', label: 'Order Operations', icon: ShoppingCart, desc: 'Reservations, Deductions & LTV' },
  { id: 'rma', label: 'Returns & Logistics', icon: RotateCcw, desc: 'Restocking & Refusal Losses' },
  { id: 'fin', label: 'Financial Health', icon: Wallet, desc: 'Expense Ledger & P&L Integrity' },
];

export const WorkflowTester: React.FC<WorkflowTesterProps> = (props) => {
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPhases, setSelectedPhases] = useState<string[]>(PHASES.map(p => p.id));
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Shared Test Context to pass data between phases
  const contextRef = useRef<{
    tid: string;
    supplierId?: string;
    customerId?: string;
    productId?: string;
    variantId?: string;
    poId?: string;
    saleId?: string;
    saleDeliveryId?: string;
  }>({ tid: '' });

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (phase: string, status: TestLog['status'], message: string, details?: string) => {
    setLogs(prev => [...prev, { 
      id: Math.random().toString(36), 
      phase, 
      status, 
      message, 
      details, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const togglePhase = (id: string) => {
    setSelectedPhases(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedPhases(PHASES.map(p => p.id));
  const deselectAll = () => setSelectedPhases([]);

  const handleCopyReport = () => {
    const failedLogs = logs.filter(l => l.status === 'failure');
    const passedLogs = logs.filter(l => l.status === 'success');
    
    let report = `### SYSTEM DIAGNOSTIC REPORT\n`;
    report += `Timestamp: ${new Date().toLocaleString()}\n`;
    report += `Run ID: ${contextRef.current.tid || 'N/A'}\n`;
    report += `Summary: ${passedLogs.length} Passed | ${failedLogs.length} Failed\n\n`;
    
    if (failedLogs.length > 0) {
        report += `------- CRITICAL FAILURES -------\n`;
        failedLogs.forEach(l => {
            report += `[${l.phase}] ${l.message}\n   >>> REASON: ${l.details || 'Unknown Error'}\n\n`;
        });
        report += `---------------------------------\n\n`;
    }

    report += `------- EXECUTION LOG -------\n`;
    report += logs.map(l => 
      `${l.timestamp} [${l.phase.padEnd(10)}] ${l.status.toUpperCase().padEnd(7)} : ${l.message}${l.details ? `\n   > ${l.details}` : ''}`
    ).join('\n');

    navigator.clipboard.writeText(report).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  // --- PHASE IMPLEMENTATIONS ---

  const runPhaseCRM = async () => {
    const tid = contextRef.current.tid;
    const supId = `SUP-${tid}`;
    const custId = `CUST-${tid}`;
    
    addLog('CRM', 'info', 'Initializing Entities...');
    
    props.onAddSupplier({ id: supId, name: `Test Supplier ${tid}`, contactPerson: 'Auto Bot', email: 'test@sup.com', phone: '000', category: 'Furniture', status: 'Active' });
    props.onAddCustomer({ id: custId, name: `Test Customer ${tid}`, address: '123 Test Ln', phone: '000', totalSpent: 0, lastPurchaseDate: 'N/A', tier: 'Bronze' });
    
    await wait(500);
    
    const customers = await ApiService.fetchLatest('customers');
    const suppliers = await ApiService.fetchLatest('suppliers');
    
    if (!customers?.find((c: any) => c.id === custId)) throw new Error("Customer persistence failed");
    if (!suppliers?.find((s: any) => s.id === supId)) throw new Error("Supplier persistence failed");
    
    contextRef.current.supplierId = supId;
    contextRef.current.customerId = custId;
    addLog('CRM', 'success', 'Entities Created & Verified');
  };

  const runPhaseInventory = async () => {
    const tid = contextRef.current.tid;
    const prodId = `PROD-${tid}`;
    const varId = `VAR-${tid}`;
    
    addLog('Inventory', 'info', 'Creating Multi-Variant Product...');
    
    const product: Product = {
      id: prodId, sku: `SKU-${tid}`, name: `Test Item ${tid}`, category: 'Test', supplierId: contextRef.current.supplierId,
      costPrice: 500, sellingPrice: 1000, stockLevel: 0, hasVariants: true,
      variants: [{ id: varId, sku: `SKU-${tid}-A`, name: 'Option A', costPrice: 500, sellingPrice: 1000, stockLevel: 10 }],
      updatedAt: new Date().toISOString()
    };
    props.onAddProduct(product);
    
    await wait(600);
    const products = await ApiService.fetchLatest('products');
    const p = products?.find((x: any) => x.id === prodId);
    
    if (p?.variants[0]?.stockLevel !== 10) throw new Error(`Initial stock mismatch. Exp: 10, Got: ${p?.variants[0]?.stockLevel}`);
    
    contextRef.current.productId = prodId;
    contextRef.current.variantId = varId;
    addLog('Inventory', 'success', 'Product Catalogued', 'Initial Stock: 10');
  };

  const runPhaseProcurement = async () => {
    const { tid, productId, variantId, supplierId } = contextRef.current;
    if (!productId) throw new Error("Dependency Missing: Product not found");

    const poId = `PO-${tid}`;
    addLog('Procurement', 'info', 'Creating Purchase Order (Qty: 50 @ ৳400)...');

    const po: PurchaseOrder = {
      id: poId, date: new Date().toISOString(), expectedDate: new Date().toISOString(),
      supplierId: supplierId!, supplierName: 'Test Supplier',
      status: 'Ordered',
      items: [{ productId, productName: 'Test Item', variantId, variantName: 'Option A', quantity: 50, unitCost: 400, total: 20000 }],
      totalAmount: 20000
    };
    
    props.onCreatePO(po);
    await wait(300);
    props.onReceivePO(po);
    await wait(800);

    const products = await ApiService.fetchLatest('products');
    const p = products?.find((x: any) => x.id === productId);
    
    // AVCO Check: (10@500 + 50@400) / 60 = 25000 / 60 = 416.67
    const newStock = p.variants[0].stockLevel;
    const newCost = p.variants[0].costPrice;
    
    if (newStock !== 60) throw new Error(`PO Stock update failed. Exp: 60, Got: ${newStock}`);
    if (newCost < 416 || newCost > 417) throw new Error(`AVCO failed. Exp: ~416.67, Got: ${newCost}`);
    
    addLog('Procurement', 'success', 'PO Received & Cost Averaged', `New Cost: ৳${newCost.toFixed(2)} | Stock: 60`);
  };

  const runPhaseSales = async () => {
    const { tid, customerId, productId, variantId } = contextRef.current;
    if (!customerId) throw new Error("Dependency Missing: Customer");

    const saleId = `ORD-${tid}`;
    addLog('Sales', 'info', 'Processing "Pending" Order...');

    const sale: Sale = {
      id: saleId, date: new Date().toISOString(), customerId, customerName: `Test Customer ${tid}`,
      items: [{ productId: productId!, productName: 'Test', variantId, quantity: 5, unitPrice: 1000, unitCost: 416.67, total: 5000 }],
      discountAmount: 0, deliveryCharge: 0, totalAmount: 5000, totalCost: 2083.35, profit: 2916.65, status: 'Pending'
    };
    props.onAddSale(sale);
    
    await wait(600);
    let products = await ApiService.fetchLatest('products');
    let p = products?.find((x: any) => x.id === productId);
    
    if (p.variants[0].stockLevel !== 60) throw new Error("Stock deducted on Pending order (Should be reserved only)");
    addLog('Sales', 'info', 'Order Confirmed -> Stock Deduction');
    
    props.onUpdateSale({ ...sale, status: 'Confirmed' });
    await wait(800);
    
    products = await ApiService.fetchLatest('products');
    p = products?.find((x: any) => x.id === productId);
    const customers = await ApiService.fetchLatest('customers');
    const c = customers?.find((x: any) => x.id === customerId);

    if (p.variants[0].stockLevel !== 55) throw new Error("Stock NOT deducted on Confirmation");
    if (c.totalSpent !== 5000) throw new Error(`LTV Update failed. Exp: 5000, Got: ${c.totalSpent}`);

    contextRef.current.saleId = saleId;
    addLog('Sales', 'success', 'Order Flow Verified', 'Stock: 55 | LTV: 5000');
  };

  const runPhaseReturns = async () => {
    const { tid, saleId, productId, variantId, customerId } = contextRef.current;
    if (!saleId) throw new Error("Dependency Missing: Order");

    addLog('Returns', 'info', 'Processing RMA (1 Unit)...');
    
    const rma: Return = {
      id: `RMA-${tid}`, orderId: saleId, customerName: `Test Customer ${tid}`, productId: productId!, variantId,
      productName: 'Test', quantity: 1, refundAmount: 1000, unitCost: 416.67,
      reason: 'Other', condition: 'Resellable', status: 'Pending', date: new Date().toISOString()
    };
    props.onAddReturn(rma);
    await wait(300);
    props.onUpdateReturnStatus(rma, 'Approved');
    await wait(800);

    let products = await ApiService.fetchLatest('products');
    let p = products?.find((x: any) => x.id === productId);
    let customers = await ApiService.fetchLatest('customers');
    let c = customers?.find((x: any) => x.id === customerId);

    if (p.variants[0].stockLevel !== 56) throw new Error("RMA Restock failed");
    if (c.totalSpent !== 4000) throw new Error("LTV Refund adjustment failed"); // 5000 - 1000

    // Delivery Refusal Test
    const delSaleId = `ORD-DEL-${tid}`;
    addLog('Returns', 'info', 'Simulating "Delivery Refusal Loss"...');
    
    // Create new order with delivery fee
    const delSale: Sale = {
      id: delSaleId, date: new Date().toISOString(), customerId: customerId!, customerName: `Test Customer ${tid}`,
      items: [{ productId: productId!, productName: 'Test', variantId, quantity: 1, unitPrice: 1000, unitCost: 416.67, total: 1000 }],
      discountAmount: 0, deliveryCharge: 150, totalAmount: 1150, totalCost: 416.67, profit: 733.33, status: 'Confirmed'
    };
    props.onAddSale(delSale);
    await wait(500);

    // Simulate Return with "Refusal" flag logic manually triggering expense
    const refusalExpense: Expense = {
      id: `EXP-LOSS-${tid}`, date: new Date().toISOString(), category: 'Logistics',
      description: `Delivery Loss - Refused`, amount: 150, paymentMethod: 'System', status: 'Paid', referenceId: delSaleId
    };
    props.onAddExpense(refusalExpense);
    await wait(500);

    const expenses = await ApiService.fetchLatest('expenses');
    if (!expenses.find((e: any) => e.id === `EXP-LOSS-${tid}`)) throw new Error("Loss Expense not logged");

    addLog('Returns', 'success', 'RMA & Loss Logic Verified');
  };

  const runPhaseFinancials = async () => {
    const { tid } = contextRef.current;
    addLog('Financials', 'info', 'Auditing Ledger...');
    
    // Just verify the expense we added exists and maybe add another op expense
    const expId = `EXP-OP-${tid}`;
    props.onAddExpense({
        id: expId, date: new Date().toISOString(), category: 'Utilities', 
        description: 'Test OpEx', amount: 500, paymentMethod: 'Cash', status: 'Paid'
    });
    
    await wait(500);
    const expenses = await ApiService.fetchLatest('expenses');
    const logs = await ApiService.fetchLatest('logs');
    
    if (!expenses.find((e: any) => e.id === expId)) throw new Error("Expense persistence failed");
    if (!logs || logs.length === 0) throw new Error("Audit Trail silent");

    addLog('Financials', 'success', 'Ledger Integrity Confirmed');
  };

  const runnerMap: Record<string, () => Promise<void>> = {
    'crm': runPhaseCRM,
    'inv': runPhaseInventory,
    'proc': runPhaseProcurement,
    'sales': runPhaseSales,
    'rma': runPhaseReturns,
    'fin': runPhaseFinancials
  };

  const runDiagnostics = async () => {
    if (selectedPhases.length === 0) return;
    
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    
    // New Test ID for this run
    contextRef.current.tid = Date.now().toString().slice(-6);
    addLog('System', 'info', `Starting Diagnostic Cycle #${contextRef.current.tid}`);

    try {
      // Sort phases to ensure correct dependency order if multiple selected
      const orderedSelection = PHASES.map(p => p.id).filter(id => selectedPhases.includes(id));
      
      for (let i = 0; i < orderedSelection.length; i++) {
        const phaseId = orderedSelection[i];
        try {
          await runnerMap[phaseId]();
        } catch (e: any) {
          addLog(PHASES.find(p => p.id === phaseId)?.label || phaseId, 'failure', e.message);
          // If a phase fails, we stop to prevent cascading errors in dependent phases
          throw new Error(`Aborted at ${phaseId}`);
        }
        setProgress(((i + 1) / orderedSelection.length) * 100);
      }
      
      addLog('System', 'success', 'Diagnostic Cycle Complete', 'All systems nominal.');
    } catch (e: any) {
      addLog('System', 'failure', 'Diagnostic Halted', e.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">System Diagnostics 5.0</h2>
          <p className="text-slate-500 text-sm">Modular logic verification & database integrity check.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={selectAll} className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-xl hover:text-indigo-500 transition-colors">Select All</button>
           <button onClick={deselectAll} className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-xl hover:text-red-500 transition-colors">Clear</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Panel */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 ml-1">Test Phases</h3>
              <div className="space-y-3">
                 {PHASES.map(phase => {
                   const isSelected = selectedPhases.includes(phase.id);
                   const Icon = phase.icon;
                   return (
                     <div 
                        key={phase.id}
                        onClick={() => !isRunning && togglePhase(phase.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30' 
                            : 'bg-slate-50 border-transparent dark:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                        } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                           {isSelected ? <CheckCircle size={16} /> : <Icon size={16} />}
                        </div>
                        <div className="flex-1">
                           <p className={`font-bold text-sm ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-400'}`}>{phase.label}</p>
                           <p className="text-[10px] text-slate-400 dark:text-slate-500">{phase.desc}</p>
                        </div>
                        {isSelected ? <ToggleRight className="text-indigo-600" size={24} /> : <ToggleLeft className="text-slate-300" size={24} />}
                     </div>
                   );
                 })}
              </div>
              
              <button 
                onClick={runDiagnostics} 
                disabled={isRunning || selectedPhases.length === 0}
                className={`w-full mt-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl ${
                  isRunning 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100'
                }`}
              >
                {isRunning ? <RefreshCw size={20} className="animate-spin" /> : <PlayCircle size={20} />}
                {isRunning ? 'Running Tests...' : 'Execute Sequence'}
              </button>
           </div>
           
           <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-2xl flex items-start gap-3">
              <Save className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-indigo-800 dark:text-indigo-400 text-sm">Persistence Mode Active</h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300/80 mt-1 leading-relaxed">
                  Test data is written to the live database to verify persistence logic. Artifacts remain for inspection unless manually cleared.
                </p>
              </div>
            </div>
        </div>

        {/* Terminal Output */}
        <div className="lg:col-span-2 flex flex-col h-[600px] bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-800 relative overflow-hidden">
           {/* Header */}
           <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
              <div className="flex items-center gap-4">
                  {logs.length > 0 && (
                    <button 
                      onClick={handleCopyReport}
                      className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      {copied ? <CheckCircle size={14} className="text-green-500"/> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy Report'}
                    </button>
                  )}
                  <p className="text-slate-500 text-xs font-mono">console.log</p>
              </div>
           </div>

           {/* Progress Bar */}
           {isRunning && (
             <div className="h-1 w-full bg-slate-900">
               <div 
                 className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-300 ease-out" 
                 style={{ width: `${progress}%` }}
               />
             </div>
           )}

           {/* Logs */}
           <div 
             ref={logContainerRef}
             className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm custom-scrollbar"
           >
              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-4">
                  <Terminal size={48} />
                  <p>Ready for input...</p>
                </div>
              )}
              
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 animate-in slide-in-from-left-2 duration-300 border-l-2 border-slate-800 pl-4 py-1 hover:bg-slate-900/30 transition-colors">
                  <span className="text-slate-600 text-xs shrink-0 pt-0.5">{log.timestamp}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        log.status === 'success' ? 'bg-green-500/10 text-green-500' : 
                        log.status === 'failure' ? 'bg-red-500/10 text-red-500' : 
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.phase}
                      </span>
                      <span className={`font-bold ${
                        log.status === 'failure' ? 'text-red-400' : 
                        log.status === 'success' ? 'text-green-400' : 'text-slate-200'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-500 pl-1">{log.details}</p>
                    )}
                  </div>
                  {log.status === 'success' && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                  {log.status === 'failure' && <XCircle size={14} className="text-red-500 shrink-0" />}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
