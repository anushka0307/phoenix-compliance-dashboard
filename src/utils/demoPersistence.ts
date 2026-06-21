import type { MsaBase } from "@/types/msa";
import type { AcquisitionCampaign } from "@/types/acquisitionCampaign";
import type { PgAcquisitionWorkspace } from "@/types/pgAcquisition";
import { INITIAL_MSA_BASE } from "@/data/mockMsas";
import { getInitialActiveMsas } from "@/utils/msaUniverse";

const STORAGE_ACTIVE_MSAS = "phoenix-demo-active-msas";
const STORAGE_PG_WORKSPACES = "phoenix-demo-pg-workspaces";
const STORAGE_CAMPAIGNS = "phoenix-demo-campaigns";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors in demo
  }
}

function mergeActiveMsas(seed: MsaBase[], persisted: MsaBase[]): MsaBase[] {
  const map = new Map(seed.map((msa) => [msa.id, msa]));
  for (const entry of persisted) {
    const existing = map.get(entry.id);
    map.set(entry.id, existing ? { ...existing, ...entry } : entry);
  }
  return Array.from(map.values());
}

/** Load activated MSAs: seed baseline merged with persisted user activations. */
export function loadPersistedActiveMsas(): MsaBase[] {
  const seed = getInitialActiveMsas(INITIAL_MSA_BASE);
  const persisted = readJson<MsaBase[]>(STORAGE_ACTIVE_MSAS);
  if (!persisted?.length) return seed;
  return mergeActiveMsas(seed, persisted);
}

export function savePersistedActiveMsas(msas: MsaBase[]): void {
  writeJson(STORAGE_ACTIVE_MSAS, msas);
}

export function loadPersistedPgWorkspaces(): Record<string, PgAcquisitionWorkspace> {
  return readJson<Record<string, PgAcquisitionWorkspace>>(STORAGE_PG_WORKSPACES) ?? {};
}

export function savePersistedPgWorkspace(workspace: PgAcquisitionWorkspace): void {
  const all = loadPersistedPgWorkspaces();
  all[workspace.msaId] = workspace;
  writeJson(STORAGE_PG_WORKSPACES, all);
}

export function loadPersistedCampaigns(): Record<string, AcquisitionCampaign[]> {
  return readJson<Record<string, AcquisitionCampaign[]>>(STORAGE_CAMPAIGNS) ?? {};
}

export function savePersistedCampaignsForMsa(msaId: string, campaigns: AcquisitionCampaign[]): void {
  const all = loadPersistedCampaigns();
  all[msaId] = campaigns;
  writeJson(STORAGE_CAMPAIGNS, all);
}
