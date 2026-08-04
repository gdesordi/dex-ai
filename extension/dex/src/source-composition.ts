export function managedEntriesToReplace(
  previouslyManaged: Iterable<string>,
  currentlyManaged: Iterable<string>,
): Set<string> {
  return new Set([...previouslyManaged, ...currentlyManaged]);
}

export function newlyDisabledSourceIds(
  previous: Iterable<{ id: string; enabled: boolean }>,
  current: Iterable<{ id: string; enabled: boolean }>,
): string[] {
  const previouslyEnabled = new Set(
    [...previous].filter((source) => source.enabled).map((source) => source.id),
  );
  return [...current]
    .filter((source) => !source.enabled && previouslyEnabled.has(source.id))
    .map((source) => source.id);
}
