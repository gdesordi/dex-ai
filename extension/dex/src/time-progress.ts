export interface WorkdayProgress {
  elapsed: number;
  total: number;
  percentage: number;
}

export function calculateWorkdayProgress(date: Date): WorkdayProgress {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let elapsed = 0;
  let total = 0;

  for (let day = 1; day <= lastDay; day += 1) {
    const current = new Date(year, month, day);
    if (!isWorkday(current)) continue;
    total += 1;
    if (day <= date.getDate()) elapsed += 1;
  }

  return {
    elapsed,
    total,
    percentage: Math.round((elapsed / total) * 100),
  };
}

export function formatWorkdayProgress(progress: WorkdayProgress): {
  text: string;
  tooltip: string;
} {
  return {
    text: `$(watch) ${progress.percentage}%`,
    tooltip: `Tempo do mês: ${progress.elapsed} de ${progress.total} dias úteis transcorridos (${progress.percentage}%). Feriados não são descontados.`,
  };
}

export function millisecondsUntilNextLocalMidnight(date: Date): number {
  const nextMidnight = new Date(date);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(1, nextMidnight.getTime() - date.getTime());
}

function isWorkday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}
