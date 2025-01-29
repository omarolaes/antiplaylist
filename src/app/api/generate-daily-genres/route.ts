import { NextResponse } from "next/server";
import { mainGenres } from "../../../../data/genres/genresList";
import { supabase } from "@/lib/supabase";
import { generateDescription } from "@/lib/generateDescription";
import { generateSongs } from "@/lib/generateSongs";

// Helper function to flatten the genre list
function getAllGenres() {
  const genres: string[] = [];
  
  mainGenres.forEach((mainGenre) => {
    mainGenre.subgenres?.forEach((subgenre) => {
      subgenre.subgenres?.forEach((subSubgenre) => {
        if (subSubgenre.name) {
          genres.push(subSubgenre.name);
        }
      });
    });
  });
  
  return genres;
}

// Helper function to convert genre name to slug
function toSlug(genreName: string) {
  return genreName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Helper to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function POST(request: Request) {
  try {
    // Check for API key authorization
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all possible genres
    const allGenres = getAllGenres();
    
    // Get existing genres from Supabase
    const { data: existingGenres } = await supabase
      .from("genres")
      .select("slug")
      .order("created_at", { ascending: true });

    // Convert existing genres to a Set for faster lookup
    const existingSlugs = new Set(existingGenres?.map(g => g.slug) || []);
    
    // Filter out genres that already exist
    const newGenres = allGenres.filter(genre => 
      !existingSlugs.has(toSlug(genre))
    );

    if (newGenres.length === 0) {
      return NextResponse.json({
        message: "All genres have been processed",
        success: true,
        genresProcessed: 0
      });
    }

    // Select 20 random genres from the remaining ones
    const genresToProcess = getRandomItems(newGenres, 20);
    const processedGenres = [];
    const errors = [];

    // Process each genre
    for (const genre of genresToProcess) {
      try {
        console.log(`Processing genre: ${genre}`);
        
        // First generate description
        const description = await generateDescription(genre);
        
        // Then generate songs
        const songs = await generateSongs(genre);
        
        if (songs && songs.length > 0) {
          processedGenres.push({
            genre,
            description,
            songCount: songs.length,
            songs
          });
        }
        
        // Add a small delay between processing to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing genre ${genre}:`, error);
        errors.push({
          genre,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      genresProcessed: processedGenres.length,
      processedGenres,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error in generate-daily-genres:", error);
    return NextResponse.json(
      { 
        error: "Failed to process genres",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 