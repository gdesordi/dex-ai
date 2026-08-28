export type InitialSourceSyncResult =
  | { status: 'synced' }
  | { status: 'failed'; error: unknown };

export async function runInitialSourceSync(
  sync: () => Promise<void>,
): Promise<InitialSourceSyncResult> {
  try {
    await sync();
    return { status: 'synced' };
  } catch (error) {
    return { status: 'failed', error };
  }
}
