"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import YoutubePlayer from "@/components/player/YoutubePlayer";
import TrackList from "@/components/player/TrackList";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { IoArrowForward, IoShuffle } from "react-icons/io5";
import Image from 'next/image';

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
  const router = useRouter();
  const [currentVideoId, setCurrentVideoId] = useState<string>(
    songs[0]?.video_id || ""
  );

  const handleTrackSelect = (videoId: string) => {
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
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <Header />

      <main className="flex-grow w-full max-w-[1800px] mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col">
          {/* Hero Section with Gradient */}
          <div className="relative mb-6 p-6 md:p-8 rounded-xl bg-gradient-to-b from-rose-500/20 to-zinc-900">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-stretch">
              {genre.cover_image && (
                <div className="shrink-0 w-48 h-48 md:w-64 md:h-64 shadow-2xl rounded-md overflow-hidden relative">
                  <Image 
                    src={genre.cover_image} 
                    alt={`${genre.name} cover art`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 192px, 224px"
                    priority
                  />
                </div>
              )}
              <div className="flex flex-col justify-end w-full">
                <span className="text-sm font-medium text-white/80">GENRE</span>
                <h1 className="text-4xl md:text-6xl font-bold text-white mt-2">
                  {genre.name}
                </h1>
                {genre.description && (
                  <p className="text-white/70 mt-4 text-lg">{genre.description}</p>
                )}
              </div>
                <button
                  onClick={handleNextGenre}
                  className="min-w-64 mt-6 inline-flex items-center gap-2 px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-colors font-medium text-lg"
                >
                  <span>NEXT GENRE</span>
                  <IoShuffle className="w-8 h-8" />
                </button>
            </div>
          </div>

          {/* Player and Tracklist Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-video w-full bg-zinc-800/50 rounded-lg overflow-hidden shadow-lg">
                <YoutubePlayer
                  videoId={currentVideoId}
                  onVideoEnd={handleVideoEnd}
                />
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-4">
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
