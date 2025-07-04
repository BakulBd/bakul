import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EnhancedNavbar, EnhancedFooter } from "@/components/layout/EnhancedLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import EnhancedLoadingScreen from "@/components/EnhancedLoadingScreen";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Bakul Ahmed - Full Stack Developer & UI/UX Designer",
    template: "%s | Bakul Ahmed"
  },
  description: "Full Stack Developer specializing in React, Next.js, and modern web technologies. Creating exceptional digital experiences with clean code and intuitive design.",
  keywords: [
    "Full Stack Developer",
    "React Developer",
    "Next.js",
    "TypeScript",
    "UI/UX Designer",
    "Web Development",
    "Frontend",
    "Backend",
    "Portfolio"
  ],
  authors: [{ name: "Bakul Ahmed", url: "https://bakulahmed.dev" }],
  creator: "Bakul Ahmed",
  metadataBase: new URL("https://bakulahmed.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bakulahmed.dev",
    siteName: "Bakul Ahmed Portfolio",
    title: "Bakul Ahmed - Full Stack Developer & UI/UX Designer",
    description: "Full Stack Developer specializing in React, Next.js, and modern web technologies. Creating exceptional digital experiences with clean code and intuitive design.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bakul Ahmed - Full Stack Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bakul Ahmed - Full Stack Developer & UI/UX Designer",
    description: "Full Stack Developer specializing in React, Next.js, and modern web technologies. Creating exceptional digital experiences with clean code and intuitive design.",
    images: ["/og-image.jpg"],
    creator: "@bakulahmed",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={true}
        >
          <EnhancedLoadingScreen />
          <div className="flex flex-col min-h-screen">
            <EnhancedNavbar />
            <main className="flex-1 relative">
              <div className="pt-16 lg:pt-20 min-h-screen">
                {children}
              </div>
            </main>
            <EnhancedFooter />
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
