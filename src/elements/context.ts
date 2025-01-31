import * as vscode from "vscode";
export const enableCodeReview = async () =>
  await vscode.commands.executeCommand(
    "setContext",
    "codeReview:isActive",
    true
  );

export const disableCodeReview = async () =>
  await vscode.commands.executeCommand(
    "setContext",
    "codeReview:isActive",
    false
  );
