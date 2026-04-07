import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { RoleProvider } from "../context/RoleContext";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Nexus Command — AI Disaster Response | Keesara Mandal, Hyderabad",
  description: "Real-time AI-powered emergency dispatch system powered by Google Gemini, Firebase, and Pub/Sub. Built for the Google Solutions Challenge 2026.",
};

export default function RootLayout({ children }) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkKey) {
    console.warn("Sector 7 Warning: Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Authentication features will be disabled.");
  }

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
        <script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>
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
                      DEVELOPMENT MODE: AUTHENTICATION BYPASSED (AS REQUESTED)
                  </div>
                  {children}
              </div>
            )}
         </RoleProvider>
      </body>
    </html>
  );
}

