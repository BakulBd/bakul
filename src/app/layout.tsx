import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
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
    default: "Bakul Ahmed - Premium Website Developer | Digital Experience Creator",
    template: "%s | Bakul Ahmed - Premium Developer"
  },
  description: "🌟 Premium Website Developer & Digital Experience Creator. Specializing in cutting-edge web technologies, exceptional UI/UX design, and scalable digital solutions. Transforming ideas into premium web experiences that drive results.",
  keywords: [
    "Premium Website Developer",
    "Digital Experience Creator", 
    "Expert Web Developer",
    "Modern Web Solutions",
    "Premium UI/UX Design",
    "Professional Web Development",
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
    "Supabase Integration",
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
    title: "Bakul Ahmed - Full Stack Developer | Modern Web Solutions",
    description: "🚀 Full Stack Developer with 5+ years experience. Expert in React, Next.js, TypeScript. 50+ projects completed, 30+ satisfied clients worldwide. Building exceptional digital experiences with modern technologies and best practices.",
    siteName: "Bakul Ahmed Portfolio",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bakul Ahmed - Full Stack Developer Portfolio",
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
    title: "Bakul Ahmed - Full Stack Developer",
    description: "🚀 Expert Full Stack Developer | React, Next.js, TypeScript | 5+ years experience | 50+ projects | 30+ satisfied clients worldwide",
    creator: "@bakulahmed",
    site: "@bakulahmed",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Bakul Ahmed",
    "jobTitle": "Full Stack Developer",
    "description": "Premium Full Stack Developer specializing in React, Next.js, TypeScript & modern web technologies. 5+ years building exceptional digital experiences.",
    "url": "https://bakul.dev",
    "sameAs": [
      "https://github.com/bakulahmed",
      "https://linkedin.com/in/bakulahmed",
      "https://twitter.com/bakulahmed"
    ],
    "knowsAbout": [
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
      "UI/UX Design"
    ],
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Full Stack Developer",
      "occupationLocation": {
        "@type": "Country",
        "name": "Global"
      }
    },
    "offers": {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Web Development Services",
        "description": "Custom web applications, e-commerce solutions, and modern responsive websites"
      }
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={true}
        >
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 relative">
              {children}
            </main>
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
