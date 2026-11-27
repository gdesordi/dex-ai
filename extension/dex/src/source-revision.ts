import { SourceMetadata, SyncSource } from './sync-types';

export function sourceRevisionKey(source: SyncSource, commit: string): string {
  return JSON.stringify([source.repository, source.ref, source.path, source.agentsPath ?? null, commit]);
}

export function ignoredRevisionKey(workspaceUri: string, source: SyncSource, commit: string): string {
  return `ignoredSourceRevision:${JSON.stringify([workspaceUri, source.id, source.repository, source.ref, source.path, source.agentsPath ?? null, commit])}`;
}

export function isSourceRevisionCurrent(
  source: SyncSource,
  metadata: SourceMetadata | undefined,
  remoteCommit: string,
): boolean {
  return metadata !== undefined &&
    metadata.repository === source.repository &&
    metadata.requestedRef === source.ref &&
    metadata.sourcePath === source.path &&
    metadata.agentsPath === source.agentsPath &&
    metadata.resolvedCommit === remoteCommit;
}
