export interface ThreatFoxIOC {
  id: string;
  ioc: string;
  threat_type: string;
  threat_type_desc: string;
  ioc_type: string;
  ioc_type_desc: string;
  malware: string;
  malware_printable: string;
  malware_alias: string | null;
  malware_malpedia: string | null;
  confidence_level: number;
  first_seen: string;
  last_seen: string | null;
  reporter: string;
  reference: string | null;
  tags: string[] | null;
}

export interface ThreatFoxResponse {
  query_status: string;
  data: ThreatFoxIOC[];
}
