import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, ScanBarcode, Box, ShoppingCart, AlertTriangle, Pause, Play, AlertCircle, X } from 'lucide-react';
import { Product, CartItem, PaymentMethod, AppSetting, HeldSale, User } from '../types';

interface POSProps {
  products: Product[];
  settings: AppSetting[];
  onCheckout: (cart: CartItem[], total: number, method: PaymentMethod) => void;
  onHold: (cart: CartItem[], total: number) => void;
  heldSales: HeldSale[];
  onResume: (id: string) => void;
  user: User;
}

const POS: React.FC<POSProps> = ({ products, settings, onCheckout, onHold, heldSales, onResume, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Settings
  const taxRate = Number(settings.find(s => s.key === 'tax_rate')?.value || 0);
  const expiryAlertDays = Number(settings.find(s => s.key === 'expiry_alert_days')?.value || 90);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(term) || 
        product.genericName.toLowerCase().includes(term) ||
        product.barcode.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, products]);

  const addToCart = (product: Product) => {
    // 1. Check Expiry
    const today = new Date();
    const expiry = new Date(product.expiryDate);
    if (expiry < today) {
        alert("CRITICAL ERROR: This batch is EXPIRED and cannot be sold.");
        return;
    }

    // 2. Check Prescription Warning
    if (product.requiresPrescription) {
       const proceed = window.confirm(`⚠️ WARNING: ${product.name} requires a prescription.\n\nHave you verified the prescription?`);
       if (!proceed) return;
    }

    // 3. Check Custom Warning
    if (product.warningNote) {
        alert(`NOTE for ${product.name}:\n\n${product.warningNote}`);
    }

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      
      // Check Stock
      const currentQty = existingItem ? existingItem.quantity : 0;
      if (currentQty + 1 > product.stock) {
          alert("Insufficient stock!");
          return currentCart;
      }

      if (existingItem) {
        return currentCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(currentCart => {
      return currentCart.map(item => {
        if (item.id === id) {
          const product = products.find(p => p.id === id);
          if (product && item.quantity + delta > product.stock) {
              alert("Cannot exceed available stock.");
              return item;
          }
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: number) => {
    setCart(currentCart => currentCart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      onCheckout(cart, total, paymentMethod);
      alert(`Transaction Successful!\nAmount: PKR ${total.toLocaleString()}`);
      setCart([]);
      setPaymentMethod('Cash');
      setIsProcessing(false);
    }, 500);
  };

  const handleHold = () => {
    if (cart.length === 0) return;
    onHold(cart, total);
    setCart([]);
    alert("Sale put on hold.");
  };

  const handleResume = (held: HeldSale) => {
    setCart(held.items);
    onResume(held.id);
    setShowHeldModal(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-gray-100 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Scan Barcode or Search by Name, Generic, SKU..."
              className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all font-medium text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <ScanBarcode size={20} />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === cat 
                    ? 'bg-medical-500 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map(product => {
                 const isExpired = new Date(product.expiryDate) < new Date();
                 const daysToExpiry = Math.ceil((new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                 const isNearExpiry = daysToExpiry <= expiryAlertDays && !isExpired;
                 
                 return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0 || isExpired}
                    className={`group flex flex-col bg-white rounded-xl border p-4 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed
                        ${isExpired ? 'border-red-200 bg-red-50' : isNearExpiry ? 'border-amber-200 bg-amber-50 hover:border-amber-400' : 'border-gray-200 hover:border-medical-500 hover:shadow-md'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2 w-full">
                        <div className="min-w-0 pr-2">
                            <h3 className="font-bold text-gray-900 text-lg truncate flex items-center gap-2">
                              {product.name}
                              {product.requiresPrescription && <AlertTriangle size={14} className="text-red-500" />}
                              {isExpired && <span className="text-[10px] bg-red-600 text-white px-1.5 rounded">EXPIRED</span>}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold">{product.form}</span>
                                <span className="font-medium text-medical-600">{product.strength}</span>
                            </div>
                        </div>
                        <span className="font-bold text-lg text-medical-700 whitespace-nowrap">PKR {product.price}</span>
                    </div>
                    
                    <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 w-full">
                      <div className="flex flex-col min-w-0">
                          <span className="truncate">Generic: {product.genericName}</span>
                          <span className={`text-[10px] ${isNearExpiry ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                             {isExpired ? `Expired: ${product.expiryDate}` : isNearExpiry ? `Expiring: ${product.expiryDate}` : `SKU: ${product.sku}`}
                          </span>
                      </div>
                      <div className={`font-medium ml-2 whitespace-nowrap ${product.stock <= product.reorderLevel ? 'text-red-500' : 'text-green-600'}`}>
                          {product.stock} in stock
                      </div>
                    </div>
                  </button>
                )
            })}
            {filteredProducts.length === 0 && (
                <div className="col-span-full py-10 text-center text-gray-400 flex flex-col items-center">
                    <Box size={40} className="mb-2 opacity-50" />
                    <p>No medicines found.</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Summary Area */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            Sale
            <span className="bg-medical-100 text-medical-700 text-xs px-2 py-0.5 rounded-full">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} items
            </span>
          </h2>
          <div className="flex gap-2">
            <button 
                onClick={() => setShowHeldModal(true)} 
                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg relative"
                title="View Held Sales"
            >
                <Pause size={18} />
                {heldSales.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{heldSales.length}</span>}
            </button>
             <button 
                onClick={handleHold} 
                disabled={cart.length === 0}
                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg disabled:opacity-50"
                title="Hold Current Sale"
            >
                <Pause size={18} />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
              <div className="p-4 bg-gray-50 rounded-full">
                <ShoppingCart size={32} />
              </div>
              <p>Scan or select items</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative">
                <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-gray-900 text-sm truncate flex items-center gap-1">
                          {item.name}
                          {item.requiresPrescription && <AlertTriangle size={12} className="text-red-500" />}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">{item.strength} • {item.form}</p>
                    </div>
                    <p className="text-sm font-bold text-medical-700 whitespace-nowrap">PKR {(item.price * item.quantity).toFixed(0)}</p>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-400">@{item.price} each</div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                        <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-medical-50 hover:bg-medical-100 text-medical-600 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                         <button 
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment & Totals */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
          <div className="space-y-1">
             <div className="flex justify-between items-center text-gray-500 text-sm">
              <span>Subtotal</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
             <div className="flex justify-between items-center text-gray-500 text-sm">
              <span>Tax ({taxRate}%)</span>
              <span>PKR {taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
              <span className="text-gray-900 font-bold">Total</span>
              <span className="text-2xl font-bold text-gray-900">PKR {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Method</label>
             <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentMethod === 'Cash' ? 'border-medical-500 bg-medical-50 text-medical-700 ring-1 ring-medical-500' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                <Banknote size={20} className="mb-1" />
                <span className="text-[10px] font-bold">Cash</span>
                </button>
                <button 
                    onClick={() => setPaymentMethod('Easypaisa')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentMethod === 'Easypaisa' ? 'border-medical-500 bg-medical-50 text-medical-700 ring-1 ring-medical-500' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                <CreditCard size={20} className="mb-1" />
                <span className="text-[10px] font-bold">Easypaisa</span>
                </button>
                <button 
                    onClick={() => setPaymentMethod('JazzCash')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentMethod === 'JazzCash' ? 'border-medical-500 bg-medical-50 text-medical-700 ring-1 ring-medical-500' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                <QrCode size={20} className="mb-1" />
                <span className="text-[10px] font-bold">JazzCash</span>
                </button>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-4 bg-medical-600 hover:bg-medical-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-medical-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isProcessing ? 'Processing...' : `Pay PKR ${total.toLocaleString()}`}
          </button>
        </div>
      </div>

       {/* Held Sales Modal */}
       {showHeldModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-lg">Held Sales</h3>
                    <button onClick={() => setShowHeldModal(false)}><X size={20} /></button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {heldSales.length === 0 && <p className="text-gray-500 text-center py-4">No held sales.</p>}
                    {heldSales.map(h => (
                        <div key={h.id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-gray-900">{h.referenceNote}</p>
                                <p className="text-xs text-gray-500">{new Date(h.date).toLocaleString()} • {h.items.length} items</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-medical-700">PKR {h.total.toLocaleString()}</span>
                                <button 
                                    onClick={() => handleResume(h)}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                    title="Resume"
                                >
                                    <Play size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>
       )}
    </div>
  );
};

export default POS;