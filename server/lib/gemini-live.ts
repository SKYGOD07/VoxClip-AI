/**
 * Gemini Live API WebSocket Proxy
 * Node.js port of the Python WebSocket proxy from:
 * multimodal-live-api/websocket-demo-app/backend/main.py
 *
 * Provides bidirectional WebSocket proxy between frontend clients
 * and the Gemini Live API for real-time voice interaction.
 */
import { WebSocket, WebSocketServer } from "ws";
import type { Server as HTTPServer } from "http";

// Gemini Live API endpoint (Google AI Studio — uses API key auth)
const GEMINI_LIVE_API_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

const DEBUG = process.env.GEMINI_LIVE_DEBUG === "true";

interface LiveAPIConfig {
  apiKey?: string;
  model?: string;
  projectId?: string;
}

/**
 * Create and attach the Gemini Live API WebSocket proxy to an HTTP server
 */
export function setupGeminiLiveProxy(httpServer: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws/gemini-live",
  });

  console.log("Gemini Live API proxy listening on /ws/gemini-live");

  wss.on("connection", (clientWs, req) => {
    console.log(`New Gemini Live API connection from ${req.socket.remoteAddress}`);
    handleClientConnection(clientWs);
  });

  return wss;
}

/**
 * Handle a new client WebSocket connection
 * Expects the first message to contain configuration (API key, model, etc.)
 */
async function handleClientConnection(clientWs: WebSocket): Promise<void> {
  let serverWs: WebSocket | null = null;
  let isAuthenticated = false;

  // Wait for the first message with auth config
  clientWs.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (!isAuthenticated) {
        // First message must contain configuration
        const config = extractConfig(message);

        if (!config.apiKey) {
          // Try using server-side API key
          config.apiKey = process.env.GEMINI_API_KEY;
        }

        if (!config.apiKey) {
          clientWs.send(
            JSON.stringify({
              error: "API key required. Send { api_key: 'your-key' } or set GEMINI_API_KEY env var.",
            })
          );
          clientWs.close(1008, "API key missing");
          return;
        }

        const model = config.model || "gemini-2.0-flash-live-001";

        // Build the WebSocket URL with API key
        const wsUrl = `${GEMINI_LIVE_API_URL}?key=${config.apiKey}`;

        if (DEBUG) {
          console.log(`Connecting to Gemini Live API with model: ${model}`);
        }

        try {
          serverWs = new WebSocket(wsUrl);

          serverWs.on("open", () => {
            console.log("Connected to Gemini Live API");
            isAuthenticated = true;

            // Send setup message
            const setupMessage = {
              setup: {
                model: `models/${model}`,
                generation_config: {
                  response_modalities: ["AUDIO", "TEXT"],
                },
              },
            };
            serverWs!.send(JSON.stringify(setupMessage));

            clientWs.send(
              JSON.stringify({
                status: "connected",
                model,
              })
            );
          });

          // Forward server messages to client
          serverWs.on("message", (serverData) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              if (DEBUG) {
                try {
                  const parsed = JSON.parse(serverData.toString());
                  console.log("Server → Client:", JSON.stringify(parsed).substring(0, 200));
                } catch {
                  // Binary data
                }
              }
              clientWs.send(serverData);
            }
          });

          serverWs.on("error", (error) => {
            console.error("Gemini Live API error:", error.message);
            clientWs.send(
              JSON.stringify({ error: `Gemini API error: ${error.message}` })
            );
          });

          serverWs.on("close", (code, reason) => {
            console.log(`Gemini Live API disconnected: ${code} ${reason}`);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close(code, reason.toString());
            }
          });
        } catch (error: any) {
          console.error("Failed to connect to Gemini Live API:", error.message);
          clientWs.send(
            JSON.stringify({ error: `Connection failed: ${error.message}` })
          );
          clientWs.close(1011, "Failed to connect to Gemini API");
        }
      } else {
        // Forward authenticated client messages to Gemini
        if (serverWs && serverWs.readyState === WebSocket.OPEN) {
          if (DEBUG) {
            console.log("Client → Server:", JSON.stringify(message).substring(0, 200));
          }
          serverWs.send(JSON.stringify(message));
        }
      }
    } catch (error: any) {
      console.error("Error processing message:", error.message);
    }
  });

  clientWs.on("close", () => {
    console.log("Client disconnected from Gemini Live API proxy");
    if (serverWs && serverWs.readyState === WebSocket.OPEN) {
      serverWs.close();
    }
  });

  clientWs.on("error", (error) => {
    console.error("Client WebSocket error:", error.message);
    if (serverWs && serverWs.readyState === WebSocket.OPEN) {
      serverWs.close();
    }
  });
}

/**
 * Extract configuration from the first client message
 */
function extractConfig(message: any): LiveAPIConfig {
  return {
    apiKey:
      message.api_key ||
      message.apiKey ||
      message.bearer_token ||
      message.token,
    model: message.model || message.modelId,
    projectId: message.project_id || message.projectId,
  };
}
