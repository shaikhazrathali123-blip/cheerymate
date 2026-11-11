import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { Toaster } from "sonner";
import { APP_NAME, APP_TAGLINE, THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/constants";
import { IOS_SPLASH, splashFile } from "@/lib/pwa";
import { SWRegister } from "@/components/pwa/sw-register";
import "./globals.css";

// Clean body font + geometric display font for headings (see --font-sans / --font-display)
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const funky = Sora({ subsets: ["latin"], variable: "--font-funky", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: `${APP_NAME} — Roommates you'll actually like`, template: `%s · ${APP_NAME}` },
  description: `${APP_TAGLINE} Swipe on compatible roommates, explore nearby flats on a map and chat safely. Bangalore, Hyderabad, Pune, Mumbai, Delhi NCR & more.`,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
    startupImage: IOS_SPLASH.map(([w, h, r]) => ({
      url: splashFile(w, h, r),
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content", // keeps the chat input above the Android keyboard
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR_DARK },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${body.variable} ${funky.variable}`} suppressHydrationWarning>
      {/* suppressHydrationWarning: extensions (ColorZilla, Grammarly, …) inject attributes on <body> */}
      <body className="min-h-screen-d antialiased" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className: "!rounded-2xl !border !border-[var(--glass-border)] !bg-[var(--glass-strong)] !text-ink !shadow-[var(--pop-shadow)] !backdrop-blur-xl",
            style: { fontFamily: "var(--font-sans)" },
          }}
          offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
          mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        />
        <SWRegister />
      </body>
    </html>
  );
}
