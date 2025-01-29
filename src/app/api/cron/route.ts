import { NextResponse } from "next/server";
import { generateSongs } from "../generate-songs/route";
import { mainGenres } from "../../../../data/genres/genresList";
import { supabase } from "@/lib/supabase";

// Helper function to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to convert genre name to slug
function toSlug(genreName: string) {
  return genreName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: Request) {
  try {
    // Verify authorization using Vercel's recommended pattern
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all possible genres
    const allGenres = Array.from(new Set(
      mainGenres.reduce((acc: string[], mainGenre) => {
        mainGenre.subgenres?.forEach((subgenre) => {
          subgenre.subgenres?.forEach((subSubgenre) => {
            if (subSubgenre.name) {
              acc.push(subSubgenre.name);
            }
          });
        });
        return acc;
      }, [])
    ));

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
        console.log(`[Cron] Processing genre: ${genre}`);
        const songs = await generateSongs(genre);
        
        if (songs && songs.length > 0) {
          processedGenres.push({
            genre,
            songCount: songs.length
          });
          console.log(`[Cron] Successfully processed ${genre} with ${songs.length} songs`);
        }
        
        // Add a small delay between processing to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`[Cron] Error processing genre ${genre}:`, error);
        errors.push({
          genre,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Return final results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      genresProcessed: processedGenres.length,
      processedGenres,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("[Cron] Error in cron job:", error);
    return NextResponse.json(
      { 
        success: false,
        timestamp: new Date().toISOString(),
        error: "Failed to process genres",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 