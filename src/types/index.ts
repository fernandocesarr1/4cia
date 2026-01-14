// Enums
// Terminologia conforme BG PM 166/2006 e BG PM 232/2008
export type Posto = "SD" | "CB" | "SGT" | "ST" | "TEN" | "CAP";
export type TipoAfastamento = "FERIAS" | "MEDICO" | "LICENCA" | "CURSO" | "OUTROS";
export type AcaoAuditoria = "CREATE" | "UPDATE" | "DELETE";
// Status Operacional conforme BG PM 166/2006:
// APTO: Apto para o Serviço Policial Militar
// APTO_COM_RESTRICAO: Apto para o SPM com limitações funcionais
// AFASTADO: Temporariamente inapto para o serviço
// Prioridade: AFASTADO > APTO_COM_RESTRICAO > APTO
export type StatusOperacional = "APTO" | "APTO_COM_RESTRICAO" | "AFASTADO";

// Código de Restrição conforme BG PM 166/2006 - 43 códigos
export type CodigoRestricao = 
  | "AA" | "AB" | "AC" | "AD" | "AE" | "AF" | "AG" | "AH" | "AI" | "AJ"
  | "CF" | "CM" | "CP" | "DC" | "DI" | "EC" | "EF" | "EM" | "ES" | "FA"
  | "FF" | "FV" | "LP" | "ME" | "MO" | "PC" | "PE" | "PI" | "PO" | "PV"
  | "RC" | "RD" | "RP" | "SE" | "SP" | "SV" | "TF" | "TP" | "TR" | "UA"
  | "UU" | "VB" | "VP";

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

// Restrição conforme BG PM 166/2006
export interface Restricao {
  id: number;
  policialId: number;
  codigos: CodigoRestricao[];
  dataInicio: string;
  dataFim: string;
  totalDias: number; // Calculado no backend: (dataFim - dataInicio) + 1
  observacao?: string;
  criadoEm: string;
  criadoPor: string;
}

export interface AuditoriaLog {
  id: number;
  entidade: "policiais" | "afastamentos" | "restricoes";
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
  restricaoAtiva: Restricao | null;
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

export interface RestricaoFormData {
  policialId: number;
  codigos: CodigoRestricao[];
  dataInicio: string;
  dataFim: string;
  observacao?: string;
}

// Export data structure
export interface ExportData {
  exportadoEm: string;
  policiais: Policial[];
  afastamentos: Afastamento[];
  restricoes: Restricao[];
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

// 43 Códigos de Restrição conforme BG PM 166/2006
export const CODIGOS_RESTRICAO: { value: CodigoRestricao; label: string; descricao: string }[] = [
  { value: "AA", label: "AA", descricao: "Afastamento de armas de fogo" },
  { value: "AB", label: "AB", descricao: "Afastamento de atividades de busca" },
  { value: "AC", label: "AC", descricao: "Afastamento de condução de veículos" },
  { value: "AD", label: "AD", descricao: "Afastamento de digitação" },
  { value: "AE", label: "AE", descricao: "Afastamento de esforço físico" },
  { value: "AF", label: "AF", descricao: "Afastamento de atividades físicas" },
  { value: "AG", label: "AG", descricao: "Afastamento de atividades gerais" },
  { value: "AH", label: "AH", descricao: "Afastamento de atividades em altura" },
  { value: "AI", label: "AI", descricao: "Afastamento de atividades insalubres" },
  { value: "AJ", label: "AJ", descricao: "Afastamento de jornada noturna" },
  { value: "CF", label: "CF", descricao: "Comparecimento para fisioterapia" },
  { value: "CM", label: "CM", descricao: "Comparecimento médico" },
  { value: "CP", label: "CP", descricao: "Comparecimento para psicoterapia" },
  { value: "DC", label: "DC", descricao: "Dispensa de corrida" },
  { value: "DI", label: "DI", descricao: "Dispensa de instrução" },
  { value: "EC", label: "EC", descricao: "Evitar condução" },
  { value: "EF", label: "EF", descricao: "Educação Física" },
  { value: "EM", label: "EM", descricao: "Evitar marcha" },
  { value: "ES", label: "ES", descricao: "Evitar sol" },
  { value: "FA", label: "FA", descricao: "Flexibilização de atividades" },
  { value: "FF", label: "FF", descricao: "Flexibilização de função" },
  { value: "FV", label: "FV", descricao: "Fardamento voluntário" },
  { value: "LP", label: "LP", descricao: "Limitação de permanência em pé" },
  { value: "ME", label: "ME", descricao: "Medicação em uso" },
  { value: "MO", label: "MO", descricao: "Movimentação reduzida" },
  { value: "PC", label: "PC", descricao: "Proibido carregar peso" },
  { value: "PE", label: "PE", descricao: "Proibido esforço" },
  { value: "PI", label: "PI", descricao: "Proibido instrução" },
  { value: "PO", label: "PO", descricao: "Policiamento" },
  { value: "PV", label: "PV", descricao: "Proibido viagem" },
  { value: "RC", label: "RC", descricao: "Restrição de carga" },
  { value: "RD", label: "RD", descricao: "Repouso domiciliar" },
  { value: "RP", label: "RP", descricao: "Restrição parcial" },
  { value: "SE", label: "SE", descricao: "Serviço externo" },
  { value: "SP", label: "SP", descricao: "Serviço de permanência" },
  { value: "SV", label: "SV", descricao: "Serviço voluntário" },
  { value: "TF", label: "TF", descricao: "Tratamento fisioterápico" },
  { value: "TP", label: "TP", descricao: "Tratamento psicológico" },
  { value: "TR", label: "TR", descricao: "Treinamento restrito" },
  { value: "UA", label: "UA", descricao: "Uso de aparelho ortopédico" },
  { value: "UU", label: "UU", descricao: "Uso de uniforme" },
  { value: "VB", label: "VB", descricao: "Vedado atividade burocrática" },
  { value: "VP", label: "VP", descricao: "Vedado policiamento" },
];

export const CURRENT_USER = "capitao@4cia.pm";
