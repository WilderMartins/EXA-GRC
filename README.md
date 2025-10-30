# EXA GRC - Plataforma Integrada de Gestão de Riscos e Conformidade

## 1. Visão Geral

EXA GRC é uma aplicação web moderna e interativa, projetada para ser uma plataforma centralizada de Governança, Risco e Conformidade (GRC). Ela permite que as organizações identifiquem, avaliem, monitorem e gerenciem seus riscos de segurança da informação, ativos tecnológicos, status de conformidade com frameworks de mercado e ciclo de vida de tecnologias.

A aplicação utiliza uma interface de usuário reativa construída com React e TypeScript, e integra o poder da Inteligência Artificial do Google Gemini para fornecer análises de impacto preditivas e inteligentes.

## 2. Funcionalidades Principais

A plataforma é dividida nos seguintes módulos:

### a. Dashboard
- **Visão Geral:** Apresenta um resumo consolidado do estado da segurança e conformidade da organização.
- **Widgets:**
    - **Estatísticas Rápidas:** Cards que exibem a contagem de riscos por status (Aberto, Em Andamento, Mitigado, Aceito).
    - **Heatmap de Riscos:** Matriz de Risco (Probabilidade vs. Impacto) que visualiza a distribuição e a severidade dos riscos.
    - **Resumo por Categoria:** Tabela que agrupa e totaliza os riscos por tipo (Operacional, Segurança, etc.).
    - **Resumo de Conformidade:** Tabela que exibe o nível de implementação de controles para os frameworks de mercado (NIST, CIS, LGPD).

### b. Gestão de Riscos
- **Tabela Centralizada:** Exibe todos os riscos com informações detalhadas como ID, descrição, classificação, status do prazo, responsável e aging.
- **CRUD Completo:** Funcionalidades para Adicionar, Editar e Excluir riscos através de um modal detalhado.
- **Cálculos Automáticos:** A classificação (Crítico, Alto, Médio, Baixo) e o status do prazo (Atrasado, No Prazo, Finalizado) são calculados e exibidos dinamicamente.
- **Importação/Exportação:** Permite a importação em massa de riscos via arquivo CSV e o download de um template para preenchimento.

### c. Gestão de Ativos
- **Inventário:** Módulo para catalogar e gerenciar os ativos de tecnologia da informação (servidores, aplicações, bancos de dados, etc.).
- **CRUD de Ativos:** Funcionalidades para Adicionar, Editar e Excluir ativos.
- **Importação/Exportação:** Suporte para importação e exportação de ativos via CSV.

### d. Gestão de Obsolescência
- **Ciclo de Vida:** Monitora o ciclo de vida de hardware e software, exibindo datas de Fim de Vida (EOL) and Fim de Suporte (EOS).
- **Status Automatizado:** Classifica automaticamente os itens como "Suportado", "Próximo do Fim" ou "Obsoleto" com base nas datas, utilizando um código de cores para alerta visual.
- **CRUD de Itens:** Permite o registro e acompanhamento de todos os itens de tecnologia sujeitos à obsolescência.

### e. Conformidade
- **Frameworks:** Módulo para gerenciar e monitorar a conformidade com frameworks de segurança e privacidade, como NIST CSF 2.0, CIS Controls v8 e LGPD.
- **Visualização de Controles:** Tabela detalhada com todos os controles, seus status de implementação e, para o NIST, scores de maturidade.
- **Edição de Status:** Permite atualizar o status de cada controle para refletir o progresso da implementação.

### f. Controles de Dados
- **Foco em Privacidade:** Módulo específico para gerenciar controles relacionados à proteção de dados e privacidade (ex: LGPD).
- **CRUD de Controles:** Funcionalidades para Adicionar, Editar e Excluir controles de dados.

### g. Análise de Impacto com IA
- **Motor Preditivo:** Utiliza a API do Google Gemini para analisar cenários de risco.
- **Análise Quantitativa e Qualitativa:** O usuário seleciona um risco ou ativo, descreve um cenário, e a IA retorna uma análise completa sobre:
    - Impacto Financeiro (com estimativa de custo em BRL).
    - Impacto Reputacional, Operacional e de Conformidade.
    - Recomendações de mitigação.

