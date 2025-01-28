"use client";

import React from "react";

interface GenresMarqueeProps {
  availableGenres: Array<{
    name: string;
    slug: string;
  }>;
}

const GenresMarquee: React.FC<GenresMarqueeProps> = ({
  availableGenres,
}) => {
  return (
    <div className="flex flex-wrap gap-0 items-center justify-around px-2 animate-fade-in opacity-0 mx-auto"
         style={{ 
           animationDelay: "0.5s", 
           animationDuration: "1s" 
         }}>
      {availableGenres.map((genre, index) => (
        <a
          key={`${genre.name}-${index}`}
          href={`/genre/${genre.slug}`}
          className="text-sm p-1 leading-tight whitespace-nowrap tracking-tight text-zinc-700 hover:text-zinc-300 hover:scale-150 transition-all duration-100"
        >
          {genre.name}
        </a>
      ))}
    </div>
  );
};

export default GenresMarquee;
