export const SPEC_QUESTIONNAIRE_SCHEMA_VERSION = 1;

export type SpecQuestionnaireStatus =
  | 'pending'
  | 'partially-answered'
  | 'answered';

export interface SpecQuestion {
  id: string;
  section: string;
  text: string;
  essential: boolean;
  suggestion: string;
  answer: string | null;
}

export interface SpecQuestionnaire {
  schemaVersion: 1;
  feature: string;
  title: string;
  status: SpecQuestionnaireStatus;
  questions: SpecQuestion[];
}

export class SpecQuestionnaireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpecQuestionnaireError';
  }
}

export function parseSpecQuestionnaire(contents: string): SpecQuestionnaire {
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new SpecQuestionnaireError(`JSON inválido: ${detail}`);
  }

  const root = requireRecord(value, 'questionário');
  if (root.schemaVersion !== SPEC_QUESTIONNAIRE_SCHEMA_VERSION) {
    throw new SpecQuestionnaireError(
      `schemaVersion incompatível; a única versão aceita é ${SPEC_QUESTIONNAIRE_SCHEMA_VERSION}`,
    );
  }

  const feature = requireString(root.feature, 'feature');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(feature)) {
    throw new SpecQuestionnaireError('o campo “feature” deve usar kebab-case');
  }
  const title = requireString(root.title, 'title');
  const status = requireStatus(root.status);
  if (!Array.isArray(root.questions) || root.questions.length === 0) {
    throw new SpecQuestionnaireError(
      'o campo “questions” deve ser uma lista não vazia',
    );
  }

  const ids = new Set<string>();
  const questions = root.questions.map((item, index) => {
    const question = requireRecord(item, `questions[${index}]`);
    const id = requireString(question.id, `questions[${index}].id`);
    if (ids.has(id)) {
      throw new SpecQuestionnaireError(`id duplicado “${id}”`);
    }
    ids.add(id);

    if (typeof question.essential !== 'boolean') {
      throw new SpecQuestionnaireError(
        `o campo “questions[${index}].essential” deve ser booleano`,
      );
    }
    const answer = requireAnswer(question.answer, index);

    return {
      id,
      section: requireString(
        question.section,
        `questions[${index}].section`,
      ),
      text: requireString(question.text, `questions[${index}].text`),
      essential: question.essential,
      suggestion: requireString(
        question.suggestion,
        `questions[${index}].suggestion`,
      ),
      answer,
    };
  });

  const derivedStatus = calculateSpecQuestionnaireStatus(questions);
  if (status !== derivedStatus) {
    throw new SpecQuestionnaireError(
      `status “${status}” diverge do estado derivado “${derivedStatus}”`,
    );
  }

  return {
    schemaVersion: SPEC_QUESTIONNAIRE_SCHEMA_VERSION,
    feature,
    title,
    status,
    questions,
  };
}

export function serializeSpecQuestionnaire(
  questionnaire: SpecQuestionnaire,
): string {
  const normalized = {
    ...questionnaire,
    status: calculateSpecQuestionnaireStatus(questionnaire.questions),
  };
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

export function calculateSpecQuestionnaireStatus(
  questions: readonly Pick<SpecQuestion, 'answer'>[],
): SpecQuestionnaireStatus {
  const answered = questions.filter((question) => question.answer !== null).length;
  if (answered === 0) return 'pending';
  if (answered === questions.length) return 'answered';
  return 'partially-answered';
}

export function compareSpecQuestionnaires(
  left: Pick<SpecQuestionnaire, 'status' | 'feature' | 'title'>,
  right: Pick<SpecQuestionnaire, 'status' | 'feature' | 'title'>,
): number {
  const statusOrder: Record<SpecQuestionnaireStatus, number> = {
    pending: 0,
    'partially-answered': 1,
    answered: 2,
  };
  return (
    statusOrder[left.status] - statusOrder[right.status]
    || left.feature.localeCompare(right.feature)
    || left.title.localeCompare(right.title)
  );
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SpecQuestionnaireError(`o campo “${field}” deve ser um objeto`);
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SpecQuestionnaireError(
      `o campo “${field}” deve ser uma string não vazia`,
    );
  }
  return value;
}

function requireStatus(value: unknown): SpecQuestionnaireStatus {
  if (
    value !== 'pending'
    && value !== 'partially-answered'
    && value !== 'answered'
  ) {
    throw new SpecQuestionnaireError('o campo “status” possui valor inválido');
  }
  return value;
}

function requireAnswer(value: unknown, index: number): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SpecQuestionnaireError(
      `o campo “questions[${index}].answer” deve ser nulo ou uma string não vazia`,
    );
  }
  return value;
}
