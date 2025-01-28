import React, { useEffect } from "react";
import GenresMarquee from "./GenresMarquee";
import { BsPlayFill } from "react-icons/bs";
import BackgroundShaderScene from "./BackgroundShaderScene";
import LoadingSpinner from "@/components/general/LoadingSpinner";
import { IoPlaySharp } from "react-icons/io5";

interface HeroProps {
  handleStartClick: () => void;
  availableGenres: Array<{
    name: string;
    slug: string;
  }>;
  genreSongsCount: number;
  isPremium?: boolean;
}

const Hero: React.FC<HeroProps> = ({
  handleStartClick,
  availableGenres,
  genreSongsCount,
  isPremium = false,
}) => {
  useEffect(() => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const cached = localStorage.getItem("cachedGenresDate");

      if (cached !== today && availableGenres.length > 0) {
        localStorage.setItem("cachedGenres", JSON.stringify(availableGenres));
        localStorage.setItem("cachedGenresDate", today);
        localStorage.setItem("cachedSongsCount", genreSongsCount.toString());
      }
    } catch (error) {
      console.warn("Failed to cache genres:", error);
    }
  }, [availableGenres, genreSongsCount]);

  const showMarquee = availableGenres.length > 0 && genreSongsCount > 0;
  const isLoading = !showMarquee;

  return (
    <div className="relative w-full flex flex-col items-center justify-center gap-2">
      <BackgroundShaderScene />
        {isLoading ? (
          <div className="flex items-center justify-center">
            <LoadingSpinner 
              color={isPremium ? "#ef4444" : "#ffffff"} 
              size="lg" 
            />
          </div>
        ) : (
          <div className="w-full h-[calc(100vh-100px)]">
            <GenresMarquee availableGenres={availableGenres} />
            <div className="space-y-3 text-center w-full">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <button
                  onClick={handleStartClick}
                  disabled={!showMarquee}
                  aria-label="Start listening"
                  className={`mx-auto group relative px-8 py-8 border-2 rounded-sm bg-zinc-950 ${
                    isPremium
                      ? "border-red-500 hover:border-red-500 text-red-500"
                      : "border-zinc-950 text-white"
                  } hover:scale-110 flex items-center gap-3 text-3xl font-semibold uppercase transition-all disabled:opacity-50 animate-fade-in opacity-0`}
                  style={{ animationDelay: "0.25s" }}
                >
                  <IoPlaySharp
                    className={`w-20 h-20 group-hover:scale-50 transition-transform ${
                      isPremium ? "text-red-500" : "text-white"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Hero;
