import { generateText, type CoreMessage } from "ai";
import * as vscode from "vscode";
import { SECTION_SYSTEM_PROMPT, SECTION_USER_PROMPT } from "./prompts";
import { outputChannel } from "./output-channel";
import { z } from "zod";
import { sectionerConfig } from "./config";
import { createReasonerModel, createSectionerModel } from "./providers";

export class UserAbortedError extends Error {
  constructor() {
    super("User aborted");
  }
}

export async function thinkAboutCode(
  code: string,
  token: vscode.CancellationToken
): Promise<{ thoughts?: string; error?: Error }> {
  try {
    const controller = new AbortController();
    token?.onCancellationRequested(() => {
      controller.abort();
    });

    outputChannel.appendLine("THINKING");
    const response = await generateText({
      abortSignal: controller.signal,
      maxTokens: 1,
      model: createReasonerModel(),
      system: SECTION_SYSTEM_PROMPT,
      prompt: SECTION_USER_PROMPT(code),
    });
    outputChannel.appendLine("DONE THINKING");

    return {
      thoughts: response.reasoning,
      error: undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        thoughts: undefined,
        error: new UserAbortedError(),
      };
    }
    return {
      thoughts: undefined,
      error: error as Error,
    };
  }
}

/**
 * Detects sections in the code.
 * Outputs as markdown for 2 reasons:
 *  - Support wider array of providers (eg groq)
 *  - It's more stable in generating valid sections ( start < end )
 * @param code The code to detect sections in.
 * @param thoughts Reasoning
 * @param token The cancellation token.
 * @returns The detected sections.
 */
export async function sectionCode(
  code: string,
  thoughts?: string,
  token?: vscode.CancellationToken
): Promise<{ sections?: Section[]; error?: Error }> {
  try {
    const controller = new AbortController();
    token?.onCancellationRequested(() => {
      controller.abort();
    });
    const response = await generateText({
      abortSignal: controller.signal,
      model: createSectionerModel(),
      system: SECTION_SYSTEM_PROMPT,
      temperature: sectionerConfig.temperature,
      messages:
        thoughts === undefined
          ? ([
              {
                role: "user",
                content: SECTION_USER_PROMPT(code),
              },
            ] satisfies CoreMessage[])
          : ([
              {
                role: "user",
                content: SECTION_USER_PROMPT(code),
              },
              {
                role: "assistant",
                content: thoughts,
              },
              {
                role: "user",
                content: "Only output the code blocks. No other text.",
              },
            ] satisfies CoreMessage[]),
    });

    outputChannel.appendLine(response.text);

    const sections = response.text
      .split("```section")
      .filter((s) => s.trim())
      .map((section) => {
        const [frontMatter, code] = section.split("---");
        outputChannel.appendLine(JSON.stringify({ frontMatter, code }));
        const analysis = frontMatter
          .split("\n")
          .filter((n) => n.trim())
          .reduce((acc, line) => {
            const [key, value] = line.split(":");
            return {
              ...acc,
              [key.trim()]: ["startLine", "endLine"].includes(key)
                ? Number(value.trim())
                : value.trim(),
            };
          }, {} as SectionAnalysis);
        if (analysis.startLine >= analysis.endLine) {
          return null;
        }
        outputChannel.appendLine(JSON.stringify({ analysis, code }));
        try {
          return sectionSchema.parse({
            analysis,
            code,
          });
        } catch (e) {
          throw e;
        }
      })
      .filter((s) => s !== null);

    outputChannel.appendLine(JSON.stringify(sections));
    // After getting sections from LLM
    if (!sections.every((s) => s.analysis.startLine < s.analysis.endLine)) {
      throw new Error("Invalid line numbers: startLine >= endLine");
    }

    return { sections, error: undefined };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { sections: undefined, error: new UserAbortedError() };
    }
    return { sections: undefined, error: error as Error };
  }
}
export type SectionAnalysis = z.infer<typeof sectionAnalysisSchema>;

const sectionAnalysisSchema = z.object({
  name: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  summary: z.string(),
});

const sectionSchema = z.object({
  analysis: sectionAnalysisSchema,
  code: z.string(),
});

export type Section = z.infer<typeof sectionSchema>;
