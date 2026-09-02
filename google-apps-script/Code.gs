/**
 * Granato Marmoraria - endpoint para receber o formulário da landing page
 * e gravar cada lead no Google Sheets.
 *
 * CONFIGURAÇÃO:
 * 1. Crie/abra a planilha que receberá os leads.
 * 2. Copie o ID da planilha (trecho entre /d/ e /edit na URL).
 * 3. Cole o ID em SPREADSHEET_ID abaixo.
 * 4. Implante este script como "Aplicativo da Web":
 *    - Executar como: você
 *    - Quem tem acesso: qualquer pessoa
 * 5. Copie a URL /exec da implantação para js/config.js no site.
 */

const SPREADSHEET_ID = 'COLE_AQUI_O_ID_DA_PLANILHA';
const SHEET_NAME = 'Leads do Site';
const EXPECTED_FORM_TOKEN = 'granato-lp-v1-20260902';

// Ordem preferencial das colunas. Campos extras enviados pelo formulário
// também são adicionados automaticamente à direita.
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
  return HtmlService.createHtmlOutput('Integração Granato ativa.');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lock.waitLock(15000);
    lockAcquired = true;
    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'COLE_AQUI_O_ID_DA_PLANILHA') {
      throw new Error('Configure SPREADSHEET_ID no Apps Script.');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    const params = normalizeParameters_(e && e.parameters ? e.parameters : {});

    if (params.integracao_token !== EXPECTED_FORM_TOKEN) {
      throw new Error('Token de integração inválido.');
    }
    delete params.integracao_token;

    params.data_hora_servidor = new Date();

    const headers = ensureHeaders_(sheet, params);
    const row = headers.map(function(header) {
      return safeCell_(Object.prototype.hasOwnProperty.call(params, header) ? params[header] : '');
    });

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return responseHtml_('granato-form-success');
  } catch (error) {
    console.error(error);
    return responseHtml_('granato-form-error');
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
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

  // Se já há cabeçalho, preserva a ordem e acrescenta apenas campos novos.
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

// Impede que entradas iniciadas por =, +, - ou @ sejam interpretadas
// como fórmulas pela planilha. Datas do servidor continuam como Date real.
function safeCell_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return value;

  const text = String(value == null ? '' : value);
  if (/^[=+\-@]/.test(text)) return "'" + text;
  return text;
}

function responseHtml_(type) {
  const payload = JSON.stringify({ type: type, token: EXPECTED_FORM_TOKEN });
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.parent.postMessage(' + payload + ', "*");<\/script>' +
    '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
