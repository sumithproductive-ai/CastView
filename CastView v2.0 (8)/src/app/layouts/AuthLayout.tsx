import { type ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      {children}
    </div>
  );
}
