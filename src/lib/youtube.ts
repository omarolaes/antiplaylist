import { google } from 'googleapis';
import { supabase } from './supabase';

// Constants
const YOUTUBE_SEARCH_COST = 100;
const DAILY_QUOTA_LIMIT = 10000;

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Quota check function
async function checkAndUpdateQuota(quotaCost: number, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data: quotaData, error: quotaError } = await supabase
        .from('api_quota')
        .select('quota_used, reset_time')
        .eq('service', 'youtube')
        .single();

      if (quotaError) {
        throw new Error(`Failed to check quota: ${quotaError.message}`);
      }

      // If no record exists or we're past reset time, create/update record
      if (!quotaData || new Date() > new Date(quotaData.reset_time)) {
        const nextReset = new Date();
        nextReset.setUTCHours(24, 0, 0, 0);

        const { error: updateError } = await supabase
          .from('api_quota')
          .upsert([
            {
              service: 'youtube',
              quota_used: quotaCost,
              reset_time: nextReset.toISOString()
            }
          ]);

        if (updateError) {
          throw new Error(`Failed to update quota: ${updateError.message}`);
        }
        
        return true;
      }

      // Check if adding this cost would exceed daily limit
      if (quotaData.quota_used + quotaCost > DAILY_QUOTA_LIMIT) {
        throw new Error('Daily YouTube API quota limit reached');
      }

      // Update quota usage
      const { error: updateError } = await supabase
        .from('api_quota')
        .update({ 
          quota_used: quotaData.quota_used + quotaCost 
        })
        .eq('service', 'youtube');

      if (updateError) {
        throw new Error(`Failed to update quota: ${updateError.message}`);
      }

      return true;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
}

// Add retry logic for failed YouTube searches
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}

export async function searchYouTubeVideos(songs: { artist: string, song: string }[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  const requiredQuota = songs.length * YOUTUBE_SEARCH_COST;

  // Check if we have enough quota
  const hasQuota = await checkAndUpdateQuota(requiredQuota);
  if (!hasQuota) {
    throw new Error('Daily YouTube API quota limit reached');
  }

  for (const { artist, song } of songs) {
    const cacheKey = `${artist}-${song}`.toLowerCase();

    // Check if we already have this song in genre_songs
    const { data: existingSong } = await supabase
      .from('genre_songs')
      .select('video_id')
      .eq('artist', artist)
      .eq('song', song)
      .maybeSingle();

    if (existingSong?.video_id) {
      results[cacheKey] = existingSong.video_id;
      continue;
    }

    try {
      // Search YouTube
      const searchResponse = await retryOperation(async () => {
        return await youtube.search.list({
          part: ['id'],
          q: `${artist} ${song} official`,
          type: ['video'],
          maxResults: 1,
          videoEmbeddable: 'true',
          videoCategoryId: '10' // Music category
        });
      });

      if (searchResponse.data.items && searchResponse.data.items.length > 0 && searchResponse.data.items[0].id?.videoId) {
        const videoId = searchResponse.data.items[0].id.videoId;
        results[cacheKey] = videoId;
      }
    } catch (error) {
      console.error(`Failed to search YouTube for ${artist} - ${song}:`, error);
    }
  }

  return results;
} 