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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 bg-white rounded-lg my-4">
      <header className="mb-12">
        <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
          Genre Image Generator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Generate or update cover images for your genre collection
        </p>
      </header>
      
      {/* Genre Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {availableGenres.map((genre) => (
          <div
            key={genre.slug}
            className="group relative bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden 
                     transition-all duration-300 hover:shadow-lg"
          >
            <div className="relative">
              {genre.cover_image ? (
                <>
                  <div className="relative w-full aspect-[4/3]">
                    <Image
                      src={genre.cover_image}
                      alt={genre.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 
                              transition-all duration-300 flex items-center justify-center opacity-0 
                              group-hover:opacity-100">
                    <button
                      onClick={() => generateImage(genre)}
                      disabled={isLoading === genre.slug}
                      className="px-4 py-2.5 bg-white/90 hover:bg-white text-gray-900 
                               rounded-lg font-medium text-sm transition-all transform 
                               translate-y-2 group-hover:translate-y-0"
                    >
                      {isLoading === genre.slug ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Generating
                        </span>
                      ) : (
                        "Replace Image"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full aspect-[4/3] flex items-center justify-center 
                             bg-gray-100 dark:bg-gray-800/50">
                  <button
                    onClick={() => generateImage(genre)}
                    disabled={isLoading === genre.slug}
                    className="px-5 py-3 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 
                             dark:hover:bg-white text-white dark:text-gray-900 rounded-lg 
                             font-medium transition-colors disabled:opacity-50 
                             disabled:cursor-not-allowed"
                  >
                    {isLoading === genre.slug ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Generating
                      </span>
                    ) : (
                      "Generate Image"
                    )}
                  </button>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {genre.name}
              </h3>
              {genre.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {genre.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error Display */}
      {result && !result.success && (
        <div className="mt-8 px-4 py-3 border border-red-200 bg-red-50 dark:bg-red-900/10 
                     dark:border-red-900/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            Error: {result.error}
          </p>
        </div>
      )}
    </div>
  );
} 