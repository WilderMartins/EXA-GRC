import React, { useState, useMemo, createContext, useContext, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, LayoutDashboard, BarChart3, Users, Settings, Briefcase, GanttChartSquare, BrainCircuit, Zap, Plus, Search, DatabaseZap, AlertTriangle, ChevronDown, Upload, Download, Edit, Trash2, UserPlus, Bell, RefreshCw, FileDown, Bot, Clock, Users2, UserCheck, Mail, ExternalLink } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- AI Client Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- DUMMY DATA & TYPES ---

// Enums
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
enum ControlStatus { NotImplemented = 'Não Implementado', PartiallyImplemented = 'Parcialmente Implementado', FullyImplemented = 'Totalmente Implementado', InProgress = 'Em Progresso' }
enum DataControlStatus { Active = 'Ativo', Inactive = 'Inativo', InReview = 'Em Revisão' }
enum AssetCriticality { Low = 'Baixa', Medium = 'Média', High = 'Alta', Critical = 'Crítica' }
enum AssetType { Server = 'Servidor', WebApp = 'Aplicação Web', Database = 'Banco de Dados', IPAddress = 'Endereço IP', Domain = 'Domínio', MobileApp = 'Aplicativo Mobile', Other = 'Outro' }
enum ObsolescenceStatus { Supported = 'Suportado', NearingEOL = 'Próximo do Fim', Obsolete = 'Obsoleto' }
enum ObsolescenceAssetType { Software = 'Software', Hardware = 'Hardware', OS = 'Sistema Operacional', Library = 'Biblioteca' }
enum AlertTriggerEvent {
    RISK_CRITICAL = "Risco se torna Crítico",
    RISK_HIGH = "Risco se torna Alto",
    RISK_DUE_DATE_LATE = "Prazo do Risco está Atrasado",
    OBSOLESCENCE_NEARING_EOL = "Item de Obsolescência Próximo do Fim",
    OBSOLESCENCE_OBSOLETE = "Item de Obsolescência se torna Obsoleto",
}

