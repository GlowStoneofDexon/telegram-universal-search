export interface SearchResult {
  type: string;
  title: string;
  username: string | null;
  snippet: string;
  link: string | null;
  date: string | null;
  members: number;
  messageId: number | null;
}

export interface SearchOutcome {
  results: SearchResult[];
  cached: boolean;
  error?: string;
}
