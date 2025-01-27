import * as vscode from "vscode";
import {
  detectSections,
  thinkAboutCode,
  UserAbortedError,
  type Section,
} from "./llm";
import { CodeReviewManager } from "./manager";
import { stopSpeech } from "./tts";
import { SectionTreeProvider } from "./sectionTree";
import { basename } from "path";

let manager: CodeReviewManager | undefined;
let nextButton: vscode.StatusBarItem;
export let stopButton: vscode.StatusBarItem;
export let statusIndicator: vscode.StatusBarItem;

const outputChannel = vscode.window.createOutputChannel("Explain-o-matic");

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
        statusIndicator.text = "$(sync~spin) Processing sections";
        statusIndicator.show();

        const { thoughts, error } = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Thinking about ${basename(
              editor.document.fileName
            )} (one sec)`,
            cancellable: true,
          },
          async (_progress, token) => {
            return await thinkAboutCode(code, token);
          }
        );

        if (error instanceof UserAbortedError) {
          vscode.window.showInformationMessage("Continuing without thinking");
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

            if (lineCount > 1_000) {
              const proceed = await vscode.window.showWarningMessage(
                "Large file detected. Review may be slow.",
                "Continue",
                "Cancel"
              );
              if (proceed !== "Continue") return;
            }

            outputChannel.appendLine(code);
            const { sections, error } = await detectSections(
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

            // In highlightCurrentSection()
            if (!sections || sections.length === 0) {
              vscode.window.showErrorMessage("No sections detected!");
              return;
            }

            // After getting sections from LLM
            if (!sections.every((s) => s.startLine < s.endLine)) {
              throw new Error("Invalid line numbers: startLine >= endLine");
            }

            // Initialize manager
            manager = new CodeReviewManager(editor, sections);
            sectionTreeProvider.updateSections(sections);
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

  const breakdownSectionCommand = vscode.commands.registerCommand(
    "codeReview.breakdownSection",
    (section: Section) => {
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

  context.subscriptions.push(
    startCommand,
    nextCommand,
    stopCommand,
    breakdownSectionCommand,
    nextButton,
    stopButton,
    statusIndicator,
    jumpToSectionCommand
  );
}

export function deactivate() {
  if (manager) manager.dispose();
}
