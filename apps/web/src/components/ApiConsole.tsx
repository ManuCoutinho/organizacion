import { useState } from 'react'
import { useApiLog } from '@/hooks/useApiLog'
import { apiLog } from '@/lib/api-log'
import { classNames } from '@/lib/format'
import { Button } from './ui/Button'

const statusTone = (status: number): string => {
  if (status >= 500) return 'bg-rose-500/15 text-rose-300 border-rose-400/30'
  if (status >= 400) return 'bg-amber-500/15 text-amber-300 border-amber-400/30'
  if (status >= 200)
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
  return 'bg-ink-700/40 text-ink-300 border-white/10'
}

const preview = (value: unknown): string => {
  if (value === undefined || value === null) return '(sem corpo)'
  return JSON.stringify(value, null, 2)
}

export const ApiConsole = () => {
  const entries = useApiLog()
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen((value) => !value)}
        className='fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/90 px-4 py-2.5 text-xs font-semibold text-ink-200 shadow-xl shadow-black/40 backdrop-blur-xl transition-colors hover:border-brand-400/40 hover:text-white'
      >
        <span className='size-2 rounded-full bg-brand-400' />
        Respostas da API
        <span className='rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-ink-200'>
          {entries.length}
        </span>
      </button>

      <aside
        aria-label='Console de respostas da API'
        className={classNames(
          'surface fixed bottom-20 left-6 z-40 flex max-h-[60vh] w-[min(30rem,calc(100vw-3rem))] flex-col transition-all duration-200',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        )}
      >
        <header className='flex items-center justify-between border-b border-white/5 px-4 py-3'>
          <div>
            <h2 className='text-sm font-semibold text-ink-50'>Console HTTP</h2>
            <p className='text-xs text-ink-400'>
              Cada chamada feita pela interface
            </p>
          </div>
          <Button size='sm' variant='ghost' onClick={() => apiLog.clear()}>
            Limpar
          </Button>
        </header>

        <div className='flex-1 overflow-y-auto'>
          {entries.length === 0 ? (
            <p className='px-4 py-8 text-center text-sm text-ink-400'>
              Nenhuma requisicao registrada ainda.
            </p>
          ) : (
            <ul className='divide-y divide-white/5'>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type='button'
                    onClick={() =>
                      setExpandedId((current) =>
                        current === entry.id ? null : entry.id
                      )
                    }
                    className='flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5'
                  >
                    <span className='w-14 shrink-0 font-mono text-[11px] font-bold text-ink-300'>
                      {entry.method}
                    </span>
                    <span className='flex-1 truncate font-mono text-xs text-ink-200'>
                      {entry.url}
                    </span>
                    <span className='shrink-0 text-[10px] text-ink-500'>
                      {entry.durationMs}ms
                    </span>
                    <span
                      className={classNames(
                        'shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-bold',
                        statusTone(entry.status)
                      )}
                    >
                      {entry.status}
                    </span>
                  </button>
                  {expandedId === entry.id ? (
                    <div className='space-y-3 border-t border-white/5 bg-ink-950/60 px-4 py-3'>
                      {entry.requestBody !== undefined ? (
                        <div>
                          <p className='field-label'>Request</p>
                          <pre className='max-h-40 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] text-ink-200'>
                            {preview(entry.requestBody)}
                          </pre>
                        </div>
                      ) : null}
                      <div>
                        <p className='field-label'>Response</p>
                        <pre className='max-h-56 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] text-ink-200'>
                          {preview(entry.responseBody)}
                        </pre>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}
