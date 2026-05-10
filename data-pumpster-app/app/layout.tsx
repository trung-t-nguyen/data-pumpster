import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Data Pumpster',
  description: 'CSV to PostgreSQL import pipeline',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-foreground text-[0.6875rem] font-bold text-background">
                DP
              </div>
              <span className="text-[1.125rem] font-bold text-foreground">Data Pumpster</span>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
