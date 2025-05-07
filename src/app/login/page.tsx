'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (isSignUp && !name)) {
      setError('All fields are required');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              name
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        // Create profile row
        if (data.user) {
          await supabase.from('profiles').insert({ 
            id: data.user.id, 
            name, 
            avatar_url: '', 
            role: 'user', 
            email 
          });
        }
        
        router.replace('/admin');
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        router.replace('/admin');
      }
    } catch (err) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {isSignUp
                ? 'Create a new account to get started'
                : 'Sign in to manage your content'}
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 rounded border dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 rounded border dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-3 py-2 rounded border dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                minLength={6}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignUp ? 'Creating Account...' : 'Signing in...'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <div>
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(false)} 
                  className="text-indigo-600 hover:text-indigo-500 font-medium focus:outline-none"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div>
                Don&apos;t have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(true)} 
                  className="text-indigo-600 hover:text-indigo-500 font-medium focus:outline-none"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}