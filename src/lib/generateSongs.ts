import { supabase } from "@/lib/supabase";
import { generateDescription } from "@/app/api/generate-description/route";
import { searchYouTubeVideos } from "@/lib/youtube";
import { slugify } from "@/lib/utils/slugify";


export interface ParentGenreInfo {
  mainGenre?: string;
  subgenre?: string;
}

export async function generateSongs(genre: string, parentInfo?: ParentGenreInfo) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  let genreId: string;

  try {
    console.log("=== Starting Song Generation Process ===");
    console.log("Input:", { genre, parentInfo });

    // First, try to get the existing genre
    const { data: genreSongsData, error: fetchError } = await supabase
      .from("genres")
      .select("id, name, genre_songs(artist, song, video_id)")
      .or(`slug.eq.${genre.toLowerCase()},name.ilike.${genre}`)
      .single();

    if (fetchError) {
      // If not found, create new genre
      const { data: newGenre, error: createError } = await supabase
        .from("genres")
        .insert([{
          name: genre,
          slug: genre.toLowerCase(),
          updated_at: new Date().toISOString()
        }])
        .select("id")
        .single();

      if (createError) {
        // If the error is a duplicate key constraint, get the existing genre ID
        if (createError.code === '23505') {
          const { data: existingGenre, error: fetchError } = await supabase
            .from('genres')
            .select('id')
            .eq('slug', genre.toLowerCase())
            .single();

          if (fetchError) throw fetchError;
          genreId = existingGenre.id;
        } else {
          console.error('Error creating genre:', createError);
          throw new Error(`Failed to create genre: ${createError.message}`);
        }
      } else {
        genreId = newGenre.id;
      }
    } else {
      genreId = genreSongsData.id;
    }

    const existingSongs = genreSongsData?.genre_songs || [];

    if (existingSongs.length > 0) {
      console.log("Found existing songs:", existingSongs.length);
      
      // Map existing songs to the expected format
      const formattedSongs = existingSongs.map(song => ({
        artist: song.artist,
        song: song.song,
        videoId: song.video_id
      }));

      // Check for missing video IDs
      const songsNeedingVideoIds = formattedSongs.filter(song => !song.videoId);
      
      if (songsNeedingVideoIds.length > 0) {
        console.log("Fetching missing video IDs for songs:", songsNeedingVideoIds.length);
        
        // Search for missing video IDs
        const videoIds = await searchYouTubeVideos(songsNeedingVideoIds);
        
        // Update songs with new video IDs
        const updatedSongs = formattedSongs.map(song => {
          if (!song.videoId) {
            const cacheKey = `${song.artist}-${song.song}`.toLowerCase();
            return {
              ...song,
              videoId: videoIds[cacheKey] || null
            };
          }
          return song;
        });

        // Update database with new video IDs
        const songsToUpdate = updatedSongs
          .filter(song => song.videoId)
          .map(song => ({
            genre_id: genreSongsData?.id,
            artist: song.artist,
            song: song.song,
            video_id: song.videoId
          }));

        if (songsToUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from("genre_songs")
            .upsert(songsToUpdate);

          if (updateError) {
            console.error("Failed to update video IDs:", updateError);
          }
        }

        return { songs: updatedSongs.filter(song => song.videoId) };
      }

      // If all songs have video IDs, return them as is
      return { songs: formattedSongs };
    }

    // If no existing songs, first ensure we have a description
    console.log("Fetching genre description...");
    const description = await generateDescription(genre, parentInfo);

    // Now continue with song generation using the description
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey?.startsWith("pplx-")) {
      throw new Error("Invalid Perplexity API key");
    }

    const genreContext = parentInfo
      ? `${genre} (a subgenre of ${parentInfo.mainGenre}${
          parentInfo.subgenre ? ` → ${parentInfo.subgenre}` : ""
        })`
      : genre;

    console.log("Genre Context:", genreContext);
    console.log("Genre Description:", description);

    const initialPrompt = `You are part of an elite panel of music experts from Apple Music, Rolling Stone, Pitchfork, and BBC Radio 1 tasked with creating the definitive ${genreContext} playlist.

GENRE DEFINITION:
${description}

As leading authorities who shape global music discourse, select exactly 5 tracks that capture this genre's essence and evolution.

Your panel must choose:
1. The genre's most iconic masterpiece - a track so significant it's featured in Apple Music's essential playlists
2. A second groundbreaking classic consistently praised in Rolling Stone's retrospective reviews
3. A brilliant but overlooked gem that Pitchfork critics consider criminally underrated
4. A deep cut that BBC Radio 1's specialist DJs champion as genre-defining
5. An innovative track that music historians universally acknowledge as pushing the genre's boundaries

Rules:
- Return ONLY the raw list of 5 songs
- Format each line as: Artist - Song Title
- No descriptions or commentary
- No numbering or bullet points
- Each track must authentically represent ${genreContext}

Example format:
Radiohead - Paranoid Android
The Smiths - How Soon Is Now?
Aphex Twin - Windowlicker
Joy Division - Atmosphere
Boards of Canada - Roygbiv`;
    console.log("\n=== Initial Prompt ===");
    console.log(initialPrompt);

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "user",
            content: initialPrompt,
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error("Perplexity API Error:", response.status);
      throw new Error(`Perplexity API failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("\n=== Initial Response ===");
    console.log("Raw response:", data.choices[0].message.content);

    // Log validation process
    console.log("\n=== Starting Validation ===");
    const validationPrompt = `I'll show you the initial prompt that was sent to Perplexity AI, followed by their response. Please validate and refine the song selection based on the original criteria.

Initial Prompt:
You are part of an elite panel of music experts from Apple Music, Rolling Stone, Pitchfork, and BBC Radio 1 tasked with creating the definitive ${genreContext} playlist.

GENRE DEFINITION:
${description}

As leading authorities who shape global music discourse, select exactly 5 tracks that capture this genre's essence and evolution.

Your panel must choose:
1. The genre's most iconic masterpiece - a track so significant it's featured in Apple Music's essential playlists
2. A second groundbreaking classic consistently praised in Rolling Stone's retrospective reviews
3. A brilliant but overlooked gem that Pitchfork critics consider criminally underrated
4. A deep cut that BBC Radio 1's specialist DJs champion as genre-defining
5. An innovative track that music historians universally acknowledge as pushing the genre's boundaries

Perplexity AI provided these songs:
${data.choices[0].message.content}

Please review these selections and provide a refined list that:
1. Keeps ONLY artist name and song title
2. Removes any descriptions or commentary
3. Ensures each song truly represents ${genreContext}
4. Provides exactly 5 songs
5. Uses exact format: Artist - Song Title

Return only the final 5 songs, one per line, no additional text.`;

    console.log("\n=== Validation Prompt ===");
    console.log(validationPrompt);

    const validationResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "user",
              content: validationPrompt,
            },
          ],
          temperature: 0.5,
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!validationResponse.ok) {
      console.error("OpenAI API Error:", validationResponse.status);
      throw new Error(`OpenAI API failed: ${validationResponse.status}`);
    }

    const validationData = await validationResponse.json();
    console.log(
      "Validation response:",
      validationData.choices[0].message.content
    );

    if (!validationData?.choices?.[0]?.message?.content) {
      throw new Error("Invalid validation response format");
    }

    const validatedSongsList = validationData.choices[0].message.content
      .split("\n")
      .filter((line: string) => line.includes(" - "))
      .map((line: string) => {
        const [artist, song] = line
          .trim()
          .replace(/^- /, "")
          .split(" - ")
          .map((s) => s.trim())
          .map((s) =>
            s
              .replace(/^\d+\.\s*/, "")
              .replace(/\[[^\]]*\]/g, "")
              .replace(/["']/g, "")
              .replace(/\*\*/g, "")
              .split(":")[0] // Remove any text after colon
              .trim()
          );

        return { artist, song };
      })
      .slice(0, 5);

    console.log("\n=== Validated Songs List ===");
    console.log("Songs after validation:", validatedSongsList);

    // Log YouTube search process
    console.log("\n=== Starting YouTube Search ===");
    const videoIds = await searchYouTubeVideos(validatedSongsList);
    console.log("YouTube search results:", videoIds);

    // Combine songs with video IDs
    const songsWithVideos = validatedSongsList
      .map(({ artist, song }: { artist: string; song: string }) => {
        const cacheKey = `${artist}-${song}`.toLowerCase();
        return {
          artist,
          song,
          videoId: videoIds[cacheKey] || null,
        };
      })
      .filter((song: { videoId: string | null }) => song.videoId !== null);

    // Log database operations
    console.log("\n=== Database Operations ===");
    const slug = slugify(genre);

    const { data: existingGenreData, error: genreError } = await supabase
      .from("genres")
      .select("id, name, description")
      .eq("slug", slug)
      .single();

    if (genreError || !existingGenreData) {
      console.log("Creating new genre entry...");
      // Format the genre name properly (first letter of each word capitalized)
      const formattedGenreName = genre
        .split("-")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");

      console.log("Genre not found, creating new genre entry:", {
        originalGenre: genre,
        formattedName: formattedGenreName,
        slug: slug,
      });

      // Create the genre if it doesn't exist
      const { data: newGenre, error: createError } = await supabase
        .from("genres")
        .insert([
          {
            name: formattedGenreName,
            slug: slug,
            updated_at: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      if (createError) {
        console.error("Failed to create genre:", {
          error: createError,
          genreName: formattedGenreName,
          slug: slug,
        });
        return { songs: songsWithVideos };
      }

      console.log("Successfully created new genre:", {
        id: newGenre.id,
        name: formattedGenreName,
        slug: slug,
      });

      genreId = newGenre.id;
    } else {
      console.log("Found existing genre:", existingGenreData);
      genreId = existingGenreData.id;
    }

    if (!genreId) {
      throw new Error("Failed to obtain genre ID after creation/lookup");
    }

    // Log song saving
    console.log("\n=== Saving Songs ===");
    try {
      // Get existing songs for this genre to check for duplicates
      const { data: existingSongs } = await supabase
        .from("genre_songs")
        .select('video_id')
        .eq('genre_id', genreId);

      const existingVideoIds = new Set(existingSongs?.map(song => song.video_id) || []);

      // Filter out songs that already exist
      const songsToSave = songsWithVideos
        .filter((song: { artist: string; song: string; videoId: string }) => 
          !existingVideoIds.has(song.videoId)
        )
        .map((song: { artist: string; song: string; videoId: string }) => ({
          genre_id: genreId,
          artist: song.artist,
          song: song.song,
          video_id: song.videoId,
        }));

      console.log("Saving new songs to database:", songsToSave);

      if (songsToSave.length > 0) {
        const { error: upsertError } = await supabase
          .from("genre_songs")
          .upsert(songsToSave);

        if (upsertError) {
          // Don't throw the error, just log it and continue
          console.error("Failed to save songs:", upsertError);
        } else {
          console.log("Successfully saved new songs to database");
        }
      } else {
        console.log("No new songs to save - all songs already exist");
      }

      return { songs: songsWithVideos }; // Return songs even if save fails
    } catch (saveError) {
      console.error("Failed to save songs:", saveError);
      return { songs: songsWithVideos }; // Return songs even if there's an error
    }
  } catch (error) {
    console.error("=== Error in Song Generation ===");
    console.error("Error details:", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
} 