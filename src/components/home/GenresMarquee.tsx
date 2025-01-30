"use client";

import React, { useEffect, useState } from "react";
import { slugify } from "@/lib/utils/slugify";
import Image from "next/image";

interface Genre {
  name: string;
  slug: string;
  cover_image?: string;
}

const GenresMarquee: React.FC = () => {
  const [featuredGenres, setFeaturedGenres] = useState<Genre[]>([]);
  const [additionalGenres, setAdditionalGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/available-genres');
        if (!response.ok) {
          throw new Error('Failed to fetch genres');
        }
        
        const data = await response.json();
        const validatedGenres = data.genres.map((genre: Genre) => ({
          name: genre.name,
          slug: genre.slug || slugify(genre.name),
          cover_image: genre.cover_image
        }));

        const shuffled = [...validatedGenres].sort(() => Math.random() - 0.5);
        setFeaturedGenres(shuffled.slice(0, 20));
        setAdditionalGenres(shuffled.slice(20));
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenres();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-2xl bg-zinc-800/30 animate-pulse"
            />
          ))}
        </div>
        <div className="mt-12">
          <div className="h-8 w-32 bg-zinc-800/30 rounded-full animate-pulse mb-6" />
          <div className="flex flex-wrap gap-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="h-9 w-24 bg-zinc-800/30 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in opacity-0"
      style={{ 
        animationDelay: "0.5s", 
        animationDuration: "1s" 
      }}
    >
      {/* Featured Genres Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {featuredGenres.map((genre, index) => (
          <a
            key={`${genre.slug}-${index}`}
            href={`/genre/${encodeURIComponent(genre.slug)}`}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-zinc-800/50"
          >
            {genre.cover_image ? (
              <Image
                src={genre.cover_image}
                alt={genre.name}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <span className="text-xl font-medium text-white">
                {genre.name}
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Additional Genres Text List */}
      {additionalGenres.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl text-white/90 mb-6 font-medium">More Genres</h3>
          <div className="flex flex-wrap gap-3">
            {additionalGenres.map((genre, index) => (
              <a
                key={`${genre.slug}-${index}`}
                href={`/genre/${encodeURIComponent(genre.slug)}`}
                className="px-4 py-2 bg-zinc-800/50 rounded-full text-white/80 hover:text-white text-sm hover:bg-zinc-700/50 transition-all"
              >
                {genre.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenresMarquee;
