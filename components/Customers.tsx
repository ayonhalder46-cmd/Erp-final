
import React, { useState, useMemo } from 'react';
import { Customer, Sale } from '../types';
import { Mail, Phone, User, Calendar, Plus, X, Edit2, Trash2, Award, Undo2, Redo2, MapPin, History, ChevronRight, BarChart } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[]; 
  onAdd: (c: Customer) => void;
  onUpdate: (c: Customer) => void;
  onDelete: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Customers: React.FC<CustomersProps> = ({ 
  customers, sales, onAdd, onUpdate, onDelete,
  canUndo, canRedo, onUndo, onRedo
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '', address: '', phone: '', tier: 'Bronze', totalSpent: 0, lastPurchaseDate: 'N/A'
  });

  const tierCounts = useMemo(() => {
    const counts = { Gold: 0, Silver: 0, Bronze: 0 };
    customers.forEach(c => {
        if (counts[c.tier] !== undefined) counts[c.tier]++;
    });
    return counts;
  }, [customers]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData(customer);
    } else {
      setEditingId(null);
      setFormData({ name: '', address: '', phone: '', tier: 'Bronze', totalSpent: 0, lastPurchaseDate: 'N/A' });
    }
    setIsModalOpen(true);
  };

  const handleOpenHistory = (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
    setHistoryModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ ...formData, id: editingId } as Customer);
    } else {
      onAdd({ ...formData, id: Date.now().toString() } as Customer);
    }
    setIsModalOpen(false);
  };

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'Gold': return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
      case 'Silver': return 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
      default: return 'text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'Returned': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const customerHistory = selectedCustomerForHistory 
    ? sales.filter(s => s.customerId === selectedCustomerForHistory.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white tracking-tight">Customer Directory</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active CRM and loyalty tracking for {customers.length} clients.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm mr-2">
            <button onClick={onUndo} disabled={!canUndo} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-colors" title="Undo"><Undo2 size={18}/></button>
            <div className="w-[1px] bg-slate-100 dark:bg-slate-800 mx-1" />
            <button onClick={onRedo} disabled={!canRedo} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-colors" title="Redo"><Redo2 size={18}/></button>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-95"
          >
            <Plus size={18} /> Add New Client
          </button>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-[2rem] flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-amber-900/30 rounded-xl text-amber-500">
               <Award size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Gold Tier</p>
               <p className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{tierCounts.Gold}</p>
            </div>
         </div>
         <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 rounded-[2rem] flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-500">
               <Award size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Silver Tier</p>
               <p className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{tierCounts.Silver}</p>
            </div>
         </div>
         <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-6 rounded-[2rem] flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-orange-900/30 rounded-xl text-orange-500">
               <Award size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">Bronze Tier</p>
               <p className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{tierCounts.Bronze}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col">
            <div className={`absolute top-0 right-0 px-5 py-2.5 border-b border-l rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-widest ${getTierColor(customer.tier)}`}>
              {customer.tier} Tier
            </div>

            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-serif font-bold shadow-inner">
                {customer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{customer.name}</h3>
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <Award size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Registered Enterprise Client</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 flex-1">
              <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <MapPin size={18} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{customer.address}</span>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Phone size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="font-bold tracking-tight">{customer.phone}</span>
              </div>
            </div>
              
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Lifetime Value (LTV)</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">৳{customer.totalSpent.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => handleOpenHistory(customer)} className="p-3 text-indigo-500 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl transition-all border border-indigo-100 dark:border-indigo-900" title="Order History">
                    <History size={18} />
                  </button>
                  <button onClick={() => handleOpenModal(customer)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => onDelete(customer.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">{editingId ? 'Modify Partner Account' : 'Initialize Client Profile'}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Logistics and CRM metadata configuration.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-3 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 ml-1">Account Holder Full Name</label>
                <input required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white font-bold transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Johnathan Smith / Acme Retailers" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 ml-1">Phone Terminal</label>
                  <input type="tel" required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white font-bold transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+880..." />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 ml-1">Loyalty Tiering</label>
                  <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold dark:text-white cursor-pointer appearance-none" value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value as any})}>
                    <option>Bronze</option>
                    <option>Silver</option>
                    <option>Gold</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 ml-1">Logistics / Delivery Terminal Address</label>
                <textarea required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white font-bold transition-all h-32 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full physical street address..." />
              </div>
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl transition-colors">Discard Form</button>
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all">
                  {editingId ? 'Save Account Specs' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">Purchase History</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Record for {selectedCustomerForHistory.name}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-3 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              {customerHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">No purchase records found.</div>
              ) : (
                <div className="space-y-4">
                  {customerHistory.map(sale => (
                    <div key={sale.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">Order #{sale.id.slice(-6)}</p>
                          <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(sale.status)}`}>
                          {sale.status}
                        </span>
                      </div>
                      <div className="space-y-1 mb-4">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">{item.quantity}x {item.productName}</span>
                            <span className="font-mono">৳{item.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400">Total</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">৳{sale.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
