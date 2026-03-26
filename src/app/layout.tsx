import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "vidz - Your YouTube Dashboard",
  description: "Personal YouTube data dashboard - track subscriptions, discover content by topic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} min-h-full antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1">
              <MobileNav />
              <main className="px-4 md:px-6 pb-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}