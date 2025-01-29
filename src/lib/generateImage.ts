import Replicate from "replicate";
import { supabase } from "./supabase";
import { slugify } from "./utils/slugify";
import { OpenAI } from "openai";

export async function generateImage(genre: string, description: string, songs?: any[]) {
  try {
    console.log("=== Starting Image Generation Process ===");
    console.log("Input:", { genre, description, songs });

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create an enhanced prompt using GPT-4
    const artistsContext = songs && songs.length > 0 
      ? `. The cover should be inspired by the visual aesthetics and album art style of these artists: ${songs.map(s => s.artist).join(', ')}`
      : '';

    const userPrompt = `Create a prompt for generating a modern album cover for ${genre} music. The genre is described as: ${description}${artistsContext}`;

    console.log("Generated GPT-4 prompt:", userPrompt);

    const coverPromptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert album cover designer who creates prompts for AI image generation. Focus on creating visually striking, professional album covers that capture the essence of music genres and the artistic style of the referenced artists. Return only the prompt, no explanations or comments."
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
    });

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
        negative_prompt: "text, letters, words, logos, watermarks, low quality, blurry, amateur, multiple album covers, collage, website layout, ui elements, distorted proportions, incomplete design",
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

    // Get the public URL
    const publicUrl = supabase.storage
      .from('genre-covers')
      .getPublicUrl(uploadData.path).data.publicUrl;

    console.log("Generated image URLs:", {
      replicateUrl: imageUrl,
      supabaseUrl: publicUrl
    });

    return publicUrl;
  } catch (error) {
    console.error("Error in generateImage:", error);
    throw error;
  }
} 