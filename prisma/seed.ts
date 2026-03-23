// Prisma 7.5 requires driver adapter for MySQL
const classModule = require('../src/generated/prisma/internal/class')
const { PrismaMariaDb } = require('@prisma/adapter-mariadb')
const mariadbLib = require('mariadb')
const bcrypt = require('bcryptjs')

const pool = mariadbLib.createPool({
  host: '193.203.175.220',
  port: 3306,
  user: 'u885962291_dgm',
  password: 'cA4y5+0$4#',
  database: 'u885962291_dgm',
  connectionLimit: 5,
})

const adapter = new PrismaMariaDb(pool)
const PClient = classModule.getPrismaClientClass()
const prisma = new PClient({ adapter })

async function main() {
  console.log('Iniciando seed...')

  // 1. Criar empresa padrão
  const empresa = await prisma.pO_Empresa.upsert({
    where: { slug: 'votorantim-sossego' },
    update: {},
    create: {
      nome: 'Mineração Vale do Cobre S.A. — Unidade Sossego',
      slug: 'votorantim-sossego',
      cnpj: '00.000.000/0001-00',
      plano: 'enterprise',
      ativo: true,
    },
  })
  console.log(`Empresa criada: ${empresa.nome} (ID: ${empresa.id})`)

  // 2. Criar usuário admin
  const senhaHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.pO_Usuario.upsert({
    where: { email: 'admin@prismone.com.br' },
    update: {},
    create: {
      id_empresa: empresa.id,
      nome: 'Administrador',
      email: 'admin@prismone.com.br',
      senha: senhaHash,
      papel: 'admin',
      ativo: true,
    },
  })
  console.log(`Usuário admin criado: ${admin.email}`)

  // 3. Criar tabelas de domínio com dados do Access

  // Tipos
  const tipos = ['Aceitação', 'Calibração com ajuste', 'Calibração sem ajuste', 'Corretiva', 'Envio para fabricante', 'Instalação', 'Melhoria', 'Preditiva', 'Preventiva', 'Reprogramação']
  for (const nome of tipos) {
    await prisma.pO_Tipo.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${tipos.length} tipos criados`)

  // Causas
  const causas = ['Acidente', 'Área agressiva', 'Desgaste normal', 'Equipamento novo', 'Má conservação', 'Metrologia', 'Negligência', 'Outros', 'Revisão de parada', 'Revisão programada', 'Sobrecarga', 'Solicitação do cliente', 'Uso indevido', 'Vibração']
  for (const nome of causas) {
    await prisma.pO_Causa.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${causas.length} causas criadas`)

  // Executantes
  const executantes = ['Alexandre Rocha', 'Claudimar', 'Edmar', 'Fabrício', 'Fernando', 'Luiz Ângelo', 'Marden', 'Messias', 'Sandro']
  for (const nome of executantes) {
    await prisma.pO_Executante.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${executantes.length} executantes criados`)

  // Áreas
  const areas = ['Aciaria', 'Altos Fornos', 'Laminação', 'Reserva', 'Utilidades']
  for (const nome of areas) {
    await prisma.pO_Area.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${areas.length} áreas criadas`)

  // Processos
  const processos = ['AF1', 'AF2', 'AF3', "AF's", 'Captação', 'Carregamento', 'Despoeiramento', 'EOF', 'ETA', 'FP', 'LAG', 'LAM', 'LC', 'Reserva', 'SIF', 'Sistema NEU', 'Tocha']
  for (const nome of processos) {
    await prisma.pO_Processo.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${processos.length} processos criados`)

  // Famílias
  const familias = ['Transmissores', 'Atuadores elétricos', 'Atuadores pneumáticos', 'Sensores de temperatura', 'Placas de orifício', 'Sensores', 'Indicadores', 'Controladores', 'Conversores', 'Sensor de gases', 'Analisadores']
  for (const nome of familias) {
    await prisma.pO_Familia.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${familias.length} famílias criadas`)

  // Fabricantes
  const fabricantes = ['Smar', 'Ecil', 'Equipe', 'Consistec', 'MSA', 'Engecontrol', 'Foxboro', 'Pirometrica', 'Yokogawa', 'Milltronics', 'Keystone', 'Asco', 'Mettler Toledo', 'Emerson']
  for (const nome of fabricantes) {
    await prisma.pO_Fabricante.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${fabricantes.length} fabricantes criados`)

  // Conexões
  const conexoes = ['1/4" NPT', '1/4" BSP', '1/2" BSP', '1/2" NPT', '3/4" BSP', '3/4" NPT', '1" BSP', '1" NPT']
  for (const nome of conexoes) {
    await prisma.pO_Conexao.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${conexoes.length} conexões criadas`)

  // Sinais de entrada
  const sinaisEntrada = ['4 a 20 mA', '0 a 20 mA', '0 a 10 Vcc', '0 a 5 Vcc', '1 a 5 Vcc']
  for (const nome of sinaisEntrada) {
    await prisma.pO_SinalEntrada.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${sinaisEntrada.length} sinais de entrada criados`)

  // Sinais de saída
  const sinaisSaida = ['4 a 20 mA', '0 a 20 mA', '0 a 10 Vcc', '0 a 5 Vcc', '1 a 5 Vcc']
  for (const nome of sinaisSaida) {
    await prisma.pO_SinalSaida.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${sinaisSaida.length} sinais de saída criados`)

  // Alimentação
  const alimentacoes = ['12 Vcc', '24 Vcc', '127 Vac', '220 Vac', '380 Vac', '440 Vac', '115 Vac']
  for (const nome of alimentacoes) {
    await prisma.pO_Alimentacao.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${alimentacoes.length} alimentações criadas`)

  // Materiais
  const materiais = ['Inox 316', 'Inox 304', 'Monel', 'Aço carbono', 'Ferro', 'Plástico', 'Polietileno']
  for (const nome of materiais) {
    await prisma.pO_Material.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${materiais.length} materiais criados`)

  // Protocolos
  const protocolos = ['HART', 'RS232', 'RS485', 'Fieldbus', 'Modbus', 'Profbus', 'Device Net']
  for (const nome of protocolos) {
    await prisma.pO_Protocolo.create({ data: { id_empresa: empresa.id, nome } })
  }
  console.log(`${protocolos.length} protocolos criados`)

  // Posição drenos
  const posicoesDreno = ['Superior', 'Inferior', 'Não instalado']
  for (const nome of posicoesDreno) {
    await prisma.pO_PosicaoDreno.create({ data: { id_empresa: empresa.id, nome } })
  }

  // Tipo indicador local
  const tiposIndicador = ['Digital', 'Analógico', 'Não instalado']
  for (const nome of tiposIndicador) {
    await prisma.pO_TipoIndicadorLocal.create({ data: { id_empresa: empresa.id, nome } })
  }

  // Tipo ajuste local
  const tiposAjusteLocal = ['Chave magnética', 'Potenciométrico', 'Programador', 'Notebook com interface', 'Botão no frontal', 'Mecânico']
  for (const nome of tiposAjusteLocal) {
    await prisma.pO_TipoAjusteLocal.create({ data: { id_empresa: empresa.id, nome } })
  }

  // Tipo elemento sensor
  const tiposElemento = ['Tipo "J"', 'Tipo "K"', 'Tipo "S"', 'Capacitivo', 'PT100', 'PTC', 'NTC', 'Ultrassônico']
  for (const nome of tiposElemento) {
    await prisma.pO_TipoElementoSensor.create({ data: { id_empresa: empresa.id, nome } })
  }

  // Tipo válvula
  const tiposValvula = ['Globo', 'Borboleta']
  for (const nome of tiposValvula) {
    await prisma.pO_TipoValvula.create({ data: { id_empresa: empresa.id, nome } })
  }

  // Tipo atuador
  const tiposAtuador = ['Atuador multimola com diafragma', 'Cilindro pneumático dupla ação', 'Cilindro pneumático simples ação retorno por mola']
  for (const nome of tiposAtuador) {
    await prisma.pO_TipoAtuador.create({ data: { id_empresa: empresa.id, nome } })
  }

  // Tipo cabeçote
  const tiposCabecote = ['Cabeçote miniatura em aço zincado', 'Cabeçote miniatura em alumínio', 'Cabeçote à prova de tempo em alumínio', 'Cabeçote à prova de tempo em ferro', 'Cabeçote à prova de explosão em ferro', 'Cabeçote à prova de explosão em alumínio']
  for (const nome of tiposCabecote) {
    await prisma.pO_TipoCabecote.create({ data: { id_empresa: empresa.id, nome } })
  }

  // Períodos
  const periodos = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]
  for (const dias of periodos) {
    await prisma.pO_Periodo.create({ data: { id_empresa: empresa.id, dias, descricao: `${dias} dias` } })
  }
  console.log('Demais tabelas de domínio criadas')

  console.log('\nSeed concluído com sucesso!')
  console.log('Login: admin@prismone.com.br / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
