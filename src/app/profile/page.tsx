
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner color="#000000" size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-zinc-950">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header setUseYouTubeMode={() => {}} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <TbHeart className="w-8 h-8 text-pink-500" />
          <h1 className="text-3xl font-medium text-zinc-950">Your Liked Songs</h1>
        </div>
        
        {currentVideoId && (
          <div className="mb-8">
            <YoutubePlayer
              videoId={currentVideoId}
              onVideoEnd={() => setCurrentVideoId(null)}
              onLikeChange={fetchLikedSongs}
            />
          </div>
        )}

        {Object.entries(groupedSongs).map(([genreName, songs]) => (
          <div key={genreName} className="mb-8">
            <h2 className="text-xl font-medium text-zinc-950 mb-4">{genreName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="p-3 border border-zinc-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <TbMusic className="w-4 h-4 text-zinc-500" />
                        <h3 className="font-medium text-zinc-950">{song.song}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 mt-1">
                        <TbUser className="w-4 h-4" />
                        <span>{song.artist}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentVideoId(song.video_id)}
                      className="px-4 py-2 bg-zinc-950 text-white rounded hover:scale-95 transition-all flex items-center gap-2"
                    >
                      <TfiControlPlay className="w-4 h-4" />
                      Play
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {likedSongs.length === 0 && (
          <div className="text-center py-12 border border-zinc-200 rounded-lg">
            <TbHeart className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-600">
              You haven&apos;t liked any songs yet. Start exploring and like some songs!
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 