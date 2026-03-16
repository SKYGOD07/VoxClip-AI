/**
 * Google Cloud Storage Utility
 * Handles video and clip file uploads/downloads to GCS
 */
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";

let _storage: Storage | null = null;

/**
 * Get or create a GCS Storage client
 */
function getStorage(): Storage {
  if (!_storage) {
    _storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
  }
  return _storage;
}

/**
 * Check if GCS is configured
 */
export function isGCSConfigured(): boolean {
  return !!(process.env.GCS_BUCKET_NAME && process.env.GOOGLE_CLOUD_PROJECT);
}

/**
 * Get the configured bucket name
 */
function getBucketName(): string {
  const bucket = process.env.GCS_BUCKET_NAME;
  if (!bucket) {
    throw new Error("GCS_BUCKET_NAME environment variable is required");
  }
  return bucket;
}

/**
 * Upload a local file to Google Cloud Storage
 * @param localPath - Path to the local file
 * @param destination - GCS destination path (e.g., "videos/video-123.mp4")
 * @returns The GCS URI (gs://bucket/path) and public URL
 */
export async function uploadToGCS(
  localPath: string,
  destination: string
): Promise<{ gcsUri: string; publicUrl: string }> {
  const storage = getStorage();
  const bucketName = getBucketName();
  const bucket = storage.bucket(bucketName);

  console.log(`Uploading ${localPath} to gs://${bucketName}/${destination}`);

  await bucket.upload(localPath, {
    destination,
    metadata: {
      contentType: getMimeType(localPath),
    },
  });

  const gcsUri = `gs://${bucketName}/${destination}`;
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

  console.log(`✓ Uploaded to ${gcsUri}`);

  return { gcsUri, publicUrl };
}

/**
 * Generate a signed URL for temporary access to a GCS file
 * @param filePath - GCS file path (e.g., "videos/video-123.mp4")
 * @param expiresInMinutes - URL expiration time in minutes (default: 60)
 */
export async function getSignedUrl(
  filePath: string,
  expiresInMinutes = 60
): Promise<string> {
  const storage = getStorage();
  const bucketName = getBucketName();

  const [url] = await storage
    .bucket(bucketName)
    .file(filePath)
    .getSignedUrl({
      action: "read",
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

  return url;
}

/**
 * Delete a file from Google Cloud Storage
 * @param filePath - GCS file path (e.g., "videos/video-123.mp4")
 */
export async function deleteFromGCS(filePath: string): Promise<void> {
  const storage = getStorage();
  const bucketName = getBucketName();

  try {
    await storage.bucket(bucketName).file(filePath).delete();
    console.log(`✓ Deleted gs://${bucketName}/${filePath}`);
  } catch (error: any) {
    console.warn(`Failed to delete gs://${bucketName}/${filePath}:`, error.message);
  }
}

/**
 * Upload a video file to GCS
 * @param localPath - Local path to the video file
 * @param videoId - Video ID for naming
 * @param originalName - Original filename
 */
export async function uploadVideoToGCS(
  localPath: string,
  videoId: number,
  originalName: string
): Promise<{ gcsUri: string; publicUrl: string }> {
  const ext = path.extname(originalName) || ".mp4";
  const destination = `videos/video-${videoId}${ext}`;
  return uploadToGCS(localPath, destination);
}

/**
 * Upload a clip file to GCS
 * @param localPath - Local path to the clip file
 * @param videoId - Parent video ID
 * @param clipIndex - Clip index number
 */
export async function uploadClipToGCS(
  localPath: string,
  videoId: number,
  clipIndex: number
): Promise<{ gcsUri: string; publicUrl: string }> {
  const destination = `clips/clip-${videoId}-${clipIndex}.mp4`;
  return uploadToGCS(localPath, destination);
}

/**
 * Check if a file exists in GCS
 */
export async function existsInGCS(filePath: string): Promise<boolean> {
  const storage = getStorage();
  const bucketName = getBucketName();

  try {
    const [exists] = await storage.bucket(bucketName).file(filePath).exists();
    return exists;
  } catch {
    return false;
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".json": "application/json",
  };
  return mimeTypes[ext] || "application/octet-stream";
}
