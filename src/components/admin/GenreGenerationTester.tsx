"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MdDescription, MdQueueMusic, MdImage } from "react-icons/md";

interface Song {
  artist: string;
  song: string;
  videoId?: string;
}

interface TestResult {
  success: boolean;
  data?: string | Song[] | { 
    description: string; 
    imageUrl: string 
  };
  error?: string;
}

export default function GenreGenerationTester() {
  const [selectedGenre, setSelectedGenre] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [results, setResults] = useState<{
    description?: TestResult;
    songs?: TestResult;
    image?: TestResult;
  }>({});
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  // Fetch available genres on component mount
  useEffect(() => {
    const fetchAvailableGenres = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/get-unprocessed-genres");
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || "Failed to fetch genres");
        
        setAvailableGenres(data.genres);
      } catch (error) {
        console.error("Error fetching available genres:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableGenres();
  }, []);

  const testDescription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ genre: selectedGenre }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to generate description");
      
      setResults(prev => ({
        ...prev,
        description: {
          success: true,
          data: data.description,
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        description: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testSongs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ genre: selectedGenre }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to generate songs");
      
      setResults(prev => ({
        ...prev,
        songs: {
          success: true,
          data: data.songs || []
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        songs: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testImage = async () => {
    if (!results.description?.success || !results.description.data) {
      alert("Please generate a description first");
      return;
    }

    if (!results.songs?.success || !results.songs.data) {
      alert("Please generate songs first");
      return;
    }

    setIsLoading(true);
    try {
      const description = typeof results.description.data === 'string' 
        ? results.description.data 
        : 'description' in results.description.data 
          ? (results.description.data as { description: string }).description
          : '';

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          genre: selectedGenre,
          description: description,
          songs: results.songs.data
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to generate image");
      
      setResults(prev => ({
        ...prev,
        image: {
          success: true,
          data: data.imageUrl
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        image: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackSelect = (videoId: string | undefined) => {
    if (videoId) {
      setSelectedTrack(selectedTrack === videoId ? null : videoId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 bg-white relative rounded-2xl my-4">
      {/* Floating Toolbar */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 rounded-lg shadow-lg">
          <button
            onClick={testDescription}
            disabled={!selectedGenre || isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <MdDescription className="text-xl" />
            <span className="text-sm font-medium">
              {isLoading ? "..." : "Description"}
            </span>
          </button>
          
          <div className="w-px h-6 bg-gray-700" />
          
          <button
            onClick={testSongs}
            disabled={!selectedGenre || isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <MdQueueMusic className="text-xl" />
            <span className="text-sm font-medium">
              {isLoading ? "..." : "Songs"}
            </span>
          </button>
          
          <div className="w-px h-6 bg-gray-700" />
          
          <button
            onClick={testImage}
            disabled={!selectedGenre || isLoading || !results.description?.success || !results.songs?.success}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <MdImage className="text-xl" />
            <span className="text-sm font-medium">
              {isLoading ? "..." : "Image"}
            </span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">Genre Generation Tester</h1>
        <p className="text-sm text-gray-500">Available genres: {availableGenres.length}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div>
          {/* Genres Grid */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Genre
            </label>
            <div className="grid grid-cols-4 gap-1.5 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  disabled={isLoading}
                  className={`px-2 py-1.5 text-xs rounded border transition-all truncate
                    ${selectedGenre === genre 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Description Results */}
          {results.description && (
            <div className="p-3 border border-gray-200 rounded bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-900">Description</h2>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  results.description.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {results.description.success ? 'Success' : 'Failed'}
                </span>
              </div>
              {results.description.success ? (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {typeof results.description.data === 'string' 
                    ? results.description.data 
                    : Array.isArray(results.description.data)
                      ? ''
                      : results.description.data?.description}
                </p>
              ) : (
                <p className="text-sm text-red-600">{results.description.error}</p>
              )}
            </div>
          )}
          {/* Songs Results */}
          {results.songs && (
            <div className="border border-gray-200 rounded bg-gray-50 divide-y divide-gray-200">
              <div className="p-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-900">Songs</h2>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  results.songs.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {results.songs.success ? 'Success' : 'Failed'}
                </span>
              </div>
              {results.songs.success ? (
                <div className="divide-y divide-gray-200">
                  {Array.isArray(results.songs.data) && results.songs.data.map((song: Song, index: number) => (
                    <div key={`${song.artist}-${song.song}-${index}`} 
                         className="p-3 bg-white hover:bg-gray-50 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{song.artist}</p>
                          <p className="text-sm text-gray-600">{song.song}</p>
                        </div>
                        {song.videoId && (
                          <button
                            onClick={() => handleTrackSelect(song.videoId)}
                            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            {selectedTrack === song.videoId ? 'Hide' : 'Play'}
                          </button>
                        )}
                      </div>
                      {selectedTrack === song.videoId && song.videoId && (
                        <div className="mt-3 aspect-video">
                          <iframe
                            className="w-full h-full rounded"
                            src={`https://www.youtube.com/embed/${song.videoId}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-600 p-3">{results.songs.error}</p>
              )}
            </div>
          )}

          {/* Image Results */}
          {results.image && (
            <div className="border border-gray-200 rounded bg-gray-50">
              <div className="p-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-900">Generated Image</h2>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  results.image.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {results.image.success ? 'Success' : 'Failed'}
                </span>
              </div>
              {results.image.success ? (
                <div className="border-t border-gray-200">
                  <Image 
                    src={results.image.data as string} 
                    alt={`Generated image for ${selectedGenre}`}
                    width={500}
                    height={300}
                    className="w-full object-cover"
                  />
                </div>
              ) : (
                <p className="text-sm text-red-600 p-3">{results.image.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 