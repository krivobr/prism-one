'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck, Search, Camera, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Equipamento {
  id: number
  tag: string
  descricao: string | null
  icd: number | null
  status: string
  familia: { nome: string } | null
  ultima_calibracao: string | null
  inspecoes: { id: number; data: string; status: string; desvio_percentual: number | null }[]
}

type CheckStatus = 'ok' | 'alerta' | 'pendente'

export default function CheckLoopPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/equipamentos')
        if (res.ok) setEquipamentos(await res.json())
      } catch { /* ignore */ }
      setCarregando(false)
    }
    carregar()
  }, [])

  const filtrados = equipamentos.filter(e =>
    e.tag.toLowerCase().includes(busca.toLowerCase()) ||
    (e.descricao || '').toLowerCase().includes(busca.toLowerCase())
  )

  // Status real baseado na última inspeção do equipamento
  const getCheckStatus = (eq: Equipamento): CheckStatus => {
    const ultima = eq.inspecoes?.[0]
    if (!ultima) return 'pendente'
    if (ultima.status === 'OK') return 'ok'
    if (ultima.status === 'Alerta') return 'alerta'
    return 'pendente'
  }

  const statusConfig = {
    ok: { label: 'OK', color: 'bg-emerald-600/20 text-emerald-400', dot: 'bg-emerald-400' },
    alerta: { label: 'Alerta', color: 'bg-yellow-600/20 text-yellow-400', dot: 'bg-yellow-400' },
    pendente: { label: 'Pendente', color: 'bg-slate-600/20 text-slate-400', dot: 'bg-slate-400' },
  }

  // Contadores reais
  const total = filtrados.length
  const okCount = filtrados.filter(e => getCheckStatus(e) === 'ok').length
  const alertaCount = filtrados.filter(e => getCheckStatus(e) === 'alerta').length
  const pendenteCount = filtrados.filter(e => getCheckStatus(e) === 'pendente').length
  const progressPercent = total > 0 ? Math.round((okCount / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header mobile-first */}
      <div>
        <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">PRISM™ ONE CAMPO</p>
        <h1 className="text-xl font-bold text-white mt-1">Check Loop</h1>
        <p className="text-slate-400 text-sm mt-0.5">Inspeção de campo dos instrumentos</p>
      </div>

      {/* Progress — dados reais */}
      <div className="rounded-xl border border-slate-700/50 p-4" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-300">Progresso do mês</span>
          <span className={cn('text-sm font-semibold', progressPercent >= 90 ? 'text-emerald-400' : progressPercent >= 50 ? 'text-yellow-400' : 'text-slate-400')}>
            {progressPercent}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-700">
          <div
            className={cn('h-2 rounded-full transition-all', progressPercent >= 90 ? 'bg-emerald-500' : progressPercent >= 50 ? 'bg-yellow-500' : 'bg-slate-500')}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>{pendenteCount} pendentes</span>
          <span>{alertaCount} alertas</span>
          <span>{okCount} OK</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar TAG..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
      </div>

      {/* Instrument cards (mobile-optimized) */}
      <div className="space-y-2">
        {carregando ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum instrumento encontrado</div>
        ) : (
          filtrados.map((eq) => {
            const status = getCheckStatus(eq)
            const cfg = statusConfig[status]
            return (
              <div key={eq.id} onClick={() => router.push(`/check-loop/${eq.id}`)} className="rounded-xl border border-slate-700/50 p-4 hover:border-emerald-600/30 transition-colors cursor-pointer" style={{ background: 'hsl(222 47% 11%)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {eq.icd != null && (
                      <span className={cn(
                        'inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0',
                        eq.icd >= 20 ? 'bg-red-600/20 text-red-400' :
                        eq.icd >= 15 ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-emerald-600/20 text-emerald-400'
                      )}>{eq.icd}</span>
                    )}
                    <div>
                      <p className="font-mono font-semibold text-white">{eq.tag}</p>
                      <p className="text-xs text-slate-400">{eq.descricao || '—'}</p>
                      {eq.familia && <p className="text-xs text-slate-500 mt-0.5">{eq.familia.nome}</p>}
                    </div>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', cfg.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/30">
                  <button className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition">
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Iniciar Inspeção
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition">
                    <Camera className="w-3.5 h-3.5" />
                    Foto
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition">
                    <MapPin className="w-3.5 h-3.5" />
                    GPS
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
      <p className="text-xs text-slate-500">{total} instrumento(s)</p>
    </div>
  )
}
