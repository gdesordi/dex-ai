import * as vscode from 'vscode';
import {
  SpecQuestion,
  SpecQuestionnaire,
  SpecQuestionnaireStatus,
  calculateSpecQuestionnaireStatus,
  compareSpecQuestionnaires,
  parseSpecQuestionnaire,
  serializeSpecQuestionnaire,
} from './spec-questionnaire';

interface LocatedQuestionnaire {
  folder: vscode.WorkspaceFolder;
  uri: vscode.Uri;
  questionnaire: SpecQuestionnaire;
}

interface RejectedQuestionnaire {
  uri: vscode.Uri;
  reason: string;
}

export async function answerSpecQuestionnaire(
  outputChannel: vscode.OutputChannel,
): Promise<boolean> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) {
    void vscode.window.showErrorMessage(t(
      'Abra uma pasta ou workspace para responder questionários de especificação.',
      'Open a folder or workspace to answer specification questionnaires.',
    ));
    return false;
  }

  const { valid, rejected } = await discoverQuestionnaires(folders);
  logRejectedQuestionnaires(outputChannel, rejected);
  if (rejected.length) {
    void vscode.window.showWarningMessage(t(
      `${rejected.length} questionário(s) inválido(s) foram ignorados. Consulte o canal Dex.`,
      `${rejected.length} invalid questionnaire(s) were ignored. See the Dex output channel.`,
    ));
  }

  if (!valid.length) {
    void vscode.window.showInformationMessage(rejected.length
      ? t(
        'Nenhum questionário válido foi encontrado.',
        'No valid questionnaire was found.',
      )
      : t(
        'Nenhum questionário de especificação foi encontrado em .specs/dex/.',
        'No specification questionnaire was found in .specs/dex/.',
      ));
    return false;
  }

  const located = await pickQuestionnaire(valid);
  if (!located) return false;

  try {
    const pending = located.questionnaire.questions.filter(
      (question) => question.answer === null,
    );
    if (pending.length) {
      const completed = await answerQuestions(located, pending);
      if (!completed) return false;

      const next = await vscode.window.showQuickPick(
        [
          {
            label: t('Revisar todas', 'Review all'),
            description: t(
              'Percorrer e alterar respostas existentes',
              'Review and change existing answers',
            ),
            review: true,
          },
          {
            label: t('Concluir', 'Finish'),
            description: t(
              'Manter as respostas gravadas',
              'Keep the saved answers',
            ),
            review: false,
          },
        ],
        {
          title: located.questionnaire.title,
          placeHolder: t(
            'O questionário não possui mais respostas pendentes',
            'The questionnaire has no unanswered questions',
          ),
        },
      );
      if (!next) return false;
      if (next.review) {
        const reviewed = await answerQuestions(
          located,
          located.questionnaire.questions,
        );
        if (!reviewed) return false;
      }
    } else {
      const reviewed = await answerQuestions(
        located,
        located.questionnaire.questions,
      );
      if (!reviewed) return false;
    }

    void vscode.window.showInformationMessage(t(
      `Questionário “${located.questionnaire.feature}” atualizado com status ${statusLabel(located.questionnaire.status)}.`,
      `Questionnaire “${located.questionnaire.feature}” updated with status ${statusLabel(located.questionnaire.status)}.`,
    ));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(
      `[${new Date().toISOString()}] Falha ao atualizar ${located.uri.fsPath}: ${message}`,
    );
    outputChannel.show(true);
    void vscode.window.showErrorMessage(t(
      `Não foi possível atualizar o questionário “${located.questionnaire.feature}”: ${message}`,
      `Could not update questionnaire “${located.questionnaire.feature}”: ${message}`,
    ));
    return false;
  }
}

