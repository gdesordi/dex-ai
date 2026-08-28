export const syncConfigVersion = 1 as const;

export interface SyncSource extends Record<string, unknown> {
  id: string;
  repository: string;
  ref: string;
  path: string;
  enabled: boolean;
}

export interface SyncConfig extends Record<string, unknown> {
  version: typeof syncConfigVersion;
  sources: SyncSource[];
}

export type SyncStatus =
  | 'not-synced'
  | 'syncing'
  | 'synced'
  | 'disabled'
  | 'stale-error'
  | 'conflict'
  | 'error';

export interface SourceMetadata {
  sourceId: string;
  repository: string;
  requestedRef: string;
  sourcePath: string;
  resolvedCommit: string;
  syncedAt: string;
  skillCount: number;
}

export interface SourceSyncResult {
  sourceId: string;
  status: SyncStatus;
  metadata?: SourceMetadata;
  message?: string;
}

export const defaultDexSource: Readonly<SyncSource> = Object.freeze({
  id: 'dex-ai',
  repository: 'https://github.com/gdesordi/dex-ai',
  ref: 'main',
  path: 'skills',
  enabled: true,
});

export const gctSkillsSource: Readonly<SyncSource> = Object.freeze({
  id: 'gct',
  repository: 'https://github.com/sordi-totvs/gct-resources',
  ref: 'main',
  path: 'skills',
  enabled: true,
});

export function createDefaultSyncConfig(): SyncConfig {
  return {
    version: syncConfigVersion,
    sources: [{ ...defaultDexSource }],
  };
}
