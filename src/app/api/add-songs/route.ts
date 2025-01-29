import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { searchYouTubeVideos } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const { genre } = await request.json();
    if (!genre) {
      return NextResponse.json({ error: "Genre is required" }, { status: 400 });
    }

    // 1. Get existing genre data and songs
    const { data: genreData, error: genreError } = await supabase
      .from("genres")
      .select(
        `
        id,
        description,
        name,
        genre_songs (
          artist,
          song,
          video_id
        )
      `
      )
      .eq("slug", genre.toLowerCase())
      .single();

    if (genreError || !genreData) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    console.log("1. Found genre:", genreData.name);

    // 2. Create prompt with existing songs context
    const existingSongs = genreData.genre_songs
      .map((song) => `${song.artist} - ${song.song}`)
      .join("\n");

    const prompt = `You are part of an elite panel of music experts from Apple Music, Rolling Stone, Pitchfork, and BBC Radio 1 tasked with expanding the ${genreData.name} playlist.

GENRE DEFINITION:
${genreData.description}

EXISTING SONGS IN PLAYLIST:
${existingSongs}

As leading authorities who shape global music discourse, select exactly 5 NEW tracks that capture this genre's continued evolution. Your panel must choose:

1. The genre's most iconic masterpiece that Apple Music's essential playlists feature but isn't in our current selection
2. A groundbreaking classic consistently praised in Rolling Stone's retrospective reviews that adds historical depth
3. A brilliant but overlooked gem that Pitchfork critics consider criminally underrated and deserves wider recognition
4. A deep cut that BBC Radio 1's specialist DJs champion as genre-defining but remains undiscovered by mainstream audiences
5. An innovative modern track that music historians acknowledge as pushing the genre's boundaries while honoring its roots

Rules:
- Return ONLY the raw list of 5 songs
- Format each line as: Artist - Song Title
- No descriptions or commentary
- No numbering or bullet points
- Each track must authentically represent ${genreData.name}
- Must be DIFFERENT from existing songs listed above, this is very important, do not select any of the existing songs

Example format:
Radiohead - Paranoid Android
The Smiths - How Soon Is Now?
Aphex Twin - Windowlicker
Joy Division - Atmosphere
Boards of Canada - Roygbiv`;

    console.log("2. Calling Perplexity API...");
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Perplexity API');
    }
    console.log("3. AI Response:", data.choices[0].message.content);

    // Add validation step with GPT-4
    const validationPrompt = `You are part of an elite panel of music experts from Apple Music, Rolling Stone, Pitchfork, and BBC Radio 1 tasked with refining the song selection for the ${genreData.name} playlist.

GENRE DEFINITION:
${genreData.description}

EXISTING SONGS IN PLAYLIST:
${existingSongs}

Perplexity AI provided these songs:
${data.choices[0].message.content}

As leading authorities who shape global music discourse, your task is to validate and refine this selection to ensure it captures the genre's continued evolution. Your panel must ensure:

1. The genre's most iconic masterpiece that Apple Music's essential playlists feature but isn't in our current selection
2. A groundbreaking classic consistently praised in Rolling Stone's retrospective reviews that adds historical depth
3. A brilliant but overlooked gem that Pitchfork critics consider criminally underrated and deserves wider recognition
4. A deep cut that BBC Radio 1's specialist DJs champion as genre-defining but remains undiscovered by mainstream audiences
5. An innovative modern track that music historians acknowledge as pushing the genre's boundaries while honoring its roots

Rules:
- Return ONLY the raw list of 5 songs
- Format each line as: Artist - Song Title
- No descriptions or commentary
- No numbering or bullet points
- Each track must authentically represent ${genreData.name}
- Must be DIFFERENT from existing songs listed above, this is very important, do not select any of the existing songs

Example format:
Radiohead - Paranoid Android
The Smiths - How Soon Is Now?
Aphex Twin - Windowlicker
Joy Division - Atmosphere
Boards of Canada - Roygbiv`;

    console.log("4. Validating with GPT-4...");
    const validationResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: validationPrompt,
            },
          ],
          temperature: 0.4,
        }),
      }
    );

    const validationData = await validationResponse.json();
    if (!validationData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI API');
    }
    console.log(
      "5. GPT-4 Validation Response:",
      validationData.choices[0].message.content
    );

    // Process and validate songs using the GPT-4 validated response
    const newSongs = validationData.choices[0].message.content
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
              .split(":")[0]
              .trim()
          );

        return { artist, song };
      })
      .slice(0, 5);

    console.log("6. Processed validated songs:", newSongs);

    // 5. Get YouTube IDs
    const videoIds = await searchYouTubeVideos(newSongs);

    console.log("7. Found video IDs:", videoIds);

    // 6. Combine songs with video IDs and save to database
    const songsToSave = newSongs
      .map(({ artist, song }: { artist: string; song: string }) => {
        const cacheKey = `${artist}-${song}`.toLowerCase();
        return {
          genre_id: genreData.id,
          artist,
          song,
          video_id: videoIds[cacheKey] || null,
        };
      })
      .filter((song: { video_id: string | null }) => song.video_id !== null);

    console.log("8. Final songs to save:", songsToSave);

    if (songsToSave.length === 0) {
      return NextResponse.json(
        { error: "No valid songs found with video IDs" },
        { status: 400 }
      );
    }

    const { error: saveError } = await supabase
      .from("genre_songs")
      .insert(songsToSave);

    if (saveError) {
      throw new Error(`Failed to save songs: ${saveError.message}`);
    }

    return NextResponse.json({
      songs: songsToSave.map(
        (song: { artist: string; song: string; video_id: string }) => ({
          artist: song.artist,
          song: song.song,
          videoId: song.video_id,
        })
      ),
    });
  } catch (error) {
    console.error("Error in add-songs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}
