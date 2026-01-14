import { 
  Policial, 
  Afastamento, 
  Restricao,
  AuditoriaLog, 
  PolicialFormData, 
  AfastamentoFormData,
  RestricaoFormData,
  StatusResult,
  CodigoRestricao,
  CURRENT_USER,
  CODIGOS_RESTRICAO
} from "@/types";

// ============================================
// DATE UTILITIES - PURE DATE HANDLING (NO TIMEZONE)
// ============================================

/**
 * Parse date string YYYY-MM-DD to local date components
 * CRITICAL: Never use new Date(dateString) as it interprets as UTC
 */
function parseDatePure(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

/**
 * Compare two YYYY-MM-DD date strings
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareDates(a: string, b: string): number {
  // String comparison works for YYYY-MM-DD format
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Check if date is within range (inclusive)
 * All parameters must be YYYY-MM-DD strings
 */
function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/**
 * Check if two date ranges overlap
 * All parameters must be YYYY-MM-DD strings
 */
function dateRangesOverlap(
  start1: string, end1: string, 
  start2: string, end2: string
): boolean {
  return start1 <= end2 && end1 >= start2;
}

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate total days between two dates (inclusive)
 * All parameters must be YYYY-MM-DD strings
 */
function calculateTotalDays(start: string, end: string): number {
  const { year: y1, month: m1, day: d1 } = parseDatePure(start);
  const { year: y2, month: m2, day: d2 } = parseDatePure(end);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 to include both start and end dates
}

/**
 * Add days to a YYYY-MM-DD string
 */
function addDays(dateStr: string, days: number): string {
  const { year, month, day } = parseDatePure(dateStr);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Storage keys
const STORAGE_KEYS = {
  policiais: "sigo_policiais",
  afastamentos: "sigo_afastamentos",
  restricoes: "sigo_restricoes",
  auditoria: "sigo_auditoria",
  nextIds: "sigo_next_ids",
};

interface NextIds {
  policial: number;
  afastamento: number;
  restricao: number;
  auditoria: number;
}

// Initialize storage
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.policiais)) {
    localStorage.setItem(STORAGE_KEYS.policiais, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.afastamentos)) {
    localStorage.setItem(STORAGE_KEYS.afastamentos, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.restricoes)) {
    localStorage.setItem(STORAGE_KEYS.restricoes, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.auditoria)) {
    localStorage.setItem(STORAGE_KEYS.auditoria, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.nextIds)) {
    localStorage.setItem(STORAGE_KEYS.nextIds, JSON.stringify({
      policial: 1,
      afastamento: 1,
      restricao: 1,
      auditoria: 1,
    }));
  }
}

function getNextId(type: keyof NextIds): number {
  const ids = JSON.parse(localStorage.getItem(STORAGE_KEYS.nextIds) || "{}") as NextIds;
  const nextId = ids[type] || 1;
  ids[type] = nextId + 1;
  localStorage.setItem(STORAGE_KEYS.nextIds, JSON.stringify(ids));
  return nextId;
}

// Audit logging - Extended for restricoes
function logAuditoria(
  entidade: "policiais" | "afastamentos" | "restricoes",
  entidadeId: number,
  acao: "CREATE" | "UPDATE" | "DELETE",
  descricaoHumana: string,
  dadosAntes?: Record<string, unknown>,
  dadosDepois?: Record<string, unknown>
): void {
  const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.auditoria) || "[]") as AuditoriaLog[];
  const log: AuditoriaLog = {
    id: getNextId("auditoria"),
    entidade,
    entidadeId,
    acao,
    usuarioEmail: CURRENT_USER,
    dataHora: new Date().toISOString(),
    dadosAntes,
    dadosDepois,
    descricaoHumana,
  };
  logs.unshift(log);
  localStorage.setItem(STORAGE_KEYS.auditoria, JSON.stringify(logs));
}

// Policiais CRUD
export function getPoliciais(): Policial[] {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.policiais) || "[]");
}

export function getPoliciaisAtivos(): Policial[] {
  return getPoliciais().filter(p => p.ativo);
}

export function getPolicialById(id: number): Policial | undefined {
  return getPoliciais().find(p => p.id === id);
}

export function getPolicialByRe(re: string): Policial | undefined {
  return getPoliciais().find(p => p.re === re);
}

