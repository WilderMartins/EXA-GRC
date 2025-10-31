# EXA GRC - Plataforma de Gestão de Riscos de Segurança da Informação

Bem-vindo à EXA GRC, uma plataforma de Governança, Risco e Conformidade (GRC) de código aberto, projetada para ajudar organizações a gerenciar riscos de segurança da informação de forma eficiente e colaborativa. Inspirada em frameworks de mercado como NIST CSF e CIS Controls, a ferramenta oferece uma visão centralizada para identificar, avaliar, tratar e monitorar riscos.

Esta versão final da plataforma é construída como uma Aplicação de Página Única (SPA) moderna, utilizando React e TailwindCSS, e é impulsionada por um backend robusto e escalável na nuvem com o **Google Firebase Firestore**, permitindo colaboração em tempo real entre múltiplos usuários.

## Funcionalidades Principais (Versão Final)

*   **Instalação Amigável:** Um wizard de instalação passo a passo que guia o administrador na configuração da conexão com o banco de dados Firebase na nuvem, sem precisar editar código.
*   **Backend na Nuvem (Firebase):** Todos os dados são armazenados de forma segura e persistente no Firestore, um banco de dados NoSQL do Google.
*   **Colaboração em Tempo Real:** As atualizações feitas por um usuário (ex: adicionar um novo risco) são refletidas instantaneamente nas telas de todos os outros usuários conectados, sem a necessidade de recarregar a página.
*   **Dashboard Centralizado:** Uma visão geral do estado da segurança, com métricas chave como riscos abertos, nível de risco residual e eficácia dos controles.
*   **Gestão de Riscos (CRUD Completo):** Crie, visualize, edite e exclua riscos, vinculando-os a ativos, ameaças e controles para uma análise completa.
*   **Configuração de IA na Interface:** Configure a chave de API do Google Gemini diretamente nas configurações da aplicação, sem tocar no código-fonte.
*   **Autenticação Segura:** Sistema de login para proteger o acesso à plataforma.
*   **Interface Moderna e Responsiva:** Construída com TailwindCSS para uma experiência de usuário limpa e agradável em qualquer dispositivo.

## Guia de Instalação e Deploy (Passo a Passo)

Para colocar a EXA GRC em funcionamento para sua equipe, você precisará de uma conta no Google para configurar o banco de dados na nuvem (Firebase). O processo é gratuito e leva cerca de 5 minutos.

### Passo 1: Criar o Banco de Dados na Nuvem (Firebase)

1.  **Acesse o Firebase:** Abra seu navegador e vá para [firebase.google.com](https://firebase.google.com). Clique em "Começar" e faça login com sua conta do Google.

2.  **Crie um Novo Projeto:**
    *   [IMAGEM: Tela do Firebase com o botão 'Criar projeto' destacado]
    *   Clique em **"Criar um projeto"**.
    *   Dê um nome ao seu projeto, por exemplo, `exa-grc-minha-empresa`.
    *   Aceite os termos e continue. Você pode desativar o Google Analytics para este projeto se desejar.
    *   Aguarde a criação do projeto.

3.  **Crie uma Aplicação Web:**
    *   [IMAGEM: Tela principal do projeto com ícones de plataformas (iOS, Android, Web). O ícone da Web (`</>`) está destacado.]
    *   Na tela principal do seu novo projeto, clique no ícone da Web (`</>`) para adicionar um aplicativo da Web.
    *   Dê um apelido ao seu aplicativo, como "EXA GRC Web App".
    *   Clique em **"Registrar aplicativo"**. Não precisa configurar o Firebase Hosting.

4.  **Copie o Objeto de Configuração:**
    *   [IMAGEM: Tela mostrando o código de configuração do Firebase, começando com `const firebaseConfig = { ... };`]
    *   O Firebase exibirá um objeto de configuração. É um bloco de texto que se parece com isto:
        ```javascript
        const firebaseConfig = {
          apiKey: "AIza...",
          authDomain: "seu-projeto.firebaseapp.com",
          projectId: "seu-projeto",
          storageBucket: "seu-projeto.appspot.com",
          messagingSenderId: "12345...",
          appId: "1:12345..."
        };
        ```
    *   **Copie todo o objeto, incluindo as chaves `{` e `}`.** Este é o "cérebro" que conecta a aplicação ao seu banco de dados.

5.  **Ative o Banco de Dados Firestore:**
    *   [IMAGEM: Menu lateral esquerdo do Firebase com 'Cloud Firestore' destacado.]
    *   No menu à esquerda, vá para **"Build" > "Cloud Firestore"**.
    *   Clique em **"Criar banco de dados"**.
    *   Selecione **"Iniciar no modo de teste"**. Isso permite que a aplicação escreva os dados iniciais.
    *   **AVISO IMPORTANTE:** O modo de teste permite que qualquer pessoa leia e escreva no seu banco de dados. É ótimo para a instalação, mas **NÃO é seguro para produção**. Veja a seção de segurança abaixo.
    *   Escolha um local para seus servidores (geralmente o mais próximo de você) e clique em "Ativar".

### Passo 2: Configurar a Aplicação EXA GRC

Agora que o banco de dados está pronto, vamos configurar a aplicação.

1.  **Abra a Aplicação:** Carregue a EXA GRC no seu navegador. Como é a primeira vez, você verá o **Wizard de Instalação**.

2.  **Conecte ao Firebase:**
    *   [IMAGEM: Tela do wizard da EXA GRC, na etapa 1, mostrando uma grande caixa de texto.]
    *   Na primeira etapa do wizard, **cole o objeto `firebaseConfig`** que você copiou anteriormente na caixa de texto.
    *   Clique em **"Conectar e Continuar"**. O sistema irá testar a conexão.

3.  **Crie o Usuário Administrador:**
    *   Na segunda etapa, preencha as informações para criar a primeira conta de usuário, que será o administrador da plataforma.
    *   Use um email e uma senha fortes.
    *   Clique em **"Criar Administrador e Finalizar"**. O sistema irá criar o usuário e popular o banco de dados com dados iniciais (exemplos de ativos, ameaças, etc.).

4.  **Instalação Concluída!**
    *   Você será redirecionado para a tela de login. Use o email e a senha do administrador que você acabou de criar para acessar a plataforma.

### Passo 3: Configurar a Inteligência Artificial (Opcional)

Para usar as funcionalidades de IA (que serão expandidas no futuro), você precisa de uma chave de API do Google Gemini.

1.  **Obtenha uma Chave de API:** Vá para [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) para gerar sua chave gratuita.
2.  **Configure na Aplicação:**
    *   Dentro da EXA GRC, vá para a página **"Configurações"** no menu lateral.
    *   Cole sua chave de API no campo apropriado e clique em "Salvar". A chave será salva de forma segura no seu navegador.

---

### ⚠️ AVISO DE SEGURANÇA IMPORTANTE (PRODUÇÃO)

As regras de segurança que você configurou no "modo de teste" são inseguras para um ambiente de produção com dados reais. Elas permitem que qualquer pessoa com o ID do seu projeto leia e apague todos os seus dados.

**Antes de usar a EXA GRC com dados sensíveis, é CRUCIAL que você atualize as regras de segurança do Firestore para permitir acesso apenas a usuários autenticados.**

Este é um tópico complexo, mas um ponto de partida para regras mais seguras seria algo como:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite leitura e escrita apenas se o usuário estiver logado.
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Recomendamos fortemente que um desenvolvedor ou profissional de segurança revise e personalize essas regras para atender às necessidades da sua organização antes do deploy final.**
