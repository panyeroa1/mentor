import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

type AuthMode = 'login' | 'signup';

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('learner');
  const { login, signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    let result;
    if (mode === 'login') {
        result = await login(email, password);
    } else {
        result = await signup(email, password, fullName, role);
    }

    if (result.error) {
        setError(result.error.message);
        setIsLoading(false);
    }
    // On success, the AuthProvider will handle navigation, so no need to setIsLoading(false)
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm mx-auto bg-gray-800 rounded-lg shadow-lg shadow-amber-900/20 overflow-hidden">
        <div className="p-8 bg-gray-900 flex justify-center">
            <img src="https://aiteksoftware.site/magnetar/logo.png" alt="Magnetar Logo" className="h-24 w-auto" />
        </div>
        
        <div className="p-8">
            <p className="text-center text-gray-400 mb-6">
            {mode === 'login' ? 'Welcome back! Please sign in.' : 'Create your account'}
            </p>

            <div className="flex border-b border-gray-700 mb-6">
            <button
                onClick={() => { setMode('login'); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                mode === 'login' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-200'
                }`}
            >
                Log In
            </button>
            <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                mode === 'signup' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-200'
                }`}
            >
                Sign Up
            </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
                <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
                />
            )}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
            />
            {mode === 'signup' && (
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                    <option value="learner">I'm a Learner/Viewer</option>
                    <option value="mentor">I'm a Mentor/Trainer</option>
                    <option value="client">I'm a Client</option>
                </select>
            )}

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 text-white font-bold py-2 px-4 rounded-md hover:bg-amber-700 disabled:bg-amber-800 transition-colors"
            >
                {isLoading ? 'Loading...' : (mode === 'login' ? 'Log In' : 'Create Account')}
            </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;