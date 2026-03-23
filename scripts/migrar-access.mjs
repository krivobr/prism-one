/**
 * Script de migração: Access (.mdb) → MySQL
 * Migra os 44 TAGs e 41 Relatórios do banco Access para o PRISM ONE
 *
 * Pré-requisitos:
 *   - pip install access_parser (Python 3.11)
 *   - npm install mariadb (já instalado)
 *
 * Uso: node scripts/migrar-access.mjs
 */

import { createPool } from 'mariadb'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'
import path from 'path'

const DB_CONFIG = {
  host: '193.203.175.220',
  port: 3306,
  user: 'u885962291_dgm',
  password: 'cA4y5+0$4#',
  database: 'u885962291_dgm',
  connectionLimit: 5,
}

const ACCESS_DB = path.resolve('..', 'DGM - CMM Votorantin.mdb')
const TEMP_JSON = path.resolve('scripts', '_access_data.json')

// Step 1: Extract Access data using Python
function extrairAccessData() {
  console.log('1. Extraindo dados do Access via Python...')

  const pythonScript = `
import json
from access_parser import AccessParser

db = AccessParser(r'${ACCESS_DB.replace(/\\/g, '\\\\')}')

result = {}

# TAG table
tag_data = db.parse_table('TAG')
if tag_data:
    keys = list(tag_data.keys())
    rows = []
    for i in range(len(tag_data[keys[0]])):
        row = {}
        for k in keys:
            val = tag_data[k][i] if i < len(tag_data[k]) else None
            if val is not None and val != '' and val != b'':
                row[k] = str(val)
        rows.append(row)
    result['TAG'] = rows

# Relatorios table
rel_data = db.parse_table('Relat\\xf3rios')
if rel_data:
    keys = list(rel_data.keys())
    rows = []
    for i in range(len(rel_data[keys[0]])):
        row = {}
        for k in keys:
            val = rel_data[k][i] if i < len(rel_data[k]) else None
            if val is not None and val != '' and val != b'':
                row[k] = str(val)
        rows.append(row)
    result['Relatorios'] = rows

# Ultimas calibracoes
ult_data = db.parse_table('\\xdaltimas calibra\\xe7\\xf5es')
if ult_data:
    keys = list(ult_data.keys())
    rows = []
    for i in range(len(ult_data[keys[0]])):
        row = {}
        for k in keys:
            val = ult_data[k][i] if i < len(ult_data[k]) else None
            if val is not None and val != '' and val != b'' and val != 0:
                row[k] = str(val)
        rows.append(row)
    result['Calibracoes'] = rows

with open(r'${TEMP_JSON.replace(/\\/g, '\\\\')}', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"TAG: {len(result.get('TAG', []))} registros")
print(f"Relatorios: {len(result.get('Relatorios', []))} registros")
print(f"Calibracoes: {len(result.get('Calibracoes', []))} registros")
`

  writeFileSync('scripts/_extract.py', pythonScript, 'utf-8')
  execSync('C:/Python311/python.exe scripts/_extract.py', { stdio: 'inherit' })
}

