import { useState } from 'react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  onCancel,
  onConfirm
}: ConfirmDialogProps) => {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant='ghost' onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant='danger' loading={loading} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className='text-sm text-ink-300'>{message}</p>
    </Modal>
  )
}
