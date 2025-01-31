import * as vscode from "vscode";
import { sectionCode, reasonAboutCode } from "./llm";
import { SectionInteractionManager } from "./section-interaction-manager";
import { SectionTreeProvider } from "./elements/section-tree";
import { basename } from "path";
import { outputChannel } from "./elements/output-channel";
import { fileSizeWarningThreshold, useReasoner } from "./config";
import { UserAbortedError } from "./utils";
import * as cmds from "./commands";
import * as elements from "./elements/statusbar";

let manager: SectionInteractionManager | undefined;

export function activate(context: vscode.ExtensionContext) {
  const sectionTreeProvider = new SectionTreeProvider();
  vscode.window.registerTreeDataProvider(
    "codeReview.sections",
    sectionTreeProvider
  );

  const stopReview = () => {
    if (manager) {
      manager.stop();
      manager = undefined;
      nextButton.hide();
      stopButton.hide();
    }
  };

  const startCommand = cmds.startCommand(async () => {
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
        const { thoughts: _thoughts, error } = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Reasoning about ${basename(
              editor.document.fileName
            )} (one sec)`,
            cancellable: true,
          },
          async (_progress, token) => {
            return await reasonAboutCode(code, token);
          }
        );
        thoughts = _thoughts;

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
      }

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

          // outputChannel.appendLine(code);
          const { sections, error } = await sectionCode(code, thoughts, token);
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

          manager = new SectionInteractionManager(editor, sectionTreeProvider);
          manager.setSections(sections);
          manager.next(); // Highlight first section

          nextButton.show();
          stopButton.show();
        }
      );

      statusIndicator.hide();
    } catch (error) {
      statusIndicator.hide();
      vscode.window.showErrorMessage(`Code review failed: ${error}`);
    }
  });

  const nextCommand = cmds.nextCommand(() => {
    if (manager) manager.next();
  });
  const stopCommand = cmds.stopCommand(stopReview);

  const jumpToSectionCommand = cmds.jumpToSectionCommand((section) => {
    if (manager) manager.jumpTo(section);
  });
  // todo
  const breakdownSectionCommand = cmds.breakdownSectionCommand((section) => {
    console.log(section);
  });

  const windowChangeHandler = vscode.window.onDidChangeActiveTextEditor(() => {
    stopReview();
  });

  const nextButton = elements.createNextButton();
  const stopButton = elements.createStopButton();
  const statusIndicator = elements.createStatusIndicator();

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
