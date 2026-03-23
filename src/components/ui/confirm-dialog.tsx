'use client'

import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  aberto: boolean
  titulo: string
  mensagem: string
  tipo?: 'danger' | 'warning'
  textoBotao?: string
  onConfirm: () => void
  onCancel: () => void
  carregando?: boolean
}

export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  tipo = 'danger',
  textoBotao = 'Excluir',
  onConfirm,
  onCancel,
  carregando = false,
}: ConfirmDialogProps) {
  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-slate-700/50 p-6 shadow-2xl" style={{ background: 'hsl(222 47% 11%)' }}>
        {/* Close */}
        <button onClick={onCancel} className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className={cn(
          'mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4',
          tipo === 'danger' ? 'bg-red-600/20' : 'bg-yellow-600/20'
        )}>
          {tipo === 'danger' ? (
            <Trash2 className="w-6 h-6 text-red-400" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          )}
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-white text-center mb-2">{titulo}</h3>
        <p className="text-sm text-slate-400 text-center mb-6">{mensagem}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={carregando}
            className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={carregando}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition disabled:opacity-50',
              tipo === 'danger'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-yellow-600 hover:bg-yellow-500'
            )}
          >
            {carregando ? 'Aguarde...' : textoBotao}
          </button>
        </div>
      </div>
    </div>
  )
}
