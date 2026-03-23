/**
 * Seed script: importa calibrações do Access (_access_data.json) para o banco.
 *
 * Uso:  npx tsx scripts/seed-calibracoes.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { readFileSync } from 'fs'
import { join } from 'path'

const adapter = new PrismaMariaDb({
  host: '193.203.175.220',
  port: 3306,
  user: 'u885962291_dgm',
  password: 'cA4y5+0$4#',
  database: 'u885962291_dgm',
})

const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

interface CalibracaoAccess {
  Indice: string
  Data?: string
  TAG?: string
  Unidade1?: string
  Unidade2?: string
  [key: string]: string | undefined // Dados1A … Dados6E
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseFloat0(val: string | undefined): number | null {
  if (val === undefined || val === null) return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

/** Percentuais de escala padrão por quantidade de pontos */
function percentualEscala(ponto: number, totalPontos: number): number {
  if (totalPontos <= 1) return 0
  return ((ponto - 1) / (totalPontos - 1)) * 100
}

/** Verifica se um ponto tem pelo menos um dado preenchido (e diferente de "0.0" / "0.") */
function pontoTemDados(rec: CalibracaoAccess, p: number): boolean {
  const a = rec[`Dados${p}A`]
  const b = rec[`Dados${p}B`]
  // Considera que o ponto existe se A ou B tem valor diferente de zero
  const aVal = parseFloat0(a)
  const bVal = parseFloat0(b)
  return (aVal !== null && aVal !== 0) || (bVal !== null && bVal !== 0)
}

function extrairPontos(rec: CalibracaoAccess) {
  // Descobre quantos pontos existem (1-6)
  const maxPontos = 6
  const pontosValidos: number[] = []

  for (let p = 1; p <= maxPontos; p++) {
    if (pontoTemDados(rec, p)) {
      pontosValidos.push(p)
    }
  }

  const totalPontos = pontosValidos.length

  return pontosValidos.map((p, idx) => {
    const valorAplicado = parseFloat0(rec[`Dados${p}A`])
    const valorLidoSubida = parseFloat0(rec[`Dados${p}B`])
    const valorLidoDescida = parseFloat0(rec[`Dados${p}C`]) ?? valorLidoSubida
    const erroSubida = parseFloat0(rec[`Dados${p}D`])
    const erroDescida = parseFloat0(rec[`Dados${p}E`])

    return {
      numero_ponto: p,
      percentual_escala: percentualEscala(idx + 1, totalPontos),
      valor_aplicado: valorAplicado,
      valor_lido_subida: valorLidoSubida,
      valor_lido_descida: valorLidoDescida,
      erro_subida: erroSubida,
      erro_descida: erroDescida,
    }
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dataPath = join(__dirname, '_access_data.json')
  const raw = JSON.parse(readFileSync(dataPath, 'utf-8'))
  const calibracoes: CalibracaoAccess[] = raw.Calibracoes

  if (!calibracoes || calibracoes.length === 0) {
    console.log('Nenhuma calibração encontrada em _access_data.json')
    return
  }

  console.log(`Encontradas ${calibracoes.length} calibrações no arquivo de importação.`)

  // Busca executante padrão (primeiro da empresa 1)
  const executante = await prisma.pO_Executante.findFirst({
    where: { id_empresa: 1 },
  })
  const idExecutante = executante?.id ?? null

  if (idExecutante) {
    console.log(`Executante padrão: id=${idExecutante} (${executante!.nome})`)
  } else {
    console.log('Nenhum executante encontrado para empresa 1. Campo id_executante ficará nulo.')
  }

  // Cache de equipamentos por TAG
  const equipamentos = await prisma.pO_Equipamento.findMany({
    where: { id_empresa: 1 },
    select: { id: true, tag: true },
  })
  const tagMap = new Map<string, number>()
  for (const eq of equipamentos) {
    tagMap.set(eq.tag.toUpperCase().trim(), eq.id)
  }
  console.log(`${tagMap.size} equipamentos carregados no cache de TAGs.`)

  // Contadores
  let criadas = 0
  let semEquipamento = 0
  let pontosCriados = 0

  await prisma.$transaction(async (tx) => {
    for (const rec of calibracoes) {
      const tag = rec.TAG?.trim()
      if (!tag) {
        console.log(`  [SKIP] Índice ${rec.Indice}: sem TAG`)
        continue
      }

      const idEquipamento = tagMap.get(tag.toUpperCase())
      if (idEquipamento === undefined) {
        semEquipamento++
        console.log(`  [SKIP] Índice ${rec.Indice}: equipamento não encontrado para TAG "${tag}"`)
        continue
      }

      // Data da calibração
      const dataCalibracao = rec.Data ? new Date(rec.Data) : new Date()

      // Cria a calibração
      const calibracao = await tx.pO_Calibracao.create({
        data: {
          id_empresa: 1,
          id_equipamento: idEquipamento,
          data: dataCalibracao,
          tipo: 'Calibração sem ajuste',
          unidade_entrada: rec.Unidade1 || null,
          unidade_saida: rec.Unidade2 || null,
          resultado: 'Aprovado',
          id_executante: idExecutante,
        },
      })
      criadas++

      // Extrai e cria pontos de calibração
      const pontos = extrairPontos(rec)
      for (const ponto of pontos) {
        await tx.pO_PontoCalibracao.create({
          data: {
            id_calibracao: calibracao.id,
            ...ponto,
          },
        })
        pontosCriados++
      }

      console.log(
        `  [OK] Índice ${rec.Indice}: TAG="${tag}" → calibração id=${calibracao.id}, ${pontos.length} ponto(s)`
      )
    }
  })

  console.log('\n--- Resumo ---')
  console.log(`Calibrações criadas: ${criadas}`)
  console.log(`Pontos de calibração criados: ${pontosCriados}`)
  console.log(`Registros ignorados (sem equipamento): ${semEquipamento}`)
}

main()
  .catch((err) => {
    console.error('Erro ao executar seed de calibrações:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
