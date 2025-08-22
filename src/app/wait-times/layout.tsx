import { Suspense } from "react";
import Header from "@/components/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Disneyland Wait Times",
    description: "View current wait times for Disneyland attractions.",
};

export default function WaitTimesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main>
            <Header />
            <div className="h-full flex flex-col justify-center items-center p-4">
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </div>
        </main>
    );
}
