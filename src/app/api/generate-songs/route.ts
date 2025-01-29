import { NextResponse } from "next/server";
import { mainGenres } from "../../../../data/genres/genresList";
import { generateSongs } from "@/lib/generateSongs";

function findParentGenreInfo(targetGenre: string) {
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
    // Validate request content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const { genre } = await request.json();
    
    if (!genre || typeof genre !== 'string' || genre.length > 100) {
      return NextResponse.json(
        { error: "Invalid genre format or length" },
        { status: 400 }
      );
    }

    // Sanitize genre input
    const sanitizedGenre = genre.replace(/[^a-zA-Z0-9-\s]/g, '').trim();
    
    // Get parent genre info and generate songs
    const parentInfo = findParentGenreInfo(sanitizedGenre);
    const { songs } = await generateSongs(sanitizedGenre, parentInfo);

    // Return songs array, ensuring it's not empty
    if (!songs?.length) {
      return NextResponse.json(
        { error: "No songs could be generated" },
        { status: 404 }
      );
    }

    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Error in generate-songs route:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
