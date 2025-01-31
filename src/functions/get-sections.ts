import * as vscode from "vscode";
import { sectionCode } from "../llm";
import { UserAbortedError } from "../utils";
import { outputChannel } from "../elements/output-channel";
import type { FileCode } from "../types";
import { fileSizeWarningThreshold } from "../config";

export const getSections = async (fileCode: FileCode, thoughts?: string) => {
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Breaking it down for you...",
      cancellable: true,
    },
    async (_progress, token) => {
      const lineCount = fileCode.code.split("\n").length;
      outputChannel.appendLine(`Processing file with ${lineCount} lines`);

      if (lineCount === 0) {
        vscode.window.showErrorMessage("File is empty!");
        return;
      }

      if (lineCount > fileSizeWarningThreshold) {
        const proceed = await vscode.window.showWarningMessage(
          "Large file detected. Review may be slow.",
          "Continue",
          "Cancel"
        );
        if (proceed !== "Continue") return;
      }

      // outputChannel.appendLine(code);
      const { sections, error } = await sectionCode(
        fileCode.code,
        thoughts,
        token
      );
      if (error instanceof UserAbortedError) {
        return;
      }
      if (error) {
        vscode.window.showErrorMessage(`Code review failed: ${error}`);
        return;
      }
      // outputChannel.appendLine(JSON.stringify(sections));

      if (!sections || sections.length === 0) {
        vscode.window.showErrorMessage("No sections detected!");
        return;
      }
      return sections;
    }
  );
};
