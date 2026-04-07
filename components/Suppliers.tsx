
import React, { useState } from 'react';
import { Supplier, Product } from '../types';
import { Plus, Phone, Mail, Trash2, Truck, Users, X, Edit2, Package } from 'lucide-react';

// Define the categories for sourcing domain selection.
const CATEGORIES = [
  'Furniture',
  'Lighting',
  'Textiles',
  'Showpiece',
  'Wall Decor',
  'Kitchenware',
  'Garden',
  'Accessories'
];

interface SuppliersProps {
  suppliers: Supplier[];
  products: Product[];
  onAdd: (s: Supplier) => void;
  onUpdate: (s: Supplier) => void;
  onDelete: (id: string) => void;
}

export const Suppliers: React.FC<SuppliersProps> = ({ 
  suppliers, products, onAdd, onUpdate, onDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '', contactPerson: '', email: '', phone: '', category: 'Furniture', status: 'Active'
  });

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      setFormData(supplier);
    } else {
      setEditingId(null);
      setFormData({ name: '', contactPerson: '', email: '', phone: '', category: 'Furniture', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ ...formData, id: editingId } as Supplier);
    } else {
      onAdd({ ...formData, id: Date.now().toString() } as Supplier);
    }
    setIsModalOpen(false);
  };

  const getProductCount = (supplierId: string) => {
    return products.filter(p => p.supplierId === supplierId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white tracking-tight">Supply Partners</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage sourcing channels and vendor relationships.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md active:scale-95"
          >
            <Plus size={18} /> Add Partner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Truck size={24} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(s)} className="text-slate-300 hover:text-indigo-600 p-2 transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => onDelete(s.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{s.name}</h3>
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-6">{s.category}</p>
            
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6">
              <div className="flex items-center gap-3">
                <Users size={14} className="text-slate-400" />
                <span className="font-bold tracking-tight">{s.contactPerson}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-slate-400" />
                <span className="truncate">{s.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-slate-400" />
                <span className="font-mono">{s.phone}</span>
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
                 <Package size={12} />
                 <span>{getProductCount(s.id)} Items</span>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                s.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}>
                {s.status}
              </span>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-full py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            <Truck size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No supply partners registered yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center shrink-0">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-800 dark:text-white">{editingId ? 'Update Partner' : 'New Partner Profile'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-4 sm:space-y-8">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Company Entity</label>
                  <input required className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all text-sm sm:text-base" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Royal Decor Ltd" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Sourcing Domain</label>
                  <select className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold dark:text-white cursor-pointer text-sm sm:text-base" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Primary Contact Name</label>
                  <input required className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all text-sm sm:text-base" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Email Terminal</label>
                    <input type="email" required className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all text-sm sm:text-base" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Phone</label>
                    <input type="tel" required className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold transition-all text-sm sm:text-base" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1 flex-1 py-4 sm:py-5 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl sm:rounded-3xl transition-colors">Discard</button>
                <button type="submit" className="order-1 sm:order-2 flex-1 py-4 sm:py-5 bg-indigo-600 text-white rounded-2xl sm:rounded-3xl font-bold shadow-2xl shadow-indigo-500/30 transition-all hover:bg-indigo-700 active:scale-95">
                  {editingId ? 'Save Profile' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
