import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('api_quota')
      .select('quota_used, reset_time')
      .eq('service', 'youtube')
      .single();

    console.log('Quota data:', data);

    if (error) {
      console.error('Error fetching YouTube quota:', error);
      return NextResponse.json({ quota: 0 }, { status: 500 });
    }

    // Check if we need to reset the quota (past reset time)
    if (!data?.reset_time || new Date() > new Date(data.reset_time)) {
      // Set new reset time to next midnight UTC
      const nextReset = new Date();
      nextReset.setUTCHours(24, 0, 0, 0);

      const { error: updateError } = await supabase
        .from('api_quota')
        .update({ 
          quota_used: 0,
          reset_time: nextReset.toISOString()
        })
        .eq('service', 'youtube');

      if (updateError) {
        console.error('Error resetting quota:', updateError);
        return NextResponse.json({ quota: 0 }, { status: 500 });
      }

      return NextResponse.json({ quota: 0 });
    }

    return NextResponse.json({ quota: data?.quota_used ?? 0 });
  } catch (error) {
    console.error('Error in YouTube quota route:', error);
    return NextResponse.json({ quota: 0 }, { status: 500 });
  }
}