async function discoverQuestionnaires(
  folders: readonly vscode.WorkspaceFolder[],
): Promise<{
  valid: LocatedQuestionnaire[];
  rejected: RejectedQuestionnaire[];
}> {
  const valid: LocatedQuestionnaire[] = [];
  const rejected: RejectedQuestionnaire[] = [];

  for (const folder of folders) {
    const uris = await vscode.workspace.findFiles(
      new vscode.RelativePattern(
        folder,
        '.specs/dex/*/*.refinement-questionnaire.json',
      ),
    );
    for (const uri of uris) {
      try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        valid.push({
          folder,
          uri,
          questionnaire: parseSpecQuestionnaire(
            new TextDecoder().decode(bytes),
          ),
        });
      } catch (error) {
        rejected.push({
          uri,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  valid.sort((left, right) =>
    compareSpecQuestionnaires(left.questionnaire, right.questionnaire)
    || left.folder.name.localeCompare(right.folder.name)
    || left.uri.path.localeCompare(right.uri.path));
  return { valid, rejected };
}

async function pickQuestionnaire(
  questionnaires: readonly LocatedQuestionnaire[],
): Promise<LocatedQuestionnaire | undefined> {
  const items = questionnaires.map((located) => ({
    label: located.questionnaire.feature,
    description: statusLabel(located.questionnaire.status),
    detail: `${located.folder.name} — ${vscode.workspace.asRelativePath(located.uri, false)}`,
    located,
  }));
  const selected = await vscode.window.showQuickPick(items, {
    title: t(
      'Responder questionário de especificação',
      'Answer specification questionnaire',
    ),
    placeHolder: t(
      'Escolha um questionário',
      'Choose a questionnaire',
    ),
    matchOnDescription: true,
    matchOnDetail: true,
  });
  return selected?.located;
}

async function answerQuestions(
  located: LocatedQuestionnaire,
  questions: readonly SpecQuestion[],
): Promise<boolean> {
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const answer = await promptQuestion(
      located.questionnaire,
      question,
      index + 1,
      questions.length,
    );
    if (answer === undefined) return false;

    question.answer = answer;
    located.questionnaire.status = calculateSpecQuestionnaireStatus(
      located.questionnaire.questions,
    );
    await writeQuestionnaireSafely(located.uri, located.questionnaire);
  }
  return true;
}

async function promptQuestion(
  questionnaire: SpecQuestionnaire,
  question: SpecQuestion,
  position: number,
  total: number,
): Promise<string | undefined> {
  const current = question.answer === null
    ? t('Sem resposta', 'Unanswered')
    : question.answer;
  const selected = await vscode.window.showQuickPick(
    [
      {
        label: t('Manter sugestão', 'Keep suggestion'),
        description: question.suggestion,
        action: 'suggestion' as const,
      },
      {
        label: t('Dar outra resposta', 'Give another answer'),
        description: t(`Atual: ${current}`, `Current: ${current}`),
        action: 'custom' as const,
      },
    ],
    {
      title: `${questionnaire.title} — ${position}/${total}`,
      placeHolder: `[${question.id}] ${question.text}`,
      matchOnDescription: true,
    },
  );
  if (!selected) return undefined;
  if (selected.action === 'suggestion') return 'manter sugestão';

  return promptTextValue(
    `${questionnaire.title} — ${question.id}`,
    question.text,
    question.answer === 'manter sugestão' ? '' : (question.answer ?? ''),
  );
}

async function promptTextValue(
  title: string,
  placeHolder: string,
  initialValue: string,
): Promise<string | undefined> {
  const picker = vscode.window.createQuickPick();
  picker.title = title;
  picker.placeholder = placeHolder;
  picker.value = initialValue;
  picker.items = [];

  return new Promise<string | undefined>((resolve) => {
    let settled = false;
    const finish = (value: string | undefined): void => {
      if (settled) return;
      settled = true;
      picker.dispose();
      resolve(value);
    };
    picker.onDidAccept(() => {
      const value = picker.value.trim();
      if (value) finish(value);
    });
    picker.onDidHide(() => finish(undefined));
    picker.show();
  });
}

async function writeQuestionnaireSafely(
  uri: vscode.Uri,
  questionnaire: SpecQuestionnaire,
): Promise<void> {
  const temporary = uri.with({
    path: `${uri.path}.tmp-${process.pid}-${Date.now()}`,
  });
  const contents = new TextEncoder().encode(
    serializeSpecQuestionnaire(questionnaire),
  );
  try {
    await vscode.workspace.fs.writeFile(temporary, contents);
    await vscode.workspace.fs.rename(temporary, uri, { overwrite: true });
  } catch (error) {
    try {
      await vscode.workspace.fs.delete(temporary);
    } catch {
      // O arquivo temporário pode não ter sido criado ou já ter sido movido.
    }
    throw error;
  }
}

function logRejectedQuestionnaires(
  outputChannel: vscode.OutputChannel,
  rejected: readonly RejectedQuestionnaire[],
): void {
  for (const item of rejected) {
    outputChannel.appendLine(
      `[${new Date().toISOString()}] Questionário ignorado ${item.uri.fsPath}: ${item.reason}`,
    );
  }
}

function statusLabel(status: SpecQuestionnaireStatus): string {
  const labels = isPortuguese()
    ? {
      pending: 'Pendente',
      'partially-answered': 'Respondido parcialmente',
      answered: 'Respondido',
    }
    : {
      pending: 'Pending',
      'partially-answered': 'Partially answered',
      answered: 'Answered',
    };
  return labels[status];
}

function t(portuguese: string, english: string): string {
  return isPortuguese() ? portuguese : english;
}

function isPortuguese(): boolean {
  return vscode.env.language.toLowerCase().startsWith('pt');
}
