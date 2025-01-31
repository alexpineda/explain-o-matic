import { z } from "zod";

export type SectionAnalysis = z.infer<typeof sectionAnalysisSchema>;

export const sectionAnalysisSchema = z.object({
  name: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  summary: z.string(),
});

export const sectionSchema = z.object({
  analysis: sectionAnalysisSchema,
  code: z.string(),
});

export type Section = z.infer<typeof sectionSchema>;
