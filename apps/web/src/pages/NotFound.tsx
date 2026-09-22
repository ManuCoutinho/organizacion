import { Link } from 'react-router-dom'

export const NotFound = () => (
  <div className='flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center'>
    <p className='font-mono text-6xl font-black text-brand-400'>404</p>
    <h1 className='text-2xl font-bold text-ink-50'>Pagina nao encontrada</h1>
    <p className='max-w-sm text-sm text-ink-400'>
      O endereco acessado nao existe nesta aplicacao.
    </p>
    <Link
      to='/'
      className='rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500'
    >
      Voltar ao inicio
    </Link>
  </div>
)
