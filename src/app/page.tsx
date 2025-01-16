import { Suspense } from "react";
import HomePage from "@/components/home/Home";
import type { Metadata, Viewport } from "next";
import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";
import LoadingSpinner from "@/components/general/LoadingSpinner";

// Cache the data fetching with Next.js built-in cache
const getInitialData = unstable_cache(
  async () => {
    try {
      const [genresResponse, songsCountResponse] = await Promise.all([
        supabase.from("genres").select("name, slug"),
        supabase.from("genre_songs").select("*", { count: "exact", head: true }),
      ]);

      if (genresResponse.error || songsCountResponse.error) {
        console.error("Supabase error:", genresResponse.error || songsCountResponse.error);
        return { genres: [], songsCount: 0 };
      }

      if (!genresResponse.data || !songsCountResponse.count) {
        return { genres: [], songsCount: 0 };
      }

      return {
        genres: genresResponse.data.map(({ name, slug }) => ({ name, slug })),
        songsCount: songsCountResponse.count,
      };
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      return { genres: [], songsCount: 0 };
    }
  },
  ["initial-data"],
  {
    revalidate: 86400, // 24 hours
    tags: ["genres", "songs"],
  }
);

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
    url: "https://AntiPlaylistradio.com",
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
    canonical: "https://AntiPlaylistradio.com",
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
  const initialData = await getInitialData();

  return (
    <div className="min-h-screen w-full">
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <LoadingSpinner color="#000000" size="lg" />
          </div>
        </div>
      }>
      <HomePage initialData={initialData} />
      </Suspense>
    </div>
  );
}
