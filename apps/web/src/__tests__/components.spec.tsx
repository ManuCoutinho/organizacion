import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Toasts } from '@/components/ui/Toasts'
import { RoleBadge, StatusBadge } from '@/components/ui/RoleBadge'
import { ApiConsole } from '@/components/ApiConsole'
import { NotFound } from '@/pages/NotFound'
import { apiLog } from '@/lib/api-log'
import { MemoryRouter } from 'react-router-dom'

describe('componentes de interface', () => {
  it('desabilita o botao enquanto carrega', () => {
    render(<Button loading>Salvar</Button>)
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('associa a mensagem de erro ao input', () => {
    render(<Input label='E-mail' error='Campo obrigatorio' />)

    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Campo obrigatorio')).toBeInTheDocument()
  })

  it('exibe a dica quando nao ha erro', () => {
    render(<Input label='Senha' hint='Minimo de 8 caracteres.' />)
    expect(screen.getByText('Minimo de 8 caracteres.')).toBeInTheDocument()
  })

  it('renderiza as opcoes do select e reporta erro', () => {
    render(
      <Select label='Perfil' error='Perfil invalido'>
        <option value='ADMIN'>Administrador</option>
      </Select>
    )

    expect(screen.getByLabelText('Perfil')).toBeInTheDocument()
    expect(screen.getByText('Perfil invalido')).toBeInTheDocument()
  })

  it('nao renderiza o modal fechado', () => {
    render(
      <Modal open={false} title='Titulo' onClose={() => undefined}>
        conteudo
      </Modal>
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('fecha o modal com a tecla Escape e pelo backdrop', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <Modal
        open
        title='Titulo'
        description='Descricao'
        onClose={onClose}
        footer={<span>rodape</span>}
      >
        conteudo
      </Modal>
    )

    expect(screen.getByText('Descricao')).toBeInTheDocument()
    expect(screen.getByText('rodape')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await user.click(screen.getByLabelText('Fechar modal'))

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('renderiza estado vazio, spinner e badges', () => {
    render(
      <>
        <EmptyState title='Nada aqui' description='Sem registros' />
        <Spinner />
        <RoleBadge role='OPERATOR' />
        <StatusBadge active={false} />
      </>
    )

    expect(screen.getByText('Nada aqui')).toBeInTheDocument()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(screen.getByText('Operador')).toBeInTheDocument()
    expect(screen.getByText('Inativo')).toBeInTheDocument()
  })

  it('dispensa um toast ao ser clicado', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(
      <Toasts
        toasts={[{ id: 1, tone: 'success', message: 'Tudo certo' }]}
        onDismiss={onDismiss}
      />
    )

    await user.click(screen.getByText('Tudo certo'))
    expect(onDismiss).toHaveBeenCalledWith(1)
  })

  it('renderiza a pagina 404', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})

describe('<ApiConsole />', () => {
  it('lista as chamadas registradas e mostra os detalhes', async () => {
    const user = userEvent.setup()
    apiLog.push({
      method: 'POST',
      url: '/api/auth/login',
      status: 401,
      statusText: 'Unauthorized',
      durationMs: 12,
      requestBody: { email: 'ana@organizacion.dev' },
      responseBody: { error: { code: 'INVALID_CREDENTIALS' } }
    })

    render(<ApiConsole />)

    await user.click(screen.getByRole('button', { name: /Respostas da API/ }))
    await user.click(screen.getByText('/api/auth/login'))

    expect(screen.getByText('401')).toBeInTheDocument()
    expect(screen.getByText(/INVALID_CREDENTIALS/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpar' }))
    expect(
      screen.getByText('Nenhuma requisicao registrada ainda.')
    ).toBeInTheDocument()
  })
})
