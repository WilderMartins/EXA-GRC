# EXA GRC - Plataforma de Gestão de Riscos de Segurança da Informação

Bem-vindo à EXA GRC, uma plataforma de Governança, Risco e Conformidade (GRC) de código aberto, projetada para ajudar organizações a gerenciar riscos de segurança da informação de forma eficiente e colaborativa. Inspirada em frameworks de mercado como NIST CSF e CIS Controls, a ferramenta oferece uma visão centralizada para identificar, avaliar, tratar e monitorar riscos.

Esta versão da plataforma é construída como uma Aplicação de Página Única (SPA) moderna, utilizando React e TailwindCSS, e é impulsionada por um backend robusto e escalável na nuvem com o **Google Firebase**, permitindo colaboração em tempo real entre múltiplos usuários.

## Funcionalidades Principais

*   **Instalação Segura e Amigável:** Um wizard de instalação passo a passo que guia o administrador na configuração da conexão com o Firebase, criação do usuário administrador e aplicação de regras de segurança essenciais, sem precisar editar código.
*   **Autenticação Segura com Firebase:** Utiliza o sistema de autenticação nativo do Google Firebase, garantindo que as senhas dos usuários sejam armazenadas de forma segura (com hash e salt).
*   **Backend na Nuvem (Firestore):** Todos os dados são armazenados de forma segura e persistente no Firestore, um banco de dados NoSQL do Google.
*   **Colaboração em Tempo Real:** As atualizações feitas por um usuário são refletidas instantaneamente para todos os outros usuários conectados.
*   **Dashboard Dinâmico:** Uma visão geral do estado da segurança, com métricas chave em tempo real, como riscos abertos, risco residual médio, e scores de cobertura para os frameworks NIST e CIS.
*   **Gestão de Riscos (CRUD Completo):** Crie, visualize, edite e exclua riscos, vinculando-os a ativos, ameaças e controles.
*   **Gestão de Usuários (CRUD Completo):** Crie, visualize, edite e exclua usuários, com permissões de administrador e analista.
*   **Sugestão de Controles com IA:** Utilize o poder do Google Gemini para sugerir controles de segurança apropriados com base no ativo e na ameaça selecionados.
*   **Configuração de IA na Interface:** Configure a chave de API do Google Gemini diretamente nas configurações da aplicação.
*   **Interface Moderna e Responsiva:** Construída com TailwindCSS para uma experiência de usuário limpa em qualquer dispositivo.

## Guia de Instalação e Deploy (Passo a Passo)

Para colocar a EXA GRC em funcionamento, você precisará de uma conta no Google para configurar o backend na nuvem (Firebase). O processo é gratuito e leva cerca de 5 minutos.

### Passo 1: Preparar o Ambiente na Nuvem (Firebase)

1.  **Acesse o Firebase:** Vá para [firebase.google.com](https://firebase.google.com) e faça login com sua conta do Google.

2.  **Crie um Novo Projeto:**
    *   Clique em **"Criar um projeto"**.
    *   Dê um nome ao seu projeto (ex: `exa-grc-minha-empresa`).
    *   Aceite os termos e continue. Você pode desativar o Google Analytics.

3.  **Ative a Autenticação:**
    *   No menu à esquerda, vá para **Build > Authentication**.
    *   Clique em **"Começar"**.
    *   Na aba **"Sign-in method"**, selecione **"E-mail/senha"** e ative-o.

4.  **Crie uma Aplicação Web:**
    *   Volte para a tela principal do projeto (clicando na engrenagem ⚙️ e em "Configurações do projeto").
    *   Na seção "Seus apps", clique no ícone da Web (`</>`).
    *   Dê um apelido ao seu aplicativo (ex: "EXA GRC Web App") e clique em **"Registrar aplicativo"**.

5.  **Copie o Objeto de Configuração:**
    *   O Firebase exibirá um objeto de configuração `firebaseConfig`.
    *   **Copie todo o objeto, incluindo as chaves `{` e `}`.** Você precisará dele no próximo passo.

6.  **Ative o Banco de Dados Firestore:**
    *   No menu à esquerda, vá para **Build > Cloud Firestore**.
    *   Clique em **"Criar banco de dados"**.
    *   **IMPORTANTE:** Selecione **"Iniciar no modo de teste"**. Isso é temporário e necessário para que o wizard de instalação possa escrever os dados iniciais. O próprio wizard o guiará para proteger o banco de dados na etapa final.
    *   Escolha um local para seus servidores e clique em "Ativar".

### Passo 2: Configurar a Aplicação com o Wizard de Instalação

Com o ambiente Firebase pronto, abra a aplicação EXA GRC no seu navegador. Você será recebido pelo wizard de instalação.

1.  **Etapa 1: Conectar ao Firebase**
    *   Na primeira tela, **cole o objeto `firebaseConfig`** que você copiou anteriormente.
    *   Clique em **"Conectar e Continuar"**. O sistema testará a conexão.

2.  **Etapa 2: Criar o Usuário Administrador**
    *   Preencha as informações para criar a primeira conta de usuário, que será o administrador da plataforma.
    *   Use um email e uma senha forte (mínimo de 6 caracteres).
    *   Clique em **"Criar Administrador"**. O sistema criará o usuário no Firebase Authentication e populará o banco de dados com dados iniciais.

3.  **Etapa 3: Proteger o Banco de Dados**
    *   Esta é a etapa mais crítica para a segurança dos seus dados.
    *   O wizard exibirá um conjunto de **regras de segurança** que garantem que apenas usuários autenticados possam acessar os dados.
    *   Siga as instruções na tela:
        *   Clique no link para ir diretamente à página de regras do seu Firestore.
        *   Copie as regras fornecidas pelo wizard.
        *   Cole-as no editor de regras do Firebase, substituindo o conteúdo existente.
        *   Clique em **"Publicar"** no Firebase.
    *   Após publicar as regras, volte ao wizard e clique em **"Já atualizei as regras, finalizar instalação"**.

4.  **Instalação Concluída!**
    *   Você será redirecionado para a tela de login. Use o email e a senha do administrador que você acabou de criar para acessar a plataforma.

### Passo 3: Configurar a Inteligência Artificial (Opcional)

1.  **Obtenha uma Chave de API:** Vá para [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) para gerar sua chave gratuita do Google Gemini.
2.  **Configure na Aplicação:**
    *   Dentro da EXA GRC, acesse a página **"Configurações"**.
    *   Cole sua chave de API no campo apropriado e clique em "Salvar". A chave é armazenada com segurança no seu navegador.

### Desenvolvimento Local

Se você deseja executar a aplicação localmente para desenvolvimento:

1.  Clone o repositório: `git clone <url-do-repositorio>`
2.  Instale as dependências: `npm install`
3.  Crie um arquivo `.env` na raiz do projeto e adicione a configuração do seu projeto Firebase (a mesma que seria usada no wizard de instalação):

    ```
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
4.  Execute o servidor de desenvolvimento: `npm run dev`
