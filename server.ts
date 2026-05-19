import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase for server-side diagnostics
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const memoryDb: any = {
  tracks: [
    {
      id: "d86412e8-0888-444a-8f64-96695368a44b",
      name: "Midnight Cruisin'",
      artist: "OGBeatz",
      bpm: 92,
      key_signature: "G minor",
      duration: 184,
      tags: ["Trap", "Dark", "Bouncy"],
      status: "ready",
      size: 4500000,
      type: "audio/mp3",
      file_url: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
      image_url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80",
      plays: 124,
      likes: 45,
      created_at: new Date().toISOString()
    },
    {
      id: "e5b7c8a4-0b1d-4f8e-8a2a-7d4e3f1c2b5a",
      name: "Solar Flares",
      artist: "OGBeatz",
      bpm: 140,
      key_signature: "C# minor",
      duration: 210,
      tags: ["Drill", "Aggressive", "Hard"],
      status: "ready",
      size: 5200000,
      type: "audio/mp3",
      file_url: "https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3",
      image_url: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80",
      plays: 89,
      likes: 32,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  playlists: [
    {
      id: "f7a2b9c3-4d5e-6f8a-9b0c-1d2e3f4a5b6c",
      name: "🔥 Heat Pack Vol. 1",
      description: "My best beats from 2026",
      track_ids: ["d86412e8-0888-444a-8f64-96695368a44b", "e5b7c8a4-0b1d-4f8e-8a2a-7d4e3f1c2b5a"],
      start_color: "#ef4444",
      end_color: "#b91c1c",
      created_at: new Date().toISOString()
    }
  ],
  clients: [
    {
      id: "a1b2c3d4-e5f6-4a5b-bcde-1234567890ab",
      name: "Drake",
      email: "drake@ovo.com",
      status: "online",
      last_active: new Date().toISOString(),
      tags: ["VIP", "Placement"],
      created_at: new Date().toISOString()
    },
    {
      id: "b2c3d4e5-f6a7-4b6c-cdef-2345678a90bc",
      name: "Future",
      email: "future@fbg.com",
      status: "offline",
      last_active: new Date(Date.now() - 3600000).toISOString(),
      tags: ["Frequent Buyer"],
      created_at: new Date().toISOString()
    }
  ],
  activities: [
    {
      id: "6e2894b1-8b3d-4c3e-8f2a-7d4e3f1c2b5a",
      type: "system",
      user: "System",
      action: "System initialized",
      timestamp: new Date().toISOString()
    },
    {
      id: "7f3905c2-9c4e-5d4f-9a3b-8e5f4a2d3c6b",
      type: "social",
      user: "OGBeatz",
      action: "Sold exclusive license to Drake",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      client_id: "a1b2c3d4-e5f6-4a5b-bcde-1234567890ab"
    }
  ],
  messages: [
    {
      id: "8a4016d3-0d5f-6e5a-0b4c-9f6a5b3e4d7c",
      client_id: "a1b2c3d4-e5f6-4a5b-bcde-1234567890ab",
      recipient_id: "drake@ovo.com",
      content: "Sending over the stems for Midnight Cruisin'. Let me know if you need any adjustments.",
      direction: "outbound",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      is_read: true
    },
    {
      id: "9b5127e4-1e6a-7f6b-1c5d-007b6c4f5e8d",
      client_id: "a1b2c3d4-e5f6-4a5b-bcde-1234567890ab",
      recipient_id: "ogbeatz@example.com",
      content: "The vibes are immaculate. Ready for the booth.",
      direction: "inbound",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      is_read: false
    }
  ],
  promo_videos: [
    {
      id: "0c6238f5-2f7b-807c-2d6e-118c7d506f9e",
      track_id: "d86412e8-0888-444a-8f64-96695368a44b",
      video_url: "#",
      thumbnail_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
      style: "Cinematic",
      status: "ready",
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  promo_packs: [
    {
      id: "p1",
      track_id: "d86412e8-0888-444a-8f64-96695368a44b",
      youtube_copy: "Midnight Cruisin' - Official Visualizer\n\nOut now on all platforms.",
      instagram_copy: "Late night vibes with Midnight Cruisin'.",
      generic_copy: "A dark trap banger for the streets.",
      created_at: new Date().toISOString()
    }
  ],
  share_links: [
    {
      id: "1d7349a6-308c-918d-3e7f-229d8e6170af",
      token: "sample-token-123",
      track_id: "d86412e8-0888-444a-8f64-96695368a44b",
      client_id: "a1b2c3d4-e5f6-4a5b-bcde-1234567890ab",
      download_enabled: true,
      access_count: 5,
      created_at: new Date(Date.now() - 172800000).toISOString()
    }
  ],
  profile: {
    id: "c3d4e5f6-a7b8-4c7d-def0-345678a90bcd",
    name: "OG Beatz",
    artist_name: "OGBeatz",
    email: "ogbeatz@example.com",
    avatar_url: "https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=400&h=400&fit=crop",
    bio: "Multi-platinum producer specializing in industrial trap and melodic drill. High-fidelity sound architecture for the new era.",
    created_at: new Date().toISOString()
  }
};

app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null
  });
});

app.get("/api/test-db", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ 
      success: false, 
      error: "Supabase client not initialized. Check your .env file." 
    });
  }

  try {
    const { data, error } = await supabase.from('tracks').select('id').limit(1);
    
    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message,
        details: error
      });
    }

    res.json({ 
      success: true, 
      message: "Successfully connected to Supabase!",
      data 
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || String(err) 
    });
  }
});

app.get("/api/media", (req, res) => {
  res.json(memoryDb);
});

app.post("/api/media", (req, res) => {
  const { collection, data } = req.body;
  if (!collection) return res.status(400).json({ error: "collection required" });
  
  if (collection === 'profile') {
    memoryDb.profile = data;
  } else {
    memoryDb[collection] = data;
  }
  res.json({ success: true });
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
