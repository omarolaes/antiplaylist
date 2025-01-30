import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: genres, error } = await supabase
      .from('genres')
      .select(`
        id,
        name,
        slug,
        description,
        genre_songs (
          id,
          artist,
          song,
          video_id
        )
      `)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ genres: genres || [] });
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genres' },
      { status: 500 }
    );
  }
} 