export function createPolicial(data: PolicialFormData): { success: boolean; error?: string; policial?: Policial } {
  initStorage();
  
  // Validate unique RE
  if (getPolicialByRe(data.re)) {
    return { success: false, error: "Este RE já está cadastrado" };
  }

  const policiais = getPoliciais();
  const policial: Policial = {
    id: getNextId("policial"),
    ...data,
    criadoEm: new Date().toISOString(),
    criadoPor: CURRENT_USER,
  };

  policiais.push(policial);
  localStorage.setItem(STORAGE_KEYS.policiais, JSON.stringify(policiais));

  logAuditoria(
    "policiais",
    policial.id,
    "CREATE",
    `Criou policial ${data.posto} ${data.nomeGuerra} (RE: ${data.re})`,
    undefined,
    policial as unknown as Record<string, unknown>
  );

  return { success: true, policial };
}

export function updatePolicial(id: number, data: Partial<PolicialFormData>): { success: boolean; error?: string } {
  const policiais = getPoliciais();
  const index = policiais.findIndex(p => p.id === id);
  
  if (index === -1) {
    return { success: false, error: "Policial não encontrado" };
  }

  // Check RE uniqueness if updating RE
  if (data.re && data.re !== policiais[index].re && getPolicialByRe(data.re)) {
    return { success: false, error: "Este RE já está cadastrado" };
  }

  const antes = { ...policiais[index] };
  policiais[index] = { ...policiais[index], ...data };
  localStorage.setItem(STORAGE_KEYS.policiais, JSON.stringify(policiais));

  logAuditoria(
    "policiais",
    id,
    "UPDATE",
    `Atualizou policial ${policiais[index].posto} ${policiais[index].nomeGuerra}`,
    antes as unknown as Record<string, unknown>,
    policiais[index] as unknown as Record<string, unknown>
  );

  return { success: true };
}

export function deletePolicial(id: number): { success: boolean; error?: string } {
  const policiais = getPoliciais();
  const policial = policiais.find(p => p.id === id);
  
  if (!policial) {
    return { success: false, error: "Policial não encontrado" };
  }

  // Remove associated afastamentos
  const afastamentos = getAfastamentos().filter(a => a.policialId !== id);
  localStorage.setItem(STORAGE_KEYS.afastamentos, JSON.stringify(afastamentos));

  // Remove associated restricoes
  const restricoes = getRestricoes().filter(r => r.policialId !== id);
  localStorage.setItem(STORAGE_KEYS.restricoes, JSON.stringify(restricoes));

  const filtered = policiais.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.policiais, JSON.stringify(filtered));

  logAuditoria(
    "policiais",
    id,
    "DELETE",
    `Removeu policial ${policial.posto} ${policial.nomeGuerra} (RE: ${policial.re})`,
    policial as unknown as Record<string, unknown>
  );

  return { success: true };
}

// Afastamentos CRUD
export function getAfastamentos(): Afastamento[] {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.afastamentos) || "[]");
}

export function getAfastamentosByPolicialId(policialId: number): Afastamento[] {
  return getAfastamentos()
    .filter(a => a.policialId === policialId)
    .sort((a, b) => compareDates(b.dataInicio, a.dataInicio));
}

export function getAfastamentoById(id: number): Afastamento | undefined {
  return getAfastamentos().find(a => a.id === id);
}

function checkAfastamentoOverlap(
  policialId: number, 
  dataInicio: string, 
  dataFim: string,
  excludeId?: number
): Afastamento | null {
  const afastamentos = getAfastamentosByPolicialId(policialId);
  
  for (const af of afastamentos) {
    if (excludeId && af.id === excludeId) continue;
    
    // Use pure string comparison for dates (YYYY-MM-DD format)
    if (dateRangesOverlap(dataInicio, dataFim, af.dataInicio, af.dataFim)) {
      return af;
    }
  }
  
  return null;
}

