import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    if (!genre || typeof genre !== 'string') {
      return NextResponse.json(
        { error: "Genre must be a valid string" },
        { status: 400 }
      );
    }

    const genreSlug = genre.trim().toLowerCase();

    // Add logging for debugging
    console.log('Fetching genre:', genreSlug);

    const { data: genreData, error: genreError } = await supabase
      .from('genres')
      .select(`
        id,
        description,
        name,
        genre_songs (
          artist,
          song,
          video_id
        )
      `)
      .eq('slug', genreSlug)
      .single();

    if (genreError) {
      console.error('Error fetching genre:', genreError);
      return NextResponse.json(
        { error: 'Genre not found', details: genreError.message },
        { status: 404 }
      );
    }

    if (!genreData?.genre_songs?.length) {
      console.error('No songs found for genre:', genreSlug);
      return NextResponse.json(
        { error: 'No songs found for this genre' },
        { status: 404 }
      );
    }

    // Format response
    return NextResponse.json({
      description: genreData.description,
      songs: genreData.genre_songs.map((song) => ({
        artist: song.artist,
        song: song.song,
        videoId: song.video_id
      }))
    });

  } catch (error) {
    console.error('Error in get-songs:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
