export interface URLhausEntry {
  id: string;
  urlhaus_reference: string;
  url: string;
  url_status: string;
  host: string;
  date_added: string;
  threat: string;
  blacklists: {
    spamhaus_dbl: string;
    surbl: string;
  };
  reporter: string;
  larted: string;
  tags: string[] | null;
}

export interface URLhausResponse {
  query_status: string;
  urls: URLhausEntry[];
}