export function createAfastamento(data: AfastamentoFormData): { success: boolean; error?: string; afastamento?: Afastamento } {
  initStorage();

  // Validate dates using pure string comparison
  if (compareDates(data.dataFim, data.dataInicio) < 0) {
    return { success: false, error: "Data fim deve ser igual ou posterior à data início" };
  }

  // Check overlap
  const overlap = checkAfastamentoOverlap(data.policialId, data.dataInicio, data.dataFim);
  if (overlap) {
    const tipoLabel = overlap.tipo;
    return { 
      success: false, 
      error: `Já existe afastamento ${tipoLabel} de ${formatDateBR(overlap.dataInicio)} a ${formatDateBR(overlap.dataFim)} para este policial` 
    };
  }

  const afastamentos = getAfastamentos();
  const afastamento: Afastamento = {
    id: getNextId("afastamento"),
    ...data,
    criadoEm: new Date().toISOString(),
    criadoPor: CURRENT_USER,
  };

  afastamentos.push(afastamento);
  localStorage.setItem(STORAGE_KEYS.afastamentos, JSON.stringify(afastamentos));

  const policial = getPolicialById(data.policialId);
  logAuditoria(
    "afastamentos",
    afastamento.id,
    "CREATE",
    `Registrou afastamento ${data.tipo} de ${formatDateBR(data.dataInicio)} a ${formatDateBR(data.dataFim)} para ${policial?.nomeGuerra || "policial"}`,
    undefined,
    afastamento as unknown as Record<string, unknown>
  );

  return { success: true, afastamento };
}

export function updateAfastamento(id: number, data: Partial<AfastamentoFormData>): { success: boolean; error?: string } {
  const afastamentos = getAfastamentos();
  const index = afastamentos.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { success: false, error: "Afastamento não encontrado" };
  }

  const updated = { ...afastamentos[index], ...data };

  // Validate dates using pure string comparison
  if (compareDates(updated.dataFim, updated.dataInicio) < 0) {
    return { success: false, error: "Data fim deve ser igual ou posterior à data início" };
  }

  // Check overlap
  const overlap = checkAfastamentoOverlap(updated.policialId, updated.dataInicio, updated.dataFim, id);
  if (overlap) {
    return { 
      success: false, 
      error: `Já existe afastamento ${overlap.tipo} de ${formatDateBR(overlap.dataInicio)} a ${formatDateBR(overlap.dataFim)} para este policial` 
    };
  }

  const antes = { ...afastamentos[index] };
  afastamentos[index] = updated;
  localStorage.setItem(STORAGE_KEYS.afastamentos, JSON.stringify(afastamentos));

  logAuditoria(
    "afastamentos",
    id,
    "UPDATE",
    `Atualizou afastamento de ${antes.tipo} para ${updated.tipo}`,
    antes as unknown as Record<string, unknown>,
    updated as unknown as Record<string, unknown>
  );

  return { success: true };
}

export function deleteAfastamento(id: number): { success: boolean; error?: string } {
  const afastamentos = getAfastamentos();
  const afastamento = afastamentos.find(a => a.id === id);
  
  if (!afastamento) {
    return { success: false, error: "Afastamento não encontrado" };
  }

  const filtered = afastamentos.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.afastamentos, JSON.stringify(filtered));

  const policial = getPolicialById(afastamento.policialId);
  logAuditoria(
    "afastamentos",
    id,
    "DELETE",
    `Removeu afastamento ${afastamento.tipo} de ${policial?.nomeGuerra || "policial"}`,
    afastamento as unknown as Record<string, unknown>
  );

  return { success: true };
}

// ============================================
// RESTRICOES CRUD - Conforme BG PM 166/2006
// ============================================

export function getRestricoes(): Restricao[] {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.restricoes) || "[]");
}

export function getRestricoesByPolicialId(policialId: number): Restricao[] {
  return getRestricoes()
    .filter(r => r.policialId === policialId)
    .sort((a, b) => compareDates(b.dataInicio, a.dataInicio));
}

export function getRestricaoById(id: number): Restricao | undefined {
  return getRestricoes().find(r => r.id === id);
}

/**
 * Validate restriction codes against the 43 official codes
 */
function validateCodigos(codigos: CodigoRestricao[]): { valid: boolean; invalidCode?: string } {
  const validCodes = CODIGOS_RESTRICAO.map(c => c.value);
  for (const codigo of codigos) {
    if (!validCodes.includes(codigo)) {
      return { valid: false, invalidCode: codigo };
    }
  }
  return { valid: true };
}

