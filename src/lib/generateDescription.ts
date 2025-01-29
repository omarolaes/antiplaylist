import { ParentGenreInfo } from "./generateSongs";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateDescription(
  genre: string,
  parentInfo?: ParentGenreInfo
): Promise<string> {
  try {
    let prompt = `Write a creative, engaging, and informative description for the music genre "${genre}". `;
    
    if (parentInfo) {
      prompt += `This is a subgenre of ${parentInfo.subgenre}, which falls under the main genre ${parentInfo.mainGenre}. `;
    }
    
    prompt += "The description should be 2-3 sentences long, explaining the genre's characteristics, origins, or notable elements. Keep it concise but informative.";

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable music expert who provides concise, accurate descriptions of music genres."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 150,
    });

    const description = completion.choices[0]?.message?.content?.trim() || "Description unavailable";
    return description;

  } catch (error) {
    console.error("Error generating description:", error);
    throw error;
  }
} 