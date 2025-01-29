import { NextResponse } from "next/server";
import { mainGenres } from "../../../../data/genres/genresList";
import { supabase } from "@/lib/supabase";

// Helper function to convert genre name to slug
function toSlug(genreName: string) {
  return genreName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
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
    )).sort();

    // Get existing genres from Supabase
    const { data: existingGenres, error } = await supabase
      .from("genres")
      .select("slug")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Convert existing genres to a Set for faster lookup
    const existingSlugs = new Set(existingGenres?.map(g => g.slug) || []);
    
    // Filter out genres that already exist
    const availableGenres = allGenres.filter(genre => 
      !existingSlugs.has(toSlug(genre))
    );

    return NextResponse.json({
      genres: availableGenres
    });

  } catch (error) {
    console.error("Error fetching unprocessed genres:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch genres",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 