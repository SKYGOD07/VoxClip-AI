/**
 * Transcript Analysis & Virality Scoring Service
 * Primary: Google Gemini GenAI SDK
 * Fallback: OpenAI → Heuristic
 */
import { isGeminiConfigured, geminiAnalyzeClip } from "./gemini";

// Optional OpenAI client (lazy-initialized fallback)
let openai: any = null;
let openaiInitialized = false;

async function getOpenAIClient(): Promise<any> {
  if (openaiInitialized) return openai;
  openaiInitialized = true;
  try {
    const OpenAI = (await import("openai")).default;
    if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
    }
  } catch {
    // OpenAI not available
  }
  return openai;
}

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface AnalyzedClip {
  start: number;
  end: number;
  score: number;
  summary: string;
}

interface ClipChunk {
  start: number;
  end: number;
  text: string;
  duration: number;
}

// Configuration
const CONFIG = {
  MIN_CLIP_DURATION: 5,
  MAX_CLIP_DURATION: 300,
  TARGET_CLIP_DURATION: 30,
  MAX_CLIPS: 10,
  MIN_SCORE_THRESHOLD: 60,
};

/**
 * Intelligently chunk transcript into variable-length clips (5s - 5min)
 */
function createSmartChunks(segments: TranscriptSegment[]): ClipChunk[] {
  if (!segments || segments.length === 0) return [];

  const chunks: ClipChunk[] = [];
  let currentChunk: ClipChunk | null = null;

  for (const seg of segments) {
    const segDuration = seg.end - seg.start;
    if (segDuration < 0.5) continue;

    if (!currentChunk) {
      currentChunk = {
        start: seg.start,
        end: seg.end,
        text: seg.text,
        duration: segDuration,
      };
    } else {
      const potentialDuration = seg.end - currentChunk.start;
      const isNaturalBreak = seg.text.match(/[.!?]$/);

      if (potentialDuration < CONFIG.MIN_CLIP_DURATION) {
        currentChunk.end = seg.end;
        currentChunk.text += " " + seg.text;
        currentChunk.duration = currentChunk.end - currentChunk.start;
      } else if (potentialDuration > CONFIG.MAX_CLIP_DURATION) {
        chunks.push(currentChunk);
        currentChunk = {
          start: seg.start,
          end: seg.end,
          text: seg.text,
          duration: segDuration,
        };
      } else if (
        potentialDuration >= CONFIG.TARGET_CLIP_DURATION &&
        isNaturalBreak
      ) {
        currentChunk.end = seg.end;
        currentChunk.text += " " + seg.text;
        currentChunk.duration = currentChunk.end - currentChunk.start;
        chunks.push(currentChunk);
        currentChunk = null;
      } else {
        currentChunk.end = seg.end;
        currentChunk.text += " " + seg.text;
        currentChunk.duration = currentChunk.end - currentChunk.start;
      }
    }
  }

  if (currentChunk && currentChunk.duration >= CONFIG.MIN_CLIP_DURATION) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Fallback scoring without API (heuristic-based)
 */
function scoreFallback(text: string): number {
  let score = 50;

  const positivePatterns = [
    /\b(amazing|incredible|wow|insane|genius|brilliant|perfect)\b/gi,
    /[!?]{2,}/g,
    /\b(you won't believe|here's why|this is|the secret)\b/gi,
    /\b(tip|trick|hack|method|way to|how to)\b/gi,
    /\b(million|billion|thousand)\b/gi,
  ];

  positivePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) score += matches.length * 5;
  });

  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 15 && wordCount <= 50) {
    score += 10;
  }

  if (text.includes("?")) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Generate summary without API
 */
function generateFallbackSummary(text: string): string {
  const firstSentence = text.match(/^[^.!?]+[.!?]/);
  if (firstSentence) {
    return firstSentence[0].trim();
  }
  return text.substring(0, 100) + (text.length > 100 ? "..." : "");
}

/**
 * Score chunks using Gemini GenAI SDK (PRIMARY)
 */
async function scoreWithGemini(chunks: ClipChunk[]): Promise<AnalyzedClip[]> {
  const scoredClips: AnalyzedClip[] = [];

  for (const chunk of chunks) {
    try {
      const result = await geminiAnalyzeClip(chunk.text, chunk.duration);
      scoredClips.push({
        start: chunk.start,
        end: chunk.end,
        score: result.score,
        summary: result.summary,
      });
    } catch (error) {
      console.error("Gemini scoring failed for chunk, using fallback:", error);
      scoredClips.push({
        start: chunk.start,
        end: chunk.end,
        score: scoreFallback(chunk.text),
        summary: generateFallbackSummary(chunk.text),
      });
    }
  }

  return scoredClips;
}

/**
 * Score chunks using OpenAI API (FALLBACK)
 */
