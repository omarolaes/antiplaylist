"use client";

import React, { useEffect, useState } from "react";
import { slugify } from "@/lib/utils/slugify";

interface Genre {
  name: string;
  slug: string;
}

const GenresMarquee: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/available-genres');
        if (!response.ok) {
          throw new Error('Failed to fetch genres');
        }
        
        const data = await response.json();
        
        // Ensure each genre has a valid slug
        const validatedGenres = data.genres.map((genre: Genre) => ({
          name: genre.name,
          // Use existing slug from DB or generate new one if missing
          slug: genre.slug || slugify(genre.name)
        }));

        // Randomly shuffle the genres array
        const shuffledGenres = [...validatedGenres].sort(() => Math.random() - 0.5);
        setGenres(shuffledGenres);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };

    fetchGenres();
  }, []);

  return (
    <div 
      className="flex flex-wrap gap-0 items-center h-auto justify-around px-2 animate-fade-in opacity-0 mx-auto"
      style={{ 
        animationDelay: "0.5s", 
        animationDuration: "1s" 
      }}
    >
      {genres.map((genre, index) => (
        <a
          key={`${genre.name}-${index}`}
          href={`/genre/${encodeURIComponent(genre.slug)}`}
          className="text-4xl p-1 leading-tight whitespace-nowrap tracking-tight text-zinc-700 hover:text-zinc-300 hover:scale-110 transition-all duration-100"
        >
          {genre.name}
        </a>
      ))}
    </div>
  );
};

export default GenresMarquee;
