import { NextResponse } from "next/server";
import { generateImage } from "@/lib/generateImage";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils/slugify";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const { genre, description, songs } = await request.json();

    if (!genre || !description) {
      return NextResponse.json(
        { error: "Genre and description are required" },
        { status: 400 }
      );
    }

    // If songs weren't provided, try to fetch them from the database
    let songsToUse = songs;
    if (!songsToUse) {
      const { data: genreData, error: genreError } = await supabase
        .from("genres")
        .select("id")
        .eq("slug", slugify(genre))
        .single();

      if (genreError) {
        return NextResponse.json(
          { error: "Genre not found. Please generate songs first." },
          { status: 404 }
        );
      }

      const { data: dbSongs, error: dbSongsError } = await supabase
        .from("genre_songs")
        .select("artist, song")
        .eq("genre_id", genreData.id);

      if (dbSongsError) {
        return NextResponse.json(
          { error: "Failed to fetch songs from database" },
          { status: 500 }
        );
      }

      songsToUse = dbSongs;
    }

    // Only proceed if we have songs to use for inspiration
    if (!songsToUse || songsToUse.length === 0) {
      return NextResponse.json(
        { error: "Songs are required for image generation. Please generate songs first." },
        { status: 400 }
      );
    }

    const imageUrl = await generateImage(genre, description, songsToUse);

    // Update the genre with the generated image URL
    const { data: existingGenre, error: fetchError } = await supabase
      .from("genres")
      .select("id")
      .eq("slug", slugify(genre))
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error fetching genre:", fetchError);
      return NextResponse.json(
        { error: "Failed to check genre existence" },
        { status: 500 }
      );
    }

    if (existingGenre) {
      // Update existing genre
      const { error: updateError } = await supabase
        .from("genres")
        .update({ 
          cover_image: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingGenre.id);

      if (updateError) {
        console.error("Error updating genre with image URL:", updateError);
        return NextResponse.json(
          { error: "Failed to save image URL to database" },
          { status: 500 }
        );
      }
    } else {
      // Check if genre exists by name to handle case sensitivity
      const { data: existingByName, error: existingByNameError } = await supabase
        .from("genres")
        .select("id")
        .ilike("name", genre)
        .single();

      if (existingByName) {
        // Update if found by name
        const { error: updateError } = await supabase
          .from("genres")
          .update({ 
            cover_image: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingByName.id);

        if (updateError) {
          console.error("Error updating genre with image URL:", updateError);
          return NextResponse.json(
            { error: "Failed to save image URL to database" },
            { status: 500 }
          );
        }
      } else {
        // Insert new genre
        const { error: insertError } = await supabase
          .from("genres")
          .insert([{
            name: genre,
            slug: slugify(genre),
            cover_image: imageUrl,
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error("Error inserting genre with image URL:", insertError);
          return NextResponse.json(
            { error: "Failed to create new genre record" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error("Error in generate-image route:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 