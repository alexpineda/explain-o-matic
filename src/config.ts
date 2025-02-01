import * as vscode from "vscode";

export const config = vscode.workspace.getConfiguration("explainomatic");

type LLMConfig = {
  provider: string;
  model: string;
  apiKey: string;
};

type SectionerConfig = LLMConfig & {
  temperature: number;
};

export const reasonerConfig = config.get<LLMConfig>("llm.reasoner", {
  provider: "deepseek",
  model: "deepseek-reasoner",
  apiKey: "",
});
export const sectionerConfig = config.get<SectionerConfig>("llm.sectioner", {
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  apiKey: "",
  temperature: 0.1,
});
export const fileSizeWarningThreshold = config.get<number>(
  "fileSizeWarning",
  500
);
export const useReasoner = config.get<boolean>("useReasoner", true);
export const useEnvKeys = config.get<boolean>("useEnvKeys", false);
