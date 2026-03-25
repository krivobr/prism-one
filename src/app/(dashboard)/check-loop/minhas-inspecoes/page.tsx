'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, MapPin, Check, AlertTriangle, Clock, ClipboardList, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Inspecao {
  id: number
  data: string
  leitura: number | null
  status: string
  observacoes: string | null
  foto_url: string | null
  latitude: number | null
  longitude: number | null
  hart_status: string | null
  equipamento: {
    tag: string
  } | null
}

export default function MinhasInspecoesPage() {
  const router = useRouter()
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [fullscreenPhoto, setFullscreenPhoto] = useState<Inspecao | null>(null)

  const hoje = new Date()
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const dataISO = hoje.toISOString().split('T')[0]

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch(`/api/inspecoes?executante=meu&data=${dataISO}`)
        if (res.ok) setInspecoes(await res.json())
      } catch { /* ignore */ }
      setCarregando(false)
    }
    carregar()
  }, [dataISO])

  const formatTime = (d: string) => {
    const date = new Date(d)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const statusConfig = {
    OK: { label: 'OK', color: 'bg-emerald-600/20 text-emerald-400', dot: 'bg-emerald-400', icon: Check },
    Alerta: { label: 'Alerta', color: 'bg-yellow-600/20 text-yellow-400', dot: 'bg-yellow-400', icon: AlertTriangle },
    Pendente: { label: 'Pendente', color: 'bg-slate-600/20 text-slate-400', dot: 'bg-slate-400', icon: Clock },
  }

  const getStatusConfig = (status: string) => {
    if (status === 'OK') return statusConfig.OK
    if (status === 'Alerta') return statusConfig.Alerta
    return statusConfig.Pendente
  }

  const okCount = inspecoes.filter(i => i.status === 'OK').length
  const alertaCount = inspecoes.filter(i => i.status === 'Alerta').length
  const pendenteCount = inspecoes.filter(i => i.status !== 'OK' && i.status !== 'Alerta').length

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/check-loop')}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Minhas Inspe\u00e7\u00f5es</h1>
          <p className="text-sm text-slate-400 capitalize">Hoje, {dataFormatada}</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="rounded-xl border border-slate-700/50 p-4" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">
            {inspecoes.length} inspe\u00e7\u00e3o(s) hoje
          </span>
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400">{okCount} OK</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-400">{alertaCount} Alerta</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-slate-400">{pendenteCount} Pendente</span>
          </span>
        </div>
      </div>

      {/* Inspection cards */}
      <div className="space-y-2">
        {carregando ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : inspecoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <ClipboardList className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm">Nenhuma inspe\u00e7\u00e3o registrada hoje</p>
          </div>
        ) : (
          inspecoes.map((insp) => {
            const cfg = getStatusConfig(insp.status)
            const isExpanded = expandedId === insp.id
            const StatusIcon = cfg.icon

            return (
              <div
                key={insp.id}
                className="rounded-xl border border-slate-700/50 overflow-hidden transition-colors hover:border-emerald-600/30"
                style={{ background: 'hsl(222 47% 11%)' }}
              >
                {/* Card header — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : insp.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {insp.foto_url && (
                      <img
                        src={insp.foto_url}
                        alt="Foto"
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono font-semibold text-white truncate">
                          {insp.equipamento?.tag ?? '—'}
                        </p>
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0', cfg.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(insp.data)}
                        </span>
                        {insp.leitura != null && (
                          <span className="text-slate-300">Leitura: {insp.leitura}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-700/30">
                    {/* Full photo */}
                    {insp.foto_url && (
                      <button
                        onClick={() => setFullscreenPhoto(insp)}
                        className="w-full mt-3"
                      >
                        <img
                          src={insp.foto_url}
                          alt="Foto da inspe\u00e7\u00e3o"
                          className="w-full rounded-lg object-cover max-h-64"
                        />
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          Toque para ampliar
                        </p>
                      </button>
                    )}

                    {/* GPS */}
                    {(insp.latitude != null && insp.longitude != null) && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{insp.latitude.toFixed(6)}, {insp.longitude.toFixed(6)}</span>
                      </div>
                    )}

                    {/* Observations */}
                    {insp.observacoes && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Observa\u00e7\u00f5es</p>
                        <p className="text-sm text-slate-300">{insp.observacoes}</p>
                      </div>
                    )}

                    {/* HART diagnostic */}
                    {insp.hart_status && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">HART:</span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full',
                          insp.hart_status === 'OK'
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'bg-yellow-600/20 text-yellow-400'
                        )}>
                          {insp.hart_status}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Fullscreen photo modal */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setFullscreenPhoto(null)}
        >
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={fullscreenPhoto.foto_url!}
            alt="Foto em tela cheia"
            className="max-w-full max-h-[80vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {(fullscreenPhoto.latitude != null && fullscreenPhoto.longitude != null) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-white/70">
              <MapPin className="w-4 h-4" />
              <span>{fullscreenPhoto.latitude.toFixed(6)}, {fullscreenPhoto.longitude.toFixed(6)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
