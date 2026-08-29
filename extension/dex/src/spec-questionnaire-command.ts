import * as vscode from 'vscode';
import {
  SpecQuestionnaire,
  SpecQuestionnaireStatus,
  compareSpecQuestionnaires,
  parseSpecQuestionnaire,
  serializeSpecQuestionnaire,
  updateSpecQuestionAnswer,
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
    openQuestionnairePanel(located, outputChannel);
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

function openQuestionnairePanel(
  located: LocatedQuestionnaire,
  outputChannel: vscode.OutputChannel,
): void {
  const panel = vscode.window.createWebviewPanel(
    'dex.specQuestionnaire',
    located.questionnaire.title,
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true },
  );
  panel.webview.html = renderQuestionnaireHtml(located.questionnaire);

  let writes = Promise.resolve();
  panel.webview.onDidReceiveMessage((message: unknown) => {
    if (!isAnswerMessage(message)) return;
    writes = writes.then(async () => {
      updateSpecQuestionAnswer(
        located.questionnaire,
        message.questionId,
        message.answer,
      );
      await writeQuestionnaireSafely(located.uri, located.questionnaire);
      await panel.webview.postMessage({
        type: 'saved',
        revision: message.revision,
        status: located.questionnaire.status,
      });
    }).catch(async (error: unknown) => {
      const detail = error instanceof Error ? error.message : String(error);
      outputChannel.appendLine(
        `[${new Date().toISOString()}] Falha ao atualizar ${located.uri.fsPath}: ${detail}`,
      );
      outputChannel.show(true);
      await panel.webview.postMessage({
        type: 'saveError',
        revision: message.revision,
        message: detail,
      });
    });
  });
}

interface AnswerMessage {
  type: 'updateAnswer';
  questionId: string;
  answer: string;
  revision: number;
}

function isAnswerMessage(value: unknown): value is AnswerMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return message.type === 'updateAnswer'
    && typeof message.questionId === 'string'
    && typeof message.answer === 'string'
    && typeof message.revision === 'number';
}

