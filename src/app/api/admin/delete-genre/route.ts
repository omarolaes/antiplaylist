import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: Request) {
  try {
    const { genreId } = await request.json();
    
    if (!genreId) {
      return NextResponse.json(
        { error: 'Genre ID is required' },
        { status: 400 }
      );
    }

    // First delete all songs associated with the genre
    const { error: songsError } = await supabase
      .from('genre_songs')
      .delete()
      .eq('genre_id', genreId);

    if (songsError) throw songsError;

    // Then delete the genre itself
    const { error: genreError } = await supabase
      .from('genres')
      .delete()
      .eq('id', genreId);

    if (genreError) throw genreError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting genre:', error);
    return NextResponse.json(
      { error: 'Failed to delete genre' },
      { status: 500 }
    );
  }
} 