### h. Configurações
- **Gestão de Acesso:** Módulo completo para gerenciar a segurança da plataforma.
    - **Perfis:** Criação de perfis de acesso com permissões específicas.
    - **Grupos:** Criação de grupos de usuários para facilitar a atribuição de responsabilidades.
    - **Usuários:** Cadastro de usuários e associação a perfis e grupos.
- **Gestão de Dados:**
    - **Exportação:** Ferramentas para exportar todos os dados da aplicação (riscos, ativos, etc.) para CSV.
    - **Reset de Dados:** Funcionalidade para restaurar a aplicação ao seu estado inicial (mock data), útil para ambientes de teste.

## 3. Tecnologias Utilizadas

- **Frontend:**
    - **React 19:** Biblioteca principal para a construção da interface de usuário.
    - **TypeScript:** Superset do JavaScript que adiciona tipagem estática para maior robustez do código.
    - **Tailwind CSS:** Framework de CSS utility-first para estilização rápida e responsiva.
    - **Lucide React:** Biblioteca de ícones SVG, leve e customizável.
- **Inteligência Artificial:**
    - **Google Gemini API (@google/genai):** Utilizada no módulo de Análise de Impacto para gerar insights preditivos.
- **Ambiente de Execução:**
    - O código é projetado para rodar em um ambiente que suporte módulos ES6 e variáveis de ambiente (para a chave da API).

## 4. Estrutura do Projeto

O projeto é contido em um único arquivo `index.tsx`, que é o ponto de entrada da aplicação React.

- **`index.html`**: A página HTML base que carrega os scripts, a configuração do Tailwind CSS e define a estrutura inicial da página.
- **`index.tsx`**: Contém toda a lógica da aplicação, incluindo:
    - **Estruturas de Dados:** Definição de todas as `interfaces` e `enums` (Risk, Asset, Control, User, etc.).
    - **Dados Mockados:** Conjuntos de dados iniciais para popular a aplicação.
    - **Componentes React:** Todos os componentes de UI (Header, Sidebar, Cards, Tabelas, Modais, etc.).
    - **Lógica de Páginas:** Componentes que representam cada módulo/página da aplicação.
    - **Estado Global:** O componente principal `App` gerencia o estado de toda a aplicação (listas de riscos, ativos, etc.).
- **`metadata.json`**: Arquivo de metadados da aplicação.
- **`README.md`**: Este arquivo.

## 5. Modelos de Dados Principais

```typescript
// Risco
interface Risk {
  id: number;
  creationDate: string;
  title: string;
  description: string;
  probability: number; // 1-5
  impact: number;      // 1-5
  status: RiskStatus;
  owner: string;
  dueDate: string;
  // ... e outros campos
}

// Ativo
interface Asset {
    id: number;
    name: string;
    type: AssetType;
    criticality: AssetCriticality;
    owner: string;
}

// Item de Obsolescência
interface ObsolescenceItem {
    id: number;
    assetName: string;
    assetType: ObsolescenceAssetType;
    vendor: string;
    version: string;
    endOfSupportDate: string;
    // ... e outros campos
}

// Usuário, Perfil e Grupo
interface User { id: number; name: string; email: string; profileId: number; }
interface Profile { id: number; name: string; description: string; permissions: string[]; }
interface Group { id: number; name: string; description: string; memberIds: number[]; }
```

## 6. Como Continuar o Desenvolvimento

Para evoluir a aplicação, siga os seguintes passos:

1.  **Entenda a Estrutura:** Familiarize-se com a estrutura de componentes e o gerenciamento de estado no arquivo `index.tsx`. O estado é centralizado no componente `App` e passado para os componentes filhos via props.
2.  **Crie Novos Componentes:** Ao adicionar uma nova funcionalidade, crie novos componentes React que sejam reutilizáveis e sigam o estilo visual existente.
3.  **Expanda os Modelos de Dados:** Se necessário, adicione novas propriedades às interfaces existentes ou crie novas interfaces para suportar as novas funcionalidades. Não se esqueça de atualizar os dados mockados correspondentes.
4.  **Integre com a API Gemini:** Para novas funcionalidades de IA, crie funções assíncronas que montem um prompt claro e, se possível, utilizem o `responseSchema` para garantir uma resposta JSON estruturada e previsível.
5.  **Mantenha o README Atualizado:** Documente quaisquer novas funcionalidades, mudanças na arquitetura ou novos modelos de dados neste arquivo.
