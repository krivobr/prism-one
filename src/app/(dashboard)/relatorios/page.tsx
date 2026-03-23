'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { FileDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardData {
  kpis: { totalEquipamentos: number; ativos: number; calibracoesVencidas: number; pendencias: number }
  equipamentosPorFamilia: { nome: string; quantidade: number }[]
  equipamentosPorArea: { nome: string; quantidade: number }[]
  ordensPorTipo: { nome: string; quantidade: number }[]
}

const COLORS = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6']

// Mock data for evolution charts (would come from KPI history)
const evolucaoCheckLoop = [
  { mes: 'Jan', valor: 62 }, { mes: 'Fev', valor: 71 }, { mes: 'Mar', valor: 75 },
  { mes: 'Abr', valor: 80 }, { mes: 'Mai', valor: 84 }, { mes: 'Jun', valor: 84 },
  { mes: 'Jul', valor: 94 }, { mes: 'Ago', valor: 96 }, { mes: 'Set', valor: 97 },
  { mes: 'Out', valor: 98 }, { mes: 'Nov', valor: 98 }, { mes: 'Dez', valor: 98 },
]

const paradasNP = [
  { mes: 'Jan', valor: 3 }, { mes: 'Fev', valor: 3 }, { mes: 'Mar', valor: 2 },
  { mes: 'Abr', valor: 2 }, { mes: 'Mai', valor: 2 }, { mes: 'Jun', valor: 1 },
  { mes: 'Jul', valor: 1 }, { mes: 'Ago', valor: 1 }, { mes: 'Set', valor: 1 },
  { mes: 'Out', valor: 1 }, { mes: 'Nov', valor: 1 }, { mes: 'Dez', valor: 0 },
]

