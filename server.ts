import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function cleanEnvValue(val: any): string {
  if (!val) return "";
  let s = String(val).trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("'") && s.endsWith("'")) {
    s = s.slice(1, -1).trim();
  }
  if (s === "" || s === "undefined" || s === "null") {
    return "";
  }
  return s;
}

function analyzeMetadataFallback(fileName: string) {
  const cleanName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
  const cleanLower = cleanName.toLowerCase();

  // 1. BPM Heuristic
  let bpm = 120;
  const bpmMatch = cleanLower.match(/(\d{2,3})\s*(?:bpm|BPM)/);
  if (bpmMatch) {
    bpm = parseInt(bpmMatch[1], 10);
  } else {
    // Look for any 2 or 3 digit number between 60 and 200
    const numbers = cleanLower.match(/\b\d{2,3}\b/g);
    if (numbers) {
      for (const numStr of numbers) {
        const num = parseInt(numStr, 10);
        if (num >= 60 && num <= 200) {
          bpm = num;
          break;
        }
      }
    }
  }

  // 2. Key Signature Heuristic
  let key = "C Major";
  const standardKeys = [
    "Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm",
    "A#m", "C#m", "D#m", "F#m", "G#m",
    "Abm", "Bbm", "Ebm",
    "A", "B", "C", "D", "E", "F", "G",
    "A#", "C#", "D#", "F#", "G#"
  ];
  // Sort keys by length descending to match F#m before F#
  const sortedKeys = [...standardKeys].sort((a, b) => b.length - a.length);
  
  // Try to find a key matching word boundaries or surrounded by spacer characters
  const words = cleanName.split(/[\s_\-\[\]\(\)]+/);
  for (const word of words) {
    if (sortedKeys.includes(word)) {
      key = word;
      break;
    }
    // Try case-insensitive matching if it's longer than 1 char or matches CamelCase
    const matchedKey = sortedKeys.find(k => k.toLowerCase() === word.toLowerCase());
    if (matchedKey) {
      key = matchedKey;
      break;
    }
  }

  // 3. Duration Heuristic (deterministically generate a duration between 130 and 230 based on the filename length)
  const duration = 120 + (cleanName.length * 3) % 111;

  // 4. Tags Heuristic
  const tags: string[] = [];
  const genreKeywords = [
    { keys: ["trap", "808"], tags: ["Trap", "Dark", "Heavy"] },
    { keys: ["drill", "grime", "uk"], tags: ["Drill", "Aggressive", "Gritty"] },
    { keys: ["lofi", "lo-fi", "chillhop", "study"], tags: ["Lofi", "Chill", "Relaxed"] },
    { keys: ["boombap", "boom bap", "90s", "eastcoast"], tags: ["BoomBap", "Classic", "Groovy"] },
    { keys: ["chill", "ambient", "cloud", "smooth"], tags: ["Chill", "Ambient", "Smooth"] },
    { keys: ["guitar", "acoustic", "guitarra"], tags: ["Acoustic", "Melodic", "Organic"] },
    { keys: ["piano", "keys", "emotional", "sad"], tags: ["Piano", "Emotional", "Soulful"] },
    { keys: ["synth", "retro", "wave", "cyber"], tags: ["Synth", "Futuristic", "Electronic"] },
    { keys: ["soul", "r&b", "rb", "motown"], tags: ["R&B", "Soulful", "Smooth"] },
    { keys: ["pop", "upbeat", "dance", "synthpop"], tags: ["Pop", "Upbeat", "Dance"] }
  ];

  for (const item of genreKeywords) {
    if (item.keys.some(k => cleanLower.includes(k))) {
      tags.push(...item.tags);
    }
  }

  // Remove duplicate tags
  const uniqueTags = Array.from(new Set(tags)).slice(0, 4);
  if (uniqueTags.length === 0) {
    uniqueTags.push("Instrumental", "OGBeatz", "Producer Mode");
  }

  return { bpm, key, duration, tags: uniqueTags };
}

function generatePromoFallback(trackInfo: any) {
  const name = trackInfo.name || "Untitled Track";
  const artist = trackInfo.artist || "OGBeatz";
  const bpm = trackInfo.bpm || 120;
  const key = trackInfo.key_signature || "C Major";
  
  return {
    youtube: {
      title: `🔥 [FREE] ${artist} - "${name}" | Hard Trap Instrumental (BPM ${bpm} - Key ${key})`,
      description: `🎵 Inscribe your next hit with the official master release "${name}" by ${artist}.\n\n📥 Purchase & Instant Download License: http://ogbeatz.com/vault\n➕ Subscribe for more high-end productions: http://youtube.com/ogbeatz\n\n📌 Details:\nBPM: ${bpm}\nKey: ${key}\nGenre: Trap / Dark Instrumental\n\n💬 Let's collaborate! Leave a comment or reach out via email.`
    },
    instagram: `🔥 NEW VAULT ACQUISITION 🔥\n\n"${name}" is now live in the repository.\n\n⚡ BPM: ${bpm}\n🎹 Key: ${key}\n编制 by: @ogbeatz\n\nHit the link in bio to secure the exclusive master license! 🚀\n\n#producer #flstudio #trapbeats #newmusic #beatmaker #collaboration #musicproducer`,
    generic: `"${name}" is a heavy, professional ${bpm} BPM instrumental in ${key} crafted by ${artist}, optimizing hard-hitting custom sub-bass glides and chrome futuristic synthesizers designed for major plaque placement.`
  };
}

