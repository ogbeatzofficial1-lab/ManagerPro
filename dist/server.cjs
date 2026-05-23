var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_supabase_js = require("@supabase/supabase-js");
var import_ws = __toESM(require("ws"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
var supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
var supabase = supabaseUrl && supabaseAnonKey ? (0, import_supabase_js.createClient)(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: import_ws.default }
}) : null;
app.use(import_express.default.json({ limit: "100mb" }));
app.use(import_express.default.urlencoded({ limit: "100mb", extended: true }));
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
      error: "Supabase client not initialized. Check your SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
    });
  }
  const tables = ["tracks", "playlists", "clients", "share_links", "activities", "messages", "promo_videos", "profiles", "promo_packs", "todos"];
  const results = {};
  let overallSuccess = true;
  try {
    for (const table of tables) {
      const { error } = await supabase.from(table).select("id").limit(1);
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
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || String(err)
    });
  }
});
var ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
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
          type: import_genai.Type.OBJECT,
          properties: {
            bpm: { type: import_genai.Type.NUMBER },
            key: { type: import_genai.Type.STRING },
            duration: { type: import_genai.Type.NUMBER },
            tags: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            }
          },
          required: ["bpm", "key", "tags"]
        }
      }
    });
    res.json(JSON.parse(response.text.trim()));
  } catch (error) {
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
          type: import_genai.Type.OBJECT,
          properties: {
            youtube: {
              type: import_genai.Type.OBJECT,
              properties: {
                title: { type: import_genai.Type.STRING },
                description: { type: import_genai.Type.STRING }
              },
              required: ["title", "description"]
            },
            instagram: { type: import_genai.Type.STRING },
            generic: { type: import_genai.Type.STRING }
          },
          required: ["youtube", "instagram", "generic"]
        }
      }
    });
    res.json(JSON.parse(response.text.trim()));
  } catch (error) {
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
          type: import_genai.Type.OBJECT,
          properties: {
            imagePrompt: { type: import_genai.Type.STRING },
            suggestedStyle: { type: import_genai.Type.STRING },
            motionDescription: { type: import_genai.Type.STRING }
          },
          required: ["imagePrompt", "suggestedStyle", "motionDescription"]
        }
      }
    });
    res.json(JSON.parse(response.text.trim()));
  } catch (error) {
    console.error("Gemini Video Aesthetic Error:", error);
    res.status(500).json({ error: "Aesthetic generation failed", details: error.message || String(error) });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
