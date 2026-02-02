
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product, ProductVariant, Supplier } from '../types';
import { Plus, Edit2, Trash2, Search, X, Undo2, Redo2, Layers, Package, ImageIcon, Upload, Image as ImageIconLucide, ChevronLeft, ChevronRight, Filter, ChevronDown, AlertCircle, AlertTriangle, BadgeDollarSign, BarChart2, Palette, Ruler } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  suppliers: Supplier[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  notify?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CATEGORIES = [
  'Furniture', 'Lighting', 'Textiles', 'Showpiece', 'Wall Decor', 'Kitchenware', 'Garden', 'Accessories'
];

const CATEGORY_PREFIXES: Record<string, string> = {
  'Furniture': 'FUR', 'Lighting': 'LGT', 'Textiles': 'TEX', 'Showpiece': 'SHW', 'Wall Decor': 'WLD', 'Kitchenware': 'KIT', 'Garden': 'GDN', 'Accessories': 'ACC'
};

export const Inventory: React.FC<InventoryProps> = ({ 
  products, suppliers, onAddProduct, onUpdateProduct, onDeleteProduct,
  canUndo, canRedo, onUndo, onRedo, notify
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [variantType, setVariantType] = useState<'Color' | 'Size'>('Color');

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 1024 ? 5 : 10);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stats = useMemo(() => {
    let totalValue = 0;
    let totalItems = 0;
    let lowStock = 0;
    
    products.forEach(p => {
        const stock = p.hasVariants ? p.variants?.reduce((a,b) => a + b.stockLevel, 0) : p.stockLevel;
        const min = p.minStockLevel || 5;
        
        totalValue += (stock || 0) * p.costPrice;
        totalItems += (stock || 0);
        
        const isLow = p.hasVariants 
            ? p.variants?.some(v => v.stockLevel < (v.minStockLevel || 5)) 
            : (p.stockLevel || 0) < min;
            
        if (isLow) lowStock++;
    });
    
    return { totalValue, totalItems, lowStock };
  }, [products]);

  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '', name: '', category: 'Furniture', costPrice: 0, sellingPrice: 0, stockLevel: 0, minStockLevel: 5, hasVariants: false, variants: [], image: '', supplierId: ''
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    
    const matchesLowStock = showLowStockOnly 
        ? (p.hasVariants 
            ? p.variants?.some(v => v.stockLevel <= (v.minStockLevel || 5)) 
            : p.stockLevel <= (p.minStockLevel || 5))
        : true;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const generateSKU = (category: string) => {
    const prefix = CATEGORY_PREFIXES[category] || 'GEN';
    const count = products.filter(p => p.category === category).length + 1;
    return `${prefix}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenModal = (product?: Product) => {
    setErrorMsg(null);
    if (product) {
      setEditingId(product.id);
      setFormData({ ...product });
      if (product.variants && product.variants.length > 0) {
         const firstVarName = product.variants[0].name.toUpperCase();
         if (['XS','S','M','L','XL','XXL'].some(s => firstVarName.includes(s))) {
             setVariantType('Size');
         } else {
             setVariantType('Color');
         }
      }
    } else {
      setEditingId(null);
      const defaultCat = 'Furniture';
      setFormData({ 
          sku: generateSKU(defaultCat), 
          name: '', category: defaultCat, costPrice: 0, sellingPrice: 0, stockLevel: 0, minStockLevel: 5, hasVariants: false, variants: [], image: '', supplierId: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    if (!editingId) {
        setFormData(prev => ({ ...prev, category: newCat, sku: generateSKU(newCat) }));
    } else {
        setFormData(prev => ({ ...prev, category: newCat }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        if (notify) notify('Image file too large. Max 500KB allowed.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVariant = () => {
    const nextIndex = (formData.variants?.length || 0) + 1;
    const variantSku = `${formData.sku}-${String(nextIndex).padStart(2, '0')}`;
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      sku: variantSku,
      name: '',
      costPrice: formData.costPrice || 0,
      sellingPrice: formData.sellingPrice || 0,
      stockLevel: 0,
      minStockLevel: 5
    };
    setFormData({ ...formData, variants: [...(formData.variants || []), newVariant] });
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updatedVariants = [...(formData.variants || [])];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleRemoveVariant = (index: number) => {
    const updatedVariants = (formData.variants || []).filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { setErrorMsg("Product Name is required"); return; }
    
    // Strict Case-Insensitive SKU Check
    if (!formData.hasVariants) {
      if (!formData.sku) { setErrorMsg("SKU is required"); return; }
      const skuConflict = products.find(p => 
        p.sku.toLowerCase() === formData.sku?.toLowerCase() && 
        p.id !== editingId
      );
      if (skuConflict) {
        setErrorMsg(`SKU "${formData.sku}" is already in use by "${skuConflict.name}".`);
        return;
      }
    } else {
        // Variant SKU check
        const variantSkus = formData.variants?.map(v => v.sku.toLowerCase()) || [];
        const uniqueSkus = new Set(variantSkus);
        if (uniqueSkus.size !== variantSkus.length) {
            setErrorMsg("Duplicate SKUs found within variants.");
            return;
        }
    }

    const finalProduct = { ...formData, id: editingId || Date.now().toString() } as Product;
    if (editingId) {
      onUpdateProduct(finalProduct);
    } else {
      onAddProduct(finalProduct);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Inventory Catalog</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Active management of {products.length} stock items.</p>
            </div>
            <button onClick={() => handleOpenModal()} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/20 font-bold active:scale-95">
            <Plus size={18} /> New Product
            </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 group">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                    <BadgeDollarSign size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Asset Value</p>
                    <p className="text-2xl font-serif font-bold text-slate-900 dark:text-white">৳{stats.totalValue.toLocaleString()}</p>
                </div>
            </div>
            <div 
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-200 dark:hover:border-red-900/50 transition-colors group ${showLowStockOnly ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            >
                <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${stats.lowStock > 0 ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-green-50 text-green-500 dark:bg-green-500/10'}`}>
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Alerts (Click to Filter)</p>
                    <p className={`text-2xl font-serif font-bold ${stats.lowStock > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                        {stats.lowStock > 0 ? `${stats.lowStock} Low Stock` : 'Optimal'}
                    </p>
                </div>
                {showLowStockOnly && <X size={16} className="ml-auto text-red-500" />}
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Filter by name, SKU..." 
            className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 shadow-sm text-sm transition-all dark:text-white placeholder:text-slate-400" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="relative min-w-[240px] group">
          <Filter className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <select
            className="w-full pl-14 pr-10 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 shadow-sm text-sm transition-all dark:text-white appearance-none cursor-pointer"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <ChevronDown className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-visible backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest">Product Details</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest">Category & Source</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Agg. Stock</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Cost (৳)</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Retail (৳)</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedProducts.map((product) => {
                const totalStock = product.hasVariants ? product.variants?.reduce((a, b) => a + b.stockLevel, 0) : product.stockLevel;
                const supplier = suppliers.find(s => s.id === product.supplierId);
                const isLowStock = product.hasVariants 
                  ? product.variants?.some(v => v.stockLevel <= (v.minStockLevel || 5))
                  : product.stockLevel <= (product.minStockLevel || 5);

                const minRetail = product.hasVariants ? Math.min(...(product.variants?.map(v => v.sellingPrice) || [0])) : product.sellingPrice;
                const maxRetail = product.hasVariants ? Math.max(...(product.variants?.map(v => v.sellingPrice) || [0])) : product.sellingPrice;
                const minCost = product.hasVariants ? Math.min(...(product.variants?.map(v => v.costPrice) || [0])) : product.costPrice;
                const maxCost = product.hasVariants ? Math.max(...(product.variants?.map(v => v.costPrice) || [0])) : product.costPrice;
                
                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors group animate-in fade-in duration-300">
                    <td className="px-8 py-6 relative">
                      <div className="flex items-center gap-4">
                        <div className="relative group/image-trigger">
                          <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center border cursor-zoom-in group-hover/image-trigger:ring-2 ring-indigo-500 transition-all ${isLowStock ? 'bg-red-50 border-red-200 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              isLowStock ? <AlertTriangle size={20} className="text-red-500" /> : <ImageIconLucide size={20} className="text-slate-400" />
                            )}
                          </div>
                          {product.image && (
                            <div className="absolute left-16 top-1/2 -translate-y-1/2 w-48 h-48 z-[100] pointer-events-none opacity-0 group-hover/image-trigger:opacity-100 group-hover/image-trigger:scale-100 scale-75 translate-x-4 group-hover/image-trigger:translate-x-0 transition-all duration-300 ease-out origin-left bg-white dark:bg-slate-900 p-2 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700">
                                <img src={product.image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{product.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-tight font-semibold flex items-center gap-1">
                            {product.hasVariants ? 'Multi-SKU' : product.sku}
                            {isLowStock && <span className="text-red-500 font-bold flex items-center gap-0.5 ml-1"><AlertCircle size={10} /> Low Stock</span>}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">{product.category}</span>
                        <span className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{supplier ? supplier.name : 'Unknown Source'}</span>
                      </div>
                    </td>
                    <td className={`px-8 py-6 text-right font-mono font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {totalStock}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-slate-500 dark:text-slate-400 tracking-tight text-xs font-mono">
                      {product.hasVariants 
                        ? (minCost === maxCost ? `৳${minCost.toLocaleString()}` : `৳${minCost.toLocaleString()} - ৳${maxCost.toLocaleString()}`)
                        : `৳${product.costPrice.toLocaleString()}`}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-slate-900 dark:text-white tracking-tight">
                      {product.hasVariants 
                        ? (minRetail === maxRetail ? `৳${minRetail.toLocaleString()}` : `৳${minRetail.toLocaleString()} - ৳${maxRetail.toLocaleString()}`)
                        : `৳${product.sellingPrice.toLocaleString()}`}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(product)} className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => onDeleteProduct(product.id)} className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
             <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"><ChevronLeft size={16}/></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"><ChevronRight size={16}/></button>
             </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden my-auto animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Product Catalog' : 'New Product Entry'}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 font-medium">Configure global details, imagery, and SKU variations.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
              {errorMsg && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold animate-pulse">{errorMsg}</div>}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Product Name</label>
                            <input required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Category</label>
                            <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none appearance-none" value={formData.category} onChange={handleCategoryChange}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Inventory Type</h4>
                            <button type="button" onClick={() => setFormData({...formData, hasVariants: !formData.hasVariants})} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${formData.hasVariants ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {formData.hasVariants ? 'Multi-Variant' : 'Standard Item'}
                            </button>
                        </div>
                        {!formData.hasVariants && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">SKU</label>
                                    <input className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Cost (৳)</label>
                                    <input type="number" min="0" className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Math.max(0, Number(e.target.value))})} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Price (৳)</label>
                                    <input type="number" min="0" className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Math.max(0, Number(e.target.value))})} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Stock</label>
                                    <input type="number" min="0" className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" value={formData.stockLevel} onChange={e => setFormData({...formData, stockLevel: Math.max(0, Number(e.target.value))})} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Min Alert</label>
                                    <input type="number" min="0" className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: Math.max(0, Number(e.target.value))})} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Image</label>
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden relative group">
                        {formData.image ? (
                          <>
                            <img src={formData.image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                               <p className="text-white text-xs font-bold">Change Image</p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-slate-400">
                            <ImageIcon size={32} className="mx-auto mb-2"/>
                            Click to Upload
                          </div>
                        )}
                        <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-[9px] text-slate-400">Max 500KB.</p>
                      {formData.image && (
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, image: ''})} 
                          className="text-[9px] text-red-500 hover:underline font-bold"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                </div>
              </div>

              {formData.hasVariants && (
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-700 dark:text-slate-300">Variant Configuration</h4>
                          <div className="flex gap-2">
                              <button type="button" onClick={() => setVariantType('Color')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${variantType === 'Color' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>Color</button>
                              <button type="button" onClick={() => setVariantType('Size')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${variantType === 'Size' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>Size</button>
                              <button type="button" onClick={handleAddVariant} className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1"><Plus size={12}/> Add</button>
                          </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 dark:bg-slate-900/50 font-bold text-slate-500 uppercase">
                                  <tr>
                                      <th className="px-4 py-3">{variantType}</th>
                                      <th className="px-4 py-3">SKU</th>
                                      <th className="px-4 py-3">Cost</th>
                                      <th className="px-4 py-3">Price</th>
                                      <th className="px-4 py-3">Stock</th>
                                      <th className="px-4 py-3 w-10"></th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                  {formData.variants?.map((v, i) => (
                                      <tr key={i}>
                                          <td className="p-2"><input className="w-full p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" value={v.name} onChange={e => handleUpdateVariant(i, 'name', e.target.value)} placeholder="Variant Name" /></td>
                                          <td className="p-2"><input className="w-full p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono" value={v.sku} onChange={e => handleUpdateVariant(i, 'sku', e.target.value)} /></td>
                                          <td className="p-2"><input type="number" min="0" className="w-full p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" value={v.costPrice} onChange={e => handleUpdateVariant(i, 'costPrice', Math.max(0, Number(e.target.value)))} /></td>
                                          <td className="p-2"><input type="number" min="0" className="w-full p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600" value={v.sellingPrice} onChange={e => handleUpdateVariant(i, 'sellingPrice', Math.max(0, Number(e.target.value)))} /></td>
                                          <td className="p-2"><input type="number" min="0" className="w-full p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono" value={v.stockLevel} onChange={e => handleUpdateVariant(i, 'stockLevel', Math.max(0, Number(e.target.value)))} /></td>
                                          <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveVariant(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 rounded-2xl">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700 transition-colors">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
