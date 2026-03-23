export interface ThreatEvent {
  id: string;
  sourceCountry: string;
  sourceCountryCode: string;
  sourceLat: number;
  sourceLng: number;
  targetCountry: string;
  targetCountryCode: string;
  targetLat: number;
  targetLng: number;
  type: 'malware' | 'phishing' | 'exploit' | 'ddos' | 'bruteforce' | 'ransomware' | 'apt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  label: string;
}
