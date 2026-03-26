const MODULOS = [
  'dashboard',
  'equipamentos',
  'calibracoes',
  'check-loop',
  'minhas-inspecoes',
  'ordens-servico',
  'relatorios',
  'fluxogramas',
  'cadastros',
  'admin',
] as const

type Perm = { pode_ver: boolean; pode_editar: boolean }
type PermMap = Record<string, Perm>

function allTrue(): PermMap {
  const r: PermMap = {}
  for (const m of MODULOS) r[m] = { pode_ver: true, pode_editar: true }
  return r
}

function allFalse(): PermMap {
  const r: PermMap = {}
  for (const m of MODULOS) r[m] = { pode_ver: false, pode_editar: false }
  return r
}

// Permissões padrão — fallback quando o banco não foi seed-ado ou a API falha
const DEFAULTS: Record<string, PermMap> = {
  admin: allTrue(),
  gestor: {
    ...allTrue(),
    admin: { pode_ver: false, pode_editar: false },
  },
  tecnico: {
    ...allFalse(),
    dashboard: { pode_ver: true, pode_editar: false },
    'check-loop': { pode_ver: true, pode_editar: true },
    'minhas-inspecoes': { pode_ver: true, pode_editar: true },
    'ordens-servico': { pode_ver: true, pode_editar: false },
  },
  visualizador: {
    dashboard: { pode_ver: true, pode_editar: false },
    equipamentos: { pode_ver: true, pode_editar: false },
    calibracoes: { pode_ver: true, pode_editar: false },
    'check-loop': { pode_ver: true, pode_editar: false },
    'minhas-inspecoes': { pode_ver: true, pode_editar: false },
    'ordens-servico': { pode_ver: true, pode_editar: false },
    relatorios: { pode_ver: true, pode_editar: false },
    fluxogramas: { pode_ver: true, pode_editar: false },
    cadastros: { pode_ver: false, pode_editar: false },
    admin: { pode_ver: false, pode_editar: false },
  },
}

export function getDefaultPermissoes(papel: string): PermMap {
  if (papel === 'super_admin') return allTrue()
  return DEFAULTS[papel] || {}
}
