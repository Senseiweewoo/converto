import { ZodSchema } from 'zod';

export type Role = 'system' | 'user' | 'assistant';

export interface AiMessage {
  role: Role;
  content: string;
}

export interface AiCompletionRequest {
  system: string;
  messages: AiMessage[];
  schema?: ZodSchema<any>;
  maxTokens?: number;
  temperature?: number;
}

export interface AiCompletionResult {
  content: string;
  parsed?: any;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
}

export interface AiProvider {
  id: string;
  name: string;
  complete(req: AiCompletionRequest): Promise<AiCompletionResult>;
  embed?(texts: string[]): Promise<number[][]>;
}

export interface BoundingBox {
  page: number; // 1-indexed
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Citation {
  page: number;
  bbox?: BoundingBox;
  quote: string;
}

export type PiiCategory =
  | 'email'
  | 'phone'
  | 'credit-card'
  | 'iban'
  | 'national-id'
  | 'name'
  | 'address'
  | 'date-of-birth';

export interface PiiDetection {
  id: string;
  category: PiiCategory;
  text: string;
  confidence: number; // 0.0 to 1.0
  page: number;
  bbox?: BoundingBox;
  approved: boolean; // default true for deterministic hits, reviewed by user
}
