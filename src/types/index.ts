// Enums
// Terminologia conforme BG PM 166/2006 e BG PM 232/2008
export type Posto = "SD" | "CB" | "SGT" | "ST" | "TEN" | "CAP";
export type TipoAfastamento = "FERIAS" | "MEDICO" | "LICENCA" | "CURSO" | "OUTROS";
export type AcaoAuditoria = "CREATE" | "UPDATE" | "DELETE";
// Status Operacional conforme BG PM 166/2006:
// APTO: Apto para o Serviço Policial Militar
// APTO_COM_RESTRICAO: Apto para o SPM com limitações funcionais
// AFASTADO: Temporariamente inapto para o serviço
export type StatusOperacional = "APTO" | "APTO_COM_RESTRICAO" | "AFASTADO";

// Entities
export interface Policial {
  id: number;
  re: string;
  nome: string;
  nomeGuerra: string;
  posto: Posto;
  ativo: boolean;
  criadoEm: string;
  criadoPor: string;
}

export interface Afastamento {
  id: number;
  policialId: number;
  tipo: TipoAfastamento;
  dataInicio: string;
  dataFim: string;
  documento?: string;
  observacao?: string;
  criadoEm: string;
  criadoPor: string;
}

export interface AuditoriaLog {
  id: number;
  entidade: "policiais" | "afastamentos";
  entidadeId: number;
  acao: AcaoAuditoria;
  usuarioEmail: string;
  dataHora: string;
  dadosAntes?: Record<string, unknown>;
  dadosDepois?: Record<string, unknown>;
  descricaoHumana: string;
}

// Calculated types
export interface StatusResult {
  status: StatusOperacional;
  afastamentoAtivo: Afastamento | null;
}

export interface PolicialComStatus extends Policial {
  statusResult: StatusResult;
}

// Form types
export interface PolicialFormData {
  re: string;
  nome: string;
  nomeGuerra: string;
  posto: Posto;
  ativo: boolean;
}

export interface AfastamentoFormData {
  policialId: number;
  tipo: TipoAfastamento;
  dataInicio: string;
  dataFim: string;
  documento?: string;
  observacao?: string;
}

// Export data structure
export interface ExportData {
  exportadoEm: string;
  policiais: Policial[];
  afastamentos: Afastamento[];
  auditoria: AuditoriaLog[];
}

// Constants
export const POSTOS: { value: Posto; label: string }[] = [
  { value: "SD", label: "Soldado" },
  { value: "CB", label: "Cabo" },
  { value: "SGT", label: "Sargento" },
  { value: "ST", label: "Subtenente" },
  { value: "TEN", label: "Tenente" },
  { value: "CAP", label: "Capitão" },
];

export const TIPOS_AFASTAMENTO: { value: TipoAfastamento; label: string }[] = [
  { value: "FERIAS", label: "Férias" },
  { value: "MEDICO", label: "Médico" },
  { value: "LICENCA", label: "Licença" },
  { value: "CURSO", label: "Curso" },
  { value: "OUTROS", label: "Outros" },
];

export const CURRENT_USER = "capitao@4cia.pm";
