
import React, { useState, useEffect } from 'react';
import { Return, Sale, Expense } from '../types';
import { RotateCcw, CheckCircle2, X, AlertTriangle, Search, Package, Truck, Layers, Info, Calculator, Coins } from 'lucide-react';

interface ReturnsProps {
  returns: Return[];
  sales: Sale[];
  onAdd: (r: Return) => void;
  onUpdateStatus: (r: Return, status: Return['status']) => void;
  onAddExpense: (e: Expense) => void;
}

export const Returns: React.FC<ReturnsProps> = ({ returns, sales, onAdd, onUpdateStatus, onAddExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [returnType, setReturnType] = useState<'single' | 'full'>('single');
  
  // Logic state for Refusal Loss
  const [customerRefusedDelivery, setCustomerRefusedDelivery] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Return>>({
    reason: 'Defective',
    condition: 'Resellable',
    quantity: 1,
    status: 'Pending',
    productName: '',
    productId: '',
    variantId: undefined,
    unitCost: 0
  });

  const selectedSale = sales.find(s => s.id === selectedOrderId);

  // Reset toggles when order changes
  useEffect(() => {
    setCustomerRefusedDelivery(false);
  }, [selectedOrderId, returnType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    if (returnType === 'single') {
        if (!formData.productName || !formData.productId) return;
        const newReturn: Return = {
            id: Date.now().toString(),
            orderId: selectedOrderId,
            customerName: selectedSale.customerName,
            productName: formData.productName,
            productId: formData.productId,
            variantId: formData.variantId,
            quantity: formData.quantity || 1,
            unitCost: formData.unitCost || 0,
            refundAmount: formData.refundAmount || 0,
            reason: formData.reason as any,
            condition: formData.condition as any,
            status: formData.status as any,
            date: new Date().toISOString()
        };
        onAdd(newReturn);
    } else {
        // Full Order Return Logic
        selectedSale.items.forEach((item, index) => {
            const newReturn: Return = {
                id: `${Date.now()}-${index}`,
                orderId: selectedOrderId,
                customerName: selectedSale.customerName,
                productName: item.productName,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                // Default to item total. The global 'refundAmount' input isn't used for batch unless we split it, 
                // but for simplicity in full return, we default to item value (Customer pays delivery).
                refundAmount: item.total, 
                reason: formData.reason as any,
                condition: formData.condition as any,
                status: formData.status as any,
                date: new Date().toISOString()
            };
            onAdd(newReturn);
        });
    }

    // --- LOSS LOGIC: The "Refusal" Exception ---
    // If customer refused to pay delivery (e.g. COD Refusal), we log the delivery charge as a LOSS (Expense).
    // This separates the "Refund" (Money back to customer) from the "Loss" (Money paid to courier but not collected).
    if (customerRefusedDelivery && selectedSale.deliveryCharge > 0) {
        const expense: Expense = {
            id: `EXP-LOSS-${Date.now()}`,
            date: new Date().toISOString(),
            category: 'Logistics',
            description: `Delivery Loss - Customer Refused - Order #${selectedSale.id.slice(-6)}`,
            amount: selectedSale.deliveryCharge,
            paymentMethod: 'System Record',
            status: 'Paid',
            referenceId: selectedSale.id
        };
        onAddExpense(expense);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ reason: 'Defective', condition: 'Resellable', quantity: 1, status: 'Pending', productName: '', productId: '', variantId: undefined, unitCost: 0 });
    setSelectedOrderId('');
    setReturnType('single');
    setCustomerRefusedDelivery(false);
  }

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    if (idx >= 0 && selectedSale) {
      const item = selectedSale.items[idx];
      setFormData({
        ...formData,
        productName: item.productName,
        productId: item.productId,
        variantId: item.variantId,
        unitCost: item.unitCost,
        // Default Policy: Refund Item Price Only. Customer pays delivery.
        refundAmount: item.unitPrice * 1 
      });
    }
  };

  const getStatusStyle = (status: string) => {
      switch(status) {
          case 'Approved': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
          case 'Rejected': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
          default: return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      }
  };

  const filteredReturns = returns.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.orderId.includes(searchTerm) ||
    r.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Returns & Refunds</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage RMAs. Policy: Customer pays delivery (unless refused).</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
          <RotateCcw size={18} /> Process Return
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search returns..." 
          className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white font-medium shadow-sm transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">RMA ID</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Order Ref</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Product</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Reason</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Refund</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReturns.map((r) => {
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                     <td className="px-8 py-5 font-mono text-xs text-slate-500">#{r.id.slice(-6)}</td>
                     <td className="px-8 py-5 font-mono text-xs text-indigo-500">#{r.orderId.slice(-6)}</td>
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                            <Package size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{r.productName}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{r.customerName}</p>
                          </div>
                        </div>
                     </td>
                     <td className="px-8 py-5 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-bold">{r.reason}</span> <span className="text-[10px] opacity-60 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-1">{r.condition}</span>
                     </td>
                     <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit ${getStatusStyle(r.status)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'Approved' ? 'bg-green-500' : r.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          {r.status}
                        </span>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">৳{r.refundAmount.toLocaleString()}</p>
                     </td>
                     <td className="px-8 py-5 text-right">
                        {r.status === 'Pending' && (
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={() => onUpdateStatus(r, 'Approved')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 transition-colors border border-transparent hover:border-green-200" title="Approve & Restock">
                               <CheckCircle2 size={16} />
                             </button>
                             <button onClick={() => onUpdateStatus(r, 'Rejected')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors border border-transparent hover:border-red-200" title="Reject">
                               <X size={16} />
                             </button>
                          </div>
                        )}
                     </td>
                  </tr>
                );
              })}
              {filteredReturns.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-8 py-16 text-center text-slate-400 italic">No returns found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Process Return</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Create an RMA ticket for a past order.</p>
                </div>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Order Reference</label>
                    <select required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all text-sm appearance-none" value={selectedOrderId} onChange={e => { setSelectedOrderId(e.target.value); setReturnType('single'); }}>
                       <option value="">Select Order...</option>
                       {sales.filter(s => s.status === 'Confirmed' || s.status === 'Delivered').map(s => (
                         <option key={s.id} value={s.id}>Order #{s.id.slice(-6)} - {s.customerName} ({s.status})</option>
                       ))}
                    </select>
                 </div>
                 
                 {selectedSale && (
                   <div className="space-y-4">
                      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setReturnType('single')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${returnType === 'single' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}
                          >
                            Single Item
                          </button>
                          <button
                            type="button"
                            onClick={() => setReturnType('full')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${returnType === 'full' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}
                          >
                            Whole Order
                          </button>
                      </div>

                      <div className="p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 animate-in fade-in space-y-4">
                          {returnType === 'single' ? (
                            <div>
                                <label className="block text-[10px] uppercase font-black text-indigo-400 tracking-widest mb-1.5 ml-1">Product to Return</label>
                                <select required className="w-full p-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-xl outline-none dark:text-white font-bold text-sm appearance-none" onChange={handleProductSelect} defaultValue="">
                                <option value="" disabled>Select Item from Invoice</option>
                                {selectedSale.items.map((item, idx) => (
                                    <option key={idx} value={idx}>{item.productName} (Qty: {item.quantity})</option>
                                ))}
                                </select>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-indigo-700 dark:text-indigo-300">
                                <Layers size={20} />
                                <div>
                                    <p className="font-bold text-sm">Refund All {selectedSale.items.length} Items</p>
                                    <p className="text-[10px] opacity-70">Inventory will be restocked automatically upon approval.</p>
                                </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 font-bold bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg text-xs">
                                <AlertTriangle size={12} />
                                Refund Target: {selectedSale.customerName}
                              </div>
                              {selectedSale.deliveryCharge > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-xs">
                                        <Truck size={12} />
                                        Delivery Charge: ৳{selectedSale.deliveryCharge} (Non-Refundable Policy)
                                    </div>
                                    
                                    {/* Refusal Loss Toggle */}
                                    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${customerRefusedDelivery ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}>
                                        <input 
                                            type="checkbox" 
                                            id="refusedDelivery" 
                                            className="w-5 h-5 rounded border-amber-300 text-red-600 focus:ring-red-500"
                                            checked={customerRefusedDelivery}
                                            onChange={e => setCustomerRefusedDelivery(e.target.checked)}
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="refusedDelivery" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none flex items-center gap-2">
                                                <Calculator size={14} className={customerRefusedDelivery ? "text-red-500" : "text-slate-400"}/>
                                                Delivery Payment Refused?
                                            </label>
                                            {customerRefusedDelivery && (
                                                <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 font-bold animate-in slide-in-from-top-1">
                                                    Logic: Logs ৳{selectedSale.deliveryCharge} as Expense (Loss).
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                              )}
                          </div>
                      </div>
                   </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                    {returnType === 'single' ? (
                        <>
                            <div>
                                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Quantity</label>
                                <input type="number" required min="1" max={selectedSale?.items.find(i => i.productId === formData.productId)?.quantity || 99} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Refund Amount (৳)</label>
                                <input type="number" required min="0" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all" value={formData.refundAmount} onChange={e => setFormData({...formData, refundAmount: Number(e.target.value)})} />
                                {/* Quick Action Helpers */}
                                {selectedSale?.items.find(i => i.productId === formData.productId) && (
                                    <div className="flex gap-2 mt-2 justify-end">
                                        <button type="button" onClick={() => setFormData({...formData, refundAmount: (selectedSale?.items.find(i => i.productId === formData.productId)?.unitPrice || 0) * (formData.quantity || 1)})} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 hover:text-indigo-600 font-bold border border-transparent hover:border-indigo-200 transition-colors">Item Only (Standard)</button>
                                        <button type="button" onClick={() => setFormData({...formData, refundAmount: (selectedSale?.items.find(i => i.productId === formData.productId)?.unitPrice || 0) * (formData.quantity || 1) + (selectedSale?.deliveryCharge || 0)})} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 hover:text-indigo-600 font-bold border border-transparent hover:border-indigo-200 transition-colors">Full (COD Cancel)</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="col-span-2 space-y-3">
                            <div className="p-4 bg-indigo-600 text-white rounded-2xl text-center shadow-inner">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Refund to Customer</p>
                                <p className="text-3xl font-serif font-bold">
                                    ৳{selectedSale 
                                        ? selectedSale.items.reduce((a,b) => a + b.total, 0).toLocaleString() 
                                        : '0'}
                                </p>
                                {selectedSale && selectedSale.deliveryCharge > 0 && (
                                    <div className="flex items-center justify-center gap-1 text-[10px] mt-2 text-indigo-200 bg-indigo-700/30 py-1 px-3 rounded-full w-fit mx-auto border border-indigo-500/50">
                                        <Info size={10} />
                                        Excludes ৳{selectedSale.deliveryCharge} Delivery Charge
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Reason</label>
                       <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold text-sm appearance-none" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value as any})}>
                          <option>Defective</option><option>Wrong Item</option><option>Changed Mind</option><option>Other</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Condition</label>
                       <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold text-sm appearance-none" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})}>
                          <option>Resellable</option><option>Damaged</option>
                       </select>
                    </div>
                 </div>
                 <button type="submit" disabled={!selectedSale} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 hover:bg-indigo-700">Submit Request</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
