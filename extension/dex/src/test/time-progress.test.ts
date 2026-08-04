import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateWorkdayProgress,
  formatWorkdayProgress,
  millisecondsUntilNextLocalMidnight,
} from '../time-progress';

test('calcula dias úteis transcorridos incluindo o dia útil atual', () => {
  const progress = calculateWorkdayProgress(new Date(2026, 7, 4));

  assert.deepEqual(progress, { elapsed: 2, total: 21, percentage: 10 });
});

test('mantém o acumulado até a sexta-feira durante o fim de semana', () => {
  const progress = calculateWorkdayProgress(new Date(2026, 7, 8));

  assert.deepEqual(progress, { elapsed: 5, total: 21, percentage: 24 });
});

test('considera fevereiro bissexto e não desconta feriados', () => {
  const progress = calculateWorkdayProgress(new Date(2024, 1, 29));

  assert.deepEqual(progress, { elapsed: 21, total: 21, percentage: 100 });
});

test('forma o conteúdo visível e o tooltip do indicador', () => {
  assert.deepEqual(
    formatWorkdayProgress({ elapsed: 2, total: 21, percentage: 10 }),
    {
      text: '$(watch) 10%',
      tooltip: 'Tempo do mês: 2 de 21 dias úteis transcorridos (10%). Feriados não são descontados.',
    },
  );
});

test('calcula a espera até a próxima meia-noite local', () => {
  const date = new Date(2026, 7, 4, 12, 0, 0, 0);

  assert.equal(millisecondsUntilNextLocalMidnight(date), 12 * 60 * 60 * 1000);
});
