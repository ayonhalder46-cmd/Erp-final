
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, Wallet, X, TrendingDown, Receipt, Edit2, PieChart } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAdd: (e: Expense) => void;
  onUpdate: (e: Expense) => void;
  onDelete: (id: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Rent',
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    amount: 0,
    description: ''
  });

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingId(expense.id);
      setNewExpense({ ...expense });
    } else {
      setEditingId(null);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: 'Rent',
        paymentMethod: 'Bank Transfer',
        status: 'Paid',
        amount: 0,
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ ...newExpense as Expense, id: editingId });
    } else {
      onAdd({ ...newExpense as Expense, id: Date.now().toString() });
    }
    setIsModalOpen(false);
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Group by Category
  const expensesByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    expenses.forEach(e => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
    });
    return Object.entries(acc).sort((a,b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Expense Ledger</h2>
          <p className="text-slate-500 text-sm">Track operational costs and overheads.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95">
          <Plus size={18} /> Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 dark:bg-red-500/10 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-500/20 flex flex-col justify-between">
           <div>
             <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
               <TrendingDown size={24} />
               <h4 className="font-black uppercase tracking-widest text-xs">Total Outflow</h4>
             </div>
             <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">৳{totalExpenses.toLocaleString()}</p>
           </div>
           
           <div className="mt-6 pt-6 border-t border-red-200 dark:border-red-500/20">
              <h5 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><PieChart size={12}/> Top Categories</h5>
              <div className="space-y-2">
                  {expensesByCategory.slice(0, 3).map(([cat, amount], idx) => (
                      <div key={cat} className="flex justify-between text-xs">
                          <span className="font-bold text-slate-600 dark:text-slate-300">{idx+1}. {cat}</span>
                          <span className="font-mono text-slate-500">৳{amount.toLocaleString()}</span>
                      </div>
                  ))}
              </div>
           </div>
        </div>
        
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <Receipt size={20} className="text-indigo-500" />
              <h4 className="font-bold text-slate-900 dark:text-white">Recent Transactions</h4>
           </div>
           <div className="overflow-y-auto max-h-[300px] custom-scrollbar space-y-3">
             {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
               <div key={exp.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                        {exp.category.substring(0,2)}
                     </div>
                     <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{exp.description}</p>
                        <p className="text-[10px] uppercase font-black text-slate-400">{exp.date} • {exp.category} • {exp.paymentMethod}</p>
                     </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                     <p className="font-bold text-slate-900 dark:text-white font-mono">-৳{exp.amount.toLocaleString()}</p>
                     <div className="flex gap-2">
                       <button onClick={() => handleOpenModal(exp)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
                         <Edit2 size={12} />
                       </button>
                       <button onClick={() => onDelete(exp.id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors bg-white dark:bg-slate-900 rounded-lg border border-red-100 dark:border-red-900/30">
                         <Trash2 size={12} />
                       </button>
                     </div>
                  </div>
               </div>
             ))}
             {expenses.length === 0 && <p className="text-center text-slate-400 text-sm italic py-4">No expenses recorded.</p>}
           </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Transaction' : 'New Expense'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Date</label>
                       <input type="date" required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Category</label>
                       <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}>
                          <option>Rent</option><option>Utilities</option><option>Salaries</option><option>Marketing</option><option>Logistics</option><option>Maintenance</option><option>Procurement</option><option>Other</option>
                       </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Description</label>
                    <input required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="e.g. Electricity Bill" />
                 </div>
                 <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Amount (৳)</label>
                    <input type="number" required min="0" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                 </div>
                 <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                   {editingId ? 'Update Record' : 'Confirm Payment'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
