export interface WorkspaceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data: Uint8Array;
  pageCount?: number;
  thumbnailUrl?: string;
  parentVersionId?: string;
}

export interface RunContext {
  onProgress?: (percent: number, stepText?: string) => void;
  signal?: AbortSignal;
}

export interface ToolResultMetrics {
  originalSize: number;
  finalSize: number;
  pageCount: number;
  durationMs: number;
}

export interface ToolResult {
  files: WorkspaceFile[];
  summary: string;
  warnings?: string[];
  suggestedNext?: string[];
  metrics?: ToolResultMetrics;
}

export interface PageGeometry {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}
