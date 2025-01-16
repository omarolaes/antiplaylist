import { NextResponse } from "next/server";
import { mainGenres } from "../../../../data/genres/genresList";
import { supabase } from "@/lib/supabase";
import { generateDescription } from "../generate-description/route";
import { searchYouTubeVideos } from "@/lib/youtube";

interface ParentGenreInfo {
  mainGenre?: string;
  subgenre?: string;
}

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

async function generateSongs(genre: string, parentInfo?: ParentGenreInfo) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    console.log("=== Starting Song Generation Process ===");
    console.log("Input:", { genre, parentInfo });

    // First, check if we already have songs for this genre
    const { data: existingSongs } = await supabase
      .from("genre_songs")
      .select("artist, song, video_id")
      .eq(
        "genre_id",
        (
          await supabase
            .from("genres")
            .select("id")
            .eq("slug", genre.toLowerCase())
            .single()
        ).data?.id
      );

    // If we have existing songs, return them immediately
    if (existingSongs && existingSongs.length > 0) {
      console.log("Found existing songs in database:", existingSongs);
      return existingSongs.map((song) => ({
        artist: song.artist,
        song: song.song,
        videoId: song.video_id,
      }));
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
        model: "llama-3.1-sonar-large-128k-online",
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
    const { data: genreData, error: genreError } = await supabase
      .from("genres")
      .select("id, name")
      .eq("slug", genre.toLowerCase())
      .single();

    let genreId;

    if (genreError || !genreData) {
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
        slug: genre.toLowerCase(),
      });

      // Create the genre if it doesn't exist
      const { data: newGenre, error: createError } = await supabase
        .from("genres")
        .insert([
          {
            name: formattedGenreName, // Use the properly formatted name
            slug: genre.toLowerCase(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      if (createError) {
        console.error("Failed to create genre:", {
          error: createError,
          genreName: formattedGenreName,
          slug: genre.toLowerCase(),
        });
        return songsWithVideos;
      }

      console.log("Successfully created new genre:", {
        id: newGenre.id,
        name: formattedGenreName,
        slug: genre.toLowerCase(),
      });

      genreId = newGenre.id;
    } else {
      console.log("Found existing genre:", genreData);
      genreId = genreData.id;
    }

    if (!genreId) {
      throw new Error("Failed to obtain genre ID after creation/lookup");
    }

    // Log song saving
    console.log("\n=== Saving Songs ===");
    if (songsWithVideos.length > 0) {
      try {
        const songsToSave = songsWithVideos.map(
          (song: { artist: string; song: string; videoId: string }) => ({
            genre_id: genreId,
            artist: song.artist,
            song: song.song,
            video_id: song.videoId,
          })
        );
        console.log("Saving songs to database:", songsToSave);

        const { error: upsertError } = await supabase
          .from("genre_songs")
          .upsert(songsToSave);

        if (upsertError) {
          console.error("Failed to save songs:", upsertError);
          throw upsertError;
        }

        console.log("Successfully saved songs to database");
      } catch (saveError) {
        console.error("Failed to save songs:", saveError);
        throw saveError;
      }
    } else {
      console.error("No songs with video IDs to save");
      throw new Error("No valid songs found with video IDs");
    }

    console.log("\n=== Song Generation Complete ===");
    return songsWithVideos;
  } catch (error) {
    console.error("=== Error in Song Generation ===");
    console.error("Error details:", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    // Check if request has content
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
    console.log("Received POST request for genre:", genre);

    if (!genre || typeof genre !== 'string' || genre.length > 100) {
      return NextResponse.json(
        { error: "Invalid genre format or length" },
        { status: 400 }
      );
    }

    const parentInfo = findParentGenreInfo(genre);
    const songs = await generateSongs(genre, parentInfo);

    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Error in generate-songs route:", error);
    return NextResponse.json(
      { error: "Failed to generate songs" },
      { status: 500 }
    );
  }
}
