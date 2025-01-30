import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSongs } from '@/lib/generateSongs';

interface Song {
  artist: string;
  song: string;
  videoId: string;
}

export async function POST(request: Request) {
  try {
    const { genreId, genreName, existingSongs } = await request.json();
    
    if (!genreId || !genreName) {
      return NextResponse.json(
        { error: 'Genre ID and name are required' },
        { status: 400 }
      );
    }

    // Generate new songs
    const { songs: newSongs } = await generateSongs(genreName);
    
    if (!newSongs?.length) {
      return NextResponse.json(
        { error: 'No new songs could be generated' },
        { status: 404 }
      );
    }

    // Create a set of existing song identifiers for quick lookup
    const existingSongSet = new Set(
      existingSongs.map((song: Song) => 
        `${song.artist.toLowerCase()}-${song.song.toLowerCase()}`
      )
    );

    // Filter out duplicates
    const uniqueNewSongs = newSongs.filter((song: Song) => {
      const songKey = `${song.artist.toLowerCase()}-${song.song.toLowerCase()}`;
      return !existingSongSet.has(songKey);
    });

    if (uniqueNewSongs.length === 0) {
      return NextResponse.json({
        message: 'No new unique songs to add',
        addedSongs: []
      });
    }

    // Prepare songs for database insertion
    const songsToInsert = uniqueNewSongs.map((song: Song) => ({
      genre_id: genreId,
      artist: song.artist,
      song: song.song,
      video_id: song.videoId
    }));

    // Insert new songs
    const { data: insertedSongs, error: insertError } = await supabase
      .from('genre_songs')
      .insert(songsToInsert)
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({
      message: `Successfully added ${uniqueNewSongs.length} new songs`,
      addedSongs: insertedSongs
    });

  } catch (error) {
    console.error('Error adding songs:', error);
    return NextResponse.json(
      { error: 'Failed to add songs' },
      { status: 500 }
    );
  }
} 