function generateAestheticFallback(trackInfo: any) {
  const name = trackInfo.name || "Untitled Track";
  const artist = trackInfo.artist || "OGBeatz";
  const bpm = trackInfo.bpm || 120;
  const key = trackInfo.key_signature || "C Major";
  
  return {
    imagePrompt: `High-end minimalist industrial studio art for "${name}". High-contrast orange aesthetic, brushed chrome, distressed carbon metal sheets and structural metal plates on a deep charcoal black canvas. 8k resolution, cinematic raw lighting, neon orange highlights, album cover design style.`,
    suggestedStyle: "Industrial Brutalism & Cyber-Chrome",
    motionDescription: "Subtle metallic chrome glimmers, slow rotating dark structural elements with pulsing orange neon ambient lighting sync'd to a steady 4/4 rhythm."
  };
}

// Initialize Supabase for server-side diagnostics
let rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
let rawSupabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

let supabaseUrl = cleanEnvValue(rawSupabaseUrl);
let supabaseAnonKey = cleanEnvValue(rawSupabaseAnonKey);

if (!supabaseUrl) {
  supabaseUrl = 'https://yqtkfpaauzpcwzaopzhl.supabase.co';
}
if (!supabaseAnonKey) {
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
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          results[table] = { success: false, error: error.message };
          overallSuccess = false;
        } else {
          results[table] = { success: true };
        }
      } catch (tableErr: any) {
        results[table] = { success: false, error: tableErr.message || String(tableErr) };
        overallSuccess = false;
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
let rawGeminiKey = process.env.GEMINI_API_KEY || "";
let cleanGeminiKey = cleanEnvValue(rawGeminiKey);

console.log(`[Gemini Init] Raw key present: ${!!rawGeminiKey}, Clean key present: ${!!cleanGeminiKey}, Length: ${cleanGeminiKey.length}`);
if (cleanGeminiKey) {
  console.log(`[Gemini Init] Key starts with: ${cleanGeminiKey.substring(0, 6)}... ends with: ${cleanGeminiKey.substring(Math.max(0, cleanGeminiKey.length - 4))}`);
}

let ai: GoogleGenAI | null = null;
if (cleanGeminiKey) {
  ai = new GoogleGenAI({
    apiKey: cleanGeminiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}


// API Routes
app.post("/api/analyze-metadata", async (req, res) => {
  const { fileName } = req.body;
  if (!fileName) return res.status(400).json({ error: "fileName is required" });

  if (!ai) {
    console.warn(`[Gemini Fallback] Gemini helper not initialized. Parsing "${fileName}" with heuristic analyzer.`);
    return res.json(analyzeMetadataFallback(fileName));
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
    console.warn(`[Gemini Fallback] AI Analysis failed, utilizing heuristic fallback. Error:`, error.message || error);
    res.json(analyzeMetadataFallback(fileName));
  }
});

app.post("/api/generate-promo", async (req, res) => {
  const { trackInfo } = req.body;
  if (!trackInfo) return res.status(400).json({ error: "trackInfo is required" });

  if (!ai) {
    console.warn(`[Gemini Fallback] Gemini helper not initialized. Handcrafting static on-brand promo package.`);
    return res.json(generatePromoFallback(trackInfo));
  }

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
      model: "gemini-3.5-flash",
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
    console.warn(`[Gemini Fallback] Gemini Promo generation failed, employing fallback template. Error:`, error.message || error);
    res.json(generatePromoFallback(trackInfo));
  }
});

app.post("/api/generate-aesthetic", async (req, res) => {
  const { trackInfo } = req.body;
  if (!trackInfo) return res.status(400).json({ error: "trackInfo is required" });

  if (!ai) {
    console.warn(`[Gemini Fallback] Gemini helper not initialized. Crafting static video aesthetic parameters.`);
    return res.json(generateAestheticFallback(trackInfo));
  }

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
      model: "gemini-3.5-flash",
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
    console.warn(`[Gemini Fallback] Gemini Video Aesthetic generation failed, using aesthetic fallback. Error:`, error.message || error);
    res.json(generateAestheticFallback(trackInfo));
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
