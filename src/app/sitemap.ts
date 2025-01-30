import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all genre slugs
  const { data: genres } = await supabase
    .from('genres')
    .select('slug')

  // Base URLs
  const baseUrls = [
    {
      url: 'https://antiplaylist.com',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://antiplaylist.com/about',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: 'https://antiplaylist.com/discover',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ]

  // Generate genre URLs
  const genreUrls = (genres || []).map((genre) => ({
    url: `https://antiplaylist.com/genre/${genre.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Combine base URLs with genre URLs
  return [...baseUrls, ...genreUrls]
} 