import { z } from 'zod';

export const mergeSettingsSchema = z.object({});
export type MergeSettings = z.infer<typeof mergeSettingsSchema>;

export const splitSettingsSchema = z.object({
  mode: z.enum(['ranges', 'every-n', 'extract-all']).default('ranges'),
  ranges: z.string().default('1-2'),
  everyN: z.number().int().min(1).default(1),
  mergeRangesIntoOne: z.boolean().default(false),
});
export type SplitSettings = z.infer<typeof splitSettingsSchema>;

export const compressSettingsSchema = z.object({
  preset: z.enum(['basic', 'strong', 'extreme']).default('basic'),
  removeMetadata: z.boolean().default(true),
});
export type CompressSettings = z.infer<typeof compressSettingsSchema>;

export const rotateSettingsSchema = z.object({
  angle: z.union([z.literal(90), z.literal(180), z.literal(270)]).default(90),
  pages: z.string().default('all'), // 'all' | 'odd' | 'even' | '1, 3-5'
});
export type RotateSettings = z.infer<typeof rotateSettingsSchema>;

export const pageNumbersSettingsSchema = z.object({
  position: z
    .enum([
      'bottom-center',
      'bottom-right',
      'bottom-left',
      'top-center',
      'top-right',
      'top-left',
    ])
    .default('bottom-center'),
  format: z.enum(['page-only', 'page-of-total', 'slash']).default('page-of-total'),
  fontSize: z.number().min(6).max(24).default(10),
  margin: z.number().min(5).max(100).default(25),
  startFrom: z.number().int().default(1),
  pages: z.string().default('all'), // 'all' | 'exclude-first' | '1-10'
});
export type PageNumbersSettings = z.infer<typeof pageNumbersSettingsSchema>;

export const watermarkSettingsSchema = z.object({
  type: z.enum(['text', 'image']).default('text'),
  text: z.string().default('CONFIDENTIAL'),
  fontSize: z.number().min(10).max(120).default(48),
  opacity: z.number().min(0.05).max(1.0).default(0.2),
  rotation: z.number().min(-90).max(90).default(45),
  colorHex: z.string().default('#ff0000'),
  pages: z.string().default('all'),
});
export type WatermarkSettings = z.infer<typeof watermarkSettingsSchema>;

export const imagesToPdfSettingsSchema = z.object({
  pageSize: z.enum(['A4', 'LETTER', 'FIT_IMAGE']).default('A4'),
  orientation: z.enum(['portrait', 'landscape', 'auto']).default('auto'),
  margin: z.number().min(0).max(100).default(20),
});
export type ImagesToPdfSettings = z.infer<typeof imagesToPdfSettingsSchema>;

export const pdfToImagesSettingsSchema = z.object({
  format: z.enum(['png', 'jpeg']).default('png'),
  quality: z.number().min(0.1).max(1.0).default(0.92),
  dpi: z.number().min(72).max(300).default(150),
});
export type PdfToImagesSettings = z.infer<typeof pdfToImagesSettingsSchema>;

