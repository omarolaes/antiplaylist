import { mainGenres } from "../../data/genres/genresList";
import { extensiveListOfGenres } from "../../data/genres/genresNoise";

// Helper function to normalize genre names for comparison
const normalizeGenreName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[-&']/g, "")
    .replace(/\s+/g, "")
    .replace(/[^\w]/g, "")
    .trim();
};

// Add a new function for fuzzy matching
const areSimilarGenres = (genre1: string, genre2: string): boolean => {
  const normalized1 = normalizeGenreName(genre1);
  const normalized2 = normalizeGenreName(genre2);

  // Direct match
  if (normalized1 === normalized2) return true;

  // Check if one contains the other (for partial matches)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;

  // Add more matching rules here if needed
  // For example:
  // - Levenshtein distance for typos
  // - Handling plurals
  // - Common abbreviations

  return false;
};

// Collect all valid genres from the master list
const getValidGenres = (): Set<string> => {
  try {
    const validGenres = new Set<string>();

    if (!mainGenres || !Array.isArray(mainGenres)) {
      console.error('Invalid mainGenres data structure');
      return new Set<string>();
    }

    mainGenres.forEach((mainGenre) => {
      if (mainGenre?.genre) validGenres.add(mainGenre.genre);

      mainGenre.subgenres?.forEach((subgenre) => {
        if (subgenre?.genre) validGenres.add(subgenre.genre);

        subgenre.subgenres?.forEach((subSubgenre) => {
          if (subSubgenre?.name) validGenres.add(subSubgenre.name);
        });
      });
    });

    return validGenres;
  } catch (error) {
    console.error('Error in getValidGenres:', error);
    return new Set<string>();
  }
};

// Find genres that exist in genresNoise but not in genresList
export const findMismatches = (): {
  mismatches: string[];
  categories: {
    [key: string]: string[];
  };
} => {
  try {
    const validGenres = getValidGenres();
    if (!extensiveListOfGenres || !Array.isArray(extensiveListOfGenres)) {
      throw new Error('Invalid extensiveListOfGenres data structure');
    }
    
    const mismatches = extensiveListOfGenres
      .map((genre) => genre.genre)
      .filter(
        (genre) =>
          !Array.from(validGenres).some(
            (validGenre) => areSimilarGenres(validGenre, genre)
          )
      );

    // Categorize mismatches by first letter
    const categories = mismatches.reduce((acc: { [key: string]: string[] }, genre) => {
      const firstLetter = genre.charAt(0).toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(genre);
      return acc;
    }, {});

    // Sort genres within each category
    Object.keys(categories).forEach((key) => {
      categories[key].sort((a, b) => a.localeCompare(b));
    });

    return {
      mismatches,
      categories,
    };
  } catch (error) {
    console.error('Error in findMismatches:', error);
    return { mismatches: [], categories: {} };
  }
};

// Find potential matches for a given genre
export const findPotentialMatches = (genre: string): string[] => {
  const validGenres = Array.from(getValidGenres());
  const normalizedGenre = normalizeGenreName(genre);

  return validGenres
    .filter((validGenre) => {
      const normalizedValidGenre = normalizeGenreName(validGenre);
      return (
        normalizedValidGenre.includes(normalizedGenre) ||
        normalizedGenre.includes(normalizedValidGenre)
      );
    })
    .slice(0, 5); // Limit to 5 suggestions
};
