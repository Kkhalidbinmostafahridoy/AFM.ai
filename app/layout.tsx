import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "ViralForge AI — Gemini Content Studio",
    template: "%s | ViralForge AI",
  },
  description:
    "ViralForge AI: Gemini-powered viral scripts, cinematic 3-beat structures, Imagen stills, image edits, shot plans, and video teardowns — built for Shorts, TikTok, and Reels.",
  keywords: [
    "ViralForge",
    "Gemini AI",
    "viral video script",
    "AI image generator",
    "TikTok",
    "YouTube Shorts",
    "Instagram Reels",
  ],
  openGraph: {
    title: "ViralForge AI — Gemini-native creator stack",
    description:
      "Scripts, shot plans, images, and video intelligence powered by Google Gemini.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
