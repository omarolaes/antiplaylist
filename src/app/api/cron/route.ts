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

    // Add error handling for missing API token
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("[Cron] Missing REPLICATE_API_TOKEN environment variable");
      return NextResponse.json(
        { error: "Missing required API configuration" },
        { status: 500 }
      );
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
        
        // Add additional logging for debugging
        console.log("[Cron] Checking for genre description before image generation");
        const { data: genreData, error: genreError } = await supabase
          .from("genres")
          .select("description")
          .eq("slug", slugify(genreToProcess))
          .single();

        if (genreError) {
          console.error("[Cron] Error fetching genre data:", genreError);
          throw genreError;
        }

        if (genreData?.description) {
          console.log("[Cron] Found description, attempting image generation");
          try {
            const imageUrl = await generateImage(genreToProcess, genreData.description);
            console.log(`[Cron] Image generated for ${genreToProcess}: ${imageUrl}`);
            
            // Add this section to update the genre with the image URL
            const { error: updateError } = await supabase
              .from("genres")
              .update({ 
                cover_image: imageUrl,
                updated_at: new Date().toISOString()
              })
              .eq("slug", slugify(genreToProcess));

            if (updateError) {
              console.error("[Cron] Error updating genre with image URL:", updateError);
              throw updateError;
            }
            
            console.log(`[Cron] Successfully updated genre with image URL`);
          } catch (imageError) {
            console.error("[Cron] Image generation failed:", imageError);
            errors.push({
              genre: genreToProcess,
              error: imageError instanceof Error ? imageError.message : "Image generation failed"
            });
          }
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