export function createRestricao(data: RestricaoFormData): { success: boolean; error?: string; restricao?: Restricao } {
  initStorage();

  // Validate policial exists
  const policial = getPolicialById(data.policialId);
  if (!policial) {
    return { success: false, error: "Policial não encontrado" };
  }

  // Validate at least one code selected
  if (!data.codigos || data.codigos.length === 0) {
    return { success: false, error: "Selecione pelo menos um código de restrição" };
  }

  // Validate codes are valid
  const codigosValidation = validateCodigos(data.codigos);
  if (!codigosValidation.valid) {
    return { success: false, error: `Código inválido: ${codigosValidation.invalidCode}` };
  }

  // Validate dates using pure string comparison
  if (compareDates(data.dataFim, data.dataInicio) < 0) {
    return { success: false, error: "Data fim deve ser igual ou posterior à data início" };
  }

  // Calculate totalDias on backend (never trust frontend value)
  const totalDias = calculateTotalDays(data.dataInicio, data.dataFim);

  const restricoes = getRestricoes();
  const restricao: Restricao = {
    id: getNextId("restricao"),
    policialId: data.policialId,
    codigos: data.codigos,
    dataInicio: data.dataInicio,
    dataFim: data.dataFim,
    totalDias,
    observacao: data.observacao,
    criadoEm: new Date().toISOString(),
    criadoPor: CURRENT_USER,
  };

  restricoes.push(restricao);
  localStorage.setItem(STORAGE_KEYS.restricoes, JSON.stringify(restricoes));

  // Audit log with semantic description
  const codigosStr = data.codigos.join(", ");
  logAuditoria(
    "restricoes",
    restricao.id,
    "CREATE",
    `Registrou restrição ${codigosStr} de ${formatDateBR(data.dataInicio)} a ${formatDateBR(data.dataFim)} para ${policial.posto} ${policial.nomeGuerra} (Total: ${totalDias} dias)`,
    undefined,
    restricao as unknown as Record<string, unknown>
  );

  return { success: true, restricao };
}

export function updateRestricao(id: number, data: Partial<RestricaoFormData>): { success: boolean; error?: string } {
  const restricoes = getRestricoes();
  const index = restricoes.findIndex(r => r.id === id);
  
  if (index === -1) {
    return { success: false, error: "Restrição não encontrada" };
  }

  const updated = { 
    ...restricoes[index], 
    ...data,
  };

  // Validate codes if provided
  if (data.codigos) {
    if (data.codigos.length === 0) {
      return { success: false, error: "Selecione pelo menos um código de restrição" };
    }
    const codigosValidation = validateCodigos(data.codigos);
    if (!codigosValidation.valid) {
      return { success: false, error: `Código inválido: ${codigosValidation.invalidCode}` };
    }
  }

  // Validate dates
  if (compareDates(updated.dataFim, updated.dataInicio) < 0) {
    return { success: false, error: "Data fim deve ser igual ou posterior à data início" };
  }

  // Recalculate totalDias
  updated.totalDias = calculateTotalDays(updated.dataInicio, updated.dataFim);

  const antes = { ...restricoes[index] };
  restricoes[index] = updated;
  localStorage.setItem(STORAGE_KEYS.restricoes, JSON.stringify(restricoes));

  const policial = getPolicialById(updated.policialId);
  logAuditoria(
    "restricoes",
    id,
    "UPDATE",
    `Atualizou restrição de ${policial?.nomeGuerra || "policial"}`,
    antes as unknown as Record<string, unknown>,
    updated as unknown as Record<string, unknown>
  );

  return { success: true };
}

export function deleteRestricao(id: number): { success: boolean; error?: string } {
  const restricoes = getRestricoes();
  const restricao = restricoes.find(r => r.id === id);
  
  if (!restricao) {
    return { success: false, error: "Restrição não encontrada" };
  }

  const filtered = restricoes.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.restricoes, JSON.stringify(filtered));

  const policial = getPolicialById(restricao.policialId);
  logAuditoria(
    "restricoes",
    id,
    "DELETE",
    `Removeu restrição ${restricao.codigos.join(", ")} de ${policial?.nomeGuerra || "policial"}`,
    restricao as unknown as Record<string, unknown>
  );

  return { success: true };
}

// ============================================
// STATUS CALCULATION - BG PM 166/2006
// Prioridade: AFASTADO > APTO_COM_RESTRICAO > APTO
// Status é SEMPRE calculado dinamicamente, NUNCA persistido
// ============================================

export function calcularStatus(policialId: number, dataReferencia: string): StatusResult {
  // 1. Check for afastamento (highest priority)
  const afastamentos = getAfastamentosByPolicialId(policialId);
  for (const af of afastamentos) {
    if (isDateInRange(dataReferencia, af.dataInicio, af.dataFim)) {
      return { 
        status: "AFASTADO", 
        afastamentoAtivo: af,
        restricaoAtiva: null 
      };
    }
  }

  // 2. Check for restricao (second priority)
  const restricoes = getRestricoesByPolicialId(policialId);
  for (const rest of restricoes) {
    if (isDateInRange(dataReferencia, rest.dataInicio, rest.dataFim)) {
      return { 
        status: "APTO_COM_RESTRICAO", 
        afastamentoAtivo: null,
        restricaoAtiva: rest 
      };
    }
  }

  // 3. Default: APTO (lowest priority)
  return { 
    status: "APTO", 
    afastamentoAtivo: null,
    restricaoAtiva: null 
  };
}

