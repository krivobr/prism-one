'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Wrench, AlertTriangle, ClipboardCheck, Clock } from 'lucide-react'

interface DashboardData {
  kpis: {
    totalEquipamentos: number
    ativos: number
    calibracoesVencidas: number
    pendencias: number
    ultimasInspecoes: number
  }
  equipamentosPorFamilia: { nome: string; quantidade: number }[]
  equipamentosPorArea: { nome: string; quantidade: number }[]
  ordensPorTipo: { nome: string; quantidade: number }[]
}

const COLORS = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16', '#A855F7']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)

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

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Carregando dashboard...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Erro ao carregar dados</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Relatório Executivo</p>
        <h1 className="text-2xl font-bold text-white mt-1">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Visão geral dos indicadores</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Wrench} label="Equipamentos" value={data.kpis.totalEquipamentos} sublabel={`${data.kpis.ativos} ativos`} color="emerald" />
        <KpiCard icon={AlertTriangle} label="Calib. Vencidas" value={data.kpis.calibracoesVencidas} sublabel="próx. calibração expirada" color={data.kpis.calibracoesVencidas > 0 ? 'red' : 'emerald'} />
        <KpiCard icon={Clock} label="Pendências" value={data.kpis.pendencias} sublabel="ordens com pendência" color={data.kpis.pendencias > 0 ? 'yellow' : 'emerald'} />
        <KpiCard icon={ClipboardCheck} label="Inspeções" value={data.kpis.ultimasInspecoes} sublabel="registros de check loop" color="cyan" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Equipamentos por Família */}
        <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
          <h3 className="text-sm font-semibold text-white mb-4">Equipamentos por Família</h3>
          {data.equipamentosPorFamilia.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.equipamentosPorFamilia} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                <YAxis type="category" dataKey="nome" width={140} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="quantidade" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">Sem dados</p>
          )}
        </div>

        {/* Equipamentos por Área */}
        <div className="rounded-xl border border-slate-700/50 p-5" style={{ background: 'hsl(222 47% 11%)' }}>
          <h3 className="text-sm font-semibold text-white mb-4">Equipamentos por Área</h3>
          {data.equipamentosPorArea.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.equipamentosPorArea} dataKey="quantidade" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label={({ name, value }: any) => `${name}: ${value}`} labelLine={false}>
                  {data.equipamentosPorArea.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">Sem dados</p>
          )}
        </div>

        {/* Ordens por Tipo */}
        <div className="rounded-xl border border-slate-700/50 p-5 md:col-span-2" style={{ background: 'hsl(222 47% 11%)' }}>
          <h3 className="text-sm font-semibold text-white mb-4">Ordens de Serviço por Tipo</h3>
          {data.ordensPorTipo.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.ordensPorTipo}>
                <XAxis dataKey="nome" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="quantidade" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">Sem dados — migre os dados do Access</p>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sublabel, color }: {
  icon: any; label: string; value: number; sublabel: string; color: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    cyan: 'text-cyan-400',
  }

  return (
    <div className="rounded-xl border border-slate-700/50 p-4" style={{ background: 'hsl(222 47% 11%)' }}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${colorMap[color] || 'text-slate-400'}`} />
      </div>
      <p className={`text-3xl font-bold ${colorMap[color] || 'text-white'}`}>{value}</p>
      <p className="text-sm text-slate-300 mt-1">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>
    </div>
  )
}
