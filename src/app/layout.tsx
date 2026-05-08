import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers";
import "./globals.css";
import Header from "@/components/header";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import { ClientProviders } from "@/components/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Disneyland Line Predictor",
  description: "Line wait time predictor for Disneyland",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col`}
      >
        <ErrorBoundaryWrapper>
          <ClientProviders>
            <ThemeProvider>
              <Header />
              <main className="flex-1 overflow-auto">
                {children}
                {process.env.NODE_ENV === 'production' && <Analytics />}
                {process.env.NODE_ENV === 'production' && <SpeedInsights />}
              </main>
            </ThemeProvider>
          </ClientProviders>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
