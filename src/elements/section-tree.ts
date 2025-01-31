import * as vscode from "vscode";
import type { Section } from "../types";

export class SectionTreeProvider
  implements vscode.TreeDataProvider<SectionItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private sections: Section[] = [];

  private currentSection?: Section;

  setSections(sections: Section[]) {
    this.sections = sections;
    this._onDidChangeTreeData.fire();
  }

  addChildren() {
    // if (this.children.some((c) => c.parent === parent)) {
    //   // already has immediate children
    //   return;
    // }
    // this.children.push(...children.map((c) => ({ ...c, parent })));
    this._onDidChangeTreeData.fire();
  }

  setCurrentSection(section: Section) {
    this.currentSection = section;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SectionItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SectionItem): Thenable<SectionItem[]> {
    if (element) {
      // Return children of the given element
      return Promise.resolve(
        element.section.children.map(
          (s) => new SectionItem(s, this.currentSection === s)
        )
      );
    }
    // Return root level sections
    return Promise.resolve(
      this.sections.map((s) => new SectionItem(s, this.currentSection === s))
    );
  }
}

export class SectionItem extends vscode.TreeItem {
  constructor(public readonly section: Section, isCurrent: boolean) {
    super(
      section.analysis.name,
      section.children.length
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );

    this.tooltip = section.analysis.summary;
    this.description = `Lines ${section.analysis.startLine}-${section.analysis.endLine}`;

    this.command = {
      command: "codeReview.jumpToSection",
      title: "Jump to Section",
      arguments: [section],
    };

    this.contextValue = "section"; // For context menu actions
    this.iconPath = isCurrent
      ? new vscode.ThemeIcon("debug-stackframe")
      : undefined;
  }
}
