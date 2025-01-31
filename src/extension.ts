import * as vscode from "vscode";
import { SectionInteractionManager } from "./section-interaction-manager";
import { SectionTreeProvider } from "./elements/section-tree";
import * as cmds from "./commands";
import * as elements from "./elements/statusbar";
import * as shortcuts from "./elements/context";
import * as config from "./config";
import { getThoughts } from "./functions/get-thoughts";
import type { FileCode } from "./types";
import { getSections } from "./functions/get-sections";
import { basename } from "path";
import { outputChannel } from "./elements/output-channel";

let manager: SectionInteractionManager | undefined;

export function activate(context: vscode.ExtensionContext) {
  shortcuts.disableCodeReview();

  const sectionTreeProvider = new SectionTreeProvider();
  const treeView = vscode.window.registerTreeDataProvider(
    "codeReviewTree",
    sectionTreeProvider
  );

  const stopReview = () => {
    if (manager) {
      manager.stop();
      manager = undefined;
      nextButton.hide();
      stopButton.hide();
      shortcuts.disableCodeReview();
    }
  };

  const startCommand = cmds.startCommand(async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found");
      return;
    }

    try {
      const fileCode: FileCode = {
        code: editor.document.getText(),
        fileName: basename(editor.document.fileName),
      };

      if (fileCode.code.split("\n").length > config.fileSizeWarningThreshold) {
        const proceed = await vscode.window.showWarningMessage(
          "Large file detected. Review may be slow.",
          "Continue",
          "Cancel"
        );
        if (proceed !== "Continue") return;
      }
      // Show processing status
      statusIndicator.text = "$(sync~spin) Explain-o-matic";
      statusIndicator.show();

      let thoughts: string | undefined = undefined;

      if (config.useReasoner) {
        thoughts = await getThoughts(fileCode);
      }

      const sections = await getSections(fileCode, thoughts);
      if (!sections) {
        statusIndicator.hide();
        return;
      }

      manager = new SectionInteractionManager(editor, sectionTreeProvider);
      manager.setSections(sections);
      manager.next(); // Highlight first section

      nextButton.show();
      stopButton.show();

      shortcuts.enableCodeReview();
    } catch (error) {
      manager?.dispose();
      outputChannel.appendLine(`Code review failed: ${(error as Error).stack}`);
      vscode.window.showErrorMessage(`Code review failed: ${error}`);
    } finally {
      statusIndicator.hide();
    }
  });

  const breakdownSectionCommand = cmds.breakdownSectionCommand(
    async ({ section }) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }
      if (!manager) {
        vscode.window.showErrorMessage("No active code review session");
        return;
      }

      try {
        const code = editor.document.getText();
        const fileCode: FileCode = {
          code: code
            .split("\n")
            .slice(section.analysis.startLine, section.analysis.endLine)
            .join("\n"),
          fileName: section.analysis.name,
        };
        // Show processing status
        statusIndicator.text = "$(sync~spin) Explain-o-matic";
        statusIndicator.show();

        let thoughts: string | undefined = undefined;

        if (config.useReasoner) {
          thoughts = await getThoughts(fileCode);
        }

        const sections = await getSections(fileCode, thoughts);
        if (!sections) {
          statusIndicator.hide();
          return;
        }

        const children = manager.addChildren(sections, section);
        manager.jumpTo(children[0]);
      } catch (error) {
        vscode.window.showErrorMessage(`Code review failed: ${error}`);
      } finally {
        statusIndicator.hide();
      }
    }
  );

  const nextCommand = cmds.nextCommand(() => {
    if (manager) manager.next();
  });
  const stopCommand = cmds.stopCommand(stopReview);

  const jumpToSectionCommand = cmds.jumpToSectionCommand((section) => {
    if (manager) manager.jumpTo(section);
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
    windowChangeHandler,
    treeView
  );
}

export function deactivate() {
  if (manager) manager.dispose();
}
