import { createPool } from 'mariadb'
import bcrypt from 'bcryptjs'

const pool = createPool({
  host: '193.203.175.220',
  port: 3306,
  user: 'u885962291_dgm',
  password: 'cA4y5+0$4#',
  database: 'u885962291_dgm',
  connectionLimit: 5,
})

async function main() {
  const conn = await pool.getConnection()
  console.log('Conectado ao MySQL!')

  // 1. Criar empresa padrão
  await conn.query(`INSERT IGNORE INTO po_empresa (nome, slug, cnpj, plano, ativo, criado_em, atualizado_em)
    VALUES ('Mineração Vale do Cobre S.A. — Unidade Sossego', 'votorantim-sossego', '00.000.000/0001-00', 'enterprise', 1, NOW(), NOW())`)
  const [empresa] = await conn.query(`SELECT id FROM po_empresa WHERE slug = 'votorantim-sossego'`)
  const empId = empresa.id
  console.log(`Empresa ID: ${empId}`)

  // 2. Criar usuário admin
  const senhaHash = await bcrypt.hash('admin123', 10)
  await conn.query(`INSERT IGNORE INTO po_usuario (id_empresa, nome, email, senha, papel, ativo, criado_em, atualizado_em)
    VALUES (?, 'Administrador', 'admin@prismone.com.br', ?, 'admin', 1, NOW(), NOW())`, [empId, senhaHash])
  console.log('Usuário admin criado: admin@prismone.com.br / admin123')

  // 3. Helper para inserir domínios
  async function seedDominio(tabela, valores) {
    for (const nome of valores) {
      await conn.query(`INSERT IGNORE INTO ${tabela} (id_empresa, nome, ativo) VALUES (?, ?, 1)`, [empId, nome])
    }
    console.log(`  ${tabela}: ${valores.length} registros`)
  }

  // 4. Tabelas de domínio do Access
  await seedDominio('po_tipo', ['Aceitação', 'Calibração com ajuste', 'Calibração sem ajuste', 'Corretiva', 'Envio para fabricante', 'Instalação', 'Melhoria', 'Preditiva', 'Preventiva', 'Reprogramação'])
  await seedDominio('po_causa', ['Acidente', 'Área agressiva', 'Desgaste normal', 'Equipamento novo', 'Má conservação', 'Metrologia', 'Negligência', 'Outros', 'Revisão de parada', 'Revisão programada', 'Sobrecarga', 'Solicitação do cliente', 'Uso indevido', 'Vibração'])
  await seedDominio('po_executante', ['Alexandre Rocha', 'Claudimar', 'Edmar', 'Fabrício', 'Fernando', 'Luiz Ângelo', 'Marden', 'Messias', 'Sandro'])
  await seedDominio('po_area', ['Aciaria', 'Altos Fornos', 'Laminação', 'Reserva', 'Utilidades'])
  await seedDominio('po_processo', ['AF1', 'AF2', 'AF3', "AF's", 'Captação', 'Carregamento', 'Despoeiramento', 'EOF', 'ETA', 'FP', 'LAG', 'LAM', 'LC', 'Reserva', 'SIF', 'Sistema NEU', 'Tocha'])
  await seedDominio('po_familia', ['Transmissores', 'Atuadores elétricos', 'Atuadores pneumáticos', 'Sensores de temperatura', 'Placas de orifício', 'Sensores', 'Indicadores', 'Controladores', 'Conversores', 'Sensor de gases', 'Analisadores'])
  await seedDominio('po_fabricante', ['Smar', 'Ecil', 'Equipe', 'Consistec', 'MSA', 'Engecontrol', 'Foxboro', 'Pirometrica', 'Yokogawa', 'Milltronics', 'Keystone', 'Asco', 'Mettler Toledo', 'Emerson'])
  await seedDominio('po_conexao', ['1/4" NPT', '1/4" BSP', '1/2" BSP', '1/2" NPT', '3/4" BSP', '3/4" NPT', '1" BSP', '1" NPT'])
  await seedDominio('po_sinal_entrada', ['4 a 20 mA', '0 a 20 mA', '0 a 10 Vcc', '0 a 5 Vcc', '1 a 5 Vcc'])
  await seedDominio('po_sinal_saida', ['4 a 20 mA', '0 a 20 mA', '0 a 10 Vcc', '0 a 5 Vcc', '1 a 5 Vcc'])
  await seedDominio('po_alimentacao', ['12 Vcc', '24 Vcc', '127 Vac', '220 Vac', '380 Vac', '440 Vac', '115 Vac'])
  await seedDominio('po_material', ['Inox 316', 'Inox 304', 'Monel', 'Aço carbono', 'Ferro', 'Plástico', 'Polietileno'])
  await seedDominio('po_protocolo', ['HART', 'RS232', 'RS485', 'Fieldbus', 'Modbus', 'Profbus', 'Device Net'])
  await seedDominio('po_posicao_dreno', ['Superior', 'Inferior', 'Não instalado'])
  await seedDominio('po_tipo_indicador_local', ['Digital', 'Analógico', 'Não instalado'])
  await seedDominio('po_tipo_ajuste_local', ['Chave magnética', 'Potenciométrico', 'Programador', 'Notebook com interface', 'Botão no frontal', 'Mecânico'])
  await seedDominio('po_tipo_elemento_sensor', ['Tipo "J"', 'Tipo "K"', 'Tipo "S"', 'Capacitivo', 'PT100', 'PTC', 'NTC', 'Ultrassônico'])
  await seedDominio('po_tipo_valvula', ['Globo', 'Borboleta'])
  await seedDominio('po_tipo_atuador', ['Atuador multimola com diafragma', 'Cilindro pneumático dupla ação', 'Cilindro pneumático simples ação retorno por mola'])
  await seedDominio('po_tipo_cabecote', ['Cabeçote miniatura em aço zincado', 'Cabeçote miniatura em alumínio', 'Cabeçote à prova de tempo em alumínio', 'Cabeçote à prova de tempo em ferro', 'Cabeçote à prova de explosão em ferro', 'Cabeçote à prova de explosão em alumínio'])

  // Períodos
  const periodos = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]
  for (const dias of periodos) {
    await conn.query(`INSERT IGNORE INTO po_periodo (id_empresa, dias, descricao, ativo) VALUES (?, ?, ?, 1)`, [empId, dias, `${dias} dias`])
  }
  console.log(`  po_periodo: ${periodos.length} registros`)

  conn.release()
  await pool.end()
  console.log('\nSeed concluído com sucesso!')
  console.log('Login: admin@prismone.com.br / admin123')
}

main().catch(console.error)
