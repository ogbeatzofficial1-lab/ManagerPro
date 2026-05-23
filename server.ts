import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Lazy-initialized Gemini client to prevent startup crash if key is missing
  let aiInstance: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiInstance) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY is not defined");
      }
      aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiInstance;
  }

  // API: AI-Powered Track Analyzer Endpoint
  app.post("/api/analyze", async (req, res) => {
    const { filename } = req.body;
    if (!filename) {
      res.status(400).json({ error: "Filename is required" });
      return;
    }

    try {
      const ai = getGeminiClient();
      const prompt = `Analyze the audio track filename "${filename}" as a music expert. Determine its likely BPM, musical key signature (standard format, e.g. "C Major", "F# Minor", "A Min"), and 3 to 4 stylistic genre and mood tags. Check if the name contains bpm clues.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an automated professional music transcription and mastering intelligence agent.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bpm: { type: Type.INTEGER, description: "BPM speed of the track, between 60 and 200" },
              key: { type: Type.STRING, description: "Key signature of the track, e.g. C Major, F# Minor, etc." },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Up to 4 stylistic or genre-related tags, e.g. Trap, Clean, Dark"
              }
            },
            required: ["bpm", "key", "tags"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      const analysis = JSON.parse(text.trim());
      res.json(analysis);

    } catch (error: any) {
      console.warn("Gemini API analyze track failure, falling back:", error.message);
      // Fail gracefully so frontend can fall back
      res.status(500).json({ error: "Gemini analysis error: " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
