import * as vscode from "vscode";
import type { Section } from "./types";

export const nextCommand = (cb: () => void) =>
  vscode.commands.registerCommand("codeReview.next", cb);

export const stopCommand = (cb: () => void) =>
  vscode.commands.registerCommand("codeReview.stop", cb);

export const breakdownSectionCommand = (cb: (section: Section) => void) =>
  vscode.commands.registerCommand("codeReview.breakdownSection", cb);

export const jumpToSectionCommand = (cb: (section: Section) => void) =>
  vscode.commands.registerCommand("codeReview.jumpToSection", cb);

// Start code review
export const startCommand = (cb: () => void) =>
  vscode.commands.registerCommand("codeReview.start", cb);
