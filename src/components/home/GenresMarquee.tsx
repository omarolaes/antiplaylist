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
  const duration = Math.ceil(availableGenres.length / 10) * 20;

  const duplicatedGenres = [...availableGenres, ...availableGenres];

  return (
    <>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <div 
        className="w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 animate-fade-in opacity-0" 
        style={{ 
          animationDelay: "0.5s", 
          animationDuration: "1s",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
        }}
      >
        <div className="mx-auto py-4 flex items-center gap-4">
          <div className="flex-1 overflow-hidden relative">
            <div className="flex whitespace-nowrap">
              <div
                className="flex items-center animate-marquee"
                style={{
                  animationDuration: `${duration}s`,
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                }}
              >
                {duplicatedGenres.map((genre, index) => (
                  <a
                    key={`${genre.name}-${index}`}
                    href={`?genre=${genre.slug}`}
                    className="mx-4 text-2xl text-zinc-950 hover:text-zinc-600 transition-colors"
                  >
                    {genre.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GenresMarquee;
