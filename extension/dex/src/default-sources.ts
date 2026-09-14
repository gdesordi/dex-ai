import type { SyncSource } from './sync-types';

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
