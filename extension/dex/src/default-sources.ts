import type { SyncSource } from './sync-types';

export interface KnownSourceDefinition {
  label: string;
  description: string;
  source: Readonly<SyncSource>;
}

/** Catálogos e agentes oferecidos pela extensão como fontes conhecidas. */
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
  agentsPath: 'agents',
  enabled: true,
});

export const gctStagingSkillsSource: Readonly<SyncSource> = Object.freeze({
  id: 'gct-staging',
  repository: 'https://github.com/sordi-totvs/gct-resources',
  ref: 'staging',
  path: 'skills',
  agentsPath: 'agents',
  enabled: true,
});

export const engproAdvplTlppSource: Readonly<SyncSource> = Object.freeze({
  id: 'engpro-advpl-tlpp',
  repository: 'https://github.com/totvs/engpro-advpl-tlpp-skills',
  ref: 'main',
  path: 'skills/advpl-tlpp',
  enabled: true,
});

export const engproSuperpowersSource: Readonly<SyncSource> = Object.freeze({
  id: 'engpro-superpowers',
  repository: 'https://github.com/totvs/engpro-advpl-tlpp-skills',
  ref: 'main',
  path: 'skills/superpowers',
  enabled: true,
});

/** Fallback distribuído para funcionamento sem acesso ao catálogo remoto. */
export const fallbackKnownSources: readonly KnownSourceDefinition[] = Object.freeze([
  { label: 'Dex AI', description: 'Catálogo padrão de skills do Dex', source: defaultDexSource },
  { label: 'GCT', description: 'Catálogo de skills do GCT', source: gctSkillsSource },
  { label: 'GCT Staging', description: 'Catálogo de skills do GCT na branch staging', source: gctStagingSkillsSource },
  { label: 'TOTVS EngPro — ADVPL/TLPP', description: 'Skills de engenharia para ADVPL e TLPP', source: engproAdvplTlppSource },
  { label: 'TOTVS EngPro — Superpowers', description: 'Skills Superpowers para engenharia de software', source: engproSuperpowersSource },
]);
