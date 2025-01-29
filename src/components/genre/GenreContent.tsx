"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import YoutubePlayer from "@/components/player/YoutubePlayer";
import TrackList from "@/components/player/TrackList";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { IoArrowForward } from "react-icons/io5";

interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto py-8">
        <div className="mx-auto">
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-6 items-center justify-between gap-8">
              <div className="col-span-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {genre.name}
                </h1>
                {genre.description && (
                  <p className="text-zinc-300 text-lg">{genre.description}</p>
                )}
              </div>
              <button
                onClick={handleNextGenre}
                className="col-span-2 flex items-center justify-center gap-2 px-6 py-3 bg-rose-200 hover:bg-rose-300 text-zinc-900 rounded-lg transition-colors font-medium text-center"
              >
                <span>NEXT RANDOM GENRE</span>
                <IoArrowForward className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="aspect-video w-full bg-zinc-800 rounded-lg overflow-hidden">
                <YoutubePlayer
                  videoId={currentVideoId}
                  onVideoEnd={handleVideoEnd}
                />
              </div>
            </div>

            <div className="space-y-6">
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
