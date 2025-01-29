import { supabase } from "@/lib/supabase";
import { ParentGenreInfo } from "./generateSongs";

export async function generateDescription(genre: string, parentInfo?: ParentGenreInfo) {
  try {
    // Add input validation
    if (!genre || typeof genre !== 'string') {
      throw new Error('Invalid genre parameter');
    }

    // First check if genre exists and has a description
    const { data: existingGenre } = await supabase
      .from('genres')
      .select('id, description')
      .eq('slug', genre.toLowerCase())
      .single();

    // If we have an existing description, return it immediately
    if (existingGenre?.description) {
      console.log('Found existing description:', existingGenre.description);
      return existingGenre.description;
    }

    // Only check rate limiting if we need to generate a new description
    const { data: recentAttempts } = await supabase
      .from('genres')
      .select('updated_at')
      .eq('slug', genre.toLowerCase())
      .single();

    if (recentAttempts?.updated_at) {
      const lastUpdate = new Date(recentAttempts.updated_at);
      const timeSinceLastUpdate = Date.now() - lastUpdate.getTime();
      if (timeSinceLastUpdate < 1000 * 60 * 60) { // 1 hour
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    // If no existing description, continue with API call
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey?.startsWith("pplx-")) {
      throw new Error("Invalid Perplexity API key");
    }

    const genreContext = parentInfo
      ? `${genre} (a subgenre of ${parentInfo.mainGenre}${
          parentInfo.subgenre ? ` → ${parentInfo.subgenre}` : ""
        })`
      : genre;

    const prompt = `As a distinguished music historian, craft a definitive micro-description of ${genreContext} that will serve as the authoritative reference for music platforms and educational resources. Your description must withstand scrutiny from the most knowledgeable genre experts and musicologists.

CORE ELEMENTS TO INCLUDE:
1. Historical Context: Precise emergence period (verified dates) and specific geographical origin
2. Musical Characteristics: One defining sonic or structural element that's universally acknowledged
3. Cultural Impact: Connection to an undisputed pioneering artist or documented influential movement

STRICT FORMATTING REQUIREMENTS:
- Exactly ONE sentence
- Maximum 250 characters (absolutely crucial)
- Must end with a period
- No formatting symbols (asterisks, bullets, quotes)

YOUR TASK - Craft a single, historically precise sentence under 250 characters that captures the essence of ${genreContext}, ensuring every detail can withstand expert scrutiny:`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [{
          role: "user",
          content: prompt,
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API failed: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices[0].message.content.trim();

    // Log the description before saving
    console.log('Description from API:', description);

    // Format the genre name properly
    const formattedGenreName = genre
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    if (existingGenre) {
      // Update existing genre with description
      const { error: updateError } = await supabase
        .from('genres')
        .update({ 
          description: description,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGenre.id);

      if (updateError) {
        console.error('Error updating description:', updateError);
        throw new Error(`Failed to update description: ${updateError.message}`);
      }
    } else {
      // Create new genre
      const { error: createError } = await supabase
        .from('genres')
        .insert([
          { 
            name: formattedGenreName,
            slug: genre.toLowerCase(),
            description: description,
            updated_at: new Date().toISOString()
          }
        ]);

      if (createError) {
        // If the error is a duplicate key constraint, try updating instead
        if (createError.code === '23505') {
          const { error: retryError } = await supabase
            .from('genres')
            .update({ 
              description: description,
              updated_at: new Date().toISOString()
            })
            .eq('slug', genre.toLowerCase());

          if (retryError) {
            console.error('Error in retry update:', retryError);
            throw new Error(`Failed to update description: ${retryError.message}`);
          }
        } else {
          console.error('Error creating genre:', createError);
          throw new Error(`Failed to create genre: ${createError.message}`);
        }
      }
    }

    return description;
  } catch (error) {
    console.error("Error generating description:", error);
    // Add error classification
    if (error instanceof Error) {
      throw new Error(`Description generation failed: ${error.message}`);
    }
    throw new Error('Unknown error occurred during description generation');
  }
} 