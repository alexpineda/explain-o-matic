// src/manager.ts
import * as vscode from "vscode";
import type { Section } from "./llm";
import { speak, stopSpeech } from "./tts";

export class CodeReviewManager {
  private currentSection = -1;
  private sections: Section[] = [];
  private highlightDecoration: vscode.TextEditorDecorationType;
  private editor: vscode.TextEditor;

  constructor(editor: vscode.TextEditor, sections: Section[]) {
    this.editor = editor;
    this.sections = sections;

    // Configure decoration
    this.highlightDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255,240,0,0.3)",
      isWholeLine: true,
    });
  }

  // Highlight the current section
  private highlightCurrentSection() {
    const section = this.sections[this.currentSection];

    // Convert 1-based lines to 0-based and ensure endLine is inclusive
    const startLine = Math.max(0, section.startLine - 1);
    const endLine = section.endLine - 1; // Convert to inclusive 0-based

    const range = new vscode.Range(
      startLine,
      0, // Start at beginning of startLine
      endLine,
      Number.MAX_SAFE_INTEGER // End at end of endLine
    );

    this.editor.setDecorations(this.highlightDecoration, [range]);
  }

  // Move to next section
  public nextSection() {
    const stopped = stopSpeech(); // Stop current speech before new one
    this.currentSection = (this.currentSection + 1) % this.sections.length;
    this.highlightCurrentSection();
    if (stopped) {
      setTimeout(() => {
        speak(this.sections[this.currentSection].summary);
      }, 1000);
    } else {
      speak(this.sections[this.currentSection].summary);
    }
  }

  // Stop the review process
  public stop() {
    stopSpeech(); // Kill TTS process
    this.editor.setDecorations(this.highlightDecoration, []);
    this.dispose();
  }

  // Cleanup
  public dispose() {
    this.highlightDecoration.dispose();
    // Add any other cleanup (e.g., stop TTS mid-speech)
  }
}
