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
            {/* Background image with mobile-optimized positioning */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/background.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    backgroundRepeat: "no-repeat",
                    transform: "translate3d(0, 0, 0)",
                    willChange: "transform",
                    zIndex: -2
                }}
            />
            {/* Dark overlay for better text readability */}
            <div
                className="fixed inset-0 bg-black/30"
                style={{
                    zIndex: -1,
                    transform: "translate3d(0, 0, 0)",
                    willChange: "transform"
                }}
            />
            <div className="relative h-full flex flex-col justify-center items-center">
                <Suspense fallback={<DisneyLoader />}>
                    {children}
                </Suspense>
            </div>
        </div>
    );
}
