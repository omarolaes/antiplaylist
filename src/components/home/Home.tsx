"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { mainGenres } from "../../../data/genres/genresList";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "./Header";
import Hero from "./Hero";
import SelectGenre from '../quiz/SelectGenre';
import YoutubePlayer from '../player/YoutubePlayer';
import TrackList from '../player/TrackList';
import LoadingSpinner from "../general/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import Footer from './Footer';
import Head from 'next/head';

const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

// Define interfaces for the genre types
interface SubSubgenre {
  name?: string;
  videoIds?: string[];
}

interface Subgenre {
  genre?: string;
  year?: string;
  videoIds?: string[];
  subgenres?: SubSubgenre[];
}

interface MainGenre {
  genre?: string;
  year?: string;
  category?: string;
  videoIds?: string[];
  subgenres?: Subgenre[];
}

// Updated utility function to get all subgenres
const getAllGenres = (): string[] => {
  const allGenres = mainGenres.flatMap((genre: MainGenre) =>
    (genre.subgenres || []).flatMap((sub: Subgenre) =>
      (sub.subgenres || []).map((subsub: SubSubgenre) => subsub.name || "")
    )
  );
  return allGenres.filter(
    (genre): genre is string => typeof genre === "string" && genre.length > 0
  );
};

// Add slug generation utility at the top with other utilities
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
    .trim();
};

interface HomePageProps {
  initialData: {
    genres: Array<{
      name: string;
      slug: string;
    }>;
    songsCount: number;
  }
}

