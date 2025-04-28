import type { Metadata } from "next/types";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "../components/Sidebar";
import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "../context/SidebarContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Research Assistant",
  description: "Generate and view research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg-primary text-fg-primary min-h-screen`}
      >
        <ClerkProvider>
          <Providers>
            <SidebarProvider>
              <div className="flex h-screen">
                <Sidebar />
                <main className="flex-1 w-full h-full p-4 overflow-auto">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
