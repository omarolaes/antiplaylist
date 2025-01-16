import React, { useEffect } from "react";
import GenresMarquee from "./GenresMarquee";
import { BsPlayFill } from "react-icons/bs";
import BackgroundShaderScene from "./BackgroundShaderScene";
import LoadingSpinner from "@/components/general/LoadingSpinner";

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
    <div className="relative w-full h-screen md:h-[calc(100vh-90px)] flex flex-col items-center justify-center gap-2 py-12 md:py-24 overflow-hidden">
      <BackgroundShaderScene />
      <div className="text-center w-full">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <LoadingSpinner 
              color={isPremium ? "#ef4444" : "#000000"} 
              size="lg" 
            />
          </div>
        ) : (
          <div className="w-full relative">
            <div className="mt-20 space-y-3 text-center w-full">
              <div className="relative">
                <GenresMarquee availableGenres={availableGenres} />
                <button
                  onClick={handleStartClick}
                  disabled={!showMarquee}
                  aria-label="Start listening"
                  className={`mx-auto group relative px-24 py-4 bg-white border-2 hover:bg-zinc-950 ${
                    isPremium
                      ? "border-red-500 hover:border-red-500 text-red-500"
                      : "border-zinc-950 hover:border-zinc-950 text-zinc-950 hover:text-white"
                  } hover:scale-95 hover:border-x-4 flex items-center gap-3 text-3xl font-medium transition-all disabled:opacity-50 animate-fade-in opacity-0`}
                  style={{ animationDelay: "0.25s" }}
                >
                  <span>Listen</span>
                  <BsPlayFill
                    className={`w-10 h-10 group-hover:translate-x-1 group-hover:scale-110 transition-transform ${
                      isPremium ? "text-red-500" : "text-zinc-950 group-hover:text-white"
                    }`}
                  />
                </button>
              </div>
                <div className="pt-8 flex justify-center animate-fade-in opacity-0" style={{ animationDelay: "0.5s" }}>
                  <a 
                    href="https://www.producthunt.com/posts/antiplaylist?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-antiplaylist" 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img 
                      src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=679302&theme=light" 
                      alt="AntiPlaylist - AI curated random radio | Product Hunt"
                      width="250"
                      height="54"
                    />
                  </a>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;
