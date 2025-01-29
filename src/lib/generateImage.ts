import Replicate from "replicate";
import { supabase } from "./supabase";
import { slugify } from "./utils/slugify";

export async function generateImage(genre: string, description: string) {
  try {
    console.log("=== Starting Image Generation Process ===");
    console.log("Input:", { genre, description });

    // Create a slug-based filename
    const slug = slugify(genre);
    const filename = `${slug}.png`;

    // Initialize Replicate
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Create a prompt for the image generation
    const prompt = `Create a modern album cover art for ${genre} music that captures this description: ${description}. Style: Professional album artwork, high contrast, bold elements.`;

    console.log("Generated prompt:", prompt);

    // Generate image using Replicate (using Flux model)
    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt,
        megapixels: "1",
        aspect_ratio: "1:1",
        num_inference_steps: 4,
        output_format: "jpg",
        output_quality: 90,
        negative_prompt: "text, letters, words, logos, watermarks, low quality, blurry, amateur",
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

    console.log("Image generated:", imageUrl);

    // Log the prediction URL from Replicate
    console.log("Replicate prediction URL:", imageUrl);

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