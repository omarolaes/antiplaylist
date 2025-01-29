"use client";

import { useState } from "react";
import { mainGenres } from "../../../data/genres/genresList";

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export default function GenreGenerationTester() {
  const [selectedGenre, setSelectedGenre] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    description?: TestResult;
    songs?: TestResult;
  }>({});

  // Get all available genres with deduplication
  const allGenres = Array.from(new Set(
    mainGenres.reduce((acc: string[], mainGenre) => {
      mainGenre.subgenres?.forEach((subgenre) => {
        subgenre.subgenres?.forEach((subSubgenre) => {
          if (subSubgenre.name) {
            acc.push(subSubgenre.name);
          }
        });
      });
      return acc;
    }, [])
  )).sort();

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
          data: data.description
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
          data: data.songs
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Genre Generation Tester</h1>
      
      {/* Genre Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Select Genre</label>
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="w-full p-2 border rounded-md bg-white/5"
          disabled={isLoading}
        >
          <option value="">Select a genre...</option>
          {allGenres.map((genre, index) => (
            <option key={`${genre}-${index}`} value={genre}>
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
      </div>

      {/* Results Display */}
      <div className="space-y-4">
        {/* Description Results */}
        {results.description && (
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-semibold mb-2">Description Results</h2>
            {results.description.success ? (
              <p className="text-green-500">{results.description.data}</p>
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
                {results.songs.data.map((song: any, index: number) => (
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
                ))}
              </div>
            ) : (
              <p className="text-red-500">Error: {results.songs.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 