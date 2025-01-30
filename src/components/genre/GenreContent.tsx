"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import YoutubePlayer from "@/components/player/YoutubePlayer";
import TrackList from "@/components/player/TrackList";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { IoShuffle } from "react-icons/io5";
import Image from "next/image";

interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image?: string;
}

interface Song {
  id: string;
  genre_id: string;
  artist: string;
  song: string;
  video_id: string;
}

interface GenreContentProps {
  genre: Genre;
  songs: Song[];
}

export default function GenreContent({ genre, songs }: GenreContentProps) {
  console.log("GenreContent rendered with songs:", songs);

  const router = useRouter();
  const [currentVideoId, setCurrentVideoId] = useState<string>(() => {
    return songs[0]?.video_id || "";
  });

  const handleTrackSelect = (videoId: string) => {
    console.log("Track selected:", videoId);
    setCurrentVideoId(videoId);
  };

  const handleVideoEnd = () => {
    const currentIndex = songs.findIndex(
      (song) => song.video_id === currentVideoId
    );
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentVideoId(songs[nextIndex].video_id);
  };

  const handleNextGenre = async () => {
    try {
      const response = await fetch("/api/random-genre");
      const data = await response.json();

      if (data.genre?.slug) {
        router.push(`/genre/${data.genre.slug}`);
      }
    } catch (error) {
      console.error("Failed to fetch random genre:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-zinc-900 to-black">
      <Header />
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-black pointer-events-none" />

      <main className="flex-grow w-full max-w-[1800px] mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col gap-8">
          {/* Player and Tracklist Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-video w-full bg-zinc-900 rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10">
                <YoutubePlayer
                  videoId={currentVideoId}
                  onVideoEnd={handleVideoEnd}
                />
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-xl ring-1 ring-white/10">
              <TrackList
                songs={songs.map((song) => ({
                  artist: song.artist,
                  song: song.song,
                  videoId: song.video_id,
                }))}
                currentIndex={songs.findIndex(
                  (song) => song.video_id === currentVideoId
                )}
                onTrackSelect={handleTrackSelect}
              />
            </div>
          </div>
          {/* Hero Section with Dynamic Gradient */}
          <div className="relative space-y-6 md:space-y-0">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {genre.cover_image && (
                <div className="relative group w-full md:w-auto">
                  <div className="w-full aspect-square md:w-80 md:h-80 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                    <Image
                      src={genre.cover_image}
                      alt={`${genre.name} cover`}
                      fill
                      className="object-cover rounded-xl"
                      sizes="(max-width: 768px) 100vw, 320px"
                      priority
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col justify-between flex-grow">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-white/60 uppercase tracking-wider text-xs font-medium mb-2">
                      Featured Genre
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                      {genre.name}
                    </h1>
                    {genre.description && (
                      <p className="text-white/70 text-sm md:text-base max-w-2xl leading-relaxed">
                        {genre.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Next Genre Button - Now inside the content area for desktop */}
                  <div className="hidden md:block">
                    <button
                      onClick={handleNextGenre}
                      className="inline-flex items-center gap-3 px-8 py-3 md:px-10 md:py-4 bg-white text-black rounded-full hover:bg-white/90 transition-all transform hover:scale-105 font-medium text-lg md:text-xl shadow-lg whitespace-nowrap"
                    >
                      <span>Next Genre</span>
                      <IoShuffle className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Genre Button - Mobile only version */}
            <div className="md:hidden flex justify-end w-full">
              <button
                onClick={handleNextGenre}
                className="w-full sm:w-auto inline-flex items-center gap-3 px-8 py-3 md:px-10 md:py-4 bg-white text-black rounded-full hover:bg-white/90 transition-all transform hover:scale-105 font-medium text-lg md:text-xl shadow-lg"
              >
                <span>Next Genre</span>
                <IoShuffle className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
