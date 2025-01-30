"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Genre {
  name: string;
  slug: string;
  cover_image?: string;
  description?: string;
}

interface TestResult {
  success: boolean;
  data?: string;
  error?: string;
}

export default function GenreImageGenerator() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const fetchAvailableGenres = async () => {
      try {
        const response = await fetch("/api/available-genres");
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || "Failed to fetch genres");
        
        setAvailableGenres(data.genres);
      } catch (error) {
        console.error("Error fetching available genres:", error);
      }
    };

    fetchAvailableGenres();
  }, []);

  const generateImage = async (genre: Genre) => {
    setIsLoading(genre.slug);
    try {
      // First, fetch the genre details if we don't have the description
      if (!genre.description) {
        const detailsResponse = await fetch(`/api/genre-details?slug=${genre.slug}`);
        const detailsData = await detailsResponse.json();
        
        if (!detailsResponse.ok) throw new Error(detailsData.error || "Failed to fetch genre details");
        
        genre = { ...genre, description: detailsData.description };
      }

      // Now generate the image with both genre and description
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          genre: genre.name,
          description: genre.description 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to generate image");
      
      setResult({
        success: true,
        data: data.imageUrl,
      });

      // Update the genre in the available genres list with the new image URL
      setAvailableGenres(prev => 
        prev.map(g => 
          g.slug === genre.slug 
            ? { ...g, cover_image: data.imageUrl }
            : g
        )
      );
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 my-4 bg-white rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Genre Image Generator</h1>
      
      {/* Genre Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {availableGenres.map((genre) => (
          <div
            key={genre.slug}
            className="border rounded-lg overflow-hidden bg-black/5 hover:bg-black/10 transition-all"
          >
            <div className="relative">
              {genre.cover_image ? (
                <>
                  <div className="relative w-full aspect-square">
                    <Image
                      src={genre.cover_image}
                      alt={genre.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={() => generateImage(genre)}
                    disabled={isLoading === genre.slug}
                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/75 hover:bg-black/90 
                             text-white text-sm rounded-md transition-colors"
                  >
                    {isLoading === genre.slug ? "Generating..." : "Replace"}
                  </button>
                </>
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <button
                    onClick={() => generateImage(genre)}
                    disabled={isLoading === genre.slug}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md 
                             transition-colors disabled:opacity-50"
                  >
                    {isLoading === genre.slug ? "Generating..." : "Generate Image"}
                  </button>
                </div>
              )}
            </div>
            <div className="p-3 border-t bg-white/5">
              <h3 className="font-medium text-center">{genre.name}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Error Display */}
      {result && !result.success && (
        <div className="p-4 border border-red-500 bg-red-50 dark:bg-red-900/10 rounded-md mt-4">
          <p className="text-red-600 dark:text-red-400">Error: {result.error}</p>
        </div>
      )}
    </div>
  );
} 