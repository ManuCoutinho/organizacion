import { env } from '../config/env.js'

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', example: 'Ana Souza' },
    email: { type: 'string', format: 'email', example: 'ana@organizacion.dev' },
    role: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'CLIENT'] },
    active: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
}

const errorSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'FORBIDDEN' },
        message: { type: 'string' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    }
  }
}

const sessionSchema = {
  type: 'object',
  properties: {
    user: userSchema,
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    tokenType: { type: 'string', example: 'Bearer' },
    expiresIn: { type: 'integer', example: env.accessTokenTtlSeconds }
  }
}

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorSchema } }
})

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' }
}

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Organizacion - API de Gerenciamento de Usuarios',
    version: '1.0.0',
    description:
      'API REST com autenticacao JWT e controle de acesso baseado em perfis (RBAC). Perfis disponiveis: ADMIN, OPERATOR e CLIENT.'
  },
  servers: [{ url: '/api', description: 'Servidor da aplicacao' }],
  tags: [
    {
      name: 'Autenticacao',
      description: 'Login, registro e ciclo de vida do token'
    },
    { name: 'Usuarios', description: 'CRUD de usuarios protegido por RBAC' },
    { name: 'Servico', description: 'Metadados e saude da API' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      User: userSchema,
      AuthSession: sessionSchema,
      ApiError: errorSchema
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Servico'],
        summary: 'Verifica a disponibilidade da API',
        security: [],
        responses: { '200': { description: 'API disponivel' } }
      }
    },
    '/roles': {
      get: {
        tags: ['Servico'],
        summary: 'Lista os perfis de acesso e suas permissoes',
        security: [],
        responses: { '200': { description: 'Perfis disponiveis' } }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Autenticacao'],
        summary: 'Autentica o usuario e gera o token JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Sessao criada com sucesso',
            content: { 'application/json': { schema: sessionSchema } }
          },
          '400': errorResponse('Dados invalidos'),
          '401': errorResponse('Credenciais invalidas'),
          '403': errorResponse('Conta desativada'),
          '429': errorResponse('Excesso de tentativas de login')
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Autenticacao'],
        summary: 'Auto cadastro publico (sempre criado com perfil CLIENT)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Usuario criado e autenticado',
            content: { 'application/json': { schema: sessionSchema } }
          },
          '400': errorResponse('Dados invalidos'),
          '409': errorResponse('E-mail ja cadastrado')
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Autenticacao'],
        summary: 'Renova o access token a partir de um refresh token valido',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Novo par de tokens emitido',
            content: { 'application/json': { schema: sessionSchema } }
          },
          '401': errorResponse('Refresh token invalido ou expirado')
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Autenticacao'],
        summary: 'Revoga o refresh token da sessao atual',
        responses: {
          '204': { description: 'Sessao encerrada' },
          '401': errorResponse('Token ausente ou invalido')
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Autenticacao'],
        summary: 'Retorna o usuario autenticado no token',
        responses: {
          '200': {
            description: 'Usuario autenticado',
            content: { 'application/json': { schema: userSchema } }
          },
          '401': errorResponse('Token ausente ou invalido')
        }
      }
    },
    '/users': {
      get: {
        tags: ['Usuarios'],
        summary: 'Lista usuarios cadastrados (ADMIN, OPERATOR)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'role',
            in: 'query',
            schema: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'CLIENT'] }
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'perPage',
            in: 'query',
            schema: { type: 'integer', default: 10, maximum: 100 }
          }
        ],
        responses: {
          '200': {
            description: 'Lista paginada de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: userSchema },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        perPage: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': errorResponse('Token ausente ou invalido'),
          '403': errorResponse('Perfil sem permissao')
        }
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Cria um novo usuario (somente ADMIN)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  role: {
                    type: 'string',
                    enum: ['ADMIN', 'OPERATOR', 'CLIENT']
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Usuario criado',
            content: { 'application/json': { schema: userSchema } }
          },
          '400': errorResponse('Dados invalidos'),
          '401': errorResponse('Token ausente ou invalido'),
          '403': errorResponse('Perfil sem permissao'),
          '409': errorResponse('E-mail ja cadastrado')
        }
      }
    },
    '/users/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Consulta um usuario (CLIENT somente o proprio cadastro)',
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Usuario encontrado',
            content: { 'application/json': { schema: userSchema } }
          },
          '401': errorResponse('Token ausente ou invalido'),
          '403': errorResponse('Perfil sem permissao'),
          '404': errorResponse('Usuario nao encontrado')
        }
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Atualiza um usuario (role e status somente para ADMIN)',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  role: {
                    type: 'string',
                    enum: ['ADMIN', 'OPERATOR', 'CLIENT']
                  },
                  active: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Usuario atualizado',
            content: { 'application/json': { schema: userSchema } }
          },
          '400': errorResponse('Dados invalidos'),
          '401': errorResponse('Token ausente ou invalido'),
          '403': errorResponse('Perfil sem permissao'),
          '404': errorResponse('Usuario nao encontrado'),
          '409': errorResponse('E-mail em uso ou ultimo administrador')
        }
      },
      patch: {
        tags: ['Usuarios'],
        summary: 'Atualizacao parcial de um usuario',
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Usuario atualizado',
            content: { 'application/json': { schema: userSchema } }
          },
          '403': errorResponse('Perfil sem permissao'),
          '404': errorResponse('Usuario nao encontrado')
        }
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Exclui um usuario (somente ADMIN)',
        parameters: [idParam],
        responses: {
          '204': { description: 'Usuario excluido' },
          '401': errorResponse('Token ausente ou invalido'),
          '403': errorResponse('Perfil sem permissao'),
          '404': errorResponse('Usuario nao encontrado'),
          '409': errorResponse('Ultimo administrador ativo')
        }
      }
    },
    '/users/{id}/password': {
      patch: {
        tags: ['Usuarios'],
        summary: 'Altera a senha (o proprio usuario ou um ADMIN)',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['newPassword'],
                properties: {
                  currentPassword: { type: 'string', format: 'password' },
                  newPassword: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          '204': { description: 'Senha alterada' },
          '400': errorResponse('Senha atual incorreta ou nova senha fraca'),
          '403': errorResponse('Perfil sem permissao'),
          '404': errorResponse('Usuario nao encontrado')
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
}
