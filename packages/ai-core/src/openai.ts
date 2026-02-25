const DEFAULT_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is missing");
  }
  return key;
}

export async function callTextModel(input: string, model?: string): Promise<string> {
  const usedModel = model || process.env.OPENAI_MODEL_TEXT || "gpt-4.1-mini";
  const response = await fetch(`${DEFAULT_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: usedModel,
      input
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Text model request failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  return data.output_text || "";
}

function normalizeAudioFormat(input: string): string {
  const normalized = input.trim().toLowerCase();
  if (!normalized.includes("/")) {
    return normalized;
  }

  const formatMap: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "mp4",
    "audio/m4a": "m4a",
    "audio/x-m4a": "m4a",
    "audio/webm": "webm",
    "audio/ogg": "ogg"
  };

  return formatMap[normalized] || normalized.replace(/^audio\//, "");
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const usedModel = process.env.OPENAI_MODEL_TRANSCRIBE || "gpt-4o-mini-transcribe";
  const format = normalizeAudioFormat(mimeType);
  const response = await fetch(`${DEFAULT_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: usedModel,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Please transcribe this audio in Chinese if applicable." },
            {
              type: "input_audio",
              audio: base64Audio,
              format
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Transcription request failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  return data.output_text || "";
}
