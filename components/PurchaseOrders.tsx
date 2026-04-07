
import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Product, Supplier, PurchaseOrderItem, ProductVariant } from '../types';
import { Plus, X, Search, Package, Container, Truck, CheckCircle2, AlertTriangle, Calendar, ArrowRight, Sparkles, RefreshCw, Printer } from 'lucide-react';

interface PurchaseOrdersProps {
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  suppliers: Supplier[];
  onCreatePO: (po: PurchaseOrder) => void;
  onReceivePO: (po: PurchaseOrder) => void;
  companyProfile?: { name: string; address: string; phone: string; email: string; logo?: string };
}

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ purchaseOrders, products, suppliers, onCreatePO, onReceivePO, companyProfile }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({ isOpen: false, message: '', onConfirm: () => {} });
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);

  const supplierProducts = products.filter(p => !p.supplierId || p.supplierId === selectedSupplierId);

  // Smart Restock Logic
  const recommendedRestock = useMemo(() => {
    const list: { product: Product, variant?: ProductVariant, current: number, toBuy: number }[] = [];
    
    products.forEach(p => {
        if (p.hasVariants && p.variants) {
            p.variants.forEach(v => {
                const min = v.minStockLevel || 5;
                if (v.stockLevel < min) {
                    list.push({ product: p, variant: v, current: v.stockLevel, toBuy: 20 - v.stockLevel });
                }
            });
        } else {
            const min = p.minStockLevel || 5;
            if (p.stockLevel < min) {
                list.push({ product: p, current: p.stockLevel, toBuy: 20 - p.stockLevel });
            }
        }
    });
    return list;
  }, [products]);

  const addItemToPO = (product: Product, variant?: ProductVariant, qty: number = 1) => {
    const cost = variant ? variant.costPrice : product.costPrice;
    const newItem: PurchaseOrderItem = {
      productId: product.id,
      productName: product.name,
      variantId: variant?.id,
      variantName: variant?.name,
      quantity: qty,
      unitCost: cost,
      total: cost * qty
    };
    setPoItems(prev => [...prev, newItem]);
  };

  const autoFillPO = (supplierId: string) => {
    const itemsForSupplier = recommendedRestock.filter(item => 
        !item.product.supplierId || item.product.supplierId === supplierId
    );
    
    const newItems = itemsForSupplier.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        variantId: item.variant?.id,
        variantName: item.variant?.name,
        quantity: item.toBuy,
        unitCost: item.variant ? item.variant.costPrice : item.product.costPrice,
        total: (item.variant ? item.variant.costPrice : item.product.costPrice) * item.toBuy
    }));
    
    setPoItems(newItems);
    setShowRecommendations(false);
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...poItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitCost') {
      updated[index].total = updated[index].quantity * updated[index].unitCost;
    }
    setPoItems(updated);
  };

  const removeItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const newPO: PurchaseOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      expectedDate: expectedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: poItems,
      totalAmount: poItems.reduce((sum, i) => sum + i.total, 0),
      status: 'Ordered',
      notes
    };

    onCreatePO(newPO);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedSupplierId('');
    setPoItems([]);
    setNotes('');
    setExpectedDate('');
  };

  const handlePrintPO = (po: PurchaseOrder) => {
    const supplier = suppliers.find(s => s.id === po.supplierId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoHtml = companyProfile?.logo ? `<img src="${companyProfile.logo}" style="max-height: 50px; margin-bottom: 10px;" alt="Logo"/>` : '';

    const html = `
      <html>
        <head>
          <title>PO #${po.id.slice(-6)}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .meta { text-align: right; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .box h3 { font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding: 10px; text-transform: uppercase; font-size: 11px; }
            td { border-bottom: 1px solid #eee; padding: 10px; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">
              ${logoHtml}
              <h1>Purchase Order</h1>
              <p style="margin: 5px 0 0; font-size: 14px;">${companyProfile?.name || 'TheDécorHub'}</p>
            </div>
            <div class="meta">
              <p><strong>PO Number:</strong> #${po.id.slice(-6)}</p>
              <p><strong>Date:</strong> ${new Date(po.date).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${po.status}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="box" style="width: 45%;">
              <h3>Vendor</h3>
              <p><strong>${po.supplierName}</strong></p>
              ${supplier ? `<p>${supplier.contactPerson}<br>${supplier.email}<br>${supplier.phone}</p>` : ''}
            </div>
            <div class="box" style="width: 45%;">
              <h3>Ship To</h3>
              <p><strong>${companyProfile?.name || 'Warehouse'}</strong></p>
              <p>${companyProfile?.address || ''}<br>${companyProfile?.phone || ''}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="50%">Item</th>
                <th width="15%" style="text-align: center;">Qty</th>
                <th width="15%" style="text-align: right;">Unit Cost</th>
                <th width="20%" style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map(item => `
                <tr>
                  <td>${item.productName} ${item.variantName ? `<span style="color:#666">(${item.variantName})</span>` : ''}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">৳${item.unitCost.toLocaleString()}</td>
                  <td style="text-align: right;">৳${item.total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            Total Amount: ৳${po.totalAmount.toLocaleString()}
          </div>

          ${po.notes ? `<div style="margin-top: 30px; font-size: 13px; background: #f9f9f9; padding: 15px;"><strong>Notes:</strong> ${po.notes}</div>` : ''}

          <div class="footer">
            <p>Authorized Signature: __________________________</p>
            <p>${companyProfile?.name} | ${companyProfile?.email}</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Procurement</h2>
          <p className="text-slate-500 text-sm">Manage Purchase Orders and automated restocking.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setShowRecommendations(!showRecommendations)} className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 border border-indigo-100 dark:border-indigo-500/20 active:scale-95 transition-all">
                <Sparkles size={18} /> Smart Restock ({recommendedRestock.length})
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                <Plus size={18} /> New Purchase Order
            </button>
        </div>
      </div>

      {showRecommendations && (
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2.5rem] p-8 text-white shadow-xl animate-in slide-in-from-top-4">
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles size={20} className="text-amber-300"/> Restock Recommendations</h3>
                      <p className="text-indigo-100 text-sm mt-1">Logic: Stock &lt; Min Level (default 5). Target: 20 Units.</p>
                  </div>
                  <button onClick={() => setShowRecommendations(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead>
                          <tr className="border-b border-white/10 text-indigo-200 text-[10px] uppercase font-black tracking-widest">
                              <th className="pb-3 pl-2">Product</th>
                              <th className="pb-3 text-center">Current</th>
                              <th className="pb-3 text-center">Target</th>
                              <th className="pb-3 text-center">To Buy</th>
                              <th className="pb-3 text-right">Est. Cost</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 font-medium">
                          {recommendedRestock.slice(0, 5).map((item, idx) => (
                              <tr key={idx}>
                                  <td className="py-3 pl-2">{item.product.name} {item.variant ? `(${item.variant.name})` : ''}</td>
                                  <td className="py-3 text-center text-red-300">{item.current}</td>
                                  <td className="py-3 text-center">20</td>
                                  <td className="py-3 text-center font-bold text-amber-300">+{item.toBuy}</td>
                                  <td className="py-3 text-right font-mono">৳{((item.variant ? item.variant.costPrice : item.product.costPrice) * item.toBuy).toLocaleString()}</td>
                              </tr>
                          ))}
                          {recommendedRestock.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-indigo-200 italic">Inventory levels are healthy.</td></tr>}
                      </tbody>
                  </table>
                  {recommendedRestock.length > 5 && <p className="text-center text-xs mt-3 text-indigo-200">...and {recommendedRestock.length - 5} more</p>}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {purchaseOrders.length === 0 && !showRecommendations && (
          <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
             <Container size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
             <p className="text-slate-500 font-medium">No active purchase orders.</p>
             <p className="text-slate-400 text-xs mt-1">Start a procurement cycle to restock inventory.</p>
          </div>
        )}
        {purchaseOrders.map(po => (
          <div key={po.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${
              po.status === 'Received' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {po.status}
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{po.supplierName}</h3>
                  <p className="text-xs text-slate-500">PO #{po.id.slice(-6)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                <Calendar size={12} /> Expected: {new Date(po.expectedDate).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 max-h-40 overflow-y-auto custom-scrollbar">
              {po.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{item.quantity}x {item.productName} {item.variantName ? `(${item.variantName})` : ''}</span>
                  <span className="font-mono text-slate-400">৳{item.total.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-6">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Cost</p>
                <p className="text-2xl font-serif font-bold text-slate-900 dark:text-white">৳{po.totalAmount.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePrintPO(po)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 p-2.5 rounded-xl transition-all"
                  title="Print Purchase Order"
                >
                  <Printer size={16} />
                </button>
                {po.status === 'Ordered' && (
                  <button 
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        message: 'Confirm goods receipt? This will update inventory levels and Weighted Average Costs. (Asset Investment, NOT Expense)',
                        onConfirm: () => onReceivePO(po)
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={14} /> Receive
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[90dvh] sm:max-w-4xl sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border-none sm:border sm:border-slate-200 dark:sm:border-slate-800">
            <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">New Purchase Order</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs mt-1">Raise a requisition for stock replenishment.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Product Selector */}
              <div className="w-full lg:w-1/3 bg-slate-50 dark:bg-slate-950/30 border-r border-slate-100 dark:border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Select Supplier</label>
                    <select 
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                      value={selectedSupplierId}
                      onChange={e => { setSelectedSupplierId(e.target.value); setPoItems([]); }}
                    >
                      <option value="">-- Choose Partner --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  
                  {selectedSupplierId && recommendedRestock.some(r => !r.product.supplierId || r.product.supplierId === selectedSupplierId) && (
                      <button 
                        onClick={() => autoFillPO(selectedSupplierId)}
                        className="w-full py-3 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-200 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                          <Sparkles size={14} /> Auto-fill Recommendations
                      </button>
                  )}

                  {selectedSupplierId && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input placeholder="Filter products..." className="w-full pl-9 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {!selectedSupplierId ? (
                    <div className="text-center text-slate-400 text-xs italic py-10">Select a supplier to browse catalog.</div>
                  ) : (
                    supplierProducts.map(p => (
                      <div key={p.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-colors cursor-pointer group" onClick={() => !p.hasVariants && addItemToPO(p)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white text-xs">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.sku}</p>
                          </div>
                          {!p.hasVariants && <Plus size={14} className="text-indigo-500 opacity-0 group-hover:opacity-100" />}
                        </div>
                        {p.hasVariants && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.variants?.map(v => (
                              <button key={v.id} onClick={(e) => { e.stopPropagation(); addItemToPO(p, v); }} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded hover:bg-indigo-500 hover:text-white transition-colors">
                                {v.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Order Sheet */}
              <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                <div className="flex-1 overflow-y-auto p-8">
                  {poItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                        <Container size={32} />
                      </div>
                      <p className="text-sm">Order requisition is empty.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {poItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{item.productName}</p>
                            {item.variantName && <p className="text-[10px] text-indigo-500 font-bold uppercase">{item.variantName}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col w-20">
                              <label className="text-[8px] uppercase font-bold text-slate-400">Qty</label>
                              <input type="number" min="1" className="p-1 bg-white dark:bg-slate-900 border rounded text-xs font-bold text-center" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                            </div>
                            <div className="flex flex-col w-24">
                              <label className="text-[8px] uppercase font-bold text-slate-400">Unit Cost</label>
                              <input type="number" min="0" className="p-1 bg-white dark:bg-slate-900 border rounded text-xs font-bold text-center" value={item.unitCost} onChange={e => updateItem(idx, 'unitCost', Number(e.target.value))} />
                            </div>
                            <div className="w-20 text-right">
                              <p className="font-mono font-bold text-sm">৳{item.total.toLocaleString()}</p>
                            </div>
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Expected Delivery</label>
                      <input type="date" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Internal Notes</label>
                      <input className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none" placeholder="e.g. Urgent Request" value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estimated Total</p>
                      <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">৳{poItems.reduce((a,b) => a + b.total, 0).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={handleSubmit} 
                      disabled={poItems.length === 0}
                      className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
                    >
                      Submit Order <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirmation Required</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
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
