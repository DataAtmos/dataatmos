import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/lib/providers/theme-provider"
import "./globals.css"

const THEME_INIT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("dataatmos-theme");var dark=window.matchMedia("(prefers-color-scheme: dark)").matches;var n=t==="light"||t==="dark"?t:(dark?"dark":"light");d.classList.add(n);d.style.colorScheme=n}catch(e){}})()`

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://dataatmos.ai"),
  title: "Data Atmos – The single platform for all your data needs",
  description:
    "Managed databases, real-time analytics, data connectors and AI workloads in one platform. Data Atmos runs inside your AWS account and is fully managed by us.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Data Atmos – The single platform for all your data needs",
    description:
      "Managed databases, real-time analytics, data connectors and AI workloads in one platform. Fully managed BYOC on AWS.",
    url: "https://dataatmos.ai",
    siteName: "Data Atmos",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Data Atmos – The single platform for all your data needs",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Data Atmos – The single platform for all your data needs",
    description:
      "Managed databases, real-time analytics, data connectors and AI workloads in one platform.",
    images: ["/og.png"],
    creator: "@dataatmos",
  },
  alternates: {
    canonical: "https://dataatmos.ai",
  },
  robots: {
    index: true,
    follow: true,
  },
  applicationName: "Data Atmos",
  keywords: [
    "PostgreSQL",
    "ClickHouse",
    "managed database",
    "real-time analytics",
    "CDC",
    "BYOC",
    "Iceberg",
    "Parquet",
    "data platform",
    "OLTP",
    "OLAP",
    "AWS",
  ],
  authors: [
    {
      name: "Data Atmos",
      url: "https://github.com/DataAtmos",
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="antialiased h-full font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="dataatmos-theme"
        >
          <ClerkProvider
            signInUrl="/auth"
            signUpUrl="/auth"
            taskUrls={{ "choose-organization": "/onboarding/organization" }}
          >
            <div className="h-full flex flex-col bg-background">{children}</div>
            <Toaster />
            <Analytics />
            <SpeedInsights />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
