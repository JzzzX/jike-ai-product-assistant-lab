import { segmentTranscript, transcribeAudio } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";

type TranscribeRequest = {
  transcript?: string;
  audioBase64?: string;
  audioMimeType?: string;
};

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

function parseAudioInput(audioBase64: string, audioMimeType?: string): { base64: string; mimeType: string } {
  const trimmed = audioBase64.trim();
  const dataUrlMatch = trimmed.match(/^data:([^;,]+);base64,(.+)$/);

  if (dataUrlMatch) {
    return {
      base64: dataUrlMatch[2],
      mimeType: audioMimeType || dataUrlMatch[1]
    };
  }

  return {
    base64: trimmed,
    mimeType: audioMimeType || "audio/mpeg"
  };
}

function toDoneResponse(transcript: string, started: number, source: "text" | "audio") {
  const segments = segmentTranscript(transcript);
  return NextResponse.json({
    status: "done",
    transcript,
    segments,
    latencyMs: Date.now() - started,
    source
  });
}

function validateAudioInput(mimeType: string, size: number): { ok: true } | { ok: false; code: string; message: string; status: number } {
  if (!mimeType.startsWith("audio/")) {
    return {
      ok: false,
      code: "INVALID_AUDIO_TYPE",
      message: `unsupported mime type: ${mimeType || "unknown"}`,
      status: 400
    };
  }

  if (size <= 0) {
    return {
      ok: false,
      code: "EMPTY_AUDIO_FILE",
      message: "audio file is empty",
      status: 400
    };
  }

  if (size > MAX_AUDIO_BYTES) {
    return {
      ok: false,
      code: "AUDIO_TOO_LARGE",
      message: `audio file exceeds ${Math.round(MAX_AUDIO_BYTES / 1024 / 1024)}MB limit`,
      status: 413
    };
  }

  return { ok: true };
}

async function transcribeFromAudio(base64Audio: string, mimeType: string, started: number) {
  const generatedTranscript = (await transcribeAudio(base64Audio, mimeType)).trim();

  if (!generatedTranscript) {
    return NextResponse.json(
      {
        status: "failed",
        error: { code: "EMPTY_TRANSCRIPT", message: "unable to decode transcript from audio" }
      },
      { status: 422 }
    );
  }

  return toDoneResponse(generatedTranscript, started, "audio");
}

export async function POST(request: Request) {
  const started = Date.now();

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const transcript = String(form.get("transcript") || "").trim();
      const file = form.get("audio");

      if (file instanceof File) {
        if (!canUseModel(request)) {
          return NextResponse.json(
            {
              status: "failed",
              error: { code: "MODEL_DISABLED", message: "audio transcription requires demo token and model access" }
            },
            { status: 403 }
          );
        }

        const mimeType = file.type || "audio/mpeg";
        const validation = validateAudioInput(mimeType, file.size);
        if (!validation.ok) {
          return NextResponse.json(
            {
              status: "failed",
              error: { code: validation.code, message: validation.message }
            },
            { status: validation.status }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");
        return await transcribeFromAudio(base64Audio, mimeType, started);
      }

      if (transcript) {
        return toDoneResponse(transcript, started, "text");
      }

      return NextResponse.json(
        {
          status: "failed",
          error: { code: "EMPTY_INPUT", message: "transcript or audio file is required" }
        },
        { status: 400 }
      );
    }

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          status: "failed",
          error: { code: "UNSUPPORTED_CONTENT_TYPE", message: "Use JSON or multipart/form-data payload" }
        },
        { status: 415 }
      );
    }

    const body = (await request.json()) as TranscribeRequest;
    const audioBase64 = (body.audioBase64 || "").trim();
    const transcript = (body.transcript || "").trim();

    if (audioBase64) {
      if (!canUseModel(request)) {
        return NextResponse.json(
          {
            status: "failed",
            error: { code: "MODEL_DISABLED", message: "audio transcription requires demo token and model access" }
          },
            { status: 403 }
          );
      }

      const parsedAudio = parseAudioInput(audioBase64, body.audioMimeType);
      return await transcribeFromAudio(parsedAudio.base64, parsedAudio.mimeType, started);
    }

    if (transcript) {
      return toDoneResponse(transcript, started, "text");
    }

    return NextResponse.json(
      {
        status: "failed",
        error: { code: "EMPTY_INPUT", message: "transcript or audioBase64 is required" }
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "failed",
        error: { code: "TRANSCRIBE_ERROR", message: error instanceof Error ? error.message : "unknown error" }
      },
      { status: 500 }
    );
  }
}
