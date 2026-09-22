<h1 align="center">Organizacion</h1>

<p align="center">
  Monorepo fullstack para gerenciamento de usuarios: API REST protegida por JWT, controle de acesso por perfis (RBAC) e interface web em React.
</p>

<p align="center">
  <img alt="node" src="https://img.shields.io/badge/node-%3E%3D22-3c873a" />
  <img alt="typescript" src="https://img.shields.io/badge/typescript-5-3178c6" />
  <img alt="express" src="https://img.shields.io/badge/express-5-000000" />
  <img alt="react" src="https://img.shields.io/badge/react-19-61dafb" />
  <img alt="coverage" src="https://img.shields.io/badge/coverage-%3E80%25-success" />
</p>

---

## Sobre o projeto

Uma startup precisa disponibilizar uma API REST segura para gerenciar usuarios e integrar com aplicacoes parceiras. Este repositorio entrega essa solucao completa: o back-end com autenticacao JWT e autorizacao por perfil, e uma interface web que demonstra cada recurso — inclusive exibindo, em tempo real, as respostas HTTP de cada chamada.

**Funcionalidades**

- Cadastro de usuarios com nome, e-mail, senha e perfil de acesso
- Consulta de usuarios (listagem paginada com busca e filtro, e consulta individual)
- Atualizacao de nome, e-mail, perfil e status
- Exclusao de usuarios
- Login com emissao de token JWT, renovacao por refresh token e logout
- Controle de acesso por perfis: Administrador, Operador e Cliente
- Console HTTP embutido na interface, mostrando metodo, status, duracao e corpo de cada requisicao

## Stack

| Camada | Tecnologias |
| --- | --- |
| Back-end | Node.js 22+, Express 5, TypeScript, Zod, jsonwebtoken, bcryptjs, helmet, express-rate-limit, SQLite (`node:sqlite`) |
| Front-end | React 19, Vite, TypeScript, Tailwind CSS 4, React Router 7 |
| Compartilhado | Pacote `@organizacion/shared` com tipos, perfis e codigos de erro |
| Testes | Vitest, Supertest, Testing Library (minimo de 80% de cobertura) |
| Infraestrutura | Docker, Docker Compose, Nginx |
| Qualidade | ESLint (flat config), Prettier, Husky |

## Estrutura

```
organizacion/
├── apps/
│   ├── api/          API REST (Express + TypeScript)
│   └── web/          Interface web (React + Vite + Tailwind)
├── packages/
│   └── shared/       Tipos e constantes compartilhados
├── docs/             Documentacao do projeto
└── docker-compose.yml
```

## Requisitos

