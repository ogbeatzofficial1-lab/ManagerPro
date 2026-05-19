export async function generateVideoAesthetic(trackInfo: any) {
  try {
    const response = await fetch("/api/generate-aesthetic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackInfo }),
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.details || errData.error || "Aesthetic analysis failed");
    }
    
    return await response.json();
  } catch (e) {
    console.error("AI Aesthetic generation failed:", e);
    return { 
      imagePrompt: "Cinematic high-end studio photography of a chrome music workstation in a dark room with orange neon accents, depth of field, 8k resolution.",
      suggestedStyle: "minimalist",
      motionDescription: "Subtle camera drift and pulsing lights."
    };
  }
}

export async function generatePromoPack(trackInfo: any) {
  try {
    const response = await fetch("/api/generate-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackInfo }),
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.details || errData.error || "Promo pack generation failed");
    }
    
    return await response.json();
  } catch (e) {
    console.error("AI Promo generation failed:", e);
    return {
      youtube: {
        title: `${trackInfo.name} - ${trackInfo.artist} | Official Reference Mix`,
        description: `New master ready for review.\n\nArtist: ${trackInfo.artist}\nBPM: ${trackInfo.bpm}\nKey: ${trackInfo.key_signature}\n\n#OGBeatz #Mastering`
      },
      instagram: `Secure reference portal open for ${trackInfo.name}. Pure heat from the lab. 🔥`,
      generic: `Check out the new high-fidelity mix of ${trackInfo.name}. Ready for the speakers.`
    };
  }
}
