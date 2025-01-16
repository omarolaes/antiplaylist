import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('genres')
      .select('name')
      .order('name');
    
    if (error) throw error;
    
    const genres = data?.map(({ name }) => name) ?? [];
    return NextResponse.json({ genres });
    
  } catch (error) {
    console.error('Genre fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genres' },
      { status: 500 }
    );
  }
} 