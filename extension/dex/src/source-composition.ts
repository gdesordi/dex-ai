export function managedEntriesToReplace(
  previouslyManaged: Iterable<string>,
  currentlyManaged: Iterable<string>,
): Set<string> {
  return new Set([...previouslyManaged, ...currentlyManaged]);
}
