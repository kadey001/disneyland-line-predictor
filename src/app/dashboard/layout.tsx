import { Suspense } from "react";
import DisneyLoader from "@/components/disney-loader";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Disneyland Wait Times",
    description: "View current wait times for Disneyland attractions.",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="h-full">
            {/* Background image with mobile-optimized positioning */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('https://kcr90ci7l2.ufs.sh/f/qmwD8TJNhAVRXikesuKbQoO8J7t16hSykZ29wmKMY0lIiBaz')",
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
            <Suspense fallback={<DisneyLoader />}>
                {children}
            </Suspense>
        </div>
    );
}
