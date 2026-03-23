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

  const fluxogramas = await prisma.pO_Fluxograma.findMany({
    where,
    include: {
      equipamento: { select: { tag: true, descricao: true } },
    },
    orderBy: { criado_em: 'desc' },
  })

  return NextResponse.json(fluxogramas)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const fluxograma = await prisma.pO_Fluxograma.create({
    data: {
      id_empresa: session.user.id_empresa,
      id_equipamento: body.id_equipamento,
      arquivo_url: body.arquivo_url,
      descricao: body.descricao || null,
    },
    include: {
      equipamento: { select: { tag: true, descricao: true } },
    },
  })

  return NextResponse.json(fluxograma, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, ...data } = body

  const existing = await prisma.pO_Fluxograma.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const fluxograma = await prisma.pO_Fluxograma.update({
    where: { id },
    data,
  })

  return NextResponse.json(fluxograma)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const existing = await prisma.pO_Fluxograma.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.pO_Fluxograma.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
