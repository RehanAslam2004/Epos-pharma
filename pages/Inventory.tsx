import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, ScanBarcode, X, Save, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Product, User, AppSetting } from '../types';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  user: User;
  settings: AppSetting[];
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onDeleteProduct, user, settings }) => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Settings Values
  const lowStockLimit = Number(settings.find(s => s.key === 'low_stock_limit_default')?.value || 5);
  const expiryAlertDays = Number(settings.find(s => s.key === 'expiry_alert_days')?.value || 90);

  // Auto-open modal or apply filter based on URL query params
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const activeFilter = searchParams.get('filter');

  // Form State
  const initialFormState: Partial<Product> = {
    form: 'Tablet',
    requiresPrescription: false,
    isNarcotic: false,
    stock: 0,
    price: 0,
    costPrice: 0,
    reorderLevel: lowStockLimit,
    warningNote: ''
  };
  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        // 1. Text Search
        const matchesSearch = 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Quick Action Filters
        let matchesFilter = true;
        if (activeFilter === 'lowstock') {
            matchesFilter = p.stock <= (p.reorderLevel || lowStockLimit);
        } else if (activeFilter === 'expiring') {
            const expiryDate = new Date(p.expiryDate);
            const now = new Date();
            const diffTime = expiryDate.getTime() - now.getTime();
            const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            matchesFilter = daysToExpiry <= expiryAlertDays && daysToExpiry >= 0; // Exclude already expired from this filter if desired, or include
        }

        return matchesSearch && matchesFilter;
    });
  }, [products, searchTerm, activeFilter, lowStockLimit, expiryAlertDays]);

  useEffect(() => {
    if (isAddModalOpen && barcodeInputRef.current) {
        setTimeout(() => {
            barcodeInputRef.current?.focus();
        }, 100);
    }
  }, [isAddModalOpen]);

  const generateBarcode = () => {
    const newBarcode = `MED${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData(prev => ({ ...prev, barcode: newBarcode }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const now = new Date();
    const expiry = formData.expiryDate ? new Date(formData.expiryDate) : null;

    if (!formData.name) newErrors.name = "Product name is required";
    if (!formData.genericName) newErrors.genericName = "Generic name/formula is required";
    if (!formData.barcode) newErrors.barcode = "Barcode is required";
    if (!formData.batchNumber) newErrors.batchNumber = "Batch number is required";
    
    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else if (expiry && expiry < now) {
      newErrors.expiryDate = "Expiry date cannot be in the past";
    }

    if (!formData.costPrice || formData.costPrice <= 0) newErrors.costPrice = "Invalid cost price";
    if (!formData.price || formData.price <= 0) newErrors.price = "Invalid sales price";
    if (Number(formData.costPrice) > Number(formData.price)) newErrors.price = "Sales price cannot be lower than cost";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const newProduct = {
        ...formData,
        id: Math.floor(Math.random() * 100000), 
        sku: formData.sku || formData.barcode || 'N/A', 
      } as Product;
      
      onAddProduct(newProduct);
      setIsAddModalOpen(false);
      setFormData(initialFormState);
      alert("Product Added Successfully!");
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (user.role !== 'admin') return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\nCheck for existing sales before confirming.`
    );

    if (confirmed) {
        onDeleteProduct(id);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = Number(value);
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500">Track medicine stock, barcodes, and pricing (PKR).</p>
        </div>
        {['admin', 'pharmacist'].includes(user.role) && (
            <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors font-medium"
            >
            <Plus size={20} />
            Add Product
            </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Name, Generic, Barcode..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
            {activeFilter && (
                <div className="flex items-center gap-2 px-3 py-2 bg-medical-50 text-medical-700 rounded-lg text-sm font-medium border border-medical-100">
                    Filter: <span className="capitalize">{activeFilter === 'lowstock' ? 'Low Stock' : 'Expiring Soon'}</span>
                    <button onClick={() => window.history.back()} className="hover:bg-medical-200 rounded-full p-0.5"><X size={14}/></button>
                </div>
            )}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-medium bg-white">
            <Filter size={18} />
            Filters
            </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Form/Strength</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Identifiers</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (PKR)</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                        <div className="font-bold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.genericName}</div>
                        <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                            {product.category}
                        </div>
                    </div>
                  </td>
                   <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{product.form}</div>
                    <div className="text-xs text-gray-500">{product.strength}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-gray-600">
                            <ScanBarcode size={12} />
                            <span className="font-mono">{product.barcode}</span>
                        </div>
                        <div className="text-gray-400">SKU: {product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${product.stock <= (product.reorderLevel || lowStockLimit) ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className={`text-sm ${product.stock <= (product.reorderLevel || lowStockLimit) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {product.stock} Units
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {product.price}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-medium space-y-2">
                     <div className="flex flex-col gap-1 items-end">
                        {product.requiresPrescription && (
                            <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full w-fit">
                                Rx Only
                            </span>
                        )}
                        {product.isNarcotic && (
                            <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                                Controlled
                            </span>
                        )}
                     </div>
                     {user.role === 'admin' && (
                         <button 
                            onClick={() => handleDelete(product.id, product.name)}
                            className="flex items-center gap-1 text-gray-400 hover:text-red-600 mt-2 px-2 py-1 rounded hover:bg-red-50 transition-colors ml-auto"
                         >
                             <Trash2 size={14} /> <span className="text-[10px]">Remove</span>
                         </button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No products found matching your search.
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
                <p className="text-sm text-gray-500">Enter medicine details below</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Section 1: Product Identity */}
              <section>
                <h3 className="text-sm font-bold text-medical-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                  1. Product Identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode / SKU *</label>
                    <div className="flex gap-2">
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        name="barcode"
                        value={formData.barcode || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none ${errors.barcode ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Scan or Enter"
                        autoFocus
                      />
                      <button type="button" onClick={generateBarcode} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                        <ScanBarcode size={18} />
                      </button>
                    </div>
                    {errors.barcode && <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>}
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="e.g. Panadol Extra"
                    />
                     {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name / Formula *</label>
                    <input
                      type="text"
                      name="genericName"
                      value={formData.genericName || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none ${errors.genericName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="e.g. Paracetamol + Caffeine"
                    />
                    {errors.genericName && <p className="text-red-500 text-xs mt-1">{errors.genericName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category / Type *</label>
                    <select
                      name="form"
                      value={formData.form}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none bg-white"
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Injection">Injection</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Gel">Gel</option>
                      <option value="Drops">Drops</option>
                      <option value="Sachet">Sachet</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage / Strength</label>
                    <input
                      type="text"
                      name="strength"
                      value={formData.strength || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                      placeholder="e.g. 500mg"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Therapeutic Category</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                      placeholder="e.g. Antibiotics"
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: Pharmacy Tracking */}
              <section>
                <h3 className="text-sm font-bold text-medical-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                  2. Pharmacy Tracking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={formData.batchNumber || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none ${errors.batchNumber ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Batch #"
                    />
                    {errors.batchNumber && <p className="text-red-500 text-xs mt-1">{errors.batchNumber}</p>}
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Manufacturer</label>
                    <input
                      type="text"
                      name="supplier"
                      value={formData.supplier || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                      placeholder="e.g. GSK"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Inventory & Pricing */}
              <section>
                <h3 className="text-sm font-bold text-medical-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                  3. Inventory & Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Packing / Unit Type</label>
                    <input
                      type="text"
                      name="packSize"
                      value={formData.packSize || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                      placeholder="e.g. Box of 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level (Alert)</label>
                    <input
                      type="number"
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (Unit) *</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400">PKR</span>
                        <input
                        type="number"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleChange}
                        min="0"
                        className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none ${errors.costPrice ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                     {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Price (MRP) *</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400">PKR</span>
                        <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                     {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                  </div>
                  
                   <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rack / Shelf Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                      placeholder="e.g. Rack A-2"
                    />
                  </div>
                </div>
              </section>

               {/* Section 4: Smart Features */}
               <section>
                <h3 className="text-sm font-bold text-medical-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                  4. Smart Pharmacy Features
                </h3>
                <div className="flex flex-col sm:flex-row gap-6">
                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors flex-1">
                        <input 
                            type="checkbox" 
                            name="requiresPrescription"
                            checked={formData.requiresPrescription}
                            onChange={handleChange}
                            className="w-5 h-5 text-medical-600 rounded focus:ring-medical-500 border-gray-300"
                        />
                        <div>
                            <span className="block font-medium text-gray-900">Prescription Required</span>
                            <span className="block text-xs text-gray-500">Flags item in POS to check prescription</span>
                        </div>
                    </label>

                     <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors flex-1">
                        <input 
                            type="checkbox" 
                            name="isNarcotic"
                            checked={formData.isNarcotic}
                            onChange={handleChange}
                            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 border-gray-300"
                        />
                        <div>
                            <span className="block font-medium text-gray-900">Narcotic / Controlled Drug</span>
                            <span className="block text-xs text-gray-500">Enables specific reporting for regulated items</span>
                        </div>
                    </label>
                </div>
                
                <div className="mt-4">
                     <label className="block text-sm font-medium text-gray-700 mb-1">POS Warning Note</label>
                     <textarea
                        name="warningNote"
                        value={formData.warningNote || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:outline-none"
                        rows={2}
                        placeholder="e.g. Do not sell to minors"
                     />
                </div>
               </section>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-medical-600 text-white rounded-xl font-medium hover:bg-medical-700 transition-colors shadow-lg shadow-medical-500/20 flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;