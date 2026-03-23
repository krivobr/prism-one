import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Only admin and super_admin can list companies
  if (!['admin', 'super_admin'].includes(session.user.papel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Admin sees only their company, super_admin sees all
  const where = session.user.papel === 'super_admin' ? {} : { id: session.user.id_empresa }

  const empresas = await prisma.pO_Empresa.findMany({
    where,
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(empresas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Only super_admin can create companies
  if (session.user.papel !== 'super_admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const { nome, slug, cnpj, plano } = await req.json()

    if (!nome || !slug) {
      return NextResponse.json({ error: 'Campos obrigatórios: nome, slug' }, { status: 400 })
    }

    const empresa = await prisma.pO_Empresa.create({
      data: {
        nome,
        slug,
        cnpj: cnpj || null,
        plano: plano || 'basico',
      },
    })

    return NextResponse.json(empresa, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug ou CNPJ já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['admin', 'super_admin'].includes(session.user.papel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const { id, nome, slug, cnpj, plano, ativo } = await req.json()

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    // Admin can only edit their own company
    if (session.user.papel !== 'super_admin' && id !== session.user.id_empresa) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const data: any = {}
    if (nome !== undefined) data.nome = nome
    if (slug !== undefined) data.slug = slug
    if (cnpj !== undefined) data.cnpj = cnpj || null
    if (plano !== undefined) data.plano = plano
    if (ativo !== undefined) data.ativo = ativo

    const empresa = await prisma.pO_Empresa.update({
      where: { id },
      data,
    })

    return NextResponse.json(empresa)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug ou CNPJ já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar empresa' }, { status: 500 })
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

  // Admin can only deactivate their own company
  if (session.user.papel !== 'super_admin' && id !== session.user.id_empresa) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  await prisma.pO_Empresa.update({
    where: { id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
}
