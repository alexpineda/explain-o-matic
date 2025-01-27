import * as vscode from "vscode";
import type { Section } from "./llm";

export class SectionTreeProvider
  implements vscode.TreeDataProvider<SectionItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private sections: Section[] = [];
  private currentSection?: number;

  updateSections(sections: Section[]) {
    this.sections = sections;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SectionItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<SectionItem[]> {
    return Promise.resolve(
      this.sections.map((s, i) => new SectionItem(s, i === this.currentSection))
    );
  }
}

class SectionItem extends vscode.TreeItem {
  constructor(public readonly section: Section, isCurrent: boolean) {
    super(section.name, vscode.TreeItemCollapsibleState.None);

    this.description = section.summary;
    this.tooltip = `Lines ${section.startLine}-${section.endLine}`;
    this.command = {
      command: "codeReview.jumpToSection",
      title: "Jump to Section",
      arguments: [section],
    };

    this.contextValue = "section"; // For context menu actions
    this.iconPath = isCurrent ? new vscode.ThemeIcon("selection") : undefined;
  }
}
