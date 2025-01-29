import Replicate from "replicate";
import { supabase } from "./supabase";
import { slugify } from "./utils/slugify";
import { OpenAI } from "openai";

interface Song {
  artist: string;
  // Add other properties if needed
}

export async function generateImage(genre: string, description: string, songs?: Song[]) {
  try {
    console.log("=== Starting Image Generation Process ===");
    console.log("Input:", { genre, description, songs });

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Simplified prompt focusing on abstract representation
    const userPrompt = `Create a minimal, abstract representation of the music genre: "${genre}". Use shades of gray and light rose color. The image should contain one element, object or symbol that represents the genre without any text or words. As context the genre is described as: ${description}.`;

    console.log("Generated GPT-4 prompt:", userPrompt);

    const coverPromptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert in creating resainance painting about diffenrt genres. Generate prompts that focus on minimalism inspired by James Turrell and use a specific color palette. Return only the image generation prompt, no explanations.`
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
    });

    console.log("Cover prompt response:", coverPromptResponse);

    const coverPrompt = coverPromptResponse.choices[0].message.content;
    if (!coverPrompt) {
      throw new Error("No cover prompt generated");
    }

    console.log("Generated GPT-4 prompt:", coverPrompt);

    // Create a slug-based filename
    const slug = slugify(genre);
    const filename = `${slug}.png`;

    // Initialize Replicate
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Generate image using Replicate with the enhanced prompt
    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: coverPrompt,
        megapixels: "1",
        aspect_ratio: "1:1",
        num_inference_steps: 4,
        output_format: "jpg",
        output_quality: 90,
        negative_prompt: "text, letters, words, logos, watermarks, low quality, blurry, amateur, multiple album covers, collage, website layout, ui elements, distorted proportions, incomplete design, no text or logos",
      },
    });

    if (!output || !Array.isArray(output) || output.length === 0) {
      throw new Error("Invalid response from Replicate");
    }

    let imageUrl = output[0];
    if (imageUrl instanceof ReadableStream) {
      const response = new Response(imageUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      imageUrl = `data:image/webp;base64,${base64}`;
    }

    // Get the image data
    const imageResponse = await fetch(imageUrl);
    const imageData = await imageResponse.blob();

    // Log the image size and type for debugging
    console.log("Image data:", {
      size: imageData.size,
      type: imageData.type
    });

    // Before uploading, delete any existing file with the same name
    const { data: existingFiles, error: listError } = await supabase.storage
      .from('genre-covers')
      .list();

    if (!listError && existingFiles) {
      const existingFile = existingFiles.find(file => file.name === filename);
      if (existingFile) {
        await supabase.storage
          .from('genre-covers')
          .remove([filename]);
      }
    }

    // Upload to Supabase storage with the slug-based filename
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('genre-covers')
      .upload(filename, imageData, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true // Enable upsert to replace existing files
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get the public URL and ensure it exists
    const { data: { publicUrl } } = supabase.storage
      .from('genre-covers')
      .getPublicUrl(uploadData.path);

    if (!publicUrl) {
      throw new Error("Failed to get public URL for uploaded image");
    }

    console.log("Generated image URL:", publicUrl);

    return publicUrl;
  } catch (error) {
    console.error("Error in generateImage:", error);
    throw error;
  }
} 