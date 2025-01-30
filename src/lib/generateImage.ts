import Replicate from "replicate";
import { supabase } from "./supabase";
import { slugify } from "./utils/slugify";
import { OpenAI } from "openai";

export async function generateImage(genre: string, description: string) {
  try {
    console.log("=== Starting Image Generation Process ===");
    console.log("Input:", { genre, description });

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const contextPrompt = `Give me a product photo similar to IKEA but you design a chair for the "${genre}" music genre. Focus on the time period, location, and atmosphere where this genre emerged. You get inspired by the industrial designers, artists and movements from that time and place related to the genre. For context, the genre is ${genre} and the description is ${description}.`;

    console.log("Context prompt:", contextPrompt);

    const coverPromptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a master of creating text-to-image prompts for product photos. The image generated should have the lighting, colors, style, and composition of a product photo similar to IKEA. Return just the text-to-image prompt and nothing else. Make sure the image should look realistic and not like a painting.`,
        },
        {
          role: "user",
          content: contextPrompt,
        },
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
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const filename = `${slug}-${timestamp}-${randomNum}.png`;

    // Initialize Replicate
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    console.log("Cover Prompt: ", coverPrompt);

    // Refined prompt with explicit Renaissance style instructions
    const refinedPrompt = `${coverPrompt}. Make sure it looks like a real photo.`;

    // Updated Replicate run with increased inference steps
    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: refinedPrompt,
        megapixels: "1",
        aspect_ratio: "1:1",
        num_inference_steps: 4,
        fast: false,
        output_format: "jpg",
        output_quality: 95,
        negative_prompt:
          "text, letters, words, logos, watermarks, low quality, blurry, amateur, multiple album covers, collage, website layout, ui elements, distorted proportions, incomplete design, no text or logos, vinyls, headphones, musical notes, instruments, microphone, speakers, amplifiers, turntables, vinyl records, cassette tapes, CDs, MP3 players, illustration",
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
      type: imageData.type,
    });

    // No need to delete old files anymore since we're using unique filenames
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("genre-covers")
      .upload(filename, imageData, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false, // Changed to false since we're using unique filenames
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("genre-covers")
      .getPublicUrl(uploadData.path);

    // Optional: Clean up old images after successful upload
    try {
      const { data: existingFiles } = await supabase.storage
        .from("genre-covers")
        .list();

      if (existingFiles) {
        const oldFiles = existingFiles
          .filter(file => file.name.startsWith(`${slug}-`) && file.name !== filename)
          .map(file => file.name);

        // Keep only the last 3 versions
        const filesToDelete = oldFiles.slice(0, -2);
        
        if (filesToDelete.length > 0) {
          await supabase.storage
            .from("genre-covers")
            .remove(filesToDelete);
        }
      }
    } catch (cleanupError) {
      console.error("Error cleaning up old files:", cleanupError);
      // Don't throw error here as the main operation succeeded
    }

    console.log("Generated image URL:", publicUrl);

    return publicUrl;
  } catch (error) {
    console.error("Error in generateImage:", error);
    throw error;
  }
} 