import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('genres')
      .select('name, slug')
      .order('created_at') // Assuming you have this column, if not use 'name'
      .limit(100); // Limit to prevent excessive data transfer
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No genres available' },
        { status: 404 }
      );
    }

    // Get a random genre
    const randomGenre = data[Math.floor(Math.random() * data.length)];
    
    return NextResponse.json({ genre: randomGenre });
    
  } catch (error) {
    console.error('Random genre fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random genre' },
      { status: 500 }
    );
  }
} 