// // import type { Express } from "express";
// // import { createServer, type Server } from "http";
// // import multer from 'multer';
// // import path from 'path';
// // import fs from 'fs';
// // import { storage } from "./storage";
// // import { transcribeAudio } from "./lib/transcribe";
// // import { analyzeTranscript } from "./lib/analyze";
// // import { extractAudio, cutClip } from "./lib/ffmpeg";
// // import { videos } from "@shared/schema";

// // const upload = multer({ dest: 'uploads/' });

// // export async function registerRoutes(
// //   httpServer: Server,
// //   app: Express
// // ): Promise<Server> {

// //   // Ensure public/clips exists
// //   if (!fs.existsSync('client/public/clips')) {
// //     fs.mkdirSync('client/public/clips', { recursive: true });
// //   }

// //   app.get('/api/videos', async (req, res) => {
// //     const list = await storage.getVideos();
// //     res.json(list);
// //   });

// //   app.get('/api/videos/:id', async (req, res) => {
// //     const id = parseInt(req.params.id);
// //     const video = await storage.getVideo(id);
// //     if (!video) return res.status(404).json({ message: 'Not found' });
// //     const clips = await storage.getClips(id);
// //     res.json({ ...video, clips });
// //   });

// //   app.post('/api/videos/upload', upload.single('video'), async (req, res) => {
// //     if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

// //     const video = await storage.createVideo({
// //       originalName: req.file.originalname,
// //       originalUrl: req.file.path,
// //     });

// //     // Start processing in background (no await)
// //     processVideo(video.id, req.file.path).catch(err => {
// //       console.error(`Error processing video ${video.id}:`, err);
// //       storage.updateVideoStatus(video.id, "error");
// //     });

// //     res.status(201).json(video);
// //   });

// //   return httpServer;
// // }

// // async function processVideo(videoId: number, videoPath: string) {
// //   try {
// //     // 1. Extract Audio
// //     await storage.updateVideoStatus(videoId, "transcribing");
// //     const audioPath = path.join('uploads', `audio-${videoId}.mp3`);
// //     await extractAudio(videoPath, audioPath);

// //     // 2. Transcribe
// //     const transcript = await transcribeAudio(audioPath);
// //     await storage.updateVideoTranscript(videoId, transcript);
    
// //     // Clean up audio file
// //     fs.unlinkSync(audioPath);

// //     // 3. Analyze & Score
// //     await storage.updateVideoStatus(videoId, "analyzing");
// //     const bestClips = await analyzeTranscript(transcript);

// //     // 4. Cut Clips
// //     for (const [index, clipData] of bestClips.entries()) {
// //       const clipFilename = `clip-${videoId}-${index}.mp4`;
// //       const clipPath = path.join('client/public/clips', clipFilename);
      
// //       await cutClip(videoPath, clipData.start, clipData.end, clipPath);

// //       await storage.createClip({
// //         videoId,
// //         startTime: clipData.start,
// //         endTime: clipData.end,
// //         summary: clipData.summary,
// //         viralityScore: clipData.score,
// //         url: `/clips/${clipFilename}` // Served statically by Vite/Express
// //       });
// //     }

// //     await storage.updateVideoStatus(videoId, "complete");

// //   } catch (error) {
// //     console.error("Processing failed:", error);
// //     await storage.updateVideoStatus(videoId, "error");
// //   }
// // }

// import type { Express } from "express";
// import { type Server } from "http";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { storage } from "./storage";
// import { transcribeAudio } from "./lib/transcribe";
// import { analyzeTranscript } from "./lib/analyze";
// import { extractAudio, cutClip } from "./lib/ffmpeg";

// const upload = multer({ dest: "uploads/" });

// export async function registerRoutes(
//   httpServer: Server,
//   app: Express
// ): Promise<Server> {

//   // Ensure clips directory exists
//   const clipsDir = path.join("client", "public", "clips");
//   if (!fs.existsSync(clipsDir)) {
//     fs.mkdirSync(clipsDir, { recursive: true });
//   }

//   // List all videos
//   app.get("/api/videos", async (_req, res) => {
//     const list = await storage.getVideos();
//     res.json(list);
//   });

//   // Get single video with clips
//   app.get("/api/videos/:id", async (req, res) => {
//     const id = Number(req.params.id);
//     const video = await storage.getVideo(id);
//     if (!video) {
//       return res.status(404).json({ message: "Not found" });
//     }
//     const clips = await storage.getClips(id);
//     res.json({ ...video, clips });
//   });

//   // Upload + auto-process
//   app.post("/api/videos/upload", upload.single("video"), async (req, res) => {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const video = await storage.createVideo({
//       originalName: req.file.originalname,
//       originalUrl: req.file.path,
//     });

//     // Background processing (non-blocking)
//     processVideo(video.id, req.file.path).catch(async (err) => {
//       console.error(`Error processing video ${video.id}:`, err);
//       await storage.updateVideoStatus(video.id, "error");
//     });

