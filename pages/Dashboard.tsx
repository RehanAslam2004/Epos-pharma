import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, DollarSign, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, AppSetting, Sale, Product } from '../types';

const StatCard: React.FC<{
  title: string;
  value: string;
  trend?: string;
  icon: React.ElementType;
  color: 'emerald' | 'blue' | 'amber' | 'rose';
  onClick?: () => void;
}> = ({ title, value, trend, icon: Icon, color, onClick }) => {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorStyles[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp size={14} />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
};

interface DashboardProps {
  user: User | null;
  settings?: AppSetting[];
  sales?: Sale[];
  products?: Product[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, settings, sales = [], products = [] }) => {
  const navigate = useNavigate();

  // --- Calculate Real Stats ---
  const today = new Date().toISOString().split('T')[0];
  
  const todaysSales = sales.filter(s => s.date.startsWith(today));
  const dailyRevenue = todaysSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const lowStockThreshold = Number(settings?.find(s => s.key === 'low_stock_limit_default')?.value || 5);
  const lowStockCount = products.filter(p => p.stock <= (p.reorderLevel || lowStockThreshold)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Logged in as {user?.role}. Welcome back, {user?.name}.</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue (Today)" 
          value={`PKR ${dailyRevenue.toLocaleString()}`} 
          trend={todaysSales.length > 0 ? `${todaysSales.length} txns` : undefined}
          icon={DollarSign} 
          color="emerald" 
          onClick={() => navigate('/reports')}
        />
        <StatCard 
          title="Start Sale" 
          value="POS Terminal" 
          icon={Package} 
          color="blue" 
          onClick={() => navigate('/pos')}
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={`${lowStockCount} Items`}
          icon={AlertTriangle} 
          color="amber" 
          onClick={() => navigate('/inventory?filter=lowstock')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Add New Medicine - Admin & Pharmacist Only */}
            {['admin', 'pharmacist'].includes(user?.role || '') && (
              <button 
                onClick={() => navigate('/inventory?action=add')}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-medical-500 hover:bg-medical-50 transition-all text-left group"
              >
                <div className="bg-medical-100 text-medical-600 p-2 rounded-md group-hover:bg-medical-200">
                  <Package size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add New Medicine</p>
                  <p className="text-xs text-gray-500">Update inventory</p>
                </div>
              </button>
            )}

            <button 
              onClick={() => navigate('/inventory?filter=expiring')}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-medical-500 hover:bg-medical-50 transition-all text-left group"
            >
              <div className="bg-blue-100 text-blue-600 p-2 rounded-md group-hover:bg-blue-200">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Check Expiries</p>
                <p className="text-xs text-gray-500">View expiring batches</p>
              </div>
            </button>
            
            {/* Reports/Settings - Admin Only */}
            {user?.role === 'admin' && (
               <button 
                onClick={() => navigate('/reports')}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-medical-500 hover:bg-medical-50 transition-all text-left group"
              >
                <div className="bg-amber-100 text-amber-600 p-2 rounded-md group-hover:bg-amber-200">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Sales Report</p>
                  <p className="text-xs text-gray-500">End of day closing</p>
                </div>
              </button>
            )}
            
            <button 
              onClick={() => navigate('/pos')}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-medical-500 hover:bg-medical-50 transition-all text-left group"
            >
              <div className="bg-purple-100 text-purple-600 p-2 rounded-md group-hover:bg-purple-200">
                <Package size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Go to POS</p>
                <p className="text-xs text-gray-500">Open register</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;