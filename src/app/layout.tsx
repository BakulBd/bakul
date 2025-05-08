import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/LayoutParts";
import Footer from "@/components/LayoutParts";
import { ThemeProvider } from "@/components/ThemeProvider";
import LoadingScreen from "@/components/LoadingScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Professional Portfolio",
  description: "Showcasing projects, skills, and achievements.",
  metadataBase: new URL("https://www.professionalportfolio.com"),
  openGraph: {
    title: "Professional Portfolio",
    description: "Showcasing projects, skills, and achievements.",
    url: "https://www.professionalportfolio.com",
    type: "website",
    images: [
      {
        url: "/public/globe.svg",
        width: 1200,
        height: 630,
        alt: "Portfolio Thumbnail",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Portfolio",
    description: "Showcasing projects, skills, and achievements.",
    images: ["/public/globe.svg"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white dark:bg-gray-950`}
      >
        <ThemeProvider attribute="class" enableSystem>
          <LoadingScreen />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