// Interfaces
interface Profile { id: number; name: string; description: string; permissions: string[]; }
interface Group { id: number; name: string; description: string; memberIds: number[]; }
interface User { id: number; name: string; email: string; profileId: number; avatarUrl?: string; }
interface Risk {
  id: number;
  creationDate: string;
  title: string;
  description: string;
  probability: number;
  impact: number;
  status: RiskStatus;
  owner: string; 
  dueDate: string; 
  type: RiskType; 
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
    processScore?: number;
    practiceScore?: number;
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
interface ObsolescenceItem {
    id: number;
    assetName: string;
    assetType: ObsolescenceAssetType;
    vendor: string;
    version: string;
    endOfLifeDate: string;
    endOfSupportDate: string;
    impactDescription: string;
    recommendedAction: string;
    owner: string;
}
interface AlertRule {
  id: number;
  name: string;
  isActive: boolean;
  triggerEvent: AlertTriggerEvent;
  notifications: {
    inApp: boolean;
    email: boolean;
  };
  recipients: {
    userIds: number[];
    groupIds: number[];
  };
}


// Mock Data
const initialProfiles: Profile[] = [
    { id: 1, name: 'Admin', description: 'Acesso total ao sistema.', permissions: ['*:*'] },
    { id: 2, name: 'Risk Analyst', description: 'Pode visualizar e editar riscos e ativos.', permissions: ['risk:read', 'risk:edit', 'asset:read'] },
    { id: 3, name: 'Manager', description: 'Acesso de visualização a dashboards e relatórios.', permissions: ['dashboard:read', 'risk:read'] },
    { id: 4, name: 'Guest', description: 'Acesso somente leitura limitado.', permissions: ['dashboard:read'] },
];

const initialUsers: User[] = [
    { id: 1, name: 'Admin User', email: 'admin@exa.com.br', profileId: 1 },
    { id: 2, name: 'Analyst User', email: 'analyst@exa.com.br', profileId: 2 },
    { id: 3, name: 'Manager User', email: 'manager@exa.com.br', profileId: 3 },
    { id: 4, name: 'Guest User', email: 'guest@exa.com.br', profileId: 4 },
];

const initialGroups: Group[] = [
    { id: 1, name: 'Equipe de Segurança da Informação', description: 'Responsável pela gestão de riscos de SI.', memberIds: [1, 2] },
    { id: 2, name: 'Gestores de TI', description: 'Responsáveis pela aprovação de mudanças e orçamentos.', memberIds: [3] },
];

const initialAlertRules: AlertRule[] = [
    {
        id: 1,
        name: "Alerta de Risco Crítico para Equipe de SI",
        isActive: true,
        triggerEvent: AlertTriggerEvent.RISK_CRITICAL,
        notifications: { inApp: true, email: true },
        recipients: { userIds: [], groupIds: [1] } // Group 1 is 'Equipe de Segurança da Informação'
    },
    {
        id: 2,
        name: "Notificar Gestores de TI sobre Obsolescência",
        isActive: false,
        triggerEvent: AlertTriggerEvent.OBSOLESCENCE_NEARING_EOL,
        notifications: { inApp: true, email: false },
        recipients: { userIds: [], groupIds: [2] } // Group 2 is 'Gestores de TI'
    }
];

const initialRisks: Risk[] = [
    { id: 1, creationDate: '2024-05-10T10:00:00Z', title: 'Acesso não autorizado ao banco de dados', description: 'Um atacante externo pode explorar uma vulnerabilidade SQL Injection para ganhar acesso.', probability: 4, impact: 5, status: RiskStatus.Open, owner: 'Equipe de Segurança', dueDate: '2024-08-30', type: RiskType.Security, sla: 30, planResponsible: 'João Silva', technicalResponsible: 'Maria Souza', actionPlan: 'Realizar pentest na aplicação e corrigir vulnerabilidades encontradas.', completionDate: '', },
    { id: 2, creationDate: '2024-06-20T14:30:00Z', title: 'Vazamento de dados por phishing', description: 'Colaboradores podem ser enganados por emails de phishing e divulgar credenciais.', probability: 3, impact: 4, status: RiskStatus.InProgress, owner: 'Suporte de TI', dueDate: '2024-07-15', type: RiskType.Security, sla: 60, planResponsible: 'Ana Costa', technicalResponsible: 'Carlos Lima', actionPlan: 'Implementar campanha de conscientização e treinamento anti-phishing.', completionDate: '', },
    { id: 3, creationDate: '2023-11-01T09:00:00Z', title: 'Indisponibilidade do e-commerce', description: 'Uma falha de hardware no servidor principal pode causar a interrupção das vendas online.', probability: 2, impact: 5, status: RiskStatus.Mitigated, owner: 'Equipe de Infra', dueDate: '2024-01-15', type: RiskType.Operational, sla: 15, planResponsible: 'Pedro Martins', technicalResponsible: 'Pedro Martins', actionPlan: 'Configurar cluster de alta disponibilidade para os servidores web.', completionDate: '2024-01-10', },
];

const mockDataControls: DataControl[] = [
    { id: 1, name: 'Política de Retenção de Dados', description: 'Define por quanto tempo os dados pessoais são mantidos.', category: 'Políticas de Dados', relatedRegulation: 'LGPD Art. 15', status: DataControlStatus.Active, criticality: AssetCriticality.High, owner: 'DPO' },
    { id: 2, name: 'Processo de Requisição de Titular', description: 'Procedimento para atender às solicitações de direitos dos titulares de dados.', category: 'Direitos dos Titulares', relatedRegulation: 'LGPD Art. 18', status: DataControlStatus.Active, criticality: AssetCriticality.Medium, owner: 'Equipe de Privacidade' },
];

const initialAssets: Asset[] = [
    { id: 1, name: 'Servidor de Autenticação (auth.exa.com.br)', type: AssetType.Server, criticality: AssetCriticality.Critical, owner: 'Equipe de Infra' },
    { id: 2, name: 'API de Pagamentos', type: AssetType.WebApp, criticality: AssetCriticality.Critical, owner: 'Equipe de Dev' },
    { id: 3, name: 'DB de Clientes (prd-customer-db-01)', type: AssetType.Database, criticality: AssetCriticality.High, owner: 'Equipe de DBA' },
];

const initialObsolescenceItems: ObsolescenceItem[] = [
    { id: 1, assetName: 'Windows Server 2012 R2', assetType: ObsolescenceAssetType.OS, vendor: 'Microsoft', version: '6.3.9600', endOfLifeDate: '2018-10-09', endOfSupportDate: '2023-10-10', impactDescription: 'Sem atualizações de segurança, alto risco de exploração por vulnerabilidades conhecidas. Incompatibilidade com softwares modernos.', recommendedAction: 'Migrar para Windows Server 2022.', owner: 'Equipe de Infra' },
    { id: 2, assetName: 'Python', assetType: ObsolescenceAssetType.Software, vendor: 'Python Software Foundation', version: '2.7', endOfLifeDate: '2020-01-01', endOfSupportDate: '2020-01-01', impactDescription: 'A biblioteca não recebe mais atualizações, tornando-a vulnerável. A maioria das novas bibliotecas não é compatível.', recommendedAction: 'Refatorar código para Python 3.9+.', owner: 'Equipe de Dev' },
    { id: 3, assetName: 'Cisco ASA 5510', assetType: ObsolescenceAssetType.Hardware, vendor: 'Cisco', version: 'N/A', endOfLifeDate: '2013-09-16', endOfSupportDate: '2018-09-17', impactDescription: 'Hardware antigo com baixo desempenho e sem suporte do fabricante para falhas ou novas ameaças.', recommendedAction: 'Substituir por firewall de nova geração.', owner: 'Equipe de Redes' },
    { id: 4, assetName: 'AngularJS', assetType: ObsolescenceAssetType.Library, vendor: 'Google', version: '1.x', endOfLifeDate: '2021-12-31', endOfSupportDate: '2021-12-31', impactDescription: 'Framework frontend sem suporte, vulnerável a XSS e outros ataques web.', recommendedAction: 'Migrar aplicação para versão mais recente do Angular ou outro framework.', owner: 'Equipe Frontend' },
];

// --- COMPREHENSIVE CONTROLS DATABASE (MINIFIED) ---
const allControls: Control[] = [
    { id: 'GV.OC-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Contexto Organizacional', description: 'A missão organizacional é compreendida e informa o gerenciamento de riscos de cibersegurança.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'GV.RM-01', framework: FrameworkName.NIST, family: 'Governar', name: 'Estratégia de Gerenciamento de Risco', description: 'Os objetivos de gerenciamento de risco são estabelecidos e acordados pelas partes interessadas da organização.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'ID.AM-01', framework: FrameworkName.NIST, family: 'Identificar', name: 'Gerenciamento de Ativos', description: 'Inventários de hardware gerenciados pela organização são mantidos.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'PR.AA-01', framework: FrameworkName.NIST, family: 'Proteger', name: 'Gerenciamento de Identidade, Autenticação e Controle de Acesso', description: 'Identidades e credenciais para usuários, serviços e hardware autorizados são gerenciadas pela organização.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'DE.CM-01', framework: FrameworkName.NIST, family: 'Detectar', name: 'Monitoramento Contínuo', description: 'Redes e serviços de rede são monitorados para encontrar eventos potencialmente adversos.', status: ControlStatus.FullyImplemented, processScore: 3, practiceScore: 3 },
    { id: 'RS.MA-01', framework: FrameworkName.NIST, family: 'Responder', name: 'Gerenciamento de Incidentes', description: 'O plano de resposta a incidentes é executado em coordenação com terceiros relevantes assim que um incidente é declarado.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'RC.RP-01', framework: FrameworkName.NIST, family: 'Recuperar', name: 'Execução do Plano de Recuperação de Incidentes', description: 'A parte de recuperação do plano de resposta a incidentes é executada assim que iniciada a partir do processo de resposta a incidentes.', status: ControlStatus.FullyImplemented, processScore: 4, practiceScore: 4 },
    { id: 'CIS-1.1', framework: FrameworkName.CIS, family: 'Controle 1', name: 'Estabelecer e Manter um Inventário Detalhado de Ativos Corporativos', description: 'Estabelecer e manter um inventário preciso, detalhado e atualizado de todos os ativos corporativos.', status: ControlStatus.PartiallyImplemented },
    { id: 'CIS-3.1', framework: FrameworkName.CIS, family: 'Controle 3', name: 'Estabelecer e Manter um Processo de Gerenciamento de Dados', description: 'Estabelecer e manter um processo documentado de gerenciamento de dados.', status: ControlStatus.InProgress },
    { id: 'CIS-7.1', framework: FrameworkName.CIS, family: 'Controle 7', name: 'Estabelecer e Manter um Processo de Gerenciamento de Vulnerabilidades', description: 'Estabelecer e manter um processo documentado de gerenciamento de vulnerabilidades para ativos corporativos.', status: ControlStatus.FullyImplemented },
    { id: 'LGPD-Art.6-VII', framework: FrameworkName.LGPD, family: 'Princípios', name: 'Segurança', description: 'Utilizar medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados.', status: ControlStatus.FullyImplemented },
    { id: 'LGPD-Art.46', framework: FrameworkName.LGPD, family: 'Segurança', name: 'Medidas de Segurança', description: 'Adotar medidas de segurança, técnicas e administrativas para proteger os dados pessoais.', status: ControlStatus.PartiallyImplemented },
];


// --- CONTEXT for global state ---
const AppContext = createContext(null);


// --- UI Components ---

const Header = ({ user }) => (
    <header className="bg-surface p-4 border-b border-border-color flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
                <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-text-primary">EXA GRC</h1>
                <p className="text-xs text-text-secondary">Plataforma Integrada de Gestão de Riscos e Conformidade</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-xs text-text-secondary">Bem-vindo, {user.name}</span>
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold text-background">
                {user.name.charAt(0)}
            </div>
        </div>
    </header>
);

const NavItem = ({ icon: Icon, text, active, onClick }) => (
    <li
        className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors text-sm ${
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
                <NavItem icon={Clock} text="Obsolescência" active={activePage === 'Obsolescência'} onClick={() => setActivePage('Obsolescência')} />
                <NavItem icon={Shield} text="Conformidade" active={activePage === 'Conformidade'} onClick={() => setActivePage('Conformidade')} />
                <NavItem icon={DatabaseZap} text="Controles de Dados" active={activePage === 'Controles de Dados'} onClick={() => setActivePage('Controles de Dados')} />
                <NavItem icon={Bot} text="Análise de IA" active={activePage === 'Análise de IA'} onClick={() => setActivePage('Análise de IA')} />
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
            <h2 className="text-base font-semibold mb-4">Heatmap de Riscos</h2>
            <div className="flex">
                <div className="flex items-center justify-center transform -rotate-90 -translate-x-12">
                    <span className="text-xs font-medium text-text-secondary">Impacto</span>
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
                    <div className="col-span-5 text-center text-xs font-medium text-text-secondary mt-2">
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
            <h2 className="text-base font-semibold mb-4">Resumo de Conformidade por Framework</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-surface/50">
                        <tr>
                            <th className="p-4 font-semibold text-sm">Framework</th>
                            <th className="p-4 font-semibold text-center text-green-400 text-sm">Implementados</th>
                            <th className="p-4 font-semibold text-center text-yellow-400 text-sm">Parcialmente Imp.</th>
                            <th className="p-4 font-semibold text-center text-red-400 text-sm">Não Implementados</th>
                            <th className="p-4 font-semibold text-center text-sm">Total de Controles</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(summary).map(([framework, data]: [string, any]) => (
                            <tr key={framework} className="border-t border-border-color">
                                <td className="p-4 font-bold text-sm">{framework}</td>
                                <td className="p-4 text-center font-mono text-sm">{data[ControlStatus.FullyImplemented]}</td>
                                <td className="p-4 text-center font-mono text-sm">{data[ControlStatus.PartiallyImplemented]}</td>
                                <td className="p-4 text-center font-mono text-sm">{data[ControlStatus.NotImplemented]}</td>
                                <td className="p-4 text-center font-mono font-bold text-sm">{data.total}</td>
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
            <h2 className="text-base font-semibold mb-4">Riscos por Categoria</h2>
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm">
                        <tr>
                            <th className="p-3 font-semibold text-sm">Tipo de Risco</th>
                            <th className="p-3 font-semibold text-right text-sm">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSummary.map(([type, count]) => (
                            <tr key={type} className="border-t border-border-color">
                                <td className="p-3 text-sm">{type}</td>
                                <td className="p-3 text-right font-mono font-bold text-sm">{count}</td>
                            </tr>
                        ))}
                         <tr className="border-t-2 border-border-color bg-surface/50">
                             <td className="p-3 font-bold text-sm">Total Geral</td>
                             <td className="p-3 text-right font-mono font-extrabold text-sm">{risks.length}</td>
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

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1 bg-gradient-to-br from-red-500 to-danger"><h3 className="text-base font-semibold">Riscos Abertos</h3><p className="text-3xl font-bold">{riskStatusCounts[RiskStatus.Open] || 0}</p></Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-yellow-500 to-orange-500"><h3 className="text-base font-semibold">Em Andamento</h3><p className="text-3xl font-bold">{riskStatusCounts[RiskStatus.InProgress] || 0}</p></Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-green-500 to-secondary"><h3 className="text-base font-semibold">Riscos Mitigados</h3><p className="text-3xl font-bold">{riskStatusCounts[RiskStatus.Mitigated] || 0}</p></Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-blue-500 to-primary"><h3 className="text-base font-semibold">Riscos Aceitos</h3><p className="text-3xl font-bold">{riskStatusCounts[RiskStatus.Accepted] || 0}</p></Card>
            
            <ComplianceSummaryTable controls={controls} />

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
            title: '', description: '', probability: 1, impact: 1, status: RiskStatus.Open, owner: '',
            dueDate: new Date().toISOString().split('T')[0], type: RiskType.Operational, sla: 30,
            planResponsible: '', technicalResponsible: '', actionPlan: '', completionDate: '',
        }
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        const finalValue = (name === 'probability' || name === 'impact' || name === 'sla') ? Number(value) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-6 flex-shrink-0">{risk ? `Editar Risco #${formData.id}` : 'Adicionar Novo Risco'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Título do Risco</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Descrição Detalhada</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Probabilidade (1-5)</label>
                            <select name="probability" value={formData.probability} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Impacto (1-5)</label>
                            <select name="impact" value={formData.impact} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                         <div>
                             <label className="block text-xs font-medium mb-1">Status do Risco</label>
                             <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                 {Object.values(RiskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                         </div>
                         <div>
                            <label className="block text-xs font-medium mb-1">Tipo do Risco</label>
                             <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                 {Object.values(RiskType).map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                             <label className="block text-xs font-medium mb-1">Responsável (Área)</label>
                             <input type="text" name="owner" value={formData.owner} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <div>
                             <label className="block text-xs font-medium mb-1">Responsável pelo Plano</label>
                             <input type="text" name="planResponsible" value={formData.planResponsible} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <div>
                             <label className="block text-xs font-medium mb-1">Responsável Técnico</label>
                             <input type="text" name="technicalResponsible" value={formData.technicalResponsible} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                             <label className="block text-xs font-medium mb-1">Prazo Final</label>
                             <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                         </div>
                          <div>
                             <label className="block text-xs font-medium mb-1">Data de Finalização</label>
                             <input type="date" name="completionDate" value={formData.completionDate || ''} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                         </div>
                         <div>
                             <label className="block text-xs font-medium mb-1">SLA (dias)</label>
                             <input type="number" name="sla" value={formData.sla} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                         </div>
                     </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Plano de Ação</label>
                        <textarea name="actionPlan" value={formData.actionPlan} onChange={handleChange} rows="4" className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"></textarea>
                    </div>
                     <div className="flex justify-end gap-4 pt-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RiskTable = ({ risks, onEdit, onDelete, highlightedRowId }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
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
        return Math.ceil(Math.abs(new Date().getTime() - new Date(creationDate).getTime()) / (1000 * 60 * 60 * 24));
    };
    
    const getDueDateStatus = (risk) => {
        if (risk.completionDate) return { text: 'Finalizado', className: 'bg-green-500/20 text-green-400' };
        if (!risk.dueDate) return { text: 'Sem Prazo', className: 'bg-gray-500/20 text-gray-400' };
    
        const due = new Date(risk.dueDate);
        due.setMinutes(due.getMinutes() + due.getTimezoneOffset()); 
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const timeDiff = due.getTime() - today.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
        if (dayDiff < 0) {
            return { text: 'Atrasado', className: 'bg-red-500/20 text-red-400' };
        } else if (dayDiff <= 7) {
            return { text: 'Vence em breve', className: 'bg-yellow-500/20 text-yellow-400' };
        } else {
            return { text: 'No Prazo', className: 'bg-blue-500/20 text-blue-400' };
        }
    };
    
    return (
        <div className="bg-surface rounded-lg overflow-x-auto">
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
                            <tr key={risk.id} className={`border-t border-border-color hover:bg-surface/50 ${risk.id === highlightedRowId ? 'highlight-row' : ''}`}>
                                <td className="px-2 py-3 font-mono">{risk.id}</td>
                                <td className="px-2 py-3 max-w-xs"><p className="font-semibold truncate" title={risk.title}>{risk.title}</p></td>
                                <td className="px-2 py-3 text-center">{formatDate(risk.creationDate)}</td>
                                <td className="px-2 py-3 text-center">{risk.probability}</td>
                                <td className="px-2 py-3 text-center">{risk.impact}</td>
                                <td className="px-2 py-3 text-center"><span className={`px-2 py-0.5 rounded-full font-bold ${classification.className}`}>{classification.text}</span></td>
                                <td className="px-2 py-3 truncate" title={risk.owner}>{risk.owner}</td>
                                <td className="px-2 py-3 text-center">{formatDate(risk.dueDate)}</td>
                                 <td className="px-2 py-3 text-center"><span className={`px-2 py-0.5 rounded-full font-semibold ${dueDateStatus.className}`}>{dueDateStatus.text}</span></td>
                                <td className="px-2 py-3">{risk.status}</td>
                                <td className="px-2 py-3 text-center font-mono">{calculateAgingDays(risk.creationDate)}</td>
                                <td className="px-2 py-3 max-w-xs"><p className="truncate" title={risk.actionPlan}>{risk.actionPlan}</p></td>
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

const RisksPage = ({ risks, setRisks, highlightedItem, setHighlightedItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingRisk, setEditingRisk] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    const highlightedRowId = (highlightedItem?.page === 'Riscos') ? highlightedItem.id : null;

    useEffect(() => {
        let timerId = null;
        if (highlightedRowId) {
            timerId = setTimeout(() => {
                setHighlightedItem({ page: null, id: null });
            }, 2000); // Animation duration
        }
        return () => {
            if (timerId) clearTimeout(timerId);
        };
    }, [highlightedRowId, setHighlightedItem]);

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
            const newRisk = { ...riskData, id: maxId + 1, creationDate: new Date().toISOString() };
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
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
                let currentMaxId = risks.reduce((max, r) => Math.max(r.id, max), 0);
                
                const newRisks = lines.map(line => {
                    const data = line.split(',');
                    const riskObject = headers.reduce((obj, header, index) => {
                        obj[header] = data[index] ? data[index].replace(/"/g, '') : '';
                        return obj;
                    }, {} as any);

                    currentMaxId++;
                    return {
                        id: currentMaxId, creationDate: new Date().toISOString(), title: riskObject.title || 'Título não informado',
                        description: riskObject.description || '', probability: parseInt(riskObject.probability) || 1, impact: parseInt(riskObject.impact) || 1,
                        status: Object.values(RiskStatus).includes(riskObject.status) ? riskObject.status : RiskStatus.Open, owner: riskObject.owner || '',
                        dueDate: riskObject.dueDate || new Date().toISOString().split('T')[0], type: Object.values(RiskType).includes(riskObject.type) ? riskObject.type : RiskType.Operational,
                        sla: parseInt(riskObject.sla) || 30, planResponsible: riskObject.planResponsible || '', technicalResponsible: riskObject.technicalResponsible || '',
                        actionPlan: riskObject.actionPlan || '', completionDate: riskObject.completionDate || '',
                    };
                });

                setRisks(prev => [...prev, ...newRisks]);
                alert(`${newRisks.length} riscos importados com sucesso!`);
            } catch (error) { alert('Ocorreu um erro ao processar o arquivo CSV.'); }
        };
        reader.readAsText(file);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-6">Gerenciamento de Riscos</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                    <input type="text" placeholder="Buscar por título ou descrição..."
                        className="w-full bg-background border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors text-sm"><Download size={18} />Template CSV</button>
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                     <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors text-sm"><Upload size={18} />Importar CSV</button>
                    <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"><Plus size={18} />Adicionar Risco</button>
                </div>
            </div>
            
            <RiskTable risks={filteredRisks} onEdit={openModal} onDelete={handleDelete} highlightedRowId={highlightedRowId} />

            {isModalOpen && <RiskModal risk={editingRisk} onSave={handleSave} onClose={closeModal} />}
        </div>
    );
};

// --- Assets Page ---
const AssetModal = ({ asset, onSave, onClose }) => {
    const [formData, setFormData] = useState(
        asset || { name: '', type: AssetType.Server, criticality: AssetCriticality.Medium, owner: '' }
    );

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-6">{asset ? 'Editar Ativo' : 'Adicionar Novo Ativo'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Nome do Ativo</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Tipo</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Criticidade</label>
                            <select name="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                {Object.values(AssetCriticality).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Responsável (Área)</label>
                        <input type="text" name="owner" value={formData.owner} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AssetTable = ({ assets, onEdit, onDelete, highlightedRowId }) => {
    const getCriticalityClass = (criticality) => {
        switch (criticality) {
            case AssetCriticality.Critical: return 'bg-red-600 text-white';
            case AssetCriticality.High: return 'bg-orange-500 text-white';
            case AssetCriticality.Medium: return 'bg-yellow-500 text-black';
            case AssetCriticality.Low: return 'bg-green-600 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="bg-surface rounded-lg overflow-x-auto">
            <table className="w-full text-left table-auto">
                <thead className="bg-surface/50 text-text-secondary uppercase text-xs">
                    <tr>
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Nome do Ativo</th>
                        <th className="p-4 font-semibold">Tipo</th>
                        <th className="p-4 font-semibold text-center">Criticidade</th>
                        <th className="p-4 font-semibold">Responsável</th>
                        <th className="p-4 font-semibold text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {assets.map(asset => (
                        <tr key={asset.id} className={`border-t border-border-color hover:bg-surface/50 ${asset.id === highlightedRowId ? 'highlight-row' : ''}`}>
                            <td className="p-4 font-mono">{asset.id}</td>
                            <td className="p-4 font-semibold">{asset.name}</td>
                            <td className="p-4 text-text-secondary">{asset.type}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getCriticalityClass(asset.criticality)}`}>
                                    {asset.criticality.toUpperCase()}
                                </span>
                            </td>
                            <td className="p-4">{asset.owner}</td>
                            <td className="p-4 text-center">
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => onEdit(asset)} className="text-text-secondary hover:text-primary p-1"><Edit size={16} /></button>
                                    <button onClick={() => onDelete(asset.id)} className="text-text-secondary hover:text-danger p-1"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const AssetsPage = ({ assets, setAssets, highlightedItem, setHighlightedItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);

    const highlightedRowId = (highlightedItem?.page === 'Ativos') ? highlightedItem.id : null;

    useEffect(() => {
        let timerId = null;
        if (highlightedRowId) {
            timerId = setTimeout(() => {
                setHighlightedItem({ page: null, id: null });
            }, 2000); // Animation duration
        }
        return () => {
            if (timerId) clearTimeout(timerId);
        };
    }, [highlightedRowId, setHighlightedItem]);

    const filteredAssets = useMemo(() =>
        assets.filter(asset => asset.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [assets, searchTerm]
    );

    const openModal = (asset = null) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };

    const handleSave = (assetData) => {
        if (editingAsset) {
            setAssets(assets.map(a => a.id === assetData.id ? assetData : a));
        } else {
            const maxId = assets.reduce((max, a) => Math.max(a.id, max), 0);
            setAssets([...assets, { ...assetData, id: maxId + 1 }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja excluir este ativo?')) {
            setAssets(assets.filter(a => a.id !== id));
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-6">Gerenciamento de Ativos</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                    <input type="text" placeholder="Buscar por nome do ativo..."
                        className="w-full bg-background border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                    <Plus size={18} /> Adicionar Ativo
                </button>
            </div>
            <AssetTable assets={filteredAssets} onEdit={openModal} onDelete={handleDelete} highlightedRowId={highlightedRowId} />
            {isModalOpen && <AssetModal asset={editingAsset} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};


// --- Obsolescence Page ---
const ObsolescenceModal = ({ item, onSave, onClose }) => {
    const [formData, setFormData] = useState(
        item || {
            assetName: '', assetType: ObsolescenceAssetType.Software, vendor: '', version: '',
            endOfLifeDate: '', endOfSupportDate: '', impactDescription: '', recommendedAction: '', owner: ''
        }
    );

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-6 flex-shrink-0">{item ? 'Editar Item de Obsolescência' : 'Adicionar Item de Obsolescência'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Nome do Ativo</label>
                            <input type="text" name="assetName" value={formData.assetName} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Tipo de Ativo</label>
                            <select name="assetType" value={formData.assetType} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                {Object.values(ObsolescenceAssetType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fabricante/Vendor</label>
                            <input type="text" name="vendor" value={formData.vendor} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Versão</label>
                            <input type="text" name="version" value={formData.version} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Data de Fim de Vida (EOL)</label>
                            <input type="date" name="endOfLifeDate" value={formData.endOfLifeDate} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Data de Fim de Suporte (EOS)</label>
                            <input type="date" name="endOfSupportDate" value={formData.endOfSupportDate} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Descrição do Impacto</label>
                        <textarea name="impactDescription" value={formData.impactDescription} onChange={handleChange} rows="3" className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Ação Recomendada</label>
                        <textarea name="recommendedAction" value={formData.recommendedAction} onChange={handleChange} rows="3" className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"></textarea>
                    </div>
                     <div>
                        <label className="block text-xs font-medium mb-1">Responsável (Área)</label>
                        <input type="text" name="owner" value={formData.owner} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ObsolescenceTable = ({ items, onEdit, onDelete }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return new Intl.DateTimeFormat('pt-BR').format(date);
    };

    const getStatus = (item) => {
        const today = new Date();
        const eos = new Date(item.endOfSupportDate);
        if (today > eos) {
            return { text: ObsolescenceStatus.Obsolete, className: 'bg-red-500/20 text-red-400' };
        }
        const diffDays = Math.ceil((eos.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 180) { // 6 months
            return { text: ObsolescenceStatus.NearingEOL, className: 'bg-yellow-500/20 text-yellow-400' };
        }
        return { text: ObsolescenceStatus.Supported, className: 'bg-green-500/20 text-green-400' };
    };

    return (
        <div className="bg-surface rounded-lg overflow-x-auto">
            <table className="w-full text-left table-auto">
                <thead className="bg-surface/50 text-text-secondary uppercase text-xs">
                    <tr>
                        <th className="p-4 font-semibold">Ativo</th>
                        <th className="p-4 font-semibold">Tipo</th>
                        <th className="p-4 font-semibold">Versão</th>
                        <th className="p-4 font-semibold text-center">Fim de Suporte (EOS)</th>
                        <th className="p-4 font-semibold text-center">Status</th>
                        <th className="p-4 font-semibold">Responsável</th>
                        <th className="p-4 font-semibold text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="text-xs">
                    {items.map(item => {
                        const status = getStatus(item);
                        return (
                            <tr key={item.id} className="border-t border-border-color hover:bg-surface/50">
                                <td className="p-4 font-semibold">{item.assetName}</td>
                                <td className="p-4 text-text-secondary">{item.assetType}</td>
                                <td className="p-4 text-text-secondary">{item.version}</td>
                                <td className="p-4 text-center font-mono">{formatDate(item.endOfSupportDate)}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.className}`}>{status.text}</span>
                                </td>
                                <td className="p-4">{item.owner}</td>
                                <td className="p-4 text-center">
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={() => onEdit(item)} className="text-text-secondary hover:text-primary p-1"><Edit size={16} /></button>
                                        <button onClick={() => onDelete(item.id)} className="text-text-secondary hover:text-danger p-1"><Trash2 size={16} /></button>
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

const ObsolescencePage = ({ items, setItems }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const filteredItems = useMemo(() =>
        items.filter(item => item.assetName.toLowerCase().includes(searchTerm.toLowerCase())),
        [items, searchTerm]
    );

    const openModal = (item = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSave = (itemData) => {
        if (editingItem) {
            setItems(items.map(i => i.id === itemData.id ? itemData : i));
        } else {
            const maxId = items.reduce((max, i) => Math.max(i.id, max), 0);
            setItems([...items, { ...itemData, id: maxId + 1 }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza?')) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-6">Gerenciamento de Obsolescência</h1>
            <div className="flex justify-between items-center mb-4">
                 <div className="relative w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                    <input type="text" placeholder="Buscar por nome do ativo..."
                        className="w-full bg-background border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                    <Plus size={18} /> Adicionar Item
                </button>
            </div>
            <ObsolescenceTable items={filteredItems} onEdit={openModal} onDelete={handleDelete} />
            {isModalOpen && <ObsolescenceModal item={editingItem} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};


// --- Compliance Page ---
const ComplianceModal = ({ control, onSave, onClose }) => {
    const [status, setStatus] = useState(control.status || ControlStatus.NotImplemented);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...control, status });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-6">Editar Status do Controle</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm"><strong className="text-text-secondary">ID:</strong> {control.id}</p>
                    <p className="text-sm"><strong className="text-text-secondary">Nome:</strong> {control.name}</p>
                    <div>
                        <label className="block text-xs font-medium mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ControlStatus)}
                            className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        >
                            {Object.values(ControlStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ComplianceTable = ({ controls, onEdit }) => {
    const getStatusClass = (status) => {
        switch (status) {
            case ControlStatus.FullyImplemented: return 'bg-green-500/20 text-green-400';
            case ControlStatus.PartiallyImplemented: return 'bg-yellow-500/20 text-yellow-400';
            case ControlStatus.InProgress: return 'bg-blue-500/20 text-blue-400';
            case ControlStatus.NotImplemented: return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };
    
    return (
        <div className="bg-surface rounded-lg overflow-x-auto">
            <table className="w-full text-left table-auto">
                <thead className="bg-surface/50 text-text-secondary uppercase text-xs">
                    <tr>
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Framework</th>
                        <th className="p-4 font-semibold">Família/Controle</th>
                        <th className="p-4 font-semibold">Descrição</th>
                        <th className="p-4 font-semibold text-center">Status</th>
                        <th className="p-4 font-semibold text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {controls.map(control => (
                        <tr key={control.id} className="border-t border-border-color hover:bg-surface/50">
                            <td className="p-4 font-mono text-xs">{control.id}</td>
                            <td className="p-4 text-xs font-bold">{control.framework}</td>
                            <td className="p-4 font-semibold max-w-sm"><p className="truncate" title={control.name}>{control.name}</p><p className="text-xs text-text-secondary">{control.family}</p></td>
                            <td className="p-4 text-xs text-text-secondary max-w-md"><p className="truncate" title={control.description}>{control.description}</p></td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(control.status)}`}>
                                    {control.status || 'N/A'}
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                <button onClick={() => onEdit(control)} className="text-text-secondary hover:text-primary p-1"><Edit size={16} /></button>
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
    const [activeFramework, setActiveFramework] = useState('Todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingControl, setEditingControl] = useState(null);

    const filteredControls = useMemo(() =>
        controls.filter(control =>
            (activeFramework === 'Todos' || control.framework === activeFramework) &&
            (control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             control.description.toLowerCase().includes(searchTerm.toLowerCase()))
        ), [controls, searchTerm, activeFramework]
    );

    const openModal = (control) => {
        setEditingControl(control);
        setIsModalOpen(true);
    };

    const handleSave = (updatedControl) => {
        setControls(controls.map(c => c.id === updatedControl.id ? updatedControl : c));
        setIsModalOpen(false);
    };
    
    const frameworks = ['Todos', ...Object.values(FrameworkName)];

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-6">Gerenciamento de Conformidade</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 p-1 bg-surface/50 rounded-lg">
                    {frameworks.map(fw => (
                        <button 
                            key={fw} 
                            onClick={() => setActiveFramework(fw)}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeFramework === fw ? 'bg-primary text-white' : 'hover:bg-surface'}`}
                        >
                            {fw}
                        </button>
                    ))}
                </div>
                 <div className="relative w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                    <input type="text" placeholder="Buscar por nome ou descrição..."
                        className="w-full bg-background border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <ComplianceTable controls={filteredControls} onEdit={openModal} />
            {isModalOpen && <ComplianceModal control={editingControl} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};


// --- Data Controls Page ---
const DataControlModal = ({ control, onSave, onClose }) => {
    const [formData, setFormData] = useState(
        control || {
            name: '', description: '', category: '', relatedRegulation: '',
            status: DataControlStatus.Active, criticality: AssetCriticality.Medium, owner: ''
        }
    );

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-6">{control ? 'Editar Controle de Dados' : 'Adicionar Novo Controle de Dados'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Nome do Controle</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Descrição</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Categoria</label>
                            <input type="text" name="category" value={formData.category} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Regulamentação Relacionada</label>
                            <input type="text" name="relatedRegulation" value={formData.relatedRegulation} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                {Object.values(DataControlStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Criticidade</label>
                            <select name="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                {Object.values(AssetCriticality).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Responsável (Área)</label>
                        <input type="text" name="owner" value={formData.owner} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DataControlTable = ({ controls, onEdit, onDelete }) => {
    const getCriticalityClass = (criticality) => {
        switch (criticality) {
            case AssetCriticality.Critical: return 'bg-red-600 text-white';
            case AssetCriticality.High: return 'bg-orange-500 text-white';
            case AssetCriticality.Medium: return 'bg-yellow-500 text-black';
            case AssetCriticality.Low: return 'bg-green-600 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case DataControlStatus.Active: return 'bg-green-500/20 text-green-400';
            case DataControlStatus.Inactive: return 'bg-gray-500/20 text-gray-400';
            case DataControlStatus.InReview: return 'bg-yellow-500/20 text-yellow-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };
    
    return (
        <div className="bg-surface rounded-lg overflow-x-auto">
            <table className="w-full text-left table-auto">
                <thead className="bg-surface/50 text-text-secondary uppercase text-xs">
                    <tr>
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Nome do Controle</th>
                        <th className="p-4 font-semibold">Categoria</th>
                        <th className="p-4 font-semibold text-center">Criticidade</th>
                        <th className="p-4 font-semibold text-center">Status</th>
                        <th className="p-4 font-semibold">Responsável</th>
                        <th className="p-4 font-semibold text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {controls.map(control => (
                        <tr key={control.id} className="border-t border-border-color hover:bg-surface/50">
                            <td className="p-4 font-mono">{control.id}</td>
                            <td className="p-4 font-semibold">{control.name}</td>
                            <td className="p-4 text-text-secondary">{control.category}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getCriticalityClass(control.criticality)}`}>
                                    {control.criticality.toUpperCase()}
                                </span>
                            </td>
                             <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(control.status)}`}>
                                    {control.status}
                                </span>
                            </td>
                            <td className="p-4">{control.owner}</td>
                            <td className="p-4 text-center">
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => onEdit(control)} className="text-text-secondary hover:text-primary p-1"><Edit size={16} /></button>
                                    <button onClick={() => onDelete(control.id)} className="text-text-secondary hover:text-danger p-1"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const DataControlsPage = ({ dataControls, setDataControls }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingControl, setEditingControl] = useState(null);

    const filteredControls = useMemo(() =>
        dataControls.filter(control =>
            control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            control.description.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [dataControls, searchTerm]
    );

    const openModal = (control = null) => {
        setEditingControl(control);
        setIsModalOpen(true);
    };

    const handleSave = (controlData) => {
        if (editingControl) {
            setDataControls(dataControls.map(c => c.id === controlData.id ? controlData : c));
        } else {
            const maxId = dataControls.reduce((max, c) => Math.max(c.id, max), 0);
            setDataControls([...dataControls, { ...controlData, id: maxId + 1 }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja excluir este controle de dados?')) {
            setDataControls(dataControls.filter(c => c.id !== id));
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-6">Gerenciamento de Controles de Dados</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                    <input type="text" placeholder="Buscar por nome ou descrição..."
                        className="w-full bg-background border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                    <Plus size={18} /> Adicionar Controle
                </button>
            </div>
            <DataControlTable controls={filteredControls} onEdit={openModal} onDelete={handleDelete} />
            {isModalOpen && <DataControlModal control={editingControl} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};


// --- AI Analysis Page ---
const AIAnalysisResult = ({ result, isFromCache }) => {
    if (!result) return null;
    return (
        <Card className="mt-6 animate-fade-in">
             <div className="flex justify-between items-center mb-4 border-b border-border-color pb-2">
                <h3 className="text-lg font-bold">Resultado da Análise de IA</h3>
                {isFromCache && <span className="text-xs bg-secondary/20 text-secondary py-1 px-2 rounded-md font-medium">Carregado do cache</span>}
             </div>
             <div className="space-y-4">
                 <div>
                    <h4 className="font-semibold text-primary text-base">Sumário Executivo</h4>
                    <p className="text-text-secondary text-sm">{result.analysis_summary}</p>
                 </div>
                 <div>
                    <h4 className="font-semibold text-primary text-base">Impacto Financeiro</h4>
                    <p className="text-xl font-bold text-danger">{result.financial_impact.estimated_cost_range_brl}</p>
                    <ul className="list-disc list-inside text-text-secondary text-xs">
                        {result.financial_impact.cost_breakdown.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                 </div>
                 <div>
                    <h4 className="font-semibold text-primary text-base">Impacto Operacional</h4>
                    <p className="text-text-secondary text-sm">{result.operational_impact}</p>
                 </div>
                 <div>
                    <h4 className="font-semibold text-primary text-base">Impacto Reputacional</h4>
                    <p className="text-text-secondary text-sm">{result.reputational_impact}</p>
                 </div>
                 <div>
                    <h4 className="font-semibold text-primary text-base">Impacto de Conformidade</h4>
                    <p className="text-text-secondary text-sm">{result.compliance_impact}</p>
                 </div>
                 <div>
                    <h4 className="font-semibold text-primary text-base">Recomendações</h4>
                     <ul className="list-decimal list-inside text-text-secondary text-sm">
                        {result.recommendations.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                 </div>
             </div>
        </Card>
    );
};

const AIAnalysisPage = ({ risks, assets, setActivePage, setHighlightedItem }) => {
    const [selectedType, setSelectedType] = useState('risk');
    const [selectedId, setSelectedId] = useState('');
    const [scenario, setScenario] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState('');
    const [isFromCache, setIsFromCache] = useState(false);
    const analysisCache = useRef(new Map());

    const handleGoToItem = () => {
        if (!selectedId) return;
        const targetPage = selectedType === 'risk' ? 'Riscos' : 'Ativos';
        setHighlightedItem({ page: targetPage, id: parseInt(selectedId) });
        setActivePage(targetPage);
    };

    const handleAnalysis = async () => {
        if (!selectedId || !scenario) {
            setError('Por favor, selecione um item e descreva o cenário.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        setIsFromCache(false);

        const cacheKey = `${selectedType}-${selectedId}-${scenario}`;
        if (analysisCache.current.has(cacheKey)) {
            setAnalysisResult(analysisCache.current.get(cacheKey));
            setIsFromCache(true);
            setIsLoading(false);
            return;
        }

        const selectedItem = selectedType === 'risk'
            ? risks.find(r => r.id === parseInt(selectedId))
            : assets.find(a => a.id === parseInt(selectedId));

        if (!selectedItem) {
            setError('Item selecionado não encontrado.');
            setIsLoading(false);
            return;
        }
        
        let itemContext = '';
        if (selectedType === 'risk') {
            const risk = selectedItem as Risk;
            itemContext = `
                - Título do Risco: ${risk.title}
                - Descrição: ${risk.description}
                - Tipo: ${risk.type}
                - Probabilidade: ${risk.probability}/5
                - Impacto: ${risk.impact}/5
            `;
        } else {
            const asset = selectedItem as Asset;
            itemContext = `
                - Nome do Ativo: ${asset.name}
                - Tipo: ${asset.type}
                - Criticidade: ${asset.criticality}
                - Dono: ${asset.owner}
            `;
        }
        
        const prompt = `
            Analise o seguinte cenário de risco para a empresa com base no item detalhado abaixo.

            **Detalhes do Item:**
            ${itemContext}

            **Cenário a ser Analisado:**
            ${scenario}
        `;

        const schema = {
            type: Type.OBJECT,
            properties: {
                analysis_summary: { type: Type.STRING, description: 'Um resumo executivo do impacto geral.' },
                financial_impact: {
                  type: Type.OBJECT,
                  properties: {
                    estimated_cost_range_brl: { type: Type.STRING, description: 'Estimativa do prejuízo financeiro em BRL, ex: "R$ 100.000 - R$ 250.000".' },
                    cost_breakdown: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista dos fatores do custo (ex: multas, perda de receita).' }
                  }
                },
                reputational_impact: { type: Type.STRING, description: 'Descrição do dano à reputação da empresa.' },
                operational_impact: { type: Type.STRING, description: 'Descrição da interrupção nas operações de negócio.' },
                compliance_impact: { type: Type.STRING, description: 'Descrição de possíveis violações regulatórias (ex: LGPD).' },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de 3 a 5 ações recomendadas para mitigar o risco.' }
            }
        };

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                  responseMimeType: "application/json",
                  responseSchema: schema,
                  systemInstruction: "Você é um consultor sênior de GRC especializado em análise de impacto quantitativo. Forneça estimativas financeiras em Reais (BRL). Responda APENAS com o objeto JSON do schema fornecido."
                },
            });
            const jsonStr = response.text.trim();
            const result = JSON.parse(jsonStr);
            analysisCache.current.set(cacheKey, result);
            setAnalysisResult(result);
        } catch (e) {
            console.error("Gemini API error:", e);
            setError("Falha ao obter análise da IA. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const options = selectedType === 'risk' ? risks : assets;

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-6">Análise de Impacto com IA</h1>
            <Card>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-xs font-medium mb-1">Tipo de Item</label>
                             <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setSelectedId(''); }}
                                 className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                 <option value="risk">Risco</option>
                                 <option value="asset">Ativo</option>
                             </select>
                         </div>
                         <div>
                            <label className="block text-xs font-medium mb-1" htmlFor="item-selector">Selecione o Item</label>
                            <div className="flex items-center gap-2">
                                <select id="item-selector" value={selectedId} onChange={e => setSelectedId(e.target.value)}
                                    className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                    <option value="">-- Selecione --</option>
                                    {options.map(item => <option key={item.id} value={item.id}>{item.name || item.title}</option>)}
                                </select>
                                <button
                                    onClick={handleGoToItem}
                                    disabled={!selectedId}
                                    className="p-2 bg-surface hover:bg-surface/80 text-text-secondary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 rounded-lg"
                                    title="Navegar para o item"
                                >
                                    <ExternalLink size={20} />
                                </button>
                            </div>
                         </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Descreva o Cenário</label>
                        <textarea value={scenario} onChange={e => setScenario(e.target.value)}
                            placeholder="Ex: Vazamento completo da base de dados de clientes devido a um ataque de ransomware."
                            rows="4" className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"></textarea>
                    </div>
                    {error && <p className="text-sm text-danger">{error}</p>}
                    <div>
                        <button onClick={handleAnalysis} disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed text-sm">
                            {isLoading ? <> <RefreshCw className="animate-spin" size={18} /> Analisando... </> : <> <Bot size={18} /> Analisar com IA </>}
                        </button>
                    </div>
                </div>
            </Card>
            {analysisResult && <AIAnalysisResult result={analysisResult} isFromCache={isFromCache} />}
        </div>
    );
};


// --- Settings Page ---
const SettingsPage = ({
  users, setUsers, profiles, setProfiles, groups, setGroups,
  appData, setAppData, alertRules, setAlertRules
}) => {
    const [activeTab, setActiveTab] = useState('Perfis');
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'Perfis':
                return <ProfileManagementTab profiles={profiles} setProfiles={setProfiles} />;
            case 'Grupos':
                return <GroupManagementTab groups={groups} setGroups={setGroups} allUsers={users} />;
            case 'Usuários':
                return <UserManagementTab users={users} setUsers={setUsers} allProfiles={profiles} />;
            case 'Dados':
                return <DataManagementTab appData={appData} setAppData={setAppData} />;
            case 'Alertas':
                return <AlertManagementTab alertRules={alertRules} setAlertRules={setAlertRules} allUsers={users} allGroups={groups} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-6">Configurações</h1>
            <div className="flex border-b border-border-color mb-6">
                <TabButton text="Perfis" icon={UserCheck} active={activeTab === 'Perfis'} onClick={() => setActiveTab('Perfis')} />
                <TabButton text="Grupos" icon={Users2} active={activeTab === 'Grupos'} onClick={() => setActiveTab('Grupos')} />
                <TabButton text="Usuários" icon={Users} active={activeTab === 'Usuários'} onClick={() => setActiveTab('Usuários')} />
                <TabButton text="Dados" icon={DatabaseZap} active={activeTab === 'Dados'} onClick={() => setActiveTab('Dados')} />
                <TabButton text="Alertas" icon={Bell} active={activeTab === 'Alertas'} onClick={() => setActiveTab('Alertas')} />
            </div>
            <div>{renderTabContent()}</div>
        </div>
    );
};

const TabButton = ({ text, icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 py-2 px-4 -mb-px border-b-2 transition-colors ${active ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
        <Icon size={18} />
        <span className="font-semibold text-sm">{text}</span>
    </button>
);

// User Management
const UserManagementTab = ({ users, setUsers, allProfiles }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const openModal = (user = null) => { setEditingUser(user); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (userData) => {
        if (editingUser) {
            setUsers(users.map(u => u.id === userData.id ? { ...userData, profileId: Number(userData.profileId) } : u));
        } else {
            setUsers([...users, { ...userData, id: Date.now(), profileId: Number(userData.profileId) }]);
        }
        closeModal();
    };
    
    const handleDelete = (userId) => {
        if (window.confirm('Tem certeza?')) setUsers(users.filter(u => u.id !== userId));
    };
    
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"><UserPlus size={18} />Adicionar Usuário</button>
            </div>
            <UserTable users={users} profiles={allProfiles} onEdit={openModal} onDelete={handleDelete} />
            {isModalOpen && <UserModal user={editingUser} profiles={allProfiles} onSave={handleSave} onClose={closeModal} />}
        </div>
    );
};
const UserTable = ({ users, profiles, onEdit, onDelete }) => (
    <div className="bg-surface rounded-lg overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-surface/50"><tr><th className="p-4 font-semibold text-sm">Nome</th><th className="p-4 font-semibold text-sm">Email</th><th className="p-4 font-semibold text-sm">Perfil</th><th className="p-4 font-semibold text-sm">Ações</th></tr></thead>
            <tbody className="text-sm">
                {users.map(user => {
                    const profile = profiles.find(p => p.id === user.profileId);
                    return (
                        <tr key={user.id} className="border-t border-border-color hover:bg-surface/50">
                            <td className="p-4 flex items-center gap-3"><div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center font-bold text-background text-sm">{user.name.charAt(0)}</div>{user.name}</td>
                            <td className="p-4 text-text-secondary">{user.email}</td>
                            <td className="p-4">{profile ? profile.name : 'N/A'}</td>
                            <td className="p-4"><div className="flex gap-2"><button onClick={() => onEdit(user)} className="text-text-secondary hover:text-primary"><Edit size={18} /></button><button onClick={() => onDelete(user.id)} className="text-text-secondary hover:text-danger"><Trash2 size={18} /></button></div></td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
);
const UserModal = ({ user, profiles, onSave, onClose }) => {
    const [formData, setFormData] = useState(user || { name: '', email: '', profileId: profiles[0]?.id || '' });
    const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = e => { e.preventDefault(); onSave(formData); };
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-6">{user ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-xs font-medium mb-1">Nome <span className="text-danger">*</span></label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
                    <div><label className="block text-xs font-medium mb-1">Email <span className="text-danger">*</span></label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
                    <div><label className="block text-xs font-medium mb-1">Perfil</label><select name="profileId" value={formData.profileId} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">{profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button><button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm">Salvar</button></div>
                </form>
            </div>
        </div>
    );
};

// Group Management
const GroupManagementTab = ({ groups, setGroups, allUsers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const openModal = (group = null) => { setEditingGroup(group); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (groupData) => {
        if (editingGroup) {
            setGroups(groups.map(g => g.id === groupData.id ? groupData : g));
        } else {
            setGroups([...groups, { ...groupData, id: Date.now() }]);
        }
        closeModal();
    };

    const handleDelete = (groupId) => {
        if (window.confirm('Tem certeza?')) setGroups(groups.filter(g => g.id !== groupId));
    };

    return (
        <div>
            <div className="flex justify-end mb-4"><button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm"><Plus size={18} />Adicionar Grupo</button></div>
            <GroupTable groups={groups} allUsers={allUsers} onEdit={openModal} onDelete={handleDelete} />
            {isModalOpen && <GroupModal group={editingGroup} allUsers={allUsers} onSave={handleSave} onClose={closeModal} />}
        </div>
    );
};
const GroupTable = ({ groups, allUsers, onEdit, onDelete }) => (
     <div className="bg-surface rounded-lg overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-surface/50"><tr><th className="p-4 font-semibold text-sm">Nome</th><th className="p-4 font-semibold text-sm">Membros</th><th className="p-4 font-semibold text-sm">Ações</th></tr></thead>
            <tbody className="text-sm">
                {groups.map(group => (
                    <tr key={group.id} className="border-t border-border-color hover:bg-surface/50">
                        <td className="p-4"><p className="font-semibold">{group.name}</p><p className="text-xs text-text-secondary">{group.description}</p></td>
                        <td className="p-4">{group.memberIds.length}</td>
                        <td className="p-4"><div className="flex gap-2"><button onClick={() => onEdit(group)} className="text-text-secondary hover:text-primary"><Edit size={18} /></button><button onClick={() => onDelete(group.id)} className="text-text-secondary hover:text-danger"><Trash2 size={18} /></button></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
const GroupModal = ({ group, allUsers, onSave, onClose }) => {
    const [formData, setFormData] = useState(group || { name: '', description: '', memberIds: [] });
    
    const handleChange = e => setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
    const handleMemberChange = (userId) => {
        setFormData(prev => {
            const newMemberIds = prev.memberIds.includes(userId)
                ? prev.memberIds.filter(id => id !== userId)
                : [...prev.memberIds, userId];
            return { ...prev, memberIds: newMemberIds };
        });
    };
    
    const handleSubmit = e => { e.preventDefault(); onSave(formData); };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-6">{group ? 'Editar Grupo' : 'Adicionar Grupo'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-xs font-medium mb-1">Nome</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 text-sm"/></div>
                    <div><label className="block text-xs font-medium mb-1">Descrição</label><input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 text-sm"/></div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Membros</label>
                        <div className="max-h-48 overflow-y-auto bg-background p-2 rounded-lg border border-border-color text-sm">
                            {allUsers.map(user => (
                                <div key={user.id} className="flex items-center gap-2 p-1">
                                    <input type="checkbox" id={`user-${user.id}`} checked={formData.memberIds.includes(user.id)} onChange={() => handleMemberChange(user.id)} />
                                    <label htmlFor={`user-${user.id}`}>{user.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button><button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm">Salvar</button></div>
                </form>
            </div>
        </div>
    );
};

// Profile Management
const ProfileManagementTab = ({ profiles, setProfiles }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);

    const openModal = (profile = null) => { setEditingProfile(profile); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (profileData) => {
        if (editingProfile) {
            setProfiles(profiles.map(p => p.id === profileData.id ? profileData : p));
        } else {
            setProfiles([...profiles, { ...profileData, id: Date.now() }]);
        }
        closeModal();
    };
    
    const handleDelete = (profileId) => {
        if (window.confirm('Tem certeza?')) setProfiles(profiles.filter(p => p.id !== profileId));
    };

    return (
         <div>
            <div className="flex justify-end mb-4"><button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm"><Plus size={18} />Adicionar Perfil</button></div>
            <ProfileTable profiles={profiles} onEdit={openModal} onDelete={handleDelete} />
            {isModalOpen && <ProfileModal profile={editingProfile} onSave={handleSave} onClose={closeModal} />}
        </div>
    );
};
const ProfileTable = ({ profiles, onEdit, onDelete }) => (
    <div className="bg-surface rounded-lg overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-surface/50"><tr><th className="p-4 font-semibold text-sm">Nome</th><th className="p-4 font-semibold text-sm">Permissões</th><th className="p-4 font-semibold text-sm">Ações</th></tr></thead>
            <tbody className="text-sm">
                {profiles.map(profile => (
                    <tr key={profile.id} className="border-t border-border-color hover:bg-surface/50">
                        <td className="p-4"><p className="font-semibold">{profile.name}</p><p className="text-xs text-text-secondary">{profile.description}</p></td>
                        <td className="p-4 text-xs font-mono">{profile.permissions.join(', ')}</td>
                        <td className="p-4"><div className="flex gap-2"><button onClick={() => onEdit(profile)} className="text-text-secondary hover:text-primary"><Edit size={18} /></button><button onClick={() => onDelete(profile.id)} className="text-text-secondary hover:text-danger"><Trash2 size={18} /></button></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
const ProfileModal = ({ profile, onSave, onClose }) => {
    const [formData, setFormData] = useState(profile || { name: '', description: '', permissions: [] });
    const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = e => { e.preventDefault(); onSave(formData); };
    return (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-6">{profile ? 'Editar Perfil' : 'Adicionar Perfil'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-xs font-medium mb-1">Nome</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 text-sm" /></div>
                    <div><label className="block text-xs font-medium mb-1">Descrição</label><input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 text-sm" /></div>
                    <div><label className="block text-xs font-medium mb-1">Permissões (separadas por vírgula)</label><input type="text" name="permissions" value={formData.permissions.join(',')} onChange={e => setFormData(p => ({...p, permissions: e.target.value.split(',').map(i=>i.trim())}))} className="w-full bg-background border border-border-color rounded-lg p-2 font-mono text-sm" /></div>
                    <p className="text-xs text-text-secondary">Ex: risk:read, risk:edit, asset:*, *:*. (Funcionalidade de permissões ainda em desenvolvimento).</p>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button><button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm">Salvar</button></div>
                </form>
            </div>
        </div>
    );
};

const DataManagementTab = ({ appData, setAppData }) => {
    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) { alert("Não há dados para exportar."); return; }
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(','), ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))];
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8," + csvRows.join("\n")));
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleReset = () => {
        if (prompt('Ação irreversível. Digite "RESETAR" para confirmar.') === 'RESETAR') {
            setAppData.setRisks(initialRisks); setAppData.setAssets(initialAssets); setAppData.setDataControls(mockDataControls);
            setAppData.setComplianceControls(allControls); setAppData.setObsolescenceItems(initialObsolescenceItems);
            alert('Dados resetados para o estado inicial.');
        } else { alert('Ação cancelada.'); }
    };
    
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
             <Card>
                <h3 className="text-base font-semibold mb-4 border-b border-border-color pb-2">Exportar Dados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => exportToCSV(appData.risks, 'export_riscos')} className="flex w-full items-center justify-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg text-sm"><FileDown size={18} /> Exportar Riscos</button>
                    <button onClick={() => exportToCSV(appData.assets, 'export_ativos')} className="flex w-full items-center justify-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg text-sm"><FileDown size={18} /> Exportar Ativos</button>
                    <button onClick={() => exportToCSV(appData.obsolescenceItems, 'export_obsolescencia')} className="flex w-full items-center justify-center gap-2 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 px-4 rounded-lg text-sm"><FileDown size={18} /> Exportar Obsolescência</button>
                </div>
            </Card>
            <Card className="border border-danger/50">
                 <h3 className="text-base font-semibold mb-2 text-danger">Zona de Perigo</h3>
                 <p className="text-xs text-text-secondary mb-4">Ações nesta seção são permanentes.</p>
                 <div className="flex justify-between items-center bg-background/50 p-4 rounded-lg">
                     <div><p className="font-semibold text-sm">Resetar Dados da Aplicação</p><p className="text-xs text-text-secondary">Restaura todos os dados para o estado inicial.</p></div>
                     <button onClick={handleReset} className="flex items-center gap-2 bg-danger hover:bg-danger/80 text-white font-bold py-2 px-4 rounded-lg text-sm"><RefreshCw size={18} /> Resetar Dados</button>
                 </div>
            </Card>
        </div>
    );
};

// Alert Management
const AlertRuleModal = ({ rule, allUsers, allGroups, onSave, onClose }) => {
    const [formData, setFormData] = useState(
        rule || {
            name: '', isActive: true, triggerEvent: Object.values(AlertTriggerEvent)[0],
            notifications: { inApp: true, email: false },
            recipients: { userIds: [], groupIds: [] }
        }
    );

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleCheckboxChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }));
    const handleNotificationChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, notifications: { ...prev.notifications, [name]: checked }}));
    };
    const handleRecipientChange = (type, id) => {
        setFormData(prev => {
            const currentIds = prev.recipients[type];
            const newIds = currentIds.includes(id) ? currentIds.filter(i => i !== id) : [...currentIds, id];
            return { ...prev, recipients: { ...prev.recipients, [type]: newIds }};
        });
    };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-8 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-6 flex-shrink-0">{rule ? 'Editar Regra de Alerta' : 'Adicionar Nova Regra de Alerta'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-4">
                    <div className="flex items-center justify-between bg-background/50 p-3 rounded-lg">
                        <label htmlFor="isActive" className="text-sm font-medium">Regra Ativa</label>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleCheckboxChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Nome da Regra</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                     <div>
                        <label className="block text-xs font-medium mb-1">Gatilho (Quando este evento ocorrer...)</label>
                        <select name="triggerEvent" value={formData.triggerEvent} onChange={handleChange} className="w-full bg-background border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                            {Object.values(AlertTriggerEvent).map(event => <option key={event} value={event}>{event}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">...notificar por:</label>
                        <div className="flex gap-4 p-3 bg-background/50 rounded-lg">
                            <div className="flex items-center gap-2"><input type="checkbox" id="inApp" name="inApp" checked={formData.notifications.inApp} onChange={handleNotificationChange} /><label htmlFor="inApp" className="text-sm">Notificação In-App</label></div>
                            <div className="flex items-center gap-2"><input type="checkbox" id="email" name="email" checked={formData.notifications.email} onChange={handleNotificationChange} /><label htmlFor="email" className="text-sm">Email</label></div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">...os seguintes destinatários:</label>
                        <div className="grid grid-cols-2 gap-4 max-h-56 overflow-y-auto bg-background/50 p-3 rounded-lg border border-border-color">
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Grupos</h4>
                                {allGroups.map(group => (
                                    <div key={group.id} className="flex items-center gap-2 p-1 text-sm"><input type="checkbox" id={`group-${group.id}`} checked={formData.recipients.groupIds.includes(group.id)} onChange={() => handleRecipientChange('groupIds', group.id)} /><label htmlFor={`group-${group.id}`}>{group.name}</label></div>
                                ))}
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Usuários</h4>
                                {allUsers.map(user => (
                                    <div key={user.id} className="flex items-center gap-2 p-1 text-sm"><input type="checkbox" id={`user-${user.id}`} checked={formData.recipients.userIds.includes(user.id)} onChange={() => handleRecipientChange('userIds', user.id)} /><label htmlFor={`user-${user.id}`}>{user.name}</label></div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-surface/50 hover:bg-surface/80 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button>
                        <button type="submit" className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg text-sm">Salvar Regra</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AlertRuleTable = ({ rules, onEdit, onDelete, onToggle }) => (
    <div className="bg-surface rounded-lg overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-surface/50"><tr><th className="p-4 font-semibold text-sm">Status</th><th className="p-4 font-semibold text-sm">Nome da Regra</th><th className="p-4 font-semibold text-sm">Gatilho</th><th className="p-4 font-semibold text-sm">Canais</th><th className="p-4 font-semibold text-sm">Destinatários</th><th className="p-4 font-semibold text-sm text-center">Ações</th></tr></thead>
            <tbody className="text-sm">
                {rules.map(rule => (
                    <tr key={rule.id} className="border-t border-border-color hover:bg-surface/50">
                        <td className="p-4">
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={rule.isActive} onChange={() => onToggle(rule.id, !rule.isActive)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                        </td>
                        <td className="p-4 font-semibold">{rule.name}</td>
                        <td className="p-4 text-text-secondary">{rule.triggerEvent}</td>
                        <td className="p-4">
                            <div className="flex gap-3">
                                {rule.notifications.inApp && <Bell size={16} title="Notificação In-App" />}
                                {rule.notifications.email && <Mail size={16} title="Email" />}
                            </div>
                        </td>
                        <td className="p-4 text-text-secondary">{`${rule.recipients.groupIds.length} Grupos, ${rule.recipients.userIds.length} Usuários`}</td>
                        <td className="p-4"><div className="flex gap-2 justify-center"><button onClick={() => onEdit(rule)} className="text-text-secondary hover:text-primary p-1"><Edit size={16} /></button><button onClick={() => onDelete(rule.id)} className="text-text-secondary hover:text-danger p-1"><Trash2 size={16} /></button></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const AlertManagementTab = ({ alertRules, setAlertRules, allUsers, allGroups }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    const openModal = (rule = null) => { setEditingRule(rule); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (ruleData) => {
        if (editingRule) {
            setAlertRules(alertRules.map(r => r.id === ruleData.id ? ruleData : r));
        } else {
            setAlertRules([...alertRules, { ...ruleData, id: Date.now() }]);
        }
        closeModal();
    };

    const handleDelete = (ruleId) => {
        if (window.confirm('Tem certeza que deseja excluir esta regra de alerta?')) {
            setAlertRules(alertRules.filter(r => r.id !== ruleId));
        }
    };
    
    const handleToggle = (ruleId, isActive) => {
        setAlertRules(alertRules.map(r => r.id === ruleId ? { ...r, isActive } : r));
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"><Plus size={18} />Adicionar Regra</button>
            </div>
            <AlertRuleTable rules={alertRules} onEdit={openModal} onDelete={handleDelete} onToggle={handleToggle} />
            {isModalOpen && <AlertRuleModal rule={editingRule} allUsers={allUsers} allGroups={allGroups} onSave={handleSave} onClose={closeModal} />}
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
    const [users, setUsers] = useState(initialUsers);
    const [profiles, setProfiles] = useState(initialProfiles);
    const [groups, setGroups] = useState(initialGroups);
    const [obsolescenceItems, setObsolescenceItems] = useState(initialObsolescenceItems);
    const [alertRules, setAlertRules] = useState(initialAlertRules);
    const [highlightedItem, setHighlightedItem] = useState({ page: null, id: null });

    const currentUser = users.find(u => u.id === 1); // Simulating logged-in user

    const renderPage = () => {
        switch (activePage) {
            case 'Dashboard': return <DashboardPage risks={risks} controls={complianceControls} />;
            case 'Riscos': return <RisksPage risks={risks} setRisks={setRisks} highlightedItem={highlightedItem} setHighlightedItem={setHighlightedItem} />;
            case 'Ativos': return <AssetsPage assets={assets} setAssets={setAssets} highlightedItem={highlightedItem} setHighlightedItem={setHighlightedItem} />;
            case 'Obsolescência': return <ObsolescencePage items={obsolescenceItems} setItems={setObsolescenceItems} />;
            case 'Conformidade': return <CompliancePage controls={complianceControls} setControls={setComplianceControls} />;
            case 'Controles de Dados': return <DataControlsPage dataControls={dataControls} setDataControls={setDataControls} />;
            case 'Análise de IA': return <AIAnalysisPage risks={risks} assets={assets} setActivePage={setActivePage} setHighlightedItem={setHighlightedItem} />;
            case 'Configurações':
                return <SettingsPage 
                            users={users} setUsers={setUsers}
                            profiles={profiles} setProfiles={setProfiles}
                            groups={groups} setGroups={setGroups}
                            alertRules={alertRules} setAlertRules={setAlertRules}
                            appData={{ risks, assets, dataControls, complianceControls, obsolescenceItems }}
                            setAppData={{ setRisks, setAssets, setDataControls, setComplianceControls, setObsolescenceItems }}
                        />;
            default: return <DashboardPage risks={risks} controls={complianceControls} />;
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-background">
            <Header user={currentUser} />
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