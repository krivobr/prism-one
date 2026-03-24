import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOADS_DIR = join(process.cwd(), 'uploads')

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Prevenir directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  const filepath = join(UPLOADS_DIR, filename)

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'
  const buffer = await readFile(filepath)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