//     res.status(201).json(video);
//   });

//   return httpServer;
// }

// /* ============================
//    VIDEO PROCESSOR
//    ============================ */

// async function processVideo(videoId: number, videoPath: string) {
//   try {
//     // 1. Extract audio
//     await storage.updateVideoStatus(videoId, "transcribing");
//     const audioPath = path.join("uploads", `audio-${videoId}.mp3`);
//     await extractAudio(videoPath, audioPath);

//     // 2. Transcribe (stub or real)
//     const transcript = await transcribeAudio(audioPath);
//     await storage.updateVideoTranscript(videoId, transcript);

//     fs.unlinkSync(audioPath);

//     // 3. Analyze transcript
//     await storage.updateVideoStatus(videoId, "analyzing");
//     const bestClips = await analyzeTranscript(transcript.segments);

//     // 4. Cut clips
//   for (let index = 0; index < bestClips.length; index++) {
//     const clip = bestClips[index];
//     const filename = `clip-${videoId}-${index}.mp4`;
//     const outputPath = path.join("client", "public", "clips", filename);

//     await cutClip(videoPath, clip.start, clip.end, outputPath);

//     await storage.createClip({
//     videoId,
//     startTime: clip.start,
//     endTime: clip.end,
//     summary: clip.summary,
//     viralityScore: clip.score,
//     url: `/clips/${filename}`,
//   });
// }

//     await storage.updateVideoStatus(videoId, "complete");

//   } catch (error) {
//     console.error("Processing failed:", error);
//     await storage.updateVideoStatus(videoId, "error");
//   }
// }
import express, { type Express } from "express";
import { type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { transcribeAudio, validateTranscript } from "./lib/transcribe";
import { analyzeTranscript, validateClipDuration, adjustClipBoundaries } from "./lib/analyze";
import { 
  extractAudio, 
  cutClip, 
  validateVideoFile, 
  getVideoDuration 
} from "./lib/ffmpeg";
import { isGCSConfigured, uploadVideoToGCS, uploadClipToGCS } from "./lib/gcs";
import { isGeminiConfigured, geminiProcessVoiceCommand } from "./lib/gemini";

// Configure multer with file size limits
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accept video formats
    const allowedMimes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-matroska',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Ensure required directories exist
  const dirs = [
    "uploads",
    path.join("client", "public", "clips"),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });

  // ===== ROUTES =====

  // List all videos
  app.get("/api/videos", async (_req, res) => {
    try {
      const list = await storage.getVideos();
      res.json(list);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Get single video with clips
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }

      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const clips = await storage.getClips(id);
      res.json({ ...video, clips });
    } catch (error: any) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  // Upload video
  app.post("/api/videos/upload", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log(`Received file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

      // Validate video file
      const isValid = await validateVideoFile(req.file.path);
      if (!isValid) {
        fs.unlinkSync(req.file.path); // Clean up invalid file
        return res.status(400).json({ message: "Invalid or corrupted video file" });
      }

      // Upload to GCS if configured
      let videoUrl = req.file.path;

      if (isGCSConfigured()) {
        try {
          const gcsResult = await uploadVideoToGCS(
            req.file.path,
            Date.now(),
            req.file.originalname
          );
          videoUrl = gcsResult.publicUrl;
          console.log(`Video uploaded to GCS: ${gcsResult.gcsUri}`);
        } catch (gcsError: any) {
          console.warn(`GCS upload failed, using local storage: ${gcsError.message}`);
        }
      }

      // Create video record
      const video = await storage.createVideo({
        originalName: req.file.originalname,
        originalUrl: videoUrl,
      });

      console.log(`Created video record #${video.id}`);

      // Start background processing (non-blocking)
      // Always process from local file path (it exists from multer)
      processVideo(video.id, req.file.path).catch(async (err) => {
        console.error(`Error processing video ${video.id}:`, err);
        await storage.updateVideoStatus(video.id, "error");
      });

      res.status(201).json(video);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  });

  // Restart video processing
  app.post("/api/videos/:id/reprocess", async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }

      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (!fs.existsSync(video.originalUrl)) {
        return res.status(400).json({ message: "Original video file not found" });
      }

      // Delete existing clips
      const existingClips = await storage.getClips(id);
      for (const clip of existingClips) {
        const clipPath = path.join("client", "public", clip.url);
        if (fs.existsSync(clipPath)) {
          fs.unlinkSync(clipPath);
        }
      }

      // Reset video status
      await storage.updateVideoStatus(id, "uploaded");

      // Restart processing
      processVideo(id, video.originalUrl).catch(async (err) => {
        console.error(`Error reprocessing video ${id}:`, err);
        await storage.updateVideoStatus(id, "error");
      });

      res.json({ message: "Reprocessing started" });
    } catch (error: any) {
      console.error("Reprocess error:", error);
      res.status(500).json({ message: "Failed to restart processing" });
    }
  });

  // Voice command processing
  app.post("/api/voice-command", express.json(), async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Text is required" });
      }

      if (!isGeminiConfigured()) {
        return res.status(503).json({
          message: "Gemini API key not configured. Set GEMINI_API_KEY env var.",
        });
      }

      console.log(`Processing voice command: "${text}"`);
      const result = await geminiProcessVoiceCommand(text);

      console.log(`Voice command result: ${JSON.stringify(result)}`);
      res.json(result);
    } catch (error: any) {
      console.error("Voice command error:", error);
      res.status(500).json({ message: "Failed to process voice command" });
    }
  });

  // Health check for Cloud Run
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      gemini: isGeminiConfigured(),
      gcs: isGCSConfigured(),
      timestamp: new Date().toISOString(),
    });
  });

  return httpServer;
}

