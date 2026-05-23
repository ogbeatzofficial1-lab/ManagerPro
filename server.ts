import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

dotenv.config();

const app = express();
const PORT = process.env.RENDER === "true" && process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : (process.env.PORT && process.env.NODE_ENV === "production" && !process.env.DISABLE_HMR
      ? parseInt(process.env.PORT, 10)
      : 3000);

// Initialize Supabase for server-side diagnostics
let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
let supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || supabaseUrl === 'undefined') {
  supabaseUrl = 'https://yqtkfpaauzpcwzaopzhl.supabase.co';
}
if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGtmcGFhdXpwY3d6YW9wemhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDY5ODIsImV4cCI6MjA5NDQ4Mjk4Mn0.9BSnEHydxyVuQjNaOY1O7JR2xZMQt5lmfuaJLuSYteg';
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws as any },
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// API routes go here FIRST
app.get("/api/config", (req, res) => {
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
  let key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;
  if (url === 'undefined') url = null;
  if (key === 'undefined') key = null;
  res.json({
    supabaseUrl: url,
    supabaseAnonKey: key
  });
});

app.get("/api/test-db", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ 
      success: false, 
      error: "Supabase client not initialized. Check your SUPABASE_URL and SUPABASE_ANON_KEY environment variables." 
    });
  }

  const tables = ['tracks', 'playlists', 'clients', 'share_links', 'activities', 'messages', 'promo_videos', 'profiles', 'promo_packs', 'todos'];
  const results: any = {};
  let overallSuccess = true;

  try {
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        results[table] = { success: false, error: error.message };
        overallSuccess = false;
      } else {
        results[table] = { success: true };
      }
    }

    if (overallSuccess) {
      res.json({ 
        success: true, 
        message: "All tables connected and accessible!",
        details: results
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: "Some tables failed connection. Check your Supabase schema.",
        details: results
      });
    }
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || String(err) 
    });
  }
});

// Initialize Gemini
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}


// API Routes
app.post("/api/analyze-metadata", async (req, res) => {
  if (!ai) return res.status(500).json({ error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file." });
  const { fileName } = req.body;
  if (!fileName) return res.status(400).json({ error: "fileName is required" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this music track name: "${fileName}". Suggest its likely BPM (number), Key Signature (string like "Am", "F#m", "C"), approximate duration in seconds, and 3-5 descriptive tags (genres/moods). Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bpm: { type: Type.NUMBER },
            key: { type: Type.STRING },
            duration: { type: Type.NUMBER },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["bpm", "key", "tags"]
        }
      }
    });
    
    res.json(JSON.parse(response.text.trim()));
  } catch (error: any) {
    console.error("AI Analysis failed:", error);
    res.status(500).json({ error: "AI analysis failed", details: error.message || String(error) });
  }
});

app.post("/api/generate-promo", async (req, res) => {
  if (!ai) return res.status(500).json({ error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file." });
  const { trackInfo } = req.body;
  if (!trackInfo) return res.status(400).json({ error: "trackInfo is required" });

  try {
    const prompt = `Generate a professional music marketing promo pack for the track:
    - Name: ${trackInfo.name}
    - Artist: ${trackInfo.artist}
    - BPM: ${trackInfo.bpm}
    - Key: ${trackInfo.key_signature}

    Brand Guidelines:
    - BAN amateur jargon: "type beat", "lease", "buy this beat", "beatmaker".
    - USE industry-focused words: "producer", "songwriter", "new music", "collaboration".
    - Tone: Professional, mature, polished.

    Requirement:
    1. YouTube: Title (under 100 chars), Description with timing symbols/CTAs.
    2. Instagram: Short, spaced caption with natural feel.
    3. Generic: A 2-sentence pitch.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            youtube: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["title", "description"],
            },
            instagram: { type: Type.STRING },
            generic: { type: Type.STRING },
          },
          required: ["youtube", "instagram", "generic"],
        },
      },
    });

    res.json(JSON.parse(response.text.trim()));
  } catch (error: any) {
    console.error("Gemini Promo Error:", error);
    res.status(500).json({ error: "Promo generation failed", details: error.message || String(error) });
  }
});

app.post("/api/generate-aesthetic", async (req, res) => {
  if (!ai) return res.status(500).json({ error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file." });
  const { trackInfo } = req.body;
  if (!trackInfo) return res.status(400).json({ error: "trackInfo is required" });

  try {
    const prompt = `Based on this music track:
    - Name: ${trackInfo.name}
    - Artist: ${trackInfo.artist}
    - BPM: ${trackInfo.bpm}
    - Key: ${trackInfo.key_signature}
    
    Generate a visual aesthetic prompt for an AI video background. 
    The tone is professional, high-end hip-hop production (OG BEATZ branding: Orange, Black, Chrome, distressed metal).
    
    Return a prompt for image generation that would work as a background for a promo video.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imagePrompt: { type: Type.STRING },
            suggestedStyle: { type: Type.STRING },
            motionDescription: { type: Type.STRING },
          },
          required: ["imagePrompt", "suggestedStyle", "motionDescription"],
        },
      },
    });

    res.json(JSON.parse(response.text.trim()));
  } catch (error: any) {
    console.error("Gemini Video Aesthetic Error:", error);
    res.status(500).json({ error: "Aesthetic generation failed", details: error.message || String(error) });
  }
});

// Vite middleware for development
async function startServer() {
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
