import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

type Tab = 'login' | 'signup';

export function Login() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/onboarding');
  };

  return (
    <div className="flex flex-col items-center">
      {/* Logo */}
      <h1 
        className="text-[28px] mb-[48px]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec', letterSpacing: '0.06em' }}
      >
        CastView
      </h1>

      {/* Card */}
      <div 
        className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] w-full mx-[20px] md:max-w-[400px]"
      >
        {/* Tabs */}
        <div className="flex border-b border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('login')}
            className="flex-1 py-[16px] text-[13px] uppercase tracking-[0.1em] transition-colors relative"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: activeTab === 'login' ? '#111111' : '#0d0d0d',
              color: activeTab === 'login' ? '#f0f0ec' : '#6a6a64'
            }}
          >
            Log In
            {activeTab === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#f0f0ec]" />
            )}
          </button>
          <div className="w-[1px] bg-[#2a2a2a]" />
          <button
            onClick={() => setActiveTab('signup')}
            className="flex-1 py-[16px] text-[13px] uppercase tracking-[0.1em] transition-colors relative"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: activeTab === 'signup' ? '#111111' : '#0d0d0d',
              color: activeTab === 'signup' ? '#f0f0ec' : '#6a6a64'
            }}
          >
            Sign Up
            {activeTab === 'signup' && (
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#f0f0ec]" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-[40px]">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="mb-[20px]">
                <label 
                  className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@agency.com"
                  className="w-full px-[12px] py-[12px] bg-[#0d0d0d] border border-[#2a2a2a] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '13px', 
                    color: '#f0f0ec'
                  }}
                />
              </div>

              <div className="mb-[24px]">
                <label 
                  className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-[12px] py-[12px] bg-[#0d0d0d] border border-[#2a2a2a] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '13px', 
                    color: '#f0f0ec'
                  }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-[14px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: '#f0f0ec',
                  color: '#080808'
                }}
              >
                Sign In
              </button>

              <div className="text-center mt-[12px]">
                <button
                  type="button"
                  className="text-[12px] hover:opacity-70 transition-opacity"
                  style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
                >
                  Forgot password?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="mb-[16px]">
                <label 
                  className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  Agency Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meridian Models"
                  className="w-full px-[12px] py-[12px] bg-[#0d0d0d] border border-[#2a2a2a] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '13px', 
                    color: '#f0f0ec'
                  }}
                />
              </div>

              <div className="mb-[16px]">
                <label 
                  className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Okafor"
                  className="w-full px-[12px] py-[12px] bg-[#0d0d0d] border border-[#2a2a2a] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '13px', 
                    color: '#f0f0ec'
                  }}
                />
              </div>

              <div className="mb-[16px]">
                <label 
                  className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@agency.com"
                  className="w-full px-[12px] py-[12px] bg-[#0d0d0d] border border-[#2a2a2a] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '13px', 
                    color: '#f0f0ec'
                  }}
                />
              </div>

              <div className="mb-[16px]">
                <label 
                  className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-[12px] py-[12px] bg-[#0d0d0d] border border-[#2a2a2a] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '13px', 
                    color: '#f0f0ec'
                  }}
                />
              </div>

              <div className="mb-[24px] text-center">
                <p 
                  className="text-[11px]"
                  style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
                >
                  By creating an account you agree to our Terms of Service.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-[14px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: '#f0f0ec',
                  color: '#080808'
                }}
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Toggle Link */}
      <div className="mt-[24px] text-center">
        {activeTab === 'login' ? (
          <button
            onClick={() => setActiveTab('signup')}
            className="text-[13px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
          >
            New to CastView? Sign up →
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('login')}
            className="text-[13px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
          >
            Already have an account? Log in →
          </button>
        )}
      </div>
    </div>
  );
}