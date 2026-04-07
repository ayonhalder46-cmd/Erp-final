
import React, { useState, useMemo } from 'react';
import { Product, ProductVariant } from '../types';
import { Calculator as CalcIcon, Percent, Truck, Layers, Search, Package, Trash2, RefreshCw, Info, ArrowRight, DollarSign, PlusCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface PriceCalculatorProps {
  products?: Product[];
  onUpdateProduct?: (product: Product) => void;
  onBulkUpdateProduct?: (products: Product[]) => void;
}

interface BatchItem {
  tempId: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  batchQty: number; // Qty in this specific shipment
  supplierUnitCost: number; // Price paid to factory/supplier per unit (FOB)
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({ products = [], onUpdateProduct, onBulkUpdateProduct }) => {
  const [mode, setMode] = useState<'single' | 'import'>('import');
  const [showTutorial, setShowTutorial] = useState(false);

  // --- SINGLE SIMULATION STATE ---
  const [simCost, setSimCost] = useState<number>(0);
  const [simMargin, setSimMargin] = useState<number>(40);
  const [simExtra, setSimExtra] = useState<number>(0);

  // --- IMPORT BATCH STATE ---
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [grandTotalFees, setGrandTotalFees] = useState<number>(0); // Shipping + Customs + Clearing
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({ isOpen: false, message: '', onConfirm: () => {} });

  // --- CALCULATIONS ---

  const simResults = useMemo(() => {
    const markup = simCost * (simMargin / 100);
    const sellPrice = simCost + markup + simExtra;
    return { markup, sellPrice, profit: sellPrice - simCost - simExtra };
  }, [simCost, simMargin, simExtra]);

  // Core Import Logic
  const batchCalculations = useMemo(() => {
    // 1. Total Value of Goods at Supplier (FOB)
    const totalGoodsValue = batchItems.reduce((acc, item) => acc + (item.supplierUnitCost * item.batchQty), 0);
    
    // 2. Allocation Factor (Weighted by Value)
    // If you spend 100k on goods and 10k on shipping, factor is 0.1 (10%).
    // Each item's cost increases by 10%.
    const allocationFactor = totalGoodsValue > 0 ? grandTotalFees / totalGoodsValue : 0;

    return batchItems.map(item => {
      // 3. Allocate Overhead per unit
      const overheadPerUnit = item.supplierUnitCost * allocationFactor;
      const landedCost = item.supplierUnitCost + overheadPerUnit;
      
      // 4. Weighted Average Cost (AVCO) Logic
      const currentProduct = products.find(p => p.id === item.productId);
      let currentStock = 0;
      let currentAvgCost = 0;

      if (currentProduct) {
        if (item.variantId && currentProduct.variants) {
           const v = currentProduct.variants.find(v => v.id === item.variantId);
           currentStock = v ? v.stockLevel : 0;
           currentAvgCost = v ? v.costPrice : 0;
        } else {
           currentStock = currentProduct.stockLevel;
           currentAvgCost = currentProduct.costPrice;
        }
      }

      // Formula: ((OldStock * OldCost) + (NewQty * NewLandedCost)) / (OldStock + NewQty)
      const totalStockAfter = currentStock + item.batchQty;
      const newAvgCost = totalStockAfter > 0 
        ? ((currentStock * currentAvgCost) + (item.batchQty * landedCost)) / totalStockAfter
        : landedCost;

      return {
        ...item,
        overheadPerUnit,
        landedCost,
        newAvgCost,
        currentStock,
        currentAvgCost,
        totalStockAfter
      };
    });
  }, [batchItems, grandTotalFees, products]);

  const totalBatchValue = batchCalculations.reduce((acc, i) => acc + (i.supplierUnitCost * i.batchQty), 0);
  const totalLandedValue = totalBatchValue + grandTotalFees;

  // --- HANDLERS ---

  const handleAddItem = (product: Product, variant?: ProductVariant) => {
    // Default to existing cost price if available, else 0
    const cost = variant ? variant.costPrice : product.costPrice;
    const newItem: BatchItem = {
      tempId: Math.random().toString(36),
      productId: product.id,
      variantId: variant?.id,
      productName: product.name,
      variantName: variant?.name,
      batchQty: 1,
      supplierUnitCost: cost
    };
    setBatchItems(prev => [...prev, newItem]);
  };

  const updateBatchItem = (tempId: string, field: keyof BatchItem, value: number) => {
    setBatchItems(prev => prev.map(item => 
      item.tempId === tempId ? { ...item, [field]: value } : item
    ));
  };

  const removeBatchItem = (tempId: string) => {
    setBatchItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const handleCommitInventory = () => {
    setConfirmDialog({
      isOpen: true,
      message: `CONFIRM IMPORT?\n\nThis will add stock and update Cost Prices (Weighted Average) for ${batchItems.length} items.\n\nTotal Investment: ৳${totalLandedValue.toLocaleString()}`,
      onConfirm: () => {
        // Map to store latest state of products being updated
        const updatesMap = new Map<string, Product>();

        batchCalculations.forEach(calc => {
          // Get the base product from either our local updates map or the main product list
          const baseProduct = updatesMap.get(calc.productId) || products.find(p => p.id === calc.productId);
          
          if (baseProduct) {
            // Deep clone to safely mutate
            const updatedProduct = JSON.parse(JSON.stringify(baseProduct)) as Product;

            if (calc.variantId && updatedProduct.variants) {
               const vIndex = updatedProduct.variants.findIndex(v => v.id === calc.variantId);
               if (vIndex > -1) {
                 updatedProduct.variants[vIndex].stockLevel += calc.batchQty;
                 // Store price with 2 decimal precision
                 updatedProduct.variants[vIndex].costPrice = Math.round((calc.newAvgCost + Number.EPSILON) * 100) / 100;
               }
            } else {
               updatedProduct.stockLevel += calc.batchQty;
               updatedProduct.costPrice = Math.round((calc.newAvgCost + Number.EPSILON) * 100) / 100;
            }
            
            updatesMap.set(updatedProduct.id, updatedProduct);
          }
        });

        const finalUpdates = Array.from(updatesMap.values());

        if (onBulkUpdateProduct) {
            onBulkUpdateProduct(finalUpdates);
        } else if (onUpdateProduct) {
            // Fallback for individual updates if bulk prop missing (legacy support)
            finalUpdates.forEach(p => onUpdateProduct(p));
        }
        
        setBatchItems([]);
        setGrandTotalFees(0);
      }
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Pricing Lab</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg">Advanced Import Costing & Margin Analysis.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowTutorial(!showTutorial)} className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">
              <HelpCircle size={20} />
           </button>
           <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex gap-1">
            <button 
                onClick={() => setMode('import')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mode === 'import' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
                <Truck size={14} /> Import Batch
            </button>
            <button 
                onClick={() => setMode('single')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mode === 'single' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
                <CalcIcon size={14} /> Quick Sim
            </button>
           </div>
        </div>
      </div>

      {showTutorial && (
        <div className="bg-indigo-600 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden animate-in slide-in-from-top-4">
           <div className="flex gap-4">
              <div className="p-3 bg-white/20 rounded-xl h-fit"><Info size={24} /></div>
              <div>
                 <h3 className="font-bold text-lg mb-2">How "Import Costing" Works</h3>
                 <p className="text-indigo-100 text-sm leading-relaxed max-w-3xl">
                    1. <strong>Add Products:</strong> Select items from your inventory that you are importing/restocking.<br/>
                    2. <strong>Enter Supplier Price:</strong> Input the raw price (FOB) you paid the supplier per unit.<br/>
                    3. <strong>Enter Grand Total Fees:</strong> Input the TOTAL bill for shipping, customs, C&F, etc.<br/>
                    4. <strong>Auto-Allocation:</strong> The system automatically distributes the fees to each item based on its <strong>value</strong> (Expensive items absorb more shipping cost).<br/>
                    5. <strong>AVCO Update:</strong> When you commit, the system calculates the new <strong>Weighted Average Cost</strong> combining your old stock with the new shipment to keep accounting accurate.
                 </p>
              </div>
              <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full"><div className="w-4 h-4">✕</div></button>
           </div>
        </div>
      )}

      {mode === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Left: Input Panel */}
          <div className="lg:col-span-4 space-y-6">
             {/* 1. Global Costs */}
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                   <Layers size={18} className="text-indigo-600"/> Batch Costs
                </h3>
                
                <div className="space-y-5">
                   <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Total Shipping & Customs (Bill)</label>
                      <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</div>
                         <input 
                           type="number" 
                           min="0"
                           className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-indigo-600 dark:text-indigo-400"
                           value={grandTotalFees || ''}
                           onChange={e => setGrandTotalFees(Math.max(0, Number(e.target.value)))}
                           placeholder="0.00"
                         />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 leading-snug">
                        Enter the final invoice amount from your shipping agent.
                      </p>
                   </div>
                </div>
             </div>

             {/* 2. Product Search & Add */}
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px]">
                <div className="relative mb-4">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     placeholder="Search inventory to add..." 
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                   />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                   {products.length === 0 && (
                      <div className="text-center py-10 px-4 text-slate-400 text-xs">
                         Inventory is empty. Go to the Inventory page to create products first.
                      </div>
                   )}
                   {filteredProducts.slice(0, 20).map(p => (
                     <div key={p.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors border border-transparent hover:border-indigo-200 group" onClick={() => !p.hasVariants && handleAddItem(p)}>
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.name}</p>
                              <p className="text-[10px] text-slate-400">{p.sku}</p>
                           </div>
                           {!p.hasVariants && <PlusCircle size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100" />}
                        </div>
                        {p.hasVariants && (
                           <div className="mt-2 flex flex-wrap gap-1">
                              {p.variants?.map(v => (
                                 <button 
                                    key={v.id}
                                    onClick={(e) => { e.stopPropagation(); handleAddItem(p, v); }}
                                    className="text-[9px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors"
                                 >
                                    {v.name}
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Right: Calculations Table */}
          <div className="lg:col-span-8 flex flex-col gap-6">
             {/* Summary Banner */}
             <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-8">
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Goods Value (FOB)</p>
                      <p className="text-2xl font-serif font-bold">৳{totalBatchValue.toLocaleString()}</p>
                   </div>
                   <div className="h-8 w-px bg-slate-700 hidden md:block"></div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Total Landed Cost</p>
                      <p className="text-2xl font-serif font-bold text-indigo-300">৳{totalLandedValue.toLocaleString()}</p>
                   </div>
                </div>
                {grandTotalFees > 0 && totalBatchValue > 0 && (
                   <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Info size={14} className="text-indigo-300"/>
                      <span>Impact Factor: +{((grandTotalFees/totalBatchValue)*100).toFixed(1)}%</span>
                   </div>
                )}
             </div>

             {/* Logic Explainer for Empty State */}
             {batchItems.length === 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center justify-center flex-1">
                   <Truck size={48} className="text-slate-300 mb-4" />
                   <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Ready for Import Data</h3>
                   <p className="text-sm text-slate-400 max-w-md mt-2">
                      Add products from the left panel to calculate their true Landed Cost by distributing your shipping fees.
                   </p>
                </div>
             )}

             {/* Calculation Table */}
             {batchItems.length > 0 && (
                 <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex-1 overflow-hidden flex flex-col">
                     <div className="responsive-table-container flex-1">
                       <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                             <tr>
                                <th className="px-6 py-4">Product Details</th>
                                <th className="px-6 py-4 text-center">Batch Qty</th>
                                <th className="px-6 py-4 text-right">Supplier Price</th>
                                <th className="px-6 py-4 text-right text-amber-600">+ Overhead (Alloc)</th>
                                <th className="px-6 py-4 text-right bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-300">Landed Cost</th>
                                <th className="px-6 py-4 text-right text-slate-400">Inventory Impact</th>
                                <th className="px-6 py-4 w-10"></th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                             {batchCalculations.map((item) => (
                                <tr key={item.tempId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                   <td className="px-6 py-4">
                                      <p className="font-bold text-slate-700 dark:text-slate-300">{item.productName}</p>
                                      {item.variantName && <p className="text-[10px] text-slate-400">{item.variantName}</p>}
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <input 
                                        type="number" min="1"
                                        className="w-16 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={item.batchQty}
                                        onChange={e => updateBatchItem(item.tempId, 'batchQty', Math.max(1, Number(e.target.value)))}
                                      />
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <input 
                                        type="number" min="0"
                                        className="w-24 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-right font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={item.supplierUnitCost}
                                        onChange={e => updateBatchItem(item.tempId, 'supplierUnitCost', Math.max(0, Number(e.target.value)))}
                                      />
                                   </td>
                                   <td className="px-6 py-4 text-right text-xs font-mono text-amber-600 dark:text-amber-500">
                                      +৳{item.overheadPerUnit.toFixed(1)}
                                   </td>
                                   <td className="px-6 py-4 text-right bg-indigo-50/30 dark:bg-indigo-900/5 font-bold font-mono text-indigo-700 dark:text-indigo-300 text-lg">
                                      ৳{item.landedCost.toFixed(2)}
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <div className="flex flex-col items-end text-[10px] font-mono">
                                         <span className="text-slate-400">Old: ৳{item.currentAvgCost.toFixed(1)}</span>
                                         <span className="text-slate-800 dark:text-white font-bold flex items-center gap-1">
                                            New: ৳{item.newAvgCost.toFixed(1)} <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 px-1 rounded">AVCO</span>
                                         </span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <button onClick={() => removeBatchItem(item.tempId)} className="text-slate-300 hover:text-red-500 transition-colors">
                                         <Trash2 size={16} />
                                      </button>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                    
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                       <button 
                         onClick={handleCommitInventory}
                         className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl transition-all active:scale-95 flex items-center gap-3"
                       >
                          <RefreshCw size={20} /> Update Inventory & Costs
                       </button>
                    </div>
                 </div>
             )}
          </div>
        </div>
      )}

      {mode === 'single' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl animate-in zoom-in-95">
           <h3 className="text-2xl sm:text-3xl font-serif font-bold text-center mb-6 sm:mb-10 text-slate-900 dark:text-white">Quick Simulator</h3>
           
           <div className="space-y-6 sm:space-y-8">
              <div>
                 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Cost Price (Supplier)</label>
                 <div className="relative">
                    <span className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg sm:text-xl">৳</span>
                    <input type="number" min="0" className="w-full pl-10 sm:pl-12 p-4 sm:p-6 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-[1.5rem] font-bold text-xl sm:text-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 dark:text-white" value={simCost} onChange={e => setSimCost(Math.max(0, Number(e.target.value)))} />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Extra Costs (Flat)</label>
                    <input type="number" min="0" className="w-full p-4 sm:p-5 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl outline-none" value={simExtra} onChange={e => setSimExtra(Math.max(0, Number(e.target.value)))} />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Margin %</label>
                    <input type="number" className="w-full p-4 sm:p-5 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl outline-none" value={simMargin} onChange={e => setSimMargin(Number(e.target.value))} />
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wide text-xs">Suggested Price</span>
                    <span className="text-5xl font-serif font-bold text-indigo-600 dark:text-indigo-400">৳{simResults.sellPrice.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Profit per Unit</span>
                    <span className="text-green-500 font-bold">+৳{simResults.profit.toFixed(2)}</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <AlertCircle size={24} />
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
    </div>
  );
};
