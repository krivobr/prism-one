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

  const ordens = await prisma.pO_OrdemServico.findMany({
    where,
    include: {
      equipamento: { select: { tag: true, descricao: true } },
      tipo: { select: { nome: true } },
      causa: { select: { nome: true } },
      executante: { select: { nome: true } },
    },
    orderBy: { data: 'desc' },
  })

  return NextResponse.json(ordens)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const ordem = await prisma.pO_OrdemServico.create({
    data: { id_empresa: session.user.id_empresa, ...body },
  })

  return NextResponse.json(ordem, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, ...data } = body

  const existing = await prisma.pO_OrdemServico.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const ordem = await prisma.pO_OrdemServico.update({
    where: { id },
    data,
  })

  return NextResponse.json(ordem)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const existing = await prisma.pO_OrdemServico.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.pO_OrdemServico.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
