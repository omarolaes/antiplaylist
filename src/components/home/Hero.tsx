import React from "react";
import GenresMarquee from "./GenresMarquee";
import BackgroundShaderScene from "./BackgroundShaderScene";
import { IoPlaySharp } from "react-icons/io5";

interface HeroProps {
  handleStartClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ handleStartClick }) => {
  return (
    <div className="relative w-full flex flex-col items-center justify-center gap-2">
      <div className="w-full h-[calc(100vh-60px)] relative">
      <BackgroundShaderScene />
        <div className="space-y-3 text-center w-full">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={handleStartClick}
              aria-label="Start listening"
              className={`mx-auto group relative px-8 py-8 border-2 rounded-sm bg-zinc-950 hover:scale-110 flex items-center gap-3 text-3xl font-semibold uppercase transition-all disabled:opacity-50 animate-fade-in opacity-0`}
              style={{ animationDelay: "0.25s" }}
            >
              <IoPlaySharp
                className={`w-20 h-20 group-hover:scale-50 transition-transform text-white`}
              />
            </button>
          </div>
        </div>
      </div>
      <GenresMarquee />
    </div>
  );
};

export default Hero;
