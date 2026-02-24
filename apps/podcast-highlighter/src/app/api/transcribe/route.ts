import { segmentTranscript } from "@repo/ai-core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const started = Date.now();

  try {
    const contentType = request.headers.get("content-type") || "";

    // MVP phase: JSON transcript input. Audio upload can be attached next.
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { transcript?: string };
      const transcript = (body.transcript || "").trim();

      if (!transcript) {
        return NextResponse.json(
          {
            status: "failed",
            error: { code: "EMPTY_TRANSCRIPT", message: "transcript is required" }
          },
          { status: 400 }
        );
      }

      const segments = segmentTranscript(transcript);
      return NextResponse.json({
        status: "done",
        transcript,
        segments,
        latencyMs: Date.now() - started
      });
    }

    return NextResponse.json(
      {
        status: "failed",
        error: { code: "UNSUPPORTED_CONTENT_TYPE", message: "Use JSON transcript in MVP" }
      },
      { status: 415 }
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
