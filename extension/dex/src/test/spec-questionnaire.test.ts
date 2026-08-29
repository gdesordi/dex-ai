import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SpecQuestionnaireError,
  calculateSpecQuestionnaireStatus,
  compareSpecQuestionnaires,
  parseSpecQuestionnaire,
  serializeSpecQuestionnaire,
  updateSpecQuestionAnswer,
} from '../spec-questionnaire';

test('valida e serializa um questionário conforme o contrato', () => {
  const questionnaire = parseSpecQuestionnaire(validQuestionnaire());

  assert.equal(questionnaire.feature, 'extension-integration');
  assert.equal(questionnaire.questions[0].answer, null);
  assert.deepEqual(
    parseSpecQuestionnaire(serializeSpecQuestionnaire(questionnaire)),
    questionnaire,
  );
});

test('rejeita JSON inválido, schema incompatível e campos obrigatórios inválidos', () => {
  assert.throws(
    () => parseSpecQuestionnaire('{'),
    (error: unknown) => error instanceof SpecQuestionnaireError
      && /JSON inválido/.test(error.message),
  );
  assertInvalid({ schemaVersion: 2 }, /schemaVersion incompatível/);
  assertInvalid({ feature: 'Feature inválida' }, /kebab-case/);
  assertInvalid({ title: '' }, /title/);
  assertInvalid({ status: 'unknown' }, /status/);
  assertInvalid({ questions: [] }, /lista não vazia/);
});

test('rejeita questões inválidas e IDs duplicados', () => {
  const duplicate = question();
  assertInvalid({ questions: [question(), duplicate] }, /id duplicado/);
  assertInvalid(
    { questions: [{ ...question(), essential: 'yes' }] },
    /essential/,
  );
  assertInvalid(
    { questions: [{ ...question(), answer: '' }] },
    /answer/,
  );
});

test('rejeita status que diverge das respostas', () => {
  assertInvalid(
    { status: 'answered', questions: [question()] },
    /diverge do estado derivado/,
  );
});

test('calcula as três transições de status', () => {
  assert.equal(
    calculateSpecQuestionnaireStatus([{ answer: null }, { answer: null }]),
    'pending',
  );
  assert.equal(
    calculateSpecQuestionnaireStatus([{ answer: 'sim' }, { answer: null }]),
    'partially-answered',
  );
  assert.equal(
    calculateSpecQuestionnaireStatus([
      { answer: 'manter sugestão' },
      { answer: 'não' },
    ]),
    'answered',
  );
});

test('atualiza, limpa e rejeita respostas desconhecidas', () => {
  const questionnaire = parseSpecQuestionnaire(validQuestionnaire());

  updateSpecQuestionAnswer(questionnaire, '1.1', '  resposta personalizada  ');
  assert.equal(questionnaire.questions[0].answer, 'resposta personalizada');
  assert.equal(questionnaire.status, 'answered');

  updateSpecQuestionAnswer(questionnaire, '1.1', '   ');
  assert.equal(questionnaire.questions[0].answer, null);
  assert.equal(questionnaire.status, 'pending');
  assert.throws(
    () => updateSpecQuestionAnswer(questionnaire, 'inexistente', 'resposta'),
    /questão desconhecida/,
  );
});

test('ordena por status e depois por feature', () => {
  const items = [
    summary('answered', 'zeta'),
    summary('pending', 'zeta'),
    summary('partially-answered', 'alpha'),
    summary('pending', 'alpha'),
  ];

  items.sort(compareSpecQuestionnaires);
  assert.deepEqual(items.map((item) => item.feature), [
    'alpha',
    'zeta',
    'alpha',
    'zeta',
  ]);
});

function assertInvalid(
  overrides: Record<string, unknown>,
  expected: RegExp,
): void {
  const value = JSON.parse(validQuestionnaire()) as Record<string, unknown>;
  assert.throws(
    () => parseSpecQuestionnaire(JSON.stringify({ ...value, ...overrides })),
    (error: unknown) => error instanceof SpecQuestionnaireError
      && expected.test(error.message),
  );
}

function validQuestionnaire(): string {
  return JSON.stringify({
    schemaVersion: 1,
    feature: 'extension-integration',
    title: 'Questionário de Refinamento — extension-integration',
    status: 'pending',
    questions: [question()],
  });
}

function question(): Record<string, unknown> {
  return {
    id: '1.1',
    section: 'Contrato',
    text: 'Qual contrato deve ser usado?',
    essential: true,
    suggestion: 'Usar a versão 1.',
    answer: null,
  };
}

function summary(
  status: 'pending' | 'partially-answered' | 'answered',
  feature: string,
): { status: typeof status; feature: string; title: string } {
  return { status, feature, title: feature };
}
