import { NextResponse } from "next/server";
import { mainGenres } from "../../../../data/genres/genresList";
import { supabase } from "@/lib/supabase";
import { generateSongs } from "@/lib/generateSongs";
import { generateImage } from "@/lib/generateImage";
import { slugify } from "@/lib/utils/slugify";

// Helper function to get all sub-subgenres
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

// Helper to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function GET(request: Request) {
  try {
    // Verify authorization using Vercel's recommended pattern
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all possible genres
    const allGenres = getAllGenres();

    // Get existing genres from Supabase
    const { data: existingGenres, error: fetchError } = await supabase
      .from("genres")
      .select("slug")
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching existing genres:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch existing genres" },
        { status: 500 }
      );
    }

    // Convert existing genres to a Set for faster lookup
    const existingSlugs = new Set(existingGenres?.map(g => g.slug) || []);

    // Filter out genres that already exist
    const newGenres = allGenres.filter(genre => 
      !existingSlugs.has(slugify(genre))
    );

    if (newGenres.length === 0) {
      return NextResponse.json({
        message: "All genres have been processed",
        success: true,
        genresProcessed: 0
      });
    }

    // Select 1 random genre from the remaining ones
    const genreToProcess = getRandomItems(newGenres, 1)[0];
    const processedGenres = [];
    const errors = [];

    // Process the genre
    try {
      console.log(`[Cron] Processing genre: ${genreToProcess}`);
      const songsResponse = await generateSongs(genreToProcess);
      const songs = Array.isArray(songsResponse) ? songsResponse : songsResponse.songs;
      
      if (songs && Array.isArray(songs) && songs.length > 0) {
        processedGenres.push({
          genre: genreToProcess,
          songCount: songs.length
        });
        console.log(`[Cron] Successfully processed ${genreToProcess} with ${songs.length} songs`);
        
        // Generate image for the genre
        const genreDescription = await supabase
          .from("genres")
          .select("description")
          .eq("slug", slugify(genreToProcess))
          .single();

        if (genreDescription.data?.description) {
          const imageUrl = await generateImage(genreToProcess, genreDescription.data.description);
          console.log(`[Cron] Image generated for ${genreToProcess}: ${imageUrl}`);
        } else {
          console.warn(`[Cron] Description not found for genre: ${genreToProcess}`);
        }
      }
      
    } catch (error) {
      console.error(`[Cron] Error processing genre ${genreToProcess}:`, error);
      errors.push({
        genre: genreToProcess,
        error: error instanceof Error ? error.message : "Unknown error"
      });
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