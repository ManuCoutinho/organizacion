# Documentacao da API REST

Base URL local: `http://localhost:3333/api`
Documentacao interativa (Swagger UI): `http://localhost:3333/api/docs`
Especificacao OpenAPI 3.0: `http://localhost:3333/api/openapi.json`

---

## 1. Modelagem da API (Parte 1)

### 1.1 Endpoints de gerenciamento de usuarios

| Metodo | Endpoint | Finalidade | Resposta esperada | Perfis autorizados |
| --- | --- | --- | --- | --- |
| GET | `/api/users` | Listar usuarios cadastrados (com busca, filtro e paginacao) | `200 OK` | Administrador, Operador |
| POST | `/api/users` | Criar um novo usuario informando o perfil de acesso | `201 Created` | Administrador |
| GET | `/api/users/{id}` | Consultar um usuario especifico | `200 OK` | Administrador, Operador, Cliente (apenas o proprio) |
| PUT | `/api/users/{id}` | Atualizar nome, e-mail, perfil e status | `200 OK` | Administrador, Operador, Cliente (regras por perfil) |
| PATCH | `/api/users/{id}` | Atualizacao parcial dos mesmos campos | `200 OK` | Administrador, Operador, Cliente (regras por perfil) |
| DELETE | `/api/users/{id}` | Excluir um usuario do sistema | `204 No Content` | Administrador |
| PATCH | `/api/users/{id}/password` | Alterar a senha do usuario | `204 No Content` | O proprio usuario ou Administrador |

### 1.2 Endpoints de autenticacao

| Metodo | Endpoint | Finalidade | Resposta esperada | Autenticacao |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | Validar e-mail e senha e emitir o token JWT | `200 OK` | Publico |
| POST | `/api/auth/register` | Auto cadastro publico (sempre perfil Cliente) | `201 Created` | Publico |
| POST | `/api/auth/refresh` | Renovar o access token a partir do refresh token | `200 OK` | Publico (exige refresh token valido) |
| POST | `/api/auth/logout` | Revogar o refresh token da sessao | `204 No Content` | Bearer JWT |
| GET | `/api/auth/me` | Retornar o usuario dono do token | `200 OK` | Bearer JWT |

### 1.3 Endpoints de servico

| Metodo | Endpoint | Finalidade | Resposta esperada |
| --- | --- | --- | --- |
| GET | `/api/health` | Verificar disponibilidade da API | `200 OK` |
| GET | `/api/roles` | Listar os perfis de acesso e suas permissoes | `200 OK` |
| GET | `/api/openapi.json` | Obter a especificacao OpenAPI | `200 OK` |

### 1.4 Codigos de resposta usados pela API

| Codigo | Quando ocorre |
| --- | --- |
| `200 OK` | Consulta ou atualizacao concluida com retorno de corpo |
| `201 Created` | Usuario criado; o header `Location` aponta para o novo recurso |
| `204 No Content` | Exclusao, logout ou troca de senha concluida sem corpo de resposta |
| `400 Bad Request` | Falha de validacao do corpo, da query string ou do parametro de rota |
| `401 Unauthorized` | Credenciais invalidas, token ausente, expirado ou adulterado |
| `403 Forbidden` | Token valido, porem o perfil nao tem permissao para a operacao |
| `404 Not Found` | Usuario ou rota inexistente |
| `409 Conflict` | E-mail ja cadastrado ou remocao do ultimo administrador ativo |
| `429 Too Many Requests` | Limite de tentativas de login excedido |
| `403 CORS_NOT_ALLOWED` | Origem do navegador fora da allowlist de CORS |
| `500 Internal Server Error` | Erro nao previsto (mensagem generica, sem stack trace) |

### 1.5 Principios REST aplicados

