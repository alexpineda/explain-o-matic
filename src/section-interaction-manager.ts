// src/manager.ts
import * as vscode from "vscode";
import type { Section } from "./types";
import { speak, stopSpeech } from "./tts";
import type { SectionTreeProvider } from "./elements/section-tree";

export class SectionInteractionManager {
  private currentSection: Section | undefined;
  private sections: Section[] = [];
  private highlightDecoration: vscode.TextEditorDecorationType;
  private editor: vscode.TextEditor;
  private _onSectionChange = new vscode.EventEmitter<Section>();
  private sectionTreeProvider: SectionTreeProvider;
  public readonly onSectionChange = this._onSectionChange.event;
  #timeout: Timer;

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

  #getFlattenedSections(sections: Section[]): Section[] {
    return sections.flatMap((section) => [
      section,
      ...this.#getFlattenedSections(section.children),
    ]);
  }

  get flattenedSections() {
    const sections = this.#getFlattenedSections(this.sections);
    return sections;
  }

  public setSections(sections: Section[]) {
    this.sections = sections;
    this.sectionTreeProvider.setSections(sections);
  }

  public addChildren(children: Section[], parent: Section) {
    const adjusted = children.map((c) => ({
      ...c,
      analysis: {
        ...c.analysis,
        startLine: c.analysis.startLine + parent.analysis.startLine,
        endLine: c.analysis.endLine + parent.analysis.startLine,
      },
    }));
    // replace the parent so we don't go to it when using next/previous
    parent.children = adjusted;
    this.sectionTreeProvider.addChildren();
    return adjusted;
  }

  // Highlight the current section
  private highlightCurrentSection() {
    const section = this.currentSection;
    if (!section) {
      return;
    }

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
    clearTimeout(this.#timeout);
    stopSpeech(); // Stop current speech before new one
    this.highlightCurrentSection();
    // necessary to wait for stop speech
    // also acts as debounce for fast switchers
    this.#timeout = setTimeout(() => {
      speak(section.analysis.summary);
    }, 500);
    this._onSectionChange.fire(section);
  }

  public next() {
    const sections = this.flattenedSections;
    const idx = sections.findIndex((s) => s === this.currentSection);
    this.currentSection = sections[(idx + 1) % sections.length];
    this.#next(this.currentSection);
  }

  public jumpTo(section: Section) {
    const validSection = this.flattenedSections.find((s) => s === section);
    if (!validSection) {
      return;
    }
    this.currentSection = validSection;
    this.#next(this.currentSection);
  }

  public stop() {
    stopSpeech();
    clearTimeout(this.#timeout);
    this.editor.setDecorations(this.highlightDecoration, []);
  }

  public dispose() {
    this.stop();
    this.highlightDecoration.dispose();
  }
}
