/**
 * Gemini GenAI SDK Client
 * Centralized wrapper for Google's Generative AI SDK
 */
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// Initialize the GenAI client
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({ apiKey });
}

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    _client = getClient();
  }
  return _client;
}

/**
 * Check if Gemini API key is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Generate content using Gemini
 */
export async function geminiGenerateContent(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    responseFormat?: "json" | "text";
  }
): Promise<string> {
  const client = getGeminiClient();
  const model = options?.model || "gemini-2.0-flash";

  const config: any = {};
  if (options?.temperature !== undefined) {
    config.temperature = options.temperature;
  }
  if (options?.responseFormat === "json") {
    config.responseMimeType = "application/json";
  }

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  return response.text || "";
}

/**
 * Transcribe audio using Gemini multimodal
 * Sends audio file as inline data to Gemini for transcription
 */
export async function geminiTranscribeAudio(
  audioPath: string
): Promise<string> {
  const client = getGeminiClient();

  // Read audio file and convert to base64
  const audioBuffer = fs.readFileSync(audioPath);
  const base64Audio = audioBuffer.toString("base64");

  // Determine MIME type from extension
  const ext = path.extname(audioPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
    ".flac": "audio/flac",
  };
  const mimeType = mimeMap[ext] || "audio/mpeg";

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
          {
            text: `Transcribe this audio file with timestamps. Return ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "text": "full transcript text here",
  "segments": [
    {"start": 0.0, "end": 3.5, "text": "segment text here"},
    {"start": 3.5, "end": 7.2, "text": "next segment text here"}
  ]
}

Rules:
- Each segment should be 3-10 seconds long
- Start and end times are in seconds (decimals allowed)
- Segments must be sequential and non-overlapping
- Include ALL spoken content
- Return ONLY valid JSON, no other text`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  return response.text || "{}";
}

/**
 * Analyze transcript segments for virality scoring using Gemini
 */
export async function geminiAnalyzeClip(
  chunkText: string,
  chunkDuration: number
): Promise<{ score: number; summary: string }> {
  const client = getGeminiClient();

  const systemPrompt = `You are an expert at analyzing video content for social media virality.
Rate the virality potential of video segments on a scale of 0-100 based on:
- Emotional impact and hook potential
- Information value and uniqueness
- Shareability and relatability
- Entertainment value
- Call-to-action or cliffhanger elements

Return ONLY a JSON object: { "score": number (0-100), "summary": "one sentence describing the key moment" }`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `${systemPrompt}\n\nDuration: ${chunkDuration.toFixed(1)}s\n\nTranscript:\n${chunkText}`,
    config: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const result = JSON.parse(response.text || '{"score": 50, "summary": "Content segment"}');
  return {
    score: Math.min(100, Math.max(0, result.score || 50)),
    summary: result.summary || "Content segment",
  };
}

/**
 * Process a voice command using Gemini
 * Extracts intent from voice transcription for video editing commands
 */
export async function geminiProcessVoiceCommand(
  transcribedText: string
): Promise<{
  action: string;
  params: Record<string, any>;
  confidence: number;
}> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a voice command parser for a video clip extraction tool called VoxClip AI.
Parse the following voice command and extract the user's intent.

Possible actions:
- "clip" — Extract a specific clip (params: start, end, or "last_seconds")
- "find_best" — Find the best/most viral moment (params: count)
- "transcribe" — Transcribe the video (no params)
- "analyze" — Analyze the video for insights (no params)
- "unknown" — Could not determine intent

Voice command: "${transcribedText}"

Return ONLY JSON: { "action": "string", "params": {}, "confidence": 0.0-1.0 }`,
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const result = JSON.parse(
    response.text || '{"action": "unknown", "params": {}, "confidence": 0}'
  );
  return result;
}
