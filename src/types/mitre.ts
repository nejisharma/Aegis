export interface MITRETactic {
  id: string;
  stixId: string;
  name: string;
  description: string;
  shortName: string;
}

export interface MITRETechnique {
  id: string;
  stixId: string;
  name: string;
  description: string;
  tacticRefs: string[];
  platforms: string[];
  isSubtechnique: boolean;
  parentId?: string;
  detection?: string;
  url: string;
}

export interface MITREGroup {
  id: string;
  stixId: string;
  name: string;
  description: string;
  aliases: string[];
  country?: string;
  techniqueIds: string[];
  softwareIds: string[];
  url: string;
}

export interface MITRESoftware {
  id: string;
  stixId: string;
  name: string;
  description: string;
  type: 'malware' | 'tool';
  platforms: string[];
  aliases: string[];
}

export interface MITREData {
  tactics: MITRETactic[];
  techniques: MITRETechnique[];
  groups: MITREGroup[];
  software: MITRESoftware[];
}
