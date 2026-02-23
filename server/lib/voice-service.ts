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
  } = {}
): Promise<Buffer> {
  if (!elevenLabs) {
    throw new Error("ElevenLabs not configured. Add ELEVENLABS_API_KEY to .env");
  }

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
    console.error("TTS error:", error);
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
