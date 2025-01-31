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

  setCurrentSection(section: Section) {
    this.currentSection = section;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SectionItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<SectionItem[]> {
    return Promise.resolve(
      this.sections.map((s) => new SectionItem(s, this.currentSection === s))
    );
  }
}

class SectionItem extends vscode.TreeItem {
  constructor(public readonly section: Section, isCurrent: boolean) {
    super(section.analysis.name, vscode.TreeItemCollapsibleState.None);

    this.description = section.analysis.summary;
    this.tooltip = `Lines ${section.analysis.startLine}-${section.analysis.endLine}`;
    this.command = {
      command: "codeReview.jumpToSection",
      title: "Jump to Section",
      arguments: [section],
    };

    this.contextValue = "section"; // For context menu actions
    this.iconPath = isCurrent ? new vscode.ThemeIcon("selection") : undefined;
  }
}
