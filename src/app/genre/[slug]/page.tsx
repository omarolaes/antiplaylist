import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/general/LoadingSpinner";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import GenreContent from "@/components/genre/GenreContent";

interface GenrePageProps {
  params: {
    slug: string;
  };
}

// Cache the genre data fetching
const getGenreData = unstable_cache(
  async (slug: string) => {
    try {
      const [genreResponse, songsResponse, allGenresResponse] = await Promise.all([
        supabase
          .from("genres")
          .select("*")
          .eq("slug", slug)
          .single(),
        supabase
          .from("genre_songs")
          .select("*")
          .eq("genre_id", (await supabase.from("genres").select("id").eq("slug", slug).single()).data?.id),
        supabase
          .from("genres")
          .select("name, slug")
      ]);

      if (genreResponse.error || !genreResponse.data) {
        return null;
      }

      return {
        genre: genreResponse.data,
        songs: songsResponse.data || [],
        availableGenres: allGenresResponse.data || []
      };
    } catch (error) {
      console.error("Failed to fetch genre data:", error);
      return null;
    }
  },
  ["genre-data"],
  {
    revalidate: 3600, // 1 hour
    tags: ["genre"],
  }
);

export async function generateMetadata(
  { params }: GenrePageProps
): Promise<Metadata> {
  const data = await getGenreData(params.slug);

  if (!data) {
    return {
      title: "Genre Not Found | AntiPlaylist",
      description: "This genre could not be found.",
    };
  }

  return {
    title: `${data.genre.name} Music | AntiPlaylist`,
    description: data.genre.description || `Explore and discover ${data.genre.name} music on AntiPlaylist.`,
    openGraph: {
      title: `${data.genre.name} Music | AntiPlaylist`,
      description: data.genre.description || `Explore and discover ${data.genre.name} music on AntiPlaylist.`,
      url: `https://antiplaylistradio.com/genre/${params.slug}`,
      siteName: "AntiPlaylist",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.genre.name} Music | AntiPlaylist`,
      description: data.genre.description || `Explore and discover ${data.genre.name} music on AntiPlaylist.`,
    },
  };
}

export default async function GenrePage({ params }: GenrePageProps) {
  const data = await getGenreData(params.slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen w-full bg-zinc-900">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <LoadingSpinner color="#ffffff" size="lg" />
            </div>
          </div>
        }
      >
        <GenreContent 
          genre={data.genre} 
          songs={data.songs} 
          availableGenres={data.availableGenres}
        />
      </Suspense>
    </div>
  );
} 
