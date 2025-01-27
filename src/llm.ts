import { openai } from "@ai-sdk/openai";
import { generateObject, generateText, type CoreMessage } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { z } from "zod";
import * as vscode from "vscode";

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

    const response = await generateText({
      abortSignal: controller.signal,
      maxTokens: 1,
      model: deepseek("deepseek-reasoner"),
      system: `You are a software architect. Analyze this code to identify:
  1. Primary responsibilities and boundaries
  2. Key architectural patterns
  3. Critical data flows
  4. Potential maintenance concerns
  5. Cross-component dependencies`,
      prompt: `Code to analyze:
  ${code}
  
  Provide concise analysis in this format:
  ### Core Purpose
  - [Main responsibility of the code]
  
  ### Architectural Patterns
  - [Pattern 1 with justification]
  - [Pattern 2 with justification]
  
  ### Critical Boundaries
  - [Key interface/abstraction]
  - [Important data contracts]
  
  ### Review Focus Areas
  - [Potential stability risks]
  - [Important compatibility considerations]`,
    });

    return {
      thoughts: response.reasoning + "\n\n" + response.text,
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

export async function detectSections(
  code: string,
  thoughts?: string,
  token?: vscode.CancellationToken
): Promise<{ sections?: Section[]; error?: Error }> {
  const thinkingMessages: Array<CoreMessage> =
    thoughts === undefined
      ? []
      : [
          {
            role: "user",
            content: `Analyze this TypeScript code for meaningful review sections.
CODE:
${code}

GUIDELINES:
1. For interfaces: Explain their ROLE in the system
2. For config objects: Note DEFAULT VALUES/OVERRIDES
3. For types: Highlight TYPE RELATIONSHIPS
4. For functions: Identify CRITICAL LOGIC paths

EXAMPLE OUTPUT FOR SETTINGS INTERFACE:
{
"name": "Versioned configuration",
"startLine": 3,
"endLine": 43,
"summary": "V5 settings maintaining backward compatibility with deprecated map directories"
}`,
          },
          {
            role: "assistant",
            content: thoughts,
          },
        ];

  const codeLines = code.split("\n");
  const messages: Array<CoreMessage> = [
    ...thinkingMessages,
    {
      role: "user",
      content: `Analyze this TypeScript code for meaningful review sections.
CODE:
${codeLines.map((line, index) => `${index + 1}: ${line}`).join("\n")}

GUIDELINES:
1. For interfaces: Explain their ROLE in the system
2. For config objects: Note DEFAULT VALUES/OVERRIDES
3. For types: Highlight TYPE RELATIONSHIPS
4. For functions: Identify CRITICAL LOGIC paths

EXAMPLE OUTPUT FOR SETTINGS INTERFACE:
{
"name": "Versioned configuration",
"startLine": 3,
"endLine": 43,
"summary": "V5 settings maintaining backward compatibility with deprecated map directories"
}`,
    },
  ];

  try {
    const controller = new AbortController();
    token?.onCancellationRequested(() => {
      controller.abort();
    });
    const response = await generateObject({
      abortSignal: controller.signal,
      model: deepseek("deepseek-coder"),
      system: `You are a code review expert. Analyze code structure and create sections that:
  1. Explain WHY code exists, not just WHAT it does
  2. Highlight architectural patterns
  3. Identify configuration relationships
  4. Note potential review focus areas
  
  BAD SUMMARY: "User interface definition"
  GOOD SUMMARY: "Core user data structure with email validation rules"
  
  BAD SECTION:
  {
    "name": "Settings Interface",
    "startLine": 15,
    "endLine": 10,
    "summary": "Defines settings type"
  }
  
  GOOD SECTION:
  {
    "name": "Graphics configuration",
    "startLine": 23,
    "endLine": 28,
    "summary": "HD/3D rendering flags with fallback to legacy SD modes"
  }`,
      messages,
      schema: z.object({
        sections: z.array(
          z.object({
            name: z.string(),
            startLine: z.number().int().positive(),
            endLine: z.number().int().positive(),
            summary: z
              .string()
              .describe("Contextual purpose, not just type names"),
          })
        ),
      }),
    });

    // Post-process to merge overlapping sections
    // const merged = response.object.sections.reduce((acc, section) => {
    //   const last = acc[acc.length - 1];
    //   if (last?.endLine >= section.startLine) {
    //     last.endLine = Math.max(last.endLine, section.endLine);
    //     last.summary = `${last.summary} | ${section.summary}`;
    //   } else {
    //     acc.push(section);
    //   }
    //   return acc;
    // }, [] as Section[]);

    return { sections: response.object.sections, error: undefined };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { sections: undefined, error: new UserAbortedError() };
    }
    return { sections: undefined, error: error as Error };
  }
}
export interface Section {
  name: string;
  startLine: number;
  endLine: number;
  summary: string;
}
