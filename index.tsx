

import React, { useState, useMemo, createContext, useContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, LayoutDashboard, BarChart3, Users, Settings, Briefcase, GanttChartSquare, BrainCircuit, Zap, Plus, Search, DatabaseZap, AlertTriangle, ChevronDown, Upload, Download, Edit, Trash2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- AI Client Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- DUMMY DATA & TYPES ---

// Enums
enum UserRole { Admin = 'Admin', Manager = 'Manager', RiskAnalyst = 'Risk Analyst', Guest = 'Guest' }
enum RiskStatus { Open = 'Aberto', InProgress = 'Em Progresso', Mitigated = 'Mitigado', Accepted = 'Aceito' }
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
  title: string;
  description: string;
  probability: number;
  consequence: number;
  status: RiskStatus;
  owner: string;
}
interface Control {
    id: string;
    framework: FrameworkName;
    family: string;
    name: string;
    description: string;
    status?: ControlStatus;
    maturityScore?: number; // 1-5 for NIST
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
    { id: 1, title: 'Acesso não autorizado ao banco de dados de clientes', description: 'Um atacante externo pode explorar uma vulnerabilidade SQL Injection para ganhar acesso.', probability: 4, consequence: 5, status: RiskStatus.Open, owner: 'Equipe de Segurança' },
    { id: 2, title: 'Vazamento de dados por phishing', description: 'Colaboradores podem ser enganados por emails de phishing e divulgar credenciais.', probability: 3, consequence: 4, status: RiskStatus.InProgress, owner: 'Suporte de TI' },
    { id: 3, title: 'Indisponibilidade do serviço de e-commerce', description: 'Uma falha de hardware no servidor principal pode causar a interrupção das vendas online.', probability: 2, consequence: 5, status: RiskStatus.Mitigated, owner: 'Equipe de Infra' },
    { id: 4, title: 'Malware em estação de trabalho', description: 'Download de software malicioso por usuário.', probability: 3, consequence: 3, status: RiskStatus.Open, owner: 'Suporte de TI' },
    { id: 5, title: 'Configuração incorreta de serviço na nuvem', description: 'Bucket de armazenamento exposto publicamente.', probability: 2, consequence: 4, status: RiskStatus.Accepted, owner: 'Equipe de Cloud' },
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
    { id: 'GV.OC-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'A missão organizacional é compreendida e informa o gerenciamento de riscos de cibersegurança.', maturityScore: 4 },
    { id: 'GV.OC-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'As partes interessadas internas e externas são compreendidas, e suas necessidades e expectativas em relação ao gerenciamento de riscos de cibersegurança são compreendidas e consideradas.', maturityScore: 3 },
    { id: 'GV.OC-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'Requisitos legais, regulatórios e contratuais relativos à cibersegurança — incluindo obrigações de privacidade e liberdades civis — são compreendidos e gerenciados.', maturityScore: 4 },
    { id: 'GV.OC-04', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'Objetivos, capacidades e serviços críticos dos quais as partes interessadas externas dependem ou esperam da organização são compreendidos e comunicados.', maturityScore: 3 },
    { id: 'GV.OC-05', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'Resultados, capacidades e serviços dos quais a organização depende são compreendidos e comunicados.', maturityScore: 3 },
    { id: 'GV.RM-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Os objetivos de gerenciamento de risco são estabelecidos e acordados pelas partes interessadas da organização.', maturityScore: 4 },
    { id: 'GV.RM-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Declarações de apetite e tolerância ao risco são estabelecidas, comunicadas e mantidas.', maturityScore: 2 },
    { id: 'GV.RM-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Atividades e resultados de gerenciamento de riscos de cibersegurança são incluídos nos processos de gerenciamento de riscos empresariais.', maturityScore: 3 },
    { id: 'GV.RM-04', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'A direção estratégica que descreve as opções apropriadas de resposta ao risco é estabelecida e comunicada.', maturityScore: 3 },
    { id: 'GV.RM-05', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Linhas de comunicação em toda a organização são estabelecidas para riscos de cibersegurança, incluindo riscos de fornecedores e outros terceiros.', maturityScore: 4 },
    { id: 'GV.RM-06', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Um método padronizado para calcular, documentar, categorizar e priorizar riscos de cibersegurança é estabelecido e comunicado.', maturityScore: 2 },
    { id: 'GV.RM-07', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Oportunidades estratégicas (ou seja, riscos positivos) são caracterizadas e incluídas nas discussões organizacionais sobre riscos de cibersegurança.', maturityScore: 1 },
    { id: 'GV.RR-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Funções, Responsabilidades e Autoridades', description: 'A liderança organizacional é responsável e responsabilizável pelo risco de cibersegurança e promove uma cultura que é consciente do risco, ética e em contínua melhoria.', maturityScore: 4 },
    { id: 'GV.RR-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Funções, Responsabilidades e Autoridades', description: 'Funções, responsabilidades e autoridades relacionadas ao gerenciamento de riscos de cibersegurança são estabelecidas, comunicadas, compreendidas e aplicadas.', maturityScore: 3 },
    { id: 'GV.RR-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Funções, Responsabilidades e Autoridades', description: 'Recursos adequados são alocados de acordo com a estratégia de risco de cibersegurança, funções, responsabilidades e políticas.', maturityScore: 2 },
    { id: 'GV.RR-04', framework: FrameworkName.NIST, family: 'Governar', name: 'Funções, Responsabilidades e Autoridades', description: 'A cibersegurança é incluída nas práticas de recursos humanos.', maturityScore: 3 },
    { id: 'GV.PO-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Política', description: 'A política para gerenciar riscos de cibersegurança é estabelecida com base no contexto organizacional, estratégia de cibersegurança e prioridades, e é comunicada e aplicada.', maturityScore: 4 },
    { id: 'GV.PO-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Política', description: 'A política para gerenciar riscos de cibersegurança é revisada, atualizada, comunicada e aplicada para refletir mudanças nos requisitos, ameaças, tecnologia e missão organizacional.', maturityScore: 3 },
    { id: 'GV.OV-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Supervisão', description: 'Os resultados da estratégia de gerenciamento de riscos de cibersegurança são revisados para informar e ajustar a estratégia e a direção.', maturityScore: 2 },
    { id: 'GV.OV-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Supervisão', description: 'A estratégia de gerenciamento de riscos de cibersegurança é revisada e ajustada para garantir a cobertura dos requisitos e riscos organizacionais.', maturityScore: 3 },
    { id: 'GV.OV-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Supervisão', description: 'O desempenho do gerenciamento de riscos de cibersegurança organizacional é avaliado e revisado para os ajustes necessários.', maturityScore: 2 },
    { id: 'GV.SC-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Um programa, estratégia, objetivos, políticas e processos de gerenciamento de riscos da cadeia de suprimentos de cibersegurança são estabelecidos e acordados pelas partes interessadas da organização.', maturityScore: 3 },
    { id: 'GV.SC-02', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Funções e responsabilidades de cibersegurança para fornecedores, clientes e parceiros são estabelecidas, comunicadas e coordenadas interna e externamente.', maturityScore: 2 },
    { id: 'GV.SC-03', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'O gerenciamento de riscos da cadeia de suprimentos de cibersegurança é integrado à cibersegurança e ao gerenciamento de riscos empresariais, avaliação de riscos e processos de melhoria.', maturityScore: 2 },
    { id: 'GV.SC-04', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Os fornecedores são conhecidos e priorizados por criticidade.', maturityScore: 3 },
    { id: 'GV.SC-05', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Requisitos para abordar riscos de cibersegurança em cadeias de suprimentos são estabelecidos, priorizados e integrados em contratos e outros tipos de acordos com fornecedores e outros terceiros relevantes.', maturityScore: 1 },
    { id: 'GV.SC-06', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Planejamento e due diligence são realizados para reduzir riscos antes de entrar em relações formais com fornecedores ou outros terceiros.', maturityScore: 2 },
    { id: 'GV.SC-07', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Os riscos representados por um fornecedor, seus produtos e serviços e outros terceiros são compreendidos, registrados, priorizados, avaliados, respondidos e monitorados ao longo do relacionamento.', maturityScore: 3 },
    { id: 'GV.SC-08', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Fornecedores relevantes e outros terceiros são incluídos no planejamento de incidentes, resposta e atividades de recuperação.', maturityScore: 2 },
    { id: 'GV.SC-09', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'As práticas de segurança da cadeia de suprimentos são integradas aos programas de gerenciamento de riscos de cibersegurança e empresariais, e seu desempenho é monitorado ao longo do ciclo de vida do produto e serviço de tecnologia.', maturityScore: 1 },
    { id: 'GV.SC-10', framework: FrameworkName.NIST, family: 'Governar', name: 'Gerenciamento de Riscos da Cadeia de Suprimentos', description: 'Os planos de gerenciamento de riscos da cadeia de suprimentos de cibersegurança incluem provisões para atividades que ocorrem após a conclusão de uma parceria ou acordo de serviço.', maturityScore: 2 },
    // --- IDENTIFY (ID) ---
    { id: 'ID.AM-01', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Inventários de hardware gerenciados pela organização são mantidos.', maturityScore: 4 },
    { id: 'ID.AM-02', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Inventários de software, serviços e sistemas gerenciados pela organização são mantidos.', maturityScore: 3 },
    { id: 'ID.AM-03', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Representações da comunicação de rede autorizada da organização e dos fluxos de dados de rede internos e externos são mantidas.', maturityScore: 2 },
    { id: 'ID.AM-04', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Inventários de serviços fornecidos por fornecedores são mantidos.', maturityScore: 3 },
    { id: 'ID.AM-05', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Os ativos são priorizados com base na classificação, criticidade, recursos e impacto na missão.', maturityScore: 4 },
    { id: 'ID.AM-07', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Inventários de dados e metadados correspondentes para tipos de dados designados são mantidos.', maturityScore: 2 },
    { id: 'ID.AM-08', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Sistemas, hardware, software, serviços e dados são gerenciados ao longo de seus ciclos de vida.', maturityScore: 3 },
    { id: 'ID.RA-01', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Vulnerabilidades em ativos são identificadas, validadas e registradas.', maturityScore: 3 },
    { id: 'ID.RA-02', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Inteligência de ameaças cibernéticas é recebida de fóruns e fontes de compartilhamento de informações.', maturityScore: 2 },
    { id: 'ID.RA-03', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Ameaças internas e externas à organização são identificadas e registradas.', maturityScore: 3 },
    { id: 'ID.RA-04', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Impactos e probabilidades potenciais de ameaças que exploram vulnerabilidades são identificados e registrados.', maturityScore: 3 },
    { id: 'ID.RA-05', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Ameaças, vulnerabilidades, probabilidades e impactos são usados para entender o risco inerente e informar a priorização da resposta ao risco.', maturityScore: 4 },
    { id: 'ID.RA-06', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'As respostas ao risco são escolhidas, priorizadas, planejadas, rastreadas e comunicadas.', maturityScore: 3 },
    { id: 'ID.RA-07', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Mudanças e exceções são gerenciadas, avaliadas quanto ao impacto no risco, registradas e rastreadas.', maturityScore: 2 },
    { id: 'ID.RA-08', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Processos para receber, analisar e responder a divulgações de vulnerabilidades são estabelecidos.', maturityScore: 3 },
    { id: 'ID.RA-09', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'A autenticidade e integridade de hardware e software são avaliadas antes da aquisição e uso.', maturityScore: 1 },
    { id: 'ID.RA-10', framework: FrameworkName.NIST, family: 'Identificar', name: 'Avaliação de Risco', description: 'Fornecedores críticos são avaliados antes da aquisição.', maturityScore: 2 },
    { id: 'ID.IM-01', framework: FrameworkName.NIST, family: 'Identificar', name: 'Melhoria', description: 'Melhorias são identificadas a partir de avaliações.', maturityScore: 3 },
    { id: 'ID.IM-02', framework: FrameworkName.NIST, family: 'Identificar', name: 'Melhoria', description: 'Melhorias são identificadas a partir de testes e exercícios de segurança, incluindo aqueles feitos em coordenação com fornecedores e terceiros relevantes.', maturityScore: 2 },
    { id: 'ID.IM-03', framework: FrameworkName.NIST, family: 'Identificar', name: 'Melhoria', description: 'Melhorias são identificadas a partir da execução de processos operacionais, procedimentos e atividades.', maturityScore: 3 },
    { id: 'ID.IM-04', framework: FrameworkName.NIST, family: 'Identificar', name: 'Melhoria', description: 'Planos de resposta a incidentes e outros planos de cibersegurança que afetam as operações são estabelecidos, comunicados, mantidos e aprimorados.', maturityScore: 4 },
    // --- PROTECT (PR) ---
    { id: 'PR.AA-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'Identidades e credenciais para usuários, serviços e hardware autorizados são gerenciadas pela organização.', maturityScore: 4 },
    { id: 'PR.AA-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'Identidades são comprovadas e vinculadas a credenciais com base no contexto das interações.', maturityScore: 3 },
    { id: 'PR.AA-03', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'Usuários, serviços e hardware são autenticados.', maturityScore: 4 },
    { id: 'PR.AA-04', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'As declarações de identidade são protegidas, transmitidas e verificadas.', maturityScore: 3 },
    { id: 'PR.AA-05', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'Permissões de acesso, direitos e autorizações são definidos em uma política, gerenciados, aplicados e revisados, e incorporam os princípios de menor privilégio e separação de funções.', maturityScore: 3 },
    { id: 'PR.AA-06', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'O acesso físico aos ativos é gerenciado, monitorado e aplicado de acordo com o risco avaliado.', maturityScore: 4 },
    { id: 'PR.AT-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Conscientização e Treinamento', description: 'O pessoal recebe conscientização e treinamento para que possua o conhecimento e as habilidades para realizar tarefas gerais com os riscos de cibersegurança em mente.', maturityScore: 3 },
    { id: 'PR.AT-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Conscientização e Treinamento', description: 'Indivíduos em funções especializadas recebem conscientização e treinamento para que possuam o conhecimento e as habilidades para realizar tarefas relevantes com os riscos de cibersegurança em mente.', maturityScore: 3 },
    { id: 'PR.DS-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança de Dados', description: 'A confidencialidade, integridade e disponibilidade dos dados em repouso são protegidas.', maturityScore: 4 },
    { id: 'PR.DS-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança de Dados', description: 'A confidencialidade, integridade e disponibilidade dos dados em trânsito são protegidas.', maturityScore: 4 },
    { id: 'PR.DS-10', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança de Dados', description: 'A confidencialidade, integridade e disponibilidade dos dados em uso são protegidas.', maturityScore: 2 },
    { id: 'PR.DS-11', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança de Dados', description: 'Backups de dados são criados, protegidos, mantidos e testados.', maturityScore: 3 },
    { id: 'PR.PS-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Práticas de gerenciamento de configuração são estabelecidas e aplicadas.', maturityScore: 3 },
    { id: 'PR.PS-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Software é mantido, substituído e removido de acordo com o risco.', maturityScore: 3 },
    { id: 'PR.PS-03', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Hardware é mantido, substituído e removido de acordo com o risco.', maturityScore: 2 },
    { id: 'PR.PS-04', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Registros de log são gerados e disponibilizados para monitoramento contínuo.', maturityScore: 4 },
    { id: 'PR.PS-05', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'A instalação e execução de software não autorizado são impedidas.', maturityScore: 3 },
    { id: 'PR.PS-06', framework: FrameworkName.NIST, family: 'Proteger', name: 'Segurança da Plataforma', description: 'Práticas de desenvolvimento de software seguro são integradas, e seu desempenho é monitorado ao longo do ciclo de vida de desenvolvimento de software.', maturityScore: 2 },
    { id: 'PR.IR-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Resiliência da Infraestrutura de Tecnologia', description: 'Redes e ambientes são protegidos contra acesso e uso lógico não autorizado.', maturityScore: 4 },
    { id: 'PR.IR-02', framework: FrameworkName.NIST, family: 'Proteger', name: 'Resiliência da Infraestrutura de Tecnologia', description: 'Os ativos de tecnologia da organização são protegidos contra ameaças ambientais.', maturityScore: 3 },
    { id: 'PR.IR-03', framework: FrameworkName.NIST, family: 'Proteger', name: 'Resiliência da Infraestrutura de Tecnologia', description: 'Mecanismos são implementados para alcançar os requisitos de resiliência em situações normais e adversas.', maturityScore: 2 },
    { id: 'PR.IR-04', framework: FrameworkName.NIST, family: 'Proteger', name: 'Resiliência da Infraestrutura de Tecnologia', description: 'Capacidade de recurso adequada para garantir a disponibilidade é mantida.', maturityScore: 3 },
    // --- DETECT (DE) ---
    { id: 'DE.CM-01', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'Redes e serviços de rede são monitorados para encontrar eventos potencialmente adversos.', maturityScore: 3 },
    { id: 'DE.CM-02', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'O ambiente físico é monitorado para encontrar eventos potencialmente adversos.', maturityScore: 4 },
    { id: 'DE.CM-03', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'A atividade do pessoal e o uso da tecnologia são monitorados para encontrar eventos potencialmente adversos.', maturityScore: 2 },
    { id: 'DE.CM-06', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'As atividades e serviços de provedores de serviços externos são monitorados para encontrar eventos potencialmente adversos.', maturityScore: 1 },
    { id: 'DE.CM-09', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'Hardware e software de computação, ambientes de tempo de execução e seus dados são monitorados para encontrar eventos potencialmente adversos.', maturityScore: 3 },
    { id: 'DE.AE-02', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'Eventos potencialmente adversos são analisados para entender melhor as atividades associadas.', maturityScore: 3 },
    { id: 'DE.AE-03', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'A informação é correlacionada de múltiplas fontes.', maturityScore: 2 },
    { id: 'DE.AE-04', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'O impacto e o escopo estimados de eventos adversos são compreendidos.', maturityScore: 3 },
    { id: 'DE.AE-06', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'Informações sobre eventos adversos são fornecidas à equipe e ferramentas autorizadas.', maturityScore: 4 },
    { id: 'DE.AE-07', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'Inteligência de ameaças cibernéticas e outras informações contextuais são integradas na análise.', maturityScore: 2 },
    { id: 'DE.AE-08', framework: FrameworkName.NIST, family: 'Detectar', name: 'Análise de Eventos Adversos', description: 'Incidentes são declarados quando eventos adversos atendem aos critérios de incidente definidos.', maturityScore: 3 },
    // --- RESPOND (RS) ---
    { id: 'RS.MA-01', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'O plano de resposta a incidentes é executado em coordenação com terceiros relevantes assim que um incidente é declarado.', maturityScore: 4 },
    { id: 'RS.MA-02', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'Relatórios de incidentes são triados e validados.', maturityScore: 3 },
    { id: 'RS.MA-03', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'Incidentes são categorizados e priorizados.', maturityScore: 3 },
    { id: 'RS.MA-04', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'Incidentes são escalados ou elevados conforme necessário.', maturityScore: 2 },
    { id: 'RS.MA-05', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'Os critérios para iniciar a recuperação de incidentes são aplicados.', maturityScore: 3 },
    { id: 'RS.AN-03', framework: FrameworkName.NIST, family: 'Responder', name: 'Análise de Incidentes', description: 'A análise é realizada para estabelecer o que ocorreu durante um incidente e a causa raiz do incidente.', maturityScore: 3 },
    { id: 'RS.AN-06', framework: FrameworkName.NIST, family: 'Responder', name: 'Análise de Incidentes', description: 'Ações realizadas durante uma investigação são registradas, e a integridade e proveniência dos registros são preservadas.', maturityScore: 2 },
    { id: 'RS.AN-07', framework: FrameworkName.NIST, family: 'Responder', name: 'Análise de Incidentes', description: 'Dados e metadados de incidentes são coletados, e sua integridade e proveniência são preservadas.', maturityScore: 3 },
    { id: 'RS.AN-08', framework: FrameworkName.NIST, family: 'Responder', name: 'Análise de Incidentes', description: 'A magnitude de um incidente é estimada e validada.', maturityScore: 3 },
    { id: 'RS.CO-02', framework: FrameworkName.NIST, family: 'Responder', name: 'Relato e Comunicação de Resposta a Incidentes', description: 'Partes interessadas internas e externas são notificadas sobre incidentes.', maturityScore: 4 },
    { id: 'RS.CO-03', framework: FrameworkName.NIST, family: 'Responder', name: 'Relato e Comunicação de Resposta a Incidentes', description: 'A informação é compartilhada com as partes interessadas internas e externas designadas.', maturityScore: 3 },
    { id: 'RS.MI-01', framework: FrameworkName.NIST, family: 'Responder', name: 'Mitigação de Incidentes', description: 'Incidentes são contidos.', maturityScore: 4 },
    { id: 'RS.MI-02', framework: FrameworkName.NIST, family: 'Responder', name: 'Mitigação de Incidentes', description: 'Incidentes são erradicados.', maturityScore: 3 },
    // --- RECOVER (RC) ---
    { id: 'RC.RP-01', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'A parte de recuperação do plano de resposta a incidentes é executada assim que iniciada a partir do processo de resposta a incidentes.', maturityScore: 4 },
    { id: 'RC.RP-02', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'Ações de recuperação são selecionadas, dimensionadas, priorizadas e executadas.', maturityScore: 3 },
    { id: 'RC.RP-03', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'A integridade dos backups e outros ativos de restauração é verificada antes de usá-los para restauração.', maturityScore: 4 },
    { id: 'RC.RP-04', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'Funções de missão críticas e gerenciamento de riscos de cibersegurança são considerados para estabelecer normas operacionais pós-incidente.', maturityScore: 2 },
    { id: 'RC.RP-05', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'A integridade dos ativos restaurados é verificada, sistemas e serviços são restaurados e o status operacional normal é confirmado.', maturityScore: 3 },
    { id: 'RC.RP-06', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'O fim da recuperação do incidente é declarado com base em critérios, e a documentação relacionada ao incidente é concluída.', maturityScore: 3 },
    { id: 'RC.CO-03', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Comunicação de Recuperação de Incidentes', description: 'Atividades de recuperação e progresso na restauração de capacidades operacionais são comunicadas às partes interessadas internas e externas designadas.', maturityScore: 4 },
    { id: 'RC.CO-04', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Comunicação de Recuperação de Incidentes', description: 'Atualizações públicas sobre a recuperação de incidentes são compartilhadas usando métodos e mensagens aprovados.', maturityScore: 2 },
];
const cisControls: Control[] = [
    { id: 'CIS-01', framework: FrameworkName.CIS, family: 'CIS Controls', name: 'Inventário e Controle de Ativos Empresariais', description: 'Gerencie ativamente (inventário, rastreamento, correção) todos os ativos empresariais conectados à infraestrutura fisicamente, virtualmente, remotamente e na nuvem.', status: ControlStatus.FullyImplemented },
    { id: 'CIS-02', framework: FrameworkName.CIS, family: 'CIS Controls', name: 'Inventário e Controle de Ativos de Software', description: 'Gerencie ativamente (inventário, rastreamento, correção) todos os softwares na rede para que apenas softwares autorizados sejam instalados e possam ser executados.', status: ControlStatus.PartiallyImplemented },
    { id: 'CIS-03', framework: FrameworkName.CIS, family: 'CIS Controls', name: 'Proteção de Dados', description: 'Desenvolva processos e controles técnicos para identificar, classificar, manusear, reter e descartar dados de forma segura.', status: ControlStatus.InProgress },
    { id: 'CIS-04', framework: FrameworkName.CIS, family: 'CIS Controls', name: 'Configuração Segura de Ativos e Softwares Empresariais', description: 'Estabeleça e mantenha a configuração segura de ativos empresariais e software.', status: ControlStatus.FullyImplemented },
    { id: 'CIS-05', framework: FrameworkName.CIS, family: 'CIS Controls', name: 'Gerenciamento de Contas', description: 'Use processos e ferramentas para atribuir e gerenciar a autorização para credenciais para contas de usuário.', status: ControlStatus.PartiallyImplemented },
    { id: 'CIS-06', framework: FrameworkName.CIS, family: 'CIS Controls', name: 'Gerenciamento de Controle de Acesso', description: 'Use processos e ferramentas para criar, atribuir, gerenciar e revogar o acesso a ativos empresariais.', status: ControlStatus.InProgress },
    { id: 'CIS-07', framework: FrameworkName.CIS, family: 'CIS Controls', name: 'Gerenciamento Contínuo de Vulnerabilidades', description: 'Desenvolva um plano para avaliar e rastrear continuamente as vulnerabilidades em todos os ativos empresariais.', status: ControlStatus.NotImplemented },
];
const lgpdControls: Control[] = [
    { id: 'LGPD-Art.6', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Finalidade, Adequação, Necessidade', description: 'O tratamento de dados pessoais deve ser realizado para propósitos legítimos, específicos, explícitos e informados ao titular.', status: ControlStatus.FullyImplemented },
    { id: 'LGPD-Art.7', framework: FrameworkName.LGPD, family: 'Bases Legais', name: 'Consentimento do Titular', description: 'O tratamento de dados pessoais somente poderá ser realizado mediante o fornecimento de consentimento pelo titular.', status: ControlStatus.InProgress },
    { id: 'LGPD-Art.18', framework: FrameworkName.LGPD, family: 'Direitos do Titular', name: 'Confirmação e Acesso', description: 'O titular dos dados tem direito a obter do controlador, em relação aos dados do titular por ele tratados, a qualquer momento e mediante requisição, a confirmação da existência do tratamento e o acesso aos dados.', status: ControlStatus.PartiallyImplemented },
    { id: 'LGPD-Art.37', framework: FrameworkName.LGPD, family: 'Governança', name: 'Registro das Operações', description: 'O controlador e o operador devem manter registro das operações de tratamento de dados pessoais que realizarem.', status: ControlStatus.NotImplemented },
    { id: 'LGPD-Art.46', framework: FrameworkName.LGPD, family: 'Segurança', name: 'Medidas de Segurança', description: 'Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.', status: ControlStatus.FullyImplemented },
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

const Card = ({ children, className = '' }) => (
    <div className={`bg-surface rounded-lg p-6 ${className}`}>
        {children}
    </div>
);

const RiskHeatmap = ({ risks }) => {
    const heatmapData = useMemo(() => {
        const grid = Array(5).fill(null).map(() => Array(5).fill(null).map(() => []));
        risks.forEach(risk => {
            grid[5 - risk.consequence][risk.probability - 1].push(risk);
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
                    <span className="text-sm font-medium text-text-secondary">Consequência</span>
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

const DashboardPage = ({ risks }) => {
    const riskStatusCounts = useMemo(() => {
        return risks.reduce((acc, risk) => {
            acc[risk.status] = (acc[risk.status] || 0) + 1;
            return acc;
        }, {});
    }, [risks]);

    const nistMaturity = useMemo(() => {
        const nistSpecificControls = nistControls.filter(c => c.maturityScore);
        const totalScore = nistSpecificControls.reduce((sum, control) => sum + control.maturityScore, 0);
        return nistSpecificControls.length > 0 ? totalScore / nistSpecificControls.length : 0;
    }, []);

    const complianceRate = useMemo(() => {
        const otherControls = [...cisControls, ...lgpdControls];
        const implemented = otherControls.filter(c => c.status === ControlStatus.FullyImplemented).length;
        return otherControls.length > 0 ? (implemented / otherControls.length) * 100 : 0;
    }, []);

    const getMaturityLabel = (score) => {
        if (score < 1.5) return "Inicial";
        if (score < 2.5) return "Em Desenvolvimento";
        if (score < 3.5) return "Definido";
        if (score < 4.5) return "Gerenciado";
        return "Otimizado";
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quick Stats */}
            <Card className="lg:col-span-1 bg-gradient-to-br from-red-500 to-danger"><h3 className="text-lg font-semibold">Riscos Abertos</h3><p className="text-4xl font-bold">{riskStatusCounts[RiskStatus.Open] || 0}</p></Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-yellow-500 to-orange-500"><h3 className="text-lg font-semibold">Em Progresso</h3><p className="text-4xl font-bold">{riskStatusCounts[RiskStatus.InProgress] || 0}</p></Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-green-500 to-secondary"><h3 className="text-lg font-semibold">Riscos Mitigados</h3><p className="text-4xl font-bold">{riskStatusCounts[RiskStatus.Mitigated] || 0}</p></Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-blue-500 to-primary"><h3 className="text-lg font-semibold">Riscos Aceitos</h3><p className="text-4xl font-bold">{riskStatusCounts[RiskStatus.Accepted] || 0}</p></Card>

            {/* Main Dashboard Area */}
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <RiskHeatmap risks={risks} />
                 <Card>
                    <h2 className="text-lg font-semibold mb-4">Status dos Riscos</h2>
                    {/* Placeholder for a chart */}
                    <div className="flex items-center justify-center h-full text-text-secondary">
                        <BarChart3 className="w-16 h-16" />
                        <p className="ml-4">Gráfico de Status em breve</p>
                    </div>
                </Card>
                 <Card>
                    <h2 className="text-lg font-semibold mb-4 text-center">Maturidade (NIST)</h2>
                    <div className="flex justify-center items-center h-full">
                       <Gauge value={nistMaturity} label={getMaturityLabel(nistMaturity)} colorClass="text-primary" maxValue={5} />
                    </div>
                </Card>
                <Card>
                    <h2 className="text-lg font-semibold mb-4 text-center">Conformidade (CIS & LGPD)</h2>
                    <div className="flex justify-center items-center h-full">
                        <Gauge value={complianceRate} label="Implementado %" colorClass="text-secondary" maxValue={100} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

const RisksPage = () => <div>Riscos Page Placeholder</div>;
const CompliancePage = () => <div>Conformidade Page Placeholder</div>;
const SettingsPage = () => <div>Configurações Page Placeholder</div>;

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
                // FIX: Added type guard to ensure `text` is a string before calling .split()
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
        // Reset file input
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
            // FIX: Explicitly convert ID to a number to prevent type mismatches.
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


// --- Main App Component ---

const App = () => {
    const [activePage, setActivePage] = useState('Dashboard');
    const [risks, setRisks] = useState(initialRisks);
    const [assets, setAssets] = useState(initialAssets);
    const [dataControls, setDataControls] = useState(mockDataControls);


    const renderPage = () => {
        switch (activePage) {
            case 'Dashboard':
                return <DashboardPage risks={risks} />;
            case 'Riscos':
                return <RisksPage />;
            case 'Ativos':
                return <AssetsPage assets={assets} setAssets={setAssets} />;
            case 'Conformidade':
                return <CompliancePage />;
            case 'Controles de Dados':
                 return <DataControlsPage dataControls={dataControls} setDataControls={setDataControls} />;
            case 'Configurações':
                return <SettingsPage />;
            default:
                return <DashboardPage risks={risks} />;
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