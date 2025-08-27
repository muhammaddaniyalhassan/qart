'use client';

import { SessionProvider } from 'next-auth/react';
import { CustomerSessionProvider } from './contexts/CustomerSessionContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CustomerSessionProvider>
        {children}
      </CustomerSessionProvider>
    </SessionProvider>
  );
}