export const protectSettingsSchema = z.object({
  password: z.string().min(1, 'Password is required to protect the document'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
export type ProtectSettings = z.infer<typeof protectSettingsSchema>;

export const unlockSettingsSchema = z.object({
  password: z.string().min(1, 'Enter the password to unlock this document'),
});
export type UnlockSettings = z.infer<typeof unlockSettingsSchema>;

export const organizeSettingsSchema = z.object({
  pages: z
    .array(
      z.object({
        id: z.string(),
        sourcePageIndex: z.number().optional(),
        rotation: z.number().optional(),
        isBlank: z.boolean().optional(),
      })
    )
    .default([]),
});
export type OrganizeSettings = z.infer<typeof organizeSettingsSchema>;

export const compressToTargetSettingsSchema = z.object({
  preset: z.enum(['job-portal', 'government-form', 'visa-upload', 'email-attachment', 'whatsapp', 'custom']).default('job-portal'),
  customTargetKb: z.number().min(50).max(50000).default(500),
});
export type CompressToTargetSettings = z.infer<typeof compressToTargetSettingsSchema>;

export const signPdfSettingsSchema = z.object({
  typedSignatureText: z.string().default('John Doe'),
  placementMode: z.enum(['coordinates', 'sign-all-pages', 'initial-every-page']).default('sign-all-pages'),
});
export type SignPdfSettings = z.infer<typeof signPdfSettingsSchema>;

export const redactPdfSettingsSchema = z.object({
  redactLabel: z.string().default('[REDACTED]'),
  color: z.enum(['black', 'white']).default('black'),
  scrubMetadata: z.boolean().default(true),
});
export type RedactPdfSettings = z.infer<typeof redactPdfSettingsSchema>;

export const formsPdfSettingsSchema = z.object({
  flatten: z.boolean().default(true),
});
export type FormsPdfSettings = z.infer<typeof formsPdfSettingsSchema>;

export const smartFixSettingsSchema = z.object({
  autoFixEverything: z.boolean().default(true),
});
export type SmartFixSettings = z.infer<typeof smartFixSettingsSchema>;

// Expanded Operations Schemas
export const removePagesSettingsSchema = z.object({
  pagesToRemove: z.string().default('2'),
});
export type RemovePagesSettings = z.infer<typeof removePagesSettingsSchema>;

export const extractPagesSettingsSchema = z.object({
  pagesToExtract: z.string().default('1'),
  separateFiles: z.boolean().default(false),
});
export type ExtractPagesSettings = z.infer<typeof extractPagesSettingsSchema>;

export const cropSettingsSchema = z.object({
  topMargin: z.number().default(20),
  bottomMargin: z.number().default(20),
  leftMargin: z.number().default(20),
  rightMargin: z.number().default(20),
});
export type CropSettings = z.infer<typeof cropSettingsSchema>;

export const repairSettingsSchema = z.object({
  forceReconstruct: z.boolean().default(true),
});
export type RepairSettings = z.infer<typeof repairSettingsSchema>;

export const pdfToPdfaSettingsSchema = z.object({
  conformance: z.enum(['PDF/A-1b', 'PDF/A-2b']).default('PDF/A-1b'),
});
export type PdfToPdfaSettings = z.infer<typeof pdfToPdfaSettingsSchema>;

export const pdfToMarkdownSettingsSchema = z.object({
  preserveHeaders: z.boolean().default(true),
});
export type PdfToMarkdownSettings = z.infer<typeof pdfToMarkdownSettingsSchema>;

export const pdfToWordSettingsSchema = z.object({
  includeFormatting: z.boolean().default(true),
});
export type PdfToWordSettings = z.infer<typeof pdfToWordSettingsSchema>;

export const pdfToExcelSettingsSchema = z.object({
  detectTables: z.boolean().default(true),
});
export type PdfToExcelSettings = z.infer<typeof pdfToExcelSettingsSchema>;

export const pdfToPowerpointSettingsSchema = z.object({
  slidesPerPage: z.number().default(1),
});
export type PdfToPowerpointSettings = z.infer<typeof pdfToPowerpointSettingsSchema>;

export const htmlToPdfSettingsSchema = z.object({
  url: z.string().default(''),
  htmlContent: z.string().default(''),
});
export type HtmlToPdfSettings = z.infer<typeof htmlToPdfSettingsSchema>;

export const editPdfSettingsSchema = z.object({
  text: z.string().default('Approved'),
  colorHex: z.string().default('#059669'),
});
export type EditPdfSettings = z.infer<typeof editPdfSettingsSchema>;

export const deepSanitizerSettingsSchema = z.object({
  wipeMetadata: z.boolean().default(true),
  zeroTimestamps: z.boolean().default(true),
});
export type DeepSanitizerSettings = z.infer<typeof deepSanitizerSettingsSchema>;

export const aiSummarizerSettingsSchema = z.object({
  length: z.enum(['short', 'medium', 'detailed']).default('medium'),
  format: z.enum(['bullet-points', 'executive-summary']).default('bullet-points'),
});
export type AiSummarizerSettings = z.infer<typeof aiSummarizerSettingsSchema>;

export const translatePdfSettingsSchema = z.object({
  targetLanguage: z.string().default('Spanish'),
  preserveFormatting: z.boolean().default(true),
});
export type TranslatePdfSettings = z.infer<typeof translatePdfSettingsSchema>;

export const textToSpeechSettingsSchema = z.object({
  rate: z.number().default(1.0),
  pitch: z.number().default(1.0),
});
export type TextToSpeechSettings = z.infer<typeof textToSpeechSettingsSchema>;

export const bionicReaderSettingsSchema = z.object({
  fixationStrength: z.enum(['low', 'medium', 'high']).default('medium'),
});
export type BionicReaderSettings = z.infer<typeof bionicReaderSettingsSchema>;
