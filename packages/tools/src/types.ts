import { z, ZodSchema } from 'zod';
import { WorkspaceFile, ToolResult, RunContext } from '@converto/core';

export type ToolCategory =
  | 'organize'
  | 'optimize'
  | 'convert-to'
  | 'convert-from'
  | 'edit'
  | 'security'
  | 'intelligence';

export type ToolRuntime = 'local' | 'server' | 'ai';

export interface ConvertoToolMeta<S = any> {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: ToolCategory;
  runtime: ToolRuntime;
  iconName: string;
  inputs: {
    accept: string[];
    min: number;
    max: number;
    maxSizeBytes?: number;
  };
  settingsSchema: ZodSchema<S>;
  defaultSettings: S;
}
