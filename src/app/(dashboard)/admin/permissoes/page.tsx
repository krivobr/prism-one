'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Save, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Perm = { pode_ver: boolean; pode_editar: boolean }
type PermMap = Record<string, Perm>
type PermissoesPorPapel = Record<string, PermMap>

const PAPEIS = ['admin', 'gestor', 'tecnico', 'visualizador'] as const

const PAPEL_LABELS: Record<string, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  tecnico: 'Técnico',
  visualizador: 'Visualizador',
}

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

const MODULO_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  equipamentos: 'Equipamentos',
  calibracoes: 'Calibrações',
  'check-loop': 'Check Loop',
  'minhas-inspecoes': 'Minhas Inspeções',
  'ordens-servico': 'Ordens de Serviço',
  relatorios: 'Relatórios',
  fluxogramas: 'Fluxogramas',
  cadastros: 'Cadastros',
  admin: 'Administração',
}

function Toggle({
  checked,
  onChange,
  disabled = false,
  color = 'emerald',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  color?: 'emerald' | 'blue'
}) {
  const bgOn = color === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-10 items-center rounded-full transition-colors',
        checked ? bgOn : 'bg-slate-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  )
}

export default function PermissoesPage() {
  const [permissoes, setPermissoes] = useState<PermissoesPorPapel>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/admin/permissoes')
      if (res.ok) {
        const data = await res.json()
        setPermissoes(data)
      }
    } catch {
      /* ignore */
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const handleToggle = (
    papel: string,
    modulo: string,
    campo: 'pode_ver' | 'pode_editar',
    valor: boolean
  ) => {
    setPermissoes((prev) => {
      const next = { ...prev }
      const papelPerms = { ...next[papel] }
      const moduloPerm = { ...papelPerms[modulo] }

      if (campo === 'pode_ver' && !valor) {
        // Turning off "Ver" also turns off "Editar"
        moduloPerm.pode_ver = false
        moduloPerm.pode_editar = false
      } else {
        moduloPerm[campo] = valor
      }

      papelPerms[modulo] = moduloPerm
      next[papel] = papelPerms
      return next
    })
  }

  const salvar = async () => {
    setSalvando(true)
    setSucesso(false)
    try {
      const changes: { papel: string; modulo: string; pode_ver: boolean; pode_editar: boolean }[] = []
      for (const papel of PAPEIS) {
        for (const modulo of MODULOS) {
          const perm = permissoes[papel]?.[modulo]
          if (perm) {
            changes.push({
              papel,
              modulo,
              pode_ver: perm.pode_ver,
              pode_editar: perm.pode_editar,
            })
          }
        }
      }

      const res = await fetch('/api/admin/permissoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissoes: changes }),
      })

      if (res.ok) {
        setSucesso(true)
        setTimeout(() => setSucesso(false), 3000)
      }
    } catch {
      /* ignore */
    }
    setSalvando(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Gerenciar Permissões
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Configure o acesso de cada perfil aos módulos do sistema
        </p>
      </div>

      {/* Matrix card */}
      <div
        className="rounded-xl border border-slate-700/50 overflow-hidden"
        style={{ background: 'hsl(222 47% 11%)' }}
      >
        {carregando ? (
          /* Loading skeleton */
          <div className="p-6 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-32 rounded bg-slate-700/50 animate-pulse" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex gap-2">
                    <div className="h-5 w-10 rounded-full bg-slate-700/50 animate-pulse" />
                    <div className="h-5 w-10 rounded-full bg-slate-700/50 animate-pulse" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="sticky top-0 z-10" style={{ background: 'hsl(222 47% 11%)' }}>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                    Módulo
                  </th>
                  {PAPEIS.map((papel) => (
                    <th
                      key={papel}
                      className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase"
                    >
                      {PAPEL_LABELS[papel]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULOS.map((modulo) => (
                  <tr
                    key={modulo}
                    className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 text-sm text-white font-medium whitespace-nowrap">
                      {MODULO_LABELS[modulo]}
                    </td>
                    {PAPEIS.map((papel) => {
                      const perm = permissoes[papel]?.[modulo] || {
                        pode_ver: false,
                        pode_editar: false,
                      }
                      return (
                        <td key={papel} className="px-4 py-3">
                          <div className="flex items-center justify-center gap-3">
                            {/* Ver toggle */}
                            <div className="flex flex-col items-center gap-0.5">
                              <Toggle
                                checked={perm.pode_ver}
                                onChange={(v) => handleToggle(papel, modulo, 'pode_ver', v)}
                                color="emerald"
                              />
                              <span className="text-[10px] text-slate-500">Ver</span>
                            </div>
                            {/* Editar toggle */}
                            <div className="flex flex-col items-center gap-0.5">
                              <Toggle
                                checked={perm.pode_editar}
                                onChange={(v) => handleToggle(papel, modulo, 'pode_editar', v)}
                                color="blue"
                                disabled={!perm.pode_ver}
                              />
                              <span className="text-[10px] text-slate-500">Editar</span>
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save button (fixed at bottom) */}
      <div className="sticky bottom-4 flex justify-end z-20">
        <button
          onClick={salvar}
          disabled={salvando || carregando}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition shadow-lg',
            sucesso
              ? 'bg-emerald-600'
              : 'bg-purple-600 hover:bg-purple-500 disabled:opacity-50'
          )}
        >
          {sucesso ? (
            <>
              <Check className="w-4 h-4" />
              Permissões salvas com sucesso!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {salvando ? 'Salvando...' : 'Salvar Permissões'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