async function scoreWithOpenAI(chunks: ClipChunk[]): Promise<AnalyzedClip[]> {
  const client = await getOpenAIClient();
  if (!client) throw new Error("OpenAI client not initialized");

  const scoredClips: AnalyzedClip[] = [];

  const systemPrompt = `You are an expert at analyzing video content for social media virality.
Rate the virality potential of video segments on a scale of 0-100 based on:
- Emotional impact and hook potential
- Information value and uniqueness
- Shareability and relatability
- Entertainment value
- Call-to-action or cliffhanger elements

Return JSON: { "score": number (0-100), "summary": "one sentence describing the key moment" }`;

  for (const chunk of chunks) {
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Duration: ${chunk.duration.toFixed(1)}s\n\nTranscript:\n${chunk.text}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(
        response.choices[0].message.content || "{}"
      );

      if (result.score !== undefined && result.summary) {
        scoredClips.push({
          start: chunk.start,
          end: chunk.end,
          score: Math.min(100, Math.max(0, result.score)),
          summary: result.summary,
        });
      }
    } catch (error) {
      console.error("OpenAI scoring failed for chunk, using fallback:", error);
      scoredClips.push({
        start: chunk.start,
        end: chunk.end,
        score: scoreFallback(chunk.text),
        summary: generateFallbackSummary(chunk.text),
      });
    }
  }

  return scoredClips;
}

/**
 * Score chunks without any API (pure heuristics)
 */
function scoreWithHeuristics(chunks: ClipChunk[]): AnalyzedClip[] {
  return chunks.map((chunk) => ({
    start: chunk.start,
    end: chunk.end,
    score: scoreFallback(chunk.text),
    summary: generateFallbackSummary(chunk.text),
  }));
}

/**
 * Main analysis function with cascading fallback:
 * 1. Gemini GenAI SDK (primary)
 * 2. OpenAI (fallback)
 * 3. Heuristic (last resort)
 */
export async function analyzeTranscript(
  segments: TranscriptSegment[]
): Promise<AnalyzedClip[]> {

  // 1. Create smart chunks (5s - 5min)
  const chunks = createSmartChunks(segments);

  console.log(`Created ${chunks.length} chunks from ${segments.length} segments`);

  if (chunks.length === 0) {
    console.warn("No valid chunks created from transcript");
    return [];
  }

  // 2. Score chunks with cascading fallback
  let scoredClips: AnalyzedClip[];

  if (isGeminiConfigured()) {
    console.log("Using Gemini GenAI SDK for scoring (primary)");
    try {
      scoredClips = await scoreWithGemini(chunks);
    } catch (error) {
      console.error("Gemini scoring completely failed:", error);
      const oaiClient = await getOpenAIClient();
      if (oaiClient) {
        console.log("Falling back to OpenAI for scoring");
        try {
          scoredClips = await scoreWithOpenAI(chunks);
        } catch {
          scoredClips = scoreWithHeuristics(chunks);
        }
      } else {
        scoredClips = scoreWithHeuristics(chunks);
      }
    }
  } else {
    const oaiClient = await getOpenAIClient();
    if (oaiClient) {
      console.log("Using OpenAI API for scoring (fallback)");
      try {
        scoredClips = await scoreWithOpenAI(chunks);
      } catch (error) {
        console.error("OpenAI scoring failed, using heuristics:", error);
        scoredClips = scoreWithHeuristics(chunks);
      }
    } else {
      console.log("No API keys found, using heuristic scoring");
      scoredClips = scoreWithHeuristics(chunks);
    }
  }

  // 3. Filter by minimum score and sort
  const filteredClips = scoredClips
    .filter((clip) => clip.score >= CONFIG.MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  // 4. Take top N clips
  const topClips = filteredClips.slice(0, CONFIG.MAX_CLIPS);

  console.log(
    `Selected ${topClips.length} clips with scores: ${topClips.map((c) => c.score).join(", ")}`
  );

  return topClips;
}

/**
 * Validate clip duration constraints
 */
export function validateClipDuration(start: number, end: number): boolean {
  const duration = end - start;
  return (
    duration >= CONFIG.MIN_CLIP_DURATION &&
    duration <= CONFIG.MAX_CLIP_DURATION
  );
}

/**
 * Adjust clip boundaries to meet duration constraints
 */
export function adjustClipBoundaries(
  start: number,
  end: number,
  videoDuration: number
): { start: number; end: number } {
  let duration = end - start;

  if (duration < CONFIG.MIN_CLIP_DURATION) {
    const extension = (CONFIG.MIN_CLIP_DURATION - duration) / 2;
    start = Math.max(0, start - extension);
    end = Math.min(videoDuration, end + extension);
    duration = end - start;
  }

  if (duration < CONFIG.MIN_CLIP_DURATION) {
    if (start === 0) {
      end = Math.min(videoDuration, CONFIG.MIN_CLIP_DURATION);
    } else {
      start = Math.max(0, end - CONFIG.MIN_CLIP_DURATION);
    }
  }

  if (duration > CONFIG.MAX_CLIP_DURATION) {
    end = start + CONFIG.MAX_CLIP_DURATION;
  }

  return { start, end };
}