/* ============================
   VIDEO PROCESSOR
   ============================ */

async function processVideo(videoId: number, videoPath: string) {
  console.log(`\n========== PROCESSING VIDEO #${videoId} ==========`);

  try {
    // Step 1: Get video duration
    const videoDuration = await getVideoDuration(videoPath);
    console.log(`Video duration: ${videoDuration.toFixed(2)}s`);

    // Step 2: Extract audio
    console.log("\n[1/4] Extracting audio...");
    await storage.updateVideoStatus(videoId, "transcribing");
    const audioPath = path.join("uploads", `audio-${videoId}.mp3`);
    await extractAudio(videoPath, audioPath);

    // Step 3: Transcribe
    console.log("\n[2/4] Transcribing audio...");
    const transcriptResult = await transcribeAudio(audioPath);
    
    // Validate transcript
    if (!validateTranscript(transcriptResult)) {
      throw new Error("Invalid transcript generated");
    }

    await storage.updateVideoTranscript(videoId, transcriptResult);
    console.log(`Transcript: ${transcriptResult.segments.length} segments`);

    // Clean up audio file
    try {
      fs.unlinkSync(audioPath);
    } catch (e) {
      console.warn("Failed to delete audio file:", e);
    }

    // Step 4: Analyze transcript
    console.log("\n[3/4] Analyzing transcript...");
    await storage.updateVideoStatus(videoId, "analyzing");
    const analyzedClips = await analyzeTranscript(transcriptResult.segments);

    if (analyzedClips.length === 0) {
      console.warn("No clips generated from analysis");
      await storage.updateVideoStatus(videoId, "complete");
      return;
    }

    console.log(`Selected ${analyzedClips.length} clips for extraction`);

    // Step 5: Cut clips
    console.log("\n[4/4] Cutting clips...");
    let successfulClips = 0;

    for (let index = 0; index < analyzedClips.length; index++) {
      const clip = analyzedClips[index];
      
      try {
        // Adjust boundaries if needed
        const adjusted = adjustClipBoundaries(
          clip.start, 
          clip.end, 
          videoDuration
        );

        // Validate duration
        if (!validateClipDuration(adjusted.start, adjusted.end)) {
          console.warn(`Skipping clip ${index}: invalid duration`);
          continue;
        }

        const filename = `clip-${videoId}-${index}.mp4`;
        const outputPath = path.join("client", "public", "clips", filename);

        console.log(`\nCutting clip ${index + 1}/${analyzedClips.length}`);
        await cutClip(videoPath, adjusted.start, adjusted.end, outputPath);

        // Upload clip to GCS if configured
        let clipUrl = `/clips/${filename}`;
        if (isGCSConfigured()) {
          try {
            const gcsResult = await uploadClipToGCS(outputPath, videoId, index);
            clipUrl = gcsResult.publicUrl;
            console.log(`Clip uploaded to GCS: ${gcsResult.gcsUri}`);
          } catch (gcsError: any) {
            console.warn(`GCS clip upload failed, using local: ${gcsError.message}`);
          }
        }

        // Save to database
        await storage.createClip({
          videoId,
          startTime: adjusted.start,
          endTime: adjusted.end,
          summary: clip.summary,
          viralityScore: clip.score,
          url: clipUrl,
        });

        successfulClips++;
        console.log(`✓ Clip ${index + 1} saved`);

      } catch (error: any) {
        console.error(`Failed to create clip ${index}:`, error.message);
        // Continue with next clip
      }
    }

    // Calculate average virality score
    if (successfulClips > 0) {
      const avgScore = analyzedClips.reduce((sum, c) => sum + c.score, 0) / successfulClips;
      await storage.updateVideoScore(videoId, Math.round(avgScore));
    }

    // Mark as complete
    await storage.updateVideoStatus(videoId, "complete");
    console.log(`\n✓ Processing complete! Generated ${successfulClips}/${analyzedClips.length} clips`);
    console.log("==========================================\n");

  } catch (error: any) {
    console.error("\n❌ Processing failed:", error.message);
    console.error(error.stack);
    await storage.updateVideoStatus(videoId, "error");
    console.log("==========================================\n");
    throw error;
  }
}