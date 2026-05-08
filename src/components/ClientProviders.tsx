'use client'

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Dynamically import SupabaseProvider to avoid SSR issues
const SupabaseProvider = dynamic(() => import("@/providers").then(mod => ({ default: mod.SupabaseProvider })), {
    ssr: false,
    loading: () => null
});

interface ClientProvidersProps {
    children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <SupabaseProvider>
            {children}
        </SupabaseProvider>
    );
}
