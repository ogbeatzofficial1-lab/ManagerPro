import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (geminiApiKey && geminiApiKey !== "undefined" && geminiApiKey.trim()) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err);
  }
}

export async function generateVideoAesthetic(trackInfo: any) {
  if (!ai) {
    // Graceful fallback
    return {
      imagePrompt: `A physical synth deck in a dark room with orange neon backlighting and metallic chrome finishes. Style: cyber industrial. Vibe: matching ${trackInfo?.name || "reference mix"}.`,
      suggestedStyle: "Cyber Industrial",
      motionDescription: "Subtle linear zoom with frequency-scaled orange glow pulses."
    };
  }

  try {
    const prompt = `Analyze the audio metadata for this reference track:
Name: ${trackInfo.name || "Untitled"}
Artist: ${trackInfo.artist || "Unknown"}
BPM: ${trackInfo.bpm || 120}
Key: ${trackInfo.key_signature || "C Major"}
Duration: ${trackInfo.duration || 180}s
Tags: ${JSON.stringify(trackInfo.tags || [])}

Based on this, generate:
1. imagePrompt: A detailed, ready-to-use prompt for an image generator (like Imagen 3 or Midjourney) describing a visual background loop asset. It must fit our 'Industrial Cyber-Chrome & Neon Orange' style. Include material textures (brushed metal, polished chrome, glowing fiber optics), studio gear (modular synths, tape recorders, reels), and colors (charcoal black, vibrant neon safety orange, steel blue accents).
2. suggestedStyle: A short style name summarizing this track's vibe.
3. motionDescription: A brief instruction card directing real-time graphic engine camera shifts, pan movements, or element animations.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an visual creative director and music visualizer director. You specialize in synthwave, cyberpunk, lo-fi, trap, and industrial audio visuals. Always respond with valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imagePrompt: {
              type: Type.STRING,
              description: "High-end 8k image generator prompt fitting cyber-chrome neon orange theme."
            },
            suggestedStyle: {
              type: Type.STRING,
              description: "Compact visual style category."
            },
            motionDescription: {
              type: Type.STRING,
              description: "Directives for background camera rendering adjustments."
            }
          },
          required: ["imagePrompt", "suggestedStyle", "motionDescription"]
        }
      }
    });

    const text = response.text || "";
    return JSON.parse(text.trim());
  } catch (err: any) {
    console.error("AI Aesthetic generation failed (client-side):", err);
    return { 
      imagePrompt: `Professional record studio console close-up, steel metallic details, glowing safety orange audio meters, bokeh backlights. Vibe of ${trackInfo?.name || "Reference track"}.`,
      suggestedStyle: "Neon Chrome",
      motionDescription: "Slow tracking pan along the mixer console faders with audio reactive glow."
    };
  }
}

export async function generatePromoPack(trackInfo: any) {
  if (!ai) {
    // Graceful fallback
    return {
      youtube: {
        title: `🎹 ${trackInfo?.name || "Special Beat"} [Reference Mix] - Prod. ${trackInfo?.artist || "OGBeatz"}`,
        description: `Reference mix for client review.\n\nTEMPO: ${trackInfo?.bpm || 120} BPM\nKEY: ${trackInfo?.key_signature || "C Major"}\n\nAll rights reserved. Secure portal link generated for active clients.`
      },
      instagram: `🔥 NEW VAULT EXCLUSIVE: "${trackInfo?.name || "Unreleased"}" represents the latest blueprint from the lab. tempo: ${trackInfo?.bpm || 120} bpm | key: ${trackInfo?.key_signature || "C Major"}. Full WAV references now sent to partners. Let's record.`,
      generic: `Ready for licensing review: "${trackInfo?.name || "New Beat"}" by ${trackInfo?.artist || "OGBeatz"}. Securely packaged. Let me know if you need the track split stems.`
    };
  }

  try {
    const prompt = `Create marketing and promotional copy packages for an elite, high-fidelity audio release reference:
Name: ${trackInfo.name || "Untitled"}
Artist: ${trackInfo.artist || "Unknown"}
BPM: ${trackInfo.bpm || 120}
Key: ${trackInfo.key_signature || "C Major"}
Tags: ${JSON.stringify(trackInfo.tags || [])}

We need three formats:
1. YouTube Title and professional description copy card incorporating BPM, Key, credentials, and legal licensing instructions.
2. Instagram promotional caption filled with hype emojis, hashtag blocks, and call-to-actions to access the secure artist portal.
3. A short, humble professional email/message copy meant for pitch delivery to A&Rs, managers, and recording artists.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a platinum-selling hip-hop, electronic, and trap music marketing copywriter. You know how to make unreleased sound references sound ultra-exclusive and premium. Return direct JSON with youtube, instagram, and generic properties.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            youtube: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            },
            instagram: { type: Type.STRING },
            generic: { type: Type.STRING }
          },
          required: ["youtube", "instagram", "generic"]
        }
      }
    });

    const text = response.text || "";
    return JSON.parse(text.trim());
  } catch (err: any) {
    console.error("AI Promo generation failed (client-side):", err);
    return {
      youtube: {
        title: `🎹 ${trackInfo?.name || "Special Beat"} [Reference Mix] - Prod. ${trackInfo?.artist || "OGBeatz"}`,
        description: `Reference mix for client review.\n\nTEMPO: ${trackInfo?.bpm || 120} BPM\nKEY: ${trackInfo?.key_signature || "C Major"}\n\nAll rights reserved. Secure portal link generated for active clients.`
      },
      instagram: `🔥 NEW VAULT EXCLUSIVE: "${trackInfo?.name || "Unreleased"}" represents the latest blueprint from the lab. tempo: ${trackInfo?.bpm || 120} bpm | key: ${trackInfo?.key_signature || "C Major"}. Full WAV references now sent to partners. Let's record.`,
      generic: `Ready for licensing review: "${trackInfo?.name || "New Beat"}" by ${trackInfo?.artist || "OGBeatz"}. Securely packaged. Let me know if you need the track split stems.`
    };
  }
}
