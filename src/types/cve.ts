export interface CVEItem {
  cve: {
    id: string;
    sourceIdentifier: string;
    published: string;
    lastModified: string;
    vulnStatus: string;
    descriptions: Array<{ lang: string; value: string }>;
    metrics?: {
      cvssMetricV31?: Array<{
        source: string;
        type: string;
        cvssData: {
          version: string;
          vectorString: string;
          attackVector: string;
          attackComplexity: string;
          privilegesRequired: string;
          userInteraction: string;
          scope: string;
          confidentialityImpact: string;
          integrityImpact: string;
          availabilityImpact: string;
          baseScore: number;
          baseSeverity: string;
        };
        exploitabilityScore: number;
        impactScore: number;
      }>;
    };
    weaknesses?: Array<{
      source: string;
      type: string;
      description: Array<{ lang: string; value: string }>;
    }>;
    references?: Array<{
      url: string;
      source: string;
      tags?: string[];
    }>;
  };
}

export interface NVDResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  vulnerabilities: CVEItem[];
}