// Add this utility function at the top of your file
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const HomePage: React.FC<HomePageProps> = ({ initialData }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(
    new Set()
  );
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [artistSongs, setArtistSongs] = useState<ArtistSong[]>([]);
  const [genreDescription, setGenreDescription] = useState<string>("");
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingNextTrack, setIsLoadingNextTrack] = useState<boolean>(false);
  const [questionNumber, setQuestionNumber] = useState<number>(0);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const MAX_QUESTIONS = 10;
  const [usedGenres, setUsedGenres] = useState<Set<string>>(new Set());
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [songId, setSongId] = useState<number | null>(null);
  const { user } = useAuth();

  // Add a ref to track if initial load has happened
  const initialLoadComplete = React.useRef(false);

  // 1. Memoize the getAllGenres result
  const allGenres = useMemo(() => getAllGenres(), []);

  // Add state for available genres
  const [availableGenres, setAvailableGenres] = useState<Array<{name: string; slug: string}>>([]);

  // Add new state for unavailable genres
  const [unavailableGenres, setUnavailableGenres] = useState<string[]>([]);

  // Add state for genre songs count
  const [genreSongsCount, setGenreSongsCount] = useState<number>(0);

  // Modify the useEffect that fetches genres to also fetch the songs count
  useEffect(() => {
    setAvailableGenres(initialData.genres);
    setGenreSongsCount(initialData.songsCount);

    // Calculate unavailable genres
    const allPossibleGenres = getAllGenres();
    const unavailable = allPossibleGenres.filter(
      genre => !initialData.genres.map(g => g.name).includes(genre)
    );
    setUnavailableGenres(unavailable);
  }, [initialData]);

  // Add new state for YouTube mode
  const [useYouTubeMode, setUseYouTubeMode] = useState(false);

  // 3. Memoize handleVideoSelect
  const getRandomGenres = useCallback((correctGenre: string): string[] => {
    const allGenres = getAllGenres();
    const filteredGenres = allGenres.filter((g) => g !== correctGenre);
    const shuffled = [...filteredGenres].sort(() => 0.5 - Math.random());
    const wrongOptions = shuffled.slice(0, 3);
    return [...wrongOptions, correctGenre].sort(() => 0.5 - Math.random());
  }, []);


  const handleVideoSelect = useCallback(
    async (videoId: string, genreName: string): Promise<void> => {
      if (isLoading) return;

      try {
        setIsLoading(true);
        // Reset all related states at the start
        setCurrentVideoId(null);
        setArtistSongs([]);
        setGenreDescription("");
        setCurrentVideoIndex(0);

        // Increase timeout duration to 60 seconds
        const timeoutDuration = 60000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort('Request timeout');
        }, timeoutDuration);

        const genreSlug = generateSlug(genreName);
        router.replace(`/genre/${encodeURIComponent(genreSlug)}`, {
          scroll: false,
        });

        const displayName = genreName
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        setCorrectAnswer(displayName);
        const randomOptions = getRandomGenres(displayName);
        setOptions(randomOptions);
        setSelectedAnswers(new Set());
        setIsCorrect(false);

        try {
          if (useYouTubeMode) {
            // Use generate endpoints for YouTube mode
            const [songsResponse, descriptionResponse] = await Promise.all([
              fetch("/api/generate-songs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ genre: genreSlug }),
                signal: controller.signal,
              }),
              fetch("/api/generate-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ genre: genreSlug }),
                signal: controller.signal,
              }),
            ]);

            clearTimeout(timeoutId);

            if (!songsResponse.ok || !descriptionResponse.ok) {
              throw new Error(`HTTP error! status: ${songsResponse.status}`);
            }

            const [songsData, descriptionData] = await Promise.all([
              songsResponse.json(),
              descriptionResponse.json(),
            ]);

            if (!songsData.songs?.length) {
              throw new Error("No songs returned for this genre");
            }

            // Randomize the songs array
            const randomizedSongs = shuffleArray<ArtistSong>(songsData.songs);

            setArtistSongs(randomizedSongs);
            setGenreDescription(descriptionData.description);
            setCurrentVideoId(randomizedSongs[0].videoId);
          } else {
            // Use get-songs endpoint for database mode
            const response = await fetch("/api/get-songs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ genre: genreSlug }),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.songs?.length) {
              throw new Error("No songs found for this genre");
            }

            // Randomize the songs array
            const randomizedSongs = shuffleArray<ArtistSong>(data.songs);

            setArtistSongs(randomizedSongs);
            setGenreDescription(data.description);
            setCurrentVideoId(randomizedSongs[0].videoId);
          }
        } catch (fetchError: unknown) {
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.error('Request timed out after', timeoutDuration, 'ms');
            throw new Error('Request timed out. Please try again.');
          }
          throw fetchError;
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Error fetching genre data:", error.message);
        } else {
          console.error("Error fetching genre data:", String(error));
        }
        // Reset loading state and show error to user
        setIsLoading(false);
        alert('Failed to load genre data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, router, getRandomGenres, useYouTubeMode]
  );


  // Modify the useEffect to prevent duplicate calls
  useEffect(() => {
    const handleInitialGenre = async () => {
      const genre = searchParams.get("genre");
      if (genre && !initialLoadComplete.current && !isStarted) {
        initialLoadComplete.current = true;
        setIsStarted(true);
        await handleVideoSelect("", decodeURIComponent(genre));
      }
    };

    handleInitialGenre();
  }, [searchParams, isStarted, handleVideoSelect]);

  
  // Modify getRandomVideo to use the correct genre pool based on mode
  const getRandomVideo = useCallback(async () => {
    setIsStarted(true);

    if (useYouTubeMode) {
      // Use only unavailable genres for YouTube mode
      const availableForSelection = unavailableGenres.filter(
        genre => !usedGenres.has(genre)
      );
      
      if (availableForSelection.length === 0) {
        return;
      }

      const randomGenre = availableForSelection[
        Math.floor(Math.random() * availableForSelection.length)
      ];
      setUsedGenres(prev => new Set([...prev, randomGenre]));
      handleVideoSelect("", randomGenre);
    } else {
      // Use Supabase available genres
      const availableForSelection = availableGenres.filter(
        genre => !usedGenres.has(genre.name)
      );

      if (availableForSelection.length === 0) {
        return;
      }

      const randomGenre = availableForSelection[
        Math.floor(Math.random() * availableForSelection.length)
      ];
      setUsedGenres(prev => new Set([...prev, randomGenre.name]));
      handleVideoSelect("", randomGenre.name);
    }
  }, [availableGenres, unavailableGenres, usedGenres, useYouTubeMode, handleVideoSelect]);

  // Update handleStartClick to use the correct source based on mode
  const handleStartClick = useCallback(async () => {
    if (useYouTubeMode) {
      if (unavailableGenres.length > 0) {
        setQuestionNumber(1);
        getRandomVideo();
      }
    } else {
      if (availableGenres.length > 0) {
        setQuestionNumber(1);
        getRandomVideo();
      }
    }
  }, [useYouTubeMode, unavailableGenres, availableGenres, getRandomVideo]);

  // 4. Memoize handleNextTrack
  const handleNextTrack = useCallback(async () => {
    try {
      setIsLoadingNextTrack(true);
      setCurrentVideoId(null);
      setArtistSongs([]);
      setCurrentVideoIndex(0);
      setGenreDescription("");

      let availableForSelection;
      if (useYouTubeMode) {
        availableForSelection = allGenres.filter(
          genre => !usedGenres.has(genre)
        );
      } else {
        availableForSelection = availableGenres.filter(
          genre => !usedGenres.has(genre.name)
        );
      }

      if (availableForSelection.length === 0) {
        return;
      }

      const randomGenre = availableForSelection[
        Math.floor(Math.random() * availableForSelection.length)
      ];

      if (typeof randomGenre === 'string') {
        // YouTube mode
        setUsedGenres(prev => new Set([...prev, randomGenre]));
        await handleVideoSelect("", randomGenre);
      } else {
        // Database mode
        setUsedGenres(prev => new Set([...prev, randomGenre.name]));
        await handleVideoSelect("", randomGenre.name);
      }
      
      setQuestionNumber(prev => prev + 1);
    } catch (error) {
      console.error("Error in handleNextTrack:", error);
    } finally {
      setIsLoadingNextTrack(false);
    }
  }, [allGenres, availableGenres, usedGenres, handleVideoSelect, useYouTubeMode]);

  // Define a specific type for artist songs
  interface ArtistSong {
    artist: string;
    song: string;
    videoId: string;
  }

  // 1. Memoize the options array
  const memoizedOptions = useMemo(() => options, [options]);

  // 2. Memoize the artistSongs array
  const memoizedArtistSongs = useMemo(() => artistSongs, [artistSongs]);

  // 3. Memoize handlers that don't need to be recreated
  const memoizedHandleOptionClick = useCallback(
    (option: string) => {
      if (isCorrect) return;

      if (option === correctAnswer) {
        setIsCorrect(true);

        if (questionNumber === MAX_QUESTIONS) {
          setGameComplete(true);
        }
      } else {
        setMistakes((prev) => prev + 1);
        setSelectedAnswers((prev) => new Set([...prev, option]));
      }
    },
    [isCorrect, correctAnswer, questionNumber, MAX_QUESTIONS]
  );

  // Update the handleVideoEnd callback
  const handleVideoEnd = useCallback(() => {
    setCurrentVideoIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      
      // Check if we have more videos and if the artistSongs array is still valid
      if (nextIndex < memoizedArtistSongs.length) {
        const nextVideo = memoizedArtistSongs[nextIndex];
        if (nextVideo && nextVideo.videoId) {
          setCurrentVideoId(nextVideo.videoId);
          return nextIndex;
        }
      }
      
      // If we can't advance, stay at current index
      return prevIndex;
    });
  }, [memoizedArtistSongs]);



  // Add effect to reset state when URL changes
  useEffect(() => {
    if (!searchParams.get('genre')) {
      setIsStarted(false);
      setMistakes(0);
      setQuestionNumber(0);
      setGameComplete(false);
      setCurrentVideoId(null);
      setArtistSongs([]);
      setGenreDescription("");
      setOptions([]);
      setSelectedAnswers(new Set());
      setIsCorrect(false);
    }
  }, [searchParams]);

  // Add cleanup effect when genre changes
  useEffect(() => {
    const genre = searchParams.get('genre');
    if (genre) {
      setCurrentVideoIndex(0);
      setCurrentVideoId(null);
      setArtistSongs([]);
    }
  }, [searchParams]);

  // Add this function with the other useCallback functions
  const checkIfLiked = useCallback(async () => {
    if (!user || !songId) return;

    try {
      const { data: likes, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('genre_song_id', songId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking like status:', error);
        return;
      }

      setIsLiked(!!likes);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  }, [user, songId]);

  // Add this function with the other useCallback functions
  const onLike = async () => {
    if (!user) {
      alert('Please sign in to like songs');
      return;
    }

    if (!songId) return;

    try {
      // First ensure user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError);
        return;
      }

      if (!profile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert([{ 
            id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return;
        }
      }

      if (isLiked) {
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('genre_song_id', songId);

        if (deleteError) throw deleteError;
        setIsLiked(false);
      } else {
        const { error: insertError } = await supabase
          .from('likes')
          .insert([
            {
              user_id: user.id,
              genre_song_id: songId
            }
          ])
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            setIsLiked(true);
            return;
          }
          throw insertError;
        }
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Add this effect to fetch song ID when video changes
  useEffect(() => {
    const fetchSongId = async () => {
      if (!currentVideoId) return;

      const { data: songs, error } = await supabase
        .from('genre_songs')
        .select('id')
        .eq('video_id', currentVideoId);

      if (error) {
        console.error('Error fetching song ID:', error);
        return;
      }

      if (songs && songs.length > 0) {
        setSongId(songs[0].id);
      }
    };

    fetchSongId();
  }, [currentVideoId]);

  // Add this effect to check like status when songId changes
  useEffect(() => {
    checkIfLiked();
  }, [checkIfLiked]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = async (videoId: string) => {
    if (!videoId) return;
    
    // Add confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this song? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      const { data: song, error: fetchError } = await supabase
        .from('genre_songs')
        .select('id')
        .eq('video_id', videoId)
        .single();

      if (fetchError) {
        console.error('Error fetching song:', fetchError);
        return;
      }

      const { error: deleteError } = await supabase
        .from('genre_songs')
        .delete()
        .eq('id', song.id);

      if (deleteError) {
        console.error('Error deleting song:', deleteError);
        return;
      }

      // Remove the song from local state
      setArtistSongs(prev => prev.filter(s => s.videoId !== videoId));
      
      // If this was the current video, move to the next one
      if (currentVideoId === videoId) {
        handleVideoEnd();
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  };

  const handleAddSongs = useCallback(async () => {
    if (!searchParams.get('genre')) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/add-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          genre: searchParams.get('genre') 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add songs');
      }

      const data = await response.json();
      
      // Add new songs to existing list
      setArtistSongs(prev => [...prev, ...data.songs]);
      
    } catch (error) {
      console.error('Error adding songs:', error);
      alert('Failed to add songs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  const LoadingOverlay = useMemo(() => {
    const LoadingOverlayComponent = () => (
      <div className="fixed inset-0 bg-zinc-900 backdrop-blur-sm flex items-center justify-center z-50 w-full h-full">
        <div className="text-center space-y-4">
          <LoadingSpinner 
            color={useYouTubeMode ? "#ef4444" : "#ffffff"} 
            size="lg" 
          />
        </div>
      </div>
    );
    LoadingOverlayComponent.displayName = 'LoadingOverlay';
    return LoadingOverlayComponent;
  }, [useYouTubeMode]);

  // Update return statement to include loading overlay
  return (
    <>
      <Head>
        <title>Genre Quiz - Test Your Music Knowledge</title>
        <meta name="description" content="Test your music knowledge by identifying genres from music videos. Learn about different music styles and expand your musical horizons." />
        <meta property="og:title" content="Genre Quiz - Test Your Music Knowledge" />
        <meta property="og:description" content="Test your music knowledge by identifying genres from music videos." />
      </Head>
      <main className="min-h-screen">
        <Header />

        {(isLoadingNextTrack || isLoading) && <LoadingOverlay />}
        
        {!isStarted ? (
          <Hero 
            handleStartClick={handleStartClick}
            availableGenres={availableGenres}
            genreSongsCount={genreSongsCount}
            isPremium={useYouTubeMode}
          />
        ) : (
          // Updated container for responsive layout
          <div className="container mx-auto flex flex-col-reverse lg:flex-row gap-4 lg:gap-8 h-auto lg:h-[calc(100vh-90px)] p-4">
            {/* Left column - Player and Tracklist */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="flex-none">
                <YoutubePlayer 
                  videoId={currentVideoId || ''} 
                  onVideoEnd={handleVideoEnd} 
                />
              </div>
              <div className="flex-1 overflow-auto">
                <TrackList 
                  songs={memoizedArtistSongs}
                  currentIndex={currentVideoIndex}
                  onTrackSelect={(videoId) => {
                    setCurrentVideoId(videoId);
                  }}
                  isLiked={isLiked}
                  onLike={onLike}
                  onDelete={handleDelete}
                  onAddSongs={handleAddSongs}
                />
              </div>
            </div>

            {/* Right column - Genre Selection and Advertisement */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <div className="flex-1">
                <SelectGenre
                  options={memoizedOptions}
                  correctAnswer={correctAnswer}
                  genreDescription={genreDescription}
                  isCorrect={isCorrect}
                  selectedAnswers={selectedAnswers}
                  questionNumber={questionNumber}
                  mistakes={mistakes}
                  maxQuestions={MAX_QUESTIONS}
                  onOptionClick={memoizedHandleOptionClick}
                  onNextTrack={handleNextTrack}
                  isLoadingNextTrack={isLoadingNextTrack}
                />
              </div>
            </div>
          </div>
        )}

        <Footer 
          availableGenres={availableGenres}
          genreSongsCount={genreSongsCount}
        />
        
        {/* Updated game complete modal */}
        {gameComplete && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md text-center p-6 md:p-8 border-2 border-zinc-950 bg-white">
              <h2 className="text-xl md:text-2xl font-medium mb-4">Good Job!</h2>
              <p className="text-sm md:text-base text-zinc-950 mb-6">
                You made {mistakes} mistakes
              </p>
              <button
                onClick={() => router.push(NEXT_PUBLIC_SITE_URL || '')}
                className="w-full md:w-auto px-6 md:px-8 py-3 bg-zinc-950 text-white font-medium hover:bg-zinc-950 transition-colors"
              >
                Another Round
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default HomePage;
