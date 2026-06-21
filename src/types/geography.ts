export type GeographyKind = "msa" | "micropolitan";

export interface GeographyRecord {
  id: string;
  kind: GeographyKind;
  code: string;
  name: string;
  state: string;
  population: number;
  status: "inactive";
  cbsaCode?: string;
  csaCode?: string;
}

export interface GeographyIndex {
  countyAssignments: Record<string, string>;
}

export interface GeographyCatalogFile {
  geographies: GeographyRecord[];
}

export interface StatisticalAreaProperties extends GeographyRecord {
  type: "statistical_area";
}
