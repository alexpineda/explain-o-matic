import type { Section } from "./llm";

export type SummaryData = {
  type: "summary";
  data: {
    thoughts?: string;
    sections: Section[];
  };
};

export type UpdateData = {
  type: "update";
  data: {
    summary: string;
    name: string;
  };
};

export type OutgoingMessage = SummaryData | UpdateData;
