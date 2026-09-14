import {
  defaultDexSource,
  fallbackKnownSources,
  KnownSourceDefinition,
} from './default-sources';
import { SyncSource } from './sync-types';

export type KnownSourceChoice =
  | {
      label: string;
      description: string;
      sourceType: 'dex' | 'known';
      source: Readonly<SyncSource>;
    }
  | {
      label: string;
      description: string;
      sourceType: 'custom';
    };

export function createKnownSourceChoices(
  sources: readonly KnownSourceDefinition[],
): readonly KnownSourceChoice[] {
  return Object.freeze([
    ...sources.map((definition) => ({
      ...definition,
      sourceType: definition.source.id === defaultDexSource.id
        ? 'dex' as const
        : 'known' as const,
    })),
    {
    label: 'Fonte de skills personalizada',
    description: 'Configurar outro repositório GitHub',
    sourceType: 'custom' as const,
    },
  ]);
}

export const knownSourceChoices = createKnownSourceChoices(fallbackKnownSources);
