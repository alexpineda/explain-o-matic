import * as vscode from "vscode";
import { SECTION_SYSTEM_PROMPT, SECTION_USER_PROMPT } from "./prompts";
import { outputChannel } from "../elements/output-channel";
import { createReasonerModel } from "./models";
import { generateText } from "ai";
import { UserAbortedError } from "../utils";

export async function reasonAboutCode(
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
