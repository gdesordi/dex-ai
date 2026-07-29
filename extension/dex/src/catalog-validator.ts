export interface ValidatedSkill {
  name: string;
  files: string[];
}

export interface ValidatedCatalog {
  skills: ValidatedSkill[];
  skillsVersion?: string;
}

export class CatalogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogValidationError';
  }
}

export function validateCatalog(
  sourceId: string,
  files: ReadonlyMap<string, Uint8Array>,
): ValidatedCatalog {
  const skillFiles = new Map<string, string[]>();
  for (const path of files.keys()) {
    const segments = path.split('/');
    if (segments.length < 2) {
      continue;
    }
    const skillName = segments[0];
    const paths = skillFiles.get(skillName) ?? [];
    paths.push(path);
    skillFiles.set(skillName, paths);
  }

  if (skillFiles.size === 0) {
    throw new CatalogValidationError(
      `${sourceId}: o catálogo não contém diretórios de skills`,
    );
  }

  const skills: ValidatedSkill[] = [];
  for (const [directoryName, paths] of skillFiles) {
    const skillPath = `${directoryName}/SKILL.md`;
    const contents = files.get(skillPath);
    if (!contents) {
      throw new CatalogValidationError(
        `${sourceId}: a skill “${directoryName}” não contém SKILL.md`,
      );
    }
    const frontmatter = readFrontmatter(
      new TextDecoder().decode(contents),
      sourceId,
      skillPath,
    );
    if (frontmatter.name !== directoryName) {
      throw new CatalogValidationError(
        `${sourceId}: “${skillPath}” usa name “${String(frontmatter.name)}”, esperado “${directoryName}”`,
      );
    }
    if (typeof frontmatter.description !== 'string' || !frontmatter.description.trim()) {
      throw new CatalogValidationError(
        `${sourceId}: “${skillPath}” deve declarar description`,
      );
    }
    skills.push({ name: directoryName, files: [...paths].sort() });
  }

  skills.sort((left, right) => left.name.localeCompare(right.name));
  return { skills, skillsVersion: readSkillsVersion(files.get('dex.json')) };
}

function readFrontmatter(
  contents: string,
  sourceId: string,
  path: string,
): Record<string, unknown> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(contents);
  if (!match) {
    throw new CatalogValidationError(
      `${sourceId}: “${path}” não contém frontmatter YAML válido`,
    );
  }
  try {
    const parsed: Record<string, unknown> = {};
    for (const line of match[1].split(/\r?\n/)) {
      if (!line.trim() || line.trimStart().startsWith('#')) continue;
      const field = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
      if (!field) continue;
      const value = field[2].trim();
      parsed[field[1]] = value.replace(/^(['"])(.*)\1$/, '$2');
    }
    return parsed;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CatalogValidationError(
      `${sourceId}: frontmatter inválido em “${path}”: ${detail}`,
    );
  }
}

function readSkillsVersion(contents: Uint8Array | undefined): string | undefined {
  if (!contents) {
    return undefined;
  }
  try {
    const manifest = JSON.parse(new TextDecoder().decode(contents)) as {
      skillsVersion?: unknown;
    };
    return typeof manifest.skillsVersion === 'string' &&
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(manifest.skillsVersion)
      ? manifest.skillsVersion
      : undefined;
  } catch {
    return undefined;
  }
}