- **Recursos como substantivos no plural**: `/users`, `/users/{id}`, `/users/{id}/password`.
- **Verbos HTTP com semantica correta**: `GET` (consulta, seguro), `POST` (criacao, nao idempotente), `PUT`/`PATCH` (atualizacao idempotente), `DELETE` (remocao idempotente).
- **Statelessness**: nenhum estado de sessao e mantido no servidor; cada requisicao carrega o JWT.
- **Representacao uniforme**: entrada e saida em JSON, sempre com o mesmo formato de erro.
- **Codigos de status semanticos** e header `Location` no `201 Created`.
- **HATEOAS parcial**: a especificacao OpenAPI descreve as transicoes disponiveis.

### 1.6 Formato padrao de erro

Toda falha retorna o mesmo envelope, o que simplifica o tratamento no front-end:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados invalidos na requisicao.",
    "issues": [{ "path": "email", "message": "Informe um e-mail valido." }]
  }
}
```

O campo `issues` so aparece em erros de validacao e permite destacar o campo exato no formulario.

### 1.7 Exemplos de requisicao

**Login**

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@organizacion.dev", "password": "Admin@12345" }
```

```json
{
  "user": {
    "id": "0f0a9e3d-9f6d-4f1a-9d2f-3f2c1b4a5d6e",
    "name": "Administrador Geral",
    "email": "admin@organizacion.dev",
    "role": "ADMIN",
    "active": true,
    "createdAt": "2026-01-10T12:00:00.000Z",
    "updatedAt": "2026-01-10T12:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "8e0a...c31f",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Listagem com filtros**

```http
GET /api/users?search=maria&role=CLIENT&page=1&perPage=10
Authorization: Bearer <accessToken>
```

```json
{
  "data": [ { "id": "...", "name": "Maria Silva", "role": "CLIENT" } ],
  "meta": { "total": 1, "page": 1, "perPage": 10, "totalPages": 1 }
}
```

**Criacao de usuario**

```http
POST /api/users
Authorization: Bearer <accessToken de um ADMIN>
Content-Type: application/json

