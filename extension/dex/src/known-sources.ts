import {
  defaultDexSource,
  engproAdvplTlppSource,
  engproSuperpowersSource,
  gctSkillsSource,
  gctStagingSkillsSource,
} from './default-sources';
import { SyncSource } from './sync-types';

export type KnownSourceChoice =
  | {
      label: string;
      description: string;
      sourceType:
        | 'dex'
        | 'gct'
        | 'gct-staging'
        | 'engpro-advpl-tlpp'
        | 'engpro-superpowers';
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
    label: 'GCT Staging',
    description: 'Catálogo de skills do GCT na branch staging',
    sourceType: 'gct-staging',
    source: gctStagingSkillsSource,
  },
  {
    label: 'TOTVS EngPro — ADVPL/TLPP',
    description: 'Skills de engenharia para ADVPL e TLPP',
    sourceType: 'engpro-advpl-tlpp',
    source: engproAdvplTlppSource,
  },
  {
    label: 'TOTVS EngPro — Superpowers',
    description: 'Skills Superpowers para engenharia de software',
    sourceType: 'engpro-superpowers',
    source: engproSuperpowersSource,
  },
  {
    label: 'Fonte de skills personalizada',
    description: 'Configurar outro repositório GitHub',
    sourceType: 'custom',
  },
]);
