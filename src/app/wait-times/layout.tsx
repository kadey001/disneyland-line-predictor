import { Suspense } from "react";
import DisneyLoader from "@/components/disney-loader";
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
        <div>
            {/* Background image with blur */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/background.jpg')",
                    zIndex: -2
                }}
            />
            {/* Dark overlay for better text readability */}
            <div
                className="fixed inset-0 bg-black/30"
                style={{ zIndex: -1 }}
            />
            <div className="relative h-full flex flex-col justify-center items-center p-4">
                <Suspense fallback={<DisneyLoader />}>
                    {children}
                </Suspense>
            </div>
        </div>
    );
}
