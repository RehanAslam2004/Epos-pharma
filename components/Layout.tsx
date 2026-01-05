import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Pill, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'pharmacist', 'cashier'] },
    { icon: ShoppingCart, label: 'Point of Sale', path: '/pos', roles: ['admin', 'pharmacist', 'cashier'] },
    { icon: Pill, label: 'Inventory', path: '/inventory', roles: ['admin', 'pharmacist'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-medical-50">
            <div className="flex items-center gap-2 text-medical-700">
              <div className="bg-medical-500 text-white p-1.5 rounded-lg">
                <Pill size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight">EPOS Pharma</span>
            </div>
            <button className="ml-auto lg:hidden" onClick={toggleSidebar}>
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-medical-50 text-medical-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon size={18} className={isActive ? 'text-medical-600' : 'text-gray-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-medical-100 flex items-center justify-center text-medical-600 font-bold border border-medical-200">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <div className="flex items-center gap-1">
                  <Shield size={10} className="text-medical-500" />
                  <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-gray-900">EPOS Pharma</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;