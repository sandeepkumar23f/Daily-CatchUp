export interface NewsSource {
  title: string;
  url: string;
}

export interface NewsSummaryData {
  title: string;
  executiveSummary: string;
  bulletPoints: string[];
  sentiment?: "Positive" | "Neutral" | "Negative" | string;
  sources?: NewsSource[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export type SummaryMode = "brief" | "standard" | "detailed";