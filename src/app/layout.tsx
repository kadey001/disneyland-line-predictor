import type { Metadata } from "next";
import { Cormorant_Garamond, Mulish } from "next/font/google";
import { ThemeProvider } from "@/providers";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SkyBackground from "@/components/sky-background";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import { ClientProviders } from "@/components/ClientProviders";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Line Magic — Live Wait Times",
  description: "Less waiting, more wonder. Live ride wait times, hourly trends, and the shortest lines right now.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${mulish.variable} antialiased min-h-screen flex flex-col`}
      >
        <ErrorBoundaryWrapper>
          <ClientProviders>
            <ThemeProvider>
              <SkyBackground />
              <Header />
              <main className="relative z-[1] flex-1">
                {children}
                {process.env.NODE_ENV === 'production' && <Analytics />}
                {process.env.NODE_ENV === 'production' && <SpeedInsights />}
              </main>
              <Footer />
            </ThemeProvider>
          </ClientProviders>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
