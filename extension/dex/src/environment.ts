export interface SkillsDestination {
  rootDirectory: '.agents' | '.kiro';
  skillsDirectory: 'skills';
  agentsDirectory: 'agents';
  agentFileExtension: '.json' | '.md';
  relativePath: '.agents/skills' | '.kiro/skills';
}

export function resolveSkillsDestination(
  appName: string,
  uriScheme: string,
): SkillsDestination {
  const environment = `${appName} ${uriScheme}`.toLowerCase();
  if (environment.includes('kiro')) {
    return {
      rootDirectory: '.kiro',
      skillsDirectory: 'skills',
      agentsDirectory: 'agents',
      agentFileExtension: '.json',
      relativePath: '.kiro/skills',
    };
  }
  return {
    rootDirectory: '.agents',
    skillsDirectory: 'skills',
    agentsDirectory: 'agents',
    agentFileExtension: '.md',
    relativePath: '.agents/skills',
  };
}
