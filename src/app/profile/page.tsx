'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import YoutubePlayer from '@/components/player/YoutubePlayer';
import Header from '@/components/home/Header';
import { TbHeart, TbMusic, TbUser } from "react-icons/tb";
import { TfiControlPlay } from "react-icons/tfi";
import LoadingSpinner from '@/components/general/LoadingSpinner';

interface LikedSong {
  id: number;
  artist: string;
  song: string;
  video_id: string;
  genre: {
    name: string;
  };
}

interface Like {
  id: string;
  genre_songs: {
    id: number;
    artist: string;
    song: string;
    video_id: string;
    genres: {
      name: string;
    };
  };
}

interface SupabaseResponse {
  data: Like[] | null;
  error: Error | null;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const groupedSongs = useMemo(() => 
    likedSongs.reduce<Record<string, LikedSong[]>>((acc, song) => {
      const genreName = song.genre.name;
      if (!acc[genreName]) {
        acc[genreName] = [];
      }
      acc[genreName].push(song);
      return acc;
    }, {}),
    [likedSongs]
  );

  const fetchLikedSongs = useCallback(async () => {
    console.log('Fetching liked songs...');
    if (!user) {
      console.log('No user found, returning early');
      return;
    }
    
    console.log('Fetching likes for user:', user.id);
    
    const { data: likes, error } = await supabase
      .from('likes')
      .select(`
        id,
        genre_songs (
          id,
          artist,
          song,
          video_id,
          genres (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) as SupabaseResponse;

    console.log('Raw likes data:', JSON.stringify(likes, null, 2));

    if (error) {
      console.error('Error fetching likes:', error);
      return;
    }

    const songs = likes?.reduce<LikedSong[]>((acc, like: Like) => {
      const genreSong = like.genre_songs;
      if (genreSong && genreSong.genres) {
        acc.push({
          id: genreSong.id,
          artist: genreSong.artist,
          song: genreSong.song,
          video_id: genreSong.video_id,
          genre: {
            name: genreSong.genres.name
          }
        });
      }
      return acc;
    }, []) || [];

    // Sort songs by genre name
    const sortedSongs = songs.sort((a, b) => 
      a.genre.name.localeCompare(b.genre.name)
    );

    console.log('Setting liked songs:', sortedSongs);
    setLikedSongs(sortedSongs);
  }, [user]);

  useEffect(() => {
    console.log('Profile page mounted, user state:', user);
    fetchLikedSongs();
  }, [user, fetchLikedSongs]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner color="#ffffff" size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-white">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-[1800px] mx-auto">
        {/* Hero Banner */}
        <div className="relative h-72">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black opacity-70" />
          <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-zinc-800/50 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white">
                    {user.email?.split('@')[0]}
                  </h1>
                  <p className="text-white/60 mt-1">Your Music Collection</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 
                         text-white/80 hover:text-white text-sm font-medium 
                         transition-all border border-white/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-b border-white/5 bg-zinc-900/30">
          <div className="flex items-center gap-8 px-8 md:px-12 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{likedSongs.length}</p>
              <p className="text-sm text-white/60">Liked Songs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{Object.keys(groupedSongs).length}</p>
              <p className="text-sm text-white/60">Genres</p>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-8">
          {currentVideoId && (
            <div className="mb-12 max-w-3xl mx-auto">
              <YoutubePlayer
                videoId={currentVideoId}
                onVideoEnd={() => setCurrentVideoId(null)}
                onLikeChange={fetchLikedSongs}
              />
            </div>
          )}

          <div className="space-y-12">
            {Object.entries(groupedSongs).map(([genreName, songs]) => (
              <section key={genreName}>
                <h2 className="text-2xl font-bold text-white mb-6">{genreName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      className="group bg-zinc-800/30 rounded-xl p-4 hover:bg-zinc-800/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-700/50 flex items-center justify-center flex-shrink-0">
                          <TbMusic className="w-6 h-6 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{song.song}</h3>
                          <p className="text-sm text-white/50 truncate">{song.artist}</p>
                        </div>
                        <button
                          onClick={() => setCurrentVideoId(song.video_id)}
                          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                          <TfiControlPlay className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {likedSongs.length === 0 && (
              <div className="text-center py-16 rounded-2xl bg-zinc-800/30">
                <TbHeart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No Liked Songs Yet</h3>
                <p className="text-white/50 max-w-md mx-auto">
                  Start exploring and like some songs to build your collection!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 