- [Node.js](https://nodejs.org/) 22 ou superior (o modulo `node:sqlite` e nativo a partir dessa versao)
- npm 10 ou superior
- [Docker](https://www.docker.com/) e Docker Compose (opcional, para a execucao em containers)

## Como executar

### Opcao 1 - Docker (recomendado)

```bash
git clone https://github.com/ManuCoutinho/vite-react-ts-template.git organizacion
cd organizacion

docker compose up --build
```

| Servico | URL |
| --- | --- |
| Interface web | http://localhost:8080 |
| API REST | http://localhost:3333/api |
| Documentacao interativa | http://localhost:3333/api/docs |

Para encerrar e remover o volume de dados:

```bash
docker compose down -v
```

### Opcao 2 - Ambiente local

```bash
npm install
cp apps/api/.env.example apps/api/.env

npm run dev
```

| Servico | URL |
| --- | --- |
| Interface web | http://localhost:5173 |
| API REST | http://localhost:3333/api |
| Documentacao interativa | http://localhost:3333/api/docs |

O comando `npm run dev` compila o pacote compartilhado e sobe a API e a interface em paralelo. O servidor do Vite ja encaminha `/api` para a porta 3333.

## Contas de demonstracao

Criadas automaticamente na primeira execucao. A tela de login traz atalhos para preencher cada uma delas.

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@organizacion.dev` | `Admin@12345` |
| Operador | `operador@organizacion.dev` | `Operador@123` |
| Cliente | `cliente@organizacion.dev` | `Cliente@123` |

> Credenciais destinadas exclusivamente a demonstracao. Em producao, defina `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` e remova as demais contas.

## Endpoints principais

| Metodo | Endpoint | Finalidade | Resposta | Perfis |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | Autenticar e gerar o token JWT | `200 OK` | Publico |
| POST | `/api/auth/register` | Auto cadastro (sempre como Cliente) | `201 Created` | Publico |
| GET | `/api/users` | Listar usuarios | `200 OK` | Administrador, Operador |
| POST | `/api/users` | Criar usuario | `201 Created` | Administrador |
| GET | `/api/users/{id}` | Consultar usuario | `200 OK` | Todos (Cliente: apenas o proprio) |
| PUT | `/api/users/{id}` | Atualizar usuario | `200 OK` | Conforme perfil |
| DELETE | `/api/users/{id}` | Excluir usuario | `204 No Content` | Administrador |

A tabela completa, com todos os codigos de resposta, esta em [docs/API.md](docs/API.md).

## Perfis de acesso

| Operacao | Administrador | Operador | Cliente |
| --- | :---: | :---: | :---: |
| Listar usuarios | Sim | Sim | Nao |
| Consultar usuario | Sim | Sim | Apenas o proprio |
| Criar usuario | Sim | Nao | Nao |
| Atualizar dados cadastrais | Sim | Sim | Apenas os proprios |
| Alterar perfil de acesso | Sim | Nao | Nao |
| Excluir usuario | Sim | Nao | Nao |

## Scripts

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Sobe a API e a interface em modo de desenvolvimento |
| `npm run build` | Compila o pacote compartilhado, a API e a interface |
| `npm test` | Executa os testes de todos os workspaces |
| `npm run test:coverage` | Executa os testes com relatorio de cobertura |
| `npm run typecheck` | Verifica os tipos de todos os pacotes |
| `npm run lint` | Analisa o codigo com ESLint |
| `npm run format` | Formata o codigo com Prettier |
| `npm run docker:up` | Sobe a stack completa em containers |
| `npm run docker:down` | Derruba a stack e remove os volumes |

## Testes

```bash
npm test
npm run test:coverage
```

| Pacote | Testes | Cobertura de linhas |
| --- | --- | --- |
| `@organizacion/api` | 72 | ~96% |
| `@organizacion/web` | 58 | ~96% |

Limite minimo configurado em ambos: 80% em linhas, funcoes, ramos e instrucoes. O build falha abaixo disso.

## Variaveis de ambiente

Arquivo de referencia em [apps/api/.env.example](apps/api/.env.example).

| Variavel | Padrao | Descricao |
| --- | --- | --- |
| `PORT` | `3333` | Porta da API |
| `DATABASE_FILE` | `./data/organizacion.db` | Caminho do banco SQLite |
| `JWT_SECRET` | — | Segredo de assinatura (minimo 32 caracteres; **obrigatorio** em producao) |
| `JWT_ISSUER` | `organizacion-api` | Emissor esperado do token |
| `JWT_AUDIENCE` | `organizacion-web` | Publico esperado do token |
| `ACCESS_TOKEN_TTL_MINUTES` | `60` | Validade do access token |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | Validade do refresh token |
| `BCRYPT_ROUNDS` | `12` | Custo do hash de senha |
| `CORS_ORIGINS` | `http://localhost:5173` | Origens autorizadas, separadas por virgula. Fora de producao, `localhost`, `127.0.0.1` e `::1` sao liberados em qualquer porta |
| `LOGIN_RATE_LIMIT_MAX` | `5` | Tentativas de login por janela |
| `LOGIN_RATE_LIMIT_WINDOW_MINUTES` | `15` | Duracao da janela de rate limit |

## Documentacao

| Documento | Conteudo |
| --- | --- |
| [docs/API.md](docs/API.md) | Endpoints, codigos de resposta, JWT, RBAC, OAuth 2.0 e analise de seguranca |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Estrutura do monorepo, camadas e decisoes tecnicas |
| `/api/docs` | Swagger UI servido pela propria API |

## Licenca

Distribuido sob a licenca MIT. Consulte [LICENSE.md](LICENSE.md).
