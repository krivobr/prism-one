import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id_empresa = session.user.id_empresa

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // KPIs — run counts in parallel
  const [totalEquipamentos, ativos, calibracoesVencidas, pendencias, ultimasInspecoes] =
    await Promise.all([
      prisma.pO_Equipamento.count({
        where: { id_empresa, status: { not: 'Inativo' } },
      }),
      prisma.pO_Equipamento.count({
        where: { id_empresa, status: 'ativo' },
      }),
      prisma.pO_Equipamento.count({
        where: {
          id_empresa,
          proxima_calibracao: { lt: now, not: null },
        },
      }),
      prisma.pO_OrdemServico.count({
        where: { id_empresa, pendencia: true },
      }),
      prisma.pO_Inspecao.count({
        where: { id_empresa, data: { gte: thirtyDaysAgo } },
      }),
    ])

  // Equipamentos with relations for grouping
  const equipamentos = await prisma.pO_Equipamento.findMany({
    where: { id_empresa, status: { not: 'Inativo' } },
    include: {
      familia: { select: { nome: true } },
      area: { select: { nome: true } },
    },
  })

  // Group by família
  const equipamentosPorFamilia = Object.entries(
    equipamentos.reduce((acc, eq) => {
      const nome = eq.familia?.nome || 'Sem família'
      acc[nome] = (acc[nome] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)

  // Group by área
  const equipamentosPorArea = Object.entries(
    equipamentos.reduce((acc, eq) => {
      const nome = eq.area?.nome || 'Sem área'
      acc[nome] = (acc[nome] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)

  // Ordens por tipo
  const ordens = await prisma.pO_OrdemServico.findMany({
    where: { id_empresa },
    include: { tipo: { select: { nome: true } } },
  })

  const ordensPorTipo = Object.entries(
    ordens.reduce((acc, o) => {
      const nome = o.tipo?.nome || 'Sem tipo'
      acc[nome] = (acc[nome] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)

  return NextResponse.json({
    kpis: {
      totalEquipamentos,
      ativos,
      calibracoesVencidas,
      pendencias,
      ultimasInspecoes,
    },
    equipamentosPorFamilia,
    equipamentosPorArea,
    ordensPorTipo,
  })
}
