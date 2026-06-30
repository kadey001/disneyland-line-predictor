import { Suspense } from "react";
import DisneyLoader from "@/components/disney-loader";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Line Magic — Wait Times",
    description: "Live ride wait times, hourly trends, and the shortest lines right now.",
};

export default function WaitTimesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Suspense fallback={<DisneyLoader />}>
            {children}
        </Suspense>
    );
}