{
  "name": "Joana Prado",
  "email": "joana@organizacion.dev",
  "password": "Senha@123",
  "role": "OPERATOR"
}
```

Resposta `201 Created` com `Location: /api/users/{id}` e o usuario criado no corpo (sem o hash da senha).

---

## 2. Seguranca com JWT (Parte 2)

### 2.1 Processo de login

1. O usuario informa e-mail e senha no formulario da interface web.
2. O front-end envia `POST /api/auth/login` com o corpo em JSON sobre HTTPS.
3. O middleware de validacao (Zod) normaliza o e-mail (`trim` + `lowercase`) e recusa corpos malformados com `400`.
4. A API busca o usuario pelo e-mail; se ele existir, compara a senha recebida com o hash bcrypt armazenado usando `bcrypt.compare`.
5. Quando o e-mail nao existe, a API ainda executa um calculo de hash antes de responder. Isso equaliza o tempo de resposta e evita **enumeracao de usuarios por timing**.
6. Qualquer falha (e-mail inexistente ou senha errada) retorna a mesma mensagem generica: `401 E-mail ou senha invalidos.`
7. Contas desativadas recebem `403`, porque a credencial esta correta mas o acesso foi revogado.
8. Em caso de sucesso, a API emite o par de tokens e retorna os dados publicos do usuario.

Codigo relevante: `apps/api/src/services/auth.service.ts` e `apps/api/src/controllers/auth.controller.ts`.

### 2.2 Geracao do token

O token e assinado com `jsonwebtoken` usando o algoritmo **HS256** e o segredo em `JWT_SECRET` (minimo de 32 caracteres, validado na inicializacao). A assinatura tambem fixa `issuer` e `audience`, de forma que um token emitido por outro sistema — ou destinado a outro publico — e rejeitado mesmo que o segredo vaze parcialmente.

```ts
jwt.sign(
  { name: user.name, email: user.email, role: user.role },
  env.JWT_SECRET,
  {
    subject: user.id,
    issuer: 'organizacion-api',
    audience: 'organizacion-web',
    expiresIn: 3600,
    jwtid: randomUUID()
  }
)
```

### 2.3 Informacoes armazenadas no token

| Claim | Conteudo | Finalidade |
| --- | --- | --- |
| `sub` | ID (UUID) do usuario | Identifica o dono do token |
| `name` | Nome do usuario | Exibicao na interface sem consultar a API |
| `email` | E-mail do usuario | Identificacao secundaria |
| `role` | `ADMIN`, `OPERATOR` ou `CLIENT` | Base das decisoes de autorizacao (RBAC) |
| `iat` | Data de emissao (Unix timestamp) | Auditoria e calculo de idade do token |
| `exp` | Data de expiracao | Encerramento automatico da validade |
| `iss` | `organizacion-api` | Emissor esperado |
| `aud` | `organizacion-web` | Publico esperado |
| `jti` | UUID unico do token | Identificador para rastreio e futura revogacao |

**Nunca** sao colocados no token: senha, hash de senha ou qualquer dado sensivel. O payload de um JWT e apenas Base64 — legivel por qualquer pessoa que o intercepte. A assinatura garante integridade, nao confidencialidade.

### 2.4 Politica de expiracao e justificativa

| Token | Validade | Onde fica | Revogavel |
| --- | --- | --- | --- |
| Access token (JWT) | **1 hora** (`ACCESS_TOKEN_TTL_MINUTES=60`) | Cliente; enviado em `Authorization: Bearer` | Nao (stateless) |
| Refresh token | **7 dias** (`REFRESH_TOKEN_TTL_DAYS=7`) | Cliente; hash SHA-256 salvo no banco | Sim |

**Justificativa da escolha de 1 hora:**

O access token e stateless: uma vez emitido, a API o aceita ate expirar, sem consultar o banco de dados. Essa e a sua vantagem (desempenho, escalabilidade horizontal) e tambem o seu risco — um token roubado e valido ate o `exp`. A validade escolhida equilibra dois extremos:

- **Muito curta (5 a 15 minutos)**: reduz a janela de ataque, mas obriga renovacoes frequentes, aumentando o trafego e o risco de o usuario perder trabalho em formularios longos.
- **Muito longa (24 horas ou mais)**: comoda para o usuario, porem um token vazado permanece util por um dia inteiro — inaceitavel para um sistema que gerencia contas e perfis de acesso.

Uma hora cobre uma sessao tipica de trabalho administrativo sem interrupcoes e limita o estrago de um vazamento a esse mesmo intervalo. O risco residual e coberto pelo refresh token, que **e** revogavel: ele fica no banco apenas como hash SHA-256, e usa **rotacao** — cada renovacao invalida o token anterior e emite um novo. Se um refresh token for reutilizado (sinal classico de roubo), a tentativa falha com `401`.

Alem disso, a API revoga **todos** os refresh tokens de um usuario quando:

- a senha e alterada;
- o perfil de acesso e alterado;
- a conta e desativada.

O middleware de autenticacao tambem compara a claim `role` do token com o perfil atual no banco. Se um administrador rebaixar alguem, o token antigo — ainda dentro da validade — passa a ser recusado imediatamente. Isso fecha a principal brecha do modelo stateless: **privilegios obsoletos carregados dentro de um token ainda valido**.

### 2.5 Uso do token nas requisicoes

```http
GET /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

O middleware `authenticate` (`apps/api/src/middlewares/authenticate.ts`) executa, em ordem:

1. Verifica a presenca e o formato do header `Authorization: Bearer <token>`.
2. Valida assinatura, expiracao, `issuer` e `audience`.
3. Carrega o usuario no banco pelo `sub` — token de usuario excluido e recusado.
4. Bloqueia contas desativadas (`403`).
5. Compara a claim `role` com o perfil atual (`401` em caso de divergencia).
6. Anexa `request.auth = { id, role, email }` para os middlewares seguintes.

---

## 3. Controle de acesso baseado em perfis - RBAC (Parte 3)

### 3.1 Perfis disponiveis

| Perfil | Constante | Descricao |
| --- | --- | --- |
| Administrador | `ADMIN` | Acesso total ao sistema |
| Operador | `OPERATOR` | Acesso intermediario, sem gestao de privilegios |
| Cliente | `CLIENT` | Acesso restrito aos proprios dados |

