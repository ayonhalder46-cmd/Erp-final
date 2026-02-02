
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, Wallet, X, TrendingDown, Receipt, Edit2, PieChart, Activity, AlertCircle } from 'lucide-react';

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Expense Ledger</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Track operational costs and overheads.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95">
          <Plus size={18} /> Record Expense
        </button>
      </div>

      {/* Budget Health / Overview */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-10 items-center">
         <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Budget Distribution</h3>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Visual Breakdown</p>
                    </div>
                </div>
                <span className="text-slate-500 text-xs font-mono">Total Outflow: ৳{totalExpenses.toLocaleString()}</span>
            </div>
            
            {/* Multi-colored Progress Bar */}
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
                {expensesByCategory.map(([cat, amount], idx) => {
                    const width = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    const colors = [
                      'bg-indigo-500', 'bg-blue-500', 'bg-sky-500', 'bg-cyan-500', 
                      'bg-teal-500', 'bg-emerald-500', 'bg-green-500', 'bg-lime-500'
                    ];
                    return <div key={cat} style={{ width: `${width}%` }} className={`h-full ${colors[idx % colors.length]} hover:opacity-80 transition-opacity cursor-help`} title={`${cat}: ৳${amount.toLocaleString()}`} />
                })}
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
               {expensesByCategory.slice(0, 4).map(([cat, amount], idx) => {
                  const colors = [
                      'bg-indigo-500', 'bg-blue-500', 'bg-sky-500', 'bg-cyan-500'
                  ];
                  return (
                    <div key={cat} className="flex items-center gap-2 text-xs">
                       <div className={`w-2 h-2 rounded-full ${colors[idx]}`} />
                       <span className="text-slate-600 dark:text-slate-400 font-medium">{cat}</span>
                       <span className="text-slate-400 dark:text-slate-600 font-mono">({Math.round((amount/totalExpenses)*100)}%)</span>
                    </div>
                  );
               })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Card */}
        <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-500/20 flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/20 dark:bg-red-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
           
           <div>
             <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
               <TrendingDown size={24} />
               <h4 className="font-black uppercase tracking-widest text-xs">Total Outflow</h4>
             </div>
             <div className="flex items-baseline gap-1">
               <span className="text-red-400 text-lg">৳</span>
               <p className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">{totalExpenses.toLocaleString()}</p>
             </div>
           </div>
           
           <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-500/20">
              <h5 className="text-[10px] font-black uppercase text-red-400 mb-3 flex items-center gap-2"><PieChart size={12}/> Top Spend Categories</h5>
              <div className="space-y-3">
                  {expensesByCategory.slice(0, 3).map(([cat, amount], idx) => (
                      <div key={cat} className="flex justify-between text-xs items-center">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className="text-[9px] w-4 text-slate-400">0{idx+1}</span> {cat}
                          </span>
                          <span className="font-mono text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded">৳{amount.toLocaleString()}</span>
                      </div>
                  ))}
              </div>
           </div>
        </div>
        
        {/* Transaction List */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Receipt size={20} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Transaction History</h4>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{expenses.length} Records</span>
           </div>
           
           <div className="overflow-y-auto max-h-[400px] custom-scrollbar space-y-3 pr-2 flex-1">
             {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
               <div key={exp.id} className="flex justify-between items-center p-4 bg-slate-50 hover:bg-indigo-50/30 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs uppercase shadow-sm">
                        {exp.category.substring(0,2)}
                     </div>
                     <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{exp.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{exp.category}</span>
                          <span className="text-[10px] text-slate-400">{exp.date}</span>
                          <span className="text-[10px] text-slate-400">• {exp.paymentMethod}</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                     <p className="font-bold text-slate-900 dark:text-white font-mono bg-slate-200/50 dark:bg-slate-700/50 px-3 py-1 rounded-lg">-৳{exp.amount.toLocaleString()}</p>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleOpenModal(exp)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors hover:bg-white dark:hover:bg-slate-700 rounded-lg">
                         <Edit2 size={14} />
                       </button>
                       <button onClick={() => onDelete(exp.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors hover:bg-white dark:hover:bg-slate-700 rounded-lg">
                         <Trash2 size={14} />
                       </button>
                     </div>
                  </div>
               </div>
             ))}
             {expenses.length === 0 && (
               <div className="text-center py-12 flex flex-col items-center">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                   <AlertCircle size={32} />
                 </div>
                 <p className="text-slate-400 text-sm font-medium">No expenses recorded yet.</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Transaction' : 'New Expense'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Log an operational cost or payment.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Date</label>
                       <input type="date" required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold text-sm" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Category</label>
                       <div className="relative">
                         <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold text-sm appearance-none cursor-pointer" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}>
                            <option>Rent</option><option>Utilities</option><option>Salaries</option><option>Marketing</option><option>Logistics</option><option>Maintenance</option><option>Procurement</option><option>Inventory Loss</option><option>Other</option>
                         </select>
                       </div>
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Description</label>
                    <input required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold text-sm placeholder:font-normal" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="e.g. Monthly Electricity Bill" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Amount (৳)</label>
                       <input type="number" required min="0" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold text-sm" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                    </div>
                    <div>
                       <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 ml-1">Method</label>
                       <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold text-sm appearance-none cursor-pointer" value={newExpense.paymentMethod} onChange={e => setNewExpense({...newExpense, paymentMethod: e.target.value})}>
                          <option>Cash</option><option>Bank Transfer</option><option>Mobile Money</option><option>Check</option><option>Card</option>
                       </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                    {editingId ? 'Save Changes' : 'Confirm Transaction'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
