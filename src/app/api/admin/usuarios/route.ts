import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['admin', 'super_admin'].includes(session.user.papel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const usuarios = await prisma.pO_Usuario.findMany({
    where: { id_empresa: session.user.id_empresa },
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      ativo: true,
      ultimo_acesso: true,
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['admin', 'super_admin'].includes(session.user.papel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const { nome, email, senha, papel } = await req.json()

    if (!nome || !email || !senha || !papel) {
      return NextResponse.json({ error: 'Campos obrigatórios: nome, email, senha, papel' }, { status: 400 })
    }

    const senhaHash = await hash(senha, 12)

    const usuario = await prisma.pO_Usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        papel,
        id_empresa: session.user.id_empresa,
      },
      select: { id: true, nome: true, email: true, papel: true, ativo: true, ultimo_acesso: true },
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['admin', 'super_admin'].includes(session.user.papel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const { id, nome, email, papel, ativo, senha } = await req.json()

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    // Verify user belongs to same empresa
    const existing = await prisma.pO_Usuario.findFirst({
      where: { id, id_empresa: session.user.id_empresa },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const data: any = {}
    if (nome !== undefined) data.nome = nome
    if (email !== undefined) data.email = email
    if (papel !== undefined) data.papel = papel
    if (ativo !== undefined) data.ativo = ativo
    if (senha) data.senha = await hash(senha, 12)

    const usuario = await prisma.pO_Usuario.update({
      where: { id },
      data,
      select: { id: true, nome: true, email: true, papel: true, ativo: true, ultimo_acesso: true },
    })

    return NextResponse.json(usuario)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['admin', 'super_admin'].includes(session.user.papel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const id = Number(req.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  // Verify user belongs to same empresa
  const existing = await prisma.pO_Usuario.findFirst({
    where: { id, id_empresa: session.user.id_empresa },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  await prisma.pO_Usuario.update({
    where: { id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
}
