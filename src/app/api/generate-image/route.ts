import { NextResponse } from "next/server";
import { generateImage } from "@/lib/generateImage";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils/slugify";

export async function POST(request: Request) {
  try {
    console.log('🚀 Starting image generation process...');
    
    const contentType = request.headers.get("content-type");
    console.log('📨 Content-Type:', contentType);

    if (!contentType?.includes("application/json")) {
      console.log('❌ Invalid content type');
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const { genre, description, songs } = await request.json();
    console.log('📝 Request payload:', { genre, description, songsProvided: !!songs });

    if (!genre || !description) {
      return NextResponse.json(
        { error: "Genre and description are required" },
        { status: 400 }
      );
    }

    let genreData: any = null;
    let songsToUse = songs;
    if (!songsToUse) {
      console.log('🎵 Fetching songs from database for genre:', genre);
      const { data, error: genreError } = await supabase
        .from("genres")
        .select("id")
        .eq("slug", slugify(genre))
        .single();
      
      genreData = data;

      console.log('🎸 Genre data:', genreData, 'Error:', genreError);

      if (genreError) {
        console.log('❌ Genre fetch error:', genreError);
        return NextResponse.json(
          { error: "Genre not found. Please generate songs first." },
          { status: 404 }
        );
      }

      const { data: dbSongs, error: dbSongsError } = await supabase
        .from("genre_songs")
        .select("artist, song")
        .eq("genre_id", genreData.id);

      console.log('🎼 Retrieved songs:', {
        count: dbSongs?.length || 0,
        songs: dbSongs,
        error: dbSongsError,
        genreId: genreData.id
      });

      if (dbSongsError) {
        console.log('❌ Songs fetch error:', dbSongsError);
        return NextResponse.json(
          { error: "Failed to fetch songs for this genre" },
          { status: 500 }
        );
      }

      songsToUse = dbSongs;
    }

    // Only proceed if we have songs to use for inspiration
    if (!songsToUse || songsToUse.length === 0) {
      console.log('⚠️ No songs found for genre:', genre);
      return NextResponse.json(
        { 
          error: "No songs found for this genre. Please generate songs first.",
          genreId: genreData?.id 
        },  
        { status: 400 }
      );
    }

    console.log('🎨 Generating image for genre:', genre);
    const imageUrl = await generateImage(genre, description);
    console.log('🖼️ Generated image URL:', imageUrl);

    // Debug log for database operations
    console.log('💾 Checking existing genre in database');
    const { data: existingGenre, error: fetchError } = await supabase
      .from("genres")
      .select("id")
      .eq("slug", slugify(genre))
      .single();

    console.log('📊 Existing genre data:', existingGenre, 'Error:', fetchError);

    // Update the genre with the generated image URL
    if (existingGenre) {
      console.log('📝 Updating existing genre with new image URL');
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
      console.log('🔍 Checking genre by name (case insensitive)');
      // Check if genre exists by name to handle case sensitivity
      const { data: existingByName } = await supabase
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

    console.log('✅ Process completed successfully');
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('💥 Error in generate-image route:', error);
    return NextResponse.json(
      { 
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 