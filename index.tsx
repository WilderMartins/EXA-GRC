import React, { useState, useMemo, createContext, useContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, LayoutDashboard, BarChart3, Users, Settings, Briefcase, GanttChartSquare, BrainCircuit, Zap, Plus, Search, DatabaseZap, AlertTriangle, ChevronDown, Upload, Download, Edit, Trash2, UserPlus, Bell, RefreshCw, FileDown } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- AI Client Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- DUMMY DATA & TYPES ---

// Enums
enum UserRole { Admin = 'Admin', Manager = 'Manager', RiskAnalyst = 'Risk Analyst', Guest = 'Guest' }
enum RiskStatus { 
    Open = 'Aberto', 
    InProgress = 'Em Andamento', 
    Mitigated = 'Mitigado', 
    Accepted = 'Aceito',
    Canceled = 'Cancelado'
}
enum RiskType {
    Operational = 'Operacional',
    Compliance = 'Conformidade',
    Financial = 'Financeiro',
    Strategic = 'Estratégico',
    Obsolescence = 'Obsolescência',
    Security = 'Segurança',
}
enum FrameworkName { NIST = 'NIST CSF 2.0', CIS = 'CIS Controls v8', LGPD = 'LGPD' }
// FIX: Added 'InProgress' to allow its use in the mock data for controls.
enum ControlStatus { NotImplemented = 'Não Implementado', PartiallyImplemented = 'Parcialmente Implementado', FullyImplemented = 'Totalmente Implementado', InProgress = 'Em Progresso' }
enum DataControlStatus { Active = 'Ativo', Inactive = 'Inativo', InReview = 'Em Revisão' }
enum AssetCriticality { Low = 'Baixa', Medium = 'Média', High = 'Alta', Critical = 'Crítica' }
enum AssetType { Server = 'Servidor', WebApp = 'Aplicação Web', Database = 'Banco de Dados', IPAddress = 'Endereço IP', Domain = 'Domínio', MobileApp = 'Aplicativo Mobile', Other = 'Outro' }


// Interfaces
interface User { id: number; name: string; email: string; role: UserRole; avatarUrl?: string; }
interface Risk {
  id: number;
  creationDate: string;
  title: string;
  description: string;
  probability: number;
  impact: number;
  status: RiskStatus;
  owner: string; // Responsável
  dueDate: string; // Prazo
  type: RiskType; // Tipo do Risco
  sla: number;
  planResponsible: string;
  technicalResponsible: string;
  actionPlan: string;
  completionDate?: string;
}
interface Control {
    id: string;
    framework: FrameworkName;
    family: string;
    name:string;
    description: string;
    status?: ControlStatus;
    processScore?: number; // 1-5 for NIST processes
    practiceScore?: number; // 1-5 for NIST practices
}
interface DataControl {
    id: number;
    name: string;
    description: string;
    category: string;
    relatedRegulation: string;
    status: DataControlStatus;
    criticality: AssetCriticality;
    owner: string;
}
interface Asset {
    id: number;
    name: string;
    type: AssetType;
    criticality: AssetCriticality;
    owner: string;
}

// Mock Data
const mockUsers: Record<UserRole, User> = {
    [UserRole.Admin]: { id: 1, name: 'Admin User', email: 'admin@exa.com.br', role: UserRole.Admin },
    [UserRole.RiskAnalyst]: { id: 2, name: 'Analyst User', email: 'analyst@exa.com.br', role: UserRole.RiskAnalyst },
    [UserRole.Manager]: { id: 3, name: 'Manager User', email: 'manager@exa.com.br', role: UserRole.Manager },
    [UserRole.Guest]: { id: 4, name: 'Guest User', email: 'guest@exa.com.br', role: UserRole.Guest },
};

const initialRisks: Risk[] = [
    { 
        id: 1, 
        creationDate: '2024-05-10T10:00:00Z',
        title: 'Acesso não autorizado ao banco de dados', 
        description: 'Um atacante externo pode explorar uma vulnerabilidade SQL Injection para ganhar acesso.', 
        probability: 4, 
        impact: 5, 
        status: RiskStatus.Open, 
        owner: 'Equipe de Segurança',
        dueDate: '2024-08-30',
        type: RiskType.Security,
        sla: 30,
        planResponsible: 'João Silva',
        technicalResponsible: 'Maria Souza',
        actionPlan: 'Realizar pentest na aplicação e corrigir vulnerabilidades encontradas.',
        completionDate: '',
    },
    { 
        id: 2, 
        creationDate: '2024-06-20T14:30:00Z',
        title: 'Vazamento de dados por phishing', 
        description: 'Colaboradores podem ser enganados por emails de phishing e divulgar credenciais.', 
        probability: 3, 
        impact: 4, 
        status: RiskStatus.InProgress, 
        owner: 'Suporte de TI',
        dueDate: '2024-07-15',
        type: RiskType.Security,
        sla: 60,
        planResponsible: 'Ana Costa',
        technicalResponsible: 'Carlos Lima',
        actionPlan: 'Implementar campanha de conscientização e treinamento anti-phishing.',
        completionDate: '',
    },
    { 
        id: 3, 
        creationDate: '2023-11-01T09:00:00Z',
        title: 'Indisponibilidade do e-commerce', 
        description: 'Uma falha de hardware no servidor principal pode causar a interrupção das vendas online.', 
        probability: 2, 
        impact: 5, 
        status: RiskStatus.Mitigated, 
        owner: 'Equipe de Infra',
        dueDate: '2024-01-15',
        type: RiskType.Operational,
        sla: 15,
        planResponsible: 'Pedro Martins',
        technicalResponsible: 'Pedro Martins',
        actionPlan: 'Configurar cluster de alta disponibilidade para os servidores web.',
        completionDate: '2024-01-10',
    },
];

const mockDataControls: DataControl[] = [
    { id: 1, name: 'Política de Retenção de Dados', description: 'Define por quanto tempo os dados pessoais são mantidos.', category: 'Políticas de Dados', relatedRegulation: 'LGPD Art. 15', status: DataControlStatus.Active, criticality: AssetCriticality.High, owner: 'DPO' },
    { id: 2, name: 'Processo de Requisição de Titular', description: 'Procedimento para atender às solicitações de direitos dos titulares de dados.', category: 'Direitos dos Titulares', relatedRegulation: 'LGPD Art. 18', status: DataControlStatus.Active, criticality: AssetCriticality.Medium, owner: 'Equipe de Privacidade' },
    { id: 3, name: 'Criptografia de Banco de Dados', description: 'Garante que os dados de clientes em repouso estejam criptografados.', category: 'Segurança Técnica', relatedRegulation: 'LGPD Art. 46', status: DataControlStatus.InReview, criticality: AssetCriticality.Critical, owner: 'Equipe de DBA' },
    { id: 4, name: 'Controle de Acesso a Dados Pessoais', description: 'Acesso a dados pessoais baseado no princípio do menor privilégio.', category: 'Controle de Acesso', relatedRegulation: 'LGPD Art. 6', status: DataControlStatus.Active, criticality: AssetCriticality.High, owner: 'Equipe de Segurança' },
    { id: 5, name: 'Registro de Atividades de Tratamento (ROPA)', description: 'Manutenção do registro das operações de tratamento de dados pessoais.', category: 'Governança de Dados', relatedRegulation: 'LGPD Art. 37', status: DataControlStatus.Inactive, criticality: AssetCriticality.Medium, owner: 'DPO' },
];

const initialAssets: Asset[] = [
    { id: 1, name: 'Servidor de Autenticação (auth.exa.com.br)', type: AssetType.Server, criticality: AssetCriticality.Critical, owner: 'Equipe de Infra' },
    { id: 2, name: 'API de Pagamentos', type: AssetType.WebApp, criticality: AssetCriticality.Critical, owner: 'Equipe de Dev' },
    { id: 3, name: 'DB de Clientes (prd-customer-db-01)', type: AssetType.Database, criticality: AssetCriticality.High, owner: 'Equipe de DBA' },
    { id: 4, name: 'Domínio exa.com.br', type: AssetType.Domain, criticality: AssetCriticality.High, owner: 'Equipe de Redes' },
    { id: 5, name: 'App iOS "ExaShop"', type: AssetType.MobileApp, criticality: AssetCriticality.Medium, owner: 'Equipe Mobile' },
];


