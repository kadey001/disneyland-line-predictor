'use client'

import { ReactNode } from "react";

interface ClientProvidersProps {
    children: ReactNode;
}

// Client providers wrapper — Supabase has been removed, data is served via
// the Go Wait Times API with polling. This component is kept as a future
// extension point for any client-side providers that need 'use client'.
export function ClientProviders({ children }: ClientProvidersProps) {
    return <>{children}</>;
}
