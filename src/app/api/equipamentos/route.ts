import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const busca = searchParams.get('busca') || ''
  const areaId = searchParams.get('area') ? Number(searchParams.get('area')) : undefined
  const familiaId = searchParams.get('familia') ? Number(searchParams.get('familia')) : undefined
  const status = searchParams.get('status') || undefined

  const where: any = { id_empresa: session.user.id_empresa }

  if (busca) {
    where.OR = [
      { tag: { contains: busca } },
      { descricao: { contains: busca } },
      { funcao: { contains: busca } },
    ]
  }
  if (areaId) where.id_area = areaId
  if (familiaId) where.id_familia = familiaId
  if (status) where.status = status

  const equipamentos = await prisma.pO_Equipamento.findMany({
    where,
    include: {
      area: true,
      familia: true,
      fabricante: true,
      processo: true,
    },
    orderBy: { tag: 'asc' },
  })

  return NextResponse.json(equipamentos)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const equipamento = await prisma.pO_Equipamento.create({
    data: {
      id_empresa: session.user.id_empresa,
      ...body,
    },
  })

  return NextResponse.json(equipamento, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, ...data } = body

  const existing = await prisma.pO_Equipamento.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const equipamento = await prisma.pO_Equipamento.update({
    where: { id },
    data,
  })

  return NextResponse.json(equipamento)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const existing = await prisma.pO_Equipamento.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.pO_Equipamento.update({ where: { id }, data: { status: 'Inativo' } })
  return NextResponse.json({ success: true })
}