### 3.2 Matriz de permissoes

| Operacao | Administrador | Operador | Cliente |
| --- | :---: | :---: | :---: |
| Listar todos os usuarios | Sim | Sim | Nao (`403`) |
| Consultar qualquer usuario | Sim | Sim | Somente o proprio (`403` nos demais) |
| Criar usuario com perfil definido | Sim | Nao (`403`) | Nao (`403`) |
| Atualizar nome e e-mail de terceiros | Sim | Sim (exceto de Administradores) | Nao (`403`) |
| Atualizar os proprios dados | Sim | Sim | Sim |
| Alterar perfil de acesso (`role`) | Sim | Nao (`403`) | Nao (`403`) |
| Ativar/desativar conta (`active`) | Sim | Nao (`403`) | Nao (`403`) |
| Excluir usuario | Sim | Nao (`403`) | Nao (`403`) |
| Alterar a propria senha | Sim (exige senha atual) | Sim (exige senha atual) | Sim (exige senha atual) |
| Redefinir a senha de terceiros | Sim (sem senha atual) | Nao (`403`) | Nao (`403`) |
| Auto cadastro publico | - | - | Sim (sempre criado como `CLIENT`) |

### 3.3 Como a autorizacao e aplicada

O controle acontece em **duas camadas complementares**:

**Camada 1 — middleware de rota (`authorize`)**: barra perfis inteiros antes mesmo de o controller executar. Usado onde a regra depende apenas do perfil:

```ts
userRoutes.post('/', authorize('ADMIN'), validate(createUserSchema), userController.create)
userRoutes.delete('/:id', authorize('ADMIN'), ...)
userRoutes.get('/', authorize('ADMIN', 'OPERATOR'), ...)
```

**Camada 2 — politicas de dominio (`apps/api/src/policies/user.policy.ts`)**: trata as regras que dependem do **recurso alvo**, e nao apenas do perfil. Sao os casos de *ownership*:

- um Cliente so pode ler e editar o registro cujo `id` seja igual ao `sub` do seu token;
- um Operador nao pode alterar o cadastro de um Administrador;
- nem Operador nem Cliente podem tocar nos campos `role` e `active`, o que bloqueia **escalonamento de privilegio**;
- o proprio usuario autenticado nao pode se autoexcluir;
- o sistema recusa qualquer operacao que deixaria zero administradores ativos (`409 LAST_ADMIN`).

Manter as politicas fora dos controllers deixa as regras testaveis isoladamente e evita que uma rota nova esqueca uma verificacao.

### 3.4 RBAC no front-end

A interface esconde o que o usuario nao pode fazer: o menu "Usuarios" some para o perfil Cliente, o botao "Novo usuario" e os botoes de exclusao aparecem so para o Administrador, e o seletor de perfil do formulario e ocultado para os demais.

Isso e **conveniencia de usabilidade, nao seguranca**. O front-end e codigo que roda no navegador do usuario e pode ser modificado. Toda decisao de autorizacao e reavaliada no servidor a cada requisicao — uma chamada direta via `curl` com um token de Cliente recebe `403` exatamente como a interface previa.

---

## 4. OAuth 2.0 para aplicacoes parceiras (Parte 4)

> Conforme o enunciado, esta secao descreve o funcionamento de OAuth 2.0 no contexto da solucao. A implementacao nao faz parte do escopo.

### 4.1 O problema que o OAuth 2.0 resolve

Hoje a API e consumida pela propria interface web, e a autenticacao por e-mail e senha resolve o caso. Mas suponha que uma empresa parceira — por exemplo, um sistema de folha de pagamento — precise ler a lista de usuarios da Organizacion para sincronizar cadastros.

Sem OAuth 2.0, a unica saida seria o cliente entregar seu e-mail e senha ao parceiro. Isso e ruim por tres motivos: o parceiro passa a ter acesso **total** a conta (inclusive para excluir usuarios), o acesso so pode ser cortado trocando a senha, e a senha passa a existir em um sistema de terceiros.