export function renderQuestionnaireHtml(
  questionnaire: SpecQuestionnaire,
  nonce = createNonce(),
): string {
  const language = isPortuguese() ? 'pt-BR' : 'en';
  const copy = isPortuguese()
    ? {
      progress: 'Progresso', essential: 'Essencial', suggestion: 'Sugestão',
      useSuggestion: 'Usar sugestão', answer: 'Resposta', unanswered: 'Sem resposta',
      saved: 'Todas as alterações foram salvas.', saving: 'Salvando…',
      saveError: 'Não foi possível salvar. Edite a resposta para tentar novamente.',
    }
    : {
      progress: 'Progress', essential: 'Essential', suggestion: 'Suggestion',
      useSuggestion: 'Use suggestion', answer: 'Answer', unanswered: 'Unanswered',
      saved: 'All changes saved.', saving: 'Saving…',
      saveError: 'Could not save. Edit the answer to try again.',
    };
  const data = safeJson({ questionnaire, copy });
  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <title>${escapeHtml(questionnaire.title)}</title>
  <style nonce="${nonce}">
    body { max-width: 920px; margin: 0 auto; padding: 28px 32px 64px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); }
    header { position: sticky; top: 0; z-index: 2; padding: 12px 0 18px; background: var(--vscode-editor-background); border-bottom: 1px solid var(--vscode-panel-border); }
    h1 { margin: 0 0 12px; font-size: 1.55rem; }
    .summary { display: flex; align-items: center; gap: 12px; }
    progress { flex: 1; height: 8px; accent-color: var(--vscode-progressBar-background); }
    #save-state { min-height: 1.4em; margin-top: 8px; color: var(--vscode-descriptionForeground); }
    section { margin-top: 30px; }
    section > h2 { font-size: 1.15rem; padding-bottom: 8px; border-bottom: 1px solid var(--vscode-panel-border); }
    article { margin: 18px 0; padding: 18px; border: 1px solid var(--vscode-input-border, var(--vscode-panel-border)); border-radius: 6px; background: var(--vscode-editorWidget-background); }
    .question-title { display: flex; gap: 8px; align-items: baseline; font-weight: 600; line-height: 1.45; }
    .badge { padding: 2px 7px; border-radius: 10px; font-size: .75rem; color: var(--vscode-badge-foreground); background: var(--vscode-badge-background); }
    .suggestion { margin: 12px 0; padding: 10px 12px; border-left: 3px solid var(--vscode-textLink-foreground); color: var(--vscode-descriptionForeground); background: var(--vscode-textBlockQuote-background); }
    .suggestion strong { display: block; margin-bottom: 4px; color: var(--vscode-foreground); }
    textarea { box-sizing: border-box; width: 100%; min-height: 88px; resize: vertical; padding: 9px; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); font: inherit; }
    textarea:focus { outline: 1px solid var(--vscode-focusBorder); border-color: var(--vscode-focusBorder); }
    button { margin: 0 0 10px; padding: 6px 11px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; border-radius: 2px; cursor: pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .error { color: var(--vscode-errorForeground) !important; }
  </style>
</head>
<body>
  <header><h1>${escapeHtml(questionnaire.title)}</h1><div class="summary"><progress id="progress"></progress><span id="progress-label"></span></div><div id="save-state" role="status" aria-live="polite"></div></header>
  <main id="questions"></main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const data = ${data};
    const answers = new Map(data.questionnaire.questions.map(question => [question.id, question.answer]));
    const timers = new Map();
    let revision = 0;
    let latestSavedRevision = 0;
    const main = document.getElementById('questions');
    const saveState = document.getElementById('save-state');

    for (const question of data.questionnaire.questions) {
      let section = main.querySelector('[data-section="' + CSS.escape(question.section) + '"]');
      if (!section) {
        section = document.createElement('section');
        section.dataset.section = question.section;
        const heading = document.createElement('h2');
        heading.textContent = question.section;
        section.appendChild(heading);
        main.appendChild(section);
      }
      const article = document.createElement('article');
      const title = document.createElement('div'); title.className = 'question-title';
      const text = document.createElement('span'); text.textContent = '[' + question.id + '] ' + question.text; title.appendChild(text);
      if (question.essential) { const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = data.copy.essential; title.appendChild(badge); }
      const suggestion = document.createElement('div'); suggestion.className = 'suggestion';
      const suggestionLabel = document.createElement('strong'); suggestionLabel.textContent = data.copy.suggestion; suggestion.append(suggestionLabel, document.createTextNode(question.suggestion));
      const button = document.createElement('button'); button.type = 'button'; button.textContent = data.copy.useSuggestion;
      const textarea = document.createElement('textarea'); textarea.placeholder = data.copy.unanswered; textarea.setAttribute('aria-label', data.copy.answer + ': ' + question.text);
      textarea.value = question.answer === 'manter sugestão' ? question.suggestion : (question.answer || '');
      const update = () => { answers.set(question.id, textarea.value.trim() || null); updateProgress(); scheduleSave(question.id, textarea.value); };
      textarea.addEventListener('input', update);
      button.addEventListener('click', () => {
        textarea.value = question.suggestion;
        answers.set(question.id, 'manter sugestão');
        updateProgress();
        scheduleSave(question.id, 'manter sugestão');
        textarea.focus();
      });
      article.append(title, suggestion, button, textarea); section.appendChild(article);
    }

    function scheduleSave(questionId, answer) {
      clearTimeout(timers.get(questionId));
      saveState.className = ''; saveState.textContent = data.copy.saving;
      timers.set(questionId, setTimeout(() => {
        revision += 1;
        vscode.postMessage({ type: 'updateAnswer', questionId, answer, revision });
      }, 400));
    }
    function updateProgress() {
      const answered = [...answers.values()].filter(answer => answer !== null).length;
      const total = answers.size;
      document.getElementById('progress').value = answered; document.getElementById('progress').max = total;
      document.getElementById('progress-label').textContent = data.copy.progress + ': ' + answered + '/' + total;
    }
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'saved') {
        latestSavedRevision = Math.max(latestSavedRevision, message.revision);
        if (latestSavedRevision === revision) { saveState.className = ''; saveState.textContent = data.copy.saved; }
      } else if (message.type === 'saveError' && message.revision >= latestSavedRevision) {
        saveState.className = 'error'; saveState.textContent = data.copy.saveError + ' ' + message.message;
      }
    });
    updateProgress(); saveState.textContent = data.copy.saved;
  </script>
</body>
</html>`;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const code = character.charCodeAt(0).toString(16).padStart(4, '0');
    return `\\u${code}`;
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

function createNonce(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () =>
    alphabet.charAt(Math.floor(Math.random() * alphabet.length))).join('');
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
