export type Segment = {
  startSec: number;
  endSec: number;
  text: string;
  speaker?: string;
};

export type Highlight = {
  startSec: number;
  endSec: number;
  quote: string;
  reason: string;
  score: number;
};

export type OpenAIResponseText = {
  text: string;
  raw?: unknown;
};