OAuth 2.0 resolve exatamente isso: **delegacao de acesso sem compartilhamento de credenciais**.

### 4.2 Papeis no protocolo

| Papel | Quem seria na solucao |
| --- | --- |
| **Resource Owner** | O usuario dono dos dados (por exemplo, o Administrador da Organizacion) |
| **Client** | A aplicacao parceira que quer consumir a API |
| **Authorization Server** | Servico de autorizacao da Organizacion, que emite os tokens |
| **Resource Server** | A propria API REST descrita neste documento |

### 4.3 Concessao de acesso (Authorization Code + PKCE)

O fluxo recomendado e o **Authorization Code Grant com PKCE**, hoje o padrao para aplicacoes web e mobile:

1. **Registro previo**: a aplicacao parceira e cadastrada no Authorization Server e recebe um `client_id`, um `client_secret` e declara suas `redirect_uri` autorizadas.

2. **Redirecionamento para autorizacao**: o parceiro envia o usuario ao Authorization Server da Organizacion.

   ```
   GET https://auth.organizacion.dev/oauth/authorize
     ?response_type=code
     &client_id=parceiro-folha-pagamento
     &redirect_uri=https://parceiro.com/callback
     &scope=users:read
     &state=f8a3c2d1
     &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
     &code_challenge_method=S256
   ```

3. **Autenticacao e consentimento**: o usuario faz login **no dominio da Organizacion** — o parceiro nunca ve essa tela — e recebe uma tela de consentimento explicita: *"A aplicacao Folha de Pagamento deseja consultar a lista de usuarios. Permitir?"*. O usuario ve exatamente quais permissoes (`scopes`) estao sendo pedidas e pode recusar.

4. **Codigo de autorizacao**: autorizado o acesso, o navegador e redirecionado para `https://parceiro.com/callback?code=SplxlOBeZQ&state=f8a3c2d1`. O parametro `state` e conferido pelo parceiro para impedir CSRF; o `code` e de uso unico e vive poucos segundos.

5. **Troca do codigo pelo token** (chamada servidor a servidor, o codigo nunca passa pelo navegador):

   ```http
   POST https://auth.organizacion.dev/oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code
   &code=SplxlOBeZQ
   &redirect_uri=https://parceiro.com/callback
   &client_id=parceiro-folha-pagamento
   &client_secret=<segredo>
   &code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
   ```

   O `code_verifier` do PKCE prova que quem troca o codigo e o mesmo cliente que iniciou o fluxo, bloqueando a interceptacao do codigo de autorizacao.

6. **Emissao dos tokens**:

   ```json
   {
     "access_token": "eyJhbGciOiJSUzI1NiIs...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
     "scope": "users:read"
   }
   ```

### 4.4 Utilizacao do token nos recursos protegidos

O parceiro passa a chamar a API exatamente como a interface web faz, usando o header padrao:

```http
GET https://api.organizacion.dev/api/users
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

O Resource Server valida a assinatura do token, confere `issuer`, `audience` e `exp`, e — o ponto central — verifica se o **scope** concedido cobre a operacao pedida. Um token com `scope=users:read` acessa `GET /api/users`, mas recebe `403 insufficient_scope` ao tentar `DELETE /api/users/{id}`.

Os scopes seriam mapeados sobre o RBAC ja existente, de modo que a permissao efetiva e sempre a **intersecao** entre o que o usuario pode fazer e o que ele delegou ao parceiro:

| Scope | Permite | Equivalente no RBAC |
| --- | --- | --- |
| `users:read` | `GET /api/users`, `GET /api/users/{id}` | Consulta (Administrador/Operador) |
| `users:write` | `POST` e `PUT /api/users` | Criacao e atualizacao |
| `users:delete` | `DELETE /api/users/{id}` | Exclusao (Administrador) |
| `profile:read` | `GET /api/auth/me` | Dados do proprio usuario |

Assim, mesmo que um parceiro peca `users:delete`, um usuario com perfil Operador jamais conseguira delegar esse poder — ele nao o possui.

### 4.5 Beneficios

**Maior seguranca.** A senha do usuario nunca sai do dominio da Organizacion. O parceiro guarda apenas um token de vida curta, e um vazamento no lado dele expoe um acesso limitado e temporario, nao a credencial mestra.

**Delegacao granular de permissoes.** Os scopes aplicam o principio do menor privilegio: o parceiro recebe exatamente a permissao que pediu e que o usuario aprovou. Um integrador de relatorios fica com `users:read` e nunca conseguira excluir um cadastro.

**Nao compartilhamento de senhas.** O usuario autoriza um aplicativo, nao entrega uma identidade. Isso tambem preserva a autenticacao multifator: se a conta exige MFA, o segundo fator e verificado no proprio Authorization Server, algo impossivel quando se repassa uma senha.

**Revogacao independente e auditavel.** Cada consentimento e um registro distinto. O usuario abre a tela "Aplicativos conectados", revoga o acesso do parceiro e nada mais acontece — as outras integracoes e a sua propria sessao continuam funcionando. Com senha compartilhada, a unica revogacao possivel seria trocar a senha, derrubando todos os acessos de uma vez.

**Rastreabilidade.** Os logs registram qual `client_id` fez cada chamada, em nome de qual usuario e com quais scopes. Em uma auditoria, e possivel distinguir uma acao feita pela interface web de uma feita por integracao automatizada.

**Ciclo de vida controlado.** O access token expira em minutos ou horas; o refresh token permite renovacao sem nova interacao do usuario e pode ser revogado a qualquer momento pelo Authorization Server.

---

## 5. Analise de seguranca (Parte 5)

### 5.1 Riscos identificados e mitigacoes implementadas

| # | Risco | Impacto | Mitigacao aplicada nesta solucao |
| --- | --- | --- | --- |
| 1 | **Roubo ou interceptacao do token JWT** | Acesso completo a conta da vitima ate a expiracao | Expiracao curta (1h); `issuer`/`audience` verificados; refresh token com rotacao e revogavel; HTTPS obrigatorio em producao; `jti` unico por token |
| 2 | **Senhas armazenadas em texto puro** | Vazamento do banco expoe todas as senhas, inclusive reutilizadas em outros servicos | Hash **bcrypt** com 12 rounds e salt por usuario (`apps/api/src/utils/password.ts`); o hash nunca sai da camada de dominio e jamais aparece em uma resposta |
| 3 | **Acesso indevido a endpoints** | Um Cliente lendo ou apagando dados de terceiros | **RBAC em duas camadas**: middleware `authorize` por rota + politicas de ownership em `user.policy.ts`; toda decisao e refeita no servidor |
| 4 | **Escalonamento de privilegio** | Um Cliente se promovendo a Administrador via `PATCH /users/{id}` | Campos `role` e `active` sao recusados (`403`) para perfis nao administradores; o auto cadastro ignora qualquer `role` enviado e forca `CLIENT` |
| 5 | **Injecao de SQL** | Leitura ou destruicao da base | Todas as consultas usam **prepared statements** com parametros vinculados (`?`); nenhuma string de SQL e concatenada com entrada do usuario |
| 6 | **Forca bruta no login** | Descoberta de senhas por tentativa exaustiva | Rate limit de 5 tentativas por 15 minutos em `/auth/login` e `/auth/register`, mais um limite global de 120 requisicoes por minuto (`429`) |
| 7 | **Enumeracao de usuarios** | Mapeamento de quais e-mails existem, insumo para phishing | Mensagem de erro identica para e-mail inexistente e senha errada; a rota executa um hash mesmo quando o usuario nao existe, equalizando o tempo de resposta |
| 8 | **Payloads maliciosos / mass assignment** | Corrupcao de dados ou gravacao de campos nao previstos | Validacao com **Zod** em body, query e params; apenas os campos declarados no schema chegam a camada de servico |
| 9 | **Cross-Site Scripting (XSS)** | Roubo de token pelo navegador | React escapa todo conteudo interpolado por padrao; `helmet` define `Content-Security-Policy`, `X-Content-Type-Options` e demais headers; nao ha uso de `dangerouslySetInnerHTML` |
| 10 | **Cross-Origin Resource Sharing permissivo** | Qualquer site chamando a API com as credenciais do usuario | CORS com **allowlist explicita** via `CORS_ORIGINS`; origens nao listadas recebem `403 CORS_NOT_ALLOWED`. Fora de producao, origens de loopback (`localhost`, `127.0.0.1`, `::1`) sao aceitas em qualquer porta para nao travar o desenvolvimento; em producao **somente** o que estiver em `CORS_ORIGINS` passa |
| 11 | **Vazamento de informacao em erros** | Stack traces revelando estrutura interna e versoes | Handler central de erros retorna mensagem generica em `500`; header `x-powered-by` desabilitado |
| 12 | **Negacao de servico por payload grande** | Exaustao de memoria do processo | `express.json({ limit: '100kb' })` |
| 13 | **Privilegios obsoletos em token valido** | Usuario rebaixado mantendo poderes ate o token expirar | O middleware compara a claim `role` com o perfil atual no banco e recusa divergencias; alteracoes de perfil revogam os refresh tokens |
| 14 | **Perda do ultimo administrador** | Sistema sem ninguem capaz de gerenciar acessos | Regra `LAST_ADMIN` (`409`) bloqueia excluir, rebaixar ou desativar o unico Administrador ativo |
| 15 | **Segredo fraco ou versionado** | Falsificacao de tokens validos | `JWT_SECRET` exige no minimo 32 caracteres e e validado na inicializacao; em producao a aplicacao **nao sobe** sem ele; `.env` esta no `.gitignore` |

### 5.2 Riscos conhecidos e nao mitigados nesta entrega

Seria desonesto apresentar a solucao como completa do ponto de vista de producao. Os pontos abaixo sao limitacoes conscientes do escopo academico:

| Risco | Situacao atual | Recomendacao para producao |
| --- | --- | --- |
| Token no `localStorage` | Escolhido para tornar o fluxo JWT visivel na demonstracao; fica exposto a XSS | Migrar o refresh token para cookie `HttpOnly`, `Secure`, `SameSite=Strict` e manter apenas o access token em memoria |
| HTTPS | Configuracao local em HTTP | Terminacao TLS no proxy reverso, com HSTS e redirecionamento de HTTP para HTTPS |
| Ausencia de MFA | Apenas e-mail e senha | Adicionar TOTP para o perfil Administrador |
| Logs de auditoria | Nao ha trilha persistida de acoes sensiveis | Registrar autor, acao, alvo e data para criacao, alteracao de perfil e exclusao |
| Rotacao de segredo | `JWT_SECRET` fixo | Rotacao periodica com suporte a multiplas chaves (`kid`) durante a transicao |
| Banco de dados | SQLite embarcado, adequado a demonstracao | PostgreSQL com credenciais gerenciadas por cofre de segredos e backup automatizado |

### 5.3 Referencia cruzada com o OWASP API Security Top 10

| Categoria OWASP | Como e tratada |
| --- | --- |
| API1 - Broken Object Level Authorization | Politicas de ownership impedem acesso a registros de terceiros |
| API2 - Broken Authentication | JWT assinado e verificado, bcrypt, rate limit, mensagens genericas |
| API3 - Broken Object Property Level Authorization | `role` e `active` bloqueados para perfis nao administradores |
| API4 - Unrestricted Resource Consumption | Rate limit global, limite de corpo e `perPage` maximo de 100 |
| API5 - Broken Function Level Authorization | Middleware `authorize` por rota, alinhado a matriz de permissoes |
| API7 - Server Side Request Forgery | A API nao faz requisicoes a URLs fornecidas pelo usuario |
| API8 - Security Misconfiguration | `helmet`, CORS restritivo, `x-powered-by` desabilitado, validacao de ambiente na inicializacao |
| API9 - Improper Inventory Management | Documentacao OpenAPI versionada e servida pela propria API |
