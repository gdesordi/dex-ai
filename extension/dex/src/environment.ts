export interface SkillsDestination {
  rootDirectory: '.agents' | '.kiro';
  skillsDirectory: 'skills';
  agentsDirectory: 'agents';
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
      relativePath: '.kiro/skills',
    };
  }
  return {
    rootDirectory: '.agents',
    skillsDirectory: 'skills',
    agentsDirectory: 'agents',
    relativePath: '.agents/skills',
  };
}
