import React from "react";
import BackgroundShaderScene from "./BackgroundShaderScene";
import { IoPlaySharp } from "react-icons/io5";

interface HeroProps {
  handleStartClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ handleStartClick }) => {
  return (
    <div className="relative z-20 w-full flex flex-col items-center justify-center gap-2">
      <div className="w-full h-[calc(100vh-60px)] relative">
        <BackgroundShaderScene />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handleStartClick}
            className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black 
                     rounded-full hover:bg-white/90 transition-all transform 
                     hover:scale-105 font-medium text-xl shadow-lg animate-fade-in opacity-0"
            style={{ animationDelay: "0.25s" }}
          >
            <IoPlaySharp className="w-6 h-6" />
            <span>Start Listening</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
