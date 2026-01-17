
import React, { useState } from 'react';
import { Product, Sale, Return, Customer, Supplier, Expense } from '../types';
import { ApiService } from './apiService';
import { PlayCircle, CheckCircle, XCircle, RefreshCw, Terminal, Activity, Save } from 'lucide-react';

interface WorkflowTesterProps {
  onAddProduct: (p: Product) => void;
  onAddSale: (s: Sale) => void;
  onAddReturn: (r: Return) => void;
  onUpdateReturnStatus: (id: string, status: Return['status']) => void;
  onAddCustomer: (c: Customer) => void;
  onAddSupplier: (s: Supplier) => void;
  onAddExpense: (e: Expense) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteSale: (id: string) => void;
  onDeleteCustomer: (id: string) => void;
  onDeleteSupplier: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

interface TestLog {
  id: string;
  step: string;
  status: 'pending' | 'success' | 'failure';
  message: string;
  details?: string;
}

export const WorkflowTester: React.FC<WorkflowTesterProps> = ({
  onAddProduct, onAddSale, onAddReturn, onUpdateReturnStatus, onAddCustomer, onAddSupplier, onAddExpense,
  onDeleteProduct, onDeleteSale, onDeleteCustomer, onDeleteSupplier, onDeleteExpense
}) => {
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (step: string, status: TestLog['status'], message: string, details?: string) => {
    setLogs(prev => [...prev, { id: Date.now().toString() + Math.random(), step, status, message, details }]);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runSimulation = async () => {
    setIsRunning(true);
    setLogs([]);
    const tid = Date.now().toString().slice(-6);
    const testIds = {
      supplier: `SUP-${tid}`,
      customer: `CUST-${tid}`,
      product: `PROD-${tid}`,
      variant1: `VAR1-${tid}`,
      sale: `ORD-${tid}`,
      return: `RMA-${tid}`,
      expense: `EXP-${tid}`
    };
    
    try {
      // --- PHASE 1: Sourcing & CRM ---
      addLog("1. CRM/SCM", "pending", "Creating Test Supplier & Customer...");
      
      onAddSupplier({ id: testIds.supplier, name: `Test Supplier ${tid}`, contactPerson: 'Auto Bot', email: 'test@supplier.com', phone: '000-000', category: 'Furniture', status: 'Active' });
      onAddCustomer({ id: testIds.customer, name: `Test Customer ${tid}`, address: '123 Test Lane', phone: '000-000', totalSpent: 0, lastPurchaseDate: 'N/A', tier: 'Bronze' });

      await wait(600);
      
      // VERIFY PHASE 1
      const customers = await ApiService.fetchLatest('customers');
      const suppliers = await ApiService.fetchLatest('suppliers');
      const custCheck = customers?.find((c: Customer) => c.id === testIds.customer);
      
      if (custCheck && suppliers?.find((s: Supplier) => s.id === testIds.supplier)) {
         addLog("1. CRM/SCM", "success", "Entities verified in Database", `Customer ID: ${custCheck.id}`);
      } else {
         throw new Error("Failed to persist Customer or Supplier");
      }

      // --- PHASE 2: Inventory & Variants ---
      addLog("2. Inventory", "pending", "Creating Product with Initial Stock: 10...");
      
      const testProduct: Product = {
        id: testIds.product, sku: `SKU-${tid}`, name: `Test Item ${tid}`, category: 'Accessories', supplierId: testIds.supplier,
        costPrice: 500, sellingPrice: 1000, stockLevel: 0, hasVariants: true,
        variants: [{ id: testIds.variant1, sku: `SKU-${tid}-A`, name: 'Option A', costPrice: 500, sellingPrice: 1000, stockLevel: 10 }],
        updatedAt: new Date().toISOString()
      };
      onAddProduct(testProduct);
      
      await wait(600);
      const products1 = await ApiService.fetchLatest('products');
      const p1 = products1?.find((p: Product) => p.id === testIds.product);
      if (p1?.variants?.[0]?.stockLevel === 10) {
        addLog("2. Inventory", "success", "Product created", "Stock verified at 10 units");
      } else {
        throw new Error("Product creation failed or stock mismatch");
      }

      // --- PHASE 3: Financials ---
      addLog("3. Ledger", "pending", "Logging Expense of ৳150...");
      onAddExpense({ id: testIds.expense, date: new Date().toISOString().split('T')[0], category: 'Logistics', description: `Test Shipping ${tid}`, amount: 150, paymentMethod: 'Cash', status: 'Paid' });
      await wait(400);

      // --- PHASE 4: POS Transaction ---
      addLog("4. POS Logic", "pending", "Processing Sale: 2 Units (Expected Stock: 8)...");
      
      const testSale: Sale = {
        id: testIds.sale, date: new Date().toISOString(), customerId: testIds.customer, customerName: `Test Customer ${tid}`,
        items: [{ productId: testProduct.id, productName: testProduct.name, variantId: testIds.variant1, variantName: 'Option A', quantity: 2, unitPrice: 1000, unitCost: 500, total: 2000 }],
        discountAmount: 0, deliveryCharge: 0, totalAmount: 2000, totalCost: 1000, profit: 1000, notes: 'Diagnostic', status: 'Completed'
      };
      onAddSale(testSale);

      await wait(1000); // Increased wait for processing
      
      // VERIFY PHASE 4 (Logic Check)
      const products2 = await ApiService.fetchLatest('products');
      const customers2 = await ApiService.fetchLatest('customers');
      
      const p2 = products2?.find((p: Product) => p.id === testIds.product);
      const c2 = customers2?.find((c: Customer) => c.id === testIds.customer);
      
      if (!p2) throw new Error("Product not found after sale (Possible deletion or fetch error)");
      
      // Safe access using optional chaining to prevent TypeError
      const stockLevel = p2?.variants?.[0]?.stockLevel;
      if (stockLevel !== 8) {
        throw new Error(`Stock deduction failed. Expected 8, got ${stockLevel}`);
      }
      
      if (!c2) throw new Error("Customer not found after sale");
      if (c2.totalSpent !== 2000) throw new Error(`Customer LTV update failed. Expected 2000, got ${c2.totalSpent}`);
      
      addLog("4. POS Logic", "success", "Transaction & Logic Verified", "Stock: 8 | Customer Spend: ৳2000");

      // --- PHASE 5: RMA & Restocking ---
      addLog("5. RMA Flow", "pending", "Returning 1 Unit (Expected Stock: 9)...");
      const testReturn: Return = {
        id: testIds.return, orderId: testIds.sale, productId: testProduct.id, variantId: testIds.variant1,
        customerName: `Test Customer ${tid}`, productName: testProduct.name, quantity: 1, refundAmount: 1000, unitCost: 500,
        reason: 'Changed Mind', condition: 'Resellable', status: 'Pending', date: new Date().toISOString()
      };
      onAddReturn(testReturn);
      await wait(300);
      onUpdateReturnStatus(testIds.return, 'Approved');
      
      await wait(800);
      
      // VERIFY PHASE 5
      const products3 = await ApiService.fetchLatest('products');
      const customers3 = await ApiService.fetchLatest('customers');
      const p3 = products3?.find((p: Product) => p.id === testIds.product);
      const c3 = customers3?.find((c: Customer) => c.id === testIds.customer);

      if (!p3) throw new Error("Product not found after return");
      
      // Safe access
      const restockedLevel = p3?.variants?.[0]?.stockLevel;
      if (restockedLevel !== 9) {
        throw new Error(`Restock logic failed. Expected 9, got ${restockedLevel}`);
      }
      
      if (!c3) throw new Error("Customer not found after return");
      if (c3.totalSpent !== 1000) throw new Error(`Refund logic failed. Expected LTV 1000, got ${c3.totalSpent}`);

      addLog("5. RMA Flow", "success", "Restock & Refund Verified", "Stock: 9 | Customer Spend: ৳1000");

      // NOTE: Cleanup phase removed to persist data as requested
      addLog("COMPLETE", "success", "Full-Stack Diagnostic Passed", "Test data preserved in system for manual inspection.");

    } catch (e) {
      console.error(e);
      addLog("CRITICAL FAILURE", "failure", "Logic Verification Failed", String(e));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">System Diagnostics 2.0</h2>
          <p className="text-slate-500 text-sm">Real-time logic verification & database integrity check.</p>
        </div>
        <button 
          onClick={runSimulation} 
          disabled={isRunning}
          className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl ${
            isRunning 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
          }`}
        >
          {isRunning ? <RefreshCw size={20} className="animate-spin" /> : <PlayCircle size={20} />}
          {isRunning ? 'Running Verification...' : 'Run Full System Check'}
        </button>
      </div>

      <div className="bg-slate-950 rounded-[2.5rem] p-8 font-mono text-sm relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Terminal size={64} className="text-white" />
        </div>
        
        <div className="space-y-4 relative z-10 h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
              <Activity size={48} />
              <p>Ready to initialize comprehensive test sequence.</p>
              <div className="flex gap-4 text-xs text-slate-700 uppercase font-bold tracking-widest">
                <span>• DB Write</span>
                <span>• Logic Assertions</span>
                <span>• Stock Math</span>
                <span>• LTV Calc</span>
              </div>
            </div>
          )}
          
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
              <div className="pt-1">
                {log.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-indigo-500 animate-spin" />}
                {log.status === 'success' && <CheckCircle size={16} className="text-green-500" />}
                {log.status === 'failure' && <XCircle size={16} className="text-red-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                    log.status === 'success' ? 'bg-green-500/10 text-green-500' : 
                    log.status === 'failure' ? 'bg-red-500/10 text-red-500' : 
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {log.step}
                  </span>
                  <span className="text-slate-300 font-bold">{log.message}</span>
                </div>
                {log.details && (
                  <p className={`text-xs pl-1 border-l-2 ml-1 ${log.status === 'failure' ? 'text-red-400 border-red-900' : 'text-slate-500 border-slate-800'}`}>{log.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-2xl flex items-start gap-3">
        <Save className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={20} />
        <div>
           <h4 className="font-bold text-indigo-800 dark:text-indigo-400 text-sm">Persistence Mode Active</h4>
           <p className="text-xs text-indigo-700 dark:text-indigo-300/80 mt-1 leading-relaxed">
             Test data generated during this session will remain in the database for manual inspection. Use the <strong>Settings</strong> module to wipe test artifacts if needed.
           </p>
        </div>
      </div>
    </div>
  );
};
