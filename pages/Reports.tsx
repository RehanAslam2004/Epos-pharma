import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, Activity, Lock, FileText, AlertTriangle } from 'lucide-react';
import { Sale, AuditLog, User } from '../types';

interface ReportsProps {
    sales: Sale[];
    auditLogs: AuditLog[];
    user: User;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

const Reports: React.FC<ReportsProps> = ({ sales, auditLogs, user }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'controlled' | 'audit'>('summary');

  // --- Calculations for Summary ---
  const revenueData = React.useMemo(() => {
     // Group by Date (YYYY-MM-DD)
     const groups: Record<string, number> = {};
     sales.forEach(s => {
         const date = s.date.split('T')[0];
         groups[date] = (groups[date] || 0) + s.totalAmount;
     });
     
     // Last 7 days filler
     const data = [];
     for(let i=6; i>=0; i--) {
         const d = new Date();
         d.setDate(d.getDate() - i);
         const key = d.toISOString().split('T')[0];
         data.push({ date: new Date(key).toLocaleDateString('en-PK', {weekday: 'short'}), fullDate: key, amount: groups[key] || 0 });
     }
     return data;
  }, [sales]);

  const categoryData = React.useMemo(() => {
     // Mocking categories based on mock data logic would require product join, simplified here
     return [
        { name: 'Antibiotics', value: 35 },
        { name: 'Pain Relief', value: 25 },
        { name: 'Chronic Care', value: 20 },
        { name: 'Vitamins', value: 15 },
        { name: 'First Aid', value: 5 },
     ];
  }, []);

  const controlledSales = sales.filter(s => s.items.some(i => i.isNarcotic));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Business intelligence and regulatory compliance.</p>
        </div>
        <div className="flex gap-2">
            {user.role === 'admin' && (
                <button 
                onClick={() => setActiveTab('audit')} 
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'audit' ? 'bg-gray-800 text-white' : 'bg-white border text-gray-600'}`}
                >
                <Lock size={16} className="inline mr-2" /> Audit Log
                </button>
            )}
             <button 
                onClick={() => setActiveTab('controlled')} 
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'controlled' ? 'bg-amber-600 text-white' : 'bg-white border text-gray-600'}`}
             >
                <AlertTriangle size={16} className="inline mr-2" /> Controlled Drugs
             </button>
             <button 
                onClick={() => setActiveTab('summary')} 
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'summary' ? 'bg-medical-600 text-white' : 'bg-white border text-gray-600'}`}
             >
                <Activity size={16} className="inline mr-2" /> Sales Summary
             </button>
        </div>
      </div>

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-6">Revenue Overview (Last 7 Days)</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                    <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `${value/1000}k`} />
                    <Tooltip 
                    formatter={(value) => [`PKR ${value}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
                </ResponsiveContainer>
            </div>
            </div>

            {/* Category Sales Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-6">Sales by Category (Demo Data)</h3>
            <div className="h-80 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
                {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
                ))}
            </div>
            </div>
        </div>
      )}

      {activeTab === 'controlled' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-amber-50">
                  <h3 className="font-bold text-amber-800">Controlled Drugs Audit Log</h3>
                  <p className="text-xs text-amber-600">Regulatory requirement for Narcotics/Psychotropics.</p>
              </div>
              <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                      <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Invoice ID</th>
                          <th className="px-6 py-3">Medicine</th>
                          <th className="px-6 py-3">Batch</th>
                          <th className="px-6 py-3">Qty</th>
                          <th className="px-6 py-3">User</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {controlledSales.map(sale => 
                         sale.items.filter(i => i.isNarcotic).map((item, idx) => (
                             <tr key={`${sale.id}-${idx}`}>
                                 <td className="px-6 py-4 text-sm">{new Date(sale.date).toLocaleString()}</td>
                                 <td className="px-6 py-4 text-sm font-mono">{sale.id}</td>
                                 <td className="px-6 py-4 text-sm font-medium">{item.productName}</td>
                                 <td className="px-6 py-4 text-sm">{item.batchNumber}</td>
                                 <td className="px-6 py-4 text-sm font-bold">{item.quantity}</td>
                                 <td className="px-6 py-4 text-sm">{sale.userName}</td>
                             </tr>
                         ))
                      )}
                      {controlledSales.length === 0 && (
                          <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No controlled drugs sold yet.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      )}

      {activeTab === 'audit' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-900">System Security Log</h3>
                  <p className="text-xs text-gray-500">Track sensitive actions and changes.</p>
              </div>
              <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                      <tr>
                          <th className="px-6 py-3">Timestamp</th>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Action</th>
                          <th className="px-6 py-3">Details</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {auditLogs.map(log => (
                          <tr key={log.id}>
                               <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                               <td className="px-6 py-4 text-sm font-medium">{log.userName}</td>
                               <td className="px-6 py-4 text-sm"><span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">{log.action}</span></td>
                               <td className="px-6 py-4 text-sm text-gray-600">{log.details}</td>
                          </tr>
                      ))}
                       {auditLogs.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No logs available.</td></tr>
                      )}
                  </tbody>
              </table>
           </div>
      )}
    </div>
  );
};

export default Reports;