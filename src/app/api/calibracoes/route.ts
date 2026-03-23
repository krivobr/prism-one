import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const equipamentoId = searchParams.get('equipamento') ? Number(searchParams.get('equipamento')) : undefined

  const where: any = { id_empresa: session.user.id_empresa }
  if (equipamentoId) where.id_equipamento = equipamentoId

  const calibracoes = await prisma.pO_Calibracao.findMany({
    where,
    include: {
      equipamento: { select: { tag: true, descricao: true } },
      executante: { select: { nome: true } },
      pontos: { orderBy: { numero_ponto: 'asc' } },
    },
    orderBy: { data: 'desc' },
  })

  return NextResponse.json(calibracoes)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { pontos, ...dados } = body

  const calibracao = await prisma.pO_Calibracao.create({
    data: {
      id_empresa: session.user.id_empresa,
      ...dados,
      pontos: pontos ? { create: pontos } : undefined,
    },
    include: { pontos: true },
  })

  return NextResponse.json(calibracao, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, pontos, ...dados } = body

  const existing = await prisma.pO_Calibracao.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Transaction: update calibration + replace points
  const calibracao = await prisma.$transaction(async (tx) => {
    if (pontos) {
      await tx.pO_PontoCalibracao.deleteMany({ where: { id_calibracao: id } })
    }
    return tx.pO_Calibracao.update({
      where: { id },
      data: {
        ...dados,
        pontos: pontos ? { create: pontos } : undefined,
      },
      include: { pontos: true },
    })
  })

  return NextResponse.json(calibracao)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const existing = await prisma.pO_Calibracao.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.pO_PontoCalibracao.deleteMany({ where: { id_calibracao: id } })
    await tx.pO_Calibracao.delete({ where: { id } })
  })

  return NextResponse.json({ success: true })
}
