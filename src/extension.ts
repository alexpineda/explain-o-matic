// src/extension.ts
import * as vscode from "vscode";
import { detectSections, thinkAboutCode } from "./llm";
import { CodeReviewManager } from "./manager";
import { stopSpeech } from "./tts";

let manager: CodeReviewManager | undefined;
let nextButton: vscode.StatusBarItem;
let stopButton: vscode.StatusBarItem;
let statusIndicator: vscode.StatusBarItem;

const outputChannel = vscode.window.createOutputChannel(
  "Code Review Companion"
);

export function activate(context: vscode.ExtensionContext) {
  // Start code review
  const startCommand = vscode.commands.registerCommand(
    "codeReview.start",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      try {
        const code = editor.document.getText();
        // Show processing status
        statusIndicator.text = "$(sync~spin) Processing sections";
        statusIndicator.show();

        let thoughts: string | undefined;
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Thinking about this (one sec)...",
            cancellable: false,
          },
          async () => {
            const { thoughts: thoughts_ } = await thinkAboutCode(code);
            thoughts = thoughts_;
          }
        );

        // Add progress notification
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Finalizing your explanation...",
            cancellable: false,
          },
          async () => {
            const lineCount = code.split("\n").length;
            outputChannel.appendLine(`Processing file with ${lineCount} lines`);

            if (lineCount === 0) {
              vscode.window.showErrorMessage("File is empty!");
              return;
            }

            if (lineCount > 10_000) {
              const proceed = await vscode.window.showWarningMessage(
                "Large file detected. Review may be slow.",
                "Continue",
                "Cancel"
              );
              if (proceed !== "Continue") return;
            }

            outputChannel.appendLine(code);
            const { sections } = await detectSections(code);
            outputChannel.appendLine(JSON.stringify(sections));

            // In highlightCurrentSection()
            if (sections.length === 0) {
              vscode.window.showErrorMessage("No sections detected!");
              return;
            }

            // After getting sections from LLM
            if (!sections.every((s) => s.startLine < s.endLine)) {
              throw new Error("Invalid line numbers: startLine >= endLine");
            }

            // Initialize manager
            manager = new CodeReviewManager(editor, sections);
            manager.nextSection(); // Highlight first section

            // Show status bar controls
            nextButton.show();
            stopButton.show();
          }
        );

        statusIndicator.hide();
      } catch (error) {
        statusIndicator.hide();
        vscode.window.showErrorMessage(`Code review failed: ${error}`);
      }
    }
  );

  // Next section command
  const nextCommand = vscode.commands.registerCommand("codeReview.next", () => {
    if (manager) manager.nextSection();
  });

  // Stop command
  const stopCommand = vscode.commands.registerCommand("codeReview.stop", () => {
    stopSpeech();
    if (manager) {
      manager.stop();
      manager = undefined;
      nextButton.hide();
      stopButton.hide();
    }
  });

  // Create status bar buttons
  nextButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  nextButton.text = "$(arrow-right) Next";
  nextButton.command = "codeReview.next";

  stopButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    99
  );
  stopButton.text = "$(circle-slash) Stop";
  stopButton.command = "codeReview.stop";

  // Create status indicator
  statusIndicator = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    98
  );
  statusIndicator.text = "$(sync~spin) Processing";
  statusIndicator.hide();

  context.subscriptions.push(
    startCommand,
    nextCommand,
    stopCommand,
    nextButton,
    stopButton,
    statusIndicator
  );
}

export function deactivate() {
  if (manager) manager.dispose();
}
