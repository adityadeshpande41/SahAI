import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env");
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error("Delete failed:", error);
  }
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
