import { google } from 'googleapis';
import { supabase } from './supabase';

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

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