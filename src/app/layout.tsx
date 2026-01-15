import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/layout/Footer";

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
    default: "Bakul Ahmed - AI Enthusiast & Software Developer",
    template: "%s | Bakul Ahmed"
  },
  description: "🚀 AI Enthusiast & Software Developer | CSE Student at Green University, Bangladesh. Specializing in React, Next.js, Python, and modern web technologies. Transforming ideas into innovative digital solutions.",
  keywords: [
    "AI Enthusiast",
    "Software Developer", 
    "Full Stack Developer",
    "Modern Web Solutions",
    "React Developer",
    "Next.js Developer",
    "Bakul Ahmed Portfolio",
    "Custom Web Applications",
    "E-commerce Solutions",
    "Frontend Development Expert",
    "Backend API Development",
    "Database Design",
    "Cloud Deployment",
    "Responsive Web Design",
    "Performance Optimization",
    "SEO Optimization",
    "Progressive Web Apps",
    "JavaScript Expert",
    "Node.js Developer",
    "React Native Development",
    "Database Design",
    "AWS Cloud Services",
    "Vercel Deployment",
    "MongoDB Solutions",
    "PostgreSQL Expert",
    "Git Version Control",
    "Agile Development",
    "Code Quality Assurance",
    "Web Security Best Practices",
    "Tailwind CSS Expert",
    "Framer Motion Animations",
    "Docker Containerization",
    "API Integration",
    "CMS Development",
    "Portfolio Website",
    "Freelance Developer",
    "Software Engineer",
    "Web Performance",
    "Mobile First Design",
    "Cross Browser Compatibility",
    "Clean Code",
    "Modern Architecture",
    "Scalable Solutions"
  ],
  authors: [{ name: "Bakul Ahmed", url: "https://bakul.dev" }],
  creator: "Bakul Ahmed",
  publisher: "Bakul Ahmed",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://bakul.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bakul.dev",
    title: "Bakul Ahmed - AI Enthusiast & Software Developer",
    description: "🚀 AI Enthusiast & Software Developer | CSE Student at Green University, Bangladesh. Expert in React, Next.js, Python, and modern web technologies. Building innovative digital solutions.",
    siteName: "Bakul Ahmed Portfolio",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bakul Ahmed - Software Developer Portfolio",
      },
      {
        url: "/og-image-square.jpg",
        width: 400,
        height: 400,
        alt: "Bakul Ahmed - Full Stack Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bakul Ahmed - Software Developer",
    description: "🚀 AI Enthusiast & Software Developer | React, Next.js, Python | CSE Student at Green University, Bangladesh",
    creator: "@cyberbokul",
    site: "@cyberbokul",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-verification-code",
    yandex: "yandex-verification-code",
    yahoo: "yahoo-verification-code",
    bing: "bing-verification-code",
  },
  category: "technology",
  classification: "portfolio",
  other: {
    "application-name": "Bakul Ahmed Portfolio",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Bakul Ahmed",
    "theme-color": "#3b82f6",
    "color-scheme": "light dark",
  },
};

const PERSON_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Bakul Ahmed",
  jobTitle: "Software Developer",
  description:
    "AI Enthusiast & Software Developer specializing in React, Next.js, Python & modern web technologies. CSE Student at Green University, Bangladesh.",
  url: "https://bakul.dev",
  sameAs: [
    "https://github.com/bakulbd",
    "https://linkedin.com/in/cyberbokul",
    "https://twitter.com/cyberbokul",
  ],
  knowsAbout: [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "JavaScript",
    "Python",
    "PostgreSQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Tailwind CSS",
    "UI/UX Design",
  ],
  hasOccupation: {
    "@type": "Occupation",
    name: "Full Stack Developer",
    occupationLocation: {
      "@type": "Country",
      name: "Global",
    },
  },
  offers: {
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: "Web Development Services",
      description: "Custom web applications, e-commerce solutions, and modern responsive websites",
    },
  },
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_SCHEMA) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 relative">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--card)',
                color: 'var(--card-foreground)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
