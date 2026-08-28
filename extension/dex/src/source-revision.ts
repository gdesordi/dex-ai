import { SourceMetadata, SyncSource } from './sync-types';

export function isSourceRevisionCurrent(
  source: SyncSource,
  metadata: SourceMetadata | undefined,
  remoteCommit: string,
): boolean {
  return metadata !== undefined &&
    metadata.repository === source.repository &&
    metadata.requestedRef === source.ref &&
    metadata.sourcePath === source.path &&
    metadata.resolvedCommit === remoteCommit;
}
