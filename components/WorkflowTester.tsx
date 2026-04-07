
import React, { useState, useRef, useEffect } from 'react';
import { Product, Sale, Return, Customer, Supplier, Expense, PurchaseOrder } from '../types';
import { ApiService } from './apiService';
import { 
  PlayCircle, CheckCircle2, XCircle, RefreshCw, Terminal, Activity, 
  Save, Truck, Layers, ShoppingCart, RotateCcw, Wallet, Users, ToggleLeft, ToggleRight,
  Copy, Loader2, AlertTriangle, ShieldCheck, Trash2, Ban, CheckSquare, Clock, Info
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
  onDeleteReturn: (id: string) => void;
  onDeletePO: (id: string) => void;
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
  { id: 'prep', label: 'Initialization', icon: Users, desc: 'Setup Test Entities' },
  { id: 'procurement', label: 'Procurement', icon: Truck, desc: 'Stock Intake (PO)' },
  { id: 'status_pending', label: 'Pending Logic', icon: Clock, desc: 'Verify Non-Deduction' },
  { id: 'status_confirmed', label: 'Confirmed Logic', icon: CheckSquare, desc: 'Verify Non-Deduction' },
  { id: 'status_delivered', label: 'Delivered Logic', icon: Truck, desc: 'Verify Deduction' },
  { id: 'status_cancelled', label: 'Cancel Logic', icon: Ban, desc: 'Verify Restoration' },
  { id: 'return_full', label: 'Full Return', icon: RotateCcw, desc: 'Verify Full Restock' },
  { id: 'return_partial', label: 'Partial Return', icon: RotateCcw, desc: 'Verify Partial Restock' },
  { id: 'return_refused', label: 'Refused Delivery', icon: AlertTriangle, desc: 'Verify Loss Expense' },
  { id: 'cleanup', label: 'Teardown', icon: RefreshCw, desc: 'Data Cleanup' },
];

