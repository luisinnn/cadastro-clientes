# Cadastro de Clientes

App simples para um pequeno negócio cadastrar seus clientes. Cada usuário faz login e só enxerga e altera os **próprios** clientes.

**Stack:** Next.js 16 (App Router, TypeScript) + Supabase (Auth + Postgres com RLS) + Tailwind CSS 4.

## Funcionalidades

- Login e cadastro com e-mail e senha (Supabase Auth)
- Listar, criar, editar e excluir clientes (nome, telefone, e-mail, observações)
- Segurança no banco com RLS: mesmo que o código tenha um bug, o Postgres não entrega dados de outro usuário

## Pré-requisitos

- Node.js 20.9 ou mais novo (`node -v`)
- Uma conta gratuita em [supabase.com](https://supabase.com)

## Como rodar

### 1. Criar o projeto no Supabase

1. Em [supabase.com/dashboard](https://supabase.com/dashboard), clique em **New project**, escolha nome, senha do banco e região (ex.: São Paulo).
2. Aguarde o projeto ficar pronto (1–2 min).

### 2. Criar a tabela e as regras de segurança

1. No menu do projeto, abra **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Confira em **Table Editor** que a tabela `clientes` apareceu com o selo "RLS enabled".

### 3. Configurar a autenticação

Em **Authentication** → **URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** adicione `http://localhost:3000/**`

Isso permite que o link do e-mail de confirmação volte para o app (rota `/auth/callback`).

> **Dica para testes:** o servidor de e-mail embutido do Supabase envia poucos e-mails por hora. Para testar mais rápido, você pode desligar a confirmação em **Authentication** → **Sign In / Providers** → **Email** → desmarcar **Confirm email**. Com isso, o cadastro já entra direto. Em produção, deixe ligado.

### 4. Configurar as variáveis de ambiente

```bash
cp .env.example .env.local
```

(No PowerShell: `Copy-Item .env.example .env.local`)

Preencha o `.env.local` com os dados de **Project Settings** → **API Keys** / **Data API**:

| Variável | Onde achar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (ex.: `https://abcd1234.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave **publishable** (`sb_publishable_...`) ou a antiga **anon** |

> ⚠️ Nunca use a chave **secret** / **service_role** neste app: ela ignora o RLS. O `.env.local` já está no `.gitignore` e não vai para o Git.

### 5. Instalar e rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Você será levado à tela de login. Crie uma conta e comece a cadastrar.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (recarrega ao salvar) |
| `npm run build` | Gera a versão de produção (também checa tipos) |
| `npm start` | Roda a versão de produção (depois do build) |
| `npm run lint` | Procura problemas no código (ESLint) |
| `npm run typecheck` | Checa os tipos do TypeScript (sem gerar build) |
| `npm test` | Roda os testes uma vez (Vitest) |
| `npm run test:watch` | Roda os testes e repete a cada arquivo salvo |

## CI/CD

- **CI (GitHub Actions)**, em [`.github/workflows/ci.yml`](.github/workflows/ci.yml): a cada push na `main` e em todo pull request, roda lint → tipos → testes → build. O resultado aparece na aba **Actions** do GitHub.
- **CD (Vercel)**: a cada push na `main`, a Vercel faz o build e publica. Pull requests ganham uma URL de preview.

## Estrutura do projeto

```
.github/workflows/ci.yml      Pipeline de CI (GitHub Actions)
vitest.config.mts             Configuração dos testes
supabase/schema.sql           Tabela "clientes" + políticas RLS (rodar no SQL Editor)
src/proxy.ts                  Roda antes de cada página: renova a sessão e barra quem não está logado
src/lib/supabase/server.ts    Cria o cliente Supabase no servidor (lê/grava a sessão nos cookies)
src/lib/auth.ts               getUsuario(): quem está logado? (ou redireciona para /login)
src/lib/clientes.ts           Consultas de leitura (listar, buscar por id)
src/lib/validacao-cliente.ts  Regras de validação do formulário (+ testes em .test.ts)
next.config.ts                "/" → redireciona para /clientes (redirects)
src/app/login/                Tela de login/cadastro + ações entrar, cadastrar, sair
src/app/auth/callback/        Recebe o link de confirmação do e-mail e cria a sessão
src/app/clientes/             Telas de clientes:
  layout.tsx                    cabeçalho com e-mail do usuário e botão Sair
  page.tsx                      lista
  novo/page.tsx                 criar
  [id]/editar/page.tsx          editar
  actions.ts                    ações criar, atualizar, excluir (rodam no servidor)
  form-cliente.tsx              formulário compartilhado (criar/editar)
  botao-excluir.tsx             botão com confirmação
```

## Como a segurança funciona (3 camadas)

1. **Proxy** (`src/proxy.ts`): quem não está logado nem chega às páginas de `/clientes`.
2. **Servidor**: cada página e cada ação chamam `getUsuario()` de novo, que valida o token com `getClaims()`.
3. **Banco (RLS)**: as políticas em `schema.sql` só deixam ler e alterar linhas em que `user_id = auth.uid()`. Essa é a camada que realmente garante o isolamento.

## Observações sobre o Next.js 16

- O antigo `middleware.ts` agora se chama **`proxy.ts`**.
- O projeto usa **Cache Components** (`next.config.ts`): tudo o que depende do usuário logado (cookies) fica dentro de um `<Suspense>`, e o restante da página aparece na hora.
- O arquivo `AGENTS.md` foi gerado pelo Next para orientar assistentes de IA. Pode manter.
