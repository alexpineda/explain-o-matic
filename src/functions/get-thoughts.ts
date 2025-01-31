import { UserAbortedError } from "../utils";
import * as vscode from "vscode";
import { outputChannel } from "../elements/output-channel";
import { reasonAboutCode } from "../llm";
import type { FileCode } from "../types";

export const getThoughts = async (fileCode: FileCode) => {
  const { thoughts, error } = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Reasoning about ${fileCode.fileName} (one sec)`,
      cancellable: true,
    },
    async (_progress, token) => {
      return await reasonAboutCode(fileCode.code, token);
    }
  );
  if (error instanceof UserAbortedError) {
    vscode.window.showInformationMessage("Skipping reasoning.");
  }

  if (error && !(error instanceof UserAbortedError)) {
    outputChannel.appendLine(`Thinking failed: ${error}`);
    const proceed = await vscode.window.showWarningMessage(
      "Thinking failed. Continue?",
      "Continue",
      "Cancel"
    );
    if (proceed !== "Continue") {
      vscode.window.showErrorMessage(`Thinking failed: ${error}`);
      return;
    }
  }
  return thoughts;
};