// Auditoria
export function getAuditoriaLogs(): AuditoriaLog[] {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.auditoria) || "[]");
}

export function getAuditoriaLogsFiltered(
  entidade?: "policiais" | "afastamentos" | "restricoes" | "todos",
  dataInicio?: string,
  dataFim?: string,
  usuario?: string
): AuditoriaLog[] {
  let logs = getAuditoriaLogs();

  if (entidade && entidade !== "todos") {
    logs = logs.filter(l => l.entidade === entidade);
  }

  if (dataInicio) {
    logs = logs.filter(l => new Date(l.dataHora) >= new Date(dataInicio));
  }

  if (dataFim) {
    logs = logs.filter(l => new Date(l.dataHora) <= new Date(dataFim + "T23:59:59"));
  }

  if (usuario) {
    logs = logs.filter(l => l.usuarioEmail.toLowerCase().includes(usuario.toLowerCase()));
  }

  return logs;
}

// Export - Updated to include restricoes
export function exportData(): string {
  const data = {
    exportadoEm: new Date().toISOString(),
    policiais: getPoliciais(),
    afastamentos: getAfastamentos(),
    restricoes: getRestricoes(),
    auditoria: getAuditoriaLogs().slice(0, 1000),
  };
  return JSON.stringify(data, null, 2);
}

// Helpers - Pure date formatting without Date object timezone issues
export function formatDateBR(dateStr: string): string {
  // dateStr is YYYY-MM-DD format - parse manually to avoid timezone issues
  const { year, month, day } = parseDatePure(dateStr);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function formatDateTimeBR(dateStr: string): string {
  // For datetime strings (ISO format), we can use Date safely
  const date = new Date(dateStr);
  return date.toLocaleString("pt-BR");
}

// Export utility functions for use in other components
export { getTodayString, isDateInRange, compareDates, calculateTotalDays, addDays };

// Seed data for demo
export function seedDemoData(): void {
  if (getPoliciais().length > 0) return;

  const demoPolices: PolicialFormData[] = [
    { re: "123456", nome: "João Pedro Silva Santos", nomeGuerra: "SILVA", posto: "SGT", ativo: true },
    { re: "234567", nome: "Maria Fernanda Oliveira", nomeGuerra: "OLIVEIRA", posto: "CB", ativo: true },
    { re: "345678", nome: "Carlos Eduardo Costa", nomeGuerra: "COSTA", posto: "SD", ativo: true },
    { re: "456789", nome: "Ana Paula Rodrigues", nomeGuerra: "RODRIGUES", posto: "TEN", ativo: true },
    { re: "567890", nome: "Pedro Henrique Almeida", nomeGuerra: "ALMEIDA", posto: "SD", ativo: true },
    { re: "678901", nome: "Luciana Beatriz Souza", nomeGuerra: "SOUZA", posto: "CB", ativo: true },
    { re: "961722", nome: "Elizenda Maria Santos", nomeGuerra: "ELIZENDA", posto: "CB", ativo: true },
  ];

  for (const p of demoPolices) {
    createPolicial(p);
  }

  const today = getTodayString();
  const futureDate = addDays(today, 10);
  const pastStart = addDays(today, -5);
  const pastEnd = addDays(today, 5);

  createAfastamento({
    policialId: 2,
    tipo: "MEDICO",
    dataInicio: today,
    dataFim: futureDate,
    documento: "Atestado 2024/001",
    observacao: "Tratamento médico programado",
  });

  createAfastamento({
    policialId: 4,
    tipo: "FERIAS",
    dataInicio: pastStart,
    dataFim: pastEnd,
    documento: "Portaria 123/2026",
  });

  // Create demo restriction for Elizenda (Cb 961722)
  const restricaoStart = addDays(today, -30);
  const restricaoEnd = addDays(today, 150);
  
  createRestricao({
    policialId: 7,
    codigos: ["EF", "LP", "PO", "SP"],
    dataInicio: restricaoStart,
    dataFim: restricaoEnd,
    observacao: "Restrição médica temporária conforme BG PM 166/2006",
  });
}
