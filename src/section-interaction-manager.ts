// src/manager.ts
import * as vscode from "vscode";
import type { Section } from "./types";
import { speak, stopSpeech } from "./tts";
import type { SectionTreeProvider } from "./elements/section-tree";

export class SectionInteractionManager {
  private currentSection = -1;
  private sections: Section[] = [];
  private highlightDecoration: vscode.TextEditorDecorationType;
  private editor: vscode.TextEditor;
  private _onSectionChange = new vscode.EventEmitter<Section>();
  private sectionTreeProvider: SectionTreeProvider;
  public readonly onSectionChange = this._onSectionChange.event;

  constructor(
    editor: vscode.TextEditor,
    sectionTreeProvider: SectionTreeProvider
  ) {
    this.editor = editor;
    this.sectionTreeProvider = sectionTreeProvider;

    // Configure decoration
    this.highlightDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255,240,0,0.3)",
      isWholeLine: true,
    });
  }

  public setSections(sections: Section[]) {
    this.sections = sections;
    this.sectionTreeProvider.setSections(sections);
  }

  // Highlight the current section
  private highlightCurrentSection() {
    const section = this.sections[this.currentSection];

    // Convert 1-based lines to 0-based and ensure endLine is inclusive
    const startLine = Math.max(0, section.analysis.startLine - 1);
    const endLine = section.analysis.endLine - 1; // Convert to inclusive 0-based

    const range = new vscode.Range(
      startLine,
      0, // Start at beginning of startLine
      endLine,
      Number.MAX_SAFE_INTEGER // End at end of endLine
    );

    this.sectionTreeProvider.setCurrentSection(section);
    this.editor.setDecorations(this.highlightDecoration, [range]);
    this.editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  }

  #next(section: Section) {
    const stopped = stopSpeech(); // Stop current speech before new one
    this.highlightCurrentSection();
    if (stopped) {
      setTimeout(() => {
        speak(section.analysis.summary);
      }, 1000);
    } else {
      speak(section.analysis.summary);
    }
    this._onSectionChange.fire(section);
  }

  public next() {
    this.currentSection = (this.currentSection + 1) % this.sections.length;
    this.#next(this.sections[this.currentSection]);
  }

  public jumpTo(section: Section) {
    this.currentSection = this.sections.findIndex(
      (s) => s.analysis.startLine === section.analysis.startLine
    );
    this.#next(this.sections[this.currentSection]);
  }

  public stop() {
    stopSpeech();
    this.editor.setDecorations(this.highlightDecoration, []);
  }

  public dispose() {
    this.highlightDecoration.dispose();
  }
}