export default function RelatoriosPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [imprimindo, setImprimindo] = useState(false)
  const totalPaginas = 4

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) setData(await res.json())
      } catch { /* ignore */ }
      setCarregando(false)
    }
    carregar()
  }, [])

  if (carregando) return <div className="flex items-center justify-center h-64"><p className="text-slate-500">Carregando...</p></div>
  if (!data) return <div className="flex items-center justify-center h-64"><p className="text-red-400">Erro ao carregar</p></div>

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
            setTimeout(() => {
              window.print()
              setImprimindo(false)
            }, 100)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shrink-0 no-print"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Page content — Normal mode: show current page, Print mode: show all */}
      {imprimindo ? (
        <>
          <Pagina1 data={data} />
          <div className="print-page-break" />
          <Pagina2 data={data} />
          <div className="print-page-break" />
          <Pagina3 />
          <div className="print-page-break" />
          <Pagina4 />
        </>
      ) : (
        <>
          {pagina === 1 && <Pagina1 data={data} />}
          {pagina === 2 && <Pagina2 data={data} />}
          {pagina === 3 && <Pagina3 />}
          {pagina === 4 && <Pagina4 />}
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

// Página 1: Resumo executivo + KPIs + Evolução Check Loop (mockup imagem 2)
function Pagina1({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/50 p-6" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500">FSTECH PRISM™ ONE</p>
            <h2 className="text-xl font-bold text-white mt-1">Relatório Executivo</h2>
            <p className="text-sm text-slate-400 mt-0.5">Mineração Vale do Cobre S.A. — Unidade Sossego</p>
            <p className="text-xs text-slate-500 mt-1">Ref. REL-2026-03-001</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Gerado automaticamente</p>
            <p className="text-emerald-400 font-semibold">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard valor="98%" label="Check Loop" meta="Meta ≥90%" ok />
        <KpiCard valor={String(data.kpis.calibracoesVencidas)} label="Paradas NP" meta="Meta ≤2/mês" ok={data.kpis.calibracoesVencidas <= 2} />
        <KpiCard valor="412h" label="MTBF ALTA" meta="Meta ≥350h" ok />
        <KpiCard valor="71%" label="OS Plan." meta="Meta ≥70%" ok />
      </div>

      {/* Evolução Check Loop 12 meses */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <h3 className="text-sm font-semibold text-white mb-4">Evolução Check Loop — 12 Meses (%)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={evolucaoCheckLoop}>
            <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#fff' }} />
            <Bar dataKey="valor" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-500">Meta: ≥ 90%</p>
          <p className="text-xs text-emerald-400">Fev: 98% ✓</p>
        </div>
      </div>
    </div>
  )
}

// Página 2: Confiabilidade & Paradas (mockup imagem 1)
function Pagina2({ data }: { data: DashboardData }) {
  // Top 5 malhas mock (would come from instruments with highest ICD)
  const top5Malhas = [
    { tag: 'FT-1100A', icd: 22, ultimaInsp: '18/02/2026', desvio: 'Pendente', status: 'Pendente' },
    { tag: 'TT-1100B', icd: 21, ultimaInsp: '15/03/2026', desvio: '0.4%', status: 'OK' },
    { tag: 'PT-2210', icd: 19, ultimaInsp: '10/03/2026', desvio: '1.8%', status: 'Alerta' },
    { tag: 'LT-3301', icd: 18, ultimaInsp: '01/03/2026', desvio: 'Pendente', status: 'Pendente' },
    { tag: 'AT-4401', icd: 17, ultimaInsp: '14/03/2026', desvio: '0.1%', status: 'OK' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Confiabilidade & Paradas</h3>
          <span className="text-sm text-slate-400">Fevereiro 2026</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Paradas NP / Mês */}
          <div>
            <h4 className="text-xs text-slate-400 uppercase mb-2">Paradas NP / Mês</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={paradasNP}>
                <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="valor" fill="#F87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* MTBF Malhas Alta */}
          <div>
            <h4 className="text-xs text-slate-400 uppercase mb-2">MTBF Malhas Alta (h)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={evolucaoCheckLoop.map((d, i) => ({ mes: d.mes, valor: 200 + i * 25 }))}>
                <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#fff' }} />
                <Line type="monotone" dataKey="valor" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 5 Malhas */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <h3 className="text-sm font-semibold text-white mb-3">Top 5 Malhas — Atenção Este Mês</h3>
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
            {top5Malhas.map(m => (
              <tr key={m.tag} className="border-b border-slate-700/30 last:border-0">
                <td className="px-3 py-2.5 font-mono text-sm text-white">{m.tag}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
                    m.icd >= 20 ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
                  )}>{m.icd}</span>
                </td>
                <td className="px-3 py-2.5 text-center text-sm text-slate-400">{m.ultimaInsp}</td>
                <td className="px-3 py-2.5 text-center text-sm">
                  <span className={cn(m.desvio === 'Pendente' ? 'text-yellow-400' : parseFloat(m.desvio) > 1 ? 'text-red-400' : 'text-emerald-400')}>{m.desvio}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full',
                    m.status === 'OK' ? 'bg-emerald-600/20 text-emerald-400' :
                    m.status === 'Alerta' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-slate-600/20 text-slate-400'
                  )}>{m.status === 'OK' ? '✓ Ok' : m.status === 'Alerta' ? '⚠ Alerta' : '● Pendente'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Página 3: ROI Acumulado (mockup imagem 7)
function Pagina3() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Retorno Financeiro — ROI Acumulado</h3>
          <span className="text-sm text-slate-400">Fevereiro 2026</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-emerald-400">6,8×</p>
            <p className="text-xs text-slate-400 mt-1">ROI Realizado</p>
            <p className="text-xs text-slate-500">Meta: ≥ 4×</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-white">R$ 6,69M</p>
            <p className="text-xs text-slate-400 mt-1">Benefício Líquido</p>
            <p className="text-xs text-slate-500">Ano 1</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-cyan-400">1,2</p>
            <p className="text-xs text-slate-400 mt-1">meses</p>
            <p className="text-xs text-slate-500">Payback · Sobre R$ 985k</p>
          </div>
        </div>
      </div>

      {/* Composição do Benefício */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <h3 className="text-sm font-semibold text-white mb-4">Composição do Benefício</h3>
        <div className="space-y-3">
          {[
            { label: 'Paradas NP evitadas (17 eventos × R$ 185k)', valor: 'R$ 3,14M' },
            { label: 'Redução OS corretivas não planejadas', valor: 'R$ 890k' },
            { label: 'Qualidade — NC evitadas', valor: 'R$ 620k' },
            { label: 'Disponibilidade + produtividade', valor: 'R$ 430k' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
              <span className="text-sm text-slate-300">{item.label}</span>
              <span className="text-sm font-semibold text-emerald-400">{item.valor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evolução Maturidade M3 */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <h3 className="text-sm font-semibold text-white mb-4">Evolução Maturidade M3</h3>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-400">1,72</p>
            <p className="text-xs text-slate-500 mt-1">Início</p>
          </div>
          <div className="flex-1 mx-6">
            <div className="h-3 rounded-full bg-slate-700 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-emerald-500 to-cyan-500" style={{ width: '63%' }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-slate-500">
              <span>Reativo</span><span>Preventivo</span><span>Orientado</span><span>Digital</span><span>Excel.</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-400">3,14</p>
            <p className="text-xs text-slate-500 mt-1">Atual</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Página 4: Ações e Recomendações (mockup imagem 3)
function Pagina4() {
  const alertas = [
    { tag: 'PT-2210', prioridade: 'Alta', msg: 'Desvio 1,8% — acima do EMP 0,8%. Calibração preventiva recomendada.' },
    { tag: 'FT-1100A', prioridade: 'Alta', msg: 'Check Loop pendente há 28 dias. Prioridade ALTA — ICD 22.' },
    { tag: 'LT-3301', prioridade: 'Média', msg: 'Check Loop pendente há 18 dias. Agendar inspeção esta semana.' },
  ]

  const proximosPassos = [
    { num: '01', titulo: 'Calibração PT-2210', desc: 'Esta semana. OS gerada automaticamente no SAP PM — OS-2026-0342.', data: '07/03' },
    { num: '02', titulo: 'Check Loop FT-1100A e LT-3301', desc: 'Incluir no roteiro desta semana no app.', data: '07/03' },
    { num: '03', titulo: 'Reunião de Análise Mensal', desc: 'Dashboard ao vivo. Pauta gerada automaticamente — ver D4.', data: '10/03' },
    { num: '04', titulo: 'Auditoria M3 — Pilar P3', desc: 'Agendada para 15/03. Evidências já coletadas pelo sistema.', data: '15/03' },
  ]

  return (
    <div className="space-y-4">
      {/* Alertas */}
      <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Ações e Recomendações</h3>
          <span className="text-sm text-slate-400">Março 2026</span>
        </div>

        <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">⚠ Alertas Gerados Pelo Sistema</h4>
        <div className="space-y-3">
          {alertas.map((a, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border border-slate-700/30" style={{ background: 'hsl(222 47% 13%)' }}>
              <span className="text-yellow-400 text-lg mt-0.5">⚠</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm">{a.tag}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full',
                    a.prioridade === 'Alta' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
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
          {proximosPassos.map(p => (
            <div key={p.num} className="flex items-start gap-3 p-3 rounded-lg border border-slate-700/30 hover:border-emerald-600/30 transition" style={{ background: 'hsl(222 47% 13%)' }}>
              <span className="text-emerald-400 font-bold text-lg w-8">{p.num}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{p.titulo}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.desc}</p>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{p.data}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="rounded-xl border border-emerald-600/30 p-4" style={{ background: 'hsl(160 84% 39% / 0.05)' }}>
        <p className="text-sm text-emerald-400">
          Relatório gerado automaticamente pelo PRISM™ One em {new Date().toLocaleDateString('pt-BR')} às 00:01.
          Nenhum trabalho manual necessário. Próximo relatório: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}.
        </p>
        <p className="text-xs text-slate-500 mt-1">Para dúvidas: carlos.mendes@fstech.com.br</p>
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