export const WorkflowTester: React.FC<WorkflowTesterProps> = (props) => {
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [progress, setProgress] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({ isOpen: false, message: '', onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Unique ID prefix for this session to track data
  const sessionRef = useRef<{
    prefix: string;
    supplierId: string;
    customerId: string;
    productId: string;
    poId: string;
    salePendingId: string;
    saleConfirmedId: string;
    saleDeliveredId: string;
    saleCancelledId: string;
    saleFullReturnId: string;
    salePartialReturnId: string;
    saleRefusedId: string;
    returnFullId: string;
    returnPartialId: string;
    returnRefusedId: string;
  }>({ 
    prefix: '', supplierId: '', customerId: '', productId: '', poId: '', 
    salePendingId: '', saleConfirmedId: '', saleDeliveredId: '', saleCancelledId: '', 
    saleFullReturnId: '', salePartialReturnId: '', saleRefusedId: '',
    returnFullId: '', returnPartialId: '', returnRefusedId: ''
  });

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

  const waitFor = async (condition: () => Promise<boolean>, timeout = 8000, interval = 500): Promise<void> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        if (await condition()) return;
      } catch(e) {}
      await new Promise(r => setTimeout(r, interval));
    }
    throw new Error("Operation timed out waiting for database sync.");
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // --- MANUAL PURGE TOOL ---
  const purgeOldData = async () => {
    setConfirmDialog({
      isOpen: true,
      message: "Scan database for 'DIAG-' prefixed test data and delete it?",
      onConfirm: async () => {
        let count = 0;
        const tables = ['products', 'sales', 'customers', 'suppliers', 'expenses', 'returns', 'purchaseOrders'];
        
        for (const table of tables) {
            const data = await ApiService.fetchLatest(table) || [];
            const toDelete = data.filter((item: any) => item.id.startsWith('DIAG-'));
            
            if (toDelete.length > 0) {
                count += toDelete.length;
                toDelete.forEach((item: any) => {
                    if (table === 'products') props.onDeleteProduct(item.id);
                    if (table === 'sales') props.onDeleteSale(item.id);
                    if (table === 'customers') props.onDeleteCustomer(item.id);
                    if (table === 'suppliers') props.onDeleteSupplier(item.id);
                    if (table === 'expenses') props.onDeleteExpense(item.id);
                    if (table === 'returns') props.onDeleteReturn(item.id);
                    if (table === 'purchaseOrders') props.onDeletePO(item.id);
                });
            }
        }
        setAlertDialog({ isOpen: true, message: `Cleanup complete. Removed ${count} residual test records.` });
      }
    });
  };

  // --- TEST LOGIC ---

  const runPhasePrep = async () => {
    const prefix = `DIAG-${Date.now()}`;
    sessionRef.current.prefix = prefix;
    sessionRef.current.supplierId = `${prefix}-SUP`;
    sessionRef.current.customerId = `${prefix}-CUST`;
    
    addLog('Prep', 'info', 'Initializing Test Environment...', `Session ID: ${prefix}`);

    props.onAddSupplier({
        id: sessionRef.current.supplierId,
        name: `Diagnostix Supply Co.`,
        contactPerson: 'Tester',
        email: 'test@diag.com',
        phone: '000',
        category: 'Test',
        status: 'Active'
    });

    props.onAddCustomer({
        id: sessionRef.current.customerId,
        name: `Diagnostix Client`,
        address: 'Test Lab',
        phone: '999',
        totalSpent: 0,
        lastPurchaseDate: 'N/A',
        tier: 'Bronze'
    });

    await waitFor(async () => {
        const s = await ApiService.fetchLatest('suppliers');
        return s?.some((x: any) => x.id === sessionRef.current.supplierId);
    });

    addLog('Prep', 'success', 'Master Data Created', 'Supplier & Customer registered');
  };

  const runPhaseProcurement = async () => {
    const { prefix, supplierId } = sessionRef.current;
    sessionRef.current.productId = `${prefix}-PROD`;
    sessionRef.current.poId = `${prefix}-PO`;

    addLog('Procurement', 'info', 'Creating Product (Stock: 0)...');
    props.onAddProduct({
        id: sessionRef.current.productId,
        sku: `D-SKU-${Date.now().toString().slice(-4)}`,
        name: 'Diagnostic Widget',
        category: 'Test',
        supplierId: supplierId,
        costPrice: 500,
        sellingPrice: 1000,
        stockLevel: 0, 
        minStockLevel: 5,
        hasVariants: false
    });

    addLog('Procurement', 'info', 'Creating Purchase Order (100 Units)...');
    const po: PurchaseOrder = {
        id: sessionRef.current.poId,
        date: new Date().toISOString(),
        expectedDate: new Date().toISOString(),
        supplierId,
        supplierName: 'Diagnostix Supply Co.',
        items: [{
            productId: sessionRef.current.productId,
            productName: 'Diagnostic Widget',
            quantity: 100,
            unitCost: 500,
            total: 50000
        }],
        totalAmount: 50000,
        status: 'Ordered'
    };
    props.onCreatePO(po);

    await delay(300);
    addLog('Procurement', 'info', 'Receiving PO & Checking Stock...');
    props.onReceivePO(po);

    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === sessionRef.current.productId);
        return p && p.stockLevel === 100;
    });

    addLog('Procurement', 'success', 'Procurement Logic Verified', 'Stock updated to 100 units.');
  };

  const runPhaseStatusPending = async () => {
    const { prefix, customerId, productId } = sessionRef.current;
    sessionRef.current.salePendingId = `${prefix}-PENDING`;

    addLog('Pending Check', 'info', 'Creating "Pending" Order (10 Units)...');
    const sale: Sale = {
        id: sessionRef.current.salePendingId,
        date: new Date().toISOString(),
        customerId,
        customerName: 'Diagnostix Client',
        items: [{
            productId,
            productName: 'Diagnostic Widget',
            quantity: 10,
            unitPrice: 1000,
            unitCost: 500,
            total: 10000
        }],
        discountAmount: 0,
        totalAmount: 10000,
        totalCost: 5000,
        profit: 5000,
        status: 'Pending',
        paymentMethod: 'Cash'
    };
    props.onAddSale(sale);

    await delay(500);
    const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
    
    // Expect 100. Pending should NOT deduct.
    if (p.stockLevel !== 100) throw new Error(`Stock deduction error! Pending deducted stock. Expected 100, got ${p.stockLevel}`);
    addLog('Pending Check', 'success', 'Verified: No Deduction', 'Stock remains at 100.');
  };

  const runPhaseStatusConfirmed = async () => {
    const { prefix, customerId, productId } = sessionRef.current;
    sessionRef.current.saleConfirmedId = `${prefix}-CONFIRMED`;

    addLog('Confirmed Check', 'info', 'Creating "Confirmed" Order (10 Units)...');
    const sale: Sale = {
        id: sessionRef.current.saleConfirmedId,
        date: new Date().toISOString(),
        customerId,
        customerName: 'Diagnostix Client',
        items: [{
            productId,
            productName: 'Diagnostic Widget',
            quantity: 10,
            unitPrice: 1000,
            unitCost: 500,
            total: 10000
        }],
        discountAmount: 0,
        totalAmount: 10000,
        totalCost: 5000,
        profit: 5000,
        status: 'Confirmed',
        paymentMethod: 'Cash'
    };
    props.onAddSale(sale);

    await delay(500);
    const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
    
    // Expect 100. Confirmed should NOT deduct.
    if (p.stockLevel !== 100) throw new Error(`Stock deduction error! Confirmed deducted stock. Expected 100, got ${p.stockLevel}`);
    addLog('Confirmed Check', 'success', 'Verified: No Deduction', 'Stock remains at 100.');
  };

  const runPhaseStatusDelivered = async () => {
    const { prefix, customerId, productId } = sessionRef.current;
    sessionRef.current.saleDeliveredId = `${prefix}-DELIVERED`;

    // STOCK TRACK: 100 (Start) -> 90 (After Delivery)
    addLog('Delivered Check', 'info', 'Creating "Delivered" Order (10 Units)...');
    const sale: Sale = {
        id: sessionRef.current.saleDeliveredId,
        date: new Date().toISOString(),
        customerId,
        customerName: 'Diagnostix Client',
        items: [{
            productId,
            productName: 'Diagnostic Widget',
            quantity: 10,
            unitPrice: 1000,
            unitCost: 500,
            total: 10000
        }],
        discountAmount: 0,
        totalAmount: 10000,
        totalCost: 5000,
        profit: 5000,
        status: 'Delivered', // Immediate delivery
        paymentMethod: 'Cash'
    };
    props.onAddSale(sale);

    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
        return p && p.stockLevel === 90;
    });
    
    // Expect 90. Delivered MUST deduct.
    const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
    if (p.stockLevel !== 90) throw new Error(`Stock error! Delivered failed to deduct. Expected 90, got ${p.stockLevel}`);
    addLog('Delivered Check', 'success', 'Verified: Stock Deducted', 'Stock dropped to 90 (Correct).');
  };

  const runPhaseStatusCancelled = async () => {
    const { prefix, customerId, productId } = sessionRef.current;
    sessionRef.current.saleCancelledId = `${prefix}-CANCEL-TEST`;

    // STOCK TRACK: 90 (Start) -> 80 (Order Created) -> 90 (Cancelled)
    
    // 1. Create Delivered Order (10 units) -> Stock should go 90 -> 80
    addLog('Cancel Logic', 'info', 'Creating Delivered Order to Cancel (10 Units)...');
    const sale: Sale = {
        id: sessionRef.current.saleCancelledId,
        date: new Date().toISOString(),
        customerId,
        customerName: 'Diagnostix Client',
        items: [{
            productId,
            productName: 'Diagnostic Widget',
            quantity: 10,
            unitPrice: 1000,
            unitCost: 500,
            total: 10000
        }],
        discountAmount: 0,
        totalAmount: 10000,
        totalCost: 5000,
        profit: 5000,
        status: 'Delivered',
        paymentMethod: 'Cash'
    };
    props.onAddSale(sale);

    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
        return p && p.stockLevel === 80;
    });
    addLog('Cancel Logic', 'info', 'Stock deducted to 80. Now cancelling...');

    // 2. Update to Cancelled -> Stock should go 80 -> 90
    props.onUpdateSale({ ...sale, status: 'Cancelled' });

    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
        return p && p.stockLevel === 90;
    });

    const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
    if (p.stockLevel !== 90) throw new Error(`Restoration error! Cancellation did not restore stock. Expected 90, got ${p.stockLevel}`);
    
    addLog('Cancel Logic', 'success', 'Verified: Stock Restored', 'Stock back to 90 after cancellation.');
  };

  const runPhaseFullReturn = async () => {
    const { prefix, customerId, productId } = sessionRef.current;
    sessionRef.current.saleFullReturnId = `${prefix}-RET-FULL`;
    sessionRef.current.returnFullId = `${prefix}-RMA-FULL`;

    // STOCK TRACK: 90 (Start) -> 80 (Order 10) -> 90 (Return 10)
    
    // 1. Create Delivered Order (10 units)
    addLog('Full Return', 'info', 'Creating Delivered Order (10 Units) for Full Return...');
    const sale: Sale = {
        id: sessionRef.current.saleFullReturnId,
        date: new Date().toISOString(),
        customerId,
        customerName: 'Diagnostix Client',
        items: [{
            productId,
            productName: 'Diagnostic Widget',
            quantity: 10,
            unitPrice: 1000,
            unitCost: 500,
            total: 10000
        }],
        discountAmount: 0,
        totalAmount: 10000,
        totalCost: 5000,
        profit: 5000,
        status: 'Delivered',
        paymentMethod: 'Cash'
    };
    props.onAddSale(sale);

    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
        return p && p.stockLevel === 80;
    });

    // 2. Full Return (10 items)
    addLog('Full Return', 'info', 'Processing Full Return (10/10 Units)...');
    const rma: Return = {
        id: sessionRef.current.returnFullId,
        orderId: sessionRef.current.saleFullReturnId,
        customerName: 'Diagnostix Client',
        productName: 'Diagnostic Widget',
        productId,
        quantity: 10,
        unitCost: 500,
        refundAmount: 10000,
        reason: 'Changed Mind',
        condition: 'Resellable',
        status: 'Pending',
        date: new Date().toISOString()
    };
    props.onAddReturn(rma);
    props.onUpdateReturnStatus(rma, 'Approved');

    // 3. CHECK: Stock should be back to 90
    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
        return p && p.stockLevel === 90;
    });

    // 4. CHECK: Order Status should be 'Returned'
    const updatedSale = (await ApiService.fetchLatest('sales')).find((s: any) => s.id === sessionRef.current.saleFullReturnId);
    if (updatedSale.status !== 'Returned') throw new Error(`Status mismatch. Expected 'Returned', got '${updatedSale.status}'`);

    addLog('Full Return', 'success', 'Verified: Full Restock', 'Stock: 90 | Status: Returned');
  };

  const runPhasePartialReturn = async () => {
    const { prefix, customerId, productId } = sessionRef.current;
    sessionRef.current.salePartialReturnId = `${prefix}-RET-PARTIAL`;
    sessionRef.current.returnPartialId = `${prefix}-RMA-PARTIAL`;

    // STOCK TRACK: 90 (Start) -> 80 (Order 10) -> 85 (Return 5)
    
    // 1. Create Delivered Order (10 units)
    addLog('Partial Return', 'info', 'Creating Delivered Order (10 Units) for Partial Return...');
    const sale: Sale = {
        id: sessionRef.current.salePartialReturnId,
        date: new Date().toISOString(),
        customerId,
        customerName: 'Diagnostix Client',
        items: [{
            productId,
            productName: 'Diagnostic Widget',
            quantity: 10,
            unitPrice: 1000,
            unitCost: 500,
            total: 10000
        }],
        discountAmount: 0,
        totalAmount: 10000,
        totalCost: 5000,
        profit: 5000,
        status: 'Delivered',
        paymentMethod: 'Cash'
    };
    props.onAddSale(sale);

    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
        return p && p.stockLevel === 80;
    });

    // 2. Partial Return (5 items)
    addLog('Partial Return', 'info', 'Processing Partial Return (5/10 Units)...');
    const rma: Return = {
        id: sessionRef.current.returnPartialId,
        orderId: sessionRef.current.salePartialReturnId,
        customerName: 'Diagnostix Client',
        productName: 'Diagnostic Widget',
        productId,
        quantity: 5,
        unitCost: 500,
        refundAmount: 5000,
        reason: 'Changed Mind',
        condition: 'Resellable',
        status: 'Pending',
        date: new Date().toISOString()
    };
    props.onAddReturn(rma);
    props.onUpdateReturnStatus(rma, 'Approved');

    // 3. CHECK: Stock should be 85
    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
        return p && p.stockLevel === 85;
    });

    // 4. CHECK: Order Status should be 'Partially Returned'
    const updatedSale = (await ApiService.fetchLatest('sales')).find((s: any) => s.id === sessionRef.current.salePartialReturnId);
    if (updatedSale.status !== 'Partially Returned') throw new Error(`Status mismatch. Expected 'Partially Returned', got '${updatedSale.status}'`);

    addLog('Partial Return', 'success', 'Verified: Partial Restock', 'Stock: 85 | Status: Partially Returned');
  };

  const runPhaseRefusedDelivery = async () => {
    const { prefix, customerId, productId } = sessionRef.current;
    sessionRef.current.saleRefusedId = `${prefix}-REFUSED`;
    sessionRef.current.returnRefusedId = `${prefix}-RMA-REFUSED`;
    const deliveryLoss = 150;

    // STOCK TRACK: 85 (Start) -> 84 (Order 1) -> 85 (Returned)
    
    // 1. Create Delivered Order (1 unit) with delivery charge
    addLog('Refused Delivery', 'info', 'Creating Order (1 Unit) with Delivery Charge...');
    const sale: Sale = {
        id: sessionRef.current.saleRefusedId,
        date: new Date().toISOString(),
        customerId,
        customerName: 'Diagnostix Client',
        items: [{
            productId,
            productName: 'Diagnostic Widget',
            quantity: 1,
            unitPrice: 1000,
            unitCost: 500,
            total: 1000
        }],
        discountAmount: 0,
        deliveryCharge: 150,
        totalAmount: 1150,
        totalCost: 500,
        profit: 500,
        status: 'Delivered',
        paymentMethod: 'Cash'
    };
    props.onAddSale(sale);

    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
        return p && p.stockLevel === 84;
    });

    // 2. Return with Refused Delivery
    addLog('Refused Delivery', 'info', 'Processing Return: Item returned + Delivery Fee unpaid...');
    const rma: Return = {
        id: sessionRef.current.returnRefusedId,
        orderId: sessionRef.current.saleRefusedId,
        customerName: 'Diagnostix Client',
        productName: 'Diagnostic Widget',
        productId,
        quantity: 1,
        unitCost: 500,
        refundAmount: 1000, // Refund item price only
        reason: 'Changed Mind',
        condition: 'Resellable',
        status: 'Pending',
        isDeliveryRefused: true,
        deliveryLossAmount: deliveryLoss,
        date: new Date().toISOString()
    };
    props.onAddReturn(rma);
    props.onUpdateReturnStatus(rma, 'Approved');

    // 3. CHECK: Stock should be 85
    await waitFor(async () => {
        const p = (await ApiService.fetchLatest('products')).find((x: any) => x.id === productId);
        return p && p.stockLevel === 85;
    });

    // 4. CHECK: Expense Creation for Delivery Loss
    const expenses = await ApiService.fetchLatest('expenses') || [];
    const lossExpense = expenses.find((e: any) => e.referenceId === sessionRef.current.saleRefusedId && e.category === 'Logistics');
    
    if (!lossExpense) throw new Error("Expense generation failed for refused delivery.");
    if (lossExpense.amount !== deliveryLoss) throw new Error(`Expense amount mismatch. Expected ${deliveryLoss}, got ${lossExpense.amount}`);

    addLog('Refused Delivery', 'success', 'Verified: Expense Logged', `Loss of ৳${deliveryLoss} recorded. Stock restored.`);
  };

  const runPhaseCleanup = async () => {
    if (!autoCleanup) {
        addLog('Cleanup', 'info', 'Skipping auto-cleanup (User Setting). Data retained.');
        return;
    }

    const { 
        productId, salePendingId, saleConfirmedId, saleDeliveredId, saleCancelledId, 
        saleFullReturnId, salePartialReturnId, saleRefusedId,
        customerId, supplierId, returnFullId, returnPartialId, returnRefusedId, poId 
    } = sessionRef.current;
    
    // Delete Returns first to avoid constraints (though none strict in IndexedDB)
    if (returnFullId) props.onDeleteReturn(returnFullId);
    if (returnPartialId) props.onDeleteReturn(returnPartialId);
    if (returnRefusedId) props.onDeleteReturn(returnRefusedId);
    
    const expenses = await ApiService.fetchLatest('expenses') || [];
    const testExpenses = expenses.filter((e: any) => e.referenceId?.startsWith(sessionRef.current.prefix));
    testExpenses.forEach((e: any) => props.onDeleteExpense(e.id));

    if (poId) props.onDeletePO(poId);
    if (salePendingId) props.onDeleteSale(salePendingId);
    if (saleConfirmedId) props.onDeleteSale(saleConfirmedId);
    if (saleDeliveredId) props.onDeleteSale(saleDeliveredId);
    if (saleCancelledId) props.onDeleteSale(saleCancelledId);
    if (saleFullReturnId) props.onDeleteSale(saleFullReturnId);
    if (salePartialReturnId) props.onDeleteSale(salePartialReturnId);
    if (saleRefusedId) props.onDeleteSale(saleRefusedId);
    
    if (productId) props.onDeleteProduct(productId);
    if (customerId) props.onDeleteCustomer(customerId);
    if (supplierId) props.onDeleteSupplier(supplierId);

    addLog('Cleanup', 'success', 'Test Data Purged', 'Environment Restored');
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    setProgress(0);

    try {
        await runPhasePrep(); setProgress(10); await delay(200);
        await runPhaseProcurement(); setProgress(20); await delay(200);
        await runPhaseStatusPending(); setProgress(30); await delay(200);
        await runPhaseStatusConfirmed(); setProgress(40); await delay(200);
        await runPhaseStatusDelivered(); setProgress(50); await delay(200);
        await runPhaseStatusCancelled(); setProgress(60); await delay(200);
        await runPhaseFullReturn(); setProgress(70); await delay(200);
        await runPhasePartialReturn(); setProgress(80); await delay(200);
        await runPhaseRefusedDelivery(); setProgress(90); await delay(200);
        await runPhaseCleanup(); setProgress(100);
        addLog('System', 'success', 'ALL SYSTEMS OPERATIONAL', 'Full cycle logic validated.');
    } catch (e: any) {
        console.error(e);
        addLog('System', 'failure', 'DIAGNOSTIC FAILED', e.message);
    } finally {
        setIsRunning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Activity className="text-indigo-500" /> System Diagnostics
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Status-isolated logic validation engine.</p>
        </div>
        
        <div className="flex gap-4">
            <button 
                onClick={purgeOldData}
                disabled={isRunning}
                className="px-5 py-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-2xl font-bold text-xs flex items-center gap-2 border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-colors"
            >
                <Trash2 size={16} /> Purge Residual Data
            </button>
            <button 
                onClick={runDiagnostics} 
                disabled={isRunning}
                className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl text-sm ${
                    isRunning ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                }`}
            >
                {isRunning ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
                {isRunning ? 'Running Tests...' : 'Start Full Diagnostic'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Panel */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-6">Test Configuration</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
                      <div className="flex items-center gap-3">
                          <RefreshCw size={18} className="text-slate-400" />
                          <div className="text-xs">
                              <p className="font-bold text-slate-700 dark:text-slate-200">Auto-Cleanup</p>
                              <p className="text-slate-400">Delete data after test</p>
                          </div>
                      </div>
                      <button onClick={() => setAutoCleanup(!autoCleanup)} className={`transition-colors ${autoCleanup ? 'text-green-500' : 'text-slate-300'}`}>
                          {autoCleanup ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                  </div>

                  <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Coverage</p>
                      {PHASES.map((p, i) => {
                          const isComplete = progress > (i * (100/PHASES.length));
                          return (
                            <div key={p.id} className="flex items-center gap-3 text-xs">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isComplete ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    {isComplete ? <CheckCircle2 size={12} /> : <p.icon size={12} />}
                                </div>
                                <span className={isComplete ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500'}>{p.label}</span>
                            </div>
                          );
                      })}
                  </div>
              </div>
          </div>

          {/* Console Output */}
          <div className="lg:col-span-2">
              <div className="bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-800 p-8 h-[600px] flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2 text-slate-400">
                          <Terminal size={16} />
                          <span className="text-xs font-mono">System Console</span>
                      </div>
                      <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
                      </div>
                  </div>

                  <div ref={logContainerRef} className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs space-y-3 pr-2">
                      {logs.map(log => (
                          <div key={log.id} className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
                              <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                              <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                      <span className={`font-bold uppercase tracking-wider ${
                                          log.status === 'success' ? 'text-green-400' : 
                                          log.status === 'failure' ? 'text-red-500' : 'text-blue-400'
                                      }`}>
                                          [{log.phase}]
                                      </span>
                                      <span className="text-slate-300">{log.message}</span>
                                  </div>
                                  {log.details && <p className="text-slate-500 mt-1 pl-2 border-l border-slate-800 ml-1">{log.details}</p>}
                              </div>
                          </div>
                      ))}
                      {logs.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4">
                              <ShieldCheck size={48} className="opacity-20" />
                              <p>Ready to verify business logic integrity.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Custom Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirmation Required</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed whitespace-pre-wrap">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Dialog */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Info size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Information</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed whitespace-pre-wrap">
              {alertDialog.message}
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
