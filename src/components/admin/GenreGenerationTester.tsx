"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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
          data: {
            description: data.description,
            imageUrl: data.imageUrl
          }
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Genre Generation Tester</h1>
      
      {/* Genre Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Select Unprocessed Genre ({availableGenres.length} remaining)
        </label>
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="w-full p-2 border rounded-md bg-white/5"
          disabled={isLoading}
        >
          <option value="">Select a genre...</option>
          {availableGenres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      {/* Test Buttons */}
      <div className="flex gap-4">
        <button
          onClick={testDescription}
          disabled={!selectedGenre || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Test Description Generation"}
        </button>
        
        <button
          onClick={testSongs}
          disabled={!selectedGenre || isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Test Song Generation"}
        </button>

        <button
          onClick={testImage}
          disabled={!selectedGenre || isLoading || !results.description?.success || !results.songs?.success}
          className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Test Image Generation"}
        </button>
      </div>

      {/* Results Display */}
      <div className="space-y-4">
        {/* Description Results */}
        {results.description && (
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-semibold mb-2">Description Results</h2>
            {results.description.success ? (
              <div className="space-y-4">
                <p className="text-green-500">
                  {typeof results.description.data === 'string' 
                    ? results.description.data 
                    : Array.isArray(results.description.data)
                      ? ''
                      : results.description.data?.description}
                </p>
                {typeof results.description.data !== 'string' && 
                 !Array.isArray(results.description.data) && 
                 results.description.data?.imageUrl && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Generated Image</h3>
                    <Image 
                      src={results.description.data.imageUrl} 
                      alt={`Generated image for ${selectedGenre}`}
                      width={500}
                      height={300}
                      className="w-full max-w-md rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-500">Error: {results.description.error}</p>
            )}
          </div>
        )}

        {/* Songs Results */}
        {results.songs && (
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-semibold mb-2">Songs Results</h2>
            {results.songs.success ? (
              <div className="space-y-2">
                {Array.isArray(results.songs.data) ? (
                  results.songs.data.map((song: Song, index: number) => (
                    <div key={`${song.artist}-${song.song}-${index}`} className="p-2 bg-white/5 rounded">
                      <p>
                        {song.artist} - {song.song}
                      </p>
                      {song.videoId && (
                        <p className="text-sm text-gray-400">
                          Video ID: {song.videoId}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-yellow-500">No songs data available</p>
                )}
              </div>
            ) : (
              <p className="text-red-500">Error: {results.songs.error}</p>
            )}
          </div>
        )}

        {/* Image Results */}
        {results.image && (
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-semibold mb-2">Image Results</h2>
            {results.image.success ? (
              <div className="space-y-4">
                <Image 
                  src={results.image.data as string} 
                  alt={`Generated image for ${selectedGenre}`}
                  width={500}
                  height={300}
                  className="w-full max-w-md rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <p className="text-red-500">Error: {results.image.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 