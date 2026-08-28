import {
  defaultDexSource,
  gctSkillsSource,
  SyncSource,
} from './sync-types';

export type KnownSourceChoice =
  | {
      label: string;
      description: string;
      sourceType: 'dex' | 'gct';
      source: Readonly<SyncSource>;
    }
  | {
      label: string;
      description: string;
      sourceType: 'custom';
    };

export const knownSourceChoices: readonly KnownSourceChoice[] = Object.freeze([
  {
    label: 'Dex AI',
    description: 'Catálogo padrão de skills do Dex',
    sourceType: 'dex',
    source: defaultDexSource,
  },
  {
    label: 'GCT',
    description: 'Catálogo de skills do GCT',
    sourceType: 'gct',
    source: gctSkillsSource,
  },
  {
    label: 'Fonte de skills personalizada',
    description: 'Configurar outro repositório GitHub',
    sourceType: 'custom',
  },
]);
