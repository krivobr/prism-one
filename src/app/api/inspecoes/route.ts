import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const equipamentoId = searchParams.get('equipamento') ? Number(searchParams.get('equipamento')) : undefined
  const dataFiltro = searchParams.get('data')
  const executanteFiltro = searchParams.get('executante')

  const where: any = { id_empresa: session.user.id_empresa }
  if (equipamentoId) where.id_equipamento = equipamentoId

  if (dataFiltro) {
    const inicio = new Date(`${dataFiltro}T00:00:00`)
    const fim = new Date(`${dataFiltro}T23:59:59.999`)
    where.data = { gte: inicio, lte: fim }
  }

  if (executanteFiltro === 'meu') {
    where.id_executante = session.user.id
  }

  const inspecoes = await prisma.pO_Inspecao.findMany({
    where,
    include: {
      equipamento: { select: { tag: true, descricao: true } },
      executante: { select: { nome: true } },
    },
    orderBy: { data: 'desc' },
    take: 50,
  })

  return NextResponse.json(inspecoes)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const inspecao = await prisma.pO_Inspecao.create({
    data: {
      id_empresa: session.user.id_empresa,
      id_equipamento: body.id_equipamento,
      leitura: body.leitura ? parseFloat(body.leitura) : null,
      diagnostico_hart: body.diagnostico_hart || false,
      observacoes: body.observacoes || null,
      status: body.status || 'OK',
      foto_url: body.foto_url || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      desvio_percentual: body.desvio_percentual ? parseFloat(body.desvio_percentual) : null,
      id_executante: body.id_executante || null,
    },
  })

  return NextResponse.json(inspecao, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, ...data } = body

  const existing = await prisma.pO_Inspecao.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const inspecao = await prisma.pO_Inspecao.update({
    where: { id },
    data: {
      id_equipamento: data.id_equipamento,
      leitura: data.leitura ? parseFloat(data.leitura) : null,
      diagnostico_hart: data.diagnostico_hart || false,
      observacoes: data.observacoes || null,
      status: data.status || 'OK',
      desvio_percentual: data.desvio_percentual ? parseFloat(data.desvio_percentual) : null,
      id_executante: data.id_executante || null,
      foto_url: data.foto_url || null,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
    },
  })

  return NextResponse.json(inspecao)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const existing = await prisma.pO_Inspecao.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.pO_Inspecao.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
