import React from 'react';
import { TfiControlSkipForward } from "react-icons/tfi";

interface SelectGenreProps {
  options: string[];
  correctAnswer: string;
  genreDescription: string;
  isCorrect: boolean;
  selectedAnswers: Set<string>;
  questionNumber: number;
  mistakes: number;
  maxQuestions: number;
  onOptionClick: (option: string) => void;
  onNextTrack: () => void;
  isLoadingNextTrack: boolean;
}

const SelectGenre: React.FC<SelectGenreProps> = ({
  options,
  correctAnswer,
  genreDescription,
  isCorrect,
  selectedAnswers,
  questionNumber,
  mistakes,
  maxQuestions,
  onOptionClick,
  onNextTrack,
  isLoadingNextTrack,
}) => {
  const [countdown, setCountdown] = React.useState<number>(5);
  const [showQuestion, setShowQuestion] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowQuestion(true);
    }
  }, [countdown]);

  // Reset countdown when moving to next track
  const handleNextTrack = () => {
    setCountdown(5);
    setShowQuestion(false);
    onNextTrack();
  };

  return (
    <div className="container mx-auto" role="region" aria-label="Genre Quiz">
      {!showQuestion ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-6xl font-mono text-zinc-950 text-center">
            {countdown > 0 ? (
              <div>
                <div className="text-2xl mb-4">Listen carefully...</div>
                <div>{countdown}</div>
              </div>
            ) : (
              "Listen carefully..."
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-start">
          <div className="w-full space-y-4">
            {isCorrect ? (
              <div className="py-4 md:py-6 border-2 border-zinc-950 bg-white">
                <h2 className="text-lg md:text-6xl font-mono text-zinc-950 mb-3 md:mb-4 px-4">
                  {correctAnswer}
                </h2>
                <p className="text-sm md:text-xl text-zinc-950 mb-4 md:mb-6 px-4">
                  {genreDescription}
                </p>
                <button
                  onClick={handleNextTrack}
                  disabled={isLoadingNextTrack}
                  className={`w-full py-4 text-2xl bg-zinc-950 text-white font-mono border-2 border-zinc-950
                    hover:bg-white hover:text-zinc-950 transition-colors ${
                    isLoadingNextTrack ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label={isLoadingNextTrack ? "Loading next track..." : "Continue to next track"}
                >
                  Continue <TfiControlSkipForward className="inline-block ml-4 w-8 h-8" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="mt-2" role="group" aria-label="Genre options">
                <h2 className="text-xs md:text-sm uppercase font-mono text-zinc-950 mb-3 md:mb-4">
                  What genre is this?
                </h2>
                {options.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => onOptionClick(option)}
                    disabled={selectedAnswers.has(option)}
                    aria-pressed={selectedAnswers.has(option)}
                    style={{ animationDelay: `${index * 0.15}s` }}
                    className={`
                      w-full py-2 md:py-3 px-4 text-left font-mono
                      transition-all duration-200 text-2xl md:text-4xl
                      border-2 border-zinc-950 mb-2
                      flex items-center gap-4 group
                      opacity-0 animate-appear
                      ${
                        selectedAnswers.has(option)
                          ? "bg-red-100 text-red-600 cursor-not-allowed border-red-600"
                          : "bg-white hover:bg-zinc-50 active:bg-zinc-100"
                      }
                    `}
                  >
                    <span className={`
                      inline-block w-8 h-8 
                      border-2 flex-shrink-0 relative
                      transition-all duration-200
                      ${selectedAnswers.has(option) 
                        ? "border-red-600 bg-red-100"
                        : "border-zinc-950 group-hover:bg-zinc-950 group-hover:border-zinc-950"
                      }
                    `}>
                      {selectedAnswers.has(option) ? (
                        <span className="absolute inset-0 flex items-center justify-center text-xl text-red-600">
                          ×
                        </span>
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
                          •
                        </span>
                      )}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Progress and Mistakes Bar */}
      {questionNumber > 0 && (
        <div className="mt-4 mb-8 flex items-center justify-between font-mono">
          <div className="flex items-center gap-4">
            <div className="w-12 h-4 border-2 border-zinc-950 overflow-hidden">
              <div
                className="h-full bg-zinc-950 transition-all duration-700 ease-out"
                style={{
                  width: `${(questionNumber / maxQuestions) * 100}%`,
                }}
              />
            </div>
            <div className="text-sm text-zinc-950">
              {questionNumber}/{maxQuestions}
            </div>
          </div>
          <div className="text-sm text-zinc-950 px-2 py-1">
            MISTAKES: {mistakes}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectGenre;
