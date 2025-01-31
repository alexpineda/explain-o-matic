import "source-map-support/register"; // Add this line
import * as vscode from "vscode";
import {
  sectionCode,
  thinkAboutCode,
  UserAbortedError,
  type Section,
  type SectionAnalysis,
} from "./llm";
import { CodeReviewManager } from "./manager";
import { SectionTreeProvider } from "./sectionTree";
import { basename } from "path";
import { outputChannel } from "./output-channel";
import { fileSizeWarningThreshold, useReasoner } from "./config";

let manager: CodeReviewManager | undefined;
let nextButton: vscode.StatusBarItem;
export let stopButton: vscode.StatusBarItem;
export let statusIndicator: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const sectionTreeProvider = new SectionTreeProvider();
  vscode.window.registerTreeDataProvider(
    "codeReview.sections",
    sectionTreeProvider
  );
  // Start code review
  const startCommand = vscode.commands.registerCommand(
    "codeReview.start",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }

      try {
        const code = editor.document.getText();
        // Show processing status
        statusIndicator.text = "$(sync~spin) Explain-o-matic";
        statusIndicator.show();

        let thoughts: string | undefined = undefined;

        if (useReasoner) {
          const { thoughts: _thoughts, error } =
            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: `Reasoning about ${basename(
                  editor.document.fileName
                )} (one sec)`,
                cancellable: true,
              },
              async (_progress, token) => {
                return await thinkAboutCode(code, token);
              }
            );
          thoughts = _thoughts;

          if (error instanceof UserAbortedError) {
            vscode.window.showInformationMessage("Skipping reasoning.");
          }

          if (error && !(error instanceof UserAbortedError)) {
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
        }

        // Add progress notification
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Breaking it down for you...",
            cancellable: true,
          },
          async (_progress, token) => {
            const lineCount = code.split("\n").length;
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

            outputChannel.appendLine(code);
            const { sections, error } = await sectionCode(
              code,
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
            outputChannel.appendLine(JSON.stringify(sections));

            if (!sections || sections.length === 0) {
              vscode.window.showErrorMessage("No sections detected!");
              return;
            }

            manager = new CodeReviewManager(editor, sections);
            sectionTreeProvider.updateSections(sections);
            manager.nextSection(); // Highlight first section

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

  const nextCommand = vscode.commands.registerCommand("codeReview.next", () => {
    if (manager) manager.nextSection();
  });

  const stop = () => {
    if (manager) {
      manager.stop();
      manager = undefined;
      nextButton.hide();
      stopButton.hide();
    }
  };
  // Stop command
  const stopCommand = vscode.commands.registerCommand("codeReview.stop", () => {
    stop();
  });

  const breakdownSectionCommand = vscode.commands.registerCommand(
    "codeReview.breakdownSection",
    (section: SectionAnalysis) => {
      console.log(section);
    }
  );
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

  const jumpToSectionCommand = vscode.commands.registerCommand(
    "codeReview.jumpToSection",
    (section: Section) => {
      if (manager) manager.jumpToSection(section);
    }
  );

  const windowChangeHandler = vscode.window.onDidChangeActiveTextEditor(() => {
    stop();
  });

  context.subscriptions.push(
    startCommand,
    nextCommand,
    stopCommand,
    breakdownSectionCommand,
    nextButton,
    stopButton,
    statusIndicator,
    jumpToSectionCommand,
    windowChangeHandler
  );
}

export function deactivate() {
  if (manager) manager.dispose();
}
