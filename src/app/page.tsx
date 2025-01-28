import { Suspense } from "react";
import HomePage from "@/components/home/Home";
import type { Metadata, Viewport } from "next";
import LoadingSpinner from "@/components/general/LoadingSpinner"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "AntiPlaylist ▯┃║ Discover Music Through Genre",
  description:
    "An experimental radio platform redefining music discovery. Explore, identify, and journey through an ever-evolving soundscape of global genres.",
  keywords:
    "music discovery, genre exploration, sonic education, audio experience, music curation, genre identification, interactive radio",
  openGraph: {
    title: "AntiPlaylist ▯┃║ Discover Music Through Genre",
    description:
      "An experimental radio platform redefining music discovery. Explore, identify, and journey through an ever-evolving soundscape of global genres.",
    type: "website",
    locale: "en_US",
    url: "https://AntiPlaylist.com",
    siteName: "AntiPlaylist",
    images: [
      {
        url: "/social.png",
        width: 1200,
        height: 630,
        alt: "AntiPlaylist - Random Educational Radio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AntiPlaylist | Discover Music Through Genre",
    description:
      "An experimental radio platform redefining music discovery. Explore, identify, and journey through an ever-evolving soundscape of global genres.",
    images: ["/social.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://AntiPlaylist.com",
  },
  other: {
    "application-name": "AntiPlaylist",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black",
    "apple-mobile-web-app-title": "AntiPlaylist",
    "format-detection": "telephone=no",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default async function Home() {

  return (
    <div className="min-h-screen w-full bg-zinc-900">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <LoadingSpinner color="#ffffff" size="lg" />
          </div>
        </div>
      }>
      <HomePage />
      </Suspense>
    </div>
  );
}
