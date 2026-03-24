'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { FileDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RelatorioData {
  evolucaoCheckLoop: { mes: string; valor: number }[]
  paradasNP: { mes: string; valor: number }[]
  top5Malhas: { tag: string; icd: number; ultimaInspecao: string; desvio: number; status: string }[]
  checkLoopPercent: number
  mtbfAlta: number
  osPlanejadasPercent: number
  totalCalibracoes: { aprovadas: number; reprovadas: number }
}

interface DashboardData {
  kpis: { totalEquipamentos: number; ativos: number; calibracoesVencidas: number; pendencias: number }
}

const TOOLTIP_STYLE = { background: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#fff' }

export default function RelatoriosPage() {
  const { data: session } = useSession()
  const [rel, setRel] = useState<RelatorioData | null>(null)
  const [dash, setDash] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [imprimindo, setImprimindo] = useState(false)
  const totalPaginas = 4

  const empresaNome = (session?.user as any)?.empresa_nome ?? 'Empresa'

  useEffect(() => {
    Promise.all([
      fetch('/api/relatorios').then(r => r.ok ? r.json() : null),
      fetch('/api/dashboard').then(r => r.ok ? r.json() : null),
    ]).then(([relData, dashData]) => {
      setRel(relData)
      setDash(dashData)
      setCarregando(false)
    }).catch(() => setCarregando(false))
  }, [])

  if (carregando) return <div className="flex items-center justify-center h-64"><p className="text-slate-500">Carregando...</p></div>
  if (!rel || !dash) return <div className="flex items-center justify-center h-64"><p className="text-red-400">Erro ao carregar relatórios</p></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">FSTECH PRISM™ ONE</p>
          <h1 className="text-xl font-bold text-white mt-1">Relatório Executivo</h1>
          <p className="text-sm text-slate-400 mt-0.5">Auto-gerado · {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <button
          onClick={() => {
            setImprimindo(true)
            setTimeout(() => { window.print(); setImprimindo(false) }, 100)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shrink-0 no-print"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {imprimindo ? (
        <>
          <Pagina1 rel={rel} dash={dash} empresaNome={empresaNome} />
          <div className="print-page-break" />
          <Pagina2 rel={rel} />
          <div className="print-page-break" />
          <Pagina3 rel={rel} />
          <div className="print-page-break" />
          <Pagina4 rel={rel} dash={dash} />
        </>
      ) : (
        <>
          {pagina === 1 && <Pagina1 rel={rel} dash={dash} empresaNome={empresaNome} />}
          {pagina === 2 && <Pagina2 rel={rel} />}
          {pagina === 3 && <Pagina3 rel={rel} />}
          {pagina === 4 && <Pagina4 rel={rel} dash={dash} />}
        </>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-4 no-print">
        <button onClick={() => setPagina(Math.max(1, pagina - 1))} disabled={pagina === 1} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition disabled:opacity-30">
          <ChevronLeft className="w-5 h-5" />
        </button>
        {[1, 2, 3, 4].map(p => (
          <button key={p} onClick={() => setPagina(p)} className={cn('w-9 h-9 rounded-lg text-sm font-medium transition', pagina === p ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700')}>
            {p}
          </button>
        ))}
        <button onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))} disabled={pagina === totalPaginas} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center">
        FSTECH PRISM™ One · Gerado automaticamente · Confidencial · Página {pagina}/{totalPaginas}
      </p>
    </div>
  )
}

// ─── Página 1: Resumo Executivo + KPIs + Evolução Check Loop ───
function Pagina1({ rel, dash, empresaNome }: { rel: RelatorioData; dash: DashboardData; empresaNome: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/50 p-6" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500">FSTECH PRISM™ ONE</p>
            <h2 className="text-xl font-bold text-white mt-1">Relatório Executivo</h2>
            <p className="text-sm text-slate-400 mt-0.5">{empresaNome}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Gerado automaticamente</p>
            <p className="text-emerald-400 font-semibold">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards — dados reais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard valor={`${rel.checkLoopPercent}%`} label="Check Loop" meta="Meta ≥90%" ok={rel.checkLoopPercent >= 90} />
        <KpiCard valor={String(dash.kpis.calibracoesVencidas)} label="Calib. Vencidas" meta="Meta ≤2" ok={dash.kpis.calibracoesVencidas <= 2} />
        <KpiCard valor={`${rel.mtbfAlta}h`} label="MTBF ALTA" meta="Meta ≥350h" ok={rel.mtbfAlta >= 350} />
        <KpiCard valor={`${rel.osPlanejadasPercent}%`} label="OS Plan." meta="Meta ≥70%" ok={rel.osPlanejadasPercent >= 70} />
      </div>

      {/* Evolução Check Loop 12 meses — dados reais */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <h3 className="text-sm font-semibold text-white mb-4">Evolução Check Loop — 12 Meses (%)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rel.evolucaoCheckLoop}>
            <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="valor" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-500">Meta: ≥ 90%</p>
          <p className={cn('text-xs', rel.checkLoopPercent >= 90 ? 'text-emerald-400' : 'text-red-400')}>
            Atual: {rel.checkLoopPercent}% {rel.checkLoopPercent >= 90 ? '✓' : '✗'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Página 2: Confiabilidade & Paradas ───
function Pagina2({ rel }: { rel: RelatorioData }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Confiabilidade & Paradas</h3>
          <span className="text-sm text-slate-400">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs text-slate-400 uppercase mb-2">Paradas NP / Mês (OS Corretivas)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={rel.paradasNP}>
                <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="valor" fill="#F87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-xs text-slate-400 uppercase mb-2">Evolução Check Loop (%)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={rel.evolucaoCheckLoop}>
                <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="valor" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 5 Malhas — dados reais */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <h3 className="text-sm font-semibold text-white mb-3">Top 5 Malhas — Maior ICD</h3>
        {rel.top5Malhas.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Nenhum equipamento com ICD registrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">TAG</th>
                  <th className="text-center px-3 py-2 text-xs text-slate-400 uppercase">ICD</th>
                  <th className="text-center px-3 py-2 text-xs text-slate-400 uppercase">Última Insp.</th>
                  <th className="text-center px-3 py-2 text-xs text-slate-400 uppercase">Desvio</th>
                  <th className="text-center px-3 py-2 text-xs text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {rel.top5Malhas.map(m => (
                  <tr key={m.tag} className="border-b border-slate-700/30 last:border-0">
                    <td className="px-3 py-2.5 font-mono text-sm text-white">{m.tag}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
                        m.icd >= 20 ? 'bg-red-600/20 text-red-400' : m.icd >= 15 ? 'bg-yellow-600/20 text-yellow-400' : 'bg-emerald-600/20 text-emerald-400'
                      )}>{m.icd}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm text-slate-400">
                      {m.ultimaInspecao !== '-' ? new Date(m.ultimaInspecao).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm">
                      <span className={cn(
                        m.desvio === 0 && m.status === 'Sem inspeção' ? 'text-slate-500' :
                        m.desvio > 1 ? 'text-red-400' : 'text-emerald-400'
                      )}>
                        {m.status === 'Sem inspeção' ? 'Pendente' : `${m.desvio}%`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full',
                        m.status === 'OK' ? 'bg-emerald-600/20 text-emerald-400' :
                        m.status === 'Alerta' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-slate-600/20 text-slate-400'
                      )}>
                        {m.status === 'OK' ? '✓ Ok' : m.status === 'Alerta' ? '⚠ Alerta' : '● ' + m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Página 3: ROI Acumulado ───
function Pagina3({ rel }: { rel: RelatorioData }) {
  const totalCalib = rel.totalCalibracoes.aprovadas + rel.totalCalibracoes.reprovadas
  const taxaAprov = totalCalib > 0 ? Math.round((rel.totalCalibracoes.aprovadas / totalCalib) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Indicadores de Qualidade</h3>
          <span className="text-sm text-slate-400">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-emerald-400">{rel.totalCalibracoes.aprovadas}</p>
            <p className="text-xs text-slate-400 mt-1">Calibrações Aprovadas</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-red-400">{rel.totalCalibracoes.reprovadas}</p>
            <p className="text-xs text-slate-400 mt-1">Calibrações Reprovadas</p>
          </div>
          <div className="text-center">
            <p className={cn('text-4xl font-bold', taxaAprov >= 90 ? 'text-emerald-400' : 'text-yellow-400')}>{taxaAprov}%</p>
            <p className="text-xs text-slate-400 mt-1">Taxa de Aprovação</p>
          </div>
          <div className="text-center">
            <p className={cn('text-4xl font-bold', rel.checkLoopPercent >= 90 ? 'text-emerald-400' : 'text-yellow-400')}>{rel.checkLoopPercent}%</p>
            <p className="text-xs text-slate-400 mt-1">Check Loop OK</p>
          </div>
        </div>
      </div>

      {/* Resumo de Confiabilidade */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <h3 className="text-sm font-semibold text-white mb-4">Resumo de Confiabilidade</h3>
        <div className="space-y-3">
          {[
            { label: 'Check Loop — Inspeções OK (30 dias)', valor: `${rel.checkLoopPercent}%`, ok: rel.checkLoopPercent >= 90 },
            { label: 'MTBF Médio — Malhas Alta Criticidade', valor: `${rel.mtbfAlta}h`, ok: rel.mtbfAlta >= 350 },
            { label: 'OS Planejadas (Preventiva + Calibração)', valor: `${rel.osPlanejadasPercent}%`, ok: rel.osPlanejadasPercent >= 70 },
            { label: 'Taxa de Aprovação de Calibrações', valor: `${taxaAprov}%`, ok: taxaAprov >= 90 },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
              <span className="text-sm text-slate-300">{item.label}</span>
              <span className={cn('text-sm font-semibold', item.ok ? 'text-emerald-400' : 'text-yellow-400')}>{item.valor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evolução Maturidade M3 — calculada dos KPIs */}
      <MaturityM3 rel={rel} />
    </div>
  )
}

// ─── Página 4: Ações e Recomendações — geradas dinamicamente ───
function Pagina4({ rel, dash }: { rel: RelatorioData; dash: DashboardData }) {
  // Gerar alertas dinamicamente a partir dos dados reais
  const alertas: { tag: string; prioridade: string; msg: string }[] = []

  // Alertas de equipamentos com ICD alto
  rel.top5Malhas.forEach(m => {
    if (m.icd >= 20 && m.status !== 'OK') {
      alertas.push({
        tag: m.tag,
        prioridade: 'Alta',
        msg: `ICD ${m.icd} — ${m.status === 'Sem inspeção' ? 'Check Loop pendente. Priorizar inspeção.' : `Desvio ${m.desvio}%. Verificar calibração.`}`,
      })
    } else if (m.icd >= 15 && m.status === 'Alerta') {
      alertas.push({
        tag: m.tag,
        prioridade: 'Média',
        msg: `ICD ${m.icd} — Desvio ${m.desvio}%. Agendar inspeção preventiva.`,
      })
    }
  })

  // Alerta de calibrações vencidas
  if (dash.kpis.calibracoesVencidas > 0) {
    alertas.push({
      tag: 'GERAL',
      prioridade: dash.kpis.calibracoesVencidas > 5 ? 'Alta' : 'Média',
      msg: `${dash.kpis.calibracoesVencidas} calibração(ões) vencida(s). Agendar recalibração.`,
    })
  }

  // Se não houver alertas
  if (alertas.length === 0) {
    alertas.push({
      tag: 'SISTEMA',
      prioridade: 'Info',
      msg: 'Todos os indicadores estão dentro das metas. Manter rotina de inspeções.',
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Ações e Recomendações</h3>
          <span className="text-sm text-slate-400">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>

        <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">⚠ Alertas Gerados Pelo Sistema</h4>
        <div className="space-y-3">
          {alertas.map((a, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border border-slate-700/30" style={{ background: 'hsl(222 47% 13%)' }}>
              <span className={cn('text-lg mt-0.5', a.prioridade === 'Alta' ? 'text-red-400' : a.prioridade === 'Info' ? 'text-emerald-400' : 'text-yellow-400')}>
                {a.prioridade === 'Info' ? '✓' : '⚠'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm">{a.tag}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full',
                    a.prioridade === 'Alta' ? 'bg-red-600/20 text-red-400' :
                    a.prioridade === 'Info' ? 'bg-emerald-600/20 text-emerald-400' :
                    'bg-yellow-600/20 text-yellow-400'
                  )}>Prioridade {a.prioridade}</span>
                </div>
                <p className="text-sm text-slate-300 mt-1">{a.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Próximos Passos */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Próximos Passos Recomendados</h4>
        <div className="space-y-2">
          {[
            { num: '01', titulo: 'Executar Check Loop pendentes', desc: `${rel.top5Malhas.filter(m => m.status !== 'OK').length} instrumento(s) com inspeção pendente ou em alerta.` },
            { num: '02', titulo: 'Recalibrar instrumentos vencidos', desc: `${dash.kpis.calibracoesVencidas} calibração(ões) vencida(s) identificada(s).` },
            { num: '03', titulo: 'Revisar OS pendentes', desc: `${dash.kpis.pendencias} ordem(ns) de serviço pendente(s).` },
            { num: '04', titulo: 'Reunião de Análise Mensal', desc: 'Dashboard ao vivo. Pauta gerada automaticamente pelo PRISM™ One.' },
          ].map(p => (
            <div key={p.num} className="flex items-start gap-3 p-3 rounded-lg border border-slate-700/30 hover:border-emerald-600/30 transition" style={{ background: 'hsl(222 47% 13%)' }}>
              <span className="text-emerald-400 font-bold text-lg w-8">{p.num}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{p.titulo}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-xl border border-emerald-600/30 p-4" style={{ background: 'hsl(160 84% 39% / 0.05)' }}>
        <p className="text-sm text-emerald-400">
          Relatório gerado automaticamente pelo PRISM™ One em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
        </p>
        <p className="text-xs text-slate-500 mt-1">Dados calculados em tempo real a partir do banco de dados.</p>
      </div>
    </div>
  )
}

// Maturidade M3 calculada a partir dos KPIs reais
// Escala 1-5: Reativo(1) → Preventivo(2) → Orientado(3) → Digital(4) → Excelência(5)
// Fórmula: média ponderada de 4 indicadores normalizados
function MaturityM3({ rel }: { rel: RelatorioData }) {
  const totalCalib = rel.totalCalibracoes.aprovadas + rel.totalCalibracoes.reprovadas
  const taxaAprov = totalCalib > 0 ? (rel.totalCalibracoes.aprovadas / totalCalib) * 100 : 0

  // Normalizar cada KPI para escala 0-1
  const nCheckLoop = Math.min(rel.checkLoopPercent / 100, 1)
  const nMtbf = Math.min(rel.mtbfAlta / 500, 1) // 500h = referência ótima
  const nOsPlan = Math.min(rel.osPlanejadasPercent / 100, 1)
  const nCalib = Math.min(taxaAprov / 100, 1)

  // Maturidade atual: média ponderada → escala 1-5
  const score = 1 + ((nCheckLoop * 0.3 + nMtbf * 0.2 + nOsPlan * 0.25 + nCalib * 0.25) * 4)
  const maturidadeAtual = Math.round(score * 100) / 100
  const progressWidth = ((maturidadeAtual - 1) / 4) * 100

  return (
    <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
      <h3 className="text-sm font-semibold text-white mb-4">Maturidade M3 — Calculada dos KPIs</h3>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-400">1,00</p>
          <p className="text-xs text-slate-500 mt-1">Base</p>
        </div>
        <div className="flex-1 mx-6">
          <div className="h-3 rounded-full bg-slate-700 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-emerald-500 to-cyan-500"
              style={{ width: `${Math.max(0, Math.min(100, progressWidth))}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-slate-500">
            <span>Reativo</span><span>Preventivo</span><span>Orientado</span><span>Digital</span><span>Excel.</span>
          </div>
        </div>
        <div className="text-center">
          <p className={cn('text-3xl font-bold', maturidadeAtual >= 3 ? 'text-emerald-400' : maturidadeAtual >= 2 ? 'text-yellow-400' : 'text-red-400')}>
            {maturidadeAtual.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Atual</p>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ valor, label, meta, ok }: { valor: string; label: string; meta: string; ok: boolean }) {
  return (
    <div className="rounded-xl border border-slate-700/50 p-4 text-center" style={{ background: 'hsl(222 47% 11%)' }}>
      <p className={cn('text-3xl font-bold', ok ? 'text-emerald-400' : 'text-red-400')}>{valor}</p>
      <p className="text-sm text-slate-300 mt-1">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{meta}</p>
      <p className={cn('text-xs mt-1', ok ? 'text-emerald-400' : 'text-red-400')}>{ok ? '✓ OK' : '✗ Atenção'}</p>
    </div>
  )
}
