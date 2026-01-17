
import React, { useState } from 'react';
import { Return, Sale } from '../types';
import { RotateCcw, CheckCircle2, X, AlertTriangle, Search, Package, Truck } from 'lucide-react';

interface ReturnsProps {
  returns: Return[];
  sales: Sale[];
  onAdd: (r: Return) => void;
  onUpdateStatus: (id: string, status: Return['status']) => void;
}

export const Returns: React.FC<ReturnsProps> = ({ returns, sales, onAdd, onUpdateStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !formData.productName || !formData.productId) return;

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
    setIsModalOpen(false);
    setFormData({ reason: 'Defective', condition: 'Resellable', quantity: 1, status: 'Pending', productName: '', productId: '', variantId: undefined, unitCost: 0 });
    setSelectedOrderId('');
  };

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
        refundAmount: item.unitPrice // Default to unit price
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
          <p className="text-slate-500 dark:text-slate-400 text-sm">Process RMAs and manage inventory restoration.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
          <RotateCcw size={18} /> Process Return
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search returns by order ID, customer or product..." 
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
              {filteredReturns.map((r) => (
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
                   <td className="px-8 py-5 text-right font-mono font-bold text-slate-900 dark:text-white">৳{r.refundAmount.toLocaleString()}</td>
                   <td className="px-8 py-5 text-right">
                      {r.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => onUpdateStatus(r.id, 'Approved')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 transition-colors border border-transparent hover:border-green-200" title="Approve & Restock">
                             <CheckCircle2 size={16} />
                           </button>
                           <button onClick={() => onUpdateStatus(r.id, 'Rejected')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors border border-transparent hover:border-red-200" title="Reject">
                             <X size={16} />
                           </button>
                        </div>
                      )}
                   </td>
                </tr>
              ))}
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
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Process Return</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Create an RMA ticket for a past order.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Order Reference</label>
                    <select required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all text-sm appearance-none" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                       <option value="">Select Order...</option>
                       {sales.filter(s => s.status === 'Completed').map(s => (
                         <option key={s.id} value={s.id}>Order #{s.id.slice(-6)} - {s.customerName}</option>
                       ))}
                    </select>
                 </div>
                 
                 {selectedSale && (
                   <div className="p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 animate-in fade-in space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-indigo-400 tracking-widest mb-1.5 ml-1">Product to Return</label>
                        <select required className="w-full p-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-xl outline-none dark:text-white font-bold text-sm appearance-none" onChange={handleProductSelect} defaultValue="">
                          <option value="" disabled>Select Item from Invoice</option>
                          {selectedSale.items.map((item, idx) => (
                            <option key={idx} value={idx}>{item.productName} (Qty: {item.quantity})</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 font-bold bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg flex-1">
                            <AlertTriangle size={12} />
                            Refund Target: {selectedSale.customerName}
                          </div>
                          {selectedSale.deliveryCharge > 0 && (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                                <Truck size={12} />
                                Delivery Paid: ৳{selectedSale.deliveryCharge}
                            </div>
                          )}
                      </div>
                   </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Quantity</label>
                       <input type="number" required min="1" max={selectedSale?.items.find(i => i.productId === formData.productId)?.quantity || 99} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                    </div>
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Refund Amount (৳)</label>
                       <input type="number" required min="0" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all" value={formData.refundAmount} onChange={e => setFormData({...formData, refundAmount: Number(e.target.value)})} />
                    </div>
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
