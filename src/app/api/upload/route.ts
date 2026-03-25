import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Diretório de uploads persistente (fora de .next)
const UPLOADS_DIR = join(process.cwd(), 'uploads')

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

  // Validar tipo de arquivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  }

  // Limitar tamanho (300KB)
  if (file.size > 300 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 300KB). Comprima a imagem antes de enviar.' }, { status: 413 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await mkdir(UPLOADS_DIR, { recursive: true })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filepath = join(UPLOADS_DIR, filename)

  await writeFile(filepath, buffer)

  // Retorna URL via API route (não depende de /public)
  return NextResponse.json({ url: `/api/upload/${filename}` }, { status: 201 })
}
