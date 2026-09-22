# Arquitetura do monorepo

## Estrutura de diretorios

```
organizacion/
├── apps/
│   ├── api/                     API REST (Node.js + Express + TypeScript)
│   │   ├── src/
│   │   │   ├── config/          Validacao das variaveis de ambiente (Zod)
│   │   │   ├── controllers/     Traducao HTTP <-> dominio
│   │   │   ├── db/              Conexao SQLite, migracao e seed
│   │   │   ├── docs/            Especificacao OpenAPI 3.0
│   │   │   ├── domain/          Tipos e mapeadores do registro de usuario
│   │   │   ├── middlewares/     Autenticacao, autorizacao, validacao, erros, rate limit
│   │   │   ├── policies/        Regras de RBAC e ownership
│   │   │   ├── repositories/    Acesso a dados com prepared statements
│   │   │   ├── routes/          Definicao dos endpoints
│   │   │   ├── schemas/         Schemas Zod de entrada
│   │   │   ├── services/        Regras de negocio
│   │   │   ├── utils/           JWT, hash de senha, erros HTTP
│   │   │   └── __tests__/       Testes de integracao com Supertest
│   │   └── Dockerfile
│   └── web/                     Interface web (React + Vite + Tailwind CSS)
│       ├── src/
│       │   ├── components/      Componentes de UI e de dominio
│       │   ├── contexts/        Contexto de autenticacao
│       │   ├── hooks/           useAuth, useApiLog, useToast
│       │   ├── lib/             Cliente HTTP, log de chamadas, formatadores
│       │   ├── pages/           Login, Cadastro, Usuarios, Perfil, 404
│       │   └── __tests__/       Testes com Testing Library
│       ├── nginx.conf
│       └── Dockerfile
├── packages/
│   └── shared/                  Tipos e constantes compartilhados (perfis, DTOs, codigos de erro)
├── docs/                        Documentacao do projeto
├── docker-compose.yml
└── eslint.config.mjs
```

## Por que um monorepo

O pacote `@organizacion/shared` e a razao principal. Os perfis de acesso (`ADMIN`, `OPERATOR`, `CLIENT`), o formato do usuario, o envelope de erro e os codigos de erro sao declarados **uma unica vez** e consumidos pelos dois lados. Se um perfil for renomeado, a compilacao quebra no front-end e no back-end simultaneamente — o erro aparece no build, nao em producao.

Os workspaces do npm cuidam da instalacao unificada, e o versionamento conjunto garante que a interface e a API nunca saiam de sincronia.

## Camadas da API

```
Requisicao HTTP
  ↓
helmet · CORS · rate limit · express.json
  ↓
Rota  ──────────────────────────────────────────
  ↓
authenticate   valida o JWT e carrega o usuario
  ↓
authorize      barra perfis nao autorizados
  ↓
validate       valida body, query e params com Zod
  ↓
Controller     traduz HTTP para chamadas de servico
  ↓
Policy         aplica RBAC e regras de ownership
  ↓
Service        regras de negocio e orquestracao
  ↓
Repository     prepared statements sobre o SQLite
  ↓
errorHandler   converte qualquer falha no envelope padrao
```

Cada camada tem uma responsabilidade unica. Os controllers nao contem regra de negocio, os servicos nao conhecem `Request`/`Response`, e os repositorios nao decidem permissoes. Isso torna cada parte testavel de forma isolada.

## Decisoes tecnicas

| Decisao | Alternativa considerada | Justificativa |
| --- | --- | --- |
| **SQLite via `node:sqlite`** | PostgreSQL em container | Modulo nativo do Node 22+, sem dependencia externa nem compilacao. O projeto sobe com um comando e os testes usam `:memory:`, ficando rapidos e isolados. A troca por PostgreSQL exigiria mudar apenas a camada de repositorio. |
| **Zod para validacao** | `express-validator`, Joi | Inferencia de tipos em tempo de compilacao: o schema e a fonte unica do tipo e da validacao. Tambem valida as variaveis de ambiente na inicializacao. |
| **bcrypt com 12 rounds** | Argon2id, 10 rounds | Custo aproximado de 250 ms por hash, suficiente para inviabilizar forca bruta em GPU sem degradar o login. Argon2id seria a escolha ideal em producao, mas exige compilacao nativa. |
| **Refresh token com rotacao** | Apenas access token | Permite manter o access token curto (1 h) sem obrigar o usuario a refazer login. A rotacao detecta reuso, indicio de roubo de token. |
| **Politicas separadas dos controllers** | Verificacoes inline | Regras de autorizacao concentradas e testaveis. Uma rota nova nao "esquece" uma verificacao espalhada. |
| **Tailwind CSS v4** | CSS Modules, styled-components | Integracao nativa com o Vite, sem arquivo de configuracao. Os tokens de design ficam em `@theme`, no proprio CSS. |
| **Log de chamadas na interface** | Somente o DevTools | O enunciado pede a exibicao das respostas da API. O console embutido mostra metodo, URL, status, duracao e corpo de cada chamada, evidenciando o comportamento do RBAC ao vivo. |

## Fluxo de autenticacao no front-end

1. `AuthProvider` monta e procura uma sessao no `localStorage`.
2. Havendo token, chama `GET /api/auth/me` para validar e hidratar o usuario.
3. O cliente HTTP injeta `Authorization: Bearer <token>` em toda chamada autenticada.
4. Diante de um `401`, tenta **uma** renovacao via `POST /api/auth/refresh` e repete a requisicao original de forma transparente.
5. Se a renovacao falhar, limpa a sessao e o `ProtectedRoute` redireciona para o login.

## Estrategia de testes

| Camada | Ferramenta | Cobertura |
| --- | --- | --- |
| API | Vitest + Supertest | Testes de integracao ponta a ponta sobre o app Express, com banco em memoria |
| Interface | Vitest + Testing Library | Interacao do usuario com `fetch` mockado, consultando por papel acessivel |

Os testes da API exercitam a matriz de permissoes inteira: para cada operacao ha um caso de sucesso e casos de `401`, `403`, `404` e `409` conforme aplicavel. Os testes da interface verificam que os elementos restritos nao sao renderizados para perfis sem permissao.

Limite minimo configurado: **80%** em linhas, funcoes, ramos e instrucoes, nos dois pacotes.