// Step 2: Load extracted data and migrate to MySQL
async function migrar() {
  console.log('\n2. Migrando para MySQL...')

  const data = JSON.parse(readFileSync(TEMP_JSON, 'utf-8'))
  const pool = createPool(DB_CONFIG)
  const conn = await pool.getConnection()

  // Get empresa ID
  const [empresa] = await conn.query("SELECT id FROM po_empresa WHERE slug = 'votorantim-sossego'")
  const empId = empresa.id

  // Load lookup maps (nome → id)
  async function loadLookup(table) {
    const rows = await conn.query(`SELECT id, nome FROM ${table} WHERE id_empresa = ?`, [empId])
    const map = {}
    for (const r of rows) map[r.nome] = r.id
    return map
  }

  const areas = await loadLookup('po_area')
  const familias = await loadLookup('po_familia')
  const fabricantes = await loadLookup('po_fabricante')
  const processos = await loadLookup('po_processo')
  const conexoes = await loadLookup('po_conexao')
  const sinaisEntrada = await loadLookup('po_sinal_entrada')
  const sinaisSaida = await loadLookup('po_sinal_saida')
  const protocolos = await loadLookup('po_protocolo')
  const alimentacoes = await loadLookup('po_alimentacao')
  const tiposValvula = await loadLookup('po_tipo_valvula')
  const tiposAtuador = await loadLookup('po_tipo_atuador')
  const tipos = await loadLookup('po_tipo')
  const causas = await loadLookup('po_causa')
  const executantes = await loadLookup('po_executante')

  function findId(map, value) {
    if (!value) return null
    const clean = value.trim()
    if (map[clean]) return map[clean]
    // Fuzzy match
    for (const [k, v] of Object.entries(map)) {
      if (k.toLowerCase() === clean.toLowerCase()) return v
    }
    return null
  }

  function parseDate(dateStr) {
    if (!dateStr) return null
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 19).replace('T', ' ')
    } catch { return null }
  }

  // Migrate TAGs → po_equipamento
  console.log(`\n  Migrando ${data.TAG?.length || 0} TAGs...`)
  let tagCount = 0
  for (const tag of (data.TAG || [])) {
    try {
      const periodoDias = tag['Periodo'] ? parseInt(tag['Periodo']) : null
      const calibradoEm = parseDate(tag['Calibrado em'])
      const proxima = parseDate(tag['Próxima'] || tag['Pr\u00f3xima'])

      await conn.query(`
        INSERT IGNORE INTO po_equipamento (id_empresa, tag, descricao, id_fabricante, modelo, serie,
          id_area, id_familia, id_processo, funcao, equipamento_processo, alcance, faixa,
          id_sinal_entrada, id_sinal_saida, id_protocolo, id_alimentacao, id_conexao,
          sistema_seguranca, pendencias, periodo_calibracao, ultima_calibracao, proxima_calibracao,
          observacoes, status, id_tipo_valvula, id_tipo_atuador,
          classe_valvula, cv, curso, diametro_nominal, material_corpo, material_internos,
          material_gaxetas, estanqueidade, acao, pressao_trabalho,
          link_mop, link_manuais, link_conf_metrologica, link_proc_manutencao,
          ferramentas_necessarias, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        empId, tag['Tag'], tag['Descrição'] || tag['Descri\u00e7\u00e3o'],
        findId(fabricantes, tag['Fabricante']),
        tag['Modelo'], tag['Série'] || tag['S\u00e9rie'],
        findId(areas, tag['Área'] || tag['\u00c1rea']),
        findId(familias, tag['Familia']),
        findId(processos, tag['Processo']),
        tag['Função'] || tag['Fun\u00e7\u00e3o'],
        tag['Equipamento'],
        tag['Alcance'], tag['Faixa'],
        findId(sinaisEntrada, tag['Sinal de entrada']),
        findId(sinaisSaida, tag['Sinal de saída'] || tag['Sinal de sa\u00edda']),
        findId(protocolos, tag['Protocolo de comunicação'] || tag['Protocolo de comunica\u00e7\u00e3o']),
        findId(alimentacoes, tag['Alimentação'] || tag['Alimenta\u00e7\u00e3o']),
        findId(conexoes, tag['Conexão ao processo'] || tag['Conex\u00e3o ao processo']),
        tag['Sistema de segurança?'] === 'Sim' || tag['Sistema de seguran\u00e7a?'] === 'Sim',
        tag['Há pendências?'] === 'Sim' || tag['H\u00e1 pend\u00eancias?'] === 'Sim',
        periodoDias, calibradoEm, proxima,
        tag['Observações'] || tag['Observa\u00e7\u00f5es'],
        findId(tiposValvula, tag['Tipo de válvula'] || tag['Tipo de v\u00e1lvula']),
        findId(tiposAtuador, tag['Tipo de atuador']),
        tag['Classe da válvula'] || tag['Classe da v\u00e1lvula'],
        tag['CV'], tag['Curso'], tag['Diâmetro nominal'] || tag['Di\u00e2metro nominal'],
        tag['Material do corpo'], tag['Material dos internos'],
        tag['Material das gaxetas'], tag['Estanqueidade'],
        tag['Ação'] || tag['A\u00e7\u00e3o'],
        tag['Pressão de trabalho'] || tag['Press\u00e3o de trabalho'],
        (tag['Link mop'] || '').replace(/#/g, ''),
        (tag['Link manuais'] || '').replace(/#/g, ''),
        (tag['Link Conf metrológica'] || tag['Link Conf metrol\u00f3gica'] || '').replace(/#/g, ''),
        (tag['Link procedimento manutenção'] || tag['Link procedimento manuten\u00e7\u00e3o'] || '').replace(/#/g, ''),
        tag['Ferramentas necessárias'] || tag['Ferramentas necess\u00e1rias'],
      ])
      tagCount++
    } catch (err) {
      console.error(`  Erro ao migrar TAG ${tag['Tag']}: ${err.message}`)
    }
  }
  console.log(`  ${tagCount} equipamentos migrados`)

  // Migrate Relatórios → po_ordem_servico
  console.log(`\n  Migrando ${data.Relatorios?.length || 0} Relatórios...`)
  let relCount = 0
  for (const rel of (data.Relatorios || [])) {
    try {
      // Find equipamento by TAG
      const [equip] = await conn.query(
        'SELECT id FROM po_equipamento WHERE id_empresa = ? AND tag = ? LIMIT 1',
        [empId, rel['TAG']]
      )
      if (!equip) {
        console.warn(`  TAG não encontrada: ${rel['TAG']}`)
        continue
      }

      await conn.query(`
        INSERT IGNORE INTO po_ordem_servico (id_empresa, id_equipamento, data, numero_os,
          id_tipo, id_causa, descricao, id_executante, pendencia, prioridade, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Média', NOW(), NOW())
      `, [
        empId, equip.id,
        parseDate(rel['Data']),
        rel['Ordem de serviço'] || rel['Ordem de servi\u00e7o'],
        findId(tipos, rel['Tipo']),
        findId(causas, rel['Causa']),
        rel['Descrição'] || rel['Descri\u00e7\u00e3o'] || '',
        findId(executantes, rel['Executantes']),
        (rel['Pendência'] || rel['Pend\u00eancia']) === 'Sim',
      ])
      relCount++
    } catch (err) {
      console.error(`  Erro ao migrar relatório: ${err.message}`)
    }
  }
  console.log(`  ${relCount} ordens de serviço migradas`)

  conn.release()
  await pool.end()
  console.log('\nMigração concluída!')
}

// Main
try {
  extrairAccessData()
  await migrar()
} catch (err) {
  console.error('Erro na migração:', err)
  process.exit(1)
}
