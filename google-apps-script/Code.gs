/**
 * Granato Marmoraria — Google Sheets endpoint
 *
 * RECOMENDADO:
 * 1) Abra a planilha que receberá os leads.
 * 2) Vá em Extensões > Apps Script.
 * 3) Substitua o conteúdo do Code.gs por este arquivo.
 * 4) Implantar > Gerenciar implantações > editar > Nova versão.
 * 5) Executar como: você | Acesso: qualquer pessoa.
 *
 * Se este projeto NÃO estiver vinculado à planilha, preencha SPREADSHEET_ID.
 */

const SPREADSHEET_ID = ''; // deixe vazio se o Apps Script foi criado de dentro da planilha
const SHEET_NAME = 'Leads do Site';
const EXPECTED_FORM_TOKEN = 'granato-lp-v1-20260902';

const PREFERRED_FIELDS = [
  'data_hora_servidor',
  'nome',
  'telefone',
  'cidade',
  'tipo_projeto',
  'material',
  'projeto_arquitetonico',
  'prazo',
  'mensagem',
  'lgpd_consentimento',
  'origem',
  'pagina',
  'referencia',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'data_hora_cliente'
];

function doGet() {
  try {
    const spreadsheet = getSpreadsheet_();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    return HtmlService.createHtmlOutput(
      'Integração Granato ativa. Planilha conectada. Aba: ' + escapeHtml_(sheet.getName())
    );
  } catch (error) {
    return HtmlService.createHtmlOutput(
      'ERRO DE CONFIGURAÇÃO: ' + escapeHtml_(error.message || String(error))
    );
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lock.waitLock(15000);
    lockAcquired = true;

    const spreadsheet = getSpreadsheet_();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    const params = normalizeParameters_(e && e.parameters ? e.parameters : {});

    if (params.integracao_token !== EXPECTED_FORM_TOKEN) {
      throw new Error('Token de integração inválido ou ausente.');
    }
    delete params.integracao_token;

    if (!params.nome || !params.telefone) {
      throw new Error('Nome e telefone são obrigatórios.');
    }

    params.data_hora_servidor = new Date();

    const headers = ensureHeaders_(sheet, params);
    const row = headers.map(function(header) {
      return safeCell_(Object.prototype.hasOwnProperty.call(params, header) ? params[header] : '');
    });

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return responseHtml_('granato-form-success', 'Lead gravado no Google Sheets.');
  } catch (error) {
    console.error(error);
    return responseHtml_('granato-form-error', error.message || 'Erro ao gravar na planilha.');
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}

/** Execute esta função manualmente no editor uma vez para testar a conexão. */
function testarPlanilha() {
  const spreadsheet = getSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  sheet.appendRow(['TESTE APPS SCRIPT', new Date()]);
  SpreadsheetApp.flush();
  Logger.log('OK — teste gravado na aba: ' + sheet.getName());
}

function getSpreadsheet_() {
  // Projeto vinculado: criado em Extensões > Apps Script dentro da própria planilha.
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  // Projeto independente: use o ID da planilha.
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }

  throw new Error(
    'Nenhuma planilha vinculada. Abra a planilha > Extensões > Apps Script e use este código, ou preencha SPREADSHEET_ID.'
  );
}

function normalizeParameters_(parameters) {
  const normalized = {};
  Object.keys(parameters).forEach(function(key) {
    const value = parameters[key];
    normalized[key] = Array.isArray(value) ? value.join(', ') : String(value || '');
  });
  return normalized;
}

function ensureHeaders_(sheet, params) {
  const lastColumn = sheet.getLastColumn();
  let currentHeaders = [];

  if (lastColumn > 0 && sheet.getLastRow() > 0) {
    currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
      .map(function(value) { return String(value || '').trim(); })
      .filter(Boolean);
  }

  const incomingKeys = Object.keys(params);
  const desiredHeaders = [];

  PREFERRED_FIELDS.forEach(function(field) {
    if (incomingKeys.indexOf(field) !== -1 || field === 'data_hora_servidor') {
      desiredHeaders.push(field);
    }
  });

  incomingKeys.forEach(function(field) {
    if (desiredHeaders.indexOf(field) === -1) desiredHeaders.push(field);
  });

  const finalHeaders = currentHeaders.length ? currentHeaders.slice() : desiredHeaders.slice();
  desiredHeaders.forEach(function(field) {
    if (finalHeaders.indexOf(field) === -1) finalHeaders.push(field);
  });

  if (finalHeaders.length && (!currentHeaders.length || finalHeaders.length !== currentHeaders.length)) {
    sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
    sheet.setFrozenRows(1);
  }

  return finalHeaders;
}

function safeCell_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return value;
  const text = String(value == null ? '' : value);
  if (/^[=+\-@]/.test(text)) return "'" + text;
  return text;
}

function responseHtml_(type, message) {
  const payload = JSON.stringify({
    type: type,
    token: EXPECTED_FORM_TOKEN,
    message: String(message || '')
  });

  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.parent.postMessage(' + payload + ', "*");<\/script>' +
    '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