// --- COMPREHENSIVE CONTROLS DATABASE ---
const nistControls: Control[] = [
    // --- GOVERN (GV) ---
    { id: 'GV.OC-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'A missão organizacional é compreendida e informa o gerenciamento de riscos de cibersegurança.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'GV.OC-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'As partes interessadas internas e externas são compreendidas, e suas necessidades e expectativas em relação ao gerenciamento de riscos de cibersegurança são compreendidas e consideradas.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'GV.OC-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'Requisitos legais, regulatórios e contratuais relativos à cibersegurança — incluindo obrigações de privacidade e liberdades civis — são compreendidos e gerenciados.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    { id: 'GV.OC-04', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'Objetivos, capacidades e serviços críticos dos quais as partes interessadas externas dependem ou esperam da organização são compreendidos e comunicados.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'GV.OC-05', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'Resultados, capacidades e serviços dos quais a organização depende são compreendidos e comunicados.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'GV.RM-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Os objetivos de gerenciamento de risco são estabelecidos e acordados pelas partes interessadas da organização.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'GV.RM-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Declarações de apetite e tolerância ao risco são estabelecidas, comunicadas e mantidas.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'GV.RM-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Atividades e resultados de gerenciamento de riscos de cibersegurança são incluídos nos processos de gerenciamento de riscos empresariais.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'GV.RM-04', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'A direção estratégica que descreve as opções apropriadas de resposta ao risco é estabelecida e comunicada.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'GV.RM-05', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Linhas de comunicação em toda a organização são estabelecidas para riscos de cibersegurança, incluindo riscos de fornecedores e outros terceiros.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    { id: 'GV.RM-06', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Um método padronizado para calcular, documentar, categorizar e priorizar riscos de cibersegurança é estabelecido e comunicado.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 1 },
    { id: 'GV.RM-07', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Oportunidades estratégicas (ou seja, riscos positivos) são caracterizadas e incluídas nas discussões organizacionais sobre riscos de cibersegurança.', status: ControlStatus.NotImplemented, processScore: 1, practiceScore: 1 },
    { id: 'GV.RR-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Funções, Responsabilidades e Autoridades', description: 'A liderança organizacional é responsável e responsabilizável pelo risco de cibersegurança e promove uma cultura que é consciente do risco, ética e em contínua melhoria.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'GV.RR-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Funções, Responsabilidades e Autoridades', description: 'Funções, responsabilidades e autoridades relacionadas ao gerenciamento de riscos de cibersegurança são estabelecidas, comunicadas, compreendidas e aplicadas.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'GV.RR-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Funções, Responsabilidades e Autoridades', description: 'Recursos adequados são alocados de acordo com a estratégia de risco de cibersegurança, funções, responsabilidades e políticas.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'GV.RR-04', framework: FrameworkName.NIST, family: 'Governar', name: 'Funções, Responsabilidades e Autoridades', description: 'A cibersegurança é incluída nas práticas de recursos humanos.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'GV.PO-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Política', description: 'A política para gerenciar riscos de cibersegurança é estabelecida com base no contexto organizacional, estratégia de cibersegurança e prioridades, e é comunicada e aplicada.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'GV.PO-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Política', description: 'A política para gerenciar riscos de cibersegurança é revisada, atualizada, comunicada e aplicada para refletir mudanças nos requisitos, ameaças, tecnologia e missão organizacional.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'GV.OV-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Supervisão', description: 'Os resultados da estratégia de gerenciamento de riscos de cibersegurança são revisados para informar e ajustar a estratégia e a direção.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'GV.OV-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Supervisão', description: 'A estratégia de gerenciamento de riscos de cibersegurança é revisada e ajustada para garantir a cobertura dos requisitos e riscos organizacionais.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'GV.OV-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Supervisão', description: 'O desempenho do gerenciamento de riscos de cibersegurança organizacional é avaliado e revisado para os ajustes necessários.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'GV.SC-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Um programa, estratégia, objetivos, políticas e processos de gerenciamento de riscos da cadeia de suprimentos de cibersegurança são estabelecidos e acordados pelas partes interessadas da organização.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'GV.SC-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Funções e responsabilidades de cibersegurança para fornecedores, clientes e parceiros são estabelecidas, comunicadas e coordenadas interna e externamente.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'GV.SC-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'O gerenciamento de riscos da cadeia de suprimentos de cibersegurança é integrado à cibersegurança e ao gerenciamento de riscos empresariais, avaliação de riscos e processos de melhoria.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 1 },
    { id: 'GV.SC-04', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Os fornecedores são conhecidos e priorizados por criticidade.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'GV.SC-05', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Requisitos para abordar riscos de cibersegurança em cadeias de suprimentos são estabelecidos, priorizados e integrados em contratos e outros tipos de acordos com fornecedores e outros terceiros relevantes.', status: ControlStatus.NotImplemented, processScore: 1, practiceScore: 1 },
    { id: 'GV.SC-06', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Planejamento e due diligence são realizados para reduzir riscos antes de entrar em relações formais com fornecedores ou outros terceiros.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'GV.SC-07', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Os riscos representados por um fornecedor, seus produtos e serviços e outros terceiros são compreendidos, registrados, priorizados, avaliados, respondidos e monitorados ao longo do relacionamento.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'GV.SC-08', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Fornecedores relevantes e outros terceiros são incluídos no planejamento de incidentes, resposta e atividades de recuperação.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 1 },
    { id: 'GV.SC-09', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'As práticas de segurança da cadeia de suprimentos são integradas aos programas de gerenciamento de riscos de cibersegurança e empresariais, e seu desempenho é monitorado ao longo do ciclo de vida do produto e serviço de tecnologia.', status: ControlStatus.NotImplemented, processScore: 1, practiceScore: 1 },
    { id: 'GV.SC-10', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Os planos de gerenciamento de riscos da cadeia de suprimentos de cibersegurança incluem provisões para atividades que ocorrem após a conclusão de uma parceria ou acordo de serviço.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    // --- IDENTIFY (ID) ---
    { id: 'ID.AM-01', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Inventários de hardware gerenciados pela organização são mantidos.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'ID.AM-02', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Inventários de software, serviços e sistemas gerenciados pela organização são mantidos.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'ID.AM-03', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Representações da comunicação de rede autorizada da organização e dos fluxos de dados de rede internos e externos são mantidas.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'ID.AM-04', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Inventários de serviços fornecidos por fornecedores são mantidos.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'ID.AM-05', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Os ativos são priorizados com base na classificação, criticidade, recursos e impacto na missão.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    { id: 'ID.AM-07', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Inventários de dados e metadados correspondentes para tipos de dados designados são mantidos.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 1 },
    { id: 'ID.AM-08', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Sistemas, hardware, software, serviços e dados são gerenciados ao longo de seus ciclos de vida.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'ID.RA-01', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Vulnerabilidades em ativos são identificadas, validadas e registradas.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'ID.RA-02', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Inteligência de ameaças cibernéticas é recebida de fóruns e fontes de compartilhamento de informações.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'ID.RA-03', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Ameaças internas e externas à organização são identificadas e registradas.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'ID.RA-04', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Impactos e probabilidades potenciais de ameaças que exploram vulnerabilidades são identificados e registrados.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'ID.RA-05', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Ameaças, vulnerabilidades, probabilidades e impactos são usados para entender o risco inerente e informar a priorização da resposta ao risco.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'ID.RA-06', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'As respostas ao risco são escolhidas, priorizadas, planejadas, rastreadas e comunicadas.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'ID.RA-07', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Mudanças e exceções são gerenciadas, avaliadas quanto ao impacto no risco, registradas e rastreadas.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'ID.RA-08', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Processos para receber, analisar e responder a divulgações de vulnerabilidades são estabelecidos.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'ID.RA-09', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'A autenticidade e integridade de hardware e software são avaliadas antes da aquisição e uso.', status: ControlStatus.NotImplemented, processScore: 1, practiceScore: 1 },
    { id: 'ID.RA-10', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Fornecedores críticos são avaliados antes da aquisição.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 1 },
    { id: 'ID.IM-01', framework: FrameworkName.NIST, family: 'Identificar', name: 'Melhoria', description: 'Melhorias são identificadas a partir de avaliações.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'ID.IM-02', framework: FrameworkName.NIST, family: 'Identificar', name: 'Melhoria', description: 'Melhorias são identificadas a partir de testes e exercícios de segurança, incluindo aqueles feitos em coordenação com fornecedores e terceiros relevantes.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'ID.IM-03', framework: FrameworkName.NIST, family: 'Identificar', name: 'Melhoria', description: 'Melhorias são identificadas a partir da execução de processos operacionais, procedimentos e atividades.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'ID.IM-04', framework: FrameworkName.NIST, family: 'Identificar', name: 'Melhoria', description: 'Planos de resposta a incidentes e outros planos de cibersegurança que afetam as operações são estabelecidos, comunicados, mantidos e aprimorados.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    // --- PROTECT (PR) ---
    { id: 'PR.AA-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'Identidades e credenciais para usuários, serviços e hardware autorizados são gerenciadas pela organização.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'PR.AA-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'Identidades são comprovadas e vinculadas a credenciais com base no contexto das interações.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'PR.AA-03', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'Usuários, serviços e hardware são autenticados.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'PR.AA-04', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'As declarações de identidade são protegidas, transmitidas e verificadas.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'PR.AA-05', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'Permissões de acesso, direitos e autorizações são definidos em uma política, gerenciados, aplicados e revisados, e incorporam os princípios de menor privilégio e separação de funções.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'PR.AA-06', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'O acesso físico aos ativos é gerenciado, monitorado e aplicado de acordo com o risco avaliado.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'PR.AT-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Conscientização e Treinamento', description: 'O pessoal recebe conscientização e treinamento para que possua o conhecimento e as habilidades para realizar tarefas gerais com os riscos de cibersegurança em mente.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'PR.AT-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Conscientização e Treinamento', description: 'Indivíduos em funções especializadas recebem conscientização e treinamento para que possuam o conhecimento e as habilidades para realizar tarefas relevantes com os riscos de cibersegurança em mente.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'PR.DS-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança de Dados', description: 'A confidencialidade, integridade e disponibilidade dos dados em repouso são protegidas.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    { id: 'PR.DS-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança de Dados', description: 'A confidencialidade, integridade e disponibilidade dos dados em trânsito são protegidas.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'PR.DS-10', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança de Dados', description: 'A confidencialidade, integridade e disponibilidade dos dados em uso são protegidas.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'PR.DS-11', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança de Dados', description: 'Backups de dados são criados, protegidos, mantidos e testados.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'PR.PS-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Práticas de gerenciamento de configuração são estabelecidas e aplicadas.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'PR.PS-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Software é mantido, substituído e removido de acordo com o risco.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'PR.PS-03', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Hardware é mantido, substituído e removido de acordo com o risco.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'PR.PS-04', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Registros de log são gerados e disponibilizados para monitoramento contínuo.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    { id: 'PR.PS-05', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'A instalação e execução de software não autorizado são impedidas.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'PR.PS-06', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Práticas de desenvolvimento de software seguro são integradas, e seu desempenho é monitorado ao longo do ciclo de vida de desenvolvimento de software.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'PR.IR-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Resiliência da Infraestrutura de Tecnologia', description: 'Redes e ambientes são protegidos contra acesso e uso lógico não autorizado.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'PR.IR-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Resiliência da Infraestrutura de Tecnologia', description: 'Os ativos de tecnologia da organização são protegidos contra ameaças ambientais.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'PR.IR-03', framework: FrameworkName.NIST, family: 'Proteger', name: 'Resiliência da Infraestrutura de Tecnologia', description: 'Mecanismos são implementados para alcançar os requisitos de resiliência em situações normais e adversas.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'PR.IR-04', framework: FrameworkName.NIST, family: 'Proteger', name: 'Resiliência da Infraestrutura de Tecnologia', description: 'Capacidade de recurso adequada para garantir a disponibilidade é mantida.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    // --- DETECT (DE) ---
    { id: 'DE.CM-01', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'Redes e serviços de rede são monitorados para encontrar eventos potencialmente adversos.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'DE.CM-02', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'O ambiente físico é monitorado para encontrar eventos potencialmente adversos.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'DE.CM-03', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'A atividade do pessoal e o uso da tecnologia são monitorados para encontrar eventos potencialmente adversos.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'DE.CM-06', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'As atividades e serviços de provedores de serviços externos são monitorados para encontrar eventos potencialmente adversos.', status: ControlStatus.NotImplemented, processScore: 1, practiceScore: 1 },
    { id: 'DE.CM-09', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'Hardware e software de computação, ambientes de tempo de execução e seus dados são monitorados para encontrar eventos potencialmente adversos.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'DE.AE-02', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'Eventos potencialmente adversos são analisados para entender melhor as atividades associadas.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'DE.AE-03', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'A informação é correlacionada de múltiplas fontes.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'DE.AE-04', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'O impacto e o escopo estimados de eventos adversos são compreendidos.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'DE.AE-06', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'Informações sobre eventos adversos são fornecidas à equipe e ferramentas autorizadas.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    { id: 'DE.AE-07', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'Inteligência de ameaças cibernéticas e outras informações contextuais são integradas na análise.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 1 },
    { id: 'DE.AE-08', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'Incidentes são declarados quando eventos adversos atendem aos critérios de incidente definidos.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    // --- RESPOND (RS) ---
    { id: 'RS.MA-01', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'O plano de resposta a incidentes é executado em coordenação com terceiros relevantes assim que um incidente é declarado.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'RS.MA-02', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'Relatórios de incidentes são triados e validados.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'RS.MA-03', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'Incidentes são categorizados e priorizados.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'RS.MA-04', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'Incidentes são escalados ou elevados conforme necessário.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'RS.MA-05', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'Os critérios para iniciar a recuperação de incidentes são aplicados.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'RS.AN-03', framework: FrameworkName.NIST, family: 'Responder', name: 'Análise de Incidentes', description: 'A análise é realizada para estabelecer o que ocorreu durante um incidente e a causa raiz do incidente.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'RS.AN-06', framework: FrameworkName.NIST, family: 'Responder', name: 'Análise de Incidentes', description: 'Ações realizadas durante uma investigação são registradas, e a integridade e proveniência dos registros são preservadas.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'RS.AN-07', framework: FrameworkName.NIST, family: 'Responder', name: 'Análise de Incidentes', description: 'Dados e metadados de incidentes são coletados, e sua integridade e proveniência são preservadas.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'RS.AN-08', framework: FrameworkName.NIST, family: 'Responder', name: 'Análise de Incidentes', description: 'A magnitude de um incidente é estimada e validada.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'RS.CO-02', framework: FrameworkName.NIST, family: 'Responder', name: 'Relato e Comunicação de Resposta a Incidentes', description: 'Partes interessadas internas e externas são notificadas sobre incidentes.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'RS.CO-03', framework: FrameworkName.NIST, family: 'Responder', name: 'Relato e Comunicação de Resposta a Incidentes', description: 'A informação é compartilhada com as partes interessadas internas e externas designadas.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'RS.MI-01', framework: FrameworkName.NIST, family: 'Responder', name: 'Mitigação de Incidentes', description: 'Incidentes são contidos.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    { id: 'RS.MI-02', framework: FrameworkName.NIST, family: 'Responder', name: 'Mitigação de Incidentes', description: 'Incidentes são erradicados.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    // --- RECOVER (RC) ---
    { id: 'RC.RP-01', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'A parte de recuperação do plano de resposta a incidentes é executada assim que iniciada a partir do processo de resposta a incidentes.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'RC.RP-02', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'Ações de recuperação são selecionadas, dimensionadas, priorizadas e executadas.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'RC.RP-03', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'A integridade dos backups e outros ativos de restauração é verificada antes de usá-los para restauração.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    { id: 'RC.RP-04', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'Funções de missão críticas e gerenciamento de riscos de cibersegurança são considerados para estabelecer normas operacionais pós-incidente.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 2 },
    { id: 'RC.RP-05', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'A integridade dos ativos restaurados é verificada, sistemas e serviços são restaurados e o status operacional normal é confirmado.', status: ControlStatus.PartiallyImplemented, processScore: 3, practiceScore: 2 },
    { id: 'RC.RP-06', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'O fim da recuperação do incidente é declarado com base em critérios, e a documentação relacionada ao incidente é concluída.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'RC.CO-03', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Comunicação de Recuperação de Incidentes', description: 'Atividades de recuperação e progresso na restauração de capacidades operacionais são comunicadas às partes interessadas internas e externas designadas.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 3 },
    { id: 'RC.CO-04', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Comunicação de Recuperação de Incidentes', description: 'Atualizações públicas sobre a recuperação de incidentes são compartilhadas usando métodos e mensagens aprovados.', status: ControlStatus.PartiallyImplemented, processScore: 2, practiceScore: 1 },
];
const cisControls: Control[] = [
    { id: 'CIS-1.1', framework: FrameworkName.CIS, family: 'Controle 1', name: 'Estabelecer e Manter um Inventário Detalhado de Ativos Corporativos', description: 'Estabelecer e manter um inventário preciso, detalhado e atualizado de todos os ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-1.2', framework: FrameworkName.CIS, family: 'Controle 1', name: 'Lidar com Ativos Não Autorizados', description: 'Garantir que exista um processo para lidar com ativos não autorizados semanalmente.', status: ControlStatus.NotImplemented },
    { id: 'CIS-1.3', framework: FrameworkName.CIS, family: 'Controle 1', name: 'Utilizar uma Ferramenta de Descoberta Ativa', description: 'Utilizar uma ferramenta de descoberta ativa para identificar ativos conectados à rede da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-1.4', framework: FrameworkName.CIS, family: 'Controle 1', name: 'Usar Logs de DHCP para Atualizar o Inventário de Ativos', description: 'Usar o registro de DHCP em todos os servidores DHCP ou ferramentas de gerenciamento de endereço IP para atualizar o inventário de ativos da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-1.5', framework: FrameworkName.CIS, family: 'Controle 1', name: 'Usar uma Ferramenta Passiva de Descoberta de Ativos', description: 'Usar uma ferramenta de descoberta passiva para identificar ativos conectados à rede da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-2.1', framework: FrameworkName.CIS, family: 'Controle 2', name: 'Estabelecer e Manter um Inventário de Software', description: 'Estabelecer e manter um inventário detalhado de todo o software licenciado instalado nos ativos da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-2.2', framework: FrameworkName.CIS, family: 'Controle 2', name: 'Garantir que o Software Autorizado Seja Suportado Atualmente', description: 'Garantir que apenas software atualmente suportado seja designado como autorizado no inventário de software para ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-2.3', framework: FrameworkName.CIS, family: 'Controle 2', name: 'Lidar com Software Não Autorizado', description: 'Garantir que o software não autorizado seja removido do uso em ativos corporativos ou receba uma exceção documentada.', status: ControlStatus.NotImplemented },
    { id: 'CIS-2.4', framework: FrameworkName.CIS, family: 'Controle 2', name: 'Utilizar Ferramentas Automatizadas de Inventário de Software', description: 'Utilizar ferramentas de inventário de software, quando possível, em toda a empresa para automatizar a descoberta e documentação de software instalado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-2.5', framework: FrameworkName.CIS, family: 'Controle 2', name: 'Permitir Software Autorizado (Allowlist)', description: 'Usar controles técnicos, como a lista de permissões de aplicativos, para garantir que apenas softwares autorizados possam ser executados ou acessados.', status: ControlStatus.NotImplemented },
    { id: 'CIS-2.6', framework: FrameworkName.CIS, family: 'Controle 2', name: 'Permitir Bibliotecas Autorizadas (Allowlist)', description: 'Usar controles técnicos para garantir que apenas bibliotecas de software autorizadas sejam permitidas para carregar em um processo do sistema.', status: ControlStatus.NotImplemented },
    { id: 'CIS-2.7', framework: FrameworkName.CIS, family: 'Controle 2', name: 'Permitir Scripts Autorizados (Allowlist)', description: 'Usar controles técnicos para garantir que apenas scripts autorizados, como .ps1 e .py, tenham permissão para executar.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.1', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Estabelecer e Manter um Processo de Gerenciamento de Dados', description: 'Estabelecer e manter um processo documentado de gerenciamento de dados.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.2', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Estabelecer e Manter um Inventário de Dados', description: 'Estabelecer e manter um inventário de dados com base no processo de gerenciamento de dados da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.3', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Configurar Listas de Controle de Acesso a Dados', description: 'Configurar listas de controle de acesso a dados com base na necessidade de conhecimento do usuário.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.4', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Impor a Retenção de Dados', description: 'Reter dados de acordo com o processo documentado de gerenciamento de dados da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.5', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Descartar Dados de Forma Segura', description: 'Descartar dados de forma segura, conforme descrito no processo documentado de gerenciamento de dados da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.6', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Criptografar Dados em Dispositivos de Usuário Final', description: 'Criptografar dados em dispositivos de usuário final que contenham dados sensíveis.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.7', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Estabelecer e Manter um Esquema de Classificação de Dados', description: 'Estabelecer e manter um esquema geral de classificação de dados para la empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.8', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Documentar Fluxos de Dados', description: 'Documentar os fluxos de dados. A documentação deve incluir fluxos de dados de provedores de serviço.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.9', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Criptografar Dados em Mídia Removível', description: 'Criptografar dados em mídias removíveis.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.10', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Criptografar Dados Sensíveis em Trânsito', description: 'Criptografar dados sensíveis em trânsito.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.11', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Criptografar Dados Sensíveis em Repouso', description: 'Criptografar dados sensíveis em repouso em servidores, aplicações e bancos de dados.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.12', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Segmentar Processamento e Armazenamento de Dados com Base na Sensibilidade', description: 'Segmentar o processamento e armazenamento de dados com base na sensibilidade dos dados.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.13', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Implantar uma Solução de Prevenção de Perda de Dados', description: 'Implementar uma ferramenta automatizada, como uma ferramenta de Prevenção de Perda de Dados (DLP) baseada em host.', status: ControlStatus.NotImplemented },
    { id: 'CIS-3.14', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Registrar Acesso a Dados Sensíveis', description: 'Registrar o acesso a dados sensíveis, incluindo modificação e descarte.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.1', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Estabelecer e Manter um Processo de Configuração Segura', description: 'Estabelecer e manter um processo documentado de configuração segura para ativos corporativos e software.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.2', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Estabelecer e Manter um Processo de Configuração Segura para Infraestrutura de Rede', description: 'Estabelecer e manter um processo documentado de configuração segura para dispositivos de rede.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.3', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Configurar Bloqueio Automático de Sessão em Ativos Corporativos', description: 'Configurar o bloqueio automático de sessão em ativos corporativos após um período definido de inatividade.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.4', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Implementar e Gerenciar um Firewall em Servidores', description: 'Implementar e gerenciar um firewall em servidores, quando suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.5', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Implementar e Gerenciar um Firewall em Dispositivos de Usuário Final', description: 'Implementar e gerenciar um firewall baseado em host ou ferramenta de filtragem de portas em dispositivos de usuário final.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.6', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Gerenciar Ativos Corporativos e Software de Forma Segura', description: 'Gerenciar ativos corporativos e software de forma segura.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.7', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Gerenciar Contas Padrão em Ativos Corporativos e Software', description: 'Gerenciar contas padrão em ativos corporativos e software, como root, administrador e outras contas de fornecedores pré-configuradas.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.8', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Desinstalar ou Desabilitar Serviços Desnecessários em Ativos e Software', description: 'Desinstalar ou desabilitar serviços desnecessários em ativos corporativos e software.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.9', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Configurar Servidores DNS Confiáveis em Ativos Corporativos', description: 'Configurar servidores DNS confiáveis na infraestrutura de rede.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.10', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Impor Bloqueio Automático de Dispositivo em Dispositivos Portáteis de Usuário Final', description: 'Impor o bloqueio automático do dispositivo após um limite predeterminado de tentativas de autenticação local com falha.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.11', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Impor a Capacidade de Limpeza Remota em Dispositivos Portáteis', description: 'Limpar remotamente dados corporativos de dispositivos portáteis de propriedade da empresa quando considerado apropriado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-4.12', framework: FrameworkName.CIS, family: 'Controle 4', name: 'Separar Espaços de Trabalho Corporativos em Dispositivos Móveis', description: 'Garantir que espaços de trabalho corporativos separados sejam usados em dispositivos móveis de usuário final, quando suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-5.1', framework: FrameworkName.CIS, family: 'Controle 5', name: 'Estabelecer e Manter um Inventário de Contas', description: 'Estabelecer e manter um inventário de todas as contas gerenciadas na empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-5.2', framework: FrameworkName.CIS, family: 'Controle 5', name: 'Usar Senhas Únicas', description: 'Usar senhas únicas para todos os ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-5.3', framework: FrameworkName.CIS, family: 'Controle 5', name: 'Desabilitar Contas Inativas', description: 'Excluir ou desabilitar quaisquer contas inativas após um período de 45 dias de inatividade, quando suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-5.4', framework: FrameworkName.CIS, family: 'Controle 5', name: 'Restringir Privilégios de Administrador a Contas Dedicadas', description: 'Restringir privilégios de administrador a contas de administrador dedicadas em ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-5.5', framework: FrameworkName.CIS, family: 'Controle 5', name: 'Estabelecer e Manter um Inventário de Contas de Serviço', description: 'Estabelecer e manter um inventário de contas de serviço.', status: ControlStatus.NotImplemented },
    { id: 'CIS-5.6', framework: FrameworkName.CIS, family: 'Controle 5', name: 'Centralizar o Gerenciamento de Contas', description: 'Centralizar o gerenciamento de contas através de um diretório ou serviço de identidade.', status: ControlStatus.NotImplemented },
    { id: 'CIS-6.1', framework: FrameworkName.CIS, family: 'Controle 6', name: 'Estabelecer um Processo de Concessão de Acesso', description: 'Estabelecer e seguir um processo documentado, preferencialmente automatizado, para conceder acesso a ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-6.2', framework: FrameworkName.CIS, family: 'Controle 6', name: 'Estabelecer um Processo de Revogação de Acesso', description: 'Estabelecer e seguir um processo, preferencialmente automatizado, para revogar o acesso a ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-6.3', framework: FrameworkName.CIS, family: 'Controle 6', name: 'Exigir MFA para Aplicações Expostas Externamente', description: 'Exigir que todas as aplicações corporativas ou de terceiros expostas externamente apliquem MFA, quando suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-6.4', framework: FrameworkName.CIS, family: 'Controle 6', name: 'Exigir MFA para Acesso Remoto à Rede', description: 'Exigir MFA para acesso remoto à rede.', status: ControlStatus.NotImplemented },
    { id: 'CIS-6.5', framework: FrameworkName.CIS, family: 'Controle 6', name: 'Exigir MFA para Acesso Administrativo', description: 'Exigir MFA para todas as contas de acesso administrativo, quando suportado, em todos os ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-6.6', framework: FrameworkName.CIS, family: 'Controle 6', name: 'Estabelecer e Manter um Inventário de Sistemas de Autenticação e Autorização', description: 'Estabelecer e manter um inventário dos sistemas de autenticação e autorização da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-6.7', framework: FrameworkName.CIS, family: 'Controle 6', name: 'Centralizar o Controle de Acesso', description: 'Centralizar o controle de acesso para todos os ativos corporativos através de um serviço de diretório ou SSO, quando suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-6.8', framework: FrameworkName.CIS, family: 'Controle 6', name: 'Definir e Manter o Controle de Acesso Baseado em Função', description: 'Definir e manter o controle de acesso baseado em função (Role-Based Access Control).', status: ControlStatus.NotImplemented },
    { id: 'CIS-7.1', framework: FrameworkName.CIS, family: 'Controle 7', name: 'Estabelecer e Manter um Processo de Gerenciamento de Vulnerabilidades', description: 'Estabelecer e manter um processo documentado de gerenciamento de vulnerabilidades para ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-7.2', framework: FrameworkName.CIS, family: 'Controle 7', name: 'Estabelecer e Manter um Processo de Remediação', description: 'Estabelecer e manter uma estratégia de remediação baseada em risco documentada em um processo de remediação.', status: ControlStatus.NotImplemented },
    { id: 'CIS-7.3', framework: FrameworkName.CIS, family: 'Controle 7', name: 'Realizar Gerenciamento Automatizado de Patches de Sistema Operacional', description: 'Realizar atualizações do sistema operacional em ativos corporativos através do gerenciamento automatizado de patches mensalmente, ou com mais frequência.', status: ControlStatus.NotImplemented },
    { id: 'CIS-7.4', framework: FrameworkName.CIS, family: 'Controle 7', name: 'Realizar Gerenciamento Automatizado de Patches de Aplicações', description: 'Realizar atualizações de aplicações em ativos corporativos através do gerenciamento automatizado de patches mensalmente, ou com mais frequência.', status: ControlStatus.NotImplemented },
    { id: 'CIS-7.5', framework: FrameworkName.CIS, family: 'Controle 7', name: 'Realizar Varreduras de Vulnerabilidades Automatizadas de Ativos Internos', description: 'Realizar varreduras de vulnerabilidades automatizadas de ativos corporativos internos trimestralmente, ou com mais frequência.', status: ControlStatus.NotImplemented },
    { id: 'CIS-7.6', framework: FrameworkName.CIS, family: 'Controle 7', name: 'Realizar Varreduras de Vulnerabilidades Automatizadas de Ativos Expostos Externamente', description: 'Realizar varreduras de vulnerabilidades automatizadas de ativos corporativos expostos externamente.', status: ControlStatus.NotImplemented },
    { id: 'CIS-7.7', framework: FrameworkName.CIS, family: 'Controle 7', name: 'Remediar Vulnerabilidades Detectadas', description: 'Remediar vulnerabilidades detectadas em software através de processos e ferramentas mensalmente, ou com mais frequência.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.1', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Estabelecer e Manter um Processo de Gerenciamento de Logs de Auditoria', description: 'Estabelecer e manter um processo documentado de gerenciamento de logs de auditoria que defina os requisitos de registro da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.2', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Coletar Logs de Auditoria', description: 'Coletar logs de auditoria. Garantir que o registro, conforme o processo de gerenciamento de logs de auditoria da empresa, foi habilitado em todos os ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.3', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Garantir Armazenamento Adequado de Logs de Auditoria', description: 'Garantir que os destinos de registro mantenham armazenamento adequado para cumprir com o processo de gerenciamento de logs de auditoria da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.4', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Padronizar a Sincronização de Tempo', description: 'Padronizar a sincronização de tempo. Configurar pelo menos duas fontes de tempo sincronizadas em todos os ativos corporativos, quando suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.5', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Coletar Logs de Auditoria Detalhados', description: 'Configurar o registro de auditoria detalhado para ativos corporativos que contenham dados sensíveis.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.6', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Coletar Logs de Auditoria de Consultas DNS', description: 'Coletar logs de auditoria de consultas DNS em ativos corporativos, quando apropriado e suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.7', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Coletar Logs de Auditoria de Solicitações de URL', description: 'Coletar logs de auditoria de solicitações de URL em ativos corporativos, quando apropriado e suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.8', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Coletar Logs de Auditoria de Linha de Comando', description: 'Coletar logs de auditoria de linha de comando.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.9', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Centralizar Logs de Auditoria', description: 'Centralizar, na medida do possível, a coleta e retenção de logs de auditoria em todos os ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.10', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Reter Logs de Auditoria', description: 'Reter logs de auditoria em todos os ativos corporativos por um mínimo de 90 dias.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.11', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Conduzir Revisões de Logs de Auditoria', description: 'Conduzir revisões de logs de auditoria para detectar anomalias ou eventos anormais que possam indicar uma ameaça potencial.', status: ControlStatus.NotImplemented },
    { id: 'CIS-8.12', framework: FrameworkName.CIS, family: 'Controle 8', name: 'Coletar Logs de Provedores de Serviço', description: 'Coletar logs de provedores de serviço, quando suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-9.1', framework: FrameworkName.CIS, family: 'Controle 9', name: 'Garantir o Uso Apenas de Navegadores e Clientes de Email Totalmente Suportados', description: 'Garantir que apenas navegadores e clientes de e-mail totalmente suportados possam ser executados na empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-9.2', framework: FrameworkName.CIS, family: 'Controle 9', name: 'Usar Serviços de Filtragem DNS', description: 'Usar serviços de filtragem DNS em todos os dispositivos de usuário final para bloquear o acesso a domínios maliciosos conhecidos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-9.3', framework: FrameworkName.CIS, family: 'Controle 9', name: 'Manter e Aplicar Filtros de URL Baseados em Rede', description: 'Aplicar e atualizar filtros de URL baseados em rede para limitar a conexão de um ativo corporativo a sites potencialmente maliciosos ou não aprovados.', status: ControlStatus.NotImplemented },
    { id: 'CIS-9.4', framework: FrameworkName.CIS, family: 'Controle 9', name: 'Restringir Extensões de Navegador e Cliente de Email Desnecessárias ou Não Autorizadas', description: 'Restringir, através de desinstalação ou desativação, quaisquer plugins, extensões e aplicativos de complemento de navegador ou cliente de e-mail não autorizados ou desnecessários.', status: ControlStatus.NotImplemented },
    { id: 'CIS-9.5', framework: FrameworkName.CIS, family: 'Controle 9', name: 'Implementar DMARC', description: 'Para diminuir a chance de e-mails falsificados ou modificados de domínios válidos, implementar a política e verificação DMARC.', status: ControlStatus.NotImplemented },
    { id: 'CIS-9.6', framework: FrameworkName.CIS, family: 'Controle 9', name: 'Bloquear Tipos de Arquivos Desnecessários', description: 'Bloquear tipos de arquivos desnecessários que tentam entrar no gateway de e-mail da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-9.7', framework: FrameworkName.CIS, family: 'Controle 9', name: 'Implantar e Manter Proteções Anti-Malware no Servidor de Email', description: 'Implantar e manter proteções anti-malware no servidor de e-mail, como varredura de anexos e/ou sandboxing.', status: ControlStatus.NotImplemented },
    { id: 'CIS-10.1', framework: FrameworkName.CIS, family: 'Controle 10', name: 'Implantar e Manter Software Anti-Malware', description: 'Implantar e manter software anti-malware em todos os ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-10.2', framework: FrameworkName.CIS, family: 'Controle 10', name: 'Configurar Atualizações Automáticas de Assinaturas Anti-Malware', description: 'Configurar atualizações automáticas para arquivos de assinatura anti-malware em todos os ativos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-10.3', framework: FrameworkName.CIS, family: 'Controle 10', name: 'Desabilitar Autorun e Autoplay para Mídia Removível', description: 'Desabilitar a funcionalidade de execução automática de autorun e autoplay para mídias removíveis.', status: ControlStatus.NotImplemented },
    { id: 'CIS-10.4', framework: FrameworkName.CIS, family: 'Controle 10', name: 'Configurar Varredura Automática Anti-Malware de Mídia Removível', description: 'Configurar o software anti-malware para varrer automaticamente mídias removíveis.', status: ControlStatus.NotImplemented },
    { id: 'CIS-10.5', framework: FrameworkName.CIS, family: 'Controle 10', name: 'Habilitar Recursos Anti-Exploração', description: 'Habilitar recursos anti-exploração em ativos e software corporativos, sempre que possível.', status: ControlStatus.NotImplemented },
    { id: 'CIS-10.6', framework: FrameworkName.CIS, family: 'Controle 10', name: 'Gerenciar Centralmente o Software Anti-Malware', description: 'Gerenciar centralmente o software anti-malware.', status: ControlStatus.NotImplemented },
    { id: 'CIS-10.7', framework: FrameworkName.CIS, family: 'Controle 10', name: 'Usar Software Anti-Malware Baseado em Comportamento', description: 'Usar software anti-malware baseado em comportamento.', status: ControlStatus.NotImplemented },
    { id: 'CIS-11.1', framework: FrameworkName.CIS, family: 'Controle 11', name: 'Estabelecer e Manter um Processo de Recuperação de Dados', description: 'Estabelecer e manter um processo documentado de recuperação de dados.', status: ControlStatus.NotImplemented },
    { id: 'CIS-11.2', framework: FrameworkName.CIS, family: 'Controle 11', name: 'Realizar Backups Automatizados', description: 'Realizar backups automatizados de ativos corporativos no escopo. Executar backups semanalmente, ou com mais frequência.', status: ControlStatus.NotImplemented },
    { id: 'CIS-11.3', framework: FrameworkName.CIS, family: 'Controle 11', name: 'Proteger Dados de Recuperação', description: 'Proteger os dados de recuperação com controles equivalentes aos dados originais.', status: ControlStatus.NotImplemented },
    { id: 'CIS-11.4', framework: FrameworkName.CIS, family: 'Controle 11', name: 'Estabelecer e Manter uma Instância Isolada de Dados de Recuperação', description: 'Estabelecer e manter uma instância isolada de dados de recuperação.', status: ControlStatus.NotImplemented },
    { id: 'CIS-11.5', framework: FrameworkName.CIS, family: 'Controle 11', name: 'Testar a Recuperação de Dados', description: 'Testar a recuperação de backup trimestralmente, ou com mais frequência, para uma amostragem de ativos corporativos no escopo.', status: ControlStatus.NotImplemented },
    { id: 'CIS-12.1', framework: FrameworkName.CIS, family: 'Controle 12', name: 'Garantir que a Infraestrutura de Rede Esteja Atualizada', description: 'Garantir que a infraestrutura de rede seja mantida atualizada.', status: ControlStatus.NotImplemented },
    { id: 'CIS-12.2', framework: FrameworkName.CIS, family: 'Controle 12', name: 'Estabelecer e Manter uma Arquitetura de Rede Segura', description: 'Projetar e manter uma arquitetura de rede segura.', status: ControlStatus.NotImplemented },
    { id: 'CIS-12.3', framework: FrameworkName.CIS, family: 'Controle 12', name: 'Gerenciar a Infraestrutura de Rede de Forma Segura', description: 'Gerenciar a infraestrutura de rede de forma segura.', status: ControlStatus.NotImplemented },
    { id: 'CIS-12.4', framework: FrameworkName.CIS, family: 'Controle 12', name: 'Estabelecer e Manter Diagrama(s) de Arquitetura', description: 'Estabelecer e manter diagrama(s) de arquitetura e/ou outra documentação do sistema de rede.', status: ControlStatus.NotImplemented },
    { id: 'CIS-12.5', framework: FrameworkName.CIS, family: 'Controle 12', name: 'Centralizar Autenticação, Autorização e Auditoria (AAA) da Rede', description: 'Centralizar o AAA da rede.', status: ControlStatus.NotImplemented },
    { id: 'CIS-12.6', framework: FrameworkName.CIS, family: 'Controle 12', name: 'Uso de Protocolos Seguros de Gerenciamento e Comunicação de Rede', description: 'Usar protocolos seguros de gerenciamento e comunicação de rede.', status: ControlStatus.NotImplemented },
    { id: 'CIS-12.7', framework: FrameworkName.CIS, family: 'Controle 12', name: 'Garantir que Dispositivos Remotos Utilizem uma VPN', description: 'Exigir que os usuários se autentiquem em serviços de VPN e autenticação gerenciados pela empresa antes de acessar recursos corporativos.', status: ControlStatus.NotImplemented },
    { id: 'CIS-12.8', framework: FrameworkName.CIS, family: 'Controle 12', name: 'Estabelecer e Manter Recursos de Computação Dedicados para Todo o Trabalho Administrativo', description: 'Estabelecer e manter recursos de computação dedicados, física ou logicamente separados, para todas as tarefas administrativas.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.1', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Centralizar Alertas de Eventos de Segurança', description: 'Centralizar alertas de eventos de segurança em todos os ativos corporativos para correlação e análise de logs.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.2', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Implantar uma Solução de Detecção de Intrusão Baseada em Host', description: 'Implantar uma solução de detecção de intrusão baseada em host em ativos corporativos, quando apropriado e/ou suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.3', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Implantar uma Solução de Detecção de Intrusão de Rede', description: 'Implantar uma solução de detecção de intrusão de rede em ativos corporativos, quando apropriado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.4', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Realizar Filtragem de Tráfego Entre Segmentos de Rede', description: 'Realizar filtragem de tráfego entre segmentos de rede, quando apropriado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.5', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Gerenciar o Controle de Acesso para Ativos Remotos', description: 'Gerenciar o controle de acesso para ativos que se conectam remotamente aos recursos da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.6', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Coletar Logs de Fluxo de Tráfego de Rede', description: 'Coletar logs de fluxo de tráfego de rede e/ou tráfego de rede para revisar e alertar a partir de dispositivos de rede.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.7', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Implantar uma Solução de Prevenção de Intrusão Baseada em Host', description: 'Implantar uma solução de prevenção de intrusão baseada em host em ativos corporativos, quando apropriado e/ou suportado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.8', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Implantar uma Solução de Prevenção de Intrusão de Rede', description: 'Implantar uma solução de prevenção de intrusão de rede, quando apropriado.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.9', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Implantar Controle de Acesso em Nível de Porta', description: 'Implantar controle de acesso em nível de porta.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.10', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Realizar Filtragem na Camada de Aplicação', description: 'Realizar filtragem na camada de aplicação.', status: ControlStatus.NotImplemented },
    { id: 'CIS-13.11', framework: FrameworkName.CIS, family: 'Controle 13', name: 'Ajustar Limites de Alerta de Eventos de Segurança', description: 'Ajustar os limites de alerta de eventos de segurança mensalmente, ou com mais frequência.', status: ControlStatus.NotImplemented },
    { id: 'CIS-14.1', framework: FrameworkName.CIS, family: 'Controle 14', name: 'Estabelecer e Manter um Programa de Conscientização em Segurança', description: 'Estabelecer e manter um programa de conscientização em segurança.', status: ControlStatus.NotImplemented },
    { id: 'CIS-14.2', framework: FrameworkName.CIS, family: 'Controle 14', name: 'Treinar Membros da Força de Trabalho para Reconhecer Ataques de Engenharia Social', description: 'Treinar membros da força de trabalho para reconhecer ataques de engenharia social.', status: ControlStatus.NotImplemented },
    { id: 'CIS-14.3', framework: FrameworkName.CIS, family: 'Controle 14', name: 'Treinar Membros da Força de Trabalho sobre as Melhores Práticas de Autenticação', description: 'Treinar membros da força de trabalho sobre as melhores práticas de autenticação.', status: ControlStatus.NotImplemented },
    { id: 'CIS-14.4', framework: FrameworkName.CIS, family: 'Controle 14', name: 'Treinar a Força de Trabalho sobre as Melhores Práticas de Manuseio de Dados', description: 'Treinar membros da força de trabalho sobre como identificar e manusear adequadamente dados sensíveis.', status: ControlStatus.NotImplemented },
    { id: 'CIS-14.5', framework: FrameworkName.CIS, family: 'Controle 14', name: 'Treinar Membros da Força de Trabalho sobre as Causas da Exposição Não Intencional de Dados', description: 'Treinar membros da força de trabalho para estarem cientes das causas da exposição não intencional de dados.', status: ControlStatus.NotImplemented },
    { id: 'CIS-14.6', framework: FrameworkName.CIS, family: 'Controle 14', name: 'Treinar Membros da Força de Trabalho sobre Reconhecimento e Relato de Incidentes de Segurança', description: 'Treinar membros da força de trabalho para serem capazes de reconhecer um incidente potencial e relatar tal incidente.', status: ControlStatus.NotImplemented },
    { id: 'CIS-14.7', framework: FrameworkName.CIS, family: 'Controle 14', name: 'Treinar a Força de Trabalho sobre Como Identificar e Relatar se Seus Ativos Estão Faltando Atualizações de Segurança', description: 'Treinar a força de trabalho para entender como verificar e relatar patches de software desatualizados ou quaisquer falhas em processos e ferramentas automatizadas.', status: ControlStatus.NotImplemented },
    { id: 'CIS-14.8', framework: FrameworkName.CIS, family: 'Controle 14', name: 'Treinar a Força de Trabalho sobre os Perigos de se Conectar e Transmitir Dados Corporativos por Redes Inseguras', description: 'Treinar membros da força de trabalho sobre os perigos de se conectar e transmitir dados por redes inseguras.', status: ControlStatus.NotImplemented },
    { id: 'CIS-14.9', framework: FrameworkName.CIS, family: 'Controle 14', name: 'Conduzir Treinamento de Conscientização e Habilidades em Segurança Específico para a Função', description: 'Conduzir treinamento de conscientização e habilidades em segurança específico para a função.', status: ControlStatus.NotImplemented },
    { id: 'CIS-15.1', framework: FrameworkName.CIS, family: 'Controle 15', name: 'Estabelecer e Manter um Inventário de Provedores de Serviço', description: 'Estabelecer e manter um inventário de provedores de serviço.', status: ControlStatus.NotImplemented },
    { id: 'CIS-15.2', framework: FrameworkName.CIS, family: 'Controle 15', name: 'Estabelecer e Manter uma Política de Gerenciamento de Provedores de Serviço', description: 'Estabelecer e manter uma política de gerenciamento de provedores de serviço.', status: ControlStatus.NotImplemented },
    { id: 'CIS-15.3', framework: FrameworkName.CIS, family: 'Controle 15', name: 'Classificar Provedores de Serviço', description: 'Classificar os provedores de serviço.', status: ControlStatus.NotImplemented },
    { id: 'CIS-15.4', framework: FrameworkName.CIS, family: 'Controle 15', name: 'Garantir que os Contratos com Provedores de Serviço Incluam Requisitos de Segurança', description: 'Garantir que os contratos com provedores de serviço incluam requisitos de segurança.', status: ControlStatus.NotImplemented },
    { id: 'CIS-15.5', framework: FrameworkName.CIS, family: 'Controle 15', name: 'Avaliar Provedores de Serviço', description: 'Avaliar provedores de serviço de acordo com a política de gerenciamento de provedores de serviço da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-15.6', framework: FrameworkName.CIS, family: 'Controle 15', name: 'Monitorar Provedores de Serviço', description: 'Monitorar provedores de serviço de acordo com a política de gerenciamento de provedores de serviço da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-15.7', framework: FrameworkName.CIS, family: 'Controle 15', name: 'Descomissionar Provedores de Serviço de Forma Segura', description: 'Descomissionar provedores de serviço de forma segura.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.1', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Estabelecer e Manter um Processo Seguro de Desenvolvimento de Aplicações', description: 'Estabelecer e manter um processo seguro de desenvolvimento de aplicações.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.2', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Estabelecer e Manter um Processo para Aceitar e Lidar com Vulnerabilidades de Software', description: 'Estabelecer e manter um processo para aceitar e lidar com relatórios de vulnerabilidades de software.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.3', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Realizar Análise de Causa Raiz em Vulnerabilidades de Segurança', description: 'Realizar análise de causa raiz em vulnerabilidades de segurança.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.4', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Estabelecer e Gerenciar um Inventário de Componentes de Software de Terceiros', description: 'Estabelecer e gerenciar um inventário atualizado de componentes de software de terceiros usados no desenvolvimento.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.5', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Usar Componentes de Software de Terceiros Atualizados e Confiáveis', description: 'Usar componentes de software de terceiros atualizados e confiáveis.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.6', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Estabelecer e Manter um Sistema de Classificação de Severidade para Vulnerabilidades de Aplicação', description: 'Estabelecer e manter um sistema de classificação de severidade e processo para vulnerabilidades de aplicação.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.7', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Usar Templates de Configuração de Hardening Padrão para Infraestrutura de Aplicação', description: 'Usar templates de configuração de hardening padrão recomendados pela indústria para componentes de infraestrutura de aplicação.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.8', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Separar Sistemas de Produção e Não Produção', description: 'Manter ambientes separados para sistemas de produção e não produção.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.9', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Treinar Desenvolvedores em Conceitos de Segurança de Aplicações e Codificação Segura', description: 'Garantir que todo o pessoal de desenvolvimento de software receba treinamento em escrita de código seguro.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.10', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Aplicar Princípios de Design Seguro em Arquiteturas de Aplicação', description: 'Aplicar princípios de design seguro em arquiteturas de aplicação.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.11', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Aproveitar Módulos ou Serviços Verificados para Componentes de Segurança de Aplicações', description: 'Aproveitar módulos ou serviços verificados para componentes de segurança de aplicações, como gerenciamento de identidade, criptografia e auditoria.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.12', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Implementar Verificações de Segurança em Nível de Código', description: 'Aplicar ferramentas de análise estática e dinâmica dentro do ciclo de vida da aplicação para verificar se práticas de codificação segura estão sendo seguidas.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.13', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Conduzir Testes de Penetração de Aplicações', description: 'Conduzir testes de penetração de aplicações.', status: ControlStatus.NotImplemented },
    { id: 'CIS-16.14', framework: FrameworkName.CIS, family: 'Controle 16', name: 'Conduzir Modelagem de Ameaças', description: 'Conduzir modelagem de ameaças.', status: ControlStatus.NotImplemented },
    { id: 'CIS-17.1', framework: FrameworkName.CIS, family: 'Controle 17', name: 'Designar Pessoal para Gerenciar o Tratamento de Incidentes', description: 'Designar uma pessoa chave, e pelo menos um substituto, que gerenciará o processo de tratamento de incidentes da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-17.2', framework: FrameworkName.CIS, family: 'Controle 17', name: 'Estabelecer e Manter Informações de Contato para Relatar Incidentes de Segurança', description: 'Estabelecer e manter informações de contato para as partes que precisam ser informadas sobre incidentes de segurança.', status: ControlStatus.NotImplemented },
    { id: 'CIS-17.3', framework: FrameworkName.CIS, family: 'Controle 17', name: 'Estabelecer e Manter um Processo Corporativo para Relatar Incidentes', description: 'Estabelecer e manter um processo corporativo documentado para a força de trabalho relatar incidentes de segurança.', status: ControlStatus.NotImplemented },
    { id: 'CIS-17.4', framework: FrameworkName.CIS, family: 'Controle 17', name: 'Estabelecer e Manter um Processo de Resposta a Incidentes', description: 'Estabelecer e manter um processo documentado de resposta a incidentes que aborde papéis e responsabilidades, requisitos de conformidade e um plano de comunicação.', status: ControlStatus.NotImplemented },
    { id: 'CIS-17.5', framework: FrameworkName.CIS, family: 'Controle 17', name: 'Atribuir Papéis e Responsabilidades Chave', description: 'Atribuir papéis e responsabilidades chave para resposta a incidentes, incluindo pessoal de resposta a incidentes, analistas e terceiros relevantes.', status: ControlStatus.NotImplemented },
    { id: 'CIS-17.6', framework: FrameworkName.CIS, family: 'Controle 17', name: 'Definir Mecanismos de Comunicação Durante a Resposta a Incidentes', description: 'Determinar quais mecanismos primários e secundários serão usados para comunicar e relatar durante um incidente de segurança.', status: ControlStatus.NotImplemented },
    { id: 'CIS-17.7', framework: FrameworkName.CIS, family: 'Controle 17', name: 'Conduzir Exercícios de Resposta a Incidentes de Rotina', description: 'Planejar e conduzir exercícios de resposta a incidentes de rotina e cenários para o pessoal chave envolvido no processo de resposta a incidentes.', status: ControlStatus.NotImplemented },
    { id: 'CIS-17.8', framework: FrameworkName.CIS, family: 'Controle 17', name: 'Conduzir Revisões Pós-Incidente', description: 'Conduzir revisões pós-incidente.', status: ControlStatus.NotImplemented },
    { id: 'CIS-17.9', framework: FrameworkName.CIS, family: 'Controle 17', name: 'Estabelecer e Manter Limites de Incidentes de Segurança', description: 'Estabelecer e manter limites de incidentes de segurança, incluindo, no mínimo, a diferenciação entre um incidente e um evento.', status: ControlStatus.NotImplemented },
    { id: 'CIS-18.1', framework: FrameworkName.CIS, family: 'Controle 18', name: 'Estabelecer e Manter um Programa de Testes de Penetração', description: 'Estabelecer e manter um programa de testes de penetração apropriado ao tamanho, complexidade, indústria e maturidade da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-18.2', framework: FrameworkName.CIS, family: 'Controle 18', name: 'Realizar Testes de Penetração Externos Periódicos', description: 'Realizar testes de penetração externos periódicos com base nos requisitos do programa, no mínimo anualmente.', status: ControlStatus.NotImplemented },
    { id: 'CIS-18.3', framework: FrameworkName.CIS, family: 'Controle 18', name: 'Remediar Achados de Testes de Penetração', description: 'Remediar os achados de testes de penetração com base no processo documentado de remediação de vulnerabilidades da empresa.', status: ControlStatus.NotImplemented },
    { id: 'CIS-18.4', framework: FrameworkName.CIS, family: 'Controle 18', name: 'Validar Medidas de Segurança', description: 'Validar as medidas de segurança após cada teste de penetração.', status: ControlStatus.NotImplemented },
    { id: 'CIS-18.5', framework: FrameworkName.CIS, family: 'Controle 18', name: 'Realizar Testes de Penetração Internos Periódicos', description: 'Realizar testes de penetração internos periódicos com base nos requisitos do programa, no mínimo anualmente.', status: ControlStatus.NotImplemented },
];

const lgpdControls: Control[] = [
    // Princípios (Art. 6)
    { id: 'LGPD-Art.6-I', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Finalidade', description: 'Realizar o tratamento de dados para propósitos legítimos, específicos, explícitos e informados ao titular.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.6-II', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Adequação', description: 'Garantir a compatibilidade do tratamento com as finalidades informadas ao titular.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.6-III', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Necessidade', description: 'Limitar o tratamento ao mínimo necessário para a realização de suas finalidades.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.6-IV', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Livre Acesso', description: 'Garantir aos titulares a consulta facilitada e gratuita sobre a forma e a duração do tratamento, bem como sobre a integralidade de seus dados.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.6-V', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Qualidade dos Dados', description: 'Garantir aos titulares a exatidão, clareza, relevância e atualização dos dados, de acordo com a necessidade.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.6-VI', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Transparência', description: 'Garantir aos titulares informações claras, precisas e facilmente acessíveis sobre a realização do tratamento e os respectivos agentes.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.6-VII', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Segurança', description: 'Utilizar medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.6-VIII', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Prevenção', description: 'Adotar medidas para prevenir a ocorrência de danos em virtude do tratamento de dados pessoais.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.6-IX', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Não Discriminação', description: 'Impossibilitar a realização do tratamento para fins discriminatórios ilícitos ou abusivos.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.6-X', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Responsabilização e Prestação de Contas', description: 'Demonstrar a adoção de medidas eficazes e capazes de comprovar a observância e o cumprimento das normas de proteção de dados.', status: ControlStatus.NotImplemented },
    // Bases Legais (Art. 7, 11)
    { id: 'LGPD-Art.7', framework: FrameworkName.LGPD, family: 'Bases Legais', name: 'Mapeamento de Bases Legais', description: 'Identificar e documentar a base legal apropriada para cada atividade de tratamento de dados pessoais.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.8', framework: FrameworkName.LGPD, family: 'Bases Legais', name: 'Gestão de Consentimento', description: 'Manter processo para obter, gerenciar e revogar o consentimento do titular de forma clara e inequívoca.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.11', framework: FrameworkName.LGPD, family: 'Bases Legais', name: 'Tratamento de Dados Sensíveis', description: 'Aplicar requisitos específicos para o tratamento de dados pessoais sensíveis, garantindo uma base legal adequada.', status: ControlStatus.NotImplemented },
    // Direitos dos Titulares (Art. 18)
    { id: 'LGPD-Art.18-I', framework: FrameworkName.LGPD, family: 'Direitos do Titular', name: 'Confirmação da Existência do Tratamento', description: 'Implementar canal para que o titular possa solicitar a confirmação da existência de tratamento de seus dados.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.18-II', framework: FrameworkName.LGPD, family: 'Direitos do Titular', name: 'Acesso aos Dados', description: 'Prover meios para o titular acessar seus dados pessoais que estão sendo tratados.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.18-III', framework: FrameworkName.LGPD, family: 'Direitos do Titular', name: 'Correção de Dados', description: 'Permitir que o titular solicite a correção de dados incompletos, inexatos ou desatualizados.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.18-IV', framework: FrameworkName.LGPD, family: 'Direitos do Titular', name: 'Anonimização, Bloqueio ou Eliminação', description: 'Atender solicitações de anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.18-V', framework: FrameworkName.LGPD, family: 'Direitos do Titular', name: 'Portabilidade dos Dados', description: 'Viabilizar a portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.18-VI', framework: FrameworkName.LGPD, family: 'Direitos do Titular', name: 'Eliminação dos Dados', description: 'Garantir a eliminação dos dados pessoais tratados com o consentimento do titular, exceto nas hipóteses de conservação.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.18-VII', framework: FrameworkName.LGPD, family: 'Direitos do Titular', name: 'Informação sobre Compartilhamento', description: 'Informar o titular sobre as entidades públicas e privadas com as quais o controlador realizou uso compartilhado de dados.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.18-IX', framework: FrameworkName.LGPD, family: 'Direitos do Titular', name: 'Revogação do Consentimento', description: 'Assegurar ao titular a possibilidade de revogar o consentimento a qualquer momento, de forma fácil e gratuita.', status: ControlStatus.NotImplemented },
    // Governança e Segurança
    { id: 'LGPD-Art.37', framework: FrameworkName.LGPD, family: 'Governança', name: 'Registro das Operações (ROPA)', description: 'Manter registro (ROPA) das operações de tratamento de dados pessoais que realizar.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.38', framework: FrameworkName.LGPD, family: 'Governança', name: 'Relatório de Impacto (DPIA)', description: 'Elaborar Relatório de Impacto à Proteção de Dados Pessoais (DPIA) para tratamentos que possam gerar alto risco.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.41', framework: FrameworkName.LGPD, family: 'Governança', name: 'Nomeação do Encarregado (DPO)', description: 'Indicar o Encarregado pelo tratamento de dados pessoais (DPO) e divulgar sua identidade e informações de contato.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.46', framework: FrameworkName.LGPD, family: 'Segurança', name: 'Medidas de Segurança', description: 'Adotar medidas de segurança, técnicas e administrativas para proteger os dados pessoais.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.48', framework: FrameworkName.LGPD, family: 'Segurança', name: 'Comunicação de Incidentes', description: 'Comunicar à Autoridade Nacional (ANPD) e ao titular a ocorrência de incidente de segurança que possa acarretar risco ou dano relevante.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.50', framework: FrameworkName.LGPD, family: 'Governança', name: 'Programa de Governança em Privacidade', description: 'Formular e implementar um programa de governança em privacidade que demonstre o comprometimento do controlador.', status: ControlStatus.NotImplemented },
];
const allControls: Control[] = [...nistControls, ...cisControls, ...lgpdControls];


// --- CONTEXT for global state ---
const AppContext = createContext(null);


// --- UI Components ---

const Header = () => (
    <header className="bg-surface p-4 border-b border-border-color flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
                <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-text-primary">EXA GRC</h1>
                <p className="text-sm text-text-secondary">Plataforma Integrada de Gestão de Riscos e Conformidade</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">Bem-vindo, {mockUsers[UserRole.Admin].name}</span>
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold text-background">
                {mockUsers[UserRole.Admin].name.charAt(0)}
            </div>
        </div>
    </header>
);

const NavItem = ({ icon: Icon, text, active, onClick }) => (
    <li
        className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${
      active ? 'bg-primary/20 text-primary' : 'hover:bg-surface text-text-secondary'
    }`}
        onClick={onClick}
    >
        <Icon className="h-5 w-5 mr-3" />
        <span className="font-medium">{text}</span>
    </li>
);

const Sidebar = ({ activePage, setActivePage }) => (
    <aside className="w-64 bg-surface p-4 flex flex-col">
        <nav className="flex-grow">
            <ul>
                <NavItem icon={LayoutDashboard} text="Dashboard" active={activePage === 'Dashboard'} onClick={() => setActivePage('Dashboard')} />
                <NavItem icon={AlertTriangle} text="Riscos" active={activePage === 'Riscos'} onClick={() => setActivePage('Riscos')} />
                <NavItem icon={GanttChartSquare} text="Ativos" active={activePage === 'Ativos'} onClick={() => setActivePage('Ativos')} />
                <NavItem icon={Shield} text="Conformidade" active={activePage === 'Conformidade'} onClick={() => setActivePage('Conformidade')} />
                <NavItem icon={DatabaseZap} text="Controles de Dados" active={activePage === 'Controles de Dados'} onClick={() => setActivePage('Controles de Dados')} />
            </ul>
        </nav>
        <div className="mt-auto">
            <ul>
                <NavItem icon={Settings} text="Configurações" active={activePage === 'Configurações'} onClick={() => setActivePage('Configurações')} />
            </ul>
        </div>
    </aside>
);

const Card: React.FC<{ children?: React.ReactNode; className?: string; }> = ({ children, className = '' }) => (
    <div className={`bg-surface rounded-lg p-6 ${className}`}>
        {children}
    </div>
);

const RiskHeatmap = ({ risks }) => {
    const heatmapData = useMemo(() => {
        const grid = Array(5).fill(null).map(() => Array(5).fill(null).map(() => []));
        risks.forEach(risk => {
            grid[5 - risk.impact][risk.probability - 1].push(risk);
        });
        return grid;
    }, [risks]);

    const getCellColor = (count) => {
        if (count === 0) return 'bg-gray-700/50';
        if (count === 1) return 'bg-yellow-500/60';
        if (count === 2) return 'bg-orange-500/70';
        return 'bg-red-600/80';
    };

    return (
        <Card>
            <h2 className="text-lg font-semibold mb-4">Heatmap de Riscos</h2>
            <div className="flex">
                <div className="flex items-center justify-center transform -rotate-90 -translate-x-12">
                    <span className="text-sm font-medium text-text-secondary">Impacto</span>
                </div>
                <div className="grid grid-cols-5 gap-1 flex-grow">
                    {heatmapData.flat().map((risksInCell, index) => (
                        <div key={index} className={`w-full aspect-square rounded ${getCellColor(risksInCell.length)} flex items-center justify-center font-bold text-lg text-white tooltip-container`} title={risksInCell.map(r => r.title).join(', ')}>
                            {risksInCell.length > 0 && risksInCell.length}
                        </div>
                    ))}
                    <div className="col-span-5 flex justify-between text-xs text-text-secondary mt-1">
                        <span>1 (Raro)</span>
                        <span>2 (Improvável)</span>
                        <span>3 (Possível)</span>
                        <span>4 (Provável)</span>
                        <span>5 (Quase Certo)</span>
                    </div>
                    <div className="col-span-5 text-center text-sm font-medium text-text-secondary mt-2">
                        Probabilidade
                    </div>
                </div>
                <div className="flex flex-col justify-between text-xs text-text-secondary ml-1">
                    <span>5 (Catastrófico)</span>
                    <span>4 (Alto)</span>
                    <span>3 (Médio)</span>
                    <span>2 (Baixo)</span>
                    <span>1 (Insignificante)</span>
                </div>
            </div>
        </Card>
    );
};

const Gauge = ({ value, label, colorClass, maxValue }) => {
    const percentage = (value / maxValue) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="10" className="text-gray-700" />
                <circle
                    cx="50" cy="50" r="45" fill="none" strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 50 50)"
                    className={`${colorClass} transition-all duration-1000 ease-in-out`}
                    strokeLinecap="round"
                />
                <text x="50" y="50" textAnchor="middle" dy=".3em" className="text-2xl font-bold fill-current text-text-primary">
                    {label.includes('%') ? `${Math.round(percentage)}%` : value.toFixed(1)}
                </text>
            </svg>
            <p className="mt-2 text-sm font-medium text-text-secondary text-center">{label}</p>
        </div>
    );
};

const ComplianceSummaryTable = ({ controls }) => {
    const summary = useMemo(() => {
        const initial = {
            [FrameworkName.NIST]: { total: 0, [ControlStatus.FullyImplemented]: 0, [ControlStatus.PartiallyImplemented]: 0, [ControlStatus.NotImplemented]: 0, [ControlStatus.InProgress]: 0 },
            [FrameworkName.CIS]: { total: 0, [ControlStatus.FullyImplemented]: 0, [ControlStatus.PartiallyImplemented]: 0, [ControlStatus.NotImplemented]: 0, [ControlStatus.InProgress]: 0 },
            [FrameworkName.LGPD]: { total: 0, [ControlStatus.FullyImplemented]: 0, [ControlStatus.PartiallyImplemented]: 0, [ControlStatus.NotImplemented]: 0, [ControlStatus.InProgress]: 0 },
        };

        return controls.reduce((acc, control) => {
            if (acc[control.framework]) {
                acc[control.framework].total++;
                if (acc[control.framework][control.status] !== undefined) {
                    acc[control.framework][control.status]++;
                }
            }
            return acc;
        }, initial);
    }, [controls]);

    return (
        <Card className="lg:col-span-4">
            <h2 className="text-lg font-semibold mb-4">Resumo de Conformidade por Framework</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-surface/50">
                        <tr>
                            <th className="p-4 font-semibold">Framework</th>
                            <th className="p-4 font-semibold text-center text-green-400">Implementados</th>
                            <th className="p-4 font-semibold text-center text-yellow-400">Parcialmente Imp.</th>
                            <th className="p-4 font-semibold text-center text-red-400">Não Implementados</th>
                            <th className="p-4 font-semibold text-center">Total de Controles</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(summary).map(([framework, data]: [string, any]) => (
                            <tr key={framework} className="border-t border-border-color">
                                <td className="p-4 font-bold">{framework}</td>
                                <td className="p-4 text-center font-mono">{data[ControlStatus.FullyImplemented]}</td>
                                <td className="p-4 text-center font-mono">{data[ControlStatus.PartiallyImplemented]}</td>
                                <td className="p-4 text-center font-mono">{data[ControlStatus.NotImplemented]}</td>
                                <td className="p-4 text-center font-mono font-bold">{data.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

const RiskByTypeSummary = ({ risks }) => {
    const summary = useMemo(() => {
        const initialSummary = Object.fromEntries(
            Object.values(RiskType).map(type => [type, 0])
        ) as Record<RiskType, number>;

        return risks.reduce((acc, risk) => {
            if (risk.type in acc) {
                acc[risk.type]++;
            }
            return acc;
        }, initialSummary);
    }, [risks]);

    const sortedSummary = Object.entries(summary).sort(([a], [b]) => a.localeCompare(b));

    return (
        <Card>
            <h2 className="text-lg font-semibold mb-4">Riscos por Categoria</h2>
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm">
                        <tr>
                            <th className="p-3 font-semibold">Tipo de Risco</th>
                            <th className="p-3 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSummary.map(([type, count]) => (
                            <tr key={type} className="border-t border-border-color">
                                <td className="p-3">{type}</td>
                                <td className="p-3 text-right font-mono font-bold">{count}</td>
                            </tr>
                        ))}
                         <tr className="border-t-2 border-border-color bg-surface/50">
                             <td className="p-3 font-bold">Total Geral</td>
                             <td className="p-3 text-right font-mono font-extrabold">{risks.length}</td>
                         </tr>
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const DashboardPage = ({ risks, controls }) => {
    const riskStatusCounts = useMemo(() => {
        return risks.reduce((acc, risk) => {
            acc[risk.status] = (acc[risk.status] || 0) + 1;
            return acc;
        }, {});
    }, [risks]);

    const getMaturityLabel = (score) => {
        if (score < 1.5) return "Inicial";
        if (score < 2.5) return "Em Desenvolvimento";
        if (score < 3.5) return "Definido";
        if (score < 4.5) return "Gerenciado";
        return "Otimizado";
    };

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Quick Stats */}
            <Card className="lg:col-span-1 bg-gradient-to-br from-red-500 to-danger"><h3 className="text-lg font-semibold">Riscos Abertos</h3><p className="text-4xl font-bold">{riskStatusCounts[RiskStatus.Open] || 0}</p></Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-yellow-500 to-orange-500"><h3 className="text-lg font-semibold">Em Andamento</h3><p className="text-4xl font-bold">{riskStatusCounts[RiskStatus.InProgress] || 0}</p></Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-green-500 to-secondary"><h3 className="text-lg font-semibold">Riscos Mitigados</h3><p className="text-4xl font-bold">{riskStatusCounts[RiskStatus.Mitigated] || 0}</p></Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-blue-500 to-primary"><h3 className="text-lg font-semibold">Riscos Aceitos</h3><p className="text-4xl font-bold">{riskStatusCounts[RiskStatus.Accepted] || 0}</p></Card>
            
            <ComplianceSummaryTable controls={controls} />

            {/* Main Dashboard Area */}
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <RiskHeatmap risks={risks} />
                 <RiskByTypeSummary risks={risks} />
            </div>
        </div>
    );
};


// --- Risks Page Components ---

const RiskModal = ({ risk, onSave, onClose }) => {
    const [formData, setFormData] = useState(
        risk || {
            title: '',
            description: '',
            probability: 1,
            impact: 1,
            status: RiskStatus.Open,
            owner: '',
            dueDate: new Date().toISOString().split('T')[0],
            type: RiskType.Operational,
            sla: 30,
            planResponsible: '',
            technicalResponsible: '',
            actionPlan: '',
            completionDate: '',
        }
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        const finalValue = (name === 'probability' || name === 'impact' || name === 'sla') ? Number(value) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 flex-shrink-0">{risk ? `Editar Risco #${formData.id}` : 'Adicionar Novo Risco'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-4">
                    {/* Core Info */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Título do Risco</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descrição Detalhada</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                    </div>
                    {/* Matrix & Classification */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Probabilidade (1-5)</label>
                            <select name="probability" value={formData.probability} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Impacto (1-5)</label>
                            <select name="impact" value={formData.impact} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                         <div>
                             <label className="block text-sm font-medium mb-1">Status do Risco</label>
                             <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                 {Object.values(RiskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Tipo do Risco</label>
                             <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                 {Object.values(RiskType).map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                        </div>
                    </div>
                    {/* Responsibles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                             <label className="block text-sm font-medium mb-1">Responsável (Área)</label>
                             <input type="text" name="owner" value={formData.owner} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Responsável pelo Plano</label>
                             <input type="text" name="planResponsible" value={formData.planResponsible} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Responsável Técnico</label>
                             <input type="text" name="technicalResponsible" value={formData.technicalResponsible} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    {/* Dates & SLA */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                             <label className="block text-sm font-medium mb-1">Prazo Final</label>
                             <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                         </div>
                          <div>
                             <label className="block text-sm font-medium mb-1">Data de Finalização</label>
                             <input type="date" name="completionDate" value={formData.completionDate || ''} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1">SLA (dias)</label>
                             <input type="number" name="sla" value={formData.sla} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                         </div>
                     </div>
                    {/* Action Plan */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Plano de Ação</label>
                        <textarea name="actionPlan" value={formData.actionPlan} onChange={handleChange} rows="4" className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                    </div>
                     <div className="flex justify-end gap-4 pt-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RiskTable = ({ risks, onEdit, onDelete }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        // Add timezone offset to display correct date
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return new Intl.DateTimeFormat('pt-BR').format(date);
    };

    const getRiskClassification = (probability, impact) => {
        const score = probability * impact;
        if (score <= 4) return { text: 'BAIXO', className: 'bg-green-600 text-white' };
        if (score <= 9) return { text: 'MÉDIO', className: 'bg-yellow-500 text-black' };
        if (score <= 12) return { text: 'ALTO', className: 'bg-orange-500 text-white' };
        return { text: 'CRÍTICO', className: 'bg-red-600 text-white' };
    };

    const calculateAgingDays = (creationDate) => {
        const start = new Date(creationDate);
        const end = new Date();
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    
    const getDueDateStatus = (risk) => {
        if (risk.completionDate) {
            return { text: 'Finalizado', className: 'bg-green-500/20 text-green-400' };
        }
        if (!risk.dueDate) {
            return { text: 'Sem Prazo', className: 'bg-gray-500/20 text-gray-400' };
        }
        const due = new Date(risk.dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (due < today) {
            return { text: 'Atrasado', className: 'bg-red-500/20 text-red-400' };
        } else {
            return { text: 'No Prazo', className: 'bg-blue-500/20 text-blue-400' };
        }
    };
    
    return (
        <div className="bg-surface rounded-lg overflow-hidden">
            <table className="w-full text-left table-auto">
                <thead className="bg-surface/50 text-xs text-text-secondary uppercase">
                    <tr>
                        <th className="px-2 py-3 font-semibold">ID</th>
                        <th className="px-2 py-3 font-semibold">Risco</th>
                        <th className="px-2 py-3 font-semibold text-center">Criação</th>
                        <th className="px-2 py-3 font-semibold text-center">Prob.</th>
                        <th className="px-2 py-3 font-semibold text-center">Impacto</th>
                        <th className="px-2 py-3 font-semibold text-center">Classe</th>
                        <th className="px-2 py-3 font-semibold">Responsável</th>
                        <th className="px-2 py-3 font-semibold text-center">Prazo Final</th>
                        <th className="px-2 py-3 font-semibold text-center">Status Prazo</th>
                        <th className="px-2 py-3 font-semibold">Resolução</th>
                        <th className="px-2 py-3 font-semibold text-center">Aging</th>
                        <th className="px-2 py-3 font-semibold">Plano</th>
                        <th className="px-2 py-3 font-semibold text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="text-xs">
                    {risks.map(risk => {
                        const classification = getRiskClassification(risk.probability, risk.impact);
                        const dueDateStatus = getDueDateStatus(risk);

                        return (
                            <tr key={risk.id} className="border-t border-border-color hover:bg-surface/50">
                                <td className="px-2 py-3 font-mono">{risk.id}</td>
                                <td className="px-2 py-3">
                                    <p className="font-semibold truncate" title={risk.title}>{risk.title}</p>
                                </td>
                                <td className="px-2 py-3 text-center">{formatDate(risk.creationDate)}</td>
                                <td className="px-2 py-3 text-center">{risk.probability}</td>
                                <td className="px-2 py-3 text-center">{risk.impact}</td>
                                <td className="px-2 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full font-bold ${classification.className}`}>
                                        {classification.text}
                                    </span>
                                </td>
                                <td className="px-2 py-3 truncate" title={risk.owner}>{risk.owner}</td>
                                <td className="px-2 py-3 text-center">{formatDate(risk.dueDate)}</td>
                                 <td className="px-2 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full font-semibold ${dueDateStatus.className}`}>
                                        {dueDateStatus.text}
                                    </span>
                                </td>
                                <td className="px-2 py-3">{risk.status}</td>
                                <td className="px-2 py-3 text-center font-mono">{calculateAgingDays(risk.creationDate)}</td>
                                <td className="px-2 py-3">
                                    <p className="truncate" title={risk.actionPlan}>{risk.actionPlan}</p>
                                </td>
                                <td className="px-2 py-3 text-center">
                                    <div className="flex gap-1 justify-center">
                                        <button onClick={() => onEdit(risk)} className="text-text-secondary hover:text-primary p-1"><Edit size={14} /></button>
                                        <button onClick={() => onDelete(risk.id)} className="text-text-secondary hover:text-danger p-1"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const RisksPage = ({ risks, setRisks }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingRisk, setEditingRisk] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    const filteredRisks = useMemo(() =>
        risks.filter(risk =>
            risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            risk.description.toLowerCase().includes(searchTerm.toLowerCase())
        ), [risks, searchTerm]
    );

    const openModal = (risk = null) => {
        setEditingRisk(risk);
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (riskData) => {
        if (editingRisk) {
            setRisks(risks.map(r => r.id === riskData.id ? riskData : r));
        } else {
            const maxId = risks.reduce((max, r) => Math.max(r.id, max), 0);
            const newRisk = { 
                ...riskData, 
                id: maxId + 1,
                creationDate: new Date().toISOString()
            };
            setRisks([...risks, newRisk]);
        }
        closeModal();
    };

    const handleDelete = (riskId) => {
        if (window.confirm('Tem certeza que deseja excluir este risco?')) {
            setRisks(risks.filter(r => r.id !== riskId));
        }
    };
    
    const handleDownloadTemplate = () => {
        const headers = "title,description,probability,impact,owner,dueDate,status,type,sla,planResponsible,technicalResponsible,actionPlan,completionDate";
        const example = `"Vulnerabilidade em Servidor Web","Servidor Apache desatualizado na versão 2.4.1","4","5","Equipe de Infra","2024-12-31","${RiskStatus.Open}","${RiskType.Security}","30","João Silva","Maria Souza","Aplicar patch de segurança XYZ",""`;
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_riscos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result as string;
            try {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                const headers = lines.shift().split(',').map(h => h.trim().replace(/"/g, ''));
                const requiredHeaders = ["title", "probability", "impact", "owner", "dueDate", "status", "type"];
                
                if (!requiredHeaders.every(h => headers.includes(h))) {
                    alert(`CSV inválido. O cabeçalho deve conter: ${requiredHeaders.join(', ')}`);
                    return;
                }

                let currentMaxId = risks.reduce((max, r) => Math.max(r.id, max), 0);
                
                const newRisks = lines.map(line => {
                    const data = line.split(',');
                    const riskObject = headers.reduce((obj, header, index) => {
                        obj[header] = data[index] ? data[index].replace(/"/g, '') : '';
                        return obj;
                    }, {} as any);

                    currentMaxId++;
                    return {
                        id: currentMaxId,
                        creationDate: new Date().toISOString(),
                        title: riskObject.title || 'Título não informado',
                        description: riskObject.description || '',
                        probability: parseInt(riskObject.probability) || 1,
                        impact: parseInt(riskObject.impact) || 1,
                        status: Object.values(RiskStatus).includes(riskObject.status) ? riskObject.status : RiskStatus.Open,
                        owner: riskObject.owner || '',
                        dueDate: riskObject.dueDate || new Date().toISOString().split('T')[0],
                        type: Object.values(RiskType).includes(riskObject.type) ? riskObject.type : RiskType.Operational,
                        sla: parseInt(riskObject.sla) || 30,
                        planResponsible: riskObject.planResponsible || '',
                        technicalResponsible: riskObject.technicalResponsible || '',
                        actionPlan: riskObject.actionPlan || '',
                        completionDate: riskObject.completionDate || '',
                    };
                });

                setRisks(prev => [...prev, ...newRisks]);
                alert(`${newRisks.length} riscos importados com sucesso!`);
            } catch (error) {
                console.error("Erro ao processar CSV:", error);
                alert('Ocorreu um erro ao processar o arquivo CSV. Verifique o formato e tente novamente.');
            }
        };
        reader.readAsText(file);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gerenciamento de Riscos</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por título ou descrição..."
                        className="w-full bg-background border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                        <Download size={18} />
                        Template CSV
                    </button>
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                     <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                        <Upload size={18} />
                        Importar CSV
                    </button>
                    <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <Plus size={18} />
                        Adicionar Risco
                    </button>
                </div>
            </div>
            
            <RiskTable risks={filteredRisks} onEdit={openModal} onDelete={handleDelete} />

            {isModalOpen && <RiskModal risk={editingRisk} onSave={handleSave} onClose={closeModal} />}
        </div>
    );
};


// --- Compliance Page Components ---

const ComplianceControlModal = ({ control, onSave, onClose }) => {
    const [formData, setFormData] = useState(control);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const finalValue = (name === 'processScore' || name === 'practiceScore') ? Number(value) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6">Editar Status do Controle</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">ID do Controle</label>
                        <p className="font-mono text-sm p-2 bg-background/50 rounded-md cursor-not-allowed">{formData.id}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                         <p className="p-2 bg-background/50 rounded-md">{formData.name}</p>
                    </div>
                    {formData.framework === FrameworkName.NIST ? (
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select name="status" value={formData.status || ''} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                    {Object.values(ControlStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Score de Práticas (1-5)</label>
                                    <select name="practiceScore" value={formData.practiceScore || ''} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Score de Processos (1-5)</label>
                                    <select name="processScore" value={formData.processScore || ''} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select name="status" value={formData.status || ''} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                {Object.values(ControlStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ComplianceTable = ({ controls, onEdit }) => {
    const getStatusClass = (status) => {
        const mapping = {
            [ControlStatus.FullyImplemented]: 'bg-green-500/20 text-green-400',
            [ControlStatus.PartiallyImplemented]: 'bg-yellow-500/20 text-yellow-400',
            [ControlStatus.InProgress]: 'bg-blue-500/20 text-blue-400',
            [ControlStatus.NotImplemented]: 'bg-red-500/20 text-red-400',
        };
        return mapping[status] || 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className="bg-surface rounded-lg overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-surface/50">
                    <tr>
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Controle</th>
                        <th className="p-4 font-semibold">Framework</th>
                        <th className="p-4 font-semibold">Família</th>
                        <th className="p-4 font-semibold text-center">Status / Score</th>
                        <th className="p-4 font-semibold">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {controls.map(control => (
                        <tr key={control.id} className="border-t border-border-color hover:bg-surface/50">
                            <td className="p-4 font-mono text-xs text-text-secondary">{control.id}</td>
                            <td className="p-4 max-w-md">
                                <p className="font-semibold">{control.name}</p>
                                <p className="text-xs text-text-secondary truncate">{control.description}</p>
                            </td>
                            <td className="p-4">{control.framework}</td>
                            <td className="p-4">{control.family}</td>
                            <td className="p-4 text-center">
                                {control.framework === FrameworkName.NIST ? (
                                    <div className="flex flex-col items-center gap-1 text-xs">
                                        <span className={`px-2 py-1 rounded-full font-semibold ${getStatusClass(control.status)}`}>
                                            {control.status || 'N/A'}
                                        </span>
                                        <div className="flex gap-2 font-mono mt-1">
                                            <span>Práticas: {control.practiceScore}/5</span>
                                            <span>Processos: {control.processScore}/5</span>
                                        </div>
                                         <span className="font-bold text-sm mt-1">
                                            Geral: {(((control.practiceScore || 0) + (control.processScore || 0)) / 2).toFixed(1)}/5
                                         </span>
                                    </div>
                                ) : (
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(control.status)}`}>
                                        {control.status || 'N/A'}
                                    </span>
                                )}
                            </td>
                            <td className="p-4">
                                <button onClick={() => onEdit(control)} className="text-text-secondary hover:text-primary"><Edit size={18} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CompliancePage = ({ controls, setControls }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [frameworkFilter, setFrameworkFilter] = useState('Todos');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [editingControl, setEditingControl] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredControls = useMemo(() =>
        controls.filter(control =>
            (control.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
             control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             control.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (frameworkFilter === 'Todos' || control.framework === frameworkFilter) &&
            (statusFilter === 'Todos' || control.status === statusFilter)
        ), [controls, searchTerm, frameworkFilter, statusFilter]
    );
    
    const complianceSummary = useMemo(() => {
        const summary: Record<string, { value: number; label: string; maxValue: number; color: string; }> = {};
        Object.values(FrameworkName).forEach(framework => {
            const frameworkControls = controls.filter(c => c.framework === framework);
            if (frameworkControls.length === 0) return;

            if (framework === FrameworkName.NIST) {
                const totalScore = frameworkControls.reduce((sum, control) => {
                    const overallScore = ((control.practiceScore || 0) + (control.processScore || 0)) / 2;
                    return sum + overallScore;
                }, 0);
                summary[framework] = {
                    value: totalScore / frameworkControls.length,
                    label: 'Maturidade Média',
                    maxValue: 5,
                    color: 'text-primary'
                };
            } else {
                const implemented = frameworkControls.filter(c => c.status === ControlStatus.FullyImplemented).length;
                summary[framework] = {
                    value: (implemented / frameworkControls.length) * 100,
                    label: '% Implementado',
                    maxValue: 100,
                    color: 'text-secondary'
                };
            }
        });
        return summary;
    }, [controls]);


    const openModal = (control) => {
        setEditingControl(control);
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (controlData) => {
        setControls(controls.map(c => c.id === controlData.id ? controlData : c));
        closeModal();
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gerenciamento de Conformidade</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {Object.entries(complianceSummary).map(([framework, data]: [string, any]) => (
                    <Card key={framework}>
                        <h2 className="text-lg font-semibold mb-4 text-center">{framework}</h2>
                        <div className="flex justify-center items-center h-full">
                            <Gauge value={data.value} label={data.label} colorClass={data.color} maxValue={data.maxValue} />
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex gap-4 w-full">
                         <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                             <input type="text" placeholder="Buscar por ID, nome ou descrição..."
                                 className="w-full bg-background border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                 value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                         </div>
                        <select value={frameworkFilter} onChange={e => setFrameworkFilter(e.target.value)} className="bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="Todos">Todos os Frameworks</option>
                            {Object.values(FrameworkName).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                             <option value="Todos">Todos os Status</option>
                             {Object.values(ControlStatus).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            <ComplianceTable controls={filteredControls} onEdit={openModal} />

            {isModalOpen && <ComplianceControlModal control={editingControl} onSave={handleSave} onClose={closeModal} />}
        </div>
    );
};


// --- Assets Page Component ---
const AssetsPage = ({ assets, setAssets }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingAsset, setEditingAsset] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    const filteredAssets = useMemo(() =>
        assets.filter(asset =>
            asset.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [assets, searchTerm]
    );

    const openModal = (asset = null) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (assetData) => {
        if (editingAsset) {
            setAssets(assets.map(a => a.id === assetData.id ? assetData : a));
        } else {
            const newAsset = { ...assetData, id: Date.now() };
            setAssets([...assets, newAsset]);
        }
        closeModal();
    };

    const handleDelete = (assetId) => {
        if (window.confirm('Tem certeza que deseja excluir este ativo?')) {
            setAssets(assets.filter(a => a.id !== assetId));
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                if (typeof text === 'string') {
                    try {
                        const lines = text.split('\n').filter(line => line.trim() !== '');
                        const headers = lines[0].split(',').map(h => h.trim());
                        if (headers.join(',') !== 'nome,tipo,criticidade,responsavel') {
                           alert('Cabeçalho do CSV inválido. Use o template.');
                           return;
                        }
                        const newAssets = lines.slice(1).map(line => {
                            const [name, type, criticality, owner] = line.split(',');
                            return { id: Date.now() + Math.random(), name, type, criticality, owner };
                        });
                        setAssets(prev => [...prev, ...newAssets]);
                        alert(`${newAssets.length} ativos importados com sucesso!`);
                    } catch (error) {
                        alert('Erro ao processar o arquivo CSV.');
                    }
                }
            };
            reader.readAsText(file);
        }
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,nome,tipo,criticidade,responsavel\nServidor Exemplo,Servidor,Alta,Equipe de Infra";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_ativos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gerenciamento de Ativos</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome do ativo..."
                        className="w-full bg-background border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                        <Download size={18} />
                        Baixar Template CSV
                    </button>
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                     <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                        <Upload size={18} />
                        Importar CSV
                    </button>
                    <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <Plus size={18} />
                        Adicionar Ativo
                    </button>
                </div>
            </div>
            
            <AssetTable assets={filteredAssets} onEdit={openModal} onDelete={handleDelete} />

            {isModalOpen && <AssetModal asset={editingAsset} onSave={handleSave} onClose={closeModal} />}
        </div>
    );
};

const AssetTable = ({ assets, onEdit, onDelete }) => {
    const getCriticalityClass = (criticality) => {
        const mapping = {
            [AssetCriticality.Low]: 'bg-risk-low/20 text-risk-low',
            [AssetCriticality.Medium]: 'bg-risk-medium/20 text-risk-medium',
            [AssetCriticality.High]: 'bg-risk-high/20 text-risk-high',
            [AssetCriticality.Critical]: 'bg-risk-critical/20 text-risk-critical',
        };
        return mapping[criticality] || '';
    };

    return (
        <div className="bg-surface rounded-lg overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-surface/50">
                    <tr>
                        <th className="p-4 font-semibold">Nome</th>
                        <th className="p-4 font-semibold">Tipo</th>
                        <th className="p-4 font-semibold">Criticidade</th>
                        <th className="p-4 font-semibold">Responsável</th>
                        <th className="p-4 font-semibold">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map(asset => (
                        <tr key={asset.id} className="border-t border-border-color hover:bg-surface/50">
                            <td className="p-4">{asset.name}</td>
                            <td className="p-4">{asset.type}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCriticalityClass(asset.criticality)}`}>
                                    {asset.criticality}
                                </span>
                            </td>
                            <td className="p-4">{asset.owner}</td>
                            <td className="p-4">
                                <div className="flex gap-2">
                                    <button onClick={() => onEdit(asset)} className="text-text-secondary hover:text-primary"><Edit size={18} /></button>
                                    <button onClick={() => onDelete(asset.id)} className="text-text-secondary hover:text-danger"><Trash2 size={18} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const AssetModal = ({ asset, onSave, onClose }) => {
    const [formData, setFormData] = useState(
        asset || { name: '', type: AssetType.Server, criticality: AssetCriticality.Medium, owner: '' }
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6">{asset ? 'Editar Ativo' : 'Adicionar Ativo'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                            {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Criticidade</label>
                         <select name="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                            {Object.values(AssetCriticality).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Responsável</label>
                        <input type="text" name="owner" value={formData.owner} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Data Controls Page ---
const DataControlsPage = ({ dataControls, setDataControls }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [criticalityFilter, setCriticalityFilter] = useState('Todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingControl, setEditingControl] = useState(null);

    const filteredControls = useMemo(() =>
        dataControls.filter(control =>
            control.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (statusFilter === 'Todos' || control.status === statusFilter) &&
            (criticalityFilter === 'Todos' || control.criticality === criticalityFilter)
        ), [dataControls, searchTerm, statusFilter, criticalityFilter]
    );

    const openModal = (control = null) => {
        setEditingControl(control);
        setIsModalOpen(true);
    };
    
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (controlData) => {
        if (editingControl) {
            const updatedControl = { ...controlData, id: Number(controlData.id) };
            setDataControls(dataControls.map(c => c.id === updatedControl.id ? updatedControl : c));
        } else {
            const newControl = { ...controlData, id: Date.now() };
            setDataControls([...dataControls, newControl]);
        }
        closeModal();
    };

    const handleDelete = (controlId) => {
        if (window.confirm('Tem certeza que deseja excluir este controle de dados?')) {
            setDataControls(dataControls.filter(c => c.id !== controlId));
        }
    };
    
    const getStatusClass = (status) => ({
        [DataControlStatus.Active]: 'bg-green-500/20 text-green-400',
        [DataControlStatus.Inactive]: 'bg-gray-500/20 text-gray-400',
        [DataControlStatus.InReview]: 'bg-yellow-500/20 text-yellow-400',
    }[status] || '');

    const getCriticalityClass = (criticality) => ({
        [AssetCriticality.Low]: 'bg-risk-low/20 text-risk-low',
        [AssetCriticality.Medium]: 'bg-risk-medium/20 text-risk-medium',
        [AssetCriticality.High]: 'bg-risk-high/20 text-risk-high',
        [AssetCriticality.Critical]: 'bg-risk-critical/20 text-risk-critical',
    }[criticality] || '');

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gerenciamento de Controles de Dados</h1>
            <Card className="mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex gap-4 w-full">
                         <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                             <input type="text" placeholder="Buscar por nome do controle..."
                                 className="w-full bg-background border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                 value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                         </div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="Todos">Todos os Status</option>
                            {Object.values(DataControlStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={criticalityFilter} onChange={e => setCriticalityFilter(e.target.value)} className="bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                             <option value="Todos">Todas as Criticidades</option>
                             {Object.values(AssetCriticality).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button onClick={() => openModal()} className="flex-shrink-0 ml-4 flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                         <Plus size={18} /> Adicionar Controle
                    </button>
                </div>
            </Card>

            <div className="bg-surface rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-surface/50">
                        <tr>
                            <th className="p-4 font-semibold">Nome</th>
                            <th className="p-4 font-semibold">Categoria</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Criticidade</th>
                            <th className="p-4 font-semibold">Responsável</th>
                            <th className="p-4 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredControls.map(control => (
                            <tr key={control.id} className="border-t border-border-color hover:bg-surface/50">
                                <td className="p-4">{control.name}</td>
                                <td className="p-4">{control.category}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(control.status)}`}>{control.status}</span></td>
                                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCriticalityClass(control.criticality)}`}>{control.criticality}</span></td>
                                <td className="p-4">{control.owner}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(control)} className="text-text-secondary hover:text-primary"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(control.id)} className="text-text-secondary hover:text-danger"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <DataControlModal control={editingControl} onSave={handleSave} onClose={closeModal} />}
        </div>
    );
};

const DataControlModal = ({ control, onSave, onClose }) => {
    const [formData, setFormData] = useState(control || {
        name: '', description: '', category: '', relatedRegulation: '',
        status: DataControlStatus.Active, criticality: AssetCriticality.Medium, owner: ''
    });

    const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = e => { e.preventDefault(); onSave(formData); };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6">{control ? 'Editar Controle' : 'Adicionar Controle de Dados'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {control && (
                         <div>
                            <label className="block text-sm font-medium mb-1">ID do Controle</label>
                            <input type="number" name="id" value={formData.id} readOnly className="w-full bg-background/50 border border-border-color rounded-lg p-2 cursor-not-allowed" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descrição</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium mb-1">Categoria</label>
                             <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Regulamentação Relacionada</label>
                             <input type="text" name="relatedRegulation" value={formData.relatedRegulation} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                         <div>
                             <label className="block text-sm font-medium mb-1">Status</label>
                             <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                 {Object.values(DataControlStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Criticidade</label>
                            <select name="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                               {Object.values(AssetCriticality).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                             <label className="block text-sm font-medium mb-1">Responsável</label>
                             <input type="text" name="owner" value={formData.owner} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Settings Page ---
const SettingsPage = ({
  users, setUsers,
  appData, setAppData,
}) => {
    const [activeTab, setActiveTab] = useState('Usuários');
    
    // State for system settings tab
    const [settings, setSettings] = useState({
        notifications: {
            newRisk: true,
            statusChange: true,
            overdueTask: false,
        }
    });

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Usuários':
                return <UserManagementTab users={users} setUsers={setUsers} />;
            case 'Sistema':
                return <SystemSettingsTab settings={settings} setSettings={setSettings} />;
            case 'Dados':
                return <DataManagementTab appData={appData} setAppData={setAppData} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Configurações</h1>
            <div className="flex border-b border-border-color mb-6">
                <TabButton text="Usuários" icon={Users} active={activeTab === 'Usuários'} onClick={() => setActiveTab('Usuários')} />
                <TabButton text="Sistema" icon={Settings} active={activeTab === 'Sistema'} onClick={() => setActiveTab('Sistema')} />
                <TabButton text="Dados" icon={DatabaseZap} active={activeTab === 'Dados'} onClick={() => setActiveTab('Dados')} />
            </div>
            <div>{renderTabContent()}</div>
        </div>
    );
};

const TabButton = ({ text, icon: Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 py-2 px-4 -mb-px border-b-2 transition-colors ${
      active
        ? 'border-primary text-primary'
        : 'border-transparent text-text-secondary hover:text-text-primary'
    }`}
    >
        <Icon size={18} />
        <span className="font-semibold">{text}</span>
    </button>
);

const UserManagementTab = ({ users, setUsers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const openModal = (user = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (userData) => {
        if (editingUser) {
            setUsers(users.map(u => u.id === userData.id ? userData : u));
        } else {
            const newUser = { ...userData, id: Date.now() };
            setUsers([...users, newUser]);
        }
        closeModal();
    };

    const handleDelete = (userId) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            setUsers(users.filter(u => u.id !== userId));
        }
    };
    
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    <UserPlus size={18} />
                    Adicionar Usuário
                </button>
            </div>
            <UserTable users={users} onEdit={openModal} onDelete={handleDelete} />
            {isModalOpen && <UserModal user={editingUser} onSave={handleSave} onClose={closeModal} />}
        </div>
    );
};

const UserTable = ({ users, onEdit, onDelete }) => (
    <div className="bg-surface rounded-lg overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-surface/50">
                <tr>
                    <th className="p-4 font-semibold">Nome</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Função</th>
                    <th className="p-4 font-semibold">Ações</th>
                </tr>
            </thead>
            <tbody>
                {users.map(user => (
                    <tr key={user.id} className="border-t border-border-color hover:bg-surface/50">
                        <td className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center font-bold text-background text-sm">
                                {user.name.charAt(0)}
                            </div>
                            {user.name}
                        </td>
                        <td className="p-4 text-text-secondary">{user.email}</td>
                        <td className="p-4">{user.role}</td>
                        <td className="p-4">
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(user)} className="text-text-secondary hover:text-primary"><Edit size={18} /></button>
                                <button onClick={() => onDelete(user.id)} className="text-text-secondary hover:text-danger"><Trash2 size={18} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const UserModal = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState(user || { name: '', email: '', role: UserRole.Guest });
    
    const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = e => { e.preventDefault(); onSave(formData); };
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6">{user ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Função</label>
                         <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                            {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ToggleSwitch = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-text-primary">{label}</span>
        <button
            type="button"
            onClick={onChange}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                enabled ? 'bg-primary' : 'bg-background'
            }`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    </div>
);

const SystemSettingsTab = ({ settings, setSettings }) => {
    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications[key]
            }
        }));
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Card>
                <h3 className="text-lg font-semibold mb-4 border-b border-border-color pb-2">Notificações por Email</h3>
                <div className="space-y-4">
                    <ToggleSwitch label="Novo risco atribuído" enabled={settings.notifications.newRisk} onChange={() => handleToggle('newRisk')} />
                    <ToggleSwitch label="Mudança no status de um risco" enabled={settings.notifications.statusChange} onChange={() => handleToggle('statusChange')} />
                    <ToggleSwitch label="Tarefa de mitigação atrasada" enabled={settings.notifications.overdueTask} onChange={() => handleToggle('overdueTask')} />
                </div>
            </Card>
             <Card>
                <h3 className="text-lg font-semibold mb-4 border-b border-border-color pb-2">Integrações</h3>
                <div className="space-y-2">
                   <p className="text-sm text-text-secondary">Chave de API do Google Gemini</p>
                   <div className="flex items-center gap-2">
                       <input type="text" readOnly value="************" className="w-full bg-background/50 border border-border-color rounded-lg p-2 cursor-not-allowed font-mono text-sm" />
                       <span className="text-xs text-green-400 font-semibold">Configurada</span>
                   </div>
                   <p className="text-xs text-text-secondary mt-1">A chave é gerenciada por variáveis de ambiente e não pode ser alterada aqui.</p>
                </div>
            </Card>
        </div>
    );
};

const DataManagementTab = ({ appData, setAppData }) => {
    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(fieldName => 
                    JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)
                ).join(',')
            )
        ];
        
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        const confirmation = prompt('Esta ação é irreversível e irá restaurar todos os dados para o estado inicial. Digite "RESETAR" para confirmar.');
        if (confirmation === 'RESETAR') {
            setAppData.setRisks(initialRisks);
            setAppData.setAssets(initialAssets);
            setAppData.setDataControls(mockDataControls);
            setAppData.setComplianceControls(allControls);
            alert('Todos os dados foram resetados para o estado inicial.');
        } else {
            alert('Ação cancelada.');
        }
    };
    
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
             <Card>
                <h3 className="text-lg font-semibold mb-4 border-b border-border-color pb-2">Exportar Dados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => exportToCSV(appData.risks, 'export_riscos')} className="flex w-full items-center justify-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                        <FileDown size={18} /> Exportar Riscos (CSV)
                    </button>
                    <button onClick={() => exportToCSV(appData.assets, 'export_ativos')} className="flex w-full items-center justify-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                        <FileDown size={18} /> Exportar Ativos (CSV)
                    </button>
                    <button onClick={() => exportToCSV(appData.complianceControls, 'export_controles')} className="flex w-full items-center justify-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                        <FileDown size={18} /> Exportar Controles (CSV)
                    </button>
                    <button onClick={() => exportToCSV(appData.dataControls, 'export_controles_dados')} className="flex w-full items-center justify-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                        <FileDown size={18} /> Exportar Controles de Dados (CSV)
                    </button>
                </div>
            </Card>
            
            <Card className="border border-danger/50">
                 <h3 className="text-lg font-semibold mb-2 text-danger">Zona de Perigo</h3>
                 <p className="text-sm text-text-secondary mb-4">Ações nesta seção são permanentes e não podem ser desfeitas.</p>
                 <div className="flex justify-between items-center bg-background/50 p-4 rounded-lg">
                     <div>
                         <p className="font-semibold">Resetar Dados da Aplicação</p>
                         <p className="text-xs text-text-secondary">Restaura todos os riscos, ativos e controles para o estado inicial.</p>
                     </div>
                     <button onClick={handleReset} className="flex items-center gap-2 bg-danger hover:bg-danger/80 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        <RefreshCw size={18} /> Resetar Dados
                    </button>
                 </div>
            </Card>
        </div>
    );
};


// --- Main App Component ---

const App = () => {
    const [activePage, setActivePage] = useState('Riscos');
    const [risks, setRisks] = useState(initialRisks);
    const [assets, setAssets] = useState(initialAssets);
    const [dataControls, setDataControls] = useState(mockDataControls);
    const [complianceControls, setComplianceControls] = useState(allControls);
    const [users, setUsers] = useState(Object.values(mockUsers));


    const renderPage = () => {
        switch (activePage) {
            case 'Dashboard':
                return <DashboardPage risks={risks} controls={complianceControls} />;
            case 'Riscos':
                return <RisksPage risks={risks} setRisks={setRisks} />;
            case 'Ativos':
                return <AssetsPage assets={assets} setAssets={setAssets} />;
            case 'Conformidade':
                return <CompliancePage controls={complianceControls} setControls={setComplianceControls} />;
            case 'Controles de Dados':
                 return <DataControlsPage dataControls={dataControls} setDataControls={setDataControls} />;
            case 'Configurações':
                return <SettingsPage 
                            users={users} setUsers={setUsers}
                            appData={{ risks, assets, dataControls, complianceControls }}
                            setAppData={{ setRisks, setAssets, setDataControls, setComplianceControls }}
                        />;
            default:
                return <DashboardPage risks={risks} controls={complianceControls} />;
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-background">
            <Header />
            <div className="flex flex-grow overflow-hidden">
                <Sidebar activePage={activePage} setActivePage={setActivePage} />
                <main className="flex-grow bg-background overflow-auto">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);