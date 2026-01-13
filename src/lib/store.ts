import { 
  Policial, 
  Afastamento, 
  AuditoriaLog, 
  PolicialFormData, 
  AfastamentoFormData,
  StatusResult,
  CURRENT_USER
} from "@/types";

// Storage keys
const STORAGE_KEYS = {
  policiais: "sigo_policiais",
  afastamentos: "sigo_afastamentos",
  auditoria: "sigo_auditoria",
  nextIds: "sigo_next_ids",
};

interface NextIds {
  policial: number;
  afastamento: number;
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
  if (!localStorage.getItem(STORAGE_KEYS.auditoria)) {
    localStorage.setItem(STORAGE_KEYS.auditoria, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.nextIds)) {
    localStorage.setItem(STORAGE_KEYS.nextIds, JSON.stringify({
      policial: 1,
      afastamento: 1,
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

// Audit logging
function logAuditoria(
  entidade: "policiais" | "afastamentos",
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
    .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
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
    
    const novoInicio = new Date(dataInicio);
    const novoFim = new Date(dataFim);
    const existInicio = new Date(af.dataInicio);
    const existFim = new Date(af.dataFim);

    // Check overlap
    if (novoInicio <= existFim && novoFim >= existInicio) {
      return af;
    }
  }
  
  return null;
}

export function createAfastamento(data: AfastamentoFormData): { success: boolean; error?: string; afastamento?: Afastamento } {
  initStorage();

  // Validate dates
  if (new Date(data.dataFim) < new Date(data.dataInicio)) {
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

  // Validate dates
  if (new Date(updated.dataFim) < new Date(updated.dataInicio)) {
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

// Status calculation
export function calcularStatus(policialId: number, dataReferencia: string): StatusResult {
  const afastamentos = getAfastamentosByPolicialId(policialId);
  const refDate = new Date(dataReferencia);

  for (const af of afastamentos) {
    const inicio = new Date(af.dataInicio);
    const fim = new Date(af.dataFim);

    if (refDate >= inicio && refDate <= fim) {
      return { status: "AFASTADO", afastamentoAtivo: af };
    }
  }

  return { status: "PLENO", afastamentoAtivo: null };
}

// Auditoria
export function getAuditoriaLogs(): AuditoriaLog[] {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.auditoria) || "[]");
}

export function getAuditoriaLogsFiltered(
  entidade?: "policiais" | "afastamentos" | "todos",
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

// Export
export function exportData(): string {
  const data = {
    exportadoEm: new Date().toISOString(),
    policiais: getPoliciais(),
    afastamentos: getAfastamentos(),
    auditoria: getAuditoriaLogs().slice(0, 1000),
  };
  return JSON.stringify(data, null, 2);
}

// Helpers
export function formatDateBR(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTimeBR(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("pt-BR");
}

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
  ];

  for (const p of demoPolices) {
    createPolicial(p);
  }

  // Add some afastamentos
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 10);

  createAfastamento({
    policialId: 2,
    tipo: "MEDICO",
    dataInicio: today.toISOString().split("T")[0],
    dataFim: futureDate.toISOString().split("T")[0],
    documento: "Atestado 2024/001",
    observacao: "Tratamento médico programado",
  });

  const pastStart = new Date(today);
  pastStart.setDate(pastStart.getDate() - 5);
  const pastEnd = new Date(today);
  pastEnd.setDate(pastEnd.getDate() + 5);

  createAfastamento({
    policialId: 4,
    tipo: "FERIAS",
    dataInicio: pastStart.toISOString().split("T")[0],
    dataFim: pastEnd.toISOString().split("T")[0],
    documento: "Portaria 123/2026",
  });
}
