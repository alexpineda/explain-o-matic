import * as vscode from "vscode";

export const createNextButton = () => {
  const button = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  button.text = "$(arrow-right) Next Section";
  button.command = "codeReview.next";
  return button;
};

export const createStopButton = () => {
  const button = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    99
  );
  button.text = "$(circle-slash) Stop Review";
  button.command = "codeReview.stop";
  return button;
};

export const createStatusIndicator = () => {
  const indicator = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    98
  );
  indicator.text = "$(sync~spin) Processing";
  indicator.hide();
  return indicator;
};
