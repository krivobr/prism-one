import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getDefaultPermissoes } from '@/lib/permissoes'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const meu = req.nextUrl.searchParams.get('meu')

  // ?meu=true — retorna permissões do usuário logado (para sidebar)
  if (meu === 'true') {
    const papel = session.user.papel
    const idEmpresa = session.user.id_empresa

    const permissoes = await prisma.pO_Permissao.findMany({
      where: { id_empresa: idEmpresa, papel },
    })

    // Se não há permissões no banco, usar fallback
    if (permissoes.length === 0) {
      return NextResponse.json(getDefaultPermissoes(papel))
    }

    const result: Record<string, { pode_ver: boolean; pode_editar: boolean }> = {}
    for (const p of permissoes) {
      result[p.modulo] = { pode_ver: p.pode_ver, pode_editar: p.pode_editar }
    }

    // super_admin sempre tem acesso total
    if (papel === 'super_admin') {
      return NextResponse.json(getDefaultPermissoes('super_admin'))
    }

    return NextResponse.json(result)
  }

  // Sem ?meu — retorna todas as permissões da empresa (para admin)
  if (!['admin', 'super_admin'].includes(session.user.papel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const permissoes = await prisma.pO_Permissao.findMany({
    where: { id_empresa: session.user.id_empresa },
    orderBy: [{ papel: 'asc' }, { modulo: 'asc' }],
  })

  const result: Record<string, Record<string, { pode_ver: boolean; pode_editar: boolean }>> = {}
  for (const p of permissoes) {
    if (!result[p.papel]) result[p.papel] = {}
    result[p.papel][p.modulo] = { pode_ver: p.pode_ver, pode_editar: p.pode_editar }
  }

  return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['admin', 'super_admin'].includes(session.user.papel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const { permissoes } = await req.json()

    if (!Array.isArray(permissoes)) {
      return NextResponse.json({ error: 'Campo permissoes deve ser um array' }, { status: 400 })
    }

    const idEmpresa = session.user.id_empresa

    // Filtrar permissões de super_admin — não pode ser modificado
    const permissoesFiltradas = permissoes.filter(
      (p: any) => p.papel !== 'super_admin'
    )

    await prisma.$transaction(
      permissoesFiltradas.map((p: any) =>
        prisma.pO_Permissao.upsert({
          where: {
            id_empresa_papel_modulo: {
              id_empresa: idEmpresa,
              papel: p.papel,
              modulo: p.modulo,
            },
          },
          update: {
            pode_ver: p.pode_ver,
            pode_editar: p.pode_editar,
          },
          create: {
            id_empresa: idEmpresa,
            papel: p.papel,
            modulo: p.modulo,
            pode_ver: p.pode_ver,
            pode_editar: p.pode_editar,
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error)
    return NextResponse.json({ error: 'Erro ao atualizar permissões' }, { status: 500 })
  }
}
