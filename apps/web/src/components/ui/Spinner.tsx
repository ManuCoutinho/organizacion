export const Spinner = ({ label = 'Carregando' }: { label?: string }) => (
  <div className='flex items-center justify-center gap-3 py-16 text-sm text-ink-400'>
    <span
      aria-hidden='true'
      className='size-5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent'
    />
    <span>{label}...</span>
  </div>
)
