import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

const tabelaMap: Record<string, string> = {
  'tipos': 'pO_Tipo',
  'causas': 'pO_Causa',
  'executantes': 'pO_Executante',
  'areas': 'pO_Area',
  'processos': 'pO_Processo',
  'familias': 'pO_Familia',
  'fabricantes': 'pO_Fabricante',
  'conexoes': 'pO_Conexao',
  'sinais-entrada': 'pO_SinalEntrada',
  'sinais-saida': 'pO_SinalSaida',
  'alimentacao': 'pO_Alimentacao',
  'materiais': 'pO_Material',
  'protocolos': 'pO_Protocolo',
  'posicao-drenos': 'pO_PosicaoDreno',
  'tipo-ajuste-remoto': 'pO_TipoAjusteRemoto',
  'tipo-indicador-local': 'pO_TipoIndicadorLocal',
  'tipo-ajuste-local': 'pO_TipoAjusteLocal',
  'tipo-cabecote': 'pO_TipoCabecote',
  'tipo-elemento-sensor': 'pO_TipoElementoSensor',
  'tipo-valvula': 'pO_TipoValvula',
  'tipo-atuador': 'pO_TipoAtuador',
  'periodos': 'pO_Periodo',
}

function getModel(tabela: string) {
  const modelName = tabelaMap[tabela]
  if (!modelName) return null
  return (prisma as any)[modelName]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tabela: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { tabela } = await params
  const model = getModel(tabela)
  if (!model) return NextResponse.json({ error: 'Tabela não encontrada' }, { status: 404 })

  const orderField = tabela === 'periodos' ? 'dias' : 'nome'
  const registros = await model.findMany({
    where: { id_empresa: session.user.id_empresa },
    orderBy: { [orderField]: 'asc' },
  })

  return NextResponse.json(registros)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tabela: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { tabela } = await params
  const model = getModel(tabela)
  if (!model) return NextResponse.json({ error: 'Tabela não encontrada' }, { status: 404 })

  const body = await request.json()
  const registro = await model.create({
    data: { id_empresa: session.user.id_empresa, ...body, ativo: true },
  })

  return NextResponse.json(registro, { status: 201 })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tabela: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { tabela } = await params
  const model = getModel(tabela)
  if (!model) return NextResponse.json({ error: 'Tabela não encontrada' }, { status: 404 })

  const body = await request.json()
  const { id, ...data } = body

  const existing = await model.findFirst({ where: { id, id_empresa: session.user.id_empresa } })
  if (!existing) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })

  const registro = await model.update({ where: { id }, data })
  return NextResponse.json(registro)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tabela: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { tabela } = await params
  const model = getModel(tabela)
  if (!model) return NextResponse.json({ error: 'Tabela não encontrada' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))

  const existing = await model.findFirst({ where: { id, id_empresa: session.user.id_empresa } })
  if (!existing) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })

  const registro = await model.update({ where: { id }, data: { ativo: !existing.ativo } })
  return NextResponse.json(registro)
}
