"use client";

import React, { useEffect, useState } from "react";

const GenresMarquee: React.FC = () => {
  const [genres, setGenres] = useState<Array<{ name: string; slug: string }>>([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/available-genres');
        const data = await response.json();
        // Randomly shuffle the genres array
        const shuffledGenres = [...data.genres].sort(() => Math.random() - 0.5);
        setGenres(shuffledGenres);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };

    fetchGenres();
  }, []);

  return (
    <div 
      className="flex flex-wrap gap-0 items-center h-full justify-around px-2 animate-fade-in opacity-0 mx-auto"
      style={{ 
        animationDelay: "0.5s", 
        animationDuration: "1s" 
      }}
    >
      {genres.map((genre, index) => (
        <a
          key={`${genre.name}-${index}`}
          href={`/genre/${genre.slug}`}
          className="text-[10px] p-1 leading-tight whitespace-nowrap tracking-tight text-zinc-700 hover:text-zinc-300 hover:scale-110 transition-all duration-100"
        >
          {genre.name}
        </a>
      ))}
    </div>
  );
};

export default GenresMarquee;
