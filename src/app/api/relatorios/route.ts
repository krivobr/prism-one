import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getLast12Months(): { start: Date; end: Date; label: string }[] {
  const now = new Date()
  const months: { start: Date; end: Date; label: string }[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const label = MESES_PT[d.getMonth()]
    months.push({ start, end, label })
  }

  return months
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id_empresa = session.user.id_empresa
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const months = getLast12Months()

  // --- evolucaoCheckLoop: % inspeções OK por mês (últimos 12 meses) ---
  const allInspecoes = await prisma.pO_Inspecao.findMany({
    where: {
      id_empresa,
      data: { gte: months[0].start },
    },
    select: { data: true, status: true },
  })

  const evolucaoCheckLoop = months.map(({ start, end, label }) => {
    const doMes = allInspecoes.filter(
      (i) => i.data >= start && i.data <= end
    )
    const total = doMes.length
    const ok = doMes.filter((i) => i.status === 'OK').length
    const valor = total > 0 ? Math.round((ok / total) * 100) : 0
    return { mes: label, valor }
  })

  // --- paradasNP: OS corretivas por mês (últimos 12 meses) ---
  const tiposCorretiva = await prisma.pO_Tipo.findMany({
    where: { id_empresa, nome: { contains: 'Corretiva' } },
    select: { id: true },
  })
  const idsCorretiva = tiposCorretiva.map((t) => t.id)

  const ordensCorretivas = await prisma.pO_OrdemServico.findMany({
    where: {
      id_empresa,
      id_tipo: { in: idsCorretiva },
      data: { gte: months[0].start },
    },
    select: { data: true },
  })

  const paradasNP = months.map(({ start, end, label }) => {
    const valor = ordensCorretivas.filter(
      (o) => o.data >= start && o.data <= end
    ).length
    return { mes: label, valor }
  })

  // --- top5Malhas: 5 equipamentos com maior ICD ---
  const topEquips = await prisma.pO_Equipamento.findMany({
    where: { id_empresa, icd: { not: null }, status: { not: 'Inativo' } },
    orderBy: { icd: 'desc' },
    take: 5,
    select: {
      tag: true,
      icd: true,
      inspecoes: {
        orderBy: { data: 'desc' },
        take: 1,
        select: { status: true, desvio_percentual: true, data: true },
      },
    },
  })

  const top5Malhas = topEquips.map((eq) => {
    const ultima = eq.inspecoes[0]
    return {
      tag: eq.tag,
      icd: eq.icd ?? 0,
      ultimaInspecao: ultima?.data?.toISOString().split('T')[0] ?? '-',
      desvio: ultima?.desvio_percentual ?? 0,
      status: ultima?.status ?? 'Sem inspeção',
    }
  })

  // --- checkLoopPercent: % inspeções OK nos últimos 30 dias ---
  const inspecoes30d = allInspecoes.filter((i) => i.data >= thirtyDaysAgo)
  const total30d = inspecoes30d.length
  const ok30d = inspecoes30d.filter((i) => i.status === 'OK').length
  const checkLoopPercent = total30d > 0 ? Math.round((ok30d / total30d) * 100) : 0

  // --- mtbfAlta: média de periodo_calibracao para equipamentos com ICD >= 20 ---
  const equipsAlta = await prisma.pO_Equipamento.findMany({
    where: {
      id_empresa,
      icd: { gte: 20 },
      periodo_calibracao: { not: null },
      status: { not: 'Inativo' },
    },
    select: { periodo_calibracao: true },
  })
  const somaPC = equipsAlta.reduce((s, e) => s + (e.periodo_calibracao ?? 0), 0)
  const mtbfAlta = equipsAlta.length > 0 ? Math.round(somaPC / equipsAlta.length) : 0

  // --- osPlanejadasPercent: % OS planejadas (Preventiva ou Calibração) ---
  const [totalOS, osPlanejadas] = await Promise.all([
    prisma.pO_OrdemServico.count({ where: { id_empresa } }),
    prisma.pO_OrdemServico.count({
      where: {
        id_empresa,
        tipo: {
          OR: [
            { nome: { contains: 'Preventiva' } },
            { nome: { contains: 'Calibração' } },
          ],
        },
      },
    }),
  ])
  const osPlanejadasPercent = totalOS > 0 ? Math.round((osPlanejadas / totalOS) * 100) : 0

  // --- totalCalibracoes: aprovadas vs reprovadas ---
  const [aprovadas, reprovadas] = await Promise.all([
    prisma.pO_Calibracao.count({
      where: { id_empresa, resultado: 'Aprovado' },
    }),
    prisma.pO_Calibracao.count({
      where: { id_empresa, resultado: 'Reprovado' },
    }),
  ])

  return NextResponse.json({
    evolucaoCheckLoop,
    paradasNP,
    top5Malhas,
    checkLoopPercent,
    mtbfAlta,
    osPlanejadasPercent,
    totalCalibracoes: { aprovadas, reprovadas },
  })
}
