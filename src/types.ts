import { z } from "zod";

export type SectionAnalysis = z.infer<typeof sectionAnalysisSchema>;

export const sectionAnalysisSchema = z.object({
  name: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  summary: z.string(),
});

export const sectionSchema: z.ZodType<Section> = z.lazy(() =>
  z.object({
    analysis: sectionAnalysisSchema,
    code: z.string(),
    children: z.array(sectionSchema),
  })
);

export type Section = {
  analysis: SectionAnalysis;
  code: string;
  children: Section[];
};

export type FileCode = {
  code: string;
  fileName: string;
};
