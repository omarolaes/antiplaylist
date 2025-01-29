import { NextResponse } from "next/server";
import { generateImage } from "@/lib/generateImage";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const { genre, description } = await request.json();

    if (!genre || !description) {
      return NextResponse.json(
        { error: "Genre and description are required" },
        { status: 400 }
      );
    }

    const imageUrl = await generateImage(genre, description);

    // Update the genres table with the image URL
    const { error: updateError } = await supabase
      .from("genres")
      .update({ cover_image: imageUrl })
      .eq("slug", genre.toLowerCase());

    if (updateError) {
      console.error("Error updating genre with image URL:", updateError);
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