import React, { useState } from 'react';
import { Pill, Activity, ShieldCheck } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // Simulate Session Login by matching email
      const user = MOCK_USERS.find(u => u.email === email);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Try admin@epos.com, pharm@epos.com, or cash@epos.com');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-medical-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-10 right-10 text-medical-200 opacity-50">
                <Activity size={120} />
            </div>
            <div className="absolute bottom-10 left-10 text-medical-200 opacity-50">
                <Pill size={120} />
            </div>
        </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
            <div className="bg-white p-3 rounded-2xl shadow-lg text-medical-600">
                <Pill size={40} />
            </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
          EPOS Pharma
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          Authorized Personnel Only
        </p>

        <div className="bg-white py-8 px-4 shadow-xl shadow-medical-500/10 sm:rounded-2xl sm:px-10 border border-white">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-medical-500 focus:border-medical-500 transition-all sm:text-sm"
                  placeholder="admin@epos.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-medical-500 focus:border-medical-500 transition-all sm:text-sm"
                  placeholder="Any password works"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
              <ShieldCheck size={14} className="text-medical-600" />
              <span>Session-based Role Access (Admin, Pharmacist, Cashier)</span>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-medical-600 hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-500 transition-all disabled:opacity-70 disabled:cursor-wait"
              >
                {isLoading ? 'Verifying Session...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;