
import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductVariant, Supplier } from '../types';
import { Plus, Edit2, Trash2, Search, X, Undo2, Redo2, Layers, Package, ImageIcon, Upload, Image as ImageIconLucide, ChevronLeft, ChevronRight, Filter, ChevronDown, AlertCircle } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  suppliers: Supplier[]; // Added suppliers prop
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

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

export const Inventory: React.FC<InventoryProps> = ({ 
  products, suppliers, onAddProduct, onUpdateProduct, onDeleteProduct,
  canUndo, canRedo, onUndo, onRedo 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive page sizing
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 1024 ? 5 : 10);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '', name: '', category: 'Furniture', costPrice: 0, sellingPrice: 0, stockLevel: 0, hasVariants: false, variants: [], image: '', supplierId: ''
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleOpenModal = (product?: Product) => {
    setErrorMsg(null);
    if (product) {
      setEditingId(product.id);
      setFormData({ ...product });
    } else {
      setEditingId(null);
      setFormData({ sku: '', name: '', category: 'Furniture', costPrice: 0, sellingPrice: 0, stockLevel: 0, hasVariants: false, variants: [], image: '', supplierId: '' });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      sku: `${formData.sku || 'SKU'}-${(formData.variants?.length || 0) + 1}`,
      name: '',
      costPrice: formData.costPrice || 0,
      sellingPrice: formData.sellingPrice || 0,
      stockLevel: 0
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
    
    // SKU Uniqueness Check
    if (!formData.hasVariants) {
      const existingProduct = products.find(p => p.sku === formData.sku && p.id !== editingId);
      if (existingProduct) {
        setErrorMsg(`SKU "${formData.sku}" is already in use by "${existingProduct.name}".`);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Inventory Catalog</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Active management of {products.length} stock items.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm">
            <button onClick={onUndo} disabled={!canUndo} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><Undo2 size={18}/></button>
            <div className="w-[1px] bg-slate-100 dark:bg-slate-800 mx-1.5" />
            <button onClick={onRedo} disabled={!canRedo} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><Redo2 size={18}/></button>
          </div>
          <button onClick={() => handleOpenModal()} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/20 font-bold active:scale-95">
            <Plus size={18} /> New Product
          </button>
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
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
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
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Cost Value (৳)</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Retail Value (৳)</th>
                <th className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedProducts.map((product) => {
                const totalStock = product.hasVariants ? product.variants?.reduce((a, b) => a + b.stockLevel, 0) : product.stockLevel;
                const supplier = suppliers.find(s => s.id === product.supplierId);
                
                const minRetail = product.hasVariants ? Math.min(...(product.variants?.map(v => v.sellingPrice) || [0])) : product.sellingPrice;
                const maxRetail = product.hasVariants ? Math.max(...(product.variants?.map(v => v.sellingPrice) || [0])) : product.sellingPrice;
                
                const minCost = product.hasVariants ? Math.min(...(product.variants?.map(v => v.costPrice) || [0])) : product.costPrice;
                const maxCost = product.hasVariants ? Math.max(...(product.variants?.map(v => v.costPrice) || [0])) : product.costPrice;
                
                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors group animate-in fade-in duration-300">
                    <td className="px-8 py-6 relative">
                      <div className="flex items-center gap-4">
                        <div className="relative group/image-trigger">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-zoom-in group-hover/image-trigger:ring-2 ring-indigo-500 transition-all">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIconLucide size={20} className="text-slate-400 dark:text-slate-500" />
                            )}
                          </div>
                          {product.image && (
                            <div className="absolute left-16 top-1/2 -translate-y-1/2 w-80 h-80 z-[100] pointer-events-none opacity-0 group-hover/image-trigger:opacity-100 group-hover/image-trigger:scale-100 scale-75 translate-x-4 group-hover/image-trigger:translate-x-0 transition-all duration-300 ease-out origin-left">
                              <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 border-[6px] border-white dark:border-slate-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex items-center justify-center p-2">
                                <img src={product.image} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl" />
                                <div className="absolute bottom-6 left-6 right-6 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
                                   <p className="text-[10px] text-white font-black uppercase tracking-[0.1em] text-center truncate">{product.name}</p>
                                   <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest text-center mt-0.5">{product.category}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{product.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-tight font-semibold">{product.hasVariants ? 'Multi-SKU Config' : product.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">{product.category}</span>
                        <span className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{supplier ? supplier.name : 'Unknown Source'}</span>
                      </div>
                    </td>
                    <td className={`px-8 py-6 text-right font-mono font-bold ${totalStock! < 10 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[40px] h-10 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                          currentPage === pageNum 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border-transparent' 
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
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
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2">
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2 ml-1">Product Name</label>
                      <input required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Royal Ottoman Velvet Sofa" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2 ml-1">Primary Category</label>
                      <div className="relative">
                        <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none dark:text-white transition-all appearance-none shadow-inner" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"><Package size={16}/></div>
                      </div>
                    </div>
                  </div>

                  {/* Supplier Selection */}
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2 ml-1">Sourcing Partner</label>
                    <select 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none dark:text-white transition-all appearance-none shadow-inner cursor-pointer" 
                      value={formData.supplierId} 
                      onChange={e => setFormData({...formData, supplierId: e.target.value})}
                    >
                      <option value="">-- Internal / Unassigned --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.contactPerson})</option>)}
                    </select>
                  </div>

                  <div className="bg-indigo-50/50 dark:bg-indigo-500/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/20 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">Pricing & Stock Mode</h4>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!formData.hasVariants ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}>Standard</span>
                        <button type="button" onClick={() => setFormData({...formData, hasVariants: !formData.hasVariants})} className={`w-12 h-6 rounded-full relative transition-colors ${formData.hasVariants ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${formData.hasVariants ? 'right-1' : 'left-1'}`} />
                        </button>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${formData.hasVariants ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}>Variable</span>
                      </div>
                    </div>
                    
                    {!formData.hasVariants ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest mb-1">SKU Identification</label>
                          <input required className="w-full p-3.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 rounded-xl dark:text-white font-mono text-xs" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="SKU-001" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest mb-1">Stock Level</label>
                          <input type="number" className="w-full p-3.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 rounded-xl dark:text-white font-mono" value={formData.stockLevel} onChange={e => setFormData({...formData, stockLevel: Number(e.target.value)})} />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest mb-1">Cost (৳)</label>
                          <input type="number" step="0.01" className="w-full p-3.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 rounded-xl dark:text-white" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest mb-1">Selling Price (৳)</label>
                          <input type="number" step="0.01" className="w-full p-3.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 dark:text-white" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-indigo-100/30 dark:bg-indigo-500/10 rounded-2xl flex items-center gap-4 text-indigo-700 dark:text-indigo-300">
                        <Layers size={24} />
                        <p className="text-xs font-bold leading-relaxed uppercase tracking-wide">Variant-specific details are configured at the bottom of the form.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest ml-1">Product Visual</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group aspect-square rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all overflow-hidden"
                  >
                    {formData.image ? (
                      <>
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Replace Image</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-6 rounded-full bg-white dark:bg-slate-800 shadow-xl text-slate-400 dark:text-slate-500 mb-4 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
                          <Upload size={32} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Click to Upload</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase mt-2 opacity-70">PNG, JPG up to 2MB</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                </div>
              </div>

              {formData.hasVariants && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-3">
                      <Layers className="text-indigo-600" size={20} />
                      <h3 className="text-xl font-serif font-bold text-slate-800 dark:text-white">Product Variants</h3>
                    </div>
                    <button type="button" onClick={handleAddVariant} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                      <Plus size={14} /> Add Variant
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] overflow-hidden shadow-inner">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">
                          <th className="px-6 py-4">Option Details</th>
                          <th className="px-6 py-4">Custom SKU</th>
                          <th className="px-6 py-4 w-24">Cost (৳)</th>
                          <th className="px-6 py-4 w-28">Price (৳)</th>
                          <th className="px-6 py-4 w-20">Stock</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {formData.variants?.map((v, idx) => (
                          <tr key={v.id} className="bg-white dark:bg-slate-800 transition-colors">
                            <td className="px-6 py-3">
                              <input required placeholder="e.g. Ivory Silk / Large" className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:border-indigo-300 outline-none dark:text-white text-xs font-medium" value={v.name} onChange={e => handleUpdateVariant(idx, 'name', e.target.value)} />
                            </td>
                            <td className="px-6 py-3">
                              <input required className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:border-indigo-300 outline-none font-mono dark:text-white text-[10px]" value={v.sku} onChange={e => handleUpdateVariant(idx, 'sku', e.target.value)} />
                            </td>
                            <td className="px-6 py-3">
                              <input type="number" step="0.01" className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:border-indigo-300 outline-none dark:text-white font-mono" value={v.costPrice} onChange={e => handleUpdateVariant(idx, 'costPrice', Number(e.target.value))} />
                            </td>
                            <td className="px-6 py-3">
                              <input type="number" step="0.01" className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:border-indigo-300 outline-none font-bold text-indigo-600 dark:text-indigo-400 font-mono" value={v.sellingPrice} onChange={e => handleUpdateVariant(idx, 'sellingPrice', Number(e.target.value))} />
                            </td>
                            <td className="px-6 py-3">
                              <input type="number" className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:border-indigo-300 outline-none dark:text-white font-mono" value={v.stockLevel} onChange={e => handleUpdateVariant(idx, 'stockLevel', Number(e.target.value))} />
                            </td>
                            <td className="px-6 py-3 text-right">
                              <button type="button" onClick={() => handleRemoveVariant(idx)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex gap-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl transition-colors">Discard Changes</button>
                <button type="submit" className="flex-1 py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[2rem] font-bold shadow-2xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all active:scale-[0.98]">
                  Commit Update to System Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
