"use client";

import React, { useEffect } from "react";
import { mainGenres } from "../../data/genres/genresList";
import { findMismatches, findPotentialMatches } from "../lib/mismatch-files";

interface TimelineProps {
  onVideoSelect: (videoId: string, genreName: string) => void;
  availableGenres: Set<string>;
  isAdminView?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({
  onVideoSelect,
  availableGenres,
  isAdminView = false,
}) => {
  const [availabilityPercentage, setAvailabilityPercentage] =
    React.useState<number>(0);

  // Move normalizeGenreName outside the useEffect to avoid recreating it on every render
  const normalizeGenreName = React.useCallback((name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[-&']/g, "")
      .replace(/\s+/g, "")
      .replace(/[^\w]/g, "")
      .trim()
      .substring(0, 100); // Add maximum length restriction
  }, []);

  // Add this useEffect to check props
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Use proper logging service or remove logs
      return;
    }
    console.log(
      "Timeline received availableGenres:",
      Array.from(availableGenres)
    );
  }, [availableGenres]);

  // Add useEffect to calculate availability percentage
  useEffect(() => {
    try {
      const totalGenres = mainGenres.reduce((total, mainGenre) => {
        let count = 1; // Count main genre
        if (mainGenre.subgenres) {
          mainGenre.subgenres.forEach((subgenre) => {
            count += 1; // Count subgenre
            if (subgenre.subgenres) {
              count += subgenre.subgenres.length; // Count sub-subgenres
            }
          });
        }
        return total + count;
      }, 0);

      const availableCount = Array.from(availableGenres).length;
      const percentage = (availableCount / totalGenres) * 100;
      setAvailabilityPercentage(Math.round(percentage * 10) / 10); // Round to 1 decimal
    } catch (err) {
      console.error('Error calculating availability:', err);
    }
  }, [availableGenres]);

  // Add this useEffect to check for genre mismatches
  useEffect(() => {
    // Collect all valid genres from the master list
    const validGenres = new Set<string>();

    mainGenres.forEach((mainGenre) => {
      validGenres.add(mainGenre.genre);

      mainGenre.subgenres?.forEach((subgenre) => {
        validGenres.add(subgenre.genre);

        subgenre.subgenres?.forEach((subSubgenre) => {
          validGenres.add(subSubgenre.name);
        });
      });
    });

    // Check for mismatches
    const mismatches = Array.from(availableGenres).filter(
      (genre) =>
        !Array.from(validGenres).some(
          (validGenre) =>
            normalizeGenreName(validGenre) === normalizeGenreName(genre)
        )
    );

    if (mismatches.length > 0) {
      console.warn(
        "Found genres in Supabase that don't match the master list:",
        mismatches
      );
    }
  }, [availableGenres, normalizeGenreName]);

  // Memoize the onVideoSelect callback for SubGenre components
  const handleSubGenreSelect = React.useCallback(
    (name: string) => {
      onVideoSelect("", name);
    },
    [onVideoSelect]
  );

  // Memoize the counts calculation since it only depends on mainGenres which is static
  const counts = React.useMemo(
    () =>
      mainGenres.reduce(
        (acc, mainGenre) => {
          acc.mainGenres++;
          if (mainGenre.subgenres) {
            acc.subgenres += mainGenre.subgenres.length;
            mainGenre.subgenres.forEach((subgenre) => {
              if (subgenre.subgenres) {
                acc.subSubgenres += subgenre.subgenres.length;
              }
            });
          }
          return acc;
        },
        { mainGenres: 0, subgenres: 0, subSubgenres: 0 }
      ),
    []
  );

  // Updated styles with more technical, precise aesthetics
  const genreItemStyles = "flex items-center justify-between text-zinc-300";

  // Add proper types for the genre interfaces
  interface SubSubGenre {
    name: string;
  }

  interface Subgenre {
    genre: string;
    year?: string;
    subgenres?: SubSubGenre[];
  }

  interface MainGenre {
    genre: string;
    subgenres?: Subgenre[];
  }

  // Extract GenreItem as a memoized component
  const GenreItem = React.memo(
    ({
      name,
      year = "",
      size = "sm",
      clickable = false,
    }: {
      name: string;
      year?: string;
      size?: "sm" | "xs";
      clickable?: boolean;
    }) => {
      const handleClick = React.useCallback(() => {
        if (clickable || isAdminView) {
          onVideoSelect("", name);
        }
      }, [clickable, name]);

      const isAvailable = Array.from(availableGenres).some(
        (availableGenre) =>
          normalizeGenreName(availableGenre) === normalizeGenreName(name)
      );

      return (
        <div
          onClick={handleClick}
          className={`${genreItemStyles} ${
            clickable || isAdminView
              ? "cursor-pointer hover:text-zinc-100 transition-colors duration-200"
              : ""
          } ${isAdminView && isAvailable ? "text-emerald-400" : ""}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`${
                size === "sm" ? "font-medium" : "font-medium text-sm"
              } tracking-wide`}
            >
              {name}
            </span>
            {isAvailable && !isAdminView && (
              <span className="text-emerald-400/50 text-xs">●</span>
            )}
            {year && (
              <span className="text-xs text-zinc-500 font-mono">({year})</span>
            )}
          </div>
        </div>
      );
    },
    (prevProps, nextProps) => {
      return (
        prevProps.name === nextProps.name &&
        prevProps.year === nextProps.year &&
        prevProps.size === nextProps.size &&
        prevProps.clickable === nextProps.clickable
      );
    }
  );
  GenreItem.displayName = "GenreItem";

  // Extract SubGenre as a separate memoized component
  const SubGenre = React.memo(
    ({ mainGenre, subgenre }: { mainGenre: string; subgenre: Subgenre }) => {
      const isSubgenreAvailable = Array.from(availableGenres).some(
        (availableGenre) =>
          normalizeGenreName(availableGenre) ===
          normalizeGenreName(subgenre.genre)
      );

      return (
        <div
          key={`${mainGenre}-${subgenre.genre}`}
          className={`rounded-md p-2.5 border transition-colors duration-200 ${
            isSubgenreAvailable
              ? "bg-zinc-800/80 border-emerald-800/50"
              : "bg-zinc-800/80 border-zinc-700/30"
          }`}
        >
          <GenreItem
            name={subgenre.genre}
            year={subgenre.year}
            size="xs"
            clickable={false}
          />

          {subgenre.subgenres && (
            <div className="mt-2 text-xs text-zinc-400 flex flex-wrap gap-1.5">
              {subgenre.subgenres.map((sub: SubSubGenre) => {
                const isAvailable = Array.from(availableGenres).some(
                  (availableGenre) =>
                    normalizeGenreName(availableGenre) ===
                    normalizeGenreName(sub.name || "")
                );

                return (
                  <div
                    key={`${mainGenre}-${subgenre.genre}-${sub.name}`}
                    onClick={() => handleSubGenreSelect(sub.name || "")}
                    className={`px-2.5 py-1 rounded-md 
                           flex items-center gap-1.5 cursor-pointer
                           transition-all duration-200 ${
                             isAvailable
                               ? "bg-zinc-900/80 border border-emerald-600/75 hover:border-emerald-500 hover:bg-zinc-800"
                               : "bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
                           }`}
                  >
                    {sub.name}
                    {isAvailable && !isAdminView && (
                      <span className="text-emerald-400/50 text-[10px]">●</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  );
  SubGenre.displayName = "SubGenre";

  // Update the countTotalSubgenres function to use proper typing
  const countTotalSubgenres = React.useCallback((mainGenre: MainGenre) => {
    let total = 0;
    if (mainGenre.subgenres) {
      total += mainGenre.subgenres.length;
      mainGenre.subgenres.forEach((subgenre: Subgenre) => {
        if (subgenre.subgenres) {
          total += subgenre.subgenres.length;
        }
      });
    }
    return total;
  }, []);

  // Memoize the sorted mainGenres
  const sortedMainGenres = React.useMemo(() => {
    return [...mainGenres].sort((a, b) => {
      return countTotalSubgenres(b) - countTotalSubgenres(a);
    });
  }, [countTotalSubgenres]);

  // Update GenresGrid to use sortedMainGenres instead of mainGenres
  const GenresGrid = React.memo(() => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
      {sortedMainGenres.map((mainGenre) => (
        <div
          key={mainGenre.genre}
          className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-4 
                      border border-zinc-700/50 shadow-lg
                      hover:border-zinc-600/50 transition-all duration-300
                      hover:shadow-zinc-900/20"
        >
          <GenreItem name={mainGenre.genre} clickable={false} />
          {mainGenre.subgenres && (
            <div className="mt-3 space-y-2">
              {mainGenre.subgenres.map((subgenre) => (
                <SubGenre
                  key={`${mainGenre.genre}-${subgenre.genre}`}
                  mainGenre={mainGenre.genre}
                  subgenre={subgenre}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  ));
  GenresGrid.displayName = "GenresGrid";

  // Move validGenres creation here
  const validGenres = React.useMemo(() => {
    const genres = new Set<string>();

    mainGenres.forEach((mainGenre) => {
      genres.add(mainGenre.genre);

      mainGenre.subgenres?.forEach((subgenre) => {
        genres.add(subgenre.genre);

        subgenre.subgenres?.forEach((subSubgenre) => {
          genres.add(subSubgenre.name);
        });
      });
    });

    return genres;
  }, []);

  const { mismatches, categories } = React.useMemo(() => findMismatches(), []);

  // Add loading state for initial data fetch
  // const [isLoading, setIsLoading] = React.useState(true);
  
  useEffect(() => {
    // Add cleanup for component unmount
    return () => {
      // Cleanup any subscriptions or listeners if needed
    };
  }, []);

  return (
    <div className="bg-zinc-900 min-h-screen">
      {/* Add error display if you want to use the error state */}
      {/* {error && (
        <div className="p-4 text-red-400 text-sm">
          Error: {error.message}
        </div>
      )} */}
      <div className="p-4 text-center text-sm text-zinc-400 font-mono border-b border-zinc-800">
        <div className="mb-2">
          <span className="text-emerald-400">{availabilityPercentage}%</span> of
          genres available
        </div>
        <span className="tracking-wider">GENRE INDEX:</span>{" "}
        {counts.mainGenres + counts.subgenres + counts.subSubgenres}
        <span className="text-zinc-500 ml-2">
          [{counts.mainGenres}·{counts.subgenres}·{counts.subSubgenres}]
        </span>
        <div className="mt-2 text-xs">
          {Array.from(availableGenres).length} genres in database
          {(() => {
            const mismatches = Array.from(availableGenres).filter(
              (genre) =>
                !Array.from(validGenres).some(
                  (validGenre) =>
                    normalizeGenreName(validGenre) === normalizeGenreName(genre)
                )
            );

            return (
              mismatches.length > 0 && (
                <>
                  <span className="text-amber-400 ml-2">
                    ({mismatches.length} mismatches:
                  </span>
                  <span className="text-amber-400/75 ml-1">
                    {mismatches.join(", ")}
                  </span>
                  <span className="text-amber-400">)</span>
                </>
              )
            );
          })()}
        </div>
      </div>

      <GenresGrid />

      <div className="p-4 bg-zinc-800/50 rounded-lg">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">
          Unmatched Genres ({mismatches.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categories)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, genres]) => (
              <div key={letter} className="space-y-2">
                <h3 className="text-emerald-400 font-mono">{letter}</h3>
                <ul className="space-y-1">
                  {genres.map((genre) => (
                    <li
                      key={genre}
                      className="text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer"
                      onClick={() => {
                        const matches = findPotentialMatches(genre);
                        if (matches.length > 0) {
                          console.log(
                            `Potential matches for "${genre}":`,
                            matches
                          );
                        }
                      }}
                    >
                      {genre}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Timeline);
