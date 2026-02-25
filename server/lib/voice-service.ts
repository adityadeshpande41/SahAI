import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

export const elevenLabs = elevenLabsApiKey 
  ? new ElevenLabsClient({ apiKey: elevenLabsApiKey })
  : null;

// Voice IDs for different personas
export const VOICE_IDS = {
  // Warm, caring female voice (good for health assistant)
  rachel: "21m00Tcm4TlvDq8ikWAM",
  // Calm, professional female voice
  bella: "EXAVITQu4vr4xnSDxMaL",
  // Friendly male voice
  adam: "pNInz6obpgDQGcFmaJgB",
  // Gentle female voice
  elli: "MF3mGyEYCl7XYWbV9V6O",
};

export async function textToSpeech(
  text: string,
  voiceId: string = VOICE_IDS.rachel,
  options: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    speakerBoost?: boolean;
    language?: string;
  } = {}
): Promise<Buffer> {
  // Try ElevenLabs first
  if (elevenLabs) {
    try {
      const audio = await elevenLabs.textToSpeech.convert(voiceId, {
        text,
        model_id: "eleven_multilingual_v2", // Supports multiple languages
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0.0,
          use_speaker_boost: options.speakerBoost ?? true,
        },
      });

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audio) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      console.log("ElevenLabs TTS failed, falling back to OpenAI:", error.message);
      // Fall through to OpenAI fallback
    }
  }

  // Fallback to OpenAI TTS
  if (!openaiApiKey) {
    throw new Error("Both ElevenLabs and OpenAI TTS are unavailable. Add API keys to .env file.");
  }

  try {
    console.log("Using OpenAI TTS as fallback");
    
    // Map language to OpenAI voice
    const voiceMap: Record<string, string> = {
      "English": "alloy",    // Neutral, balanced
      "Hindi": "nova",       // Warm, friendly (works well for Hindi)
      "Spanish": "shimmer",  // Warm, expressive
      "French": "echo",      // Clear, articulate
      "German": "fable",     // Expressive
      "Chinese": "onyx",     // Deep, clear
      "Japanese": "nova",    // Warm
      "Arabic": "alloy",     // Neutral
    };
    
    const voice = options.language ? (voiceMap[options.language] || "alloy") : "alloy";
    
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1", // Faster model for lower latency
        input: text,
        voice: voice,
        speed: 1.0, // Normal speed for faster response
        response_format: "mp3", // MP3 is faster to encode than opus
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI TTS error: ${errorData.error?.message || response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.error("OpenAI TTS error:", error);
    throw new Error(`Text-to-speech failed: ${error.message}`);
  }
}

export async function speechToText(audioBuffer: Buffer, language?: string): Promise<string> {
  // Use OpenAI Whisper for speech-to-text
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY not configured. Add it to .env file.");
  }

  try {
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");
    
    // Add language hint if provided (improves accuracy)
    // Language codes: en, hi, es, fr, de, zh, ja, ar, etc.
    if (language) {
      const languageCode = getLanguageCode(language);
      if (languageCode) {
        formData.append("language", languageCode);
      }
    }
    
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Whisper API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error("Speech-to-text error:", error);
    throw new Error(`Speech-to-text failed: ${error.message}`);
  }
}

// Map language names to ISO codes for Whisper
function getLanguageCode(language: string): string | null {
  const languageMap: Record<string, string> = {
    "English": "en",
    "Hindi": "hi",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Chinese": "zh",
    "Japanese": "ja",
    "Arabic": "ar",
    "Tamil": "ta",
    "Telugu": "te",
    "Bengali": "bn",
    "Marathi": "mr",
    "Gujarati": "gu",
    "Kannada": "kn",
  };
  
  return languageMap[language] || null;
}

// Get available voices
export async function getAvailableVoices() {
  if (!elevenLabs) {
    return [];
  }

  try {
    const voices = await elevenLabs.voices.getAll();
    return voices.voices.map(v => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
      description: v.description,
    }));
  } catch (error) {
    console.error("Error fetching voices:", error);
    return [];
  }
}
