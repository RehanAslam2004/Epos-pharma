import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { User, Product, AppSetting, Sale, AuditLog, HeldSale, CartItem, PaymentMethod } from './types';
import { MOCK_PRODUCTS, MOCK_USERS, DEFAULT_SETTINGS } from './constants';

const App: React.FC = () => {
  // --- Persistent Session ---
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('epos_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('epos_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('epos_user');
    }
  }, [user]);

  // --- State Management ---
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [settings, setSettings] = useState<AppSetting[]>(DEFAULT_SETTINGS);
  
  // New States for Data Persistence (in-memory for demo)
  const [sales, setSales] = useState<Sale[]>([]);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // --- Helper: Audit Logging ---
  const logAction = (action: string, details: string) => {
    if (!user) return;
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- Handlers ---
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Log login (optional, careful with loops if we logged purely on state change)
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
    logAction('ADD_PRODUCT', `Added product: ${newProduct.name} (${newProduct.sku})`);
  };

  const handleDeleteProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check dependency
    const isUsedInSales = sales.some(s => s.items.some(i => i.productId === productId));
    if (isUsedInSales) {
      alert("Cannot delete product: It has associated sales history. Mark it as inactive instead (future feature).");
      return;
    }

    setProducts(prev => prev.filter(p => p.id !== productId));
    logAction('DELETE_PRODUCT', `Deleted product: ${product.name}`);
  };

  const handleCheckout = (cart: CartItem[], total: number, method: PaymentMethod) => {
    if (!user) return;

    // 1. Deduct Stock
    let stockError = false;
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        if (p.stock < cartItem.quantity) {
            stockError = true;
            return p;
        }
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });

    if (stockError) {
        alert("Error: One or more items have insufficient stock.");
        return;
    }

    setProducts(updatedProducts);

    // 2. Create Sale Record
    const newSale: Sale = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        totalAmount: total,
        paymentMethod: method,
        userId: user.id,
        userName: user.name,
        items: cart.map(c => ({
            productId: c.id,
            productName: c.name,
            quantity: c.quantity,
            price: c.price,
            costPrice: c.costPrice,
            batchNumber: c.batchNumber,
            isNarcotic: c.isNarcotic
        }))
    };

    setSales(prev => [newSale, ...prev]);
    logAction('SALE_COMPLETED', `Sale ID: ${newSale.id}, Total: ${total}`);
  };

  const handleHoldSale = (cart: CartItem[], total: number, note?: string) => {
    if (!user) return;
    const newHeld: HeldSale = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        items: cart,
        total,
        userId: user.id,
        userName: user.name,
        referenceNote: note || `Held at ${new Date().toLocaleTimeString()}`
    };
    setHeldSales(prev => [newHeld, ...prev]);
  };

  const handleResumeSale = (id: string) => {
    setHeldSales(prev => prev.filter(h => h.id !== id));
  };

  // --- Rendering ---
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout} user={user}>
        <Routes>
          <Route 
            path="/" 
            element={<Dashboard user={user} settings={settings} sales={sales} products={products} />} 
          />
          <Route 
            path="/pos" 
            element={
              <POS 
                products={products} 
                settings={settings} 
                onCheckout={handleCheckout} 
                onHold={handleHoldSale}
                heldSales={heldSales}
                onResume={handleResumeSale}
                user={user}
              />
            } 
          />
          <Route 
            path="/inventory" 
            element={
              ['admin', 'pharmacist'].includes(user.role) ? (
                <Inventory 
                  products={products} 
                  onAddProduct={handleAddProduct} 
                  onDeleteProduct={handleDeleteProduct}
                  user={user}
                  settings={settings}
                />
              ) : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/reports" 
            element={
              ['admin', 'pharmacist'].includes(user.role) ? (
                <Reports sales={sales} auditLogs={auditLogs} user={user} />
              ) : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/settings" 
            element={
              user.role === 'admin' ? (
                <Settings 
                  settings={settings} 
                  setSettings={setSettings} 
                  users={users} 
                  setUsers={setUsers} 
                  currentUser={user}
                  logAction={logAction}
                  onClearData={() => setSales([])}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;