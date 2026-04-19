import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { RoleProvider } from "../context/RoleContext";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexus-command.vercel.app';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nexus Command — AI Disaster Response | Keesara Mandal, Hyderabad",
    template: "%s | Nexus Command"
  },
  description:
    "Real-time AI-powered emergency dispatch system powered by Groq, MongoDB Change Streams, and Socket.io. Built for the Google Solutions Challenge 2026 — Keesara Mandal disaster response.",
  keywords: [
    "disaster response", "emergency dispatch", "AI triage", "Keesara Mandal",
    "Hyderabad", "real-time map", "Google Solutions Challenge"
  ],
  authors: [{ name: "TechSynapse" }],
  creator: "TechSynapse",
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
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    title: "Nexus Command — AI Disaster Response",
    description:
      "Real-time AI-powered emergency dispatch for Keesara Mandal, Hyderabad. Built for Google Solutions Challenge 2026.",
    siteName: "Nexus Command",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus Command — AI Disaster Response",
    description: "Real-time AI-powered emergency dispatch. Built for Google Solutions Challenge 2026.",
    creator: "@techsynapse",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c18",
};

export default function RootLayout({ children }) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkKey) {
    console.warn("Sector 7 Warning: Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Authentication features will be disabled.");
  }

  return (
    <html lang="en">
      <head>
        {/* Leaflet CSS — loaded via CDN for SSR compat with react-leaflet */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
          defer
        />
        <script
          src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"
          defer
        />
      </head>
      <body className={`${inter.className} bg-[#0b1326] text-[#dae2fd] min-h-screen`}>
        <RoleProvider>
          {clerkKey ? (
            <ClerkProvider
              publishableKey={clerkKey}
              appearance={{
                layout: {
                  socialButtonsPlacement: 'top',
                  socialButtonsVariant: 'blockButton',
                },
                variables: {
                  colorPrimary: '#7bd0ff',
                  colorBackground: '#171f33',
                  colorText: '#dae2fd',
                  borderRadius: '0.75rem',
                },
              }}
            >
              {children}
            </ClerkProvider>
          ) : (
            <div className="flex flex-col min-h-screen">
              <div className="bg-amber-500/10 text-amber-500 text-[10px] py-1 px-4 text-center font-black tracking-widest uppercase border-b border-amber-500/20">
                DEVELOPMENT MODE: AUTHENTICATION BYPASSED
              </div>
              {children}
            </div>
          )}
        </RoleProvider>
      </body>
    </html>
  );
}
