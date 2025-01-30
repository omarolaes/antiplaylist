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
    <div className="max-w-6xl mx-auto px-8 py-12">
      {/* Header Section */}
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl font-medium tracking-tight text-gray-900">Genre Generation Lab</h1>
        <p className="text-base text-gray-500">Test and validate genre-based content generation</p>
      </div>

      {/* Progress Toolbar */}
      <div className="mb-12 bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 relative">
          {/* Progress Bar */}
          <div className="absolute inset-0 bg-blue-50 rounded-xl transition-all duration-500" style={{
            width: `${(Object.values(results).filter(r => r?.success).length / 3) * 100}%`
          }} />
          
          {/* Steps */}
          {[
            { icon: MdDescription, label: "Description", action: testDescription, disabled: !selectedGenre || isLoading, success: results.description?.success },
            { icon: MdQueueMusic, label: "Songs", action: testSongs, disabled: !selectedGenre || isLoading, success: results.songs?.success },
            { icon: MdImage, label: "Image", action: testImage, disabled: !selectedGenre || isLoading || !results.description?.success || !results.songs?.success, success: results.image?.success }
          ].map((step, index) => (
            <button
              key={step.label}
              onClick={step.action}
              disabled={step.disabled}
              className={`flex-1 flex items-center gap-3 px-6 py-4 rounded-xl
                ${step.success ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'} 
                disabled:opacity-50 disabled:cursor-not-allowed transition-all relative z-10`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl border 
                ${step.success ? 'border-blue-200 bg-blue-100' : 'border-gray-200 bg-gray-50'}`}>
                <step.icon className="text-xl" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-400">Step {index + 1}</span>
                <span className="text-sm font-medium">
                  {isLoading ? "Processing..." : step.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column */}
        <div>
          {/* Genres Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Available Genres
              </label>
              <span className="text-sm text-gray-500">{availableGenres.length} genres</span>
            </div>
            <div className="sticky top-0 grid grid-cols-3 gap-2 max-h-[calc(100vh-200px)] overflow-y-auto p-4 rounded-xl bg-white shadow-sm border border-gray-100">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  disabled={isLoading}
                  className={`px-4 py-2.5 text-sm rounded-lg border transition-all truncate
                    ${selectedGenre === genre 
                      ? 'border-blue-200 bg-blue-50 text-blue-600' 
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-8">
          {/* Description Results */}
          {results.description && (
            <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-700">Description</h2>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  results.description.success 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-red-50 text-red-600'
                }`}>
                  {results.description.success ? 'Generated' : 'Failed'}
                </span>
              </div>
              <div className="p-6">
                {results.description.success ? (
                  <p className="text-sm text-gray-600 leading-relaxed">
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
            </div>
          )}
          {/* Songs Results */}
          {results.songs && (
            <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-700">Songs</h2>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  results.songs.success ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                }`}>
                  {results.songs.success ? 'Generated' : 'Failed'}
                </span>
              </div>
              <div className="p-6">
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
                  <p className="text-sm text-red-600">{results.songs.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Image Results */}
          {results.image && (
            <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-700">Generated Image</h2>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  results.image.success ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                }`}>
                  {results.image.success ? 'Generated' : 'Failed'}
                </span>
              </div>
              <div className="p-6">
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
                  <p className="text-sm text-red-600">{results.image.error}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 