'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ClipboardCheck, TrendingDown, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Equipamento {
  id: number
  tag: string
  descricao: string | null
  modelo: string | null
  serie: string | null
  funcao: string | null
  icd: number | null
  alcance: string | null
  faixa: string | null
  status: string
  periodo_calibracao: number | null
  ultima_calibracao: string | null
  proxima_calibracao: string | null
  observacoes: string | null
  fabricante: { nome: string } | null
  familia: { nome: string } | null
  area: { nome: string } | null
  processo: { nome: string } | null
  protocolo: { nome: string } | null
  alimentacao: { nome: string } | null
  sinal_entrada: { nome: string } | null
  sinal_saida: { nome: string } | null
}

interface Inspecao {
  id: number
  data: string
  leitura: number | null
  status: string
  desvio_percentual: number | null
  observacoes: string | null
  foto_url: string | null
  latitude: number | null
  longitude: number | null
  diagnostico_hart: boolean | null
  executante: { nome: string } | null
}

export default function DetalheInstrumentoPage() {
  const params = useParams()
  const router = useRouter()
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null)
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [fotoModal, setFotoModal] = useState<Inspecao | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const [eqRes, inspRes] = await Promise.all([
          fetch(`/api/equipamentos?id=${params.id}`),
          fetch(`/api/inspecoes?equipamento=${params.id}`),
        ])
        if (eqRes.ok) {
          const eqs = await eqRes.json()
          const eq = Array.isArray(eqs) ? eqs.find((e: any) => e.id === Number(params.id)) : eqs
          setEquipamento(eq || null)
        }
        if (inspRes.ok) setInspecoes(await inspRes.json())
      } catch { /* ignore */ }
      setCarregando(false)
    }
    carregar()
  }, [params.id])

  if (carregando) return <div className="flex items-center justify-center h-64"><p className="text-slate-500">Carregando...</p></div>
  if (!equipamento) return <div className="flex items-center justify-center h-64"><p className="text-red-400">Instrumento não encontrado</p></div>

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  const historicoDeriva = inspecoes
    .map(i => ({ data: formatDate(i.data), desvio: i.desvio_percentual || 0 }))
    .reverse()

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header mobile-style */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-lg font-mono font-bold text-white">{equipamento.tag}</p>
          <p className="text-sm text-slate-400">{equipamento.descricao}</p>
        </div>
      </div>

      {/* ICD + Protocol badges */}
      <div className="flex gap-2">
        {equipamento.icd && (
          <span className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-bold',
            equipamento.icd >= 20 ? 'bg-red-600/20 text-red-400' :
            equipamento.icd >= 15 ? 'bg-yellow-600/20 text-yellow-400' :
            'bg-emerald-600/20 text-emerald-400'
          )}>
            ICD {equipamento.icd} — {equipamento.icd >= 20 ? 'ALTA' : equipamento.icd >= 15 ? 'MÉDIA' : 'BAIXA'}
          </span>
        )}
        {equipamento.protocolo && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-cyan-600/20 text-cyan-400">
            {equipamento.protocolo.nome}
          </span>
        )}
      </div>

      {/* Dados Técnicos */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">Dados Técnicos</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Descrição" value={equipamento.descricao} />
          <Field label="Fabricante" value={equipamento.fabricante?.nome} />
          <Field label="Modelo" value={equipamento.modelo} />
          <Field label="Série" value={equipamento.serie} />
          <Field label="Família" value={equipamento.familia?.nome} />
          <Field label="Área" value={equipamento.area?.nome} />
          <Field label="Processo" value={equipamento.processo?.nome} />
          <Field label="Função" value={equipamento.funcao} />
          <Field label="Faixa" value={equipamento.faixa} />
          <Field label="Alcance" value={equipamento.alcance} />
          <Field label="Sinal Entrada" value={equipamento.sinal_entrada?.nome} />
          <Field label="Sinal Saída" value={equipamento.sinal_saida?.nome} />
          <Field label="Alimentação" value={equipamento.alimentacao?.nome} />
          <Field label="Período Calib." value={equipamento.periodo_calibracao ? `${equipamento.periodo_calibracao} meses` : null} />
          <Field label="Último check" value={formatDate(equipamento.ultima_calibracao)} />
          <Field label="Próxima calibração" value={formatDate(equipamento.proxima_calibracao)} />
        </div>
      </div>

      {/* Histórico de Deriva */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Histórico de Deriva</h3>
          {historicoDeriva.length > 0 && (
            <span className="text-xs text-slate-500">Últimas {historicoDeriva.length} inspeções</span>
          )}
        </div>
        {historicoDeriva.length > 0 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={historicoDeriva}>
              <XAxis dataKey="data" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} unit="%" />
              <Tooltip contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Line type="monotone" dataKey="desvio" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500 py-6 text-center">Nenhuma inspeção realizada. Inicie uma inspeção para gerar o histórico.</p>
        )}
      </div>

      {/* Botão Iniciar Inspeção */}
      <button
        onClick={() => router.push(`/check-loop/${params.id}/inspecao`)}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg transition flex items-center justify-center gap-2"
      >
        <ClipboardCheck className="w-5 h-5" />
        Iniciar Inspeção →
      </button>

      {/* Histórico de inspeções */}
      {inspecoes.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
          <h3 className="text-sm font-semibold text-white mb-3">Últimas Inspeções</h3>
          <div className="space-y-2">
            {inspecoes.slice(0, 10).map(insp => (
              <div key={insp.id} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                {/* Thumbnail */}
                {insp.foto_url ? (
                  <button
                    onClick={() => setFotoModal(insp)}
                    className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-slate-600 hover:border-emerald-500 transition"
                  >
                    <img src={insp.foto_url} alt="Foto" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-700/50 border border-slate-700" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white">{formatDate(insp.data)}</p>
                    <p className="text-xs text-slate-500">{insp.executante?.nome || '—'}</p>
                  </div>
                  {insp.observacoes && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{insp.observacoes}</p>
                  )}
                  {insp.latitude != null && insp.longitude != null && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {Number(insp.latitude).toFixed(5)}, {Number(insp.longitude).toFixed(5)}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="text-right flex-shrink-0">
                  {insp.leitura != null && <p className="text-sm text-slate-300">{insp.leitura}</p>}
                  <span className={cn('text-xs px-2 py-0.5 rounded-full',
                    insp.status === 'OK' ? 'bg-emerald-600/20 text-emerald-400' :
                    insp.status === 'Alerta' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-slate-600/20 text-slate-400'
                  )}>{insp.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de foto fullscreen */}
      {fotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setFotoModal(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-2xl overflow-hidden border border-slate-700"
            style={{ background: 'hsl(222 47% 11%)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setFotoModal(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image */}
            {fotoModal.foto_url && (
              <img src={fotoModal.foto_url} alt="Foto da inspeção" className="w-full object-contain max-h-[60vh]" />
            )}

            {/* Details */}
            <div className="p-4 space-y-2">
              <p className="text-sm text-white font-medium">{formatDate(fotoModal.data)}</p>

              {fotoModal.latitude != null && fotoModal.longitude != null && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {Number(fotoModal.latitude).toFixed(6)}, {Number(fotoModal.longitude).toFixed(6)}
                </p>
              )}

              {fotoModal.observacoes && (
                <p className="text-sm text-slate-300">{fotoModal.observacoes}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-white mt-0.5">{value || '—'}</p>
    </div>
  )
}
