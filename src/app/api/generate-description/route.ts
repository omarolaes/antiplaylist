import { NextResponse } from "next/server";
import { mainGenres } from "../../../../data/genres/genresList";
import { ParentGenreInfo } from "@/lib/generateSongs";
import { generateDescription } from "@/lib/generateDescription";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils/slugify";

function findParentGenreInfo(targetGenre: string): ParentGenreInfo | undefined {
  const normalizedTarget = targetGenre.toLowerCase();

  for (const main of mainGenres) {
    if (main.subgenres) {
      for (const sub of main.subgenres) {
        if (sub.subgenres) {
          for (const subsub of sub.subgenres) {
            if (subsub.name?.toLowerCase() === normalizedTarget) {
              return {
                mainGenre: main.genre,
                subgenre: sub.genre,
              };
            }
          }
        }
      }
    }
  }

  return undefined;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Clone the request before reading
    const clonedRequest = request.clone();
    const text = await clonedRequest.text();
    
    if (!text) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    const { genre } = JSON.parse(text);
    if (!genre) {
      return NextResponse.json(
        { error: "Genre is required" },
        { status: 400 }
      );
    }

    // Add input length validation
    if (genre.length > 100) {
      return NextResponse.json(
        { error: "Genre name too long" },
        { status: 400 }
      );
    }

    // Add sanitization
    const sanitizedGenre = genre.replace(/[^a-zA-Z0-9-\s]/g, '').trim();
    const slug = slugify(sanitizedGenre);
    
    const parentInfo = findParentGenreInfo(sanitizedGenre);
    const description = await generateDescription(sanitizedGenre, parentInfo);

    // Check if genre exists
    const { data: existingGenre, error: fetchError } = await supabase
      .from("genres")
      .select("id")
      .eq("slug", slug)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw fetchError;
    }

    if (existingGenre) {
      // Update existing genre with new description
      const { error: updateError } = await supabase
        .from("genres")
        .update({ description })
        .eq("id", existingGenre.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new genre with description
      const { error: insertError } = await supabase
        .from("genres")
        .insert([{
          name: sanitizedGenre,
          slug: slug,
          description: description,
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Error in generate-description:", error);
    // Improve error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
