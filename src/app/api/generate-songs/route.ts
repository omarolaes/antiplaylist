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
