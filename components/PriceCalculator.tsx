
import React, { useState } from 'react';
import { Calculator as CalcIcon, Percent, Truck, PlusCircle } from 'lucide-react';

// Custom Taka Icon
const TakaSymbol = ({ className }: { className?: string }) => (
  <span className={`${className} font-bold`}>৳</span>
);

export const PriceCalculator: React.FC = () => {
  const [cost, setCost] = useState<number>(0);
  const [margin, setMargin] = useState<number>(50); // percentage
  const [extraCosts, setExtraCosts] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  
  const calculate = () => {
    const markupAmount = cost * (margin / 100);
    const finalPrice = cost + markupAmount + shipping + extraCosts;
    return { markupAmount, finalPrice };
  };

  const results = calculate();

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Pricing Strategy Lab</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">Fine-tune your margins and simulate retail prices for high-end decor pieces.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Input Section */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 space-y-10 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <CalcIcon size={24} />
            </div>
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">Cost Parameters</h3>
          </div>
          
          <div className="space-y-8">
            <div className="group">
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-3 ml-1">Base Procurement Cost (৳)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <TakaSymbol className="text-lg" />
                </div>
                <input 
                  type="number" 
                  value={cost || ''} 
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full pl-12 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none dark:text-white transition-all text-lg font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Desired Profit Margin (%)</label>
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-mono font-bold text-sm">{margin}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="300" 
                value={margin} 
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                <span>0%</span>
                <span>150% (Standard)</span>
                <span>300%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">
                  <Truck size={12}/> Logistics (৳)
                </label>
                <input 
                  type="number" 
                  value={shipping || ''} 
                  onChange={(e) => setShipping(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl dark:text-white font-medium"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">
                  <PlusCircle size={12}/> Overhead (৳)
                </label>
                <input 
                  type="number" 
                  value={extraCosts || ''} 
                  onChange={(e) => setExtraCosts(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl dark:text-white font-medium"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-2 space-y-6 h-full">
          <div className="bg-slate-900 dark:bg-indigo-950/20 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden h-full flex flex-col border border-slate-800 dark:border-indigo-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            
            <h3 className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mb-10 flex items-center gap-2 relative z-10">
              Retail Valuation Strategy
            </h3>
            
            <div className="space-y-6 relative z-10 flex-1">
              <div className="flex justify-between items-end border-b border-slate-800 dark:border-indigo-500/10 pb-4 group">
                <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Net Cost</span>
                <span className="font-mono text-lg font-bold">৳{cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-800 dark:border-indigo-500/10 pb-4 group">
                <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Target Markup</span>
                <span className="font-mono text-lg font-bold text-indigo-400">+৳{results.markupAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-800 dark:border-indigo-500/10 pb-4 group">
                <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Logistics / Extra</span>
                <span className="font-mono text-lg font-bold text-amber-500">+৳{(shipping + extraCosts).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="pt-10 flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Calculated Retail Floor</span>
                <div className="text-6xl font-serif font-bold text-white tracking-tighter text-center">
                  ৳{results.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 relative z-10">
              <div className="flex items-center gap-3 text-indigo-300 mb-2">
                <Percent size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Net Profit Breakdown</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Yield per Unit:</span>
                <span className="text-xl font-bold text-green-400">৳{(results.finalPrice - cost - shipping - extraCosts).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
