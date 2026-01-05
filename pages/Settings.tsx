import React, { useState } from 'react';
import { 
  Store, 
  Users, 
  Bell, 
  Receipt, 
  Database, 
  Save, 
  ShieldAlert, 
  Trash2, 
  Download, 
  Plus, 
  Check, 
  X,
  Edit2
} from 'lucide-react';
import { AppSetting, User, Role } from '../types';

interface SettingsProps {
  settings: AppSetting[];
  setSettings: React.Dispatch<React.SetStateAction<AppSetting[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  logAction: (action: string, details: string) => void;
  onClearData: () => void;
}

type TabType = 'general' | 'users' | 'inventory' | 'billing' | 'data';

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, users, setUsers, currentUser, logAction, onClearData }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User>>({});

  // Helper to get setting value
  const getVal = (key: string) => settings.find(s => s.key === key)?.value || '';

  // Helper to update setting value
  const updateVal = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    setUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    logAction('UPDATE_SETTINGS', 'Store settings updated');
    setUnsavedChanges(false);
    alert('Settings saved successfully!');
  };

  // --- User Management Handlers ---
  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserFormData(user);
    } else {
      setEditingUser(null);
      setUserFormData({ role: 'cashier', status: 'active' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email || !userFormData.role) return;

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userFormData } as User : u));
      logAction('UPDATE_USER', `Updated user: ${userFormData.email}`);
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: userFormData.name!,
        email: userFormData.email!,
        role: userFormData.role as Role,
        status: userFormData.status as 'active' | 'inactive' || 'active'
      };
      setUsers(prev => [...prev, newUser]);
      logAction('CREATE_USER', `Created user: ${newUser.email}`);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string, email: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
        setUsers(prev => prev.filter(u => u.id !== id));
        logAction('DELETE_USER', `Deleted user: ${email}`);
    }
  };

  // --- Danger Zone Handlers ---
  const handleDownloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ settings, users }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "epos_pharma_backup.sql"); // Fake SQL
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    logAction('BACKUP', 'Database backup downloaded');
  };

  const handleClearData = () => {
    const confirmation = prompt("DANGER: This will delete ALL sales history.\n\nType 'DELETE' to confirm:");
    if (confirmation === 'DELETE') {
      onClearData();
      logAction('CLEAR_DATA', 'All sales history cleared by Admin');
      alert("All sales data has been cleared.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[80vh]">
      {/* Settings Sidebar */}
      <div className="w-full lg:w-64 flex flex-col gap-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'general' ? 'bg-white text-medical-600 shadow-sm border border-medical-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
        >
          <Store size={18} />
          General Store
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'users' ? 'bg-white text-medical-600 shadow-sm border border-medical-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
        >
          <Users size={18} />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'inventory' ? 'bg-white text-medical-600 shadow-sm border border-medical-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
        >
          <Bell size={18} />
          Inventory & Alerts
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'billing' ? 'bg-white text-medical-600 shadow-sm border border-medical-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
        >
          <Receipt size={18} />
          Billing & Receipts
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'data' ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
        >
          <Database size={18} />
          Data & Backup
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {activeTab === 'general' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">General Store Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input 
                  type="text" 
                  value={getVal('store_name')}
                  onChange={(e) => updateVal('store_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy License Number *</label>
                <input 
                  type="text" 
                  value={getVal('pharmacy_license')}
                  onChange={(e) => updateVal('pharmacy_license', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                />
                <p className="text-xs text-gray-500 mt-1">Required on all invoices</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                <input 
                  type="text" 
                  value={getVal('store_address')}
                  onChange={(e) => updateVal('store_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={getVal('store_phone')}
                  onChange={(e) => updateVal('store_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="text" 
                  value={getVal('store_email')}
                  onChange={(e) => updateVal('store_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                <select 
                  value={getVal('currency_symbol')}
                  onChange={(e) => updateVal('currency_symbol', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none bg-white"
                >
                  <option value="PKR">PKR (Rs)</option>
                  <option value="$">USD ($)</option>
                  <option value="£">GBP (£)</option>
                </select>
              </div>
               <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo URL</label>
                <div className="flex gap-2">
                    <input 
                    type="text" 
                    value={getVal('store_logo')}
                    onChange={(e) => updateVal('store_logo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                    />
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium">Upload</button>
                </div>
              </div>
            </div>
            {unsavedChanges && (
                <div className="flex justify-end pt-4">
                    <button onClick={handleSaveSettings} className="flex items-center gap-2 px-6 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 shadow-sm transition-colors">
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                <button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 text-sm font-medium">
                    <Plus size={16} /> Add User
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Username / Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                          u.role === 'pharmacist' ? 'bg-blue-100 text-blue-800' : 
                                          'bg-gray-100 text-gray-800'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                        ${u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <button onClick={() => handleOpenUserModal(u)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16} /></button>
                                    {u.id !== currentUser.id && (
                                        <button onClick={() => handleDeleteUser(u.id, u.email)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p className="font-semibold mb-1">Role Permissions:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Admin:</strong> Full access to Settings, Inventory, Reports, POS, Data Clearing.</li>
                    <li><strong>Pharmacist:</strong> Can sell, add/edit products. Cannot delete sales history or access critical settings.</li>
                    <li><strong>Cashier:</strong> POS access only. Basic sales view. No inventory editing.</li>
                </ul>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Inventory Logic ("Pharma Brain")</h2>
            <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Alert Threshold (Days)</label>
                    <input 
                        type="number" 
                        value={getVal('expiry_alert_days')}
                        onChange={(e) => updateVal('expiry_alert_days', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Products expiring within these days will be highlighted red in POS/Inventory.</p>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Limit (Global Default)</label>
                    <input 
                        type="number" 
                        value={getVal('low_stock_limit_default')}
                        onChange={(e) => updateVal('low_stock_limit_default', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Used if a product doesn't have a specific reorder level set.</p>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Markup %</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={getVal('default_markup_percent')}
                            onChange={(e) => updateVal('default_markup_percent', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                        />
                         <span className="absolute right-3 top-2 text-gray-400">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-suggests Sales Price based on Cost Price during entry.</p>
                 </div>
            </div>
            {unsavedChanges && (
                <div className="flex justify-end pt-4">
                    <button onClick={handleSaveSettings} className="flex items-center gap-2 px-6 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 shadow-sm transition-colors">
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            )}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Billing & Receipt Configuration</h2>
            <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Global Tax / VAT %</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={getVal('tax_rate')}
                            onChange={(e) => updateVal('tax_rate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                        />
                         <span className="absolute right-3 top-2 text-gray-400">%</span>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Message</label>
                    <textarea 
                        rows={3}
                        value={getVal('receipt_footer')}
                        onChange={(e) => updateVal('receipt_footer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" 
                    />
                 </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Printer Type</label>
                    <select 
                        value={getVal('printer_type')}
                        onChange={(e) => updateVal('printer_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none bg-white"
                    >
                        <option value="thermal_80">Thermal 80mm</option>
                        <option value="thermal_58">Thermal 58mm</option>
                        <option value="a4_laser">A4 Laser</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="auto_print"
                        checked={getVal('auto_print') === 'true'}
                        onChange={(e) => updateVal('auto_print', e.target.checked ? 'true' : 'false')}
                        className="w-5 h-5 text-medical-600 rounded focus:ring-medical-500 border-gray-300"
                    />
                    <label htmlFor="auto_print" className="text-sm font-medium text-gray-700">Auto-Print Receipt after Sale</label>
                 </div>
            </div>
            {unsavedChanges && (
                <div className="flex justify-end pt-4">
                    <button onClick={handleSaveSettings} className="flex items-center gap-2 px-6 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 shadow-sm transition-colors">
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Download size={20} /> Database Backup
                </h2>
                <p className="text-sm text-gray-600 mb-4">Download a full SQL dump of your products, settings, and users.</p>
                <button onClick={handleDownloadBackup} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
                    Download Backup File
                </button>
             </div>

             <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6">
                <h2 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
                    <ShieldAlert size={20} /> Danger Zone
                </h2>
                <p className="text-sm text-red-600 mb-6">Irreversible actions. Proceed with caution.</p>
                
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-red-100">
                    <div>
                        <h4 className="font-bold text-gray-900">Clear All Sales Data</h4>
                        <p className="text-xs text-gray-500">Deletes transaction history. Keeps inventory & users.</p>
                    </div>
                    <button onClick={handleClearData} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                        Delete All Sales
                    </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* User Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                    <button onClick={() => setIsUserModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                </div>
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none"
                            value={userFormData.name || ''}
                            onChange={(e) => setUserFormData(prev => ({...prev, name: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Username)</label>
                        <input 
                            required
                            type="email" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none"
                            value={userFormData.email || ''}
                            onChange={(e) => setUserFormData(prev => ({...prev, email: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none bg-white"
                            value={userFormData.role || 'cashier'}
                            onChange={(e) => setUserFormData(prev => ({...prev, role: e.target.value as Role}))}
                        >
                            <option value="admin">Admin</option>
                            <option value="pharmacist">Pharmacist</option>
                            <option value="cashier">Cashier</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none bg-white"
                            value={userFormData.status || 'active'}
                            onChange={(e) => setUserFormData(prev => ({...prev, status: e.target.value as any}))}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 shadow-sm